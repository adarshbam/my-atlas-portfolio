import { harigurusStudy, opening, pipelineStudy, projects, references, securityStudy, vaultStudy } from "@/data/portfolio";
import type { PortfolioVideoId } from "@/data/portfolio-videos";
import { layoutScenes, type SceneDef } from "@/trailer/engine";

/*
 * The atlas run (docs/FRONT-PAGE-TRAILER-2026-11-22.md). Every line of copy here is an
 * existing sentence from src/data/portfolio.ts, used whole; nothing is reworded.
 */

export type FrontEvidence = {
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** Full-size file the on-page viewer opens. */
  full: string;
  /** Name of the link to the full-size file, where the book already has one. */
  label?: string;
};

export type FrontProject = {
  id: "vault" | "harigurus" | "pipeline" | "security";
  /** The project's number in the projects data: the same in the run, the contents list and the book. */
  number: string;
  name: string;
  detail: string;
  /** One line per beat. */
  lines: readonly string[];
  /** A short standing line under the rule: the terms on which the work is shown. */
  note?: string;
  /** Stem of the painting in public/front, e.g. "/front/vault": the same desk in every scene, with different objects on it. */
  art: string;
  artAlt: string;
  /** One print, or two that overlap on the desk; the second arrives on a later segment (--c). */
  evidence: readonly FrontEvidence[];
  links: readonly { label: string; href: string }[];
  /** Book page that "Read this in the book" opens. */
  pageId: string;
  /** A recording shown in this scene as a film still that grows into the player. */
  reel?: PortfolioVideoId;
};

type Entry = Pick<FrontProject, "id" | "lines" | "note" | "artAlt" | "evidence" | "pageId" | "reel"> & { name: string };

/** Run order, which is also the order of `projects`. Number, name, detail and links come from the projects data. */
const entries: readonly Entry[] = [
  {
    id: "vault",
    name: "Vault Storage",
    // The claim comes last: it holds the rest point, the longest stretch and the way out.
    lines: [vaultStudy.problem, vaultStudy.foundation, vaultStudy.contribution],
    artAlt: "Illustration: a card-index drawer, a ring of keys and tied folders on a lamp-lit desk",
    evidence: [vaultStudy.images.workspace],
    pageId: "vault",
    // The introduction is kept on Vault itself (src/story/vault-media.js), so it is shown with Vault.
    reel: "introduction",
  },
  {
    id: "harigurus",
    name: "Harigurus",
    lines: [harigurusStudy.summary, harigurusStudy.boundary, harigurusStudy.detail],
    note: harigurusStudy.role,
    artAlt: "Illustration: a curl of marigold garland, a small lit brass diya, a brass bell and a blank paper slip on a lamp-lit desk",
    evidence: [harigurusStudy.images.services, harigurusStudy.images.shop],
    pageId: "harigurus",
  },
  {
    id: "pipeline",
    name: "CI/CD Pipeline Engine",
    // Two lines: what it is, held through the rest point, then the terms on which it is shown.
    lines: [pipelineStudy.summary, pipelineStudy.evidenceNote],
    artAlt: "Illustration: a brass railway signal lantern with green glass and three small green signal lamps on a lamp-lit desk",
    evidence: [pipelineStudy.images.dashboard],
    pageId: "pipeline",
  },
  {
    id: "security",
    name: "Security Lab",
    lines: [securityStudy.labs, securityStudy.method, securityStudy.experiments],
    note: securityStudy.boundary,
    artAlt: "Illustration: seven padlocks in a row and a single key on a lamp-lit desk",
    evidence: [securityStudy.images.workbench],
    pageId: "security-lab",
  },
];

export const frontProjects: readonly FrontProject[] = entries.map((entry) => {
  const project = projects.find((item) => item.name === entry.name)!;
  return {
    ...entry,
    number: project.number,
    name: project.name,
    detail: project.detail,
    art: `/front/${entry.id}`,
    // A project whose "site" is its repository has no live site to offer.
    links: [...(project.href !== project.repository ? [{ label: "Live site", href: project.href }] : []), { label: "Repository", href: project.repository }],
  };
});

export const frontReferences = {
  heading: "What people say",
  art: "/front/references",
  artAlt: "Illustration: three sealed envelopes and a fountain pen on a lamp-lit desk",
  quotes: references,
  pageId: "references",
} as const;

/**
 * Project scenes share one timing: --b brings the evidence print into the light. The third
 * line arrives at half way and stays: it is the one a reader at rest, or leaving, is left with.
 */
const projectScene = (id: string, label: string): SceneDef => ({
  id,
  label,
  units: 2.2,
  segments: [["--b", 0.18, 0.42]],
  beats: [0.05, 0.3, 0.5],
  rest: 0.55,
});

export const FRONT_SCENES: readonly SceneDef[] = [
  // --copy lifts the opening words away; --push takes the camera in on the face.
  // Its one beat marks the point at which the opening words have gone.
  { id: "hello", label: "Hello", units: 1.4, segments: [["--copy", 0.2, 0.6], ["--push", 0.25, 1]], beats: [0.58], rest: 0 },
  projectScene("vault", "Vault"),
  // Two prints: a little longer, the second (--c) landing after the first, and at rest once both are down.
  { ...projectScene("harigurus", "Harigurus"), units: 2.6, segments: [["--b", 0.16, 0.34], ["--c", 0.4, 0.58]], rest: 0.62 },
  // Two lines: the first holds through the rest point.
  { ...projectScene("pipeline", "Pipeline"), beats: [0.05, 0.65] },
  projectScene("security", "Security"),
  // One quotation per beat; each stays. A tick lands where all three are showing. The last 0.4
  // of a screen is the run dissolving into the desk (DISSOLVE in FrontRun.tsx), so the scene is
  // that much longer than its quotations need: they arrive 0.24, 0.72 and 1.25 screens in, and
  // all three stand for three quarters of a screen before the words begin to go (at 0.83).
  { id: "references", label: "References", units: 2.4, segments: [], beats: [0.1, 0.3, 0.52], rest: 0.68 },
];

/**
 * Scenes of the run cross over 0.4 of a screen, twice the story's crossing. The words take
 * turns inside it (front.css), so each caption gets 0.2 of a screen to leave or to arrive:
 * a fade, where one notch of a mouse wheel used to make it a cut.
 */
const CROSSING = 0.4;
export const FRONT_LAYOUT = layoutScenes(FRONT_SCENES, CROSSING);

/**
 * A window too short to hold a pinned scene: a phone on its side, or a very small window.
 * The tallest scene (the three quotations, stacked) needs a little over this. Below it the run
 * and the arrival stand as plain blocks in document flow, as they do for reduced motion, so
 * nothing is cut off by the pinned stage.
 */
export const SHORT_WINDOW = "(max-height: 540px)";

export const hello = {
  name: opening.name,
  // What he is and with what: the sentence under it already says "full-stack applications" and "systems".
  role: `${opening.role} · ${opening.stack}`,
  introduction: opening.introduction,
  portrait: opening.portrait,
} as const;
