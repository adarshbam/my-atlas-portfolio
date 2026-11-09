import { memo } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import {
  opening,
  securityLabs,
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
      <span className="rule-draw" data-draw-rule aria-hidden="true" />
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
        <button type="button" className="page-scroll-hint" hidden aria-label="Scroll down this page">
          <ArrowDown aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function CoverArtwork() {
  return (
    <img
      className="portrait-cover-art"
      src={opening.portrait.src}
      srcSet={opening.portrait.srcSet}
      sizes="(max-width: 767px) 84vw, (max-width: 1439px) 50vw, 45vw"
      width={opening.portrait.width}
      height={opening.portrait.height}
      alt={opening.portrait.alt}
      fetchPriority="high"
      draggable={false}
    />
  );
}

export function CoverPage({ page }: PageProps) {
  return (
    <article
      className="book-page page--cover page--portrait-cover"
      data-density="hard"
      data-page={pageIndex(page.id)}
      data-page-id={page.id}
      aria-label={page.title}
    >
      <div className="sheet-surface">
        <CoverArtwork />
        <div className="cover-spine" aria-hidden="true" />
        <div className="page-inner cover-inner portrait-cover-inner">
          <RunningHead left="Portfolio" right={opening.edition} />
          <div className="portrait-cover-copy">
            <h2 tabIndex={-1}>
              {opening.firstName}
              <br />
              {opening.lastName}
            </h2>
            <div className="short-rule" />
            <p className="eyebrow">{opening.role}</p>
            <p className="portrait-cover-stack">
              <span>React · Node.js</span>
              <span className="stack-separator"> · </span>
              <span>TypeScript</span>
            </p>
          </div>
          <p className="portrait-cover-note">{opening.introduction}</p>
          <div className="portrait-cover-footer">
            <button
              type="button"
              className="text-link cover-open cover-folio-button"
              data-turn-page-id="introduction"
              aria-label="Open book"
            >
              Open book
            </button>
            <span className="portrait-cover-atlas">{opening.title}</span>
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
        aria-label={
          compact
            ? "Selected work system overview; scroll horizontally on small screens"
            : "Vault file flow; scroll horizontally on small screens"
        }
      >
        <div className="diagram-canvas">
          {compact ? <CompactFileDrawing /> : <FileFlowDrawing />}
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
          <button
            type="button"
            className="text-link trace-flow"
            data-trace-flow
          >
            Trace file flow
          </button>
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

export function AtlasMapPage({ page }: PageProps) {
  return (
    <article
      className="book-page page--portrait page--introduction"
      data-page={pageIndex(page.id)}
      data-page-id={page.id}
      aria-label="Introduction"
    >
      <div className="sheet-surface">
        <img
          className="introduction-portrait"
          src={opening.portrait.src}
          srcSet={opening.portrait.srcSet}
          sizes="(max-width: 767px) 84vw, 45vw"
          width={opening.portrait.width}
          height={opening.portrait.height}
          alt={opening.portrait.alt}
          draggable={false}
        />
        <div className="page-inner introduction-inner">
          <RunningHead left="Portfolio" right="2026" />
          <div className="introduction-copy">
            <h2 tabIndex={-1}>
              {opening.firstName}
              <br />
              {opening.lastName}
            </h2>
            <div className="short-rule" />
            <p className="eyebrow">{opening.role}</p>
            <p className="introduction-stack">{opening.stack}</p>
          </div>
          <p className="introduction-note">{opening.introduction}</p>
          <Folio number={page.folio} label={page.footer} />
        </div>
      </div>
    </article>
  );
}

function CompactFileDrawing() {
  return (
    <svg
      className="diagram-geometry"
      viewBox="0 0 720 330"
      aria-hidden="true"
      focusable="false"
    >
      <g className="diagram-routes">
        <path className="diagram-route" d="M124 190H286" />
        <path className="diagram-route" d="M286 204H124" />
        <path className="diagram-route" d="M100 150V62Q100 50 112 50H424" />
        <path className="diagram-route" d="M504 76H610Q622 76 622 88V152" />
        <path className="diagram-route" d="M610 152V100Q610 88 598 88H504" />
        <path className="diagram-route" d="M594 220V312H100V218" />
        <path
          className="diagram-arrowhead"
          d="m278 186 8 4-8 4m-146 6-8 4 8 4m278-158 8 4-8 4m194 94 4 8 4-8m-126-60-8 4 8 4M96 226l4-8 4 8"
        />
      </g>
      <g className="diagram-platform">
        <path className="diagram-plane-side" d="m45 118 65 27v58l-65-27Z" />
        <path className="diagram-plane-top" d="m51 128 53 22v44l-53-22Z" />
        <path className="diagram-plane-top" d="m45 176 65 27 27 16-65-27Z" />
        <path className="diagram-detail" d="m56 184 51 21m-40-16 20 8" />
      </g>
      <DiagramStack x={333} y={160} />
      <DiagramStack x={465} y={36} />
      <g className="diagram-platform">
        <path
          className="diagram-plane-top"
          d="M579 208c-24-2-27-31-8-40 0-20 24-28 38-15 20-23 54-6 52 17 26 3 27 37 0 38Z"
        />
        <path className="diagram-detail" d="M579 214h82c16 0 25-13 23-23" />
      </g>
    </svg>
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
      <section className="case-group vault-adoption" aria-label="Vault adoption evidence">
        <h3>In use beyond the demo</h3>
        <p>Deployed with external users. The administration snapshot records 10 registered accounts and 45.01 TB of provisioned quota.</p>
        <VaultFigure image="accounts" />
      </section>
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

export function VaultFigure({
  image,
}: {
  image: keyof typeof vaultStudy.images;
}) {
  const asset = vaultStudy.images[image];
  return (
    <figure className={`vault-figure vault-figure--${image}`}>
      <a
        href={asset.full}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open full ${image === "workspace" ? "GitHub workbench" : image === "accounts" ? "Vault account metrics" : "Owner Control Center"} capture`}
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
    <PageTemplate page={page} className="page--case page--supporting page--pipeline">
      <h2 className="case-title" tabIndex={-1}>
        GitHub CI/CD Engine
      </h2>
      <div className="story">
        <p>
          From a signed GitHub push to dependency-aware jobs, live logs and
          a React Flow dashboard.
        </p>
      </div>
      <figure className="vault-figure pipeline-preview">
        <a href="/projects/ci-cd-engine.html" target="_blank" rel="noreferrer" aria-label="Explore the GitHub CI/CD Engine case study and screenshots">
          <img src="/images/pipeline/dashboard-640.webp" srcSet="/images/pipeline/dashboard-640.webp 640w, /images/pipeline/dashboard-1200.webp 1200w" sizes="(max-width: 767px) 76vw, 38vw" width={1200} height={654} alt="CI/CD management dashboard showing recent runs and configured workflows" loading="lazy" decoding="async" />
        </a>
        <figcaption>Original dashboard capture · Explore the case study ↗</figcaption>
      </figure>
      <ol className="process-notes" aria-label="Pipeline execution flow">
        <li>
          <span>01</span>
          <p>Authenticate webhooks; filter and deduplicate pushes.</p>
        </li>
        <li>
          <span>02</span>
          <p>
            Resolve dependencies with two slots per run; diagnose cycles.
          </p>
        </li>
        <li>
          <span>03</span>
          <p>Inspect logs and history; retry, time out or cancel jobs.</p>
        </li>
      </ol>
      <section className="case-group">
        <p>
          Built from structured deployment milestones. Readiness waits for each
          wave; commands retain the runner’s OS permissions.
        </p>
      </section>
      <p className="case-evidence-note">
        Updated source and supplied captures reviewed; no production deployment
        performed for this case study.
      </p>
      <div className="project-links">
        <External href="/projects/ci-cd-engine.html">Full case study</External>
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
          Full Stack Developer · 2022 · about 8 months
        </p>
      </div>
      <div className="story">
        <p>
          I built ceremony-booking features connecting customers with purohits,
          from appointment details to confirmation.
        </p>
      </div>
      <div className="harigurus-gallery" role="group" aria-label="Inside Harigurus">
        <figure className="vault-figure harigurus-figure">
          <a href="/images/harigurus/services-1920.webp" target="_blank" rel="noreferrer" aria-label="View the Harigurus service-booking homepage screenshot full-size">
            <img
              src="/images/harigurus/services-640.webp"
              srcSet="/images/harigurus/services-640.webp 640w, /images/harigurus/services-1200.webp 1200w"
              sizes="(max-width: 767px) 76vw, 20vw"
              width={1200}
              height={653}
              alt="Harigurus homepage introducing event services and a Book appointment action"
              loading="lazy"
              decoding="async"
            />
          </a>
          <figcaption>Service booking · Homepage ↗</figcaption>
        </figure>
        <figure className="vault-figure harigurus-figure">
          <a href="/images/harigurus/shop-1920.webp" target="_blank" rel="noreferrer" aria-label="View the Harigurus handicraft shop screenshot full-size">
            <img
              src="/images/harigurus/shop-640.webp"
              srcSet="/images/harigurus/shop-640.webp 640w, /images/harigurus/shop-1200.webp 1200w"
              sizes="(max-width: 767px) 76vw, 20vw"
              width={1200}
              height={654}
              alt="Harigurus shop displaying handicraft categories, product photographs and prices"
              loading="lazy"
              decoding="async"
            />
          </a>
          <figcaption>Handicraft shop · Catalogue ↗</figcaption>
        </figure>
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
  const pair = references.filter((reference) => reference.pageId === page.id);
  return (
    <PageTemplate page={page} className="page--case page--references">
      <h2 className="case-title" tabIndex={-1}>
        {page.title}
      </h2>
      <div className="reference-list reference-featured">
        {pair.map((reference, index) => (
          <div
            className="reference"
            key={reference.id}
            data-reference-id={reference.id}
            aria-hidden={index !== 0}
            inert={index !== 0}
          >
            <figure className="reference-quote">
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
          </div>
        ))}
      </div>
      {pair.length > 1 && (
        <div
          className="reference-tabs"
          role="tablist"
          aria-label={`${page.title} authors`}
        >
          {pair.map((reference, index) => (
            <button
              type="button"
              role="tab"
              key={reference.id}
              data-reference-select={reference.id}
              aria-selected={index === 0}
              tabIndex={index === 0 ? 0 : -1}
            >
              {reference.name}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="text-link reference-read-all"
        data-reference-all
      >
        Read all references <ArrowRight aria-hidden="true" />
      </button>
      <button
        type="button"
        className="text-link reference-show-featured"
        data-reference-featured
      >
        Show featured quotes
      </button>
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
        <p>
          Seven connected labs, from access control to JWT verification.
          Twenty-eight experiments compare vulnerable and protected
          implementations through real requests and browser evidence.
        </p>
      </div>
      <section className="case-group" aria-label="Seven-lab learning path">
        <h3>From foundations to advanced verification</h3>
        <p>
          Each lab builds on earlier concepts, with increasing difficulty.
          The order guides study; every lab remains freely accessible.
        </p>
        <ol className="process-notes">
          {securityLabs.map(({ title, detail }, index) => (
            <li key={title}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p><em>{title}</em> — {detail}</p>
            </li>
          ))}
        </ol>
      </section>
      <figure className="vault-figure security-figure">
        <a href="/images/security-lab/workbench-1920.webp" target="_blank" rel="noreferrer">
          <img
            src="/images/security-lab/workbench-1200.webp"
            srcSet="/images/security-lab/workbench-640.webp 640w, /images/security-lab/workbench-1200.webp 1200w, /images/security-lab/workbench-1920.webp 1920w"
            sizes="(max-width: 767px) 84vw, (max-width: 1279px) 42vw, 640px"
            width={1920}
            height={1048}
            loading="lazy"
            alt="JWT workbench showing the seven lab tabs and the Understand, Predict, Experiment, Compare and Learn stages"
          />
        </a>
        <figcaption>Lab 07 · JWT comparison on local HTTPS. Open the full screenshot.</figcaption>
      </figure>
      <section className="case-group">
        <h3>Predict, test, explain</h3>
        <p>
          Understand → Predict → Experiment → Compare → Learn. Inspect
          redacted server observations, compare executable source and record
          findings. Concept feedback and recall practice stay in the browser.
        </p>
      </section>
      <p className="case-evidence-note">
        Published source; loopback only. Labs share concepts, not credentials
        or runtime state. Deliberately vulnerable routes and historical JWT
        libraries stay off public hosting.
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
          Lab source
        </External>
        <External href={`${projects[3].repository}/blob/main/docs/verification.md`}>
          Verification record
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
        >
          View résumé (PDF) <ArrowRight aria-hidden="true" />
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
  "atlas-map": AtlasMapPage,
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
