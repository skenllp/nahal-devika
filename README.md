# Nahal & Devika — Wedding Invitation

Mobile-first cinematic invitation. Plain HTML5, CSS3 and vanilla JavaScript (no build step, no libraries).
Live: <https://nahal-devika.vercel.app/>

```
index.html
css/        style.css, scenes.css
js/         data.js (all editable wedding details + map links), main.js, particles.js
assets/
  video/    opening.mp4            opening invitation (autoplay, muted, inline)
  poster/   cover.webp             first frame of the video (cover / poster)
  hero/     hero.webp              hero artwork
  photos/   couple-01…07.webp, groom.webp, bride.webp
  decor/    peacock.webp, wash-*.svg
  audio/    music.mp3
  icons/    ND monogram icons
  og-image.jpg  favicon.png
```

## Edit details
Everything visible is bound to `js/data.js`. Change names, times, addresses or paste exact Google Maps links into
`weddingMap` / `receptionMap` (empty = automatic Google Maps search link). The countdown target is `countdownTarget`.

## Run locally
```
python3 -m http.server 8080
```
Then open <http://localhost:8080>.

## Replace the share image
Drop a 1200×630 JPG at `assets/og-image.jpg`. WhatsApp caches previews — after changing it, re-share with a `?v=2` suffix.
