const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        console.log('Email fetcher Lambda function triggered:', JSON.stringify(event, null, 2));
        
        // For GET requests, extract parameters from queryStringParameters
        let userId, limit, startKey;
        
        if (event.httpMethod === 'GET') {
            // Handle query parameters
            const queryParams = event.queryStringParameters || {};
            userId = queryParams.userId;
            limit = queryParams.limit ? parseInt(queryParams.limit) : 50;
            startKey = queryParams.startKey ? JSON.parse(queryParams.startKey) : undefined;
        } else {
            // Handle POST requests (body)
            const body = JSON.parse(event.body || '{}');
            userId = body.userId;
            limit = body.limit || 50;
            startKey = body.startKey;
        }
        
        if (!userId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'userId is required' })
            };
        }
        
        const params = {
            TableName: 'email-swipe-emails-dev',
            IndexName: 'UserTimestampIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false, // Most recent first
            Limit: parseInt(limit)
        };
        
        if (startKey) {
            params.ExclusiveStartKey = startKey;
        }
        
        const result = await dynamodb.query(params).promise();
        
        const emails = result.Items.map(item => ({
            id: item.messageId,
            subject: item.subject,
            sender: item.sender,
            snippet: item.snippet,
            date: item.date,
            labels: item.labels,
            isRead: item.isRead,
            threadId: item.threadId
        }));
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emails,
                lastEvaluatedKey: result.LastEvaluatedKey
            })
        };
        
    } catch (error) {
        console.error('Error in email fetcher Lambda:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
