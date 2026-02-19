# Mobile (iOS) — Capacitor Setup

MyCircle ships as a native iOS app using [Capacitor](https://capacitorjs.com/), which wraps the existing web build in a WKWebView. No UI rewrite is required.

## Prerequisites

- **macOS** with Xcode 15+ installed
- CocoaPods (`sudo gem install cocoapods`)
- Node.js 22+, pnpm 9+

> **Windows users:** all config and code changes are checked in. You only need a Mac to build the `.ipa` / run the simulator.

## Initial Setup (on Mac)

```bash
# 1. Install dependencies
pnpm install

# 2. Build web assets and sync to native project
pnpm cap:build

# 3. Open in Xcode
pnpm cap:open
```

`cap:build` runs the full web build pipeline (`build:shared` → `firebase:build:mf` → `firebase:assemble`) then copies `dist/firebase/` into the native project via `npx cap sync`.

## Build Commands

| Script | Description |
|--------|-------------|
| `pnpm cap:build` | Full web build + `cap sync` |
| `pnpm cap:sync` | Copy web assets to native project (skip rebuild) |
| `pnpm cap:open` | Open iOS project in Xcode |

## Live Reload (Development)

For rapid iteration, uncomment the `server` block in `capacitor.config.ts`:

```ts
server: {
  url: 'http://<YOUR_LOCAL_IP>:3000',
  cleartext: true,
},
```

Then run:
```bash
pnpm dev          # Start the dev server on your Mac
pnpm cap:open     # Run the app in Simulator or on a device
```

The app will load from your dev server instead of the bundled assets. **Remember to comment this out before building for production.**

## Plugin Configuration

Capacitor plugins configured in `capacitor.config.ts`:

| Plugin | Purpose |
|--------|---------|
| **StatusBar** | Overlays web view for full-bleed design |
| **SplashScreen** | Dark splash (`#1e293b`) matching the app theme |
| **Keyboard** | Resizes body when keyboard appears (form inputs) |
| **Haptics** | Tactile feedback (available for future use) |

## Platform Detection

The shared package exports platform utilities that work at runtime:

```ts
import { isNativePlatform, getPlatform, isPluginAvailable } from '@mycircle/shared';

if (isNativePlatform()) {
  // Running inside Capacitor (iOS or Android)
}

const platform = getPlatform(); // 'ios' | 'android' | 'web'

if (isPluginAvailable('StatusBar')) {
  // Safe to use StatusBar plugin
}
```

These utilities read from `window.Capacitor` (injected by the native shell) rather than importing `@capacitor/core`, keeping the shared bundle lightweight for web users.

## Web-Only Feature Guards

WKWebView on iOS does not support service workers. The following features are automatically disabled when running in Capacitor:

| Feature | File | Behavior |
|---------|------|----------|
| SW update polling | `ReloadPrompt.tsx` | Skips `setInterval` / visibility-change checks |
| SW error logging | `ReloadPrompt.tsx` | Suppresses expected registration errors |
| Reload prompt banner | `ReloadPrompt.tsx` | Returns `null` |
| FCM push notifications | `messaging.ts` | `requestNotificationPermission()` returns `null` |
| PWA install prompt | `PwaInstallPrompt.tsx` | Skips `beforeinstallprompt` listener |

## Known Limitations

- **No service workers** — WKWebView does not support SW. Offline caching relies on Capacitor's native WebView cache and Firestore offline persistence.
- **No web push** — FCM via service worker is disabled. Native push notifications would require `@capacitor/push-notifications` (a future enhancement).
- **No PWA install** — the app is already installed natively, so the install prompt is suppressed.
- **Module Federation** — all MFE bundles are assembled into `dist/firebase/` as static assets. Federation's runtime module loading still works since assets are served from the local WebView.

## App Store Submission

1. Build for release in Xcode (Product → Archive)
2. Upload to App Store Connect via Xcode Organizer
3. Fill in App Store metadata, screenshots, etc.
4. Submit for review

See [Capacitor iOS docs](https://capacitorjs.com/docs/ios) for detailed guidance.
