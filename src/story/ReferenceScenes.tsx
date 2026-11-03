import { useEffect, useRef, useState } from "react";

import { useAlienAudio } from "./useAlienAudio";
import { useDropImpact } from "./useDropImpact";

const move = async (node: Element | null, frames: Record<string, unknown>, duration = .6, ease: "easeOut" | "easeIn" = "easeOut") => {
  if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { animate } = await import("motion/mini");
  if (node.isConnected) return animate(node as HTMLElement, frames as never, { duration, ease });
};

// Newly drawn fan illustrations of the original ten; no official image assets.
export const originalTen = [
  {name:"Heatblast", path:"M88 66 78 48 91 33 87 15 104 28 115 8 125 32 139 23 136 48 125 66 133 84 151 99 163 148 150 153 134 119 128 148 140 202 119 211 106 164 98 211 76 205 84 150 78 117 66 149 51 143 64 96 84 83Z", detail:"M94 51 104 55 100 60M115 55 125 50 119 60M96 85 110 101 124 84M91 117 109 126 126 112M102 144 112 151"},
  {name:"Wildmutt", path:"M65 80 74 55 90 43 113 45 129 61 140 83 164 107 174 166 153 169 143 139 132 147 145 184 131 194 110 162 85 158 68 193 45 190 59 151 45 137 38 175 18 170 27 108Z", detail:"M76 67 90 79 119 78 130 68M79 91 97 98 121 91M53 111 68 119M138 104 149 114"},
  {name:"Diamondhead", path:"M88 65 82 34 102 14 125 34 120 65 146 75 165 104 157 144 141 144 135 115 128 149 139 207 115 211 102 160 90 210 65 207 78 151 71 119 62 145 46 138 41 105 62 76Z", detail:"M83 34 104 40 124 34M104 41 103 63M82 81 104 104 127 80M78 113 103 132 130 111M103 132 103 155"},
  {name:"XLR8", path:"M82 61 67 37 87 33 106 15 127 23 131 47 116 65 129 82 138 111 161 99 169 110 135 131 118 114 119 148 138 183 150 201 130 210 115 192 101 168 83 195 75 210 53 208 56 190 79 149 77 113 59 137 40 130 34 117 53 119 68 89Z M118 135Q175 140 184 180Q152 162 124 158Z", detail:"M89 37 119 34 116 47 97 51M91 72 105 89 119 76M89 109 111 109"},
  {name:"Grey Matter", path:"M61 69Q41 44 57 23Q73 7 104 13Q140 10 153 34Q164 62 137 76L124 87 126 111 154 136 145 146 122 131 120 157 141 198 125 208 106 174 89 208 73 199 90 159 87 129 62 145 52 135 82 109 84 86Z", detail:"M62 37Q74 25 88 37L87 62Q66 64 62 37ZM115 37Q131 24 143 37Q142 63 119 62ZM93 75Q104 80 115 74"},
  {name:"Four Arms", path:"M86 61 79 36 92 18 113 18 127 37 120 62 141 68 161 87 179 77 190 94 166 115 144 105 139 119 170 135 186 158 172 170 154 150 130 144 125 160 140 208 114 212 103 178 90 212 64 207 80 160 75 142 52 150 36 171 19 161 37 135 67 120 61 104 40 115 17 94 28 77 49 88 66 69Z", detail:"M87 39 98 42M109 42 120 38M91 54 114 54M79 80 103 97 129 80M83 122 124 122"},
  {name:"Stinkfly", path:"M83 72 79 52 63 28 73 20 94 44 111 43 131 18 141 25 125 53 121 72 136 86 132 121 118 143 131 182 119 192 102 164 86 193 73 184 86 143 71 120 69 87Z M72 86Q6 35 13 112L70 124ZM132 84Q190 30 188 107L134 124Z M102 133Q154 145 166 185L149 181Q132 159 110 162Z", detail:"M81 60 92 65M112 64 124 58M84 94 118 94M87 112 116 112M24 86 66 109M177 85 139 108"},
  {name:"Ripjaws", path:"M85 68 79 42 91 19 106 27 122 17 135 46 124 70 138 90 151 129 168 134 161 149 136 143 123 120 124 153 139 198 124 208 104 176 87 208 68 201 83 155 80 120 68 143 46 148 34 135 54 127 67 90Z", detail:"M84 43 101 50 122 42 118 65 105 72 92 65ZM90 49 96 58 101 51 106 61 112 50 117 55M89 91 119 91M93 106 115 106"},
  {name:"Upgrade", path:"M81 63Q63 34 84 17Q109 3 131 23Q145 42 127 64L143 81 158 120 177 144 163 161 134 130 127 116 124 155 144 205 118 211 104 169 90 210 63 204 83 153 79 117 64 138 39 159 25 145 50 118 64 82Z", detail:"M91 37Q106 22 120 37Q119 53 104 54Q90 52 91 37ZM104 54V99H134M104 99H74M104 99V154M74 88V117M134 88V117M104 154 80 185M104 154 130 186"},
  {name:"Ghostfreak", path:"M80 63Q63 28 87 14Q125 0 140 32Q146 55 126 73L142 92 155 128 174 140 164 155 141 145 127 122 128 164Q140 198 158 210Q123 216 105 191Q84 218 50 206Q80 185 82 154L79 121 64 143 41 151 32 136 53 126 65 89Z", detail:"M105 22 96 42 110 62 99 85 112 108 102 132 116 155 105 186M117 38Q135 35 132 51Q118 58 117 38Z"},
];

export function Watch({reduced}:{reduced:boolean}) {
  const [choice,setChoice]=useState(0), [phase,setPhase]=useState("selection"), [sound,setSound]=useState(false);
  const [turn,setTurn]=useState(0); const ring=useRef<SVGGElement>(null), wash=useRef<HTMLDivElement>(null);
  const scene=useRef<HTMLElement>(null);
  const audio=useAlienAudio(scene);
  const timer=useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  const select=(index:number,delta=1)=>{audio.stop();audio.clearError();if(timer.current)clearTimeout(timer.current);setChoice((index+10)%10);setPhase("selection");setTurn(t=>t+delta);};
  useEffect(()=>{if(ring.current&&!reduced)void move(ring.current,{transform:`rotate(${turn*36}deg)`},.3)},[turn,reduced]);
  const activate=()=>{
    if(timer.current)clearTimeout(timer.current);
    setPhase(reduced?"revealed":"activating");
    void move(wash.current,{opacity:[0,.45,0]},.6);
    if(!reduced)timer.current=setTimeout(()=>setPhase("revealed"),420);
    if(sound)audio.play(originalTen[choice].name);
  };
  const alien=originalTen[choice];
  return <section ref={scene} className="obs-interaction obs-watch" aria-labelledby="watch-title"><div className="obs-interaction-copy"><p className="obs-kicker">03 / A watch of my own</p><h3 id="watch-title">Ten possibilities.<br/>One small dial.</h3><p>Ben 10 made me want to build an Omnitrix of my own. First, I made it out of what I had. Then I practised speaking English through the world it opened.</p><p className="obs-note">Turn the dial.<br/>Who will you become?</p><label className="obs-alien-select">Choose an alien<select value={choice} onChange={e=>select(Number(e.target.value))}>{originalTen.map((a,i)=><option key={a.name} value={i}>{a.name}</option>)}</select></label><button type="button" aria-pressed={sound} onClick={()=>{audio.stop();audio.clearError();setSound(!sound)}}>{sound?"Sound on":"Sound off"}</button><p className="obs-small">Newly drawn fan illustrations · character sound clips</p></div><div className="obs-watch-panel" data-phase={phase}><div className="obs-transform-wash" ref={wash} aria-hidden="true"/><div className="obs-dial"><button type="button" aria-label="Previous alien" onClick={()=>select(choice-1,-1)}>←</button><button type="button" className="obs-watch-face" aria-label={`Activate ${alien.name}`} onClick={activate}><svg viewBox="0 0 320 440" aria-hidden="true"><path className="watch-strap" d="M110 0H210L225 150V290L210 440H110L95 290V150Z"/><path className="watch-strap-seam" d="M130 0V90M190 0V90M130 350V440M190 350V440M118 35H202M116 58H204M115 382H205M118 405H202"/><path className="watch-body" d="M85 100 235 100 280 165 280 275 235 340H85L40 275V165Z"/><circle className="watch-bezel" cx="160" cy="220" r="112"/><g className="watch-ring" ref={ring}>{Array.from({length:10},(_,i)=><path key={i} transform={`rotate(${i*36} 160 220)`} d="M153 114H167L165 127H155Z"/>)}</g><circle className="watch-screen" cx="160" cy="220" r="87"/><g className="obs-alien-silhouette" transform="translate(94 140) scale(.65)"><path d={alien.path}/><path className="alien-detail" d={alien.detail}/></g><path className="watch-bolts" d="M57 170h14v20H57ZM249 170h14v20h-14ZM57 250h14v20H57ZM249 250h14v20h-14Z"/></svg><span className="obs-sr">Press the centre to transform</span></button><button type="button" aria-label="Next alien" onClick={()=>select(choice+1)}>→</button></div><div className="obs-watch-readout" aria-live="polite"><span className="obs-small" role="status">{audio.error}</span><span className="obs-kicker">{String(choice+1).padStart(2,"0")} / 10</span><strong>{alien.name}</strong><span>{phase==="revealed"?"Transformation complete. Press again to replay.":phase==="activating"?"Transforming…":"Press the watch to transform."}</span></div></div></section>;
}

export function Predict({reduced}:{reduced:boolean}) {
  const [answer,setAnswer]=useState(""),[run,setRun]=useState(0); const falling=useRef<SVGGElement>(null);
  const scene=useRef<HTMLElement>(null),impactRequest=useRef(0),sounded=useRef(0);
  const {arm,play}=useDropImpact(scene);
  useEffect(()=>{
    const node=falling.current;if(!node||!run)return;
    let cancelled=false,animation:{stop:()=>void}|undefined;
    const request=impactRequest.current;
    const land=()=>{if(!cancelled&&sounded.current!==run){sounded.current=run;void play(request)}};
    if(reduced){node.style.transform="translateY(180px)";land()}
    else void import("motion/mini").then(({animate})=>{
      if(cancelled)return;
      const controls=animate(node,{transform:["translateY(0px)","translateY(180px)"]},{duration:.8,ease:"easeIn"});
      animation=controls;void controls.finished.then(land);
    });
    return()=>{cancelled=true;animation?.stop()};
  },[run,reduced,play]);
  const drop=(value:string)=>{impactRequest.current=arm();setAnswer(value);setRun(n=>n+1)};
  return <section ref={scene} className="obs-interaction obs-physics"><div className="obs-interaction-copy"><p className="obs-kicker">02 / The first surprise</p><h3>Surely the brick<br/>would fall first?</h3><p>That was my answer. Bhaiya held up a brick and a pebble, then let them go together.</p><div className="obs-actions">{["The brick","The pebble","Together"].map(a=><button type="button" key={a} aria-pressed={answer===a} onClick={()=>drop(a)}>{a}</button>)}</div><button className="obs-replay" type="button" onClick={()=>drop(answer||"Together")}>Replay the drop ↻</button><p aria-live="polite">{answer?"They landed together. Ignoring air resistance, both fall with the same acceleration.":"Make a prediction, or keep scrolling."}</p></div><figure className="obs-gravity-stage"><div className="obs-gravity-labels"><span>The brick</span><span>The pebble</span></div><svg className="obs-gravity" viewBox="0 0 640 360" role="img" aria-label="A brick and pebble released from equal height, landing together"><path className="gravity-guides" d="M80 130H560M80 310H560M120 130V310M520 130V310"/><g ref={falling} className="gravity-objects"><g className="gravity-brick"><path d="M148 82 168 70 246 70 266 82V130H148Z"/><path d="M148 82H266M168 70V82M207 82V106M148 106H266M180 106V130M237 106V130"/></g><path className="gravity-pebble" d="M438 111Q435 94 451 91Q466 86 478 100Q491 117 478 128Q459 135 445 125Z"/></g><path className="gravity-ground" d="M70 310H570M84 322H150M180 322H300M350 322H430M470 322H556"/></svg><figcaption>Same height. Same moment.<br/><span className="obs-note">A small experiment. A very big question.</span></figcaption></figure></section>;
}

