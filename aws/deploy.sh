#!/bin/bash

# Email Swipe AWS Backend Deployment Script

set -e

# Configuration
STACK_NAME="email-swipe-backend"
ENVIRONMENT="dev"
REGION="us-east-1"

echo "🚀 Deploying Email Swipe Backend to AWS..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "📦 Deploying main backend stack..."

# Deploy the main backend stack
aws cloudformation deploy \
    --template-file backend.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_IAM \
    --region $REGION

echo "✅ Main backend stack deployed successfully!"

# Get the API Gateway ID from the stack outputs
API_GATEWAY_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayId`].OutputValue' \
    --output text)

echo "🔗 API Gateway ID: $API_GATEWAY_ID"

# Get the Lambda function ARNs
STORE_EMAIL_FUNCTION_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`StoreEmailFunctionArn`].OutputValue' \
    --output text)

FETCH_EMAIL_FUNCTION_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FetchEmailFunctionArn`].OutputValue' \
    --output text)

echo "📧 Store Email Function ARN: $STORE_EMAIL_FUNCTION_ARN"
echo "📥 Fetch Email Function ARN: $FETCH_EMAIL_FUNCTION_ARN"

echo "🌐 Deploying API Gateway configuration..."

# Deploy the API Gateway configuration
aws cloudformation deploy \
    --template-file api-gateway.yml \
    --stack-name "${STACK_NAME}-api" \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        EmailApiId=$API_GATEWAY_ID \
        StoreEmailFunctionArn=$STORE_EMAIL_FUNCTION_ARN \
        FetchEmailFunctionArn=$FETCH_EMAIL_FUNCTION_ARN \
    --capabilities CAPABILITY_IAM \
    --region $REGION

echo "✅ API Gateway configuration deployed successfully!"

# Get the final API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-api" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text)

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Stack Name: $STACK_NAME"
echo "   Environment: $ENVIRONMENT"
echo "   Region: $REGION"
echo "   API Endpoint: $API_ENDPOINT"
echo ""
echo "🔗 API Endpoints:"
echo "   Store Emails: POST $API_ENDPOINT/emails"
echo "   Fetch Emails: GET $API_ENDPOINT/emails?userId=<user_id>"
echo ""
echo "📝 Next Steps:"
echo "   1. Update your frontend code to use these API endpoints"
echo "   2. Test the API endpoints with your Gmail data"
echo "   3. Monitor the Lambda functions in AWS Console"
echo ""
