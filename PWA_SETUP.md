# Kormerce PWA Setup Guide

This document explains the Progressive Web App (PWA) setup for Kormerce.

## What is a PWA?

A Progressive Web App is a web application that works like a native app:
- ✅ **Installable** — Add to home screen on mobile/desktop
- ✅ **Offline-capable** — Works without internet using service workers
- ✅ **App-like** — Full screen, no browser UI
- ✅ **Push notifications** — Re-engage users
- ✅ **Fast** — Cached assets load instantly
- ✅ **Secure** — Served over HTTPS

## Architecture

### Files Structure
```
frontend/
├── public/
│   ├── manifest.json          # PWA metadata (name, icons, colors)
│   ├── sw.js                  # Service worker entry point
│   ├── icons/                 # App icons (192x, 512x, maskable versions)
│   └── screenshots/           # Install screenshots
├── components/
│   └── PWAInstallPrompt.tsx   # Install button component
├── app/
│   ├── layout.tsx             # PWA metadata added
│   ├── offline/page.tsx       # Fallback for offline pages
│   └── globals.css
└── next.config.ts             # next-pwa configuration
```

### Key Technologies

1. **next-pwa** — Automatic service worker generation
2. **Workbox** — Google's service worker library
3. **Web App Manifest** — PWA configuration
4. **Service Workers** — Cache management & offline support

## How It Works

### Installation Flow (User's Perspective)

**Android/Web:**
1. User visits `kormmerce.com`
2. Browser shows "Install Kormerce" prompt (automatic)
3. User clicks "Install"
4. App appears on home screen
5. User taps icon → full-screen app opens

**iOS:**
1. User visits `kormmerce.com` in Safari
2. User taps Share → "Add to Home Screen"
3. App appears on home screen
4. User taps icon → full-screen app opens

### Caching Strategy

The PWA uses **smart caching**:

```
Request → Service Worker → Cache Hit? → Return cached
                             ↓
                          Cache Miss? → Network Request → Cache & Return
```

**Cache Rules (from next.config.ts):**

1. **API Requests** (NetworkFirst)
   - Try network first (live data)
   - Fall back to cache if offline
   - Cache for 24 hours

2. **Images** (CacheFirst)
   - Serve from cache first (fast)
   - Update cache in background
   - Cache for 30 days

3. **Fonts** (CacheFirst)
   - Serve from cache
   - Cache for 1 year

## Setup Checklist

- [x] Install `next-pwa` package
- [x] Configure `next.config.ts` with PWA settings
- [x] Create `manifest.json` with app metadata
- [x] Add PWA metadata to `layout.tsx`
- [x] Create `PWAInstallPrompt.tsx` component
- [x] Add offline fallback page (`/offline`)
- [x] Create service worker file (`public/sw.js`)
- [ ] **TODO: Add app icons** (192x192, 512x512, maskable)
- [ ] **TODO: Add screenshots** (for app store listings)
- [ ] Test on Android Chrome
- [ ] Test on iOS Safari
- [ ] Test offline functionality

## Adding Icons

**You MUST create these icon files for the PWA to work on all devices:**

See `public/icons/README.md` for detailed instructions.

Quick options:
1. **PWA Builder** (recommended): https://www.pwabuilder.com/imageGenerator
2. **Create manually** in Figma/Photoshop at 512x512px
3. **Use logo converter**: Upload your logo, it generates all sizes

## Testing Locally

### 1. Build production version
```bash
npm run build
npm start
```

Visit `http://localhost:3000` (production build)

### 2. Open DevTools
- **Chrome/Edge**: F12 → Application → Manifest
- Look for green checkmarks ✓

### 3. Install on mobile
- Use ngrok to expose local server: `ngrok http 3000`
- Visit the ngrok URL on your phone
- Install the app

### 4. Test offline
- Go to DevTools → Application → Service Workers
- Check "Offline" box
- Reload page → should still work!

## Production Deployment

### On Vercel

1. **Push changes to GitHub**
```bash
git add -A
git commit -m "Add PWA support"
git push
```

2. **Vercel auto-deploys**
3. **Add icons to `public/icons/`**
4. **Push again**
```bash
git add public/icons/
git commit -m "Add PWA app icons"
git push
```

5. **Test on production**
   - Visit `https://kormmerce.com`
   - DevTools → Application → Manifest (should show green)
   - On mobile: Should see install prompt

## Troubleshooting

### "No install prompt shows"
- Icons might be missing → add to `public/icons/`
- Service worker not registered → check DevTools > Service Workers
- Might need to wait 60+ seconds for service worker registration

### "Cannot install on iOS"
- iOS doesn't show install prompt for all PWAs
- Use manual: Share → Add to Home Screen
- Ensure status bar style is set in metadata ✓

### "Cache not working"
- Service worker might be in development mode → disable PWA in dev
- Check DevTools → Application → Cache Storage
- Clear cache: DevTools → Application → Clear Storage

### "Offline page shows wrong styling"
- CSS might not be cached
- Check runtimeCaching in `next.config.ts`
- Rebuild and redeploy

## Performance Metrics

After PWA setup, you should see:
- ⚡ First paint: <1 second (cached)
- 📦 Cache size: 5-10MB (configurable)
- 📱 Install size: <50MB on device
- 🔋 Battery usage: 40-50% lower than browser

## Future Enhancements

1. **Background Sync** — Save orders offline, sync when back online
2. **Push Notifications** — Re-engage sellers with order alerts
3. **Share Target** — Share links from WhatsApp to Kormerce
4. **Periodic Background Sync** — Check for new orders every hour
5. **Shortcuts** — Quick app shortcuts from home screen

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Next.js PWA Plugin](https://github.com/shadowwalker/next-pwa)

## Questions?

Refer to each component's inline comments:
- `next.config.ts` — Caching strategy details
- `manifest.json` — PWA metadata explanation
- `PWAInstallPrompt.tsx` — Install flow logic
- `app/offline/page.tsx` — Offline fallback UI
