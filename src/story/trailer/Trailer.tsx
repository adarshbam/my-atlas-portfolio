import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { originalTen } from "../ReferenceScenes";
import { Caption } from "@/trailer/Caption";
import { layoutScenes, mark, put, sceneAttributes, segment, useAfterFirstPaint, useSceneScroll, type SceneDef, type SceneFrame } from "@/trailer/engine";
import "@/trailer/base.css";
import "./trailer.css";

/*
 * Story trailer (docs/STORY-TRAILER-2026-11-22.md). The scroll engine is shared
 * with the atlas run: src/trailer/engine.ts.
 */

const SCENES: readonly SceneDef[] = [
  {
    id: "look",
    label: "Look",
    units: 3.3,
    span: 3,
    segments: [
      ["--copy", 0.05, 0.16],
      ["--rise", 0.08, 0.3],
      ["--cap", 0.28, 0.34],
      ["--draw1", 0.32, 0.5],
      ["--out1", 0.54, 0.6],
      ["--draw2", 0.6, 0.74],
      ["--fall", 0.76, 0.92],
      ["--scene2", 0.28, 1],
    ],
    beats: [0.28, 0.58, 0.92],
    rest: 0.47,
  },
  { id: "ask", label: "Ask", units: 1.5, segments: [], beats: [0.04, 0.42, 0.7], rest: 0.3 },
  { id: "code", label: "First code", units: 1.4, segments: [["--a", 0.35, 0.6]], beats: [0.04, 0.35], rest: 0.3 },
  {
    id: "make",
    label: "Make",
    units: 2,
    segments: [
      ["--a", 0.06, 0.36],
      ["--b", 0.34, 0.46],
      ["--c", 0.54, 0.66],
    ],
    beats: [0.04, 0.34, 0.54],
    rest: 0.3,
  },
  { id: "deliver", label: "Deliver", units: 2, segments: [["--a", 0.04, 0.3]], beats: [0.04, 0.4, 0.7], rest: 0.25 },
  { id: "close", label: "Contact", units: 1.3, segments: [["--a", 0.25, 0.85]], beats: [], rest: 0.9 },
];

const LAYOUT = layoutScenes(SCENES);

const ROOFTOP_GONE = 0.3; // fraction of the first scene's span
const STARS_IN: readonly [number, number] = [0.14, 0.3];

// Story-only frame work: the star field arrives, the rooftop leaves the tab order, the fall accelerates.
const LOOK = LAYOUT.scenes[0];
const lookSpan = LOOK.span ?? LOOK.units;
const shape = (name: string, value: number) => (name === "--fall" ? value * value : value);
const onFrame = ({ position, stage, nodes }: SceneFrame) => {
  put(stage, "--sky", segment(position / lookSpan, ...STARS_IN));
  const look = nodes[0];
  if (look && look.dataset.state === "active") mark(look, "past", String((position - LOOK.start) / lookSpan >= ROOFTOP_GONE));
};
const onReset = ({ nodes }: Pick<SceneFrame, "nodes">) => {
  if (nodes[0]) delete nodes[0].dataset.past;
};

// Fixed seed: the same sky on every visit and in every screenshot.
const STARS = (() => {
  let seed = 20261122;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length: 140 }, () => ({
    x: Math.round(next() * 1000),
    y: Math.round(next() * 600),
    r: Number((0.6 + next() * 1.4).toFixed(2)),
    o: Number((0.35 + next() * 0.65).toFixed(2)),
  }));
})();

// Coordinates of the story's star map; `at` is when the drawn line reaches each star.
const CONSTELLATION_STARS = [
  { x: 84, y: 215, at: 0.01 },
  { x: 155, y: 125, at: 0.14 },
  { x: 255, y: 168, at: 0.3 },
  { x: 310, y: 67, at: 0.45 },
  { x: 416, y: 107, at: 0.58 },
  { x: 181, y: 40, at: 0.74 },
  { x: 310, y: 270, at: 0.94 },
];

// Three of the ten newly drawn silhouettes, one per caption line.
const DIAL = ["Heatblast", "Four Arms", "XLR8"].map((name) => originalTen.find((alien) => alien.name === name)!);

// Runs above and to the right of the contact block and ends just over the two brothers,
// so the line never crosses the text.
const CLOSING_STARS: readonly (readonly [number, number])[] = [
  [40, 60],
  [200, 20],
  [400, 50],
  [590, 90],
  [610, 190],
  [500, 205],
];

export type TrailerMedia = Record<"firstCode" | "car" | "bus", ReactNode>;
export type TrailerShot = { src: string; srcSet?: string; alt: string; caption: string };


export function Trailer({
  reduced,
  children,
  media,
  shots,
  closing,
}: {
  reduced: boolean;
  /** Hero copy: kicker, h1, lead and links. */
  children: ReactNode;
  media: TrailerMedia;
  /** Three real screenshots for the Deliver scene, in caption order. */
  shots: readonly [TrailerShot, TrailerShot, TrailerShot];
  /** Contact and return links for the closing scene. */
  closing: ReactNode;
}) {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // Photographs for the later scenes mount after the opening paint, so the rooftop
  // (the largest paint) never shares the network with them.
  const [late, setLate] = useState(false);
  // The rooftop is the page's largest paint: the later scenes' photographs wait for it.
  useAfterFirstPaint(setLate, () => document.querySelector<HTMLImageElement>(".obs-rooftop img"));
  useSceneScroll({ track, stage, layout: LAYOUT, reduced, shape, onFrame, onReset });

  const sceneProps = (id: string) => ({ className: `obs-trailer-scene obs-trailer-${id}`, ...sceneAttributes(LAYOUT, id) });

  return (
    <section
      ref={track}
      className="obs-trailer"
      data-mode={reduced ? "still" : "scroll"}
      aria-label="The story in seven scenes"
      style={{ "--obs-trailer-units": LAYOUT.total } as CSSProperties}
    >
      {/* Landing points for the tick rail. In still mode they sit on the scenes themselves. */}
      {LAYOUT.scenes.map((scene) => (
        <span
          key={scene.id}
          id={`trailer-${scene.id}`}
          className="obs-trailer-anchor"
          style={{ "--at-unit": scene.start + scene.units * scene.rest } as CSSProperties}
        />
      ))}

      <div ref={stage} className="obs-trailer-stage">
        <svg className="obs-trailer-stars" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {STARS.map((star, index) => (
            <circle key={index} cx={star.x} cy={star.y} r={star.r} opacity={star.o} />
          ))}
        </svg>

        {/* Scenes 1 and 2: the rooftop, then Look */}
        <div {...sceneProps("look")}>
          <div className="obs-trailer-layer obs-trailer-rooftop">
            <figure className="obs-rooftop obs-trailer-painting">
              <picture>
                <button type="button" className="obs-image-trigger" data-inspect-image aria-label="Inspect rooftop illustration">
                  <img
                    src="/story/assets/rooftop-1200.webp"
                    srcSet="/story/assets/rooftop-640.webp 640w, /story/assets/rooftop-1200.webp 1200w, /story/assets/rooftop-1680.webp 1680w"
                    sizes="100vw"
                    width="1680"
                    height="945"
                    alt="Illustration of two brothers looking at stars from a rooftop"
                    fetchPriority="high"
                  />
                </button>
              </picture>
              <figcaption>Illustration of a remembered moment.</figcaption>
            </figure>
            <div className="obs-hero">
              {children}
              <span className="obs-hero-margin-note obs-note">
                Same sky.
                <br />
                Bigger questions.
              </span>
            </div>
          </div>
          <div className="obs-trailer-layer obs-trailer-split obs-trailer-look">
            <div className="obs-trailer-art">
              <svg className="obs-trailer-constellation" viewBox="0 0 500 320" role="img" aria-label="An illustrative constellation, drawn star by star">
                <path className="obs-trailer-line obs-trailer-line-main" pathLength={1} d="M84 215 155 125 255 168 310 67 416 107" />
                <path className="obs-trailer-line obs-trailer-line-north" pathLength={1} d="M155 125 181 40" />
                <path className="obs-trailer-line obs-trailer-line-south" pathLength={1} d="M255 168 310 270" />
                {CONSTELLATION_STARS.map((star) => (
                  <g key={`${star.x}-${star.y}`} className="obs-trailer-node" style={{ "--at": star.at } as CSSProperties}>
                    <circle cx={star.x} cy={star.y} r="3" />
                    <path d={`M${star.x - 9} ${star.y}h18M${star.x} ${star.y - 9}v18`} />
                  </g>
                ))}
              </svg>
              <svg className="obs-trailer-gravity" viewBox="0 0 640 360" role="img" aria-label="A brick and a pebble released from the same height, landing together">
                <path className="obs-trailer-line obs-trailer-guides" pathLength={1} d="M80 130H560M120 130V310M520 130V310" />
                <text x="207" y="52" textAnchor="middle">The brick</text>
                <text x="458" y="52" textAnchor="middle">The pebble</text>
                <g className="obs-trailer-objects">
                  <path className="obs-trailer-line obs-trailer-brick" pathLength={1} d="M148 82 168 70 246 70 266 82V130H148ZM148 82H266M168 70V82M207 82V106M148 106H266M180 106V130M237 106V130" />
                  <path className="obs-trailer-line obs-trailer-pebble" pathLength={1} d="M438 111Q435 94 451 91Q466 86 478 100Q491 117 478 128Q459 135 445 125Z" />
                </g>
                <path className="obs-trailer-line obs-trailer-ground" pathLength={1} d="M70 310H570" />
              </svg>
            </div>
            <Caption
              word="Look."
              lines={[
                "We looked up at stars and talked about the universe. Every answer from my brother gave me another question.",
                "Surely the brick would fall first?",
                "They landed together.",
              ]}
              note="Illustrative star map · not a dated sky record"
            />
          </div>
        </div>

        {/* Scene 3: Ask — the watch */}
        <div {...sceneProps("ask")}>
          <div className="obs-trailer-layer obs-trailer-split obs-trailer-pass">
            <div className="obs-trailer-art">
              <svg className="obs-trailer-watch" viewBox="0 0 320 440" role="img" aria-label="The homemade Omnitrix, its dial turning between three silhouettes">
                <path className="watch-strap" d="M110 0H210L225 150V290L210 440H110L95 290V150Z" />
                <path className="watch-strap-seam" d="M130 0V90M190 0V90M130 350V440M190 350V440M118 35H202M116 58H204M115 382H205M118 405H202" />
                <path className="watch-body" d="M85 100 235 100 280 165 280 275 235 340H85L40 275V165Z" />
                <circle className="watch-bezel" cx="160" cy="220" r="112" />
                <g className="watch-ring obs-trailer-ring">
                  {Array.from({ length: 10 }, (_, index) => (
                    <path key={index} transform={`rotate(${index * 36} 160 220)`} d="M153 114H167L165 127H155Z" />
                  ))}
                </g>
                <circle className="watch-screen" cx="160" cy="220" r="87" />
                {DIAL.map((alien, index) => (
                  <g key={alien.name} className="obs-alien-silhouette obs-trailer-alien" data-line={index + 1} transform="translate(94 140) scale(.65)">
                    <path d={alien.path} />
                    <path className="alien-detail" d={alien.detail} />
                  </g>
                ))}
                <path className="watch-bolts" d="M57 170h14v20H57ZM249 170h14v20h-14ZM57 250h14v20H57ZM249 250h14v20h-14Z" />
              </svg>
            </div>
            <Caption
              word="Ask."
              lines={[
                "Why does it move? How does it work? What if I could make one?",
                "Ben 10 made me want to build an Omnitrix of my own. First, I made it out of what I had.",
                "Then I practised speaking English through the world it opened.",
              ]}
              note="Newly drawn fan illustrations"
            />
          </div>
        </div>

        {/* Scene 4: Make — the first program */}
        <div {...sceneProps("code")}>
          <div className="obs-trailer-wash" aria-hidden="true" />
          <div className="obs-trailer-layer obs-trailer-split obs-trailer-pass">
            <div className="obs-trailer-art obs-trailer-evidence">
              {late && media.firstCode}
              <p className="obs-trailer-sum">
                <span>7 + 5 = 12</span>
              </p>
            </div>
            <Caption word="Make." lines={["Three hours. Our first lines of code.", "Two numbers. One sum."]} />
          </div>
        </div>

        {/* Scene 5: Make — the moving car and the first client */}
        <div {...sceneProps("make")}>
          <div className="obs-trailer-layer obs-trailer-split obs-trailer-pass">
            <div className="obs-trailer-art obs-trailer-built">
              <svg className="obs-trailer-progression" viewBox="0 0 900 210" role="img" aria-label="An illustrative progression from code, to lines, to a moving car">
                <path className="obs-trailer-line" pathLength={1} d="M30 30h220v145H30zM70 75h90M70 100h125M70 125h70" />
                <path className="obs-trailer-line" pathLength={1} d="M270 105h35m-10-8 10 8-10 8" />
                <path className="obs-trailer-line" pathLength={1} d="M326 148H346L364 112H424L445 144H465V166H326ZM346 148 366 93H414L440 144M365 112 376 94M398 94V144M346 148H445M355 166V178H371V166M429 166V178H445V166" />
                <path className="obs-trailer-line" pathLength={1} d="M490 105h55m-10-8 10 8-10 8" />
                <path className="obs-trailer-line obs-trailer-car" pathLength={1} d="M585 145h25l25-50h100l35 50h45v25H585zM630 95l20-20h65l20 20M635 170a20 20 0 1 0 40 0M755 170a20 20 0 1 0 40 0" />
              </svg>
              <div className="obs-trailer-prints">
                <div className="obs-trailer-print">{late && media.car}</div>
                <div className="obs-trailer-print">{late && media.bus}</div>
              </div>
            </div>
            <Caption
              word="Make."
              lines={[
                "Then the lines started moving.",
                "From the idea to the moving car.",
                "The first client asked for a bus conversion. The first payment was $100.",
              ]}
              note="Illustration above · actual photograph and tour frame below"
            />
          </div>
        </div>

        {/* Scene 6: Deliver — real work in a browser frame */}
        <div {...sceneProps("deliver")}>
          <div className="obs-trailer-layer obs-trailer-split obs-trailer-pass">
            <div className="obs-trailer-art obs-trailer-evidence">
              <div className="obs-trailer-browser">
                <div className="obs-trailer-screens">
                  {late && shots.map((shot, index) => (
                    <figure key={shot.src} data-line={index + 1}>
                      <img src={shot.src} srcSet={shot.srcSet} sizes="(min-width: 800px) 46vw, 90vw" alt={shot.alt} loading="lazy" decoding="async" />
                      <figcaption>{shot.caption}</figcaption>
                    </figure>
                  ))}
                </div>
                <svg className="obs-trailer-chrome" viewBox="0 0 1200 900" preserveAspectRatio="none" aria-hidden="true">
                  <path className="obs-trailer-line" pathLength={1} d="M1 1H1199V899H1V1M1 66H1199" />
                  <path className="obs-trailer-line" pathLength={1} d="M150 33H900" />
                  <circle cx="36" cy="33" r="8" />
                  <circle cx="66" cy="33" r="8" />
                  <circle cx="96" cy="33" r="8" />
                </svg>
              </div>
            </div>
            <Caption
              word="Deliver."
              lines={[
                "Four projects that built my foundations.",
                "Harigurus, Full Stack Developer. React booking flows; Node.js and Express APIs; Razorpay payment verification; Twilio SMS confirmations.",
                "Vault Storage. The deployed storage product, with connected GitHub and Google Drive workspaces.",
              ]}
            />
          </div>
        </div>

        {/* Scene 7: the rooftop again, and how to reach me */}
        <div {...sceneProps("close")}>
          <div className="obs-trailer-layer obs-trailer-return" aria-hidden="true" />
          <div className="obs-trailer-layer obs-trailer-closing">
            <svg className="obs-trailer-frame" viewBox="0 0 640 320" preserveAspectRatio="none" aria-hidden="true">
              <path className="obs-trailer-line" pathLength={1} d={`M${CLOSING_STARS.map(([x, y]) => `${x} ${y}`).join(" ")}`} />
              {CLOSING_STARS.map(([x, y], index) => (
                <g key={index} className="obs-trailer-node" style={{ "--at": index / CLOSING_STARS.length } as CSSProperties}>
                  <circle cx={x} cy={y} r="3" />
                </g>
              ))}
            </svg>
            <div className="obs-trailer-contact">
              <p className="obs-note">From our rooftop to Octoworlds. Still following the questions.</p>
              <h2>
                My brother kept
                <br />
                my curiosity alive.
              </h2>
              {closing}
            </div>
          </div>
        </div>

        <nav className="obs-trailer-rail" aria-label="Scenes">
          {LAYOUT.scenes.map((scene) => (
            <a key={scene.id} href={`#trailer-${scene.id}`} data-tick={scene.id}>
              <span className="obs-trailer-tick-label">{scene.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
