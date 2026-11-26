import type { ReactNode } from "react";

/** A scene's heading, its lines (one per beat) and the progress rule under them. */
export function Caption({
  word,
  lines,
  note,
  kicker,
  level = "h2",
  renderLine,
  children,
}: {
  word: ReactNode;
  lines: readonly string[];
  note?: string;
  /** A short label above the heading. */
  kicker?: ReactNode;
  level?: "h1" | "h2";
  /** Sets a line's words (the same words) with markup of the caller's own, for example unbreakable spans. */
  renderLine?: (line: string) => ReactNode;
  /** Links or actions that belong to the scene, under the progress rule. */
  children?: ReactNode;
}) {
  const Heading = level;
  return (
    <div className="obs-trailer-caption">
      {kicker && <p className="obs-kicker">{kicker}</p>}
      <Heading>{word}</Heading>
      <div className="obs-trailer-lines">
        {lines.map((line, index) => (
          <p key={line} data-line={index + 1}>
            {renderLine ? renderLine(line) : line}
          </p>
        ))}
      </div>
      <span className="obs-trailer-progress" aria-hidden="true">
        <span />
      </span>
      {note && <p className="obs-small">{note}</p>}
      {children}
    </div>
  );
}
