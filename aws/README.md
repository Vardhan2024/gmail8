# Email Swipe AWS Backend

This directory contains the AWS infrastructure for the Email Swipe application, including DynamoDB for email storage and Lambda functions for processing.

## 🏗️ Architecture

- **DynamoDB Table**: Stores email data with user-based partitioning
- **Lambda Functions**: 
  - `StoreEmailFunction`: Stores emails in DynamoDB
  - `FetchEmailFunction`: Retrieves emails from DynamoDB
- **API Gateway**: REST API endpoints for Lambda functions
- **IAM Roles**: Proper permissions for Lambda to access DynamoDB

## 📁 Files

- `backend.yml` - Main CloudFormation template for DynamoDB and Lambda
- `api-gateway.yml` - API Gateway configuration
- `deploy.sh` - Deployment script
- `README.md` - This file

## 🚀 Deployment Instructions

### Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   # Install AWS CLI (if not already installed)
   # Windows: Download from https://aws.amazon.com/cli/
   # macOS: brew install awscli
   # Linux: sudo apt-get install awscli
   
   # Configure AWS credentials
   aws configure
   ```

2. **AWS Account with appropriate permissions**
   - CloudFormation permissions
   - Lambda permissions
   - DynamoDB permissions
   - API Gateway permissions
   - IAM permissions

### Step 1: Deploy the Backend

1. **Navigate to the AWS directory:**
   ```bash
   cd aws
   ```

2. **Make the deployment script executable:**
   ```bash
   chmod +x deploy.sh
   ```

3. **Run the deployment:**
   ```bash
   ./deploy.sh
   ```

   This will:
   - Create the DynamoDB table
   - Deploy Lambda functions
   - Set up API Gateway
   - Configure IAM roles and permissions

### Step 2: Update Frontend Configuration

After deployment, you'll get an API endpoint URL. Update your frontend:

1. **Set the API endpoint in your environment:**
   ```bash
   # Create .env file in your project root
   echo "REACT_APP_AWS_API_ENDPOINT=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev" > .env
   ```

2. **Or update the service directly:**
   ```typescript
   // In src/services/awsApi.ts
   awsApiService.setApiEndpoint('https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev');
   ```

## 🔗 API Endpoints

### Store Emails
- **Method**: POST
- **URL**: `{API_ENDPOINT}/emails`
- **Body**:
  ```json
  {
    "userId": "user123",
    "emails": [
      {
        "id": "email_id",
        "subject": "Email Subject",
        "sender": "sender@example.com",
        "snippet": "Email snippet...",
        "date": "2024-01-01T00:00:00Z",
        "labels": ["INBOX"],
        "isRead": false,
        "threadId": "thread_id"
      }
    ]
  }
  ```

### Fetch Emails
- **Method**: GET
- **URL**: `{API_ENDPOINT}/emails?userId=user123&limit=50`
- **Parameters**:
  - `userId` (required): User identifier
  - `limit` (optional): Number of emails to fetch (default: 50)
  - `startKey` (optional): Pagination token

## 📊 DynamoDB Schema

### Table: `email-swipe-emails-{environment}`

| Attribute | Type | Description |
|-----------|------|-------------|
| userId | String | Partition key - User identifier |
| messageId | String | Sort key - Gmail message ID |
| timestamp | Number | When the email was stored |
| subject | String | Email subject |
| sender | String | Sender email address |
| snippet | String | Email preview text |
| date | String | Email date |
| labels | List | Gmail labels |
| isRead | Boolean | Read status |
| threadId | String | Gmail thread ID |

### Global Secondary Index: `UserTimestampIndex`
- **Partition Key**: userId
- **Sort Key**: timestamp
- **Purpose**: Efficient querying by user and time

## 🔧 Integration with Frontend

### 1. Import the AWS API Service
```typescript
import { awsApiService } from '../services/awsApi';
```

### 2. Store Gmail Emails
```typescript
// After fetching emails from Gmail API
const gmailMessages = await fetchGmailMessages(accessToken);
await awsApiService.storeGmailEmails(userId, gmailMessages);
```

### 3. Fetch Stored Emails
```typescript
// Get emails from DynamoDB
const response = await awsApiService.fetchEmails(userId, 50);
const emails = response.emails;
```

## 🧪 Testing

### Test API Endpoints

1. **Store Emails:**
   ```bash
   curl -X POST https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/emails \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "test-user",
       "emails": [{
         "id": "test-email-1",
         "subject": "Test Email",
         "sender": "test@example.com",
         "snippet": "This is a test email",
         "date": "2024-01-01T00:00:00Z",
         "labels": ["INBOX"],
         "isRead": false,
         "threadId": "test-thread"
       }]
     }'
   ```

2. **Fetch Emails:**
   ```bash
   curl "https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/emails?userId=test-user&limit=10"
   ```

## 🗑️ Cleanup

To remove all AWS resources:

```bash
# Delete API Gateway stack
aws cloudformation delete-stack --stack-name email-swipe-backend-api

# Delete main backend stack
aws cloudformation delete-stack --stack-name email-swipe-backend
```

## 📈 Monitoring

### CloudWatch Logs
- Lambda function logs are automatically sent to CloudWatch
- View logs in AWS Console → CloudWatch → Log Groups

### DynamoDB Metrics
- Monitor table performance in AWS Console → DynamoDB → Tables

### API Gateway Metrics
- Track API usage in AWS Console → API Gateway → APIs

## 🔒 Security

- Lambda functions have minimal required permissions
- API Gateway has no authentication (add as needed)
- DynamoDB uses IAM roles for access control
- All resources are environment-specific

## 🚨 Troubleshooting

### Common Issues

1. **Deployment fails with IAM errors**
   - Ensure your AWS user has IAM permissions
   - Check that you're using the correct AWS region

2. **Lambda function times out**
   - Increase timeout in CloudFormation template
   - Check DynamoDB table performance

3. **API Gateway returns 500 errors**
   - Check CloudWatch logs for Lambda errors
   - Verify Lambda function permissions

4. **CORS issues**
   - Add CORS configuration to API Gateway if needed

### Debug Commands

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name email-swipe-backend

# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/email-swipe"

# Test Lambda function directly
aws lambda invoke --function-name email-swipe-store-email-dev --payload '{"body":"{\"userId\":\"test\",\"emails\":[]}"}' response.json
```

## 📝 Next Steps

1. **Add Authentication**: Implement JWT or AWS Cognito
2. **Add CORS**: Configure API Gateway for web access
3. **Add Error Handling**: Improve error responses
4. **Add Caching**: Implement DynamoDB DAX or ElastiCache
5. **Add Monitoring**: Set up CloudWatch alarms
6. **Add Backup**: Configure DynamoDB point-in-time recovery
