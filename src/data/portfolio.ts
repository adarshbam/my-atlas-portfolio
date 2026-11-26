export const opening = {
  name: "Adarsh Singh",
  firstName: "Adarsh",
  lastName: "Singh",
  edition: "Selected work · 2026",
  title: "An engineering atlas",
  coverTitleLines: ["An engineering", "atlas"],
  role: "Software engineer",
  positioning: "Full-stack applications & systems",
  stack: "React · Node.js · TypeScript",
  introduction:
    "I build full-stack applications and explore the systems behind them.",
  contentsIntroduction:
    "Applications, connected services, and the decisions behind them.",
  portrait: {
    src: "/images/editorial-portrait-960.webp",
    srcSet:
      "/images/editorial-portrait-480.webp 480w, /images/editorial-portrait-640.webp 640w, /images/editorial-portrait-960.webp 960w",
    alt: "Editorial portrait of Adarsh Singh seated in a dark sweater, with his forearms resting in front",
    width: 960,
    height: 1440,
  },
} as const;

export type PageKind =
  | "cover"
  | "atlas-map"
  | "contents"
  | "project"
  | "contributions"
  | "architecture"
  | "decisions"
  | "pipeline"
  | "harigurus"
  | "references"
  | "security"
  | "colophon";
type PageDefinition = {
  id: string;
  kind: PageKind;
  title: string;
  runningHead: readonly [string, string];
  folio: string;
  footer: string;
};

// Order is presentation; IDs are the durable navigation contract.
export const pages = [
  {
    id: "cover",
    kind: "cover",
    title: "Cover",
    runningHead: [opening.name, "Portfolio · 2026"],
    folio: "",
    footer: "Selected work / Vol. 01",
  },
  {
    id: "introduction",
    kind: "atlas-map",
    title: "Introduction",
    runningHead: ["Portfolio", opening.edition],
    folio: "01",
    footer: opening.title,
  },
  {
    id: "contents",
    kind: "contents",
    title: "Selected work",
    runningHead: [opening.name, opening.role],
    folio: "02",
    footer: "Applications · systems · practice",
  },
  {
    id: "vault",
    kind: "project",
    title: "Vault Storage",
    runningHead: ["01 / Selected project", "Full-stack application"],
    folio: "03",
    footer: "Foundation → personal extensions",
  },
  {
    id: "vault-contributions",
    kind: "contributions",
    title: "What I built",
    runningHead: ["Vault Storage", "Origin & contribution"],
    folio: "04",
    footer: "Course foundation · personal extensions",
  },
  {
    id: "vault-architecture",
    kind: "architecture",
    title: "How a file travels",
    runningHead: ["Vault Storage", "System notes"],
    folio: "05",
    footer: "Source review · 25 October 2026",
  },
  {
    id: "vault-decisions",
    kind: "decisions",
    title: "Decisions and limits",
    runningHead: ["Vault Storage", "Engineering decisions"],
    folio: "06",
    footer: "Benefits · costs · boundaries",
  },
  // The projects follow the order of the atlas run (src/front/scenes.ts): Vault, Harigurus, the
  // pipeline, Security Lab. The number that opens a project's running head is its number in
  // `projects` below; tests/front-run.spec.ts holds the two together.
  {
    id: "harigurus",
    kind: "harigurus",
    title: "Harigurus",
    runningHead: ["02 / Employment work", "Full Stack Developer · 8 months"],
    folio: "07",
    footer: "Written case study · company-private source",
  },
  {
    id: "pipeline",
    kind: "pipeline",
    title: "CI/CD Pipeline Engine",
    runningHead: ["03 / Selected project", "Workflow engine · TypeScript"],
    folio: "08",
    footer: "Source & unit-test verified",
  },
  // Security Lab is project 04 but stays after the two reference pages on purpose. Indices 9
  // and 10 open as one facing spread; a page put before them would split the references across
  // two spreads.
  {
    id: "references",
    kind: "references",
    title: "Working together",
    runningHead: ["Clients & collaborators", "References"],
    folio: "09",
    footer: "On teamwork & dedication",
  },
  {
    id: "references-continued",
    kind: "references",
    title: "In their words",
    runningHead: ["Clients & collaborators", "References / continued"],
    folio: "10",
    footer: "On commitment & understanding",
  },
  {
    id: "security-lab",
    kind: "security",
    title: "Security Lab & Practice",
    runningHead: ["04 / Security Lab", "Seven connected labs"],
    folio: "11",
    footer: "28 experiments · local HTTPS",
  },
  {
    id: "colophon",
    kind: "colophon",
    title: "Experience & Colophon",
    runningHead: ["Experience & Contact", "Adarsh Singh · 2026"],
    folio: "12",
    footer: "First edition · 2026",
  },
] as const satisfies readonly PageDefinition[];

export type PageId = (typeof pages)[number]["id"];
export type PortfolioPage = (typeof pages)[number];
export type PageDestination =
  | { kind: "page"; id: PageId }
  | { kind: "external"; href: string }
  | { kind: "unavailable" };
type Project = {
  number: string;
  name: string;
  detail: string;
  href: string;
  repository: string;
  destination: PageDestination;
};

// One order and one number per project, everywhere: this list is the contents page, the atlas
// run takes its scene numbers from it, and each project page's running head opens with it.
export const projects: readonly Project[] = [
  {
    number: "01",
    name: "Vault Storage",
    detail: "Connected storage & workspaces",
    href: "https://yourvaultstorage.com/",
    repository: "https://github.com/adarshbam/my-storage",
    destination: { kind: "page", id: "vault" },
  },
  {
    number: "02",
    name: "Harigurus",
    detail: "Booking, Razorpay & Twilio workflows",
    href: "https://harigurus.com",
    repository:
      "https://github.com/adarshbam/harigurus-enterprise-architecture",
    destination: { kind: "page", id: "harigurus" },
  },
  {
    number: "03",
    name: "CI/CD Pipeline Engine",
    detail: "Signed webhooks · DAG runner · live dashboard",
    href: "https://github.com/adarshbam/ci-cd-pipeline-engine",
    repository: "https://github.com/adarshbam/ci-cd-pipeline-engine",
    destination: { kind: "page", id: "pipeline" },
  },
  {
    number: "04",
    name: "Security Lab",
    detail: "Seven labs · access control to JWT",
    href: "https://github.com/adarshbam/security-lab",
    repository: "https://github.com/adarshbam/security-lab",
    destination: { kind: "page", id: "security-lab" },
  },
];

/**
 * The project a book page presents. A page takes its project's name and links from here, by
 * page, so the book, its contents list and the atlas run (src/front) name a project one way,
 * and reordering `projects` cannot point a page at another project's links.
 */
export const projectOn = (id: PageId): Project =>
  projects.find((project) => project.destination.kind === "page" && project.destination.id === id)!;

// In page order: the contents panel marks the last chapter at or before the open page.
export const chapters: readonly { id: PageId; label: string }[] = [
  { id: "cover", label: "Cover" },
  { id: "introduction", label: "Introduction" },
  { id: "vault", label: "Vault Storage" },
  { id: "vault-architecture", label: "File flow" },
  { id: "harigurus", label: "Harigurus" },
  { id: "pipeline", label: "Pipeline" },
  { id: "references", label: "References" },
  { id: "security-lab", label: "Security Lab" },
  { id: "colophon", label: "Contact" },
];
export const github = "https://github.com/adarshbam";
export const harigurusShop = "https://shop.harigurus.com/";

// Approved historical excerpts: tests/fixtures/references.json.
// Full source/capture provenance is retained separately in local evidence.
// Roles are those published by the source; they are not claims of current titles.
export const references = [
  {
    id: "anurag-singh",
    pageId: "references",
    name: "Anurag Singh",
    role: "Software Engineer",
    quote:
      "Adarsh was a wonderful developer to work with in a team! He is very intelligent and grasps complex concepts very easily.",
  },
  {
    id: "srihari-kestur",
    pageId: "references",
    name: "Srihari Kestur",
    role: "Founder Harigurus",
    quote:
      "I am speechless by looking at his work ethic and dedication. Working with him was the best decision I made.",
  },
  {
    id: "saatvik-nagpal",
    pageId: "references-continued",
    name: "Saatvik Nagpal",
    role: "Founder, EazyGrad",
    quote:
      "Adarsh is a talented, committed individual who will leave no stone unturned in his pursuit to provide with the best.",
  },

] as const;

export const professionalStory = {
  email: "adarshbambahadur@gmail.com",
  phones: [
    { label: "+91 8005156732", href: "tel:+918005156732" },
    { label: "+91 6386036252", href: "tel:+916386036252" },
  ],
  github,
  linkedin: "https://linkedin.com/in/adarsh-singh-bam",
  practice: [
    {
      area: "Interfaces",
      detail: "React · TypeScript · Playwright. Vault & Security Lab.",
    },
    {
      area: "Services",
      detail: "Node.js · Express. APIs & Pipeline scheduling.",
    },
    {
      area: "Storage & edge",
      detail: "MongoDB · Redis · B2 · Cloudflare. Vault.",
    },
  ],
  experience: [
    {
      company: "ProCodrr",
      role: "Technical Course Assistant",
      dates: "2023–2026",
      detail:
        "Built reference projects and exercises for Anurag Singh’s courses.",
    },
    {
      company: "Harigurus",
      role: "Full Stack Developer",
      dates: "2022 · about 8 months",
      detail:
        "React and Node.js booking flows, Razorpay verification and Twilio SMS.",
    },
    {
      company: "EasyGrad",
      role: "Freelance Frontend Developer",
      dates: "2022",
      detail:
        "Delivered a small set of responsive client pages in HTML, CSS and JavaScript.",
    },
  ],
} as const;

const vaultRepository = "https://github.com/adarshbam/my-storage";
export const vaultStudy = {
  problem:
    "Work across Vault folders, GitHub repositories, and Google Drive from one connected workspace.",
  audience: "For developers and teams",
  foundation:
    "Built on the ProCodrr Node.js course storage project. I contributed to teaching and course development.",
  contribution:
    "I independently built the GitHub and Drive workspaces, cross-service transfers, owner controls, runtime plan rules, and billing.",
  images: {
    accounts: {
      full: "/images/vault/accounts-1920.webp",
      src: "/images/vault/accounts-1200.webp",
      srcSet: "/images/vault/accounts-640.webp 640w, /images/vault/accounts-1200.webp 1200w, /images/vault/accounts-1920.webp 1920w",
      width: 1200,
      height: 297,
      alt: "Vault administration snapshot showing 10 registered accounts, 1 active session, 3 admin nodes and 45.01 TB cumulative provisioned storage quota",
      caption: "Supplied administration snapshot · 10 registered accounts · 45.01 TB provisioned quota. Quota is allocated capacity; occupied storage is not shown.",
    },
    workspace: {
      full: "/images/vault/github-workbench-source.jpg",
      src: "/images/vault/github-workbench-1200.webp",
      srcSet:
        "/images/vault/github-workbench-480.webp 480w, /images/vault/github-workbench-800.webp 800w, /images/vault/github-workbench-1200.webp 1200w",
      width: 1200,
      height: 833,
      alt: "Live GitHub repository workbench for adarshbam/my-storage in Vault OS Sunset Orange dark theme",
      caption:
        "Live GitHub workbench · 25 October 2026. Public repository adarshbam/my-storage in Sunset Orange dark.",
    },
    owner: {
      full: "/images/vault/owner-settings-source.jpg",
      src: "/images/vault/owner-settings-1200.webp",
      srcSet:
        "/images/vault/owner-settings-480.webp 480w, /images/vault/owner-settings-800.webp 800w, /images/vault/owner-settings-1200.webp 1200w",
      width: 1200,
      height: 833,
      alt: "Live Owner Control Center in Vault OS showing global system limits, trial inheritance, and billing plan configuration",
      caption:
        "Owner Control Center · 25 October 2026. Global limits, trial inheritance, and plan configuration.",
    },
  },
  supplementary: {
    driveTransfer: "/images/vault/drive-transfer-source.jpg",
    populatedVault: "/images/vault/populated-demo-vault-source.jpg",
    billingComparison: "/images/vault/billing-comparison-source.jpg",
    userManagement: "/images/vault/user-management-source.jpg",
  },
  sources: {
    upload: `${vaultRepository}/blob/main/Frontend/src/hooks/useUploadManager.js#L330-L344`,
    signing: `${vaultRepository}/blob/main/Backend/integrations/storage/s3.client.js#L60-L91`,
    worker: `${vaultRepository}/blob/main/cloudflare-worker/src/worker.js#L194-L294`,
    github: `${vaultRepository}/blob/main/Backend/services/github.service.js#L568-L728`,
    drive: `${vaultRepository}/blob/main/Backend/services/drive.service.js#L219-L255`,
    planContext: `${vaultRepository}/blob/main/Backend/middlewares/loadPlanContext.js#L32-L280`,
    requireFeature: `${vaultRepository}/blob/main/Backend/middlewares/requireFeature.js#L11-L70`,
    planService: `${vaultRepository}/blob/main/Backend/services/plan.service.js#L155-L205`,
    ownerSettings: `${vaultRepository}/blob/main/Frontend/src/pages/OwnerSettings/OwnerSettings.jsx#L1-L240`,
  },
  decisions: [
    {
      number: "01",
      title: "API-backed Git operations",
      benefit: "REST Contents and Refs power commits without git clones.",
      cost: "Per-file HTTPS calls trade multi-file tree transactions for stateless workers.",
      href: `${vaultRepository}/blob/main/Backend/services/github.service.js#L568-L728`,
      sourceLabel: "Read the GitHub adapter",
    },
    {
      number: "02",
      title: "Central runtime entitlements",
      benefit: "Owner edits flush Redis; requests resolve live plan rules.",
      cost: "Routes check plans per request; paid-tier lockdown is source-verified.",
      href: `${vaultRepository}/blob/main/Backend/middlewares/loadPlanContext.js#L32-L280`,
      sourceLabel: "Read the plan middleware",
    },
  ],
} as const;


/*
 * Copy and evidence that the book's project pages and the atlas run (src/front) both show.
 * One source for each sentence: the book page and the run read the same string.
 */
const harigurusJob = professionalStory.experience.find((job) => job.company === "Harigurus")!;
export const harigurusStudy = {
  role: `${harigurusJob.role} · ${harigurusJob.dates}`,
  summary:
    "I built ceremony-booking features connecting customers with purohits, from appointment details to confirmation.",
  detail: harigurusJob.detail,
  boundary:
    "Team contribution. Production code remains private with Harigurus; the repository is a written case study.",
  images: {
    services: {
      full: "/images/harigurus/services-1920.webp",
      src: "/images/harigurus/services-640.webp",
      srcSet: "/images/harigurus/services-640.webp 640w, /images/harigurus/services-1200.webp 1200w",
      width: 1200,
      height: 653,
      alt: "Harigurus homepage introducing event services and a Book appointment action",
      caption: "Service booking · Homepage ↗",
      label: "View the Harigurus service-booking homepage screenshot full-size",
    },
    shop: {
      full: "/images/harigurus/shop-1920.webp",
      src: "/images/harigurus/shop-640.webp",
      srcSet: "/images/harigurus/shop-640.webp 640w, /images/harigurus/shop-1200.webp 1200w",
      width: 1200,
      height: 654,
      alt: "Harigurus shop displaying handicraft categories, product photographs and prices",
      caption: "Handicraft shop · Catalogue ↗",
      label: "View the Harigurus handicraft shop screenshot full-size",
    },
  },
} as const;

export const pipelineStudy = {
  summary:
    "From a signed GitHub push to dependency-aware jobs, live logs and a React Flow dashboard.",
  steps: [
    "Authenticate webhooks; filter and deduplicate pushes.",
    "Resolve dependencies with two slots per run; diagnose cycles.",
    "Inspect logs and history; retry, time out or cancel jobs.",
  ],
  evidenceNote:
    "Updated source and supplied captures reviewed; no production deployment performed for this case study.",
  images: {
    dashboard: {
      /** The largest capture. The book's figure links to the case study page instead. */
      full: "/images/pipeline/dashboard-1920.webp",
      src: "/images/pipeline/dashboard-640.webp",
      srcSet: "/images/pipeline/dashboard-640.webp 640w, /images/pipeline/dashboard-1200.webp 1200w",
      width: 1200,
      height: 654,
      alt: "CI/CD management dashboard showing recent runs and configured workflows",
      caption: "Original dashboard capture",
    },
  },
} as const;

export const securityStudy = {
  labs: "Seven connected labs, from access control to JWT verification.",
  experiments:
    "Twenty-eight experiments compare vulnerable and protected implementations through real requests and browser evidence.",
  method: "Understand → Predict → Experiment → Compare → Learn.",
  boundary: "Published source; loopback only.",
  images: {
    workbench: {
      full: "/images/security-lab/workbench-1920.webp",
      src: "/images/security-lab/workbench-1200.webp",
      srcSet:
        "/images/security-lab/workbench-640.webp 640w, /images/security-lab/workbench-1200.webp 1200w, /images/security-lab/workbench-1920.webp 1920w",
      width: 1920,
      height: 1048,
      alt: "JWT workbench showing the seven lab tabs and the Understand, Predict, Experiment, Compare and Learn stages",
      caption: "Lab 07 · JWT comparison on local HTTPS. Open the full screenshot.",
    },
  },
} as const;

export const securityLabs = [
  { title: "Broken access control", detail: "Object ownership on file reads, deletion and folder cascades." },
  { title: "Privilege escalation", detail: "Persisted role changes, profile allowlists and admin permissions." },
  { title: "HttpOnly cookies vs localStorage", detail: "Script access, automatic credentials, scope and expiry." },
  { title: "SameSite & CSRF", detail: "Cross-site requests, state changes, token and Origin checks." },
  { title: "Injection attacks", detail: "SQLite parameters, document query operators and type coercion." },
  { title: "XSS attacks & CSP", detail: "Reflected, stored and DOM input; safe rendering and policy enforcement." },
  { title: "JWT: decode, verify & exploit", detail: "Signature verification, historical verifier flaws, credential isolation and request size." },
] as const;
