# Sentry Error Monitoring Setup

This document explains how to set up Sentry error monitoring for the Pawdia AI application.

## 1. Create Sentry Project

1. Go to [Sentry.io](https://sentry.io) and create an account
2. Create a new project:
   - Platform: React
   - Project name: pawdia-ai-frontend

## 2. Get Configuration Values

After creating the project, you'll need these values from Sentry:

- **DSN**: Found in Project Settings > Client Keys (DSN)
- **Organization Slug**: Found in the URL or Settings > General Settings
- **Project Slug**: Your project name
- **Auth Token**: Generated in User Settings > Auth Tokens (needs `project:releases` scope)

## 3. Environment Variables

Add these environment variables to your deployment platform:

### For Cloudflare Pages:
```bash
# Production environment variables
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=pawdia-ai-frontend
SENTRY_AUTH_TOKEN=your-auth-token
```

### For Local Development:
Create a `.env.local` file (not committed to git):
```bash
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

## 4. Features Enabled

The Sentry integration includes:

- **Error Tracking**: Automatic capture of JavaScript errors and unhandled promise rejections
- **Performance Monitoring**: Tracks page load times and user interactions
- **Session Replay**: Records user sessions to help debug issues (10% sample rate)
- **Source Maps**: Uploads sourcemaps for better error stack traces in production
- **React Integration**: Enhanced error boundaries and component tracking

## 5. Testing

To test error reporting, you can temporarily add this code to trigger an error:

```javascript
// In browser console or temporarily in code
throw new Error('Test Sentry error');
```

You should see the error appear in your Sentry dashboard within a few minutes.

## 6. Security Notes

- The `VITE_SENTRY_DSN` is exposed to the client (this is normal and secure)
- The `SENTRY_AUTH_TOKEN` should only be set in CI/CD environment, never in client code
- Source maps are only uploaded for production builds
