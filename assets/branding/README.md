# Particle Beat sharing assets

All assets are local static files. No generation, font download, or external image service runs in the game.

- share-card-v1.png: 1200×630 opaque PNG for Open Graph and large social cards.
- favicon.svg: hand-authored code-native neon star/music-note symbol, 64×64 viewBox.
- favicon-32.png: 32×32 raster fallback.
- favicon.ico: 16×16, 32×32, and 48×48 entries.
- apple-touch-icon.png: 180×180 opaque home-screen icon.

## Artwork provenance

The sharing card was generated on 2026-10-19 with the built-in image generation tool. Reference inputs were the existing local LUMI and NOVA padded expression sheets in assets/characters. It is promotional artwork; the game character sheets were not modified. The output was visually inspected for character identity and readable text, then resized from 1730×909 to 1200×630 and stripped of metadata with ImageMagick. The exact generation prompt is in share-card-prompt.md. The original tool output remains outside the repository; the deployed card is fully contained here.

The icon was authored directly as SVG for small-size legibility. PNG exports use Sharp/librsvg; ICO sizes were exported with ImageMagick from the correctly rendered 48px PNG. These are optional authoring tools, not runtime or build dependencies. Inspect raster exports before replacing them: the local ImageMagick SVG renderer omitted strokes on the first draft, which was rejected and replaced with librsvg exports.

## Replacement and hosting

Keep the artwork English and filenames versioned when replacing the sharing card. Update both og:image and twitter:image, dimensions, tests/sharing.js when appropriate, and the actual public URL. Local icons use relative paths so project Pages subpaths continue to work. The published canonical URL and social image URL intentionally identify https://hyangdan2.github.io/CDXPilot0004/; a repository/domain rename requires updating those public metadata values even though game assets remain portable.

Run npm test after changes. Actual social previews and browser icon caches may retain older assets; verify in the sharing service after the GitHub Pages publication has completed. No messages are sent by the test suite.

## Version 2 anatomy correction

share-card-v2.png is the active 1200×630 card. It corrects the foreground hands to five visible digits each. Version 1 remains archived. The first edit produced six digits on NOVA and was rejected; a targeted second edit removed the extra horizontal-left digit. Both foreground hands were visually counted before export. Open Graph and large-card URLs now use v2 to distinguish the corrected asset in caches.
