// Shared native dialog for the React app and the standalone story archive.
export function attachInspector(root = document) {
 let dialog, opener, previousOverflow, zoom = 1, fitWidth = 0, fitHeight = 0, manifest;
 let start, dragged = false, beganInactive = false;
 const stylesheet = '/media-viewer.css';
 if (!root.querySelector(`link[href="${stylesheet}"]`)) {
  const link = root.createElement('link'); link.rel = 'stylesheet'; link.href = stylesheet; root.head.append(link);
 }
 const cleanup = () => {
  if (!dialog) return;
  dialog.querySelector('iframe')?.remove(); dialog.remove(); dialog = undefined;
  root.documentElement.style.overflow = previousOverflow;
  if (opener?.isConnected) opener.focus({preventScroll:true});
 };
 const make = (trigger, kind) => {
  if (dialog) dialog.close();
  opener = trigger; previousOverflow = root.documentElement.style.overflow;
  root.documentElement.style.overflow = 'hidden';
  dialog = root.createElement('dialog'); dialog.className = `media-inspector media-inspector--${kind}`;
  dialog.setAttribute('aria-label', kind === 'resume' ? 'Résumé preview' : 'Photograph viewer');
  dialog.innerHTML = '<header class="media-inspector-toolbar"><h2></h2><div class="media-inspector-actions"></div><button type="button" data-viewer-close>Close</button></header><div class="media-inspector-stage"></div><p class="media-inspector-caption" aria-live="polite"></p>';
  (trigger.closest('.observatory') || root.body).append(dialog);
  dialog.querySelector('[data-viewer-close]').onclick = () => dialog.close();
  dialog.addEventListener('close', cleanup, {once:true});
  dialog.addEventListener('keydown', e => {e.stopPropagation();});
  dialog.showModal(); dialog.querySelector('[data-viewer-close]').focus();
  return dialog;
 };
 const openImage = async (trigger, thumbnail) => {
  const d = make(trigger, 'photo'); zoom = 1;
  const caption = thumbnail.closest('figure')?.querySelector('figcaption')?.textContent.trim() || thumbnail.alt || 'Archive image';
  d.querySelector('h2').textContent = 'From the archive';
  const actions = d.querySelector('.media-inspector-actions');
  actions.innerHTML = '<button type="button" data-fit>Fit</button><button type="button" data-actual>Actual size</button><button type="button" data-out aria-label="Zoom out">−</button><output aria-live="polite">100%</output><button type="button" data-in aria-label="Zoom in">+</button>';
  const stage = d.querySelector('.media-inspector-stage');
  stage.tabIndex = 0; stage.setAttribute('role','region'); stage.setAttribute('aria-label','Image pan area');
  const frame = root.createElement('figure'); frame.className = 'media-inspector-frame';
  const img = root.createElement('img'); img.alt = thumbnail.alt || caption; img.draggable = false;
  frame.append(img); stage.append(frame); d.querySelector('.media-inspector-caption').textContent = caption;
  const setZoom = value => {
   zoom = Math.max(1, Math.min(64, value)); img.style.width = `${fitWidth * zoom}px`; img.style.height = `${fitHeight * zoom}px`;
   actions.querySelector('output').textContent = `${Math.round(zoom * 100)}%`;
   actions.querySelector('[data-out]').disabled = zoom === 1; actions.querySelector('[data-in]').disabled = zoom === 64;
  };
  const fit = () => {
   const style = getComputedStyle(frame), pad = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
   const ratio = Math.min((stage.clientWidth - pad * 2) / img.naturalWidth, (stage.clientHeight - pad * 2) / img.naturalHeight, 1);
   fitWidth = Math.max(1, img.naturalWidth * ratio); fitHeight = Math.max(1, img.naturalHeight * ratio);
   setZoom(1); stage.scrollTo(0,0);
  };
  actions.querySelector('[data-fit]').onclick = fit;
  actions.querySelector('[data-actual]').onclick = () => setZoom(img.naturalWidth / fitWidth);
  actions.querySelector('[data-out]').onclick = () => setZoom(zoom / 1.5);
  actions.querySelector('[data-in]').onclick = () => setZoom(zoom * 1.5);
  stage.addEventListener('wheel', e => {if(e.ctrlKey || e.metaKey){e.preventDefault();setZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15));}}, {passive:false});
  stage.addEventListener('keydown', e => {
   const directions = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
   const direction = directions[e.key];if(!direction)return;
   e.preventDefault();e.stopPropagation();
   const step=parseFloat(getComputedStyle(d).getPropertyValue('--viewer-pan-step')) || 128;
   stage.scrollBy({left:direction[0]*step,top:direction[1]*step,behavior:'instant'});
  });
  let pan;
  stage.addEventListener('pointerdown', e => {if(e.pointerType === 'mouse' && zoom > 1){pan={x:e.clientX,y:e.clientY,left:stage.scrollLeft,top:stage.scrollTop};stage.setPointerCapture(e.pointerId);}});
  stage.addEventListener('pointermove', e => {if(pan){stage.scrollLeft=pan.left+pan.x-e.clientX;stage.scrollTop=pan.top+pan.y-e.clientY;}});
  stage.addEventListener('pointerup',()=>{pan=undefined;});stage.addEventListener('pointercancel',()=>{pan=undefined;});
  actions.querySelectorAll('button').forEach(button => {button.disabled = true;});
  img.onload = () => {actions.querySelectorAll('button').forEach(button => {button.disabled = false;});fit();};
  const original = thumbnail.getAttribute('src'); const current = new URL(original,location.href).pathname;
  try {
   manifest ||= fetch('/story/full-images.json').then(r=>r.ok?r.json():{}).catch(()=>({}));
   const map = await manifest; if(!d.isConnected)return;
   const full = map[current] || map[new URL(thumbnail.currentSrc || thumbnail.src,location.href).pathname];
   img.src = full || thumbnail.currentSrc || thumbnail.src;
  }catch { if(d.isConnected)img.src = thumbnail.currentSrc || thumbnail.src; }
  img.onerror = () => {if(img.src !== thumbnail.src)img.src=thumbnail.src;d.querySelector('.media-inspector-caption').textContent=caption+' · Full-resolution image unavailable; showing the saved preview.';};
 };
 const openResume = trigger => {
  const d = make(trigger, 'resume');d.querySelector('h2').textContent = 'Résumé';
  const actions=d.querySelector('.media-inspector-actions');
  for(const [label,download] of [['Open PDF in new tab',false],['Download PDF',true]]){
   const a=root.createElement('a');a.textContent=label;a.href='/adarsh-singh-resume.pdf';if(download)a.download='Adarsh-Singh-Resume.pdf';else{a.target='_blank';a.rel='noreferrer';}actions.append(a);
  }
  const frame=root.createElement('iframe');frame.title='Adarsh Singh résumé PDF';frame.src='/adarsh-singh-resume.pdf#view=FitH';
  d.querySelector('.media-inspector-stage').append(frame);
  d.querySelector('.media-inspector-caption').textContent='Read the PDF here, open it in a new tab, or save a copy using Download PDF.';
 };
 const down = e => {if(dialog)return;start={x:e.clientX,y:e.clientY};dragged=false;beganInactive=!!e.target.closest('[data-carousel-index][aria-hidden="true"]');};
 const move = e => {if(start && Math.hypot(e.clientX-start.x,e.clientY-start.y)>8)dragged=true;};
 const click = e => {
  if(dialog || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)return;
  const resume=e.target.closest('a[href="/adarsh-singh-resume.pdf"]');
  if(resume){e.preventDefault();e.stopPropagation();openResume(resume);return;}
  const link=e.target.closest('button[data-inspect-image],a');
  const img=e.target.closest('img') || link?.querySelector('img');
  if(!img || !(img.closest('.observatory') || root.body.dataset.storyArchive !== undefined))return;
  if(e.detail && (dragged || beganInactive))return;
  e.preventDefault();e.stopPropagation();void openImage(link || img,img);
 };
 root.addEventListener('pointerdown',down,true);root.addEventListener('pointermove',move,true);root.addEventListener('click',click,true);
 return()=>{root.removeEventListener('pointerdown',down,true);root.removeEventListener('pointermove',move,true);root.removeEventListener('click',click,true);if(dialog){dialog.close();cleanup();}};
}
