import { useEffect, useLayoutEffect, useRef, useState } from "react";
import storyData from "./data.json";
import learningProjects from "./learning-projects.json";
import closingContent from "./closing-content.json";
import { references, vaultStudy } from "../data/portfolio";
import "./interactions.css";
import "./story.css";
import { HangingStrip } from "./HangingGallery";
import { Watch, Predict } from "./ReferenceScenes";
import { attachVaultEmbed } from "./vault-media.js";

type Variant = { file: string; width: number; height: number };
type Asset = { kind: string; variants: Variant[]; file?: string; duration?: number };
type Media = { id: string; caption: string };
type Moment = { title: string; text: string; media: Media[] };
type Composition = "evidence"|"workbench"|"watch"|"sequence"|"workspace"|"cinema"|"memory"|"achievement"|"comparison"|"recollection"|"model"|"process"|"roles"|"closing";
type Presentation = {composition:Composition;title:string;subtitle:string;lead:string;aside?:string;recollection?:string;order?:number[];beats?:{title:string;text:string;ids:string[]}[]};
type Chapter = { presentation:Presentation; id: string; title: string; period: string; paragraphs: string[]; moments: Moment[]; films?: unknown };
const chapters = storyData.chapters as Chapter[];
const assets = storyData.assets as Record<string, Asset>;
const asset = (file: string) => `/story/assets/${file}`;
function useReducedMotion() { const [reduced,setReduced]=useState(()=>matchMedia("(prefers-reduced-motion: reduce)").matches);useEffect(()=>{const media=matchMedia("(prefers-reduced-motion: reduce)");const change=()=>setReduced(media.matches);media.addEventListener("change",change);return()=>media.removeEventListener("change",change)},[]);return reduced; }
function animateOnce(element: Element, frames: Record<string, unknown>, duration = .42) { void import("motion/mini").then(({animate})=>{if(element.isConnected&&!matchMedia("(prefers-reduced-motion: reduce)").matches)animate(element as HTMLElement,frames as never,{duration,ease:"easeOut"});}); }

function Photograph({ item, tabIndex = 0 }: { item: Media; tabIndex?: number }) {
  const versions = assets[item.id].variants;
  return <button type="button" className="obs-image-trigger" tabIndex={tabIndex} data-inspect-image aria-label={`Inspect image: ${item.caption}`}><img src={asset(versions[1].file)} srcSet={`${asset(versions[0].file)} ${versions[0].width}w, ${asset(versions[1].file)} ${versions[1].width}w`} sizes="(min-width: 900px) 46vw, 90vw" width={versions[1].width} height={versions[1].height} alt={item.caption} loading="lazy" decoding="async" /></button>;
}

function VaultPlayer({id,title,poster,ratio="16/9"}:{id:string;title:string;poster?:string;ratio?:string}){
 const ref=useRef<HTMLDivElement>(null);useEffect(()=>ref.current?attachVaultEmbed(ref.current,id,title,poster):undefined,[id,title,poster]);return <div ref={ref} className="obs-vault-embed" data-vault-id={id} style={{aspectRatio:ratio}}/>;
}
function Recording({item}:{item:Media}){const meta=assets[item.id];return <figure className="obs-recording" data-source={item.id}><VaultPlayer id={item.id} title={item.caption} poster={asset(meta.variants[1].file)} ratio={`${meta.variants[1].width}/${meta.variants[1].height}`}/><figcaption>{item.caption} <span>Speech captions are being reviewed.</span></figcaption></figure>}

function Gallery({ items, reading, reduced, onViewAll }: { items: Media[]; reading: boolean; reduced: boolean; onViewAll: () => void }) {
  const [index, setIndex] = useState(0);
  const gallery = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null;
    const print = focused?.closest<HTMLElement>("[data-carousel-index]");
    if (print && gallery.current?.contains(print) && Number(print.dataset.carouselIndex) !== index)
      gallery.current.querySelector<HTMLButtonElement>('[data-active="true"] button[data-inspect-image]')?.focus({preventScroll:true});
  }, [index]);
  const change = (next: number) => { setIndex(Math.max(0,Math.min(items.length-1,next))); };
  if (reading || items.length === 1) return <div className="obs-archive-list">{items.map(item => <figure key={item.id} data-source={item.id} className="obs-photo"><Photograph item={item}/><figcaption>{item.caption}</figcaption></figure>)}</div>;
  return <div ref={gallery} className="obs-gallery" aria-label="Archive photographs"><HangingStrip index={index} onChange={change} reduced={reduced} captions={items.map(i=>i.caption)}>{items.map((photo,i)=><figure key={photo.id} className="obs-photo" data-source={photo.id}><Photograph item={photo} tabIndex={index===i?0:-1}/><figcaption>{photo.caption}</figcaption></figure>)}</HangingStrip><p className="obs-gallery-caption">{items[index].caption}</p><div className="obs-gallery-controls"><button type="button" onClick={() => change(index - 1)} disabled={index === 0} aria-label="Previous">←</button><span aria-live="polite"><span aria-hidden="true">{index + 1} / {items.length}</span><span className="sr-only">Photograph {index + 1} of {items.length}. {items[index].caption}</span></span><button type="button" onClick={() => change(index + 1)} disabled={index === items.length - 1} aria-label="Next">→</button></div><p className="obs-small">Drag to browse or use the arrows. Click the selected photograph to inspect and zoom.</p><div className="obs-gallery-all"><a href={`/story/reading.html#${items[0].id === "A054" ? "school" : documentSafeChapter(items[0].id)}`} onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();onViewAll();}}}>View this chapter’s full archive</a></div></div>;
}
function documentSafeChapter(id: string) { return chapters.find(c => c.moments.some(m => m.media.some(a => a.id === id)))?.id ?? "top"; }

function Sum() { const [a,setA]=useState("7"),[b,setB]=useState("5"),[result,setResult]=useState("7 + 5 = 12"); return <form className="obs-interaction" onSubmit={e=>{e.preventDefault();const x=Number(a),y=Number(b);setResult(a!==""&&b!==""&&Number.isFinite(x)&&Number.isFinite(y)?`${x} + ${y} = ${x+y}`:"Enter two numbers.");}}><div><p className="obs-kicker">Illustrative example · optional</p><h3>Two numbers. One sum.</h3><p>Try the idea behind our first program; the actual code is in the photographs below.</p></div><div className="obs-sum"><label>First number<input type="number" value={a} onChange={e=>setA(e.target.value)} min="-9999" max="9999" required /></label><label>Second number<input type="number" value={b} onChange={e=>setB(e.target.value)} min="-9999" max="9999" required /></label><button type="submit">Add numbers</button><output aria-live="polite">{result}</output></div></form>; }
const busViews = [
 {name:"Exterior",file:"bus-exterior.webp",text:"The first client asked for a bus conversion. The first payment was $100."},
 {name:"Kitchen",file:"bus-kitchen-1080.webp",text:"Cabinetry, appliances and the kitchen counter. A clean frame from the original tour."},
 {name:"Sleeping area",file:"bus-bedroom-1080.webp",text:"The raised bed, wood-lined ceiling and circular windows inside the conversion."},
 {name:"Living area",file:"bus-lounge-1080.webp",text:"The lounge and interior finishes, seen from the passage through the bus."},
 {name:"Rooftop",file:"bus-rooftop.webp",text:"The client returned for a cabin addition. We earned $180 in total."},
];
function BusExplorer(){const [choice,setChoice]=useState(1);const view=busViews[choice];const responsive=view.file.includes('1080');return <section className="obs-interaction" aria-label="Bus model views"><div><p className="obs-kicker">Explore the model · optional</p><h3>The space we built inside.</h3><div className="obs-actions">{busViews.map((v,i)=><button key={v.name} type="button" aria-pressed={choice===i} onClick={()=>setChoice(i)}>{v.name}</button>)}</div><p aria-live="polite">{view.text}</p></div><figure className="obs-photo"><a href={asset(view.file)} target="_blank" rel="noreferrer"><img src={asset(view.file)} srcSet={responsive?`${asset(view.file.replace('1080','400'))} 400w, ${asset(view.file)} 1080w`:undefined} sizes="(min-width:900px) 46vw, 90vw" width={responsive?1080:800} height={responsive?1080:800} alt={`${view.name} view from my saved bus model tour`} loading="lazy"/></a><figcaption>{view.name} · original tour frame. Open full image.</figcaption></figure></section>}
function LearningProjects(){return <section className="obs-learning-projects" aria-label="Early web learning projects"><div className="obs-moment-copy"><p className="obs-kicker">January 2021–March 2022 · learning by building</p><h3>Four projects that built my foundations.</h3><p>Current captures of the surviving sites, from the learning period I remember. Practice in HTML, CSS, JavaScript, React and APIs.</p></div><div className="obs-learning-grid">{learningProjects.map(project=><article key={project.id}><h4>{project.title}</h4><p>{project.detail}</p><figure className="obs-photo"><a href={project.url} target="_blank" rel="noreferrer" aria-label={`Inspect screenshot: ${project.title}`}><img src={asset(`learning-${project.id}-1200.webp`)} srcSet={`${asset(`learning-${project.id}-480.webp`)} 480w, ${asset(`learning-${project.id}-1200.webp`)} 1200w`} sizes="(min-width:900px) 42vw, 90vw" width={1200} height={833} alt={`${project.title} — actual project website captured in November 2026`} loading="lazy" decoding="async"/></a><figcaption>Live project capture · November 2026</figcaption></figure><a href={project.url} target="_blank" rel="noreferrer">Visit {project.title} →</a></article>)}</div><p className="obs-small">Learning projects → first frontend freelance work → Harigurus. The original dates are my recollection; the links let you explore the surviving work.</p></section>}
function CodeProgression({reduced}:{reduced:boolean}){const path=useRef<SVGPathElement>(null);useEffect(()=>{const node=path.current;if(!node||reduced)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){animateOnce(node,{opacity:[.4,1],transform:["translateX(-24px)","translateX(0px)"]},.8);observer.disconnect()}},{threshold:.3});observer.observe(node);return()=>observer.disconnect()},[reduced]);return <figure className="obs-code-illustration obs-paper-stage"><svg viewBox="0 0 900 210" role="img" aria-label="An illustrative progression from code, to lines, to a moving car"><path d="M30 30h220v145H30zM70 75h90M70 100h125M70 125h70M326 148H346L364 112H424L445 144H465V166H326ZM346 148 366 93H414L440 144M365 112 376 94M398 94V144M346 148H445M355 166V178H371V166M429 166V178H445V166"/><path ref={path} d="M585 145h25l25-50h100l35 50h45v25H585zM630 95l20-20h65l20 20M635 170a20 20 0 1 0 40 0M755 170a20 20 0 1 0 40 0"/><path d="M270 105h35m-10-8 10 8-10 8M490 105h55m-10-8 10 8-10 8"/></svg><figcaption>Illustration · from the idea to the moving car. The actual photographs follow.</figcaption><div className="obs-progression" aria-label="Code to moving car"><span>01 · Code</span><span>02 · Shape</span><span>03 · Moving car</span></div></figure>}
function VaultFilm({id,title}:{id:string;title:string}){return <article><h4>{title}</h4><VaultPlayer id={id} title={title}/><a href="https://yourvaultstorage.com/embed/c97d37579d0d94fb25ddaf562ed35889" target="_blank" rel="noreferrer">Open Vault playlist</a></article>}

function Films(){return <section className="obs-films"><p className="obs-kicker">Animation / Programming Guru</p><h3>The films I made.</h3><p>I made MJO-inspired videos and taught animation and programming on my channel.</p><div className="obs-films-grid">{storyData.films.map(f=><VaultFilm key={f.id} id={f.id} title={f.title}/>)}</div></section>}

function Rooftop() {
  const picture=useRef<HTMLElement>(null);
  useEffect(()=>{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;let disposed=false;let stop:(()=>void)|undefined;let controls:{stop:()=>void}|undefined;
    const begin=()=>{void import("motion").then(({scroll,animate})=>{const surface=picture.current,section=surface?.closest<HTMLElement>(".obs-hero-scroll"),node=section?.querySelector<HTMLElement>(".obs-hero-margin-note");if(!node||!section||disposed)return;const animation=animate(node,{opacity:[.65,1],transform:["translateY(0px)","translateY(-24px)"]},{autoplay:false,ease:"linear"});controls=animation;stop=scroll(animation,{target:section,offset:["start start","end start"]});});};window.addEventListener("scroll",begin,{once:true,passive:true});return()=>{disposed=true;window.removeEventListener("scroll",begin);stop?.();controls?.stop()};},[]);
  return <figure className="obs-rooftop"><picture ref={picture}><button type="button" className="obs-image-trigger" data-inspect-image aria-label="Inspect rooftop illustration"><img src="/story/assets/rooftop-1200.webp" srcSet="/story/assets/rooftop-640.webp 640w, /story/assets/rooftop-1200.webp 1200w, /story/assets/rooftop-1680.webp 1680w" sizes="100vw" width="1680" height="945" alt="Illustration of two brothers looking at stars from a rooftop" fetchPriority="high"/></button></picture><figcaption>Illustration of a remembered moment.</figcaption></figure>; }

function OpeningCollage(){
 const first=chapters.find(c=>c.id==="first-code")!.moments.flatMap(m=>m.media).find(m=>assets[m.id].kind!=="video")!;
 const school=chapters[0].moments[0].media[0];
 return <section className="obs-opening-collage" aria-label="Look, ask, make"><div className="obs-sky-paper"><p className="obs-kicker">Our rooftop classroom</p><svg viewBox="0 0 500 320" aria-hidden="true"><path d="M84 215 155 125 255 168 310 67 416 107M155 125 181 40M255 168 310 270"/>{[[84,215],[155,125],[255,168],[310,67],[416,107],[181,40],[310,270]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="3"/><path d={`M${x-9} ${y}h18M${x} ${y-9}v18`}/></g>)}</svg><p className="obs-note">Stars. Galaxies. Black holes.<br/>There was always another question.</p><span className="obs-small">Illustrative star map · not a dated sky record</span></div><div className="obs-opening-scraps"><figure className="obs-photo"><Photograph item={school}/><figcaption>The classroom saw one version of me.</figcaption></figure><figure className="obs-photo"><Photograph item={first}/><figcaption>Three hours. Our first lines of code.</figcaption></figure><p className="obs-note">Same curiosity.<br/>Different tools.</p></div><div className="obs-look-ask-make">{[{n:"01",title:"Look",subtitle:"A sky of possibilities",text:"We looked up at stars and talked about the universe. Every answer from my brother gave me another question."},{n:"02",title:"Ask",subtitle:"Curiosity takes root",text:"“Bhaiya, tell me something new.” Why does it move? How does it work? What if I could make one?"},{n:"03",title:"Make",subtitle:"Ideas into reality",text:"Questions became lines of code, shapes on a screen and a moving car. Small attempts were becoming things I could show."}].map(step=><div key={step.n}><span className="obs-step-number obs-note">{step.n}</span><div><h2>{step.title}</h2><p className="obs-kicker">{step.subtitle}</p><span className="obs-short-rule" aria-hidden="true"/><p>{step.text}</p></div><svg className="obs-step-arrow" viewBox="0 0 180 60" aria-hidden="true"><path d="M5 42Q90 0 170 40M153 24 173 42 148 48"/></svg></div>)}</div></section>;
}

function MomentSection({moment,index,reading,reduced,onViewAll}:{moment:Moment;index:number;reading:boolean;reduced:boolean;onViewAll:()=>void}) {
  const groups: {kind:"image"|"video";items:Media[]}[]=[];
  for(const item of moment.media){const kind=assets[item.id].kind==="video"?"video":"image";const last=groups.at(-1);if(kind==="image"&&last?.kind==="image")last.items.push(item);else groups.push({kind,items:[item]});}
  return <section className="obs-moment"><div className="obs-moment-copy"><p className="obs-kicker">{String(index+1).padStart(2,"0")} · From the archive</p><h3>{moment.title}</h3><p>{moment.text}</p></div><div className={`obs-moment-media ${moment.media.every(m=>assets[m.id].kind==="video")?"obs-recordings-group":""}`}>{groups.map(group=>group.kind==="video"?<Recording key={group.items[0].id} item={group.items[0]}/>:<Gallery key={group.items[0].id} items={group.items} reading={reading} reduced={reduced} onViewAll={onViewAll}/>)}</div></section>;
}
function cinematicMoments(chapter:Chapter):Moment[]{
 const p=chapter.presentation;
 if(p.beats){const map=new Map(chapter.moments.flatMap(m=>m.media).map(m=>[m.id,m]));return p.beats.map(b=>({title:b.title,text:b.text,media:b.ids.map(id=>{const media=map.get(id);if(!media)throw new Error(`Missing archive reference ${id}`);return media})}));}
 return p.order?p.order.map(i=>chapter.moments[i]):chapter.moments;
}
function LearningPath(){return <figure className="obs-learning-path"><figcaption>Illustration · a learning path, not a game capture</figcaption><ol><li><span className="obs-kicker">The foundations</span><h3>Code + 3D</h3><p>The programming and modelling began to connect.</p></li><li><span className="obs-kicker">The playable games</span><h3>Unity + C#</h3><p>Flappy Bird on my phone. A boar chasing the player through a forest.</p></li><li><span className="obs-kicker">The unfinished idea</span><h3>Learning to race</h3><p>Cars trained to drive themselves. A project that pushed beyond the maths I knew.</p></li></ol></figure>}
function RecoveredGame() {
  return <section className="obs-recovered-game" aria-labelledby="recovered-game-title">
    <div>
      <p className="obs-kicker">Recovered project · a later web experiment</p>
      <h3 id="recovered-game-title">Whack-a-Mole</h3>
      <p>Later, as I became more serious about HTML, CSS and JavaScript, I made this small browser game. A moving target, a countdown and a score made DOM events and timers something I could play with.</p>
      <p>The Unity projects could not be recovered. This is the game I found again.</p>
      <a href="https://whack-a-mole-byadarsh.netlify.app/" target="_blank" rel="noreferrer">Play the original game ↗</a>
      <p className="obs-small">Opens the original desktop-sized learning project in a new tab.</p>
    </div>
    <figure>
      <a href="https://whack-a-mole-byadarsh.netlify.app/" target="_blank" rel="noreferrer" aria-label="Inspect the Whack-a-Mole game screenshot">
        <img src="/story/assets/whack-a-mole-618.webp" srcSet="/story/assets/whack-a-mole-384.webp 384w, /story/assets/whack-a-mole-618.webp 618w" sizes="(max-width: 767px) calc(100vw - 32px), 40vw" width={618} height={618} loading="lazy" decoding="async" alt="Original Whack-a-Mole game: a mole appears in one square of a three-by-three grid" />
      </a>
      <figcaption>Actual game capture · the original target grid.</figcaption>
    </figure>
  </section>;
}
function ProfessionalTimeline(){return <div className="obs-professional-timeline">{closingContent.roles.map(role=><article key={role.company}><p className="obs-kicker">{role.period}</p><h3>{role.company}</h3><p className="obs-role-title">{role.role}</p><p>{role.detail}</p><p className="obs-small">{role.note}</p><div className="obs-evidence-links">{role.links.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} →</a>)}</div></article>)}</div>}
function StoryFeedback(){return <div className="obs-story-feedback">{references.map(reference=><figure key={reference.id}><button type="button" className="obs-image-trigger" data-inspect-image aria-label={`Inspect portrait of ${reference.name}`}><img src={`/images/references/${reference.id}-96.webp`} srcSet={`/images/references/${reference.id}-96.webp 96w, /images/references/${reference.id}-192.webp 192w`} width={96} height={96} loading="lazy" alt={reference.name}/></button><div><blockquote><p>{reference.quote}</p></blockquote><figcaption><cite>{reference.name}</cite><span>{reference.role}</span></figcaption></div></figure>)}<p className="obs-small">Roles are preserved as supplied with the original feedback.</p></div>}
function CurrentWork(){const image=vaultStudy.images.workspace;return <div className="obs-current-work"><figure className="obs-photo"><a href="https://yourvaultstorage.com/" target="_blank" rel="noreferrer" aria-label="Inspect Vault Storage screenshot"><img src={image.src} srcSet={image.srcSet} sizes="(min-width:900px) 80vw, 90vw" width={image.width} height={image.height} alt={image.alt} loading="lazy" decoding="async"/></a><figcaption>Vault Storage · actual connected GitHub workspace.</figcaption></figure><div className="obs-project-records">{closingContent.projects.map(project=><article key={project.title}><h3>{project.title}</h3><p>{project.detail}</p><div className="obs-evidence-links">{project.links.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} →</a>)}</div></article>)}</div></div>}
function ChapterSection({chapter,index,reading,reduced,onArchive}:{chapter:Chapter;index:number;reading:boolean;reduced:boolean;onArchive:()=>void}){
 const p=chapter.presentation,moments=reading?chapter.moments:cinematicMoments(chapter);
 const moment=(m:Moment,i:number)=><MomentSection key={m.media.map(v=>v.id).join("-")} moment={m} index={i} reading={reading} reduced={reduced} onViewAll={onArchive}/>;
 const watchScene=chapter.id==="english"&&!reading;
 return <section className={`obs-chapter obs-layout-${p.composition}`} id={chapter.id} aria-labelledby={`${chapter.id}-title`}>
  <header className="obs-chapter-header"><div className="obs-heading"><span className="obs-chapter-number obs-note" aria-hidden="true">{String(index+1).padStart(2,"0")}</span><div><p className="obs-kicker">{chapter.period}</p><h2 id={`${chapter.id}-title`} tabIndex={-1}>{(reading?chapter.title:p.title).split("\n").map((line,i)=><span className="obs-title-line" key={i}>{line}</span>)}</h2>{!reading&&<><p className="obs-subtitle">{p.subtitle}</p><span className="obs-short-rule" aria-hidden="true"/></>}</div></div>{!reading&&<div className="obs-chapter-intro"><p>{p.lead}</p>{p.aside&&<p className="obs-aside">{p.aside}</p>}</div>}</header>
  {reading&&<div className="obs-prose">{chapter.paragraphs.map((text,i)=><p key={i}>{text}</p>)}</div>}
  {chapter.id==="brother"&&<><Predict reduced={reduced}/>{!reading&&<p className="obs-outcome">I thought the heavier brick would hit first and the little pebble would take longer. Bhaiya released them from the same height, together. They reached the ground together. He explained that, when air resistance is negligible, their weight does not make one fall faster.</p>}</>}
  {watchScene?<div className="obs-watch-scene"><Watch reduced={reduced}/>{moment(moments[0],0)}</div>:chapter.id==="english"&&<Watch reduced={reduced}/>}
  {chapter.id==="brother"&&!reading&&<section className="obs-memory-detail"><h3>The last carriage.</h3><p>Bhaiya asked me to imagine standing at the centre of the roof of the last carriage of a moving train. If I jumped straight up, what would happen?</p><p>I thought the train would move past me while I was in the air. Since it was the last carriage, I imagined missing the train entirely, falling onto the ground and getting badly hurt—or even dying.</p><p>He explained that I would already be moving forward with the train. Jumping would not simply erase that forward motion. He used a stone tossed from a moving hand to help me picture it: the stone could keep moving forward after leaving the hand. It was a thought experiment, not something we did on a train.</p></section>}
  {chapter.id==="experiments"&&<CodeProgression reduced={reduced}/>}
  {chapter.id==="bus"&&<BusExplorer/>}
  {chapter.id==="web"&&<LearningProjects/>}
  {chapter.id==="professional-work"&&<ProfessionalTimeline/>}
  {chapter.id==="feedback"&&<StoryFeedback/>}
  {chapter.id==="today"&&<CurrentWork/>}
  {chapter.id==="games"&&!reading&&<LearningPath/>}
  {chapter.id==="games"&&<RecoveredGame/>}
  <div className="obs-beats">{moments.map((m,i)=>watchScene&&i===0?null:<div className={`obs-beat ${i===0?"obs-beat-primary":""}`} key={m.media.map(v=>v.id).join("-")}>{moment(m,i)}{chapter.id==="first-code"&&i===0&&<Sum/>}{chapter.id==="beginner"&&!reading&&i===0&&<aside className="obs-recollection"><p className="obs-kicker">As I remember it · the Platinum run</p><p>{p.recollection}</p></aside>}</div>)}</div>
  {Boolean(chapter.films)&&<Films/>}
  {chapter.id==="octoworlds"&&<p className="obs-note obs-next-note">From our rooftop to Octoworlds. Still following the questions.</p>}
 </section>
}
export default function Story({ onReturn }: { onReturn: () => void }) {
 const [reading,setReading]=useState(false);const reduced=useReducedMotion();const archiveTarget=useRef<string|null>(null);
 useLayoutEffect(()=>{if(!reading||!archiveTarget.current)return;const section=document.getElementById(archiveTarget.current);archiveTarget.current=null;section?.scrollIntoView({block:"start"});section?.querySelector<HTMLHeadingElement>("h2")?.focus({preventScroll:true});},[reading]);
 useLayoutEffect(()=>{
  const id=location.hash.slice(1);if(!chapters.some(c=>c.id===id))return;
  let cancelled=false;const cancel=()=>{cancelled=true};
  const align=()=>{if(cancelled||location.hash.slice(1)!==id)return;const target=document.getElementById(id);target?.scrollIntoView({block:"start"})};
  align();void document.fonts.ready.then(align);
  window.addEventListener("wheel",cancel,{passive:true});window.addEventListener("pointerdown",cancel,{passive:true});window.addEventListener("keydown",cancel);
  return()=>{cancelled=true;window.removeEventListener("wheel",cancel);window.removeEventListener("pointerdown",cancel);window.removeEventListener("keydown",cancel)};
 },[]);
 const heading=useRef<HTMLHeadingElement>(null);useEffect(()=>{if(history.state?.atlasStory&&!location.hash)heading.current?.focus({preventScroll:true});},[]);
 useEffect(()=>{const previous=document.title;document.title="The Rooftop Observatory — Adarsh Singh";return()=>{document.title=previous}},[]);
 useEffect(()=>{if(reduced||reading)return;const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const image=entry.target.querySelector("img");if(image)animateOnce(image,{opacity:[.9,1]});observer.unobserve(entry.target)}},{threshold:.15});document.querySelectorAll(".observatory .obs-moment").forEach(node=>observer.observe(node));return()=>observer.disconnect()},[reading,reduced]);
 return <div className={`observatory ${reading?"observatory--reading":""}`}><a className="obs-skip" href="#story-content">Skip to story</a>
 <header className="obs-header"><a href="/" onClick={e=>{e.preventDefault();onReturn()}}>← Back to the atlas</a><span>The rooftop observatory</span><button type="button" aria-pressed={reading} onClick={()=>setReading(!reading)}>{reading?"Cinematic view":"Reading view"}</button></header>
 <main id="story-content"><section className="obs-hero-scroll"><div className="obs-hero"><div className="obs-hero-copy"><p className="obs-kicker">Two brothers · one rooftop</p><h1 ref={heading} tabIndex={-1}>Bhaiya, tell me<br/><em>something new.</em></h1><p>At night, we would go up to the roof. I would ask my brother for another interesting thing, and he would point me towards a universe of questions.</p><a href="#school">Begin the story <span aria-hidden="true">↓</span></a></div><Rooftop/><span className="obs-hero-margin-note obs-note">Same sky.<br/>Bigger questions.</span></div></section>
 <nav className="obs-chapters" aria-label="Story chapters">{chapters.map((c,i)=><a href={`#${c.id}`} key={c.id}><span>{String(i+1).padStart(2,"0")}</span>{c.title}</a>)}</nav>
 {!reading&&<OpeningCollage/>}
 {chapters.map((chapter,index)=><ChapterSection chapter={chapter} index={index} key={chapter.id} reading={reading} reduced={reduced} onArchive={()=>{archiveTarget.current=chapter.id;setReading(true)}}/>)}
 </main><footer className="obs-footer"><div className="obs-footer-sky" aria-hidden="true"/><div className="obs-footer-content"><p className="obs-kicker">Different paths · the same sky</p><h2>My brother kept<br/>my curiosity alive.</h2><p>I am still following it.</p><div className="obs-footer-links"><a href="/" onClick={e=>{e.preventDefault();onReturn()}}>Return to the atlas <span aria-hidden="true">↗</span></a><a href="/story/reading.html" onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();archiveTarget.current="school";setReading(true);if(reading)document.getElementById("school")?.scrollIntoView()}}}>Open the full reading archive</a></div></div></footer></div>;
}
