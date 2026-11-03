# Engineering Atlas audio sources

Physical foley recordings, accessed 27 October 2026. No paid assets.

- `page-move.mp3`: **10 Book Page Flips** by **StarNinjas**, source `book_flip.2.ogg`. CC0. https://opengameart.org/content/10-book-page-flips — https://opengameart.org/users/starninjas
- `cover-open.mp3`, `cover-close.mp3`, `page-land.mp3`, `brush.mp3`: **RPG Audio** by **Kenney**, source `cloth1.ogg`, `bookClose.ogg`, `bookFlip1.ogg`, `cloth1.ogg`. CC0. https://kenney.nl/assets/rpg-audio
- License: https://creativecommons.org/publicdomain/zero/1.0/

Edits: mono MP3 at 44.1kHz/96kbps, high/low-pass filtering, short fades and trims. Playback normalizes source sample peaks to 0.7 before applying per-cue and master gains. These are recorded book/cloth sounds; the rare two-tone resonance is generated separately and is not represented as a recording.

28 October opening refinement: replace the rejected 154ms `bookOpen.ogg` impact with recorded `cloth1.ogg`, slowed to 0.6 tempo, filtered at 180–2400Hz, with 180ms entrance and 320ms exit fades. The airy opening texture remains recorded cloth, not a wind recording or synthesized noise. Other recordings are unchanged. Playback uses a quieter opening-specific envelope; the rare warm resonance remains separate.

Source archives and extracted recordings are retained in `tmp/restoration` locally; the public license record travels with the distributed audio. Current byte measurements are in docs/review/map-sound/.
