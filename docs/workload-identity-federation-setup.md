# Workload Identity Federation Setup Guide

This guide documents how to configure **keyless authentication** between GitHub Actions and Google Cloud / Firebase using **Workload Identity Federation (WIF)**.

With WIF, GitHub Actions uses short-lived, auto-rotating OIDC tokens instead of a static service account key — no secrets to leak or rotate.

---

## Prerequisites

- A Google Cloud / Firebase project (this project: `mycircle-dash`, project number `441498720264`)
- A GitHub repository with GitHub Actions workflows
- `gcloud` CLI installed (optional — all steps can be done via the Console)

---

## Step 1 — Enable Required APIs

Enable the following APIs in the Google Cloud Console (or via `gcloud services enable`):

| API | Console Link | Purpose |
|-----|-------------|---------|
| IAM Credentials | [Enable](https://console.cloud.google.com/apis/library/iamcredentials.googleapis.com?project=mycircle-dash) | OIDC token exchange for WIF |
| Cloud Billing | [Enable](https://console.cloud.google.com/apis/library/cloudbilling.googleapis.com?project=mycircle-dash) | Firebase CLI checks project billing info during deploy |

```bash
gcloud services enable iamcredentials.googleapis.com --project=mycircle-dash
gcloud services enable cloudbilling.googleapis.com --project=mycircle-dash
```

> **Note:** Other APIs (Firestore, Cloud Functions, Artifact Registry, Secret Manager, etc.) are typically enabled automatically by Firebase. The two above often need manual enabling.

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

## Step 9 — Create Cloud Functions Secrets in Secret Manager

Cloud Functions that declare `secrets: [...]` require the secrets to exist in **Google Cloud Secret Manager** (not Firebase Runtime Config).

**Console link:** https://console.cloud.google.com/security/secret-manager?project=mycircle-dash

### Required secrets for this project

| Secret Name | Used By |
|-------------|---------|
| `OPENWEATHER_API_KEY` | graphql, checkWeatherAlerts, aiChat |
| `FINNHUB_API_KEY` | graphql, stockProxy, aiChat |
| `PODCASTINDEX_API_KEY` | graphql, podcastProxy |
| `PODCASTINDEX_API_SECRET` | graphql, podcastProxy |
| `GEMINI_API_KEY` | aiChat |
| `RECAPTCHA_SECRET_KEY` | aiChat |

### Creating secrets via gcloud CLI

```bash
# For each secret, create it and set the value:
echo -n "your-api-key-value" | \
  gcloud secrets create SECRET_NAME \
    --project=mycircle-dash \
    --replication-policy="automatic" \
    --data-file=-

# To update an existing secret with a new value:
echo -n "new-value" | \
  gcloud secrets versions add SECRET_NAME \
    --project=mycircle-dash \
    --data-file=-

# To verify all secrets exist:
gcloud secrets list --project=mycircle-dash
```

> **Note:** The Firebase CLI validates that all declared secrets exist *before* deploying. If any secret is missing from Secret Manager, the deploy will fail with a 403 or "not exist" error.

---

## Required IAM Roles for the Service Account

The WIF service account (`firebase-adminsdk-fbsvc@mycircle-dash.iam.gserviceaccount.com`) needs the following **project-level** IAM roles to run `firebase deploy` (Hosting + Cloud Functions + Firestore rules/indexes).

**Console link:** https://console.cloud.google.com/iam-admin/iam?project=mycircle-dash

| Role | Purpose |
|------|---------|
| Firebase Admin SDK Administrator Service Agent | Auto-managed by Google — Firebase internals |
| Firebase A/B Testing Admin (Beta) | Manage A/B testing experiments |
| Firebase App Check Admin | Manage App Check configuration |
| Firebase Authentication Admin | Manage Firebase Auth |
| Firebase Remote Config Admin | Manage Remote Config |
| **Firebase Hosting Admin** | Deploy to Firebase Hosting |
| Service Account Token Creator | Create OAuth2 tokens for other SAs |
| **Service Account User** | `actAs` the App Engine default SA (`mycircle-dash@appspot.gserviceaccount.com`) when deploying Cloud Functions |
| **Cloud Functions Developer** | Create, update, and delete Cloud Functions |
| **Artifact Registry Writer** | Store function container images (required for gen2 functions) |
| **Firebase Admin** | Deploy Firestore rules, manage Firebase resources broadly (covers Hosting, rules, etc.) |
| **Cloud Datastore Owner** | Deploy Firestore security rules and indexes |
| **Service Usage Consumer** | Check which APIs are enabled (Firebase CLI preflight check) |
| **Secret Manager Viewer** | Validate Cloud Functions secrets exist during deploy (`versions.get` metadata) |
| **Secret Manager Secret Accessor** | Read secret values at runtime (`versions.access` payload) |
| **Cloud Scheduler Admin** | Create/update scheduled function jobs (e.g., `checkWeatherAlerts` every 30 min) |

> **Important:** The **Service Account User** role must be granted at the **project level** (in the IAM page), not on a specific service account resource. A project-level grant allows `actAs` on *all* service accounts in the project, including the App Engine default SA that Cloud Functions run as.

### Adding roles via gcloud CLI

```bash
SA="firebase-adminsdk-fbsvc@mycircle-dash.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/cloudfunctions.developer"

gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/firebasehosting.admin"

gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/datastore.owner"

gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/serviceusage.serviceUsageConsumer"

gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/secretmanager.viewer"

gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/cloudscheduler.admin"
```

> **Note:** `roles/firebase.admin` is a broad role that covers Firestore rules deployment, Hosting, and other Firebase services. It overlaps with some individual Firebase roles listed above, but prevents piecemeal 403 errors from the Firebase Rules API and other Firebase-specific endpoints.

### Verifying roles via gcloud CLI

```bash
gcloud projects get-iam-policy mycircle-dash \
  --flatten="bindings[].members" \
  --filter="bindings.members:firebase-adminsdk-fbsvc@mycircle-dash.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

> **Note:** IAM changes can take up to 7 minutes to propagate. If you just added a role and the deploy still fails, wait and retry.

---

## Troubleshooting

### "Missing permissions — iam.serviceAccounts.ActAs"

```
Error: You must have permission iam.serviceAccounts.ActAs on service account
mycircle-dash@appspot.gserviceaccount.com.
```

- The deploying SA needs **Service Account User** (`roles/iam.serviceAccountUser`) at the **project level**
- This grants `actAs` on the App Engine default SA that Cloud Functions run as
- Verify the role is on the **project IAM page** (not just on the SA's own permissions tab)
- If recently added, wait up to 7 minutes for propagation and retry

### "403 — Caller does not have required permission to use project" (Service Usage)

```
Error: Request to serviceusage.googleapis.com ... had HTTP Error: 403,
Grant the caller the roles/serviceusage.serviceUsageConsumer role
```

- The Firebase CLI checks whether required APIs (Firestore, Cloud Functions, etc.) are enabled before deploying
- The SA needs **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`) at the project level
- This is a read-only role — it only allows checking API status, not enabling/disabling APIs

### "403 — The caller does not have permission" on firebaserules.googleapis.com

```
Error: Request to firebaserules.googleapis.com/v1/projects/mycircle-dash:test
had HTTP Error: 403, The caller does not have permission
```

- The Firebase CLI validates Firestore rules via the **Firebase Rules API** before deploying
- This requires the **Firebase Admin** role (`roles/firebase.admin`), which covers rules compilation and deployment
- `Cloud Datastore Owner` alone is not sufficient — it covers Firestore data/indexes but not the Rules API

### "403 — secretmanager.versions.get denied" on deploy

```
Error: Failed to validate secret versions:
Permission 'secretmanager.versions.get' denied for resource
'projects/mycircle-dash/secrets/SOME_SECRET/versions/latest'
```

- Cloud Functions that declare `secrets: [...]` trigger a preflight validation during deploy
- The deploy-time check uses `versions.get` (metadata) — requires **Secret Manager Viewer** (`roles/secretmanager.viewer`)
- The runtime read uses `versions.access` (payload) — requires **Secret Manager Secret Accessor** (`roles/secretmanager.secretAccessor`)
- You need **both** roles — `secretAccessor` alone is not enough for the deploy validation
- Also verify the secrets actually exist in Secret Manager (`gcloud secrets list`) — the error says "(or it may not exist)"

### "403 — cloudscheduler.jobs.update denied" on deploy

```
Error: The principal lacks IAM permission "cloudscheduler.jobs.update"
for the resource "projects/mycircle-dash/locations/us-central1/jobs/firebase-schedule-..."
```

- Scheduled Cloud Functions (e.g., `checkWeatherAlerts`) are backed by Cloud Scheduler jobs
- The deploying SA needs **Cloud Scheduler Admin** (`roles/cloudscheduler.admin`) to create/update these jobs
- Only affects functions that use `onSchedule()` — HTTP and callable functions deploy without this role

### "403 — Cloud Billing API has not been used" or is disabled

```
Error: Request to cloudbilling.googleapis.com ... had HTTP Error: 403,
Cloud Billing API has not been used in project ... or it is disabled.
```

- The Cloud Billing API must be **enabled** on the project (this is an API toggle, not a role)
- Enabling the API is free — it only allows the Firebase CLI to read billing status
- Enable it: `gcloud services enable cloudbilling.googleapis.com --project=mycircle-dash`

### "Permission denied" or 403 on deploy

- Verify the service account has the **Firebase Hosting Admin** role
- Verify the service account has the **Cloud Functions Developer** role
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
