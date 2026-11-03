export const manifestUrl = "https://yourvaultstorage.com/api/share/public-folder/c97d37579d0d94fb25ddaf562ed35889/manifest";
export const originalVideoNames = {
  "A002": "2022-Dec.mp4",
  "A023": "Imitating-AJ-hoke-jan-2017.mp4",
  "A052": "My-first-own-laptop-unboxing-by-bhaya's-friends-jan-20-2018.mp4",
  "A058": "Practicing-english-after-seeing-ben-10-and-follow-aj-hoke-english-speeaking-course (2).mp4",
  "A059": "Practicing-english-after-seeing-ben-10-and-follow-aj-hoke-english-speeaking-course (3).mp4",
  "A060": "Practicing-english-after-seeing-ben-10-and-follow-aj-hoke-english-speeaking-course jan-2017.mp4",
  "A076": "Tutorials-I-used-to-learn-programming (1).mp4",
  "A077": "Tutorials-I-used-to-learn-programming (2).mp4",
  "A079": "Virtual tour of living bus. (1080 X 1080).mp4",
  "A080": "working-on-a-procodrr-course-project.mp4"
};

const filmIds = new Set(["vFydtnVRbew","_pKimb16FUg","1DcVUmFgeTY"]);
const normalise = name => name.normalize("NFC").trim().toLocaleLowerCase("en");
let cached, pending, retryAfter = 0;
export async function loadVaultManifest(force = false) {
  if (pending) return pending;
  if (!force && cached && Date.now() < cached.until) return cached.items;
  if (!force && Date.now() < retryAfter) throw new Error("Vault metadata is temporarily unavailable");
  pending = (async () => {
    const response = await fetch(manifestUrl, { signal: AbortSignal.timeout(8000), credentials: "omit", cache: "no-store" });
    if (!response.ok) throw new Error(`Vault manifest HTTP ${response.status}`);
    const manifest = await response.json();
    if (!Array.isArray(manifest.items)) throw new Error("Invalid Vault manifest");
    const names = new Map(), duplicates = new Set();
    for (const item of manifest.items) {
      if (!item || typeof item.name !== "string" || typeof item.streamUrl !== "string") continue;
      let url;try { url = new URL(item.streamUrl); } catch { continue; }
      if (url.protocol !== "https:") continue;
      const key = normalise(item.name);
      if (names.has(key)) duplicates.add(key);
      names.set(key, item);
    }
    for (const key of duplicates) names.delete(key); // Never guess between duplicate names.
    cached = { items: names, until: Date.now() + 5 * 60 * 1000 };
    retryAfter = 0;
    return names;
  })();
  try { return await pending; }
  catch (error) { retryAfter = Date.now() + 15000;throw error; }
  finally { pending = undefined; }
}

export async function resolveVaultVideo(archiveId, force = false) {
  const name = originalVideoNames[archiveId];
  if (!name && !filmIds.has(archiveId)) return null;
  const items = await loadVaultManifest(force);
  if(name) return items.get(normalise(name)) || null;
  const matches = [...items.values()].filter(item => item.name.includes(`[${archiveId}]`));
  if(matches.length===0&&!force)return resolveVaultVideo(archiveId,true);
  return matches.length === 1 ? matches[0] : null;
}

// Keep native controls, story captions and archive IDs. Metadata is lazy and shared;
// signed stream URLs stay in memory, never in committed chapter data.
export function attachVaultVideo(video, archiveId) {
  const local = video.getAttribute("src") || video.querySelector("source")?.getAttribute("src");
  if (!originalVideoNames[archiveId] && !filmIds.has(archiveId)) return () => {};
  let disposed = false, remote = false, recovering = false, refreshed = false;
  let playIntent = false, ignoreNextPause = false;
  const playing = () => { playIntent = true; };
  const paused = () => { if (ignoreNextPause) ignoreNextPause = false;else if (!video.error) playIntent = false; };
  video.addEventListener("play", playing);video.addEventListener("pause", paused);
  let restore;
  const useSource = (url, resume = false, time = 0) => {
    if (disposed) return;
    if (restore) video.removeEventListener("loadedmetadata", restore);
    restore = () => {
      if (disposed) return;
      if (time && Number.isFinite(video.duration)) video.currentTime = Math.min(time, Math.max(0, video.duration - .1));
      const rect = video.getBoundingClientRect();
      if (resume && playIntent && !document.hidden && rect.bottom > 0 && rect.top < innerHeight) void video.play().catch(() => {});
      restore = undefined;
    };
    video.addEventListener("loadedmetadata", restore, { once: true });
    ignoreNextPause = !video.paused;
    video.src = url;video.load();
  };
  const find = async () => {
    try {
      const item = await resolveVaultVideo(archiveId);
      if (!disposed && item && video.paused && video.currentTime === 0) {
        remote = true;video.dataset.delivery = "vault";
        useSource(item.streamUrl);
      } else if (!disposed && !item && !local) video.dispatchEvent(new Event("vault:unavailable"));
    } catch { if (!local && !disposed) video.dispatchEvent(new Event("vault:unavailable")); }
  };
  const failed = async () => {
    if (disposed || !remote || recovering) return;
    recovering = true;
    const time = video.currentTime, resume = playIntent;
    try {
      const item = !refreshed ? await resolveVaultVideo(archiveId, true) : null;
      refreshed = true;
      if (!disposed && item && video.src !== item.streamUrl) { useSource(item.streamUrl, resume, time);return; }
    } catch { /* Fall back when a fresh signed link cannot be obtained. */ }
    finally { recovering = false; }
    if (!disposed) { remote = false;if(local){video.dataset.delivery = "local";useSource(local, resume, time);}else video.dispatchEvent(new Event("vault:unavailable")); }
  };
  video.dataset.delivery = "local";
  video.addEventListener("error", failed);
  const near = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { near.disconnect();void find(); }
  }, { rootMargin: "600px" });
  near.observe(video);
  return () => {
    disposed = true;near.disconnect();video.removeEventListener("error", failed);
    video.removeEventListener("play", playing);video.removeEventListener("pause", paused);
    if (restore) video.removeEventListener("loadedmetadata", restore);
    video.pause();video.removeAttribute("src");video.load();
  };
}


// Cross-origin iframe focus transitions do not consistently emit parent focus events.
// One shared focus check while embeds are mounted coordinates visible players without accessing their DOM.
const embedFocusHandlers=new Map();let focusTimer,lastFocused;
function watchEmbedFocus(frame,activate){
 embedFocusHandlers.set(frame,activate);
 focusTimer??=setInterval(()=>{const current=document.activeElement;if(current!==lastFocused&&embedFocusHandlers.has(current)){embedFocusHandlers.get(current)()}},150);
}
function forgetEmbedFocus(frame){
 embedFocusHandlers.delete(frame);if(lastFocused===frame)lastFocused=null;
 if(!embedFocusHandlers.size&&focusTimer){clearInterval(focusTimer);focusTimer=undefined;}
}
// Direct, near-viewport embeds: Vault owns the only Play control.
export function attachVaultEmbed(container, id, title) {
 let disposed=false,frame=null,request=0,near=false,wasVisible=false;
 const inView=()=>{const r=container.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight};
 const clear=()=>{request++;if(frame){forgetEmbedFocus(frame);frame.remove()}frame=null;container.replaceChildren()};
 const mount=async(force=false)=>{
  if(disposed||frame||!near||document.hidden)return;
  const attempt=++request;
  const status=document.createElement("p");status.setAttribute("role","status");status.textContent="Loading Vault player…";container.replaceChildren(status);
  try{
   const item=await resolveVaultVideo(id,force);if(disposed||attempt!==request||!near||document.hidden)return;
   if(!item?.embedUrl)throw new Error("Missing embed");
   const url=new URL(item.embedUrl);
   if(url.hostname!=="yourvaultstorage.com"||url.port||!url.pathname.startsWith("/embed/"))throw new Error("Invalid embed origin");
   url.protocol="https:";url.searchParams.set("autoplay","0");url.searchParams.set("loop","0");url.searchParams.set("controls","1");
   frame=document.createElement("iframe");frame.src=url.href;frame.title=title;frame.allow="autoplay; fullscreen; picture-in-picture";frame.allowFullscreen=true;frame.referrerPolicy="strict-origin-when-cross-origin";
   frame.addEventListener("focus",activate);container.replaceChildren(frame);watchEmbedFocus(frame,activate);
  }catch{
   if(disposed||attempt!==request)return;
   status.textContent="The Vault player couldn’t load.";
   const retry=document.createElement("button");retry.type="button";retry.textContent="Retry player";retry.addEventListener("click",()=>void mount(true));container.append(retry);
  }
 };
 const reset=()=>{clear();void mount()};
 const activate=()=>{
  if(!frame||document.activeElement!==frame||lastFocused===frame)return;
  lastFocused=frame;
  document.dispatchEvent(new CustomEvent("story:iframe-focus",{detail:frame}));
  document.querySelectorAll("video").forEach(v=>v.pause());
  // Other story sounds observe this event; exclude our own reset handler.
  announcing=true;document.dispatchEvent(new Event("story:native-play"));announcing=false;
 };
 let announcing=false;
 const otherSound=()=>{if(!announcing&&frame)reset()};
 const otherFrame=e=>{if(frame&&e.detail!==frame)reset()};
 const blurred=()=>{queueMicrotask(activate)};
 const proximity=new IntersectionObserver(([e])=>{
  near=e.isIntersecting;
  if(near)void mount();else clear();
 },{rootMargin:"300px"});
 const visibility=new IntersectionObserver(([e])=>{
  const visible=e.isIntersecting&&inView();
  if(wasVisible&&!visible&&frame)reset();
  wasVisible=visible;
 });
 proximity.observe(container);visibility.observe(container);
 const hide=()=>{if(document.hidden)clear();else void mount()};
 document.addEventListener("visibilitychange",hide);document.addEventListener("story:native-play",otherSound);document.addEventListener("story:iframe-focus",otherFrame);window.addEventListener("blur",blurred);
 return()=>{disposed=true;proximity.disconnect();visibility.disconnect();document.removeEventListener("visibilitychange",hide);document.removeEventListener("story:native-play",otherSound);document.removeEventListener("story:iframe-focus",otherFrame);window.removeEventListener("blur",blurred);clear()};
}
