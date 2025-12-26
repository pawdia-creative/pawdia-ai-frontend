# Environment Variable Setup Guide

This frontend application uses environment variables for configuration. To prevent Cloudflare from mistaking this for a backend application, all API endpoints and keys are now properly configured through environment variables.

## Setup Steps

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables:**

   ### Required Variables
   - `VITE_API_URL`: Your backend API URL (e.g., `https://your-domain.com/api`)
   - `VITE_PAYPAL_CLIENT_ID`: PayPal Client ID for payment processing (required for subscriptions and credit purchases)
   
   ### Optional Variables
   - `VITE_AI_API_KEY`: AI service API key (if using AI features)
   - `VITE_AI_API_BASE_URL`: AI service base URL (defaults to `https://api.apiyi.com/v1`)
   - `VITE_AI_MODEL`: AI model to use (defaults to `gemini-2.5-flash-image`)
   - `VITE_ENV`: Environment setting (defaults to `production`)

3. **For Cloudflare Pages Deployment:**
   
   In your Cloudflare Pages dashboard, add these environment variables:
   - Go to your Pages project → Settings → Environment variables
   - Add `VITE_API_URL` with your production API URL
   - Add `VITE_PAYPAL_CLIENT_ID` with your PayPal Client ID (required for payments)
   - Add `VITE_AI_API_KEY` if using AI features (optional)
   
   **Backend API (Cloudflare Workers) Secrets:**
   - `PAYPAL_CLIENT_ID`: PayPal Client ID (use `npx wrangler secret put PAYPAL_CLIENT_ID`)
   - `PAYPAL_CLIENT_SECRET`: PayPal Client Secret (use `npx wrangler secret put PAYPAL_CLIENT_SECRET`)
   - `PAYPAL_MODE`: PayPal environment mode - `sandbox` for testing, `live` for production

## Important Notes

- **No hardcoded localhost URLs**: All API endpoints now use environment variables or `window.location.origin`
- **No hardcoded API keys**: All API keys are loaded from environment variables
- **Graceful degradation**: If AI API key is not set, AI features will be disabled rather than failing
- **Frontend-only**: This is a pure frontend application with no backend server code

## Local Development

For local development, you can set `VITE_API_URL=http://localhost:3001/api` to point to your local backend server.

## Production Deployment

For production, always use your actual domain URL for `VITE_API_URL` to ensure the frontend can communicate with your backend API.