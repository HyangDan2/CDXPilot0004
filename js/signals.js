// Signal membership is catalog metadata, never a leaderboard identity.
export const SIGNALS = ["signal-1", "signal-2"];
export const signalOf = track => track.challenge === true ? "signal-2" : "signal-1";
export const signalTracks = (tracks, signal) => tracks.filter(track => signalOf(track) === signal);
export function restoreSignalSelection(settings, tracks, requested = null) {
  const existing = tracks.find(track => track.id === settings.track);
  const signal = SIGNALS.includes(requested) ? requested
    : SIGNALS.includes(settings.signal) ? settings.signal
    : existing ? signalOf(existing) : SIGNALS[0];
  const remembered = {};
  for (const group of SIGNALS) {
    const members = signalTracks(tracks, group);
    remembered[group] = members.find(track => track.id === settings.signalTracks?.[group])?.id
      || (existing && signalOf(existing) === group ? existing.id : members[0]?.id);
  }
  return { signal, signalTracks: remembered, track: remembered[signal] };
}
export function rememberSignalTrack(settings, track) {
  const signal = signalOf(track);
  return { signal, track: track.id, signalTracks: { ...settings.signalTracks, [signal]: track.id } };
}
export async function loadCatalog(fetcher = fetch) {
  const response = await fetcher("./assets/tracks.json?v=6.2", { cache: "no-cache" });
  if (!response.ok) throw new Error("Unable to load the track library.");
  const tracks = await response.json();
  if (!Array.isArray(tracks) || tracks.length !== 20 ||
      new Set(tracks.map(track => track.id)).size !== 20 ||
      SIGNALS.some(signal => signalTracks(tracks, signal).length !== 10))
    throw new Error("The track library is outdated or incomplete. Reload to load both signals.");
  return tracks;
}
