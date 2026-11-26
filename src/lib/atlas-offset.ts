/**
 * How far the book's stage sits below the top of the atlas, in layout pixels.
 * The atlas used to start at the top of the document; it now follows the run on the
 * same page and is scaled during the arrival, so the offset is measured inside the
 * atlas and any ancestor scale is divided out.
 */
export function offsetInAtlas(stage: HTMLElement) {
  const atlas = stage.closest<HTMLElement>(".atlas") ?? stage;
  const atlasRect = atlas.getBoundingClientRect();
  const scale = atlas.offsetWidth ? atlasRect.width / atlas.offsetWidth || 1 : 1;
  return (stage.getBoundingClientRect().top - atlasRect.top) / scale;
}
