# Sharing card generation prompt

Tool: built-in image_gen. Date: 2026-10-19. Opaque output.

Reference image 1: assets/characters/lumi-expressions-padded.png.
Reference image 2: assets/characters/nova-expressions-padded.png.

Exact prompt:

Use case: ads-marketing. Create one finished wide 1200x630 social sharing card for the existing rhythm game Particle Beat, about 1.905:1 aspect ratio. Reference image 1 is LUMI's expression sheet; reference image 2 is NOVA's expression sheet. These are character identity references only, not a grid to reproduce. Show exactly two appealing chibi DJs: LUMI with lavender bob/cyan tips, cyan headphones and star clip; NOVA with silver bob, magenta headphones and star clip. Preserve their recognizable designs. Rich dark navy neon cosmic background with cyan/purple/magenta nebula, tiny stars and subtle rhythm lane light streaks. Polished anime game promotional illustration. Compose the two smiling characters on the right half, comfortably inside frame. On left clear large exceptionally legible typography exactly 'PARTICLE BEAT', with smaller text exactly 'Find your frequency.' underneath. Use strong white/cyan text, ample dark negative space and generous safe margins on all sides. No other text, no UI screenshot, no repeated expressions, no watermark. Output a single flat opaque marketing card, landscape.

## Version 2 correction prompts

The first edit requested open foreground hands with exactly five digits on both characters, preserving the characters, scenery, title and tagline. That draft was rejected because NOVA had six visible digits.

Final targeted edit prompt (reference: rejected first-edit output):

Precise anatomical correction to this image. The RIGHT character NOVA currently has SIX digits on her foreground open black-gloved hand. Fix ONLY this hand. REMOVE the extra finger sticking HORIZONTALLY LEFT from the upper-left side of the palm (the fingertip near x=1328,y=580 in this 1730x909 reference). That extra horizontal-left finger must disappear, filling the area with the underlying dark/neon clothing/background and reconstructing a smooth palm edge. Keep the other FIVE existing digits: the upward finger, the diagonal lower-left finger, the two downward fingers, and the thumb extending to the RIGHT. Count explicitly: four fingers plus one right-side thumb = FIVE, not six. Preserve all other pixels/contents as closely as possible, including LUMI's already correct five-finger white glove, NOVA's face and pose, both headphone hands, title and tagline, scenery and turntables. Do not add or regenerate extra fingers. One targeted removal only.

## Version 3 hand redraw

Reference: share-card-v2.png. Built-in image_gen, opaque output. Exact prompt:

Redraw ONLY NOVA's foreground hand and its immediate wrist/cuff in this existing promotional image. NOVA is the silver-haired character on the right with magenta clothes. Her current extended black fingerless-gloved hand is anatomically wrong: the digits are arranged like spokes around a disk. Completely replace this hand, do NOT merely remove a digit. Give her a natural upright open-palm friendly wave in front of her right shoulder, palm toward viewer, wrist entering from BELOW. Make a realistic anime hand skeleton: FOUR parallel fingers growing from the TOP knuckle edge of a single palm, gently spread; index and ring slightly shorter than middle, pinky distinctly shortest. ONE thumb grows from the SIDE of the palm LOWER DOWN beside the wrist, visibly bent at the thumb base. Exactly five digits total. Use her anatomical right hand so its palm faces viewer with the thumb on viewer's RIGHT, four fingertips pointing UP, wrist BELOW. Black fingerless glove covers palm and finger bases; skin fingertips exposed. Natural wrist alignment with her sleeve, compact hand proportional to her chibi body. No radial/spider hand, no fingers coming out of bottom edge, no duplicate thumb, no extra digits, no missing digits. Adjust only the short sleeve/cuff connection if necessary for a believable wrist. Preserve all other content as closely as possible: LUMI and her white glove unchanged, both faces, hair, headphones, NOVA's other hand by her headphone, cosmic background, turntables, exact title PARTICLE BEAT and tagline Find your frequency. Same wide aspect ratio. This is a targeted hand anatomy redraw, not a new composition.
