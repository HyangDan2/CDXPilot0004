import { TRACKS } from "../js/music.js";
import { renderTrack } from "../js/synth.js";
import { encodeWav } from "../js/wav.js";
const select = document.querySelector("#track"),
  button = document.querySelector("#render"),
  status = document.querySelector("#status"),
  download = document.querySelector("#download");
let url;
for (const track of TRACKS) select.add(new Option(track.title, track.id));
button.onclick = async () => {
  button.disabled = select.disabled = true;
  download.hidden = true;
  if (url) URL.revokeObjectURL(url);
  try {
    const track = TRACKS.find((t) => t.id === select.value);
    const buffer = await renderTrack(
      track,
      (message) => (status.textContent = message),
    );
    url = URL.createObjectURL(
      new Blob([encodeWav(buffer)], { type: "audio/wav" }),
    );
    download.href = url;
    download.download = `${track.id}.wav`;
    download.hidden = false;
    status.textContent = "WAV ready. Download and encode for deployment.";
  } catch (error) {
    status.textContent = `Rendering failed: ${error.message}`;
  } finally {
    button.disabled = select.disabled = false;
  }
};
