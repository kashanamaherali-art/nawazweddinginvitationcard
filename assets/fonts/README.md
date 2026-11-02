# Fonts

| Use | Font | File expected here |
|---|---|---|
| All text without an assigned font | **Tempting** (RGB Studio, DaFont) | `Tempting.woff2` and/or `Tempting.ttf` |
| Groom's name only | **Birds of Paradise** (Herofonts, DaFont) | `BirdsOfParadise.woff2` and/or `BirdsOfParadise.ttf` |
| Three-day programme only (headings, dates, times, addresses, countdowns) | **Poppins** | included: `Poppins-Regular.ttf`, `Poppins-Medium.ttf` |

`css/style.css` loads these with `@font-face`. If a Tempting or Birds of Paradise file is missing, the site falls back to Parisienne (a similar script from Google Fonts) and nothing breaks. Add the files with exactly these names and the supplied fonts are used automatically. You can convert a `.ttf` to `.woff2` with any font converter for faster loading.

## Licences: please read

- **Poppins** is under the SIL Open Font License 1.1, which allows web embedding and redistribution. Keep the licence text with the fonts if you publish the repository (https://github.com/itfoundry/poppins).
- **Tempting**: the DaFont listing says "Free for personal use", and the download is named "PERSONAL USE ONLY".
- **Birds of Paradise**: the author's notes say it is free for personal use only; commercial licences are sold at herofonts.com.

Putting a font file on a public website lets anyone download it, which a personal-use licence may not cover, even for a private family event. I could not confirm that web embedding is permitted. Before you publish, either email RGB Studio and Herofonts for written permission or a web licence, or host the site from a private location. If you cannot get permission, tell me and I will switch to a font with an open licence.
