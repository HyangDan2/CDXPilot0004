import { mkdir, writeFile } from "node:fs/promises";
import { TRACKS, makeChart } from "../js/music.js";
await mkdir(new URL("../assets/beatmaps/library/", import.meta.url), {
  recursive: true,
});
for (const track of TRACKS) {
  for (const lanes of [4, 6])
    for (const difficulty of ["easy", "normal", "hard", "expert"])
      await writeFile(
        new URL(
          `../assets/beatmaps/library/${track.id}-${lanes}-${difficulty}.json`,
          import.meta.url,
        ),
        JSON.stringify(makeChart(track, lanes, difficulty)) + "\n",
      );
  console.log(
    `Generated ${track.title}: eight versioned charts; saved Web Audio soundtrack.`,
  );
}
await writeFile(
  new URL("../assets/tracks.json", import.meta.url),
  JSON.stringify(TRACKS, null, 2) + "\n",
);
