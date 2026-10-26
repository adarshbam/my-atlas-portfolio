import { pages } from "@/data/portfolio";

export function pageIndex(id: string): number | undefined {
  const index = pages.findIndex((page) => page.id === id);
  return index < 0 ? undefined : index;
}

export function pageGroups(mobile: boolean): number[][] {
  if (mobile) return pages.map((_, index) => [index]);
  const groups = [[0]];
  for (let index = 1; index < pages.length; index += 2)
    groups.push(index + 1 < pages.length ? [index, index + 1] : [index]);
  return groups;
}

export function visiblePages(index: number, mobile: boolean): number[] {
  const bounded = Math.max(0, Math.min(pages.length - 1, index));
  return pageGroups(mobile).find((group) => group.includes(bounded))!;
}

export function adjacentPage(
  index: number,
  direction: number,
  mobile: boolean,
): number {
  const groups = pageGroups(mobile);
  const position = groups.findIndex((group) => group.includes(index));
  return groups[
    Math.max(0, Math.min(groups.length - 1, position + direction))
  ][0];
}
