import { memo } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  opening,
  projects,
  vaultStudy,
  harigurusShop,
  professionalStory,
  references,
  type PortfolioPage,
  type PageKind,
} from "@/data/portfolio";
import { pageIndex } from "@/lib/book-navigation";

function RunningHead({ left, right }: { left: string; right: string }) {
  return (
    <header className="running-head">
      <span>{left}</span>
      <span>{right}</span>
    </header>
  );
}
function Folio({ number, label }: { number: string; label: string }) {
  return (
    <footer className="folio">
      <span>{number}</span>
      <span>{label}</span>
    </footer>
  );
}
function External({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a className="text-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight aria-hidden="true" />
    </a>
  );
}

type PageProps = { page: PortfolioPage };

function PageTemplate({
  page,
  className = "",
  children,
}: PageProps & { className?: string; children: React.ReactNode }) {
  return (
    <article
      className={`book-page ${className}`}
      data-page={pageIndex(page.id)}
      data-page-id={page.id}
      aria-label={page.title}
    >
      <div className="sheet-surface">
        <div className="page-inner">
          <RunningHead left={page.runningHead[0]} right={page.runningHead[1]} />
          <div className="page-content page-grid">{children}</div>
          <Folio number={page.folio} label={page.footer} />
        </div>
      </div>
    </article>
  );
}

function CoverArtwork({ decorative = false }: { decorative?: boolean }) {
  return (
    <img
      className={decorative ? "cover-spine-art" : "cover-art"}
      src="/images/charcoal-left-960.webp"
      srcSet="/images/charcoal-left-480.webp 480w, /images/charcoal-left-640.webp 640w, /images/charcoal-left-960.webp 960w"
      sizes="(max-width: 767px) 60vw, (max-width: 1439px) 40vw, 35vw"
      width="960"
      height="1440"
      alt={
        decorative
          ? ""
          : "An unfinished charcoal study of Adarsh Singh, dissolving into loose strokes"
      }
      fetchPriority={decorative ? "auto" : "high"}
      draggable={false}
    />
  );
}

export function CoverPage({ page }: PageProps) {
  return (
    <article
      className="book-page page--cover"
      data-page={pageIndex(page.id)}
      data-page-id={page.id}
      aria-label={page.title}
    >
      <div className="sheet-surface">
        <CoverArtwork />
        <div className="cover-spine" aria-hidden="true">
          <div className="cover-spine-canvas">
            <CoverArtwork decorative />
          </div>
        </div>
        <div className="page-inner cover-inner">
          <p className="cover-kicker">Portfolio · 2026</p>
          <div className="cover-copy">
            <h2 className="cover-name" tabIndex={-1}>
              {opening.firstName}
              <br />
              {opening.lastName}
              <span aria-hidden="true">.</span>
            </h2>
            <p className="cover-title">
              <em>
                {opening.coverTitleLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </em>
            </p>
            <p className="cover-positioning">
              <span className="cover-role">{opening.role}</span>
              <span className="cover-stack">
                {opening.stack.split(" · ").map((technology, index) => (
                  <span key={technology}>
                    {index ? " · " : ""}
                    {technology}
                  </span>
                ))}
              </span>
            </p>
            <button
              type="button"
              className="text-link cover-open"
              data-turn-page-id="introduction"
            >
              Open book <ArrowRight aria-hidden="true" />
            </button>
            <p className="cover-volume" aria-hidden="true">
              <span>Selected work</span>
              <span>Vol. 01</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function DiagramStack({ x, y }: { x: number; y: number }) {
  return (
    <g className="diagram-platform" transform={`translate(${x} ${y})`}>
      {[24, 12, 0].map((offset) => (
        <g key={offset} transform={`translate(0 ${offset})`}>
          <path
            className="diagram-plane-side"
            d="M-42 0 0 22 42 0V12L0 34-42 12Z"
          />
          <path className="diagram-plane-top" d="m-42 0 42-22 42 22-42 22Z" />
          <path className="diagram-detail" d="M0 22V34M-29 0 0-15 29 0" />
        </g>
      ))}
    </g>
  );
}

function FileFlowDrawing() {
  return (
    <svg
      className="diagram-geometry"
      viewBox="0 0 720 330"
      aria-hidden="true"
      focusable="false"
    >
      <g className="diagram-routes">
        <path className="diagram-route" d="m110 147 98-52" />
        <path className="diagram-arrowhead" d="m200 95 8 0-4 7" />
        <path className="diagram-route" d="m215 113-99 52" />
        <path className="diagram-arrowhead" d="m121 157-5 8 9-1" />
        <path className="diagram-route" d="M112 182H410" />
        <path className="diagram-arrowhead" d="m402 178 8 4-8 4" />
        <path className="diagram-route" d="m604 90-121 61" />
        <path className="diagram-arrowhead" d="m487 143-4 8 9-1" />
        <path className="diagram-route" d="m489 160 121-61" />
        <path className="diagram-arrowhead" d="m602 99 8 0-4 7" />
        <path className="diagram-route" d="M651 74H704V300H10V206H72" />
        <path className="diagram-arrowhead" d="m64 202 8 4-8 4" />
        <path className="diagram-arrowhead" d="m659 70-8 4 8 4" />
      </g>
      <g className="diagram-browser">
        <path className="diagram-plane-top" d="M38 144H106V192H38Z" />
        <path className="diagram-detail" d="M45 151H99V184H45Z" />
        <path className="diagram-plane-side" d="M38 192 28 204H116L106 192Z" />
        <path className="diagram-detail" d="M61 198H83" />
      </g>
      <DiagramStack x={260} y={58} />
      <g className="diagram-auth" transform="translate(260 42)">
        <path className="diagram-detail" d="M-7-7V-12A7 7 0 0 1 7-12V-7" />
        <path className="diagram-plane-top" d="M-11-7H11V10H-11Z" />
        <path className="diagram-detail" d="M0-1V4" />
      </g>
      <g className="diagram-storage">
        <path
          className="diagram-plane-side"
          d="M419 153V198C419 214 481 214 481 198V153"
        />
        <ellipse
          className="diagram-plane-top"
          cx="450"
          cy="153"
          rx="31"
          ry="12"
        />
        <path
          className="diagram-detail"
          d="M419 170C419 186 481 186 481 170M419 185C419 201 481 201 481 185"
        />
      </g>
      <g className="diagram-delivery">
        <circle className="diagram-plane-top" cx="626" cy="74" r="25" />
        <ellipse className="diagram-detail" cx="626" cy="74" rx="11" ry="25" />
        <path
          className="diagram-detail"
          d="M601 74H651M605 62H647M605 86H647"
        />
      </g>
    </svg>
  );
}

export function SystemDiagram({ compact = false }: { compact?: boolean }) {
  return (
    <figure
      className={`system-diagram ${compact ? "system-diagram--compact" : ""}`}
    >
      <div
        className="diagram-nodes diagram-scroll"
        tabIndex={0}
        role="region"
        aria-label="System components; scroll horizontally on small screens"
      >
        <div className="diagram-canvas">
          <FileFlowDrawing />
          <div className="diagram-node diagram-node--browser">
            <span>Browser</span>
            <small>Workspaces & UI</small>
          </div>
          <div className="diagram-node diagram-node--api">
            <span>API</span>
            <small>Plan rules & signing</small>
          </div>
          <div className="diagram-node diagram-node--storage">
            <span>B2 & adapters</span>
            <small>B2, Git & Drive</small>
          </div>
          <div className="diagram-node diagram-node--delivery">
            <span>Cloudflare</span>
            <small>Signed reads & cache</small>
          </div>
          <span className="diagram-route-label diagram-route-label--signature">
            Check & sign
          </span>
          <span className="diagram-route-label diagram-route-label--upload">
            Direct / adapter I/O
          </span>
          <span className="diagram-route-label diagram-route-label--delivery">
            Signed read & response
          </span>
        </div>
      </div>
      <span className="diagram-scroll-hint" aria-hidden="true">
        Scroll diagram →
      </span>
      {!compact && (
        <>
          <div className="diagram-integrations">
            <div className="diagram-integration">
              <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path
                  className="diagram-plane-top"
                  d="M6 14H20L25 19H42V39H6Z"
                />
                <path className="diagram-detail" d="M16 25V33H32V25M24 21V33" />
                <circle className="diagram-plane-top" cx="16" cy="25" r="2" />
                <circle className="diagram-plane-top" cx="24" cy="21" r="2" />
                <circle className="diagram-plane-top" cx="32" cy="25" r="2" />
              </svg>
              <div>
                <span>GitHub & Drive</span>
                <small>REST Git & Drive streams</small>
              </div>
            </div>
            <div className="diagram-integration">
              <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path
                  className="diagram-plane-side"
                  d="M10 7H30L38 15V41H10Z"
                />
                <path
                  className="diagram-detail"
                  d="M30 7V15H38M17 23H31M17 29H31M17 35H27"
                />
                <path className="diagram-detail" d="M6 11V45H34" />
              </svg>
              <div>
                <span>Owner config → Redis</span>
                <small>Live quotas & feature gates</small>
              </div>
            </div>
          </div>
          <figcaption className="sr-only">
            Owner configuration updates plan rules and flushes Redis. Each API
            request resolves runtime entitlements via loadPlanContext and
            requireFeature before signing B2 URLs or invoking GitHub REST and
            Google Drive stream adapters. Cloudflare validates signed reads and
            fetches B2 on a cache miss.
          </figcaption>
        </>
      )}
    </figure>
  );
}

export function PortraitPage({ page }: PageProps) {
  return (
    <PageTemplate page={page} className="page--portrait">
      <img
        className="portrait"
        src={opening.portrait.src}
        srcSet={opening.portrait.srcSet}
        sizes="(max-width: 767px) 60vw, (max-width: 1439px) 40vw, 35vw"
        width={opening.portrait.width}
        height={opening.portrait.height}
        fetchPriority="low"
        loading="lazy"
        decoding="async"
        alt={opening.portrait.alt}
        draggable={false}
      />
      <div className="portrait-copy">
        <h2 tabIndex={-1}>
          {opening.firstName}
          <br />
          {opening.lastName}
        </h2>
        <div className="short-rule" />
        <p className="eyebrow">{opening.role}</p>
        <p className="portrait-stack">{opening.stack}</p>
      </div>
      <p className="portrait-note">{opening.introduction}</p>
    </PageTemplate>
  );
}

export function ContentsPage({ page }: PageProps) {
  return (
    <PageTemplate page={page} className="page--contents">
      <h2 className="display-title" tabIndex={-1}>
        Selected work
      </h2>
      <ol className="project-index">
        {projects.map((p) => {
          const inner = (
            <>
              <span className="project-number">{p.number}</span>
              <span className="project-copy">
                <span className="project-title">{p.name}</span>
                <span className="project-detail">{p.detail}</span>
              </span>
              {p.destination.kind !== "unavailable" && (
                <span className="project-arrow" aria-hidden="true">
                  {p.destination.kind === "page" ? "→" : "↗"}
                </span>
              )}
            </>
          );
          return (
            <li key={p.number}>
              {p.destination.kind === "page" ? (
                <button
                  type="button"
                  className="project-row"
                  data-turn-page-id={p.destination.id}
                >
                  {inner}
                </button>
              ) : p.destination.kind === "external" ? (
                <a
                  className="project-row"
                  href={p.destination.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {inner}
                </a>
              ) : (
                <div className="project-row project-row--pending">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
      <SystemDiagram compact />
    </PageTemplate>
  );
}

export function VaultPage({ page }: PageProps) {
  return (
    <PageTemplate page={page} className="page--case page--vault">
      <div className="case-heading">
        <h2 className="case-title" tabIndex={-1}>
          Vault Storage
        </h2>
        <p className="case-audience">{vaultStudy.audience}</p>
      </div>
      <div className="story">
        <p>{vaultStudy.problem}</p>
      </div>
      <VaultFigure image="workspace" />
      <div className="project-links">
        <External href={projects[0].href}>Explore Vault</External>
        <External href={projects[0].repository}>Source</External>
        <External href={vaultStudy.supplementary.driveTransfer}>
          Drive transfer
        </External>
        <External href={vaultStudy.supplementary.populatedVault}>
          Demo Vault
        </External>
      </div>
    </PageTemplate>
  );
}

function VaultFigure({ image }: { image: keyof typeof vaultStudy.images }) {
  const asset = vaultStudy.images[image];
  return (
    <figure className={`vault-figure vault-figure--${image}`}>
      <a
        href={asset.full}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open full ${image === "workspace" ? "GitHub workbench" : "Owner Control Center"} capture`}
      >
        <img
          src={asset.src}
          srcSet={asset.srcSet}
          sizes="(max-width: 767px) 80vw, (max-width: 1023px) 38vw, 36vw"
          width={asset.width}
          height={asset.height}
          alt={asset.alt}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </a>
      <figcaption>{asset.caption}</figcaption>
    </figure>
  );
}

export function ContributionsPage({ page }: PageProps) {
  return (
    <PageTemplate page={page} className="page--case page--contributions">
      <h2 className="case-title" tabIndex={-1}>
        What I built.
      </h2>
      <section className="case-group" aria-label="Course foundation">
        <h3>The foundation</h3>
        <p>{vaultStudy.foundation}</p>
      </section>
      <section className="case-group" aria-label="Personal extensions">
        <h3>My independent work</h3>
        <p>{vaultStudy.contribution}</p>
      </section>
      <VaultFigure image="owner" />
      <div className="project-links">
        <External href={vaultStudy.sources.ownerSettings}>
          Owner & plan source
        </External>
      </div>
    </PageTemplate>
  );
}

export function ArchitecturePage({ page }: PageProps) {
  return (
    <PageTemplate page={page} className="page--case page--architecture">
      <h2 className="case-title" tabIndex={-1}>
        Follow the file.
      </h2>
      <SystemDiagram />
      <div className="case-group">
        <h3>Config to runtime, adapters to storage.</h3>
        <p>
          Owner edits flush Redis; each request resolves plan rules before
          signing B2 URLs or calling GitHub and Drive adapters.
        </p>
      </div>
      <div className="project-links">
        <External href={vaultStudy.sources.planContext}>Plan context</External>
        <External href={vaultStudy.sources.github}>Git & Drive</External>
        <External href={vaultStudy.sources.worker}>Signed edge</External>
      </div>
    </PageTemplate>
  );
}

export function DecisionsPage({ page }: PageProps) {
  return (
    <PageTemplate page={page} className="page--case page--decisions">
      <h2 className="case-title" tabIndex={-1}>
        Decisions and limits.
      </h2>
      {vaultStudy.decisions.map((decision) => (
        <section
          className="case-decision"
          key={decision.number}
          aria-label={decision.title}
        >
          <div className="decision-heading">
            <span className="decision-number">{decision.number}</span>
            <h3>{decision.title}</h3>
          </div>
          <p>{decision.benefit}</p>
          <p>
            <em>The cost.</em> {decision.cost}
          </p>
          <div className="project-links">
            <External href={decision.href}>{decision.sourceLabel}</External>
            {decision.number === "02" && (
              <>
                <External href={vaultStudy.supplementary.billingComparison}>
                  Demo billing
                </External>
                <External href={vaultStudy.supplementary.userManagement}>
                  User controls
                </External>
              </>
            )}
          </div>
        </section>
      ))}
      <p className="case-evidence-note">
        Demo account · checkout untested. Paid-tier rules source-reviewed.
      </p>
    </PageTemplate>
  );
}

export function PipelinePage({ page }: PageProps) {
  return (
    <PageTemplate page={page} className="page--case page--supporting">
      <h2 className="case-title" tabIndex={-1}>
        CI/CD Pipeline Engine
      </h2>
      <div className="story">
        <p>
          A TypeScript engine for webhook-triggered workflows and
          dependency-aware job execution.
        </p>
      </div>
      <section className="case-group">
        <h3>From milestones to an engine</h3>
        <p>
          From structured deployment prompts, I implemented scheduling,
          concurrency and process lifecycle handling.
        </p>
      </section>
      <ol className="process-notes" aria-label="Pipeline execution flow">
        <li>
          <span>01</span>
          <p>Verify webhook signatures and deduplicate deliveries.</p>
        </li>
        <li>
          <span>02</span>
          <p>
            Schedule dependencies with two slots per run; skip blocked jobs.
          </p>
        </li>
        <li>
          <span>03</span>
          <p>Run host processes with retries, timeouts and cancellation.</p>
        </li>
      </ol>
      <section className="case-group">
        <p>
          <em>The tradeoff.</em> Readiness waits for each wave to settle. Host
          processes retain the runner’s OS permissions.
        </p>
      </section>
      <p className="case-evidence-note">
        Five unit-test files passed; full-engine behavior was source-reviewed.
      </p>
      <div className="project-links">
        <External href={projects[1].repository}>Repository</External>
        <External
          href={`${projects[1].repository}/blob/main/src/scheduler/pipeline-scheduler.ts`}
        >
          Scheduler
        </External>
      </div>
    </PageTemplate>
  );
}

export function HarigurusPage({ page }: PageProps) {
  return (
    <PageTemplate page={page} className="page--case page--supporting">
      <div className="case-heading">
        <h2 className="case-title" tabIndex={-1}>
          Harigurus
        </h2>
        <p className="case-audience">
          Full Stack Developer · 2022–2023 · 8 months
        </p>
      </div>
      <div className="story">
        <p>
          I built ceremony-booking features connecting customers with purohits,
          from appointment details to confirmation.
        </p>
      </div>
      <section className="case-group">
        <h3>Booking, from browser to API</h3>
        <p>
          Built React ceremony selection and scheduling, with Node.js and
          Express APIs validating and saving booking records.
        </p>
      </section>
      <section className="case-group">
        <h3>Payment before confirmation</h3>
        <p>
          Integrated Razorpay checkout and server-side payment verification,
          then Twilio SMS for booking confirmations and status updates.
        </p>
      </section>
      <p className="case-evidence-note">
        Booking details → verified payment → SMS confirmation.
      </p>
      <p className="case-evidence-note">
        Team contribution. Production code remains private with Harigurus; the
        repository is a written case study.
      </p>
      <div className="project-links">
        <External href={projects[2].repository}>Written case study</External>
        <External href={projects[2].href}>Company website</External>
        <External href={harigurusShop}>Harigurus shop</External>
      </div>
    </PageTemplate>
  );
}

export function ReferencesPage({ page }: PageProps) {
  return (
    <PageTemplate page={page} className="page--case page--references">
      <h2 className="case-title" tabIndex={-1}>
        {page.title}
      </h2>
      <div className="reference-list">
        {references
          .filter((reference) => reference.pageId === page.id)
          .map((reference) => (
            <figure
              className="reference"
              key={reference.id}
              data-reference-id={reference.id}
            >
              <blockquote>
                <p>“{reference.quote}”</p>
              </blockquote>
              <figcaption>
                <img
                  src={`/images/references/${reference.id}-96.webp`}
                  srcSet={`/images/references/${reference.id}-96.webp 96w, /images/references/${reference.id}-192.webp 192w`}
                  sizes="96px"
                  width={96}
                  height={96}
                  alt={`Portrait of ${reference.name}`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <div>
                  <p className="reference-name">{reference.name}</p>
                  <p className="reference-role">{reference.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
      </div>
    </PageTemplate>
  );
}

export function SecurityPage({ page }: PageProps) {
  return (
    <PageTemplate page={page} className="page--case page--supporting">
      <h2 className="case-title" tabIndex={-1}>
        Security Lab & practice
      </h2>
      <div className="story">
        <p>Browser authentication experiments across real loopback origins.</p>
      </div>
      <section className="case-group">
        <h3>Published baseline</h3>
        <p>
          Cookie storage and SameSite & CSRF experiments with request
          inspection. Repository record: 11 server and 29 Chromium checks.
        </p>
      </section>
      <section className="case-group">
        <h3>In progress · JWT verification</h3>
        <p>
          Comparing historical verifier flaws with hardened validation. This
          local work has not been published.
        </p>
      </section>
      <p className="case-evidence-note">
        Loopback only. Vulnerable routes stay off public hosting.
      </p>
      <section className="case-group" aria-label="Engineering practice">
        <h3>Tools in practice</h3>
        <dl className="practice-list">
          {professionalStory.practice.map(({ area, detail }) => (
            <div key={area}>
              <dt>{area}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="project-links">
        <External href={projects[3].repository}>
          Lab source & verification
        </External>
      </div>
    </PageTemplate>
  );
}

export function ColophonPage({ page }: PageProps) {
  return (
    <PageTemplate
      page={page}
      className="page--case page--supporting page--colophon"
    >
      <h2 className="case-title" tabIndex={-1}>
        Experience & contact
      </h2>
      <ol className="experience-list" aria-label="Professional experience">
        {professionalStory.experience.map(
          ({ company, role, dates, detail }) => (
            <li key={company}>
              <p className="experience-dates">{dates}</p>
              <h3>
                {company} <span>· {role}</span>
              </h3>
              <p>{detail}</p>
            </li>
          ),
        )}
      </ol>
      <nav className="contact-links" aria-label="Contact and résumé">
        <a
          className="text-link"
          href="/adarsh-singh-resume.pdf"
          download="Adarsh-Singh-Resume.pdf"
        >
          Download résumé (PDF) <ArrowRight aria-hidden="true" />
        </a>
        <div className="project-links">
          <a className="text-link" href={`mailto:${professionalStory.email}`}>
            {professionalStory.email}
          </a>
          {professionalStory.phones.map(({ label, href }) => (
            <a key={href} className="text-link" href={href}>
              {label}
            </a>
          ))}
          <External href={professionalStory.github}>GitHub</External>
          <External href={professionalStory.linkedin}>LinkedIn</External>
        </div>
      </nav>
      <p className="case-evidence-note edition-note">
        First edition · 2026. Cormorant Garamond & EB Garamond.
      </p>
    </PageTemplate>
  );
}

const pageRenderers: Record<PageKind, React.ComponentType<PageProps>> = {
  cover: CoverPage,
  portrait: PortraitPage,
  contents: ContentsPage,
  project: VaultPage,
  contributions: ContributionsPage,
  architecture: ArchitecturePage,
  decisions: DecisionsPage,
  pipeline: PipelinePage,
  harigurus: HarigurusPage,
  references: ReferencesPage,
  security: SecurityPage,
  colophon: ColophonPage,
};

// Page records are immutable. Reuse the semantic face while shell state and
// reading location change instead of reconciling every static source page.
export const BookPage = memo(function BookPage({ page }: PageProps) {
  const Page = pageRenderers[page.kind];
  return <Page page={page} />;
});
