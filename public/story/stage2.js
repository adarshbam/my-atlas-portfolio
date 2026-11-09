const contents=document.querySelector('.contents');
contents.querySelectorAll('a').forEach(link=>link.addEventListener('click',event=>{
 event.preventDefault();contents.open=false;
 const section=document.querySelector(link.getAttribute('href'));
 history.pushState(null,'',link.getAttribute('href'));section?.scrollIntoView();section?.querySelector('h2')?.focus({preventScroll:true});
}));
contents.addEventListener('keydown',event=>{if(event.key==='Escape'){contents.open=false;contents.querySelector('summary').focus();}});
import {attachInspector} from '/media-viewer.js';
attachInspector(document);
const playbackPositions=new WeakMap();
const releasedVideos=new WeakSet();
function releaseVideo(video){
 if(releasedVideos.has(video))return;
 if(video.readyState>0){
  playbackPositions.set(video,video.currentTime);
  releasedVideos.add(video);
  video.pause();video.preload='none';video.load();
 }else video.pause();
}
// Only explicit playback loads a YouTube player. Keep its own controls/branding intact.
document.querySelectorAll('[data-load-film]').forEach(button=>button.addEventListener('click',()=>{
 const screen=button.closest('[data-youtube]');
 document.querySelectorAll('video').forEach(releaseVideo);
 const iframe=document.createElement('iframe');
 iframe.title=screen.dataset.title;
 iframe.src=`https://www.youtube-nocookie.com/embed/${screen.dataset.youtube}?playsinline=1&rel=0&controls=1&cc_load_policy=1`;
 iframe.allow='accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
 iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allowFullscreen=true;
 screen.replaceChildren(iframe);iframe.focus();
 document.querySelector('#film-status').textContent=`${screen.dataset.title} player loaded. Use the player’s play control to start.`;
}));
document.querySelectorAll('video').forEach(video=>{
 video.addEventListener('loadedmetadata',()=>{
  const position=playbackPositions.get(video);
  if(position!==undefined)video.currentTime=Math.min(position,video.duration);
 });
 video.addEventListener('play',()=>{
  releasedVideos.delete(video);
  document.querySelectorAll('video').forEach(other=>{if(other!==video)releaseVideo(other);});
 });
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());});
