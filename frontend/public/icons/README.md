# Kormerce PWA Icons

This directory contains icons for the Kormerce Progressive Web App.

## Required Icons

To make the PWA fully functional, you need to create and add these icon files:

### Main Icons
- `icon-192x192.png` — 192x192px square icon (for Android home screen)
- `icon-512x512.png` — 512x512px square icon (high resolution)
- `icon-maskable-192x192.png` — 192x192px maskable icon (safe zone design)
- `icon-maskable-512x512.png` — 512x512px maskable icon

### Shortcut Icons (Optional)
- `shortcut-dashboard-192x192.png` — Dashboard shortcut
- `shortcut-orders-192x192.png` — Orders shortcut
- `shortcut-products-192x192.png` — Products shortcut

### Screenshots (Optional)
Create a `screenshots/` subfolder with:
- `screenshot-540x720.png` — Mobile portrait screenshot
- `screenshot-1280x720.png` — Desktop landscape screenshot

## Icon Design Guidelines

1. **Use the Kormerce logo (K) with indigo background (#4F46E5)**
2. **Maskable icons** should have the logo in the center safe zone (80% of canvas)
3. **Format**: PNG with transparency (RGBA)
4. **Best practice**: Use a design tool like:
   - Figma
   - Adobe Express
   - PWA Icon Generator (https://www.pwabuilder.com/imageGenerator)

## Quick Setup

1. **Use PWA Builder Icon Generator:**
   - Go to https://www.pwabuilder.com/imageGenerator
   - Upload your 512x512 icon
   - Download the package
   - Extract icons to this folder

2. **Or use a simple approach:**
   - Create a 512x512 PNG with the Kormerce logo
   - Resize to 192x192 for mobile
   - Use tools like ImageMagick or online converters

## Icon Requirements

- **Format**: PNG (with transparency)
- **Color Space**: RGBA (supports alpha transparency)
- **No rounded corners** (OS will apply them)
- **Padding**: ~10-15% on maskable icons
- **File size**: Keep under 100KB per icon

## Testing

Once icons are in place:
1. Build the Next.js app: `npm run build`
2. Deploy to production
3. On Android: Open in Chrome → Menu → "Add to Home Screen" → Install
4. On iOS: Open in Safari → Share → "Add to Home Screen"
5. Check that icons appear correctly in both portrait and landscape

## Notes

- Icons should follow your brand guidelines
- Use consistent colors (currently: #4F46E5 indigo theme)
- Ensure contrast for readability at small sizes
- Test on multiple devices before finalizing
