# Docker Deployment Guide — Synology DS1525+ NAS

Self-host MyCircle on a Synology NAS (or any Docker host) with automatic HTTPS via Caddy.

## Architecture

```
Internet → [Router :443] → Caddy (auto-HTTPS) → mycircle-app (Node.js :3000)
                                                   ├─ /graphql      → Apollo Server
                                                   ├─ /ai/chat      → Gemini AI proxy
                                                   ├─ /stock/**     → Finnhub proxy
                                                   ├─ /podcast/**   → PodcastIndex proxy
                                                   ├─ /health       → Health check
                                                   └─ /*            → Static files (SPA)
```

Firebase client SDKs (Auth, Firestore, FCM) still talk directly to Google's cloud. Only hosting and API backends are self-hosted.

## Prerequisites

1. **Domain name** pointing to your NAS's public IP (e.g., `mycircle.yourdomain.com`)
2. **Port forwarding** on your router: ports 80 and 443 → NAS IP
3. **Docker** installed on the NAS (Container Manager on DSM 7.2+)
4. **SSH access** to the NAS (Control Panel → Terminal & SNMP → Enable SSH)
5. **API keys** (same ones used for Firebase deployment)

## Quick Start

### 1. SSH into your NAS

```bash
ssh your-user@nas-ip
```

### 2. Authenticate with GHCR

Create a GitHub Personal Access Token (PAT) with `read:packages` scope, then:

```bash
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 3. Set up the deployment directory

```bash
mkdir -p ~/mycircle && cd ~/mycircle

# Download deployment files
curl -LO https://raw.githubusercontent.com/FishGit2020/MyCircle/main/deploy/docker/docker-compose.yml
curl -LO https://raw.githubusercontent.com/FishGit2020/MyCircle/main/deploy/docker/Caddyfile
curl -LO https://raw.githubusercontent.com/FishGit2020/MyCircle/main/deploy/docker/.env.example
```

### 4. Configure

```bash
# Create .env from template
cp .env.example .env
nano .env   # Fill in your API keys

# Update domain in Caddyfile
nano Caddyfile   # Replace mycircle.example.com with your domain
```

### 5. Deploy

```bash
docker compose pull
docker compose up -d
```

### 6. Add domain to Firebase authorized domains

In [Firebase Console](https://console.firebase.google.com):
1. Go to **Authentication → Settings → Authorized domains**
2. Add your NAS domain (e.g., `mycircle.yourdomain.com`)

This allows Firebase Auth (Google Sign-in) to work from the self-hosted domain.

### 7. Verify

```bash
# Check health
curl https://mycircle.yourdomain.com/health
# Expected: {"status":"ok","timestamp":"..."}

# Check container status
docker compose ps

# View logs
docker compose logs -f app
```

## Updating

When a new version is pushed to `main`, the GitHub Actions workflow builds and pushes a new image to GHCR.

```bash
cd ~/mycircle
docker compose pull
docker compose up -d
```

Old images are cleaned up automatically by Docker's garbage collection. To reclaim disk space immediately:

```bash
docker image prune -f
```

## Monitoring

```bash
# Live logs
docker compose logs -f

# Container resource usage
docker stats mycircle-app mycircle-caddy

# Health check
curl -s http://localhost:3000/health | python3 -m json.tool
```

## Optional: Watchtower (Auto-Updates)

[Watchtower](https://containrrr.dev/watchtower/) can poll GHCR and automatically restart containers when a new image is available.

Add to `docker-compose.yml`:

```yaml
  watchtower:
    image: containrrr/watchtower
    container_name: mycircle-watchtower
    restart: unless-stopped
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=300  # Check every 5 minutes
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ~/.docker/config.json:/config.json:ro  # GHCR credentials
```

## Optional: Cloudflare Tunnel (No Port Forwarding)

If you can't open ports 80/443 on your router, use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) instead:

1. Remove the `caddy` service from `docker-compose.yml`
2. Expose port 3000 directly on the `app` service: `ports: ["3000:3000"]`
3. Install `cloudflared` on the NAS and create a tunnel pointing to `http://localhost:3000`

Cloudflare handles HTTPS termination, DDoS protection, and DNS automatically.

## Troubleshooting

### "unauthorized" when pulling from GHCR
- Re-authenticate: `docker login ghcr.io`
- Ensure your PAT has `read:packages` scope
- Ensure the GHCR package is not private, or your GitHub account has access

### Caddy fails to get certificate
- Verify your domain's DNS A record points to your public IP
- Ensure ports 80 and 443 are forwarded through your router
- Check Caddy logs: `docker compose logs caddy`

### Firebase Auth "unauthorized domain" error
- Add your NAS domain to Firebase Console → Authentication → Authorized domains

### Container keeps restarting
- Check logs: `docker compose logs app`
- Verify `.env` file has all required keys
- Ensure `dist/firebase/` was built correctly (image may be corrupted — try `docker compose pull` again)

## Local Development Build (Optional)

To build the image locally instead of pulling from GHCR:

```bash
# From the repo root — secrets are passed via BuildKit secret mounts
# (not --build-arg) so they never appear in docker history.
# Set the VITE_* env vars in your shell first, then:
docker buildx build \
  --file deploy/docker/Dockerfile \
  --secret id=VITE_FIREBASE_API_KEY,env=VITE_FIREBASE_API_KEY \
  --secret id=VITE_FIREBASE_AUTH_DOMAIN,env=VITE_FIREBASE_AUTH_DOMAIN \
  --secret id=VITE_FIREBASE_PROJECT_ID,env=VITE_FIREBASE_PROJECT_ID \
  --secret id=VITE_FIREBASE_STORAGE_BUCKET,env=VITE_FIREBASE_STORAGE_BUCKET \
  --secret id=VITE_FIREBASE_MESSAGING_SENDER_ID,env=VITE_FIREBASE_MESSAGING_SENDER_ID \
  --secret id=VITE_FIREBASE_APP_ID,env=VITE_FIREBASE_APP_ID \
  --secret id=VITE_FIREBASE_MEASUREMENT_ID,env=VITE_FIREBASE_MEASUREMENT_ID \
  --secret id=VITE_FIREBASE_VAPID_KEY,env=VITE_FIREBASE_VAPID_KEY \
  -t mycircle:local .

docker compose -f deploy/docker/docker-compose.yml up -d
```

Uncomment the `build` section in `docker-compose.yml` and comment out the `image` line.
