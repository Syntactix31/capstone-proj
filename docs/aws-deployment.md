# AWS Deployment Plan

This app is prepared to deploy to AWS Elastic Beanstalk as a Node.js web application.

## Current readiness

- Production build passes with `npm run build`
- Health check endpoint exists at `/api/health`
- Required environment variables are documented in `.env.example`
- Deployment packaging exclusions are defined in `.ebignore`

## Recommended target

- Service: Elastic Beanstalk
- Platform: Node.js 20 on Amazon Linux 2023
- Health check path: `/api/health`

## First deployment checklist

1. Create an Elastic Beanstalk application
2. Create a web server environment
3. Choose the Node.js platform
4. Upload the repository source bundle
5. Configure environment variables from `.env.example`
6. Deploy the environment
7. Verify:
   - `/`
   - `/projects`
   - `/quote`
   - `/dashboard/invoices`
   - `/dashboard/payments`
   - `/api/health`

## Required environment variables

Copy these into Elastic Beanstalk environment properties:

- `DATABASE_URL`
- `AUTH_SESSION_SECRET`
- `ADMIN_EMAILS`
- `OWNER_EMAIL`
- `GMAIL_APP_PASSWORD`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `QUOTE_TO_EMAIL`
- `SERP_API_KEY`

## Monitoring and scalability follow-up

After first deployment:

1. Enable Elastic Beanstalk enhanced health
2. Create a CloudWatch dashboard for:
   - CPU
   - latency
   - request count
   - 4xx/5xx errors
   - environment health
3. Configure auto scaling:
   - minimum instances: 1
   - maximum instances: 2 or 3
4. Add CloudWatch alarms for:
   - high CPU
   - elevated latency
   - unhealthy environment
   - 5xx spike
5. Run a load test and capture screenshots/results for Jira

## Notes

- This deployment plan keeps existing external integrations in place.
- Neon, Google APIs, Gmail, and Resend remain external services.
- The goal of this sprint is cloud hosting and monitoring, not re-platforming every dependency.
