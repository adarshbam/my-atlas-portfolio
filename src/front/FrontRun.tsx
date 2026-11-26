import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type FocusEvent, type MouseEvent } from "react";
import { VideoLink, videoLabels } from "@/components/video-link";
import { professionalStory } from "@/data/portfolio";
import { portfolioVideos, videoDuration, type PortfolioVideoId } from "@/data/portfolio-videos";
import { Caption } from "@/trailer/Caption";
import { mark, put, sceneAttributes, segment, useAfterFirstPaint, useSceneScroll, type PlacedScene, type SceneFrame } from "@/trailer/engine";
import { FRONT_LAYOUT, frontProjects, frontReferences, hello, type FrontProject } from "./scenes";
import "@/trailer/tokens.css";
import "@/trailer/base.css";
import "./front.css";

/*
 * The atlas run (docs/FRONT-PAGE-TRAILER-2026-11-22.md): the opening of `/`.
 * Same scroll engine as the story trailer. Each project scene has two depth layers:
 * the lamp-lit desk behind, with that project's objects on it, and the caption with
 * real evidence in front, lying in the light.
 */

/** Scenes alternate the way the desk drifts, so each painting starts at the scale the last one ended on (front.css). */
const drift = (id: string) => (FRONT_LAYOUT.scenes.find((item) => item.id === id)!.index % 2 ? "in" : "out");
const scene = (id: string) => ({ className: `obs-trailer-scene atlas-scene atlas-scene--${id}`, ...sceneAttributes(FRONT_LAYOUT, id), "data-drift": drift(id) });

/**
 * Scenes whose start is within three quarters of a viewport height of the playhead get their
 * images. Less than a whole one: the second scene starts one screen down, and nothing of it is
 * to be fetched with the first screen.
 */
const AHEAD = 0.75;
const reached = (position: number) => FRONT_LAYOUT.scenes.filter((item) => item.start - AHEAD <= position).length;

/**
 * How many of a scene's prints are far enough into the light to be pressed: the first comes in
 * on --b, the second on --c (front.css). A print still on its way is invisible or nearly so,
 * and must not catch a press meant for the desk.
 */
const PRINT_SEGMENTS: readonly string[] = ["--b", "--c"];
const PRINT_PRESSABLE = 0.25; // the sheet is solid from here (front.css)
const printsDown = (item: PlacedScene, position: number) => {
  const measured = (position - item.start) / (item.span ?? item.units);
  return item.segments.filter(([name, start, end]) => PRINT_SEGMENTS.includes(name) && segment(measured, start, end) >= PRINT_PRESSABLE).length;
};

/**
 * The run does not slide off the desk: over its last DISSOLVE of a screen, while it is still
 * pinned, the whole stage dissolves into the desk that lies under it (the arrival, front.css).
 * --leave runs 0..1 through that stretch.
 */
const DISSOLVE = 0.4;

function Painting({ stem, alt }: { stem: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  // A missing painting leaves the scene on the plain night field, with everything else intact.
  if (failed) return null;
  return (
    <figure className="atlas-painting">
      <picture>
        <source media="(max-width: 800px)" srcSet={`${stem}-tall-600.webp 600w, ${stem}-tall-1200.webp 1200w`} sizes="100vw" />
        <img
          src={`${stem}-1600.webp`}
          srcSet={`${stem}-800.webp 800w, ${stem}-1600.webp 1600w, ${stem}-2400.webp 2400w`}
          sizes="100vw"
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
        />
      </picture>
      <figcaption>Illustration</figcaption>
    </figure>
  );
}

/**
 * A recording kept on Vault, shown as a film still lying on the desk. Pressing it opens the
 * player every other watch link opens (public/media-viewer.js), which grows out of the still.
 * The still is only a poster: nothing of the recording is requested before the press.
 */
function Reel({ id, images }: { id: PortfolioVideoId; images: boolean }) {
  const recording = portfolioVideos[id];
  if (!recording) return null;
  return (
    <button type="button" className="atlas-reel" data-portfolio-video={id} aria-haspopup="dialog">
      {/* The frame holds the still's place until the reader is near enough for it to load. */}
      <span className="atlas-reel-still" data-video-still aria-hidden="true">
        <span className="atlas-reel-picture">{images && <img src={recording.poster} alt="" width={1920} height={1080} loading="lazy" decoding="async" draggable={false} />}</span>
      </span>
      <span className="atlas-reel-words">
        <span className="atlas-reel-label">
          {videoLabels[id]} · {videoDuration(recording.durationSeconds)}
        </span>
        <span className="atlas-reel-note">Hosted on Vault</span>
      </span>
    </button>
  );
}

/** A hyphenated compound ("cross-service", "dependency-aware") is never split at a line end. The words are unchanged. */
const unbroken = (line: string) =>
  line.split(/(\S+-\S+)/).map((part, index) =>
    index % 2 ? (
      <span key={index} className="atlas-nobreak">
        {part}
      </span>
    ) : (
      part
    ),
  );

/**
 * A scene's label: the project's number, then the project's detail, the same characters as
 * `01 · detail`. Each dot-separated phrase is one unit (the number stays with the first), so a
 * label too long for its line breaks after a dot and never inside a phrase.
 */
function Kicker({ project }: { project: FrontProject }) {
  const [first, ...rest] = project.detail.split(" · ");
  const units = [`${project.number} · ${first}`, ...rest];
  return units.map((unit, index) => (
    <Fragment key={unit}>
      <span className="atlas-kicker-unit">{index < units.length - 1 ? `${unit} ·` : unit}</span>
      {index < units.length - 1 && " "}
    </Fragment>
  ));
}

function ProjectScene({ project, images, still, onBook }: { project: FrontProject; images: boolean; still: boolean; onBook: (pageId?: string) => void }) {
  const pair = project.evidence.length > 1;
  return (
    <div {...scene(project.id)} data-project={project.id}>
      <div className="obs-trailer-layer atlas-art">{images && <Painting stem={project.art} alt={project.artAlt} />}</div>
      <div className="obs-trailer-layer atlas-body obs-trailer-pass">
        <Caption word={project.name} kicker={<Kicker project={project} />} lines={project.lines} note={project.note} renderLine={unbroken}>
          <div className="obs-trailer-links">
            {project.links.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
            <button type="button" className="atlas-book-link" onClick={() => onBook(project.pageId)}>
              Read this in the book
            </button>
          </div>
          {project.reel && <Reel id={project.reel} images={images} />}
        </Caption>
        <div className={pair ? "atlas-evidence atlas-evidence--pair" : "atlas-evidence"}>
          {images &&
            project.evidence.map((item) => (
              <figure key={item.src} className="atlas-print">
                {/* The sheet is the paper itself: the figure carries the scroll, the sheet answers the hand. */}
                <div className="atlas-print-sheet">
                {/* The link's name says what the screenshot shows, then what pressing it does: a label alone would replace the image's description. */}
                <a href={item.full} target="_blank" rel="noreferrer" aria-label={`${item.alt}. ${item.label ?? `Open the full ${project.name} capture`}`}>
                  <img
                    src={item.src}
                    srcSet={item.srcSet}
                    sizes={pair ? "(max-width: 800px) 52vw, 29vw" : "(max-width: 800px) 78vw, 34vw"}
                    width={item.width}
                    height={item.height}
                    alt={item.alt}
                    // Standing still, a print is part of the page's height. A picture that has
                    // not been asked for yet takes no room, so the page below would move when
                    // it is: there they are asked for at once, and hold their place from then.
                    loading={still ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                  />
                </a>
                <figcaption>{item.caption}</figcaption>
                </div>
              </figure>
            ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The references: the three approved quotations, each exactly as given. One arrives per beat
 * and stays (`data-quote` against the scene's `data-beat`), so by the end all three stand together.
 */
function ReferencesScene({ images, onBook }: { images: boolean; onBook: (pageId?: string) => void }) {
  return (
    <div {...scene("references")}>
      <div className="obs-trailer-layer atlas-art">{images && <Painting stem={frontReferences.art} alt={frontReferences.artAlt} />}</div>
      <div className="obs-trailer-layer atlas-voices obs-trailer-pass">
        <h2>{frontReferences.heading}</h2>
        <div className="atlas-quotes">
          {frontReferences.quotes.map((reference, index) => (
            <figure key={reference.id} className="atlas-quote" data-reference-id={reference.id} data-quote={index + 1}>
              <blockquote>{`“${reference.quote}”`}</blockquote>
              <figcaption>
                {/* The frame holds the photograph's place until the reader is near enough for it to load. */}
                <span className="atlas-quote-photo">
                  {images && (
                    <img
                      src={`/images/references/${reference.id}-192.webp`}
                      srcSet={`/images/references/${reference.id}-96.webp 96w, /images/references/${reference.id}-192.webp 192w`}
                      sizes="56px"
                      width={96}
                      height={96}
                      alt={`Portrait of ${reference.name}`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  )}
                </span>
                <span className="atlas-quote-name">{reference.name}</span>
                <span className="atlas-quote-role">{reference.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="obs-trailer-links">
          <button type="button" className="atlas-book-link" onClick={() => onBook(frontReferences.pageId)}>
            Read the references in the book
          </button>
        </div>
      </div>
    </div>
  );
}

export function FrontRun({ reduced, onBook }: { reduced: boolean; onBook: (pageId?: string) => void }) {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // Paintings and screenshots mount after the opening paint, and only as their scene comes near.
  const [late, setLate] = useState(false);
  const [reach, setReach] = useState(1);
  useAfterFirstPaint(setLate);
  const onFrame = useCallback(({ position, progress, stage: stageNode, nodes }: SceneFrame) => {
    setReach((current) => Math.max(current, reached(position)));
    put(stageNode, "--leave", segment(position, FRONT_LAYOUT.total - DISSOLVE, FRONT_LAYOUT.total));
    // Dissolved, the stage scrolls away unseen: nothing in it takes a press meant for the desk.
    mark(stageNode, "gone", String(progress >= 0.999));
    for (const item of FRONT_LAYOUT.scenes) {
      const node = nodes[item.index];
      if (node?.dataset.project) mark(node, "prints", String(printsDown(item, position)));
    }
  }, []);
  const onReset = useCallback(({ stage: stageNode, nodes }: Pick<SceneFrame, "stage" | "nodes">) => {
    for (const node of nodes) delete node?.dataset.prints;
    stageNode.style.removeProperty("--leave");
    delete stageNode.dataset.gone;
  }, []);
  useSceneScroll({ track, stage, layout: FRONT_LAYOUT, reduced, onFrame, onReset });

  // Keyboard: focusing a link in a scene that is not on screen (or whose words have already
  // lifted away, or a print that has not arrived yet) brings that scene to rest. Only for focus moved by the keyboard, and not for
  // the focus a window gets back when the reader returns to its tab.
  const returning = useRef(false);
  useEffect(() => {
    const blurred = () => {
      returning.current = true;
    };
    addEventListener("blur", blurred);
    return () => removeEventListener("blur", blurred);
  }, []);
  const focused = (event: FocusEvent<HTMLDivElement>) => {
    if (returning.current) {
      returning.current = false;
      return;
    }
    const target = event.target as HTMLElement;
    if (reduced || !target.matches(":focus-visible")) return;
    const node = target.closest<HTMLElement>("[data-scene]");
    if (!node) {
      // A rail tick. If the run has dissolved into the desk, the tick is not to be seen where
      // it stands: bring the run back, at its last scene, so focus is never on nothing.
      if (stage.current && Number(getComputedStyle(stage.current).opacity) < 0.99)
        document.getElementById(`run-${FRONT_LAYOUT.scenes[FRONT_LAYOUT.scenes.length - 1].id}`)?.scrollIntoView({ block: "start", behavior: "instant" });
      return;
    }
    const faded = node.dataset.scene === "hello" && node.dataset.beat === "1";
    // On screen is not enough: a print that has not yet risen into the light, or a scene
    // still arriving or leaving, is not at full strength. At rest everything in it is.
    // The stage itself counts: dissolved into the desk, nothing in it is to be seen.
    let strength = stage.current ? Number(getComputedStyle(stage.current).opacity) : 1;
    for (let item: HTMLElement | null = target; item && item !== node; item = item.parentElement) strength *= Number(getComputedStyle(item).opacity);
    if (node.dataset.state === "active" && !faded && strength > 0.99) return;
    document.getElementById(`run-${node.dataset.scene}`)?.scrollIntoView({ block: "start", behavior: "instant" });
  };
  // A rail tick takes the reader to its scene and leaves keyboard focus on that scene's
  // heading, so the next Tab carries on from there.
  const toScene = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    document.getElementById(`run-${id}`)?.scrollIntoView({ block: "start", behavior: "instant" });
    const heading = stage.current?.querySelector<HTMLElement>(`[data-scene="${id}"] :is(h1, h2)`);
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  };

  const images = (index: number) => late && (reduced || index < reach);

  return (
    <div className="atlas-run" data-mode={reduced ? "still" : "scroll"}>
      <section
        ref={track}
        className="obs-trailer"
        data-mode={reduced ? "still" : "scroll"}
        aria-label="My work, most important first"
        style={{ "--obs-trailer-units": FRONT_LAYOUT.total } as CSSProperties}
      >
        {/* Landing points for the rail and for keyboard focus. */}
        {FRONT_LAYOUT.scenes.map((item) => (
          <span key={item.id} id={`run-${item.id}`} className="obs-trailer-anchor" style={{ "--at-unit": item.start + item.units * item.rest } as CSSProperties} />
        ))}

        <div ref={stage} className="obs-trailer-stage" onFocus={focused}>
          <div {...scene("hello")}>
            <div className="obs-trailer-layer atlas-portrait">
              <img
                src={hello.portrait.src}
                srcSet={hello.portrait.srcSet}
                sizes="(max-width: 767px) 84vw, (max-width: 1439px) 50vw, 45vw"
                width={hello.portrait.width}
                height={hello.portrait.height}
                alt={hello.portrait.alt}
                fetchPriority="high"
                draggable={false}
              />
            </div>
            <div className="obs-trailer-layer atlas-hello">
              <div className="atlas-hello-copy">
                <h1>{hello.name}</h1>
                <p className="atlas-role">{hello.role}</p>
                <p className="atlas-lead">{hello.introduction}</p>
                {/* Two rows on purpose, as at the desk: what a recruiter came for, then the ways further in. */}
                <div className="obs-trailer-links atlas-hello-first">
                  <a href="/adarsh-singh-resume.pdf">Résumé (PDF)</a>
                  <a href={`mailto:${professionalStory.email}`}>Email me</a>
                </div>
                <div className="obs-trailer-links atlas-hello-more">
                  <VideoLink id="introduction" />
                  <a
                    href="#book"
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                      event.preventDefault();
                      onBook();
                    }}
                  >
                    Skip to the book
                  </a>
                </div>
                <p className="atlas-hint obs-small">Scroll to see the work.</p>
              </div>
            </div>
          </div>

          {frontProjects.map((project) => {
            const placed = FRONT_LAYOUT.scenes.find((item) => item.id === project.id);
            return placed ? <ProjectScene key={project.id} project={project} images={images(placed.index)} still={reduced} onBook={onBook} /> : null;
          })}

          <ReferencesScene images={images(FRONT_LAYOUT.scenes.find((item) => item.id === "references")!.index)} onBook={onBook} />

          <nav className="obs-trailer-rail" aria-label="Sections">
            {FRONT_LAYOUT.scenes.map((item) => (
              <a key={item.id} href={`#run-${item.id}`} data-tick={item.id} onClick={(event) => toScene(event, item.id)}>
                <span className="obs-trailer-tick-label">{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </section>
    </div>
  );
}
