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
  assets/favicon.png    512x512 favicon
  assets/icons/         favicon

Run / host
  Needs a web server (not double-click). Upload the whole folder to Netlify, Vercel,
  GitHub Pages or Cloudflare Pages. Local test: python3 -m http.server, then open http://0.0.0.0:8000

WhatsApp preview
  OG image: assets/og-image.jpg (1200x630), referenced via https://nahal-devika.vercel.app/assets/og-image.jpg.
  WhatsApp/Facebook cache previews; if an old one shows, append ?v=2 to the og:image URL or re-scrape via the Facebook Sharing Debugger.

Change details: js/data.js (names, times, venues, map links, photos)
Scene order is fixed: palace video, door, lotus, couple, close-up, lotus arch, peacock arch,
groom/bride, story photo, reception, final.
