# Muhammad Nawaz Bhatti – Wedding Invitation

A mobile-first digital invitation: a closed ivory card with a wax seal that opens when tapped, then one continuous vertical scroll through the invitation, the three wedding days (each with a live countdown), venue maps, contact numbers and an RSVP that is saved to a Microsoft Excel workbook.

```
index.html
css/style.css          styles, engraved typography, card-opening animation
js/config.js           public settings (RSVP endpoint)
js/script.js           card opening, scroll reveals, countdowns, music
js/rsvp.js             RSVP buttons, form, validation, submission
assets/images/         card-closed, door-left/right, seal, frame, couple (+ bismillah.png, in-shaa-allah.png: see below)
assets/fonts/          Poppins (included) + Tempting and Birds of Paradise (you add them: see assets/fonts/README.md)
assets/audio/wedding-music.mp3
backend/               Azure Function + Power Automate + Excel workbook (see backend/README.md)
```

## Before you publish: three things to add

1. **Fonts**: put `Tempting.ttf` and `BirdsOfParadise.ttf` in `assets/fonts/`. Until then a fallback script font is used. **Read the licence note in `assets/fonts/README.md` first**: both fonts are "personal use only".
2. **Bismillah and In Shaa Allah pictures**: save them as `assets/images/bismillah.png` and `assets/images/in-shaa-allah.png` (transparent PNG works best). Until then plain text is shown in their place. These two pictures were not part of the files I received.
3. **RSVP backend**: follow `backend/README.md`, then paste the function URL into `js/config.js`. Until then the RSVP form tells guests that nothing was saved; it never pretends to succeed.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository (`main` branch).
2. **Settings → Pages → Deploy from a branch → `main` / root → Save.**
3. Your site appears at `https://<username>.github.io/<repository>/`. Add that origin (without a trailing slash) to `ALLOWED_ORIGINS` in the backend settings.

To test locally: `python3 -m http.server 8000`, then open http://localhost:8000.

## Music

`assets/audio/wedding-music.mp3` is an original instrumental that I synthesised for this invitation, so there is no third-party copyright in it. It is simple; replace it with any licensed track of the same file name if you prefer. Music only starts after a guest taps **Open Invitation**; a floating button lets them pause or mute it.

## Edit the details

Names, dates, venues and phone numbers are in `index.html`. Countdown times are in `js/script.js` (object `T`, Pakistan time `+05:00`). RSVP events are listed at the top of `js/rsvp.js` and `backend/azure-function/src/lib/rsvp-core.js`.

## What has and has not been tested

- Backend validation, honeypot, origin allow-list, rate limit and Pakistan-time logic: unit tests pass (`cd backend/azure-function && npm test`).
- The Excel workbook and its summary formulas: recalculated with no errors.
- **Not yet tested:** the pages in real phone browsers, and the live Azure → Power Automate → Excel chain (it needs your Microsoft account). Follow the test steps in `backend/README.md` and do not announce RSVPs as working until a test row appears in Excel.
