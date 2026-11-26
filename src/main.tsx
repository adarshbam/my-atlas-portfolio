import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { FrontRun } from "@/front/FrontRun";
import { SHORT_WINDOW } from "@/front/scenes";
import { Arrival, arrivalEnd, focusAtlas, goToBook, settleArrival } from "@/front/Arrival";
import { pageIndex } from "@/lib/book-navigation";
import { useMediaQuery } from "@/lib/use-media-query";
import { attachVaultVideo } from "@/story/vault-media.js";
import { portfolioVideos } from "@/data/portfolio-videos";
import "@/styles/tokens.css";
import "@/styles/font-subsets.css";
import "@/styles/book.css";
import "@/styles/premium.css";

/**
 * A page that was opened before a new build asks, later, for a file that is no longer served
 * (file names carry the build's hash). The import fails and React would leave an empty page.
 * Instead the page is loaded afresh at the address it is on, once; a second failure at the
 * same address is a real fault and is thrown.
 */
const RELOADED = "atlas-chunk-reload";
function fresh<T>(load: () => Promise<T>): () => Promise<T> {
  return () =>
    load().then(
      (module) => {
        try {
          sessionStorage.removeItem(RELOADED);
        } catch {
          /* Storage may be unavailable. */
        }
        return module;
      },
      (error: unknown) => {
        const address = location.pathname + location.hash;
        let tried = true;
        try {
          tried = sessionStorage.getItem(RELOADED) === address;
          sessionStorage.setItem(RELOADED, address);
        } catch {
          /* Without storage there is no way to know it is the first attempt: do not loop. */
        }
        if (tried) throw error;
        location.reload();
        // The page is leaving: nothing more is rendered from here.
        return new Promise<T>(() => {});
      },
    );
}
const Story = lazy(fresh(() => import("@/story/Story")));
const loadBook = fresh(() => import("@/components/ui/book-slider"));
let Book: React.ComponentType<{
  initialPosition?: { page: number };
}> = lazy(loadBook);
type PreviousBook = {
  url: string;
  scroll: number;
  position?: { page: number };
};
const isStory = () => location.pathname.replace(/\/+$/, "") === "/story";
/** The reader asked for the book itself, by a link to it. */
const wantsBook = () => location.hash === "#book";
/** In the page and there to be seen (not hidden, and not inside anything hidden). */
const seen = (node: HTMLElement | null) =>
  !!node?.isConnected && node.checkVisibility({ visibilityProperty: true });
/**
 * Back from the story, keyboard focus goes back to where the reader left from, so the next
 * Tab carries on from there and not from the top of the run. Called once the page has been
 * scrolled back to its place. `origin` is the link that opened the story, when it was pressed
 * in this visit.
 */
function focusOnReturn(origin: HTMLElement | null) {
  // The arrival was laid out off screen while the story was open: bring it up to date first,
  // so nothing takes focus that the restored position is about to hide.
  settleArrival();
  // The desk's own link is still there to be seen.
  if (seen(origin)) return origin?.focus({ preventScroll: true });
  // The book's link is inside Contents, which closed on the press: the button that opens it.
  const contents = document.querySelector<HTMLElement>("#book-arrival .contents-trigger");
  if (origin?.closest(".atlas") && seen(contents)) return contents?.focus({ preventScroll: true });
  // No press to go by (the story was reloaded, or reached by Back and Forward). A reader who
  // is put back at the book starts in the book. One put back where the desk's link is on
  // screen left by that link. Anywhere else (the top of the page) focus is left alone.
  const end = arrivalEnd();
  if (end > 0 && scrollY >= end - 1) return focusAtlas();
  const desk = document.querySelector<HTMLElement>("#book-arrival .atlas-arrival-copy [data-open-story]");
  if (origin || !desk || !seen(desk)) return;
  const box = desk.getBoundingClientRect();
  if (box.top >= 0 && box.bottom <= innerHeight) desk.focus({ preventScroll: true });
}
/** Asks the book for a page once its engine is ready, however long its code takes to arrive. */
function requestPage(pageId: string) {
  const send = () => {
    if (document.getElementById("book")?.dataset.ready !== "true") return false;
    document.dispatchEvent(new CustomEvent("atlas:go-to-page", { detail: pageId }));
    return true;
  };
  if (send()) return;
  const observer = new MutationObserver(() => {
    if (send()) observer.disconnect();
  });
  observer.observe(document.getElementById("root")!, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-ready"] });
}
function readPrevious(): PreviousBook {
  try {
    if (isStory()) {
      const value = JSON.parse(
        sessionStorage.getItem("atlas-story-return") || "null",
      );
      if (
        value &&
        typeof value.url === "string" &&
        value.url.startsWith("/") &&
        !value.url.startsWith("//") &&
        typeof value.scroll === "number" &&
        Number.isInteger(value.position?.page)
      )
        // Only the fields still in use are taken; anything else a stored value holds is ignored.
        return { url: value.url, scroll: value.scroll, position: { page: value.position.page } };
    }
  } catch {
    /* Storage may be unavailable. */
  }
  return { url: "/", scroll: 0 };
}
function App() {
  useEffect(() => {
    let disposed = false;
    let detach: (() => void) | undefined;
    void import("../public/media-viewer.js").then(({attachInspector}) => {
      if (!disposed) detach = attachInspector(document, portfolioVideos, attachVaultVideo);
    });
    return () => { disposed = true; detach?.(); };
  }, []);
  const [story, setStory] = useState(isStory());
  const [visitedBook, setVisitedBook] = useState(!isStory());
  const [returned, setReturned] = useState(false);
  const previous = useRef<PreviousBook>(readPrevious());
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  // The run and the arrival stand still for reduced motion, and in a window too short to
  // hold a pinned scene. The book reads the motion preference for itself.
  const short = useMediaQuery(SHORT_WINDOW);
  const still = reduced || short;
  // The book's code loads when the reader nears it, or at once when they ask for it.
  const [bookWanted, setBookWanted] = useState(wantsBook);
  const nearBook = useRef(() => setBookWanted(true)).current;
  // The page the book starts on. Held in state so a request made while the book's code is
  // still loading reaches the book when it first renders.
  const [start, setStart] = useState(previous.current.position);
  // The control in the run that sent the reader to the book, for when they come Back.
  const leftFrom = useRef<HTMLElement | null>(null);
  const openBook = useRef((pageId?: string) => {
    const page = pageId ? pageIndex(pageId) : undefined;
    // The jump gets its own history entry, so Back returns the reader to the scene they left.
    // It is written first: a book that is already there takes focus and scrolls at once, and
    // the entry being left must keep the scene's place, not the book's.
    if (!wantsBook()) {
      const from = document.activeElement;
      leftFrom.current = from instanceof HTMLElement && from !== document.body ? from : null;
      history.pushState({ atlasBook: true }, "", "#book");
    }
    if (pageId && page !== undefined) {
      if (!document.getElementById("book")) setStart({ page });
      requestPage(pageId);
    }
    setBookWanted(true);
    requestAnimationFrame(() => {
      goToBook();
      // A book that was already there has put focus on the page's heading by now: leave it.
      if (!document.activeElement?.closest("#book-arrival .atlas")) focusAtlas();
    });
  }).current;
  // "Explore Vault" in the introduction player. The book turns itself to Vault when it is
  // mounted; from the run it is not, or it is off screen, so the reader is taken to it.
  useEffect(() => {
    const exploreVault = () => {
      if (isStory()) return;
      const arrival = document.getElementById("book-arrival");
      if (!document.getElementById("book")) openBook("vault");
      else if (arrival?.dataset.arrived !== "true") goToBook();
    };
    document.addEventListener("atlas:video-vault", exploreVault);
    return () => document.removeEventListener("atlas:video-vault", exploreVault);
  }, [openBook]);
  // A link straight to the book lands on the finished arrival.
  useLayoutEffect(() => {
    if (isStory() || !wantsBook()) return;
    goToBook();
    focusAtlas();
  }, []);
  // Which of the two the address last showed, so a change of address inside the atlas (a link
  // to the book) is not taken for a return from the story.
  const onStory = useRef(isStory());
  // The link that opened the story, for putting focus back on return.
  const storyOrigin = useRef<HTMLElement | null>(null);
  // Back at the atlas: the page goes to where it was once it is laid out again, and keyboard
  // focus goes with it.
  const comeBack = useRef(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, previous.current.scroll);
      focusOnReturn(storyOrigin.current);
    });
  }).current;
  const route = (show: boolean) => {
    onStory.current = show;
    if (show) {
      const shell = document.querySelector<HTMLElement>(".book-shell");
      const page = Number(shell?.dataset.logicalPage);
      previous.current = {
        url: location.pathname + location.search + location.hash,
        scroll: window.scrollY,
        position: { page: Number.isInteger(page) ? page : 0 },
      };
      try {
        sessionStorage.setItem(
          "atlas-story-return",
          JSON.stringify(previous.current),
        );
      } catch {
        /* In-memory return still works. */
      }
      history.pushState({ atlasStory: true }, "", "/story");
      setStory(true);
      window.scrollTo(0, 0);
    } else {
      history.pushState({}, "", previous.current.url);
      setVisitedBook(true);
      setStory(false);
      setReturned(true);
      comeBack();
    }
  };
  useEffect(() => {
    const clicked = (event: MouseEvent) => {
      const target = (
        event.target as Element | null
      )?.closest<HTMLAnchorElement>("[data-open-story]");
      if (
        !target ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      storyOrigin.current = target;
      route(true);
    };
    // The address changed without a load: Back or Forward, or a fragment typed or followed.
    const popped = () => {
      const next = isStory();
      const was = onStory.current;
      onStory.current = next;
      if (next === was) {
        // Still the atlas (or still the story). An address that now names the book takes the
        // reader to it; any other change inside the page is the browser's own to place.
        if (!next && wantsBook()) openBook();
        // Back from a jump to the book: the browser puts the page where it was, and keyboard
        // focus goes back to the control that was pressed.
        else if (!next && seen(leftFrom.current)) leftFrom.current?.focus({ preventScroll: true });
        return;
      }
      if (!next) {
        setVisitedBook(true);
        setReturned(true);
      }
      setStory(next);
      if (!next) comeBack();
    };
    document.addEventListener("click", clicked);
    window.addEventListener("popstate", popped);
    return () => {
      document.removeEventListener("click", clicked);
      window.removeEventListener("popstate", popped);
    };
  }, []);
  return (
    <>
      {visitedBook && (
        <main
          className={returned && !story ? "atlas-return" : undefined}
          inert={story}
          aria-hidden={story || undefined}
          style={
            story
              ? {
                  position: "fixed",
                  inset: 0,
                  visibility: "hidden",
                  pointerEvents: "none",
                }
              : undefined
          }
        >
          <FrontRun reduced={still} onBook={openBook} />
          <Arrival reduced={still} mounted={bookWanted || returned} onNear={nearBook}>
            <Suspense fallback={<div className="atlas-arrival-hold" role="status" aria-label="Opening the atlas" />}>
              <Book initialPosition={returned ? previous.current.position : start} />
            </Suspense>
          </Arrival>
        </main>
      )}
      {story && (
        <Suspense fallback={<p role="status">Opening the story…</p>}>
          <Story onReturn={() => route(false)} />
        </Suspense>
      )}
    </>
  );
}
const mount = () =>
  createRoot(document.getElementById("root")!).render(<App />);
// The run paints first. The book's code is fetched when the reader nears it
// (Arrival), so nothing waits on it here; a link straight to the book starts
// the fetch before React mounts.
if (!isStory() && wantsBook()) void loadBook();
mount();
