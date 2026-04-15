# AWS Deployment Guide

This project is currently set up for AWS Elastic Beanstalk on Node.js 20.

## Recommended deadline path

With the current sprint timing, the safest path is:

1. Keep Elastic Beanstalk as the runtime platform
2. Store production env vars in Elastic Beanstalk environment properties
3. Use GitHub Actions for CI and a controlled deploy workflow
4. Add HTTPS as the next infrastructure hardening step

This keeps the app live on AWS without forcing a last-minute platform migration.

## Current readiness

- `npm run build` succeeds locally
- `/api/health` returns a healthy JSON response
- Elastic Beanstalk startup is defined in `Procfile`
- A predeploy hook exists in `.platform/hooks/predeploy/01_next_build.sh`
- GitHub Actions workflows are defined under `.github/workflows/`

## Elastic Beanstalk configuration

- Platform: Node.js 20 on Amazon Linux 2023
- Process command: `web: npm run start -- --hostname 0.0.0.0`
- Health check path: `/api/health`

## Required application environment variables

These values belong in Elastic Beanstalk environment properties and should not be committed to GitHub.

- `DATABASE_URL`
- `AUTH_SESSION_SECRET`
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_SITE_URL`
- `SITE_URL`
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
- `BLOB_READ_WRITE_TOKEN`
- `PDF_READ_WRITE_TOKEN`

### Notes on critical values

- `ADMIN_EMAILS` must be a single comma-separated value, for example `admin1@example.com,admin2@example.com`
- `GOOGLE_OAUTH_REDIRECT_URI` must use the deployed site URL, not localhost
- `NEXT_PUBLIC_SITE_URL` and `SITE_URL` should point at the public app domain
- `BLOB_READ_WRITE_TOKEN` is required for project media uploads and reads
- `PDF_READ_WRITE_TOKEN` is required for estimate PDF storage/signing flows
- `QUOTE_TO_EMAIL` controls where quote requests are delivered

## GitHub Actions setup

The repo now includes two workflows:

- `ci.yml`: install, lint, and build on pushes and pull requests
- `deploy-beanstalk.yml`: manually package and deploy the current branch to Elastic Beanstalk

### Repository secrets

Add these in GitHub repository settings -> Secrets and variables -> Actions -> Secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Repository variables

Add these in GitHub repository settings -> Secrets and variables -> Actions -> Variables:

- `AWS_REGION`
- `AWS_EB_APPLICATION_NAME`
- `AWS_EB_ENVIRONMENT_NAME`
- `AWS_EB_S3_BUCKET`

## GitHub deploy workflow process

The deploy workflow does this:

1. Checks out the repo
2. Installs dependencies
3. Runs lint
4. Builds the Next.js production output
5. Creates a deploy zip that includes `.next`
6. Uploads the bundle to S3
7. Creates an Elastic Beanstalk application version
8. Updates the target environment to that version

This avoids depending on a local zip artifact and keeps deployment reproducible from GitHub.

## Manual deployment fallback

If GitHub Actions is not configured yet, you can still deploy manually using the latest prepared bundle:

- `deploy/elastic-beanstalk-redeploy-v6.zip`

Upload that bundle through the Elastic Beanstalk console and verify:

- `/`
- `/projects`
- `/quote`
- `/api/health`
- `/dashboard/invoices`
- `/dashboard/payments`

## HTTPS follow-up

The current site can run over HTTP and still be healthy, but a production-ready setup should add HTTPS.

Recommended next step:

1. Request an ACM certificate
2. Attach it to the Elastic Beanstalk load balancer / listener
3. Redirect HTTP traffic to HTTPS

## Monitoring follow-up

After deployment is stable:

1. Enable enhanced health
2. Create CloudWatch alarms for:
   - high CPU
   - elevated latency
   - 5xx errors
   - unhealthy environment
3. Capture monitoring and load-test evidence for SCRUM-77
