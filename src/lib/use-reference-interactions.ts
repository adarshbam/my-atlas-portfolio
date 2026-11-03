import { useEffect, useRef, type RefObject } from "react";
import { animate } from "motion/mini";
import { references } from "@/data/portfolio";
import { soundEngine } from "@/lib/audio/sound-engine";
type Props = {
  root: RefObject<HTMLElement | null>;
  reduced: boolean;
  readMode: boolean;
  ready: boolean;
  turning: boolean;
  onReading: (value: boolean) => void;
  announce: (message: string) => void;
};
let copyNumber = 0;
export function useReferenceInteractions(props: Props) {
  const selected = useRef<Record<string, string>>({}),
    all = useRef(false),
    latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const root = props.root.current;
    if (!root) return;
    const known = new WeakSet<HTMLElement>(),
      identities = new WeakMap<HTMLElement, string>();
    const animations = new Map<HTMLElement, ReturnType<typeof animate>>();
    let revision = 0;
    const stop = (figure: HTMLElement) => {
      try {
        animations.get(figure)?.stop();
      } catch {
        /* Engine may already have detached the face. */
      }
      animations.delete(figure);
    };
    const syncPage = (page: HTMLElement, changing = false) => {
      known.add(page);
      const id = page.dataset.pageId!,
        expanded = latest.current.readMode && all.current;
      if (!identities.has(page))
        identities.set(page, `reference-copy-${++copyNumber}`);
      const identity = identities.get(page)!;
      const figures = [
        ...page.querySelectorAll<HTMLElement>("[data-reference-id]"),
      ];
      const choice = figures.some(figure => figure.dataset.referenceId === selected.current[id])
        ? selected.current[id] : figures[0]?.dataset.referenceId;
      const style = getComputedStyle(root),
        duration = parseFloat(style.getPropertyValue("--dur-base")) / 1000;
      const ease = style
        .getPropertyValue("--ease-out")
        .match(/[\d.]+/g)!
        .map(Number) as [number, number, number, number];
      const pending: Promise<unknown>[] = [];
      figures.forEach((figure) => {
        const visible = expanded || figure.dataset.referenceId === choice;
        const opacity = Number(getComputedStyle(figure).opacity);
        stop(figure);
        figure.id = `${identity}-${figure.dataset.referenceId}`;
        const standalone = expanded || figures.length === 1;
        figure.setAttribute("role", standalone ? "group" : "tabpanel");
        const author = figure.querySelector<HTMLElement>('.reference-name');
        if(author) author.id = `${identity}-${figure.dataset.referenceId}-author`;
        figure.setAttribute('aria-labelledby', standalone ? `${identity}-${figure.dataset.referenceId}-author` : `${identity}-${figure.dataset.referenceId}-tab`);
        figure.setAttribute("aria-hidden", String(!visible));
        figure.inert = !visible;
        figure.style.removeProperty("visibility");
        if (
          changing &&
          !expanded &&
          !latest.current.reduced &&
          !document.hidden &&
          opacity !== Number(visible)
        ) {
          figure.style.visibility = "visible";
          const control = animate(
            figure,
            { opacity: [opacity, Number(visible)] },
            { duration, ease },
          );
          animations.set(figure, control);
          pending.push(
            Promise.resolve(control).then(() => {
              if (animations.get(figure) !== control) return;
              animations.delete(figure);
              figure.style.removeProperty("visibility");
              figure.style.removeProperty("opacity");
            }),
          );
        } else figure.style.removeProperty("opacity");
      });
      page
        .querySelectorAll<HTMLElement>("[data-reference-select]")
        .forEach((button) => {
          const active = button.dataset.referenceSelect === choice;
          button.id = `${identity}-${button.dataset.referenceSelect}-tab`;
          button.setAttribute("aria-selected", String(active));
          button.tabIndex = active ? 0 : -1;
          button.setAttribute(
            "aria-controls",
            `${identity}-${button.dataset.referenceSelect}`,
          );
        });
      return pending;
    };
    const sync = (changing = "") => {
      root
        .querySelector(".reading-document")
        ?.setAttribute(
          "data-references-all",
          String(latest.current.readMode && all.current),
        );
      return [
        ...root.querySelectorAll<HTMLElement>(".page--references"),
      ].flatMap((page) => syncPage(page, page.dataset.pageId === changing));
    };
    const click = (event: MouseEvent) => {
      const target = (event.target as Element).closest<HTMLElement>(
        "[data-reference-select],[data-reference-all],[data-reference-featured]",
      );
      if (!target || !root.contains(target)) return;
      const generation = ++revision;
      if (target.hasAttribute("data-reference-all")) {
        all.current = true;
        latest.current.onReading(true);
        sync();
        const group = root.querySelector("#reading-references");
        group?.scrollIntoView({ block: "start" });
        group?.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});
        return;
      }
      if (target.hasAttribute("data-reference-featured")) {
        all.current = false;
        sync();
        const section = target.closest(".page--references");
        (section?.querySelector<HTMLElement>('[aria-selected="true"]') ?? section?.querySelector<HTMLElement>('h2'))?.focus();
        return;
      }
      const id = target.closest<HTMLElement>("[data-page-id]")!.dataset.pageId!;
      const reference = references.find(
        (item) => item.id === target.dataset.referenceSelect,
      )!;
      const active = target.getAttribute("aria-selected") === "true";
      if (active) return;
      selected.current[id] = reference.id;
      Promise.all(sync(id)).then(() => {
        if (generation !== revision || document.hidden) return;
        latest.current.announce(`Reference by ${reference.name}.`);
        soundEngine.authorSelected();
      });
    };
    const key = (event: KeyboardEvent) => {
      const target = (event.target as Element).closest<HTMLElement>(
        "[data-reference-select]",
      );
      if (
        !target ||
        !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      const buttons = [
          ...target.parentElement!.querySelectorAll<HTMLButtonElement>(
            "button",
          ),
        ],
        index = buttons.indexOf(target as HTMLButtonElement);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? buttons.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) %
              buttons.length;
      buttons[next].focus();
      buttons[next].click();
    };
    const observer = new MutationObserver(() =>
      root
        .querySelectorAll<HTMLElement>(".page--references")
        .forEach((page) => {
          if (!known.has(page)) syncPage(page);
        }),
    );
    observer.observe(root, { childList: true, subtree: true });
    const settle = () => {
      ++revision;
      sync();
    };
    root.addEventListener("click", click);
    root.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", settle);
    sync();
    if (props.readMode && all.current) {
      const group = root.querySelector("#reading-references");
      group?.scrollIntoView({block:"start"});
      group?.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});
    }
    return () => {
      ++revision;
      observer.disconnect();
      root.removeEventListener("click", click);
      root.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", settle);
      animations.forEach((_, figure) => {
        stop(figure);
        figure.style.removeProperty("opacity");
        figure.style.removeProperty("visibility");
      });
    };
  }, [props.root, props.readMode, props.reduced, props.ready, props.turning]);
}
