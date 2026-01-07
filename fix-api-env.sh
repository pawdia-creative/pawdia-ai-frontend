#!/bin/bash

# Fix Pawdia AI API Environment Variables
echo "🔧 Setting up Pawdia AI API environment variables..."

# Check if we're in the right directory
if [ ! -d "api" ]; then
    echo "❌ Error: api/ directory not found. Please run this script from the project root."
    exit 1
fi

# Navigate to API directory
echo "📁 Navigating to api/ directory..."
cd api

# Verify we have wrangler.toml
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found in api/ directory"
    exit 1
fi

echo "✅ Found wrangler.toml, proceeding..."

# Set JWT Secret (REQUIRED)
echo "🔐 Setting JWT_SECRET..."
echo "mRhMX7dVSRpGKSvi0SYQLY4/OvQPWMt8irQB10TFWoM=" | npx wrangler secret put JWT_SECRET

# Check if JWT_SECRET was set successfully
if [ $? -eq 0 ]; then
    echo "✅ JWT_SECRET set successfully"
else
    echo "❌ Failed to set JWT_SECRET"
    exit 1
fi

# Set Email API Keys (OPTIONAL but recommended)
echo "📧 Setting email API keys..."
echo "Note: Uncomment the lines below if you have API keys"
# echo "your-resend-api-key" | npx wrangler secret put RESEND_API_KEY
# echo "your-sendgrid-api-key" | npx wrangler secret put SENDGRID_API_KEY

# Set PayPal credentials (OPTIONAL)
echo "💳 Setting PayPal credentials..."
echo "Note: Uncomment the lines below if you have PayPal credentials"
# echo "your-paypal-client-id" | npx wrangler secret put PAYPAL_CLIENT_ID
# echo "your-paypal-client-secret" | npx wrangler secret put PAYPAL_CLIENT_SECRET

echo "✅ Environment variables setup complete!"
echo "🔄 Redeploying Worker..."

# Deploy the Worker
npx wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ Worker deployed successfully!"
else
    echo "❌ Failed to deploy Worker"
    exit 1
fi

echo "🎉 API should now be working!"
echo "🧪 Test with:"
echo "cd .. && node test-api-debug.js"
