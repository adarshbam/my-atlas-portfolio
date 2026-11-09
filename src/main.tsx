import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import "@/styles/tokens.css";
import "@/styles/font-subsets.css";
import "@/styles/book.css";
import "@/styles/premium.css";

const Story = lazy(() => import("@/story/Story"));
const loadBook = () => import("@/components/ui/book-slider");
let Book: React.ComponentType<{
  initialPosition?: { page: number; readMode: boolean };
}> = lazy(loadBook);
type PreviousBook = {
  url: string;
  scroll: number;
  position?: { page: number; readMode: boolean };
};
const isStory = () => location.pathname.replace(/\/+$/, "") === "/story";
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
        Number.isInteger(value.position?.page) &&
        typeof value.position?.readMode === "boolean"
      )
        return value;
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
      if (!disposed) detach = attachInspector(document);
    });
    return () => { disposed = true; detach?.(); };
  }, []);
  const [story, setStory] = useState(isStory());
  const [visitedBook, setVisitedBook] = useState(!isStory());
  const [returned, setReturned] = useState(false);
  const previous = useRef<PreviousBook>(readPrevious());
  useLayoutEffect(() => {
    if (!story && returned)
      document
        .querySelector<HTMLAnchorElement>("[data-open-story]")
        ?.focus({ preventScroll: true });
  }, [story, returned]);
  useEffect(() => {
    if (story || !returned) return;
    const observer = new MutationObserver(() => {
      const link =
        document.querySelector<HTMLAnchorElement>("[data-open-story]");
      if (!link) return;
      if (document.activeElement === document.body)
        link.focus({ preventScroll: true });
      observer.disconnect();
    });
    if (!document.querySelector("[data-open-story]"))
      observer.observe(document.getElementById("root")!, {
        childList: true,
        subtree: true,
      });
    const timer = window.setTimeout(() => {
      if (document.activeElement === document.body)
        document
          .querySelector<HTMLAnchorElement>("[data-open-story]")
          ?.focus({ preventScroll: true });
    }, 150);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [story, returned]);
  const route = (show: boolean) => {
    if (show) {
      const shell = document.querySelector<HTMLElement>(".book-shell");
      const page = Number(shell?.dataset.logicalPage);
      previous.current = {
        url: location.pathname + location.search + location.hash,
        scroll: window.scrollY,
        position: {
          page: Number.isInteger(page) ? page : 0,
          readMode: shell?.dataset.mode === "reading",
        },
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
      requestAnimationFrame(() => window.scrollTo(0, previous.current.scroll));
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
      route(true);
    };
    const popped = () => {
      const next = isStory();
      if (!next) {
        setVisitedBook(true);
        setReturned(true);
      }
      setStory(next);
      if (!next)
        requestAnimationFrame(() =>
          window.scrollTo(0, previous.current.scroll),
        );
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
        <div
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
          <Suspense fallback={<p role="status">Opening the atlas…</p>}>
            <Book initialPosition={previous.current.position} />
          </Suspense>
        </div>
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
if (isStory()) {
  mount();
} else {
  // Resolve the initial route before mounting. Suspending the first React
  // commit otherwise holds the ready cover behind a fallback reveal delay.
  // Direct story visits keep the book module lazy until the reader returns.
  void loadBook().then((module) => {
    Book = module.default;
    mount();
  });
}
