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
    alt: "AI-generated editorial portrait of Adarsh Singh seated in a dark sweater, with his forearms resting in front",
    width: 960,
    height: 1440,
  },
} as const;

export type PageKind =
  | "cover"
  | "portrait"
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
    kind: "portrait",
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
  {
    id: "pipeline",
    kind: "pipeline",
    title: "CI/CD Pipeline Engine",
    runningHead: ["02 / Selected project", "Workflow engine · TypeScript"],
    folio: "07",
    footer: "Source & unit-test verified",
  },
  {
    id: "harigurus",
    kind: "harigurus",
    title: "Harigurus",
    runningHead: ["03 / Employment work", "Full Stack Developer · 8 months"],
    folio: "08",
    footer: "Written case study · company-private source",
  },
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
    runningHead: ["04 / Security Lab", "Loopback laboratory & stack"],
    folio: "11",
    footer: "Local-only lab · evidenced stack",
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
    name: "CI/CD Pipeline Engine",
    detail: "DAG scheduling & bounded concurrency",
    href: "https://github.com/adarshbam/ci-cd-pipeline-engine",
    repository: "https://github.com/adarshbam/ci-cd-pipeline-engine",
    destination: { kind: "page", id: "pipeline" },
  },
  {
    number: "03",
    name: "Harigurus",
    detail: "Booking, Razorpay & Twilio workflows",
    href: "https://harigurus.com",
    repository:
      "https://github.com/adarshbam/harigurus-enterprise-architecture",
    destination: { kind: "page", id: "harigurus" },
  },
  {
    number: "04",
    name: "Security Lab",
    detail: "Loopback cookie, CSRF & JWT lab",
    href: "https://github.com/adarshbam/security-lab",
    repository: "https://github.com/adarshbam/security-lab",
    destination: { kind: "page", id: "security-lab" },
  },
];

export const chapters: readonly { id: PageId; label: string }[] = [
  { id: "cover", label: "Cover" },
  { id: "introduction", label: "Introduction" },
  { id: "vault", label: "Vault Storage" },
  { id: "vault-architecture", label: "File flow" },
  { id: "pipeline", label: "Pipeline" },
  { id: "harigurus", label: "Harigurus" },
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
  {
    id: "gautham-chengappa",
    pageId: "references-continued",
    name: "Gautham Chengappa",
    role: "Web Developer, UX Consultancy",
    quote:
      "He could peek inside my mind and made the site exactly as I wanted. Much appreciated",
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
      dates: "2022–2023 · 8 months",
      detail:
        "React and Node.js booking flows, Razorpay verification and Twilio SMS.",
    },
    {
      company: "EasyGrad",
      role: "Freelance Frontend Developer",
      dates: "2022",
      detail:
        "Delivered three responsive client pages in HTML, CSS and JavaScript.",
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
