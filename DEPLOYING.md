# Deploying The Docs Site

The docs site lives in `docs/web` and is designed to deploy on Vercel.

## Local Validation

```bash
cd docs/web
npm ci
npm run build
```

## Required Vercel Secrets

GitHub Actions deployment expects these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## GitHub Deployment Flow

The repository includes `.github/workflows/vercel-production.yml`.

On `main` or manual dispatch it will:

1. install dependencies in `docs/web`
2. pull Vercel environment/project settings
3. build the Next.js site
4. deploy the prebuilt output to production
