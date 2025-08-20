@echo off
echo 🚀 Deploying Email Swipe Backend to AWS...

echo 📦 Deploying main backend stack...
aws cloudformation deploy --template-file backend.yml --stack-name email-swipe-backend --parameter-overrides Environment=dev --capabilities CAPABILITY_IAM --region us-east-1

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Main backend stack deployment failed
    pause
    exit /b 1
)

echo ✅ Main backend stack deployed successfully!

echo 🔗 Getting API Gateway ID...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name email-swipe-backend --region us-east-1 --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayId'].OutputValue" --output text') do set API_GATEWAY_ID=%%i

echo 📧 Getting Lambda function ARNs...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name email-swipe-backend --region us-east-1 --query "Stacks[0].Outputs[?OutputKey=='StoreEmailFunctionArn'].OutputValue" --output text') do set STORE_EMAIL_FUNCTION_ARN=%%i

for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name email-swipe-backend --region us-east-1 --query "Stacks[0].Outputs[?OutputKey=='FetchEmailFunctionArn'].OutputValue" --output text') do set FETCH_EMAIL_FUNCTION_ARN=%%i

echo 🌐 Deploying API Gateway configuration...
aws cloudformation deploy --template-file api-gateway.yml --stack-name email-swipe-backend-api --parameter-overrides Environment=dev EmailApiId=%API_GATEWAY_ID% StoreEmailFunctionArn=%STORE_EMAIL_FUNCTION_ARN% FetchEmailFunctionArn=%FETCH_EMAIL_FUNCTION_ARN% --capabilities CAPABILITY_IAM --region us-east-1

if %ERRORLEVEL% NEQ 0 (
    echo ❌ API Gateway deployment failed
    pause
    exit /b 1
)

echo ✅ API Gateway configuration deployed successfully!

echo 🎉 Deployment completed successfully!
echo.
echo 📋 Deployment Summary:
echo    Stack Name: email-swipe-backend
echo    Environment: dev
echo    Region: us-east-1
echo.
echo 🔗 API Endpoints:
echo    Store Emails: POST https://%API_GATEWAY_ID%.execute-api.us-east-1.amazonaws.com/dev/emails
echo    Fetch Emails: GET https://%API_GATEWAY_ID%.execute-api.us-east-1.amazonaws.com/dev/emails?userId=<user_id>
echo.
echo 📝 Next Steps:
echo    1. Update your frontend code to use these API endpoints
echo    2. Test the API endpoints with your Gmail data
echo    3. Monitor the Lambda functions in AWS Console
echo.
pause
