# Workload Identity Federation Setup Guide

This guide documents how to configure **keyless authentication** between GitHub Actions and Google Cloud / Firebase using **Workload Identity Federation (WIF)**.

With WIF, GitHub Actions uses short-lived, auto-rotating OIDC tokens instead of a static service account key — no secrets to leak or rotate.

---

## Prerequisites

- A Google Cloud / Firebase project (this project: `mycircle-dash`, project number `441498720264`)
- A GitHub repository with GitHub Actions workflows
- `gcloud` CLI installed (optional — all steps can be done via the Console)

---

## Step 1 — Enable the IAM Credentials API

**Console link:** https://console.cloud.google.com/apis/library/iamcredentials.googleapis.com?project=mycircle-dash

1. Open the link above
2. Click **Enable**

This API allows GitHub Actions to exchange OIDC tokens for Google Cloud credentials.

---

## Step 2 — Create a Workload Identity Pool

**Console link:** https://console.cloud.google.com/iam-admin/workload-identity-pools?project=mycircle-dash

1. Click **Create Pool**
2. Fill in:
   - **Name:** `github-actions`
   - **Description:** (optional) "Pool for GitHub Actions CI/CD"
3. Keep **Status** as **Enabled**
4. Click **Continue**

---

## Step 3 — Add an OIDC Provider to the Pool

On the "Add a provider to pool" screen:

| Field | Value |
|-------|-------|
| **Select a provider** | OpenID Connect (OIDC) |
| **Provider name** | `github` |
| **Issuer (URL)** | `https://token.actions.githubusercontent.com` |
| **JWK file** | Leave empty (fetched from issuer automatically) |
| **Audiences** | Select **Default audience** |

Click **Continue**.

---

## Step 4 — Configure Attribute Mapping

On the "Configure provider attributes" screen, add two mappings:

| Google attribute | OIDC claim |
|------------------|------------|
| `google.subject` | `assertion.sub` |
| `attribute.repository` | `assertion.repository` |

The first mapping (`google.subject`) is usually pre-filled. Click **Add Mapping** to add the second one.

### Attribute Condition (optional but recommended)

In the **Condition** field (CEL expression), restrict access to your specific repo:

```
assertion.repository == "YourGitHubUsername/MyCircle"
```

> **Important:** Use `assertion.repository`, NOT `attribute.repository` in the condition. Using `attribute.*` will cause a save error.

Click **Save**.

---

## Step 5 — Grant Service Account Impersonation

**Console link:** https://console.cloud.google.com/iam-admin/workload-identity-pools/pool/github-actions?project=mycircle-dash

1. On the pool details page, click **Grant Access** (top right)
2. Select **Grant access using service account impersonation**
3. **Select service account:** `firebase-adminsdk-fbsvc@mycircle-dash.iam.gserviceaccount.com`
4. Under **Select principals (identities that can access the service account):**
   - Choose **repository** from the dropdown
   - Enter `YourGitHubUsername/MyCircle` as the attribute value
5. Click **Save**
6. A "Configure your application" dialog will appear — click **Dismiss** (not needed for GitHub Actions)

---

## Step 6 — Find Your Project Number

**Console link:** https://console.cloud.google.com/welcome?project=mycircle-dash

The **project number** is shown on the dashboard (e.g., `441498720264`). This is different from the project ID (`mycircle-dash`).

You'll need it to construct the Workload Identity Provider path:

```
projects/441498720264/locations/global/workloadIdentityPools/github-actions/providers/github
```

---

## Step 7 — Update the GitHub Actions Workflow

Update `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write    # Required for OIDC token request

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm firebase:build

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/441498720264/locations/global/workloadIdentityPools/github-actions/providers/github'
          service_account: 'firebase-adminsdk-fbsvc@mycircle-dash.iam.gserviceaccount.com'

      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          channelId: live
          projectId: mycircle-dash
```

Key changes from the old key-based approach:
- **`permissions.id-token: write`** — lets GitHub Actions request an OIDC token
- **`google-github-actions/auth@v2`** — exchanges the OIDC token for Google Cloud credentials
- **Removed `firebaseServiceAccount`** — no longer needed

---

## Step 8 — Clean Up the Old Secret

Once the deploy workflow succeeds with WIF:

1. Go to **GitHub repo → Settings → Secrets and variables → Actions**
   → `https://github.com/YourGitHubUsername/MyCircle/settings/secrets/actions`
2. Delete the `FIREBASE_SERVICE_ACCOUNT` secret
3. Revoke the old service account key in Google Cloud Console:
   → https://console.cloud.google.com/iam-admin/serviceaccounts?project=mycircle-dash
   - Click the service account → **Keys** tab → delete the old JSON key

---

## Troubleshooting

### "Permission denied" or 403 on deploy

- Verify the service account has the **Firebase Hosting Admin** role
- Check that the attribute condition in the provider matches your repo name exactly
- Ensure `permissions.id-token: write` is set in the workflow

### "Unable to get OIDC token"

- Ensure `id-token: write` permission is set at the job or workflow level
- For private repos, ensure GitHub Actions is enabled under **Settings → Actions → General**

### "Attribute condition must reference provider's claims"

- Use `assertion.repository` (not `attribute.repository`) in condition expressions
- Condition must reference raw OIDC token claims prefixed with `assertion.`

---

## Comparison: Service Account Key vs. Workload Identity Federation

| Aspect | Service Account Key | Workload Identity Federation |
|--------|---------------------|------------------------------|
| Credential lifetime | Permanent until manually revoked | Short-lived, auto-expires |
| Key rotation | Manual | Automatic |
| Leak risk | Key file can be exfiltrated | No key exists to leak |
| Access scope | Anyone with the key | Only specified repo's Actions |
| Setup complexity | Lower | Slightly higher (one-time) |
| Recommended by Google | No | Yes |

---

## Reference Links

| Resource | URL |
|----------|-----|
| google-github-actions/auth | https://github.com/google-github-actions/auth |
| Google Cloud WIF with GitHub | https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines#github-actions |
| Firebase Hosting deploy action | https://github.com/FirebaseExtended/action-hosting-deploy |
| GitHub OIDC docs | https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect |
| IAM Credentials API | https://cloud.google.com/iam/docs/reference/credentials/rest |
