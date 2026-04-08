# NAS Setup Guide (Synology WebDAV)

MyCircle can offload audio files to a Synology NAS via WebDAV. This doc covers the full setup including the router port forwarding requirement.

---

## How it works

```
Firebase Cloud Function (internet)
    │
    │  WebDAV PUT/PROPFIND over HTTPS
    ▼
Router (public IP / DDNS)
    │
    │  Port forwarding → NAS local IP
    ▼
Synology NAS — WebDAV Server
    │
    │  Stores files in /MyCircle/...
    ▼
Synology volume
```

The Cloud Function runs on Google's servers (not your local network), so your NAS **must be reachable from the public internet**.

---

## Prerequisites

- Synology NAS with DSM 7+
- A DDNS hostname pointing to your home IP (e.g. `huangs2022.synology.me`)
- Router access to configure port forwarding

---

## Step 1: Install WebDAV Server on Synology

1. Open **DSM** > **Package Center**
2. Search for **WebDAV Server** and install it
3. Open **WebDAV Server** > enable **HTTPS**
4. Note the HTTPS port (default `5006`, change if needed)

---

## Step 2: Create a dedicated user

1. **DSM** > **Control Panel** > **User & Group** > **Create**
2. Username: `mycircle-nas` (or any name)
3. Set a strong password
4. Grant **Read/Write** permission to the shared folder you want to use (e.g. `homes` or a dedicated share)

---

## Step 3: Create the destination folder

1. Open **File Station**
2. Create a folder named `MyCircle` (or your preferred name) in the shared folder
3. Ensure `mycircle-nas` has read/write access to it

---

## Step 4: Port forwarding on your router (REQUIRED)

> **This step is mandatory.** Firebase Cloud Functions run on Google's servers and connect to your NAS over the public internet. Without port forwarding, the connection will time out.

1. Log in to your router admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Find **Port Forwarding** (sometimes under NAT, Virtual Server, or Firewall)
3. Add a rule:
   - **External port**: your WebDAV HTTPS port (e.g. `58443`)
   - **Internal IP**: your Synology NAS's local IP (e.g. `192.168.1.100`)
   - **Internal port**: same port (e.g. `58443`)
   - **Protocol**: TCP

4. Save and apply

**To find your NAS's local IP**: DSM > Control Panel > Network > Network Interface

**Verify port forwarding is working** from outside your network:
```bash
curl -si -X PROPFIND "https://YOUR-DDNS:PORT/MyCircle" \
  -H "Depth: 0" \
  --user "mycircle-nas:YOUR_PASSWORD" --max-time 10
# Should return HTTP 207 Multi-Status
```

---

## Step 5: Configure in MyCircle

1. Go to **Settings > NAS Connection**
2. Fill in:
   - **NAS URL**: `https://huangs2022.synology.me:58443` (your DDNS + WebDAV port)
   - **Username**: `mycircle-nas`
   - **Password**: your password
   - **Destination folder**: `/MyCircle`
3. Click **Save & Test** — status should change to `connected`

---

## Troubleshooting

### Status: error (timeout)
**Cause**: Port forwarding not configured or router firewall blocking the port.
**Fix**: Complete Step 4. Verify with curl from a non-home network (e.g. mobile hotspot).

### Status: error (HTTP 401)
**Cause**: Wrong username or password.
**Fix**: Re-enter credentials in Settings > NAS Connection.

### Status: error (HTTP 404)
**Cause**: Destination folder `/MyCircle` doesn't exist on the NAS.
**Fix**: Create the folder in File Station (Step 3).

### Status: error (SSL/certificate error)
**Cause**: Synology's self-signed certificate is being rejected.
**Fix**: Either install a valid certificate on the NAS (DSM > Security > Certificate — use Let's Encrypt), or temporarily test with `--insecure` in curl to confirm it's a cert issue.

### Works locally but not remotely
**Cause**: Testing with curl from your home network bypasses the router — port forwarding may still be broken.
**Fix**: Test from a mobile hotspot or a remote machine to simulate what the Cloud Function sees.

---

## Security notes

- Use a dedicated NAS user (`mycircle-nas`) with access only to the `/MyCircle` folder — not an admin account
- Enable HTTPS only (not plain HTTP) on WebDAV Server
- Consider using Synology's Let's Encrypt certificate for a trusted SSL cert
- Change your password if it has been shared or exposed
