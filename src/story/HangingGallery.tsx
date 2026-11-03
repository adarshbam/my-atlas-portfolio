import { useEffect, useRef, type ReactNode } from "react";

// Physics and string geometry adapted from kedhareswer's 21st component 36189.
// Motion schedules frames only while interacting/settling: no breeze or autoplay.
const physics = { stiffness: 70, swingStiffness: 38, swingDamping: 5.8, gain: .0034, maxAngle: .24, spacing: 1.08, toss: .16, dragThreshold: 7 };
const clamp = (v:number, a:number, b:number) => Math.max(a,Math.min(b,v));
type Drag = {id:number;x:number;y:number;off:number;lastX:number;lastTime:number;velocity:number;axis:"pending"|"horizontal"|"vertical"};

export function HangingStrip({children,captions,index,onChange,reduced}:{children:ReactNode[];captions:string[];index:number;onChange:(n:number)=>void;reduced:boolean}) {
 const root=useRef<HTMLDivElement>(null), path=useRef<SVGPathElement>(null), prints=useRef<(HTMLDivElement|null)[]>([]);
 const options=useRef({index,onChange,reduced,count:children.length});options.current={index,onChange,reduced,count:children.length};
 const state=useRef({width:0,cw:0,spacing:0,off:0,velocity:0,target:0,angles:[] as number[],velocities:[] as number[],visible:false,active:false,disposed:false,drag:null as Drag|null});
 const wake=useRef<()=>void>(()=>{}),paint=useRef<()=>void>(()=>{}),halt=useRef<()=>void>(()=>{});

 useEffect(()=>{
  const container=root.current;if(!container)return;const s=state.current;s.disposed=false;
  let motion:Pick<typeof import("motion"),"frame"|"cancelFrame">|undefined,loading:Promise<void>|undefined;
  const draw=()=>{
   const y0=24,sag=Math.min(40,s.width*.075);
   path.current?.setAttribute("d",`M0 ${y0}Q${s.width/2} ${y0+2*sag} ${s.width} ${y0}`);
   for(let i=0;i<options.current.count;i++){
    const node=prints.current[i];if(!node)continue;
    const centre=s.width/2+i*s.spacing-s.off,t=clamp(centre/s.width,0,1),y=y0+4*sag*t*(1-t);
    node.style.transform=`translate(${(centre-s.cw/2).toFixed(2)}px,${y.toFixed(2)}px) rotate(${options.current.reduced?0:(s.angles[i]||0)}rad)`;
    node.style.visibility=centre < -s.cw || centre > s.width+s.cw ? "hidden":"visible";
    node.style.zIndex=String(options.current.count-Math.abs(i-options.current.index));
   }
  };
  paint.current=draw;
  const settle=()=>{s.off=s.target;s.velocity=0;s.angles.fill(0);s.velocities.fill(0);draw()};
  const stop=()=>{motion?.cancelFrame(step);s.active=false;container.removeAttribute("data-moving")};
  const step=({delta}:{delta:number})=>{
   if(s.disposed||!s.visible||document.hidden||options.current.reduced){stop();settle();return}
   const dt=Math.min(delta/1000,.025),before=s.off;
   if(s.drag?.axis!=="horizontal"){
    s.velocity+=(physics.stiffness*(s.target-s.off)-2*Math.sqrt(physics.stiffness)*s.velocity)*dt;
    s.off+=s.velocity*dt;
   }
   const lineVelocity=s.drag?.axis==="horizontal"?s.drag.velocity:-(s.off-before)/Math.max(dt,.001);
   let moving=Math.abs(s.target-s.off)>.15||Math.abs(s.velocity)>.5||s.drag?.axis==="horizontal";
   for(let i=0;i<options.current.count;i++){
    let a=s.angles[i]||0,v=s.velocities[i]||0;
    v+=(-physics.swingStiffness*a-physics.swingDamping*v+lineVelocity*physics.gain)*dt;
    a=clamp(a+v*dt,-physics.maxAngle,physics.maxAngle);
    s.angles[i]=a;s.velocities[i]=v;
    if(Math.abs(a)>.0007||Math.abs(v)>.004)moving=true;
   }
   draw();if(!moving){stop();settle()}
  };
  wake.current=()=>{
   if(s.disposed)return;
   if(options.current.reduced||!s.visible||document.hidden){stop();settle();return}
   if(!motion){loading??=import("motion").then(({frame,cancelFrame})=>{motion={frame,cancelFrame};if(!s.disposed)wake.current()});return}
   if(!s.active){s.active=true;container.setAttribute("data-moving","true");motion.frame.update(step,true)}
  };
  halt.current=()=>{s.drag=null;container.removeAttribute("data-dragging");stop();settle()};
  const resize=new ResizeObserver(()=>{
   const width=container.clientWidth,cw=Math.min(width*.64,440),previous=s.spacing;
   s.width=width;s.cw=cw;s.spacing=cw*physics.spacing;
   s.off=previous?s.off/previous*s.spacing:options.current.index*s.spacing;s.target=options.current.index*s.spacing;
   container.style.setProperty("--obs-print-width",`${cw}px`);draw();wake.current();
  });resize.observe(container);
  const visible=new IntersectionObserver(([entry])=>{s.visible=entry.isIntersecting;if(s.visible)wake.current();else halt.current()});visible.observe(container);
  const hide=()=>{if(document.hidden)halt.current()};document.addEventListener("visibilitychange",hide);
  return()=>{s.disposed=true;stop();resize.disconnect();visible.disconnect();document.removeEventListener("visibilitychange",hide);wake.current=()=>{};paint.current=()=>{};halt.current=()=>{}};
 },[]);
 useEffect(()=>{const s=state.current;s.target=index*s.spacing;wake.current()},[index,reduced]);
 const choose=(i:number)=>{options.current.onChange(clamp(i,0,children.length-1))};
 const release=(cancel=false)=>{
  const s=state.current,d=s.drag;if(!d)return;s.drag=null;root.current?.removeAttribute("data-dragging");
  if(d.axis==="horizontal"){
   const next=cancel?options.current.index:clamp(Math.round((s.off-d.velocity*physics.toss)/s.spacing),0,children.length-1);
   s.target=next*s.spacing;s.velocity=cancel?0:-d.velocity;choose(next);wake.current();
  }
 };
 return <div className="obs-hanging" role="region" aria-roledescription="carousel" aria-label={`Archive photographs: ${captions[0]}`} tabIndex={0} onKeyDown={e=>{
  if(e.key==="ArrowRight"||e.key==="ArrowLeft"||e.key==="Home"||e.key==="End"){
   e.preventDefault();e.stopPropagation();choose(e.key==="Home"?0:e.key==="End"?children.length-1:index+(e.key==="ArrowRight"?1:-1));
  }
 }}><div className="obs-hanging-window" ref={root} onDragStart={e=>e.preventDefault()} onPointerDown={e=>{
  if(e.button!==0||!e.isPrimary)return;const s=state.current;s.drag={id:e.pointerId,x:e.clientX,y:e.clientY,off:s.off,lastX:e.clientX,lastTime:e.timeStamp,velocity:0,axis:"pending"};
 }} onPointerMove={e=>{
  const s=state.current,d=s.drag;if(!d||d.id!==e.pointerId)return;
  const dx=e.clientX-d.x,dy=e.clientY-d.y;
  if(d.axis==="pending"&&Math.max(Math.abs(dx),Math.abs(dy))>physics.dragThreshold){d.axis=Math.abs(dx)>Math.abs(dy)?"horizontal":"vertical";if(d.axis==="horizontal"){e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.setAttribute("data-dragging","true")}}
  if(d.axis!=="horizontal")return;
  const dt=Math.max(8,e.timeStamp-d.lastTime);d.velocity=.65*((e.clientX-d.lastX)/dt*1000)+.35*d.velocity;d.lastX=e.clientX;d.lastTime=e.timeStamp;
  let off=d.off-dx,maximum=(children.length-1)*s.spacing;
  if(off<0)off*=.22;if(off>maximum)off=maximum+(off-maximum)*.22;
  s.off=off;if(reduced){s.angles.fill(0);paint.current()}else{paint.current();wake.current()}
 }} onPointerUp={e=>{
  const s=state.current,d=s.drag;if(!d||d.id!==e.pointerId)return;
  if(d.axis==="pending"){
   const print=(e.target as Element).closest<HTMLElement>("[data-carousel-index]");
   if(print){const i=Number(print.dataset.carouselIndex);if(i===index&&!reduced){s.velocities[i]=(s.velocities[i]||0)+.9;wake.current()}else choose(i)}
  }
  release();if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 }} onPointerCancel={()=>release(true)} onLostPointerCapture={e=>{if(e.target===e.currentTarget)release(true)}}>
 <svg className="obs-hanging-string" aria-hidden="true"><path ref={path}/></svg>
 {children.map((child,i)=><div key={i} ref={node=>{prints.current[i]=node}} className="obs-hanging-position" data-carousel-index={i} aria-hidden={i!==index||undefined}><div className="obs-hanging-card" data-active={i===index}><span className="obs-peg" aria-hidden="true"/>{child}</div></div>)}
 </div></div>;
}
