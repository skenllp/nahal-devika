NAHAL & DEVIKA - Cinematic Scroll Wedding Invitation (v2)

Structure
  index.html            page shell + WhatsApp / Open Graph tags
  css/style.css         styling and ambient animations
  js/data.js            ALL wedding details + photo paths (edit here)
  js/main.js            scenes: OpeningWorld, DoorPortal, LotusWorld, CoupleReveal, Close-up,
                        LotusPortal, PeacockWorld, Groom/Bride, StoryPhoto, Reception, Closing
  assets/art/           lotus + peacock artwork
  assets/frames/        48 opening-video frames (loaded progressively)
  assets/photos/        nahal-devika-lotus / closeup / story / final .webp
  assets/og-image.jpg   1200x630 WhatsApp preview image
  assets/icons/         favicon

Run / host
  Needs a web server (not double-click). Upload the whole folder to Netlify, Vercel,
  GitHub Pages or Cloudflare Pages. Local test: python3 -m http.server, then open localhost:8000

WhatsApp preview
  In index.html replace https://YOUR-DOMAIN/assets/og-image.jpg with the real full URL
  (WhatsApp only accepts absolute URLs). WhatsApp caches previews, so test with a fresh link.

Change details: js/data.js (names, times, venues, map links, photos)
Scene order is fixed: palace video, door, lotus, couple, close-up, lotus arch, peacock arch,
groom/bride, story photo, reception, final.
