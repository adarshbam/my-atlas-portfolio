export const manifestUrl: string;
export const originalVideoNames: Record<string, string>;
export type VaultItem = { id: string; name: string; size: number; extension?: string; streamUrl: string; embedUrl?: string };
export function loadVaultManifest(force?: boolean): Promise<Map<string, VaultItem>>;
export function resolveVaultVideo(archiveId: string, force?: boolean): Promise<VaultItem | null>;
export function attachVaultVideo(video: HTMLVideoElement, archiveId: string): () => void;

export function attachVaultEmbed(container: HTMLElement,id:string,title:string,poster?:string):()=>void;
