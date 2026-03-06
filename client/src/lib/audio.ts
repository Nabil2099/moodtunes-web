/**
 * Centralized HTML5 Audio engine for MoodTunes.
 * Manages a single Audio element for track playback.
 */

let audio: HTMLAudioElement | null = null;
let onTimeUpdateCb: ((time: number) => void) | null = null;
let onEndedCb: (() => void) | null = null;
let onLoadCb: ((duration: number) => void) | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = parseFloat(localStorage.getItem("moodtunes-volume") || "0.8");

    audio.addEventListener("timeupdate", () => {
      onTimeUpdateCb?.(audio!.currentTime);
    });

    audio.addEventListener("ended", () => {
      onEndedCb?.();
    });

    audio.addEventListener("loadedmetadata", () => {
      onLoadCb?.(audio!.duration);
    });
  }
  return audio;
}

export function loadTrack(url: string): void {
  const a = getAudio();
  if (!url) {
    // No preview URL — keep silent simulated playback
    a.src = "";
    return;
  }
  a.src = url;
  a.load();
}

export function playAudio(): void {
  const a = getAudio();
  if (a.src) {
    a.play().catch(() => {
      // Browser may block autoplay — user will click play
    });
  }
}

export function pauseAudio(): void {
  getAudio().pause();
}

export function seekTo(time: number): void {
  const a = getAudio();
  if (a.src && isFinite(time)) {
    a.currentTime = time;
  }
}

export function setVolume(vol: number): void {
  const clamped = Math.max(0, Math.min(1, vol));
  getAudio().volume = clamped;
  localStorage.setItem("moodtunes-volume", String(clamped));
}

export function getVolume(): number {
  return getAudio().volume;
}

export function getAudioCurrentTime(): number {
  return getAudio().currentTime;
}

export function getAudioDuration(): number {
  const d = getAudio().duration;
  return isFinite(d) ? d : 0;
}

export function onTimeUpdate(cb: (time: number) => void): void {
  onTimeUpdateCb = cb;
}

export function onEnded(cb: () => void): void {
  onEndedCb = cb;
}

export function onLoaded(cb: (duration: number) => void): void {
  onLoadCb = cb;
}

export function hasRealAudio(): boolean {
  return !!getAudio().src && getAudio().src !== window.location.href;
}
