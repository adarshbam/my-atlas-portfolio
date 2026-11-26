import { readFileSync, statSync } from 'node:fs';
import { resolve, relative, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

const manifest = JSON.parse(readFileSync('src/data/portfolio-videos.json', 'utf8'));
const publicRoot = resolve('public');
const ids = ['introduction', 'vault', 'story'];
const asset = (value, extensions) => {
  if (typeof value !== 'string' || !value.startsWith('/media/profile/') || /[?#\\]/.test(value)) throw Error('Use local /media/profile/ assets.');
  const path = resolve(publicRoot, `.${value}`);
  if (relative(publicRoot, path).startsWith('..') || !extensions.includes(extname(path)) || !statSync(path).isFile()) throw Error(`Invalid media asset: ${value}`);
  return path;
};
let ready = 0;
for (const id of Object.keys(manifest)) if (!ids.includes(id)) throw Error(`Unknown video: ${id}`);
for (const id of ids) {
  const video = manifest[id];
  if (video === null) continue;
  if (!video || typeof video.title !== 'string' || !video.title.trim() || !Number.isInteger(video.durationSeconds) || video.durationSeconds < 1) throw Error(`${id}: title and final integer duration required.`);
  const source = asset(video.src, ['.mp4', '.webm']);
  asset(video.poster, ['.webp', '.avif']);
  const captionPath = asset(video.captions, ['.vtt']);
  const captions = readFileSync(captionPath, 'utf8').replace(/^\uFEFF/, '');
  if (!captions.startsWith('WEBVTT') || !/\d{2}:\d{2}\.\d{3}\s+-->\s+/.test(captions)) throw Error(`${id}: a timed WebVTT caption file is required.`);
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type', '-of', 'json', source], { encoding: 'utf8', windowsHide: true });
  // A build host without ffprobe (the hosted build has none) cannot measure the recording. The
  // manifest, files and captions are still checked above; the duration and the audio stream are
  // verified wherever ffprobe exists, which is where recordings are added. An ffprobe that is
  // present and fails is still an error.
  if (probe.error?.code === 'ENOENT') {
    console.warn(`${id}: ffprobe is not installed here; duration and audio stream not measured.`);
    ready++;
    continue;
  }
  if (probe.error || probe.status !== 0) throw Error(`${id}: ffprobe could not read the recording.`);
  const metadata = JSON.parse(probe.stdout);
  if (!metadata.streams.some(s => s.codec_type === 'video') || !metadata.streams.some(s => s.codec_type === 'audio')) throw Error(`${id}: a video with recorded audio is required.`);
  const duration = Number(metadata.format.duration);
  if (!Number.isFinite(duration) || Math.abs(video.durationSeconds - duration) > 1) throw Error(`${id}: duration label differs from the actual recording (${duration}s).`);
  ready++;
}
console.log(`Portfolio videos: ${ready} ready; ${ids.length - ready} unrecorded entries hidden.`);
