import { attachVaultEmbed } from "./vault-media.js";
let cleanup = [];
const mount = () => {
  if (cleanup.length) return;
  cleanup = [...document.querySelectorAll("figure[data-source] video,video[data-vault-film],.obs-vault-embed")].map(video => {if(video.classList.contains("obs-vault-embed"))return attachVaultEmbed(video,video.dataset.vaultId,video.dataset.vaultTitle,video.dataset.vaultPoster);const id=video.dataset.vaultId || video.dataset.vaultFilm || video.closest("[data-source]").dataset.source,title=video.getAttribute("aria-label")||"Story video",poster=video.getAttribute("poster");const container=document.createElement("div");container.className="obs-vault-embed";container.style.aspectRatio=`${video.width||16}/${video.height||9}`;video.replaceWith(container);container.dataset.vaultId=id;container.dataset.vaultTitle=title;if(poster)container.dataset.vaultPoster=poster;return attachVaultEmbed(container,id,title,poster)});
};
mount();
window.addEventListener("pageshow", mount);
window.addEventListener("pagehide", () => { cleanup.forEach(stop => stop());cleanup = []; });
