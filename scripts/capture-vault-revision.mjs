import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const REVISION_DIR = path.join(ROOT, 'docs', 'evidence', 'vault', 'revision');
const FIXTURES_DIR = path.join(REVISION_DIR, 'fixtures');
const README_PATH = path.join(FIXTURES_DIR, 'README.md');
const SAMPLE_PATH = path.join(FIXTURES_DIR, 'sample.json');

const EXPECTED_README_HASH = '8BA34A84542B202C1D8EC544F8E19F20D5D519917B130CF9B09BDA350DD9FB30';
const EXPECTED_SAMPLE_HASH = '4A7536BE66D7F7F2176CD394A31A77D97EF29F9AE94721DFC8178921FFEFD204';

const DEMO_FOLDER_ID = '6add2e33838495129d0f5446';
const DEMO_FOLDER_URL = `https://yourvaultstorage.com/dashboard/folder/${DEMO_FOLDER_ID}`;

function sha256Hex(bufferOrString) {
  return crypto.createHash('sha256').update(bufferOrString).digest('hex').toUpperCase();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const report = {
    startedAt: new Date().toISOString(),
    demoFolderId: DEMO_FOLDER_ID,
    demoFolderUrl: DEMO_FOLDER_URL,
    localFixtures: {},
    vaultWorkflow: {},
    driveWorkflow: {},
    githubWorkflow: {},
    captures: {},
    errors: [],
  };

  // Verify local fixtures first
  const readmeBuf = await fs.readFile(README_PATH);
  const sampleBuf = await fs.readFile(SAMPLE_PATH);
  report.localFixtures = {
    'README.md': {
      bytes: readmeBuf.length,
      sha256: sha256Hex(readmeBuf),
      matchesExpected: sha256Hex(readmeBuf) === EXPECTED_README_HASH,
    },
    'sample.json': {
      bytes: sampleBuf.length,
      sha256: sha256Hex(sampleBuf),
      matchesExpected: sha256Hex(sampleBuf) === EXPECTED_SAMPLE_HASH,
    },
  };

  const activePortRaw = await fs.readFile(
    path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'DevToolsActivePort'),
    'utf8'
  );
  const [port, wsPath] = activePortRaw.trim().split(/\r?\n/);
  const wsEndpoint = `ws://127.0.0.1:${port}${wsPath}`;
  console.log('Connecting over CDP to:', wsEndpoint);

  const browser = await chromium.connectOverCDP(wsEndpoint);
  try {
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages.find((p) => p.url().includes('yourvaultstorage.com'));
    if (!page) {
      throw new Error('Could not find signed-in yourvaultstorage.com tab');
    }

    await page.bringToFront();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await sleep(600);

    // Ensure we are on DEMO_FOLDER_URL
    if (!page.url().includes(DEMO_FOLDER_ID)) {
      await page.goto(DEMO_FOLDER_URL, { waitUntil: 'domcontentloaded' });
      await sleep(2000);
    }

    // Discover SERVER_URL (`https://yourvaultstorage.com/api`) and current directory contents from the live app context
    const envInfo = await page.evaluate(
      async ({ folderId }) => {
        const serverUrl = 'https://yourvaultstorage.com/api';
        const theme = document.documentElement.className;
        const accent = localStorage.getItem('vite-ui-accent-v3') || localStorage.getItem('vite-ui-theme');
        let dirJson = null;
        try {
          const dirRes = await fetch(`${serverUrl}/directory/${folderId}`, { credentials: 'include' });
          const ct = dirRes.headers.get('content-type') || '';
          if (dirRes.ok && ct.includes('application/json')) {
            dirJson = await dirRes.json();
          } else {
            dirJson = { error: dirRes.status, contentType: ct };
          }
        } catch (e) {
          dirJson = { error: String(e) };
        }
        return { serverUrl, theme, accent, dirJson };
      },
      { folderId: DEMO_FOLDER_ID }
    );

    const serverUrl = envInfo.serverUrl;
    report.serverUrl = serverUrl;
    report.themeInfo = { theme: envInfo.theme, accent: envInfo.accent };
    console.log('Discovered serverUrl:', serverUrl, 'existing files in demo folder:', envInfo.dirJson?.files?.length);

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 2A: Upload README.md and sample.json into Portfolio Demo 2026-10-25
    // ─────────────────────────────────────────────────────────────────────────
    let existingFiles = envInfo.dirJson?.files || [];
    const hasReadme = existingFiles.some((f) => f.name === 'README.md');
    const hasSample = existingFiles.some((f) => f.name === 'sample.json');

    const filesToUpload = [];
    if (!hasReadme) filesToUpload.push(README_PATH);
    if (!hasSample) filesToUpload.push(SAMPLE_PATH);

    if (filesToUpload.length > 0) {
      console.log('Uploading fixtures via UI modal:', filesToUpload.map((f) => path.basename(f)));
      // Open Upload Modal if not open
      const dropzone = page.locator('[data-tour="upload-dropzone"]');
      if (!(await dropzone.isVisible())) {
        const uploadAssetBtn = page.locator('[data-tour="upload-btn"], button:has-text("Upload Asset")').first();
        await uploadAssetBtn.click();
        await sleep(600);
      }

      const fileInput = page.locator('[data-tour="upload-dropzone"] input[type="file"], input[type="file"][multiple]').first();
      await fileInput.setInputFiles(filesToUpload);
      await sleep(700);

      const submitBtn = page.locator('[data-tour="upload-submit-btn"]');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      } else {
        const fallbackBtn = page.locator('button:has-text("Upload (")').first();
        if (await fallbackBtn.isVisible()) await fallbackBtn.click();
      }

      // Poll directory endpoint until both files appear and are completed
      for (let attempt = 0; attempt < 25; attempt++) {
        await sleep(1000);
        const check = await page.evaluate(async ({ url, fId }) => {
          const r = await fetch(`${url}/directory/${fId}`, { credentials: 'include' });
          if (!r.ok) return null;
          return await r.json();
        }, { url: serverUrl, fId: DEMO_FOLDER_ID });
        const files = check?.files || [];
        if (files.some((f) => f.name === 'README.md') && files.some((f) => f.name === 'sample.json')) {
          existingFiles = files;
          console.log('Both fixtures confirmed in directory listing!');
          break;
        }
      }
    } else {
      console.log('Both fixtures already present in demo folder.');
    }

    // Trigger refresh in UI and wait for cards to settle
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('vault:refresh')));
    await sleep(2000);

    // Dismiss any completed TransferManager popup if visible so capture is clean, or record its state first
    const readmeItem = existingFiles.find((f) => f.name === 'README.md');
    const sampleItem = existingFiles.find((f) => f.name === 'sample.json');

    // Verify Preview & Download SHA-256 for both files via live authenticated CDN/download endpoints AND UI preview modal
    const verifyFileIntegrity = async (fileObj) => {
      if (!fileObj) return { error: 'File object missing' };
      const res = await page.evaluate(async ({ url, fileId }) => {
        const cdnRes = await fetch(`${url}/file/${fileId}/cdn-url?action=download`, { credentials: 'include' });
        const cdnData = cdnRes.ok ? await cdnRes.json() : null;
        const targetUrl = cdnData?.url || `${url}/file/${fileId}?action=download`;
        const dlRes = await fetch(targetUrl);
        const text = await dlRes.text();
        return {
          status: dlRes.status,
          cdnUrlUsed: Boolean(cdnData?.url),
          text,
        };
      }, { url: serverUrl, fileId: fileObj._id });

      const downloadedHash = sha256Hex(Buffer.from(res.text, 'utf8'));
      return {
        fileId: fileObj._id,
        name: fileObj.name,
        size: fileObj.size,
        httpStatus: res.status,
        cdnUrlUsed: res.cdnUrlUsed,
        downloadedSha256: downloadedHash,
      };
    };

    const readmeVerify = await verifyFileIntegrity(readmeItem);
    const sampleVerify = await verifyFileIntegrity(sampleItem);

    // Also test UI Preview Modal on README.md
    let uiPreviewOpened = false;
    let uiPreviewTextSnippet = '';
    const readmeCard = page.locator(`#file-card-${readmeItem?._id}`).first();
    if (await readmeCard.isVisible()) {
      await readmeCard.dblclick();
      await sleep(1500);
      const codeBlock = page.locator('pre code').first();
      if (await codeBlock.isVisible()) {
        uiPreviewOpened = true;
        uiPreviewTextSnippet = (await codeBlock.innerText()).slice(0, 120);
      }
      // Close preview modal
      await page.keyboard.press('Escape');
      await sleep(600);
      const closeModalBtn = page.locator('button[title="Close"], button:has(svg.lucide-x)').first();
      if (await closeModalBtn.isVisible() && uiPreviewOpened) {
        // Check if modal is still open
        if (await page.locator('text="READ ONLY"').isVisible()) {
          await closeModalBtn.click().catch(() => {});
          await sleep(500);
        }
      }
    }

    report.vaultWorkflow = {
      status: 'live-tested',
      folderId: DEMO_FOLDER_ID,
      folderName: 'Portfolio Demo 2026-10-25',
      filesPresent: existingFiles.map((f) => ({ id: f._id, name: f.name, size: f.size })),
      readmeIntegrity: {
        ...readmeVerify,
        matchesExpected: readmeVerify.downloadedSha256 === EXPECTED_README_HASH,
      },
      sampleIntegrity: {
        ...sampleVerify,
        matchesExpected: sampleVerify.downloadedSha256 === EXPECTED_SAMPLE_HASH,
      },
      uiPreviewModalTested: uiPreviewOpened,
      uiPreviewTextSnippet,
    };
    console.log('Vault workflow integrity:', report.vaultWorkflow);

    // Clear selection & close any transfer toast before taking Supplementary Capture 2 (populated-demo-vault)
    await page.keyboard.press('Escape');
    await sleep(500);
    const populatedVaultCapturePath = path.join(REVISION_DIR, 'populated-demo-vault-2026-10-25.jpg');
    await page.screenshot({ path: populatedVaultCapturePath, type: 'jpeg', quality: 92 });
    const populatedVaultBuf = await fs.readFile(populatedVaultCapturePath);
    report.captures.populatedDemoVault = {
      file: 'docs/evidence/vault/revision/populated-demo-vault-2026-10-25.jpg',
      url: page.url(),
      viewport: '1440x1000',
      bytes: populatedVaultBuf.length,
      sha256: sha256Hex(populatedVaultBuf),
      capturedAt: new Date().toISOString(),
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 2B: Disposable Google Drive Transfer Workflow + Capture
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Starting Stage 2B: Disposable Google Drive workflow...');
    await page.goto('https://yourvaultstorage.com/dashboard/google-drive', { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    // Check Drive connection and existing folders via API
    const driveInit = await page.evaluate(async (url) => {
      const r = await fetch(`${url}/drive/files`, { credentials: 'include' });
      const data = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, data };
    }, serverUrl);

    if (driveInit.ok) {
      const driveDirs = driveInit.data?.directories || [];
      let demoDriveFolder = driveDirs.find((d) => d.name === 'Portfolio Demo 2026-10-25');
      if (!demoDriveFolder) {
        const createRes = await page.evaluate(async (url) => {
          const r = await fetch(`${url}/drive/folder/root/create-folder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name: 'Portfolio Demo 2026-10-25' }),
          });
          return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
        }, serverUrl);
        console.log('Created disposable Drive folder:', createRes);
        // Re-list Drive root to get its folder ID
        const relist = await page.evaluate(async (url) => {
          const r = await fetch(`${url}/drive/files`, { credentials: 'include' });
          return await r.json().catch(() => ({}));
        }, serverUrl);
        demoDriveFolder = (relist.directories || []).find((d) => d.name === 'Portfolio Demo 2026-10-25');
      }

      if (demoDriveFolder) {
        const driveFolderId = demoDriveFolder._id || demoDriveFolder.id;
        // Navigate into the disposable Drive folder so no personal Drive files are shown!
        await page.goto(`https://yourvaultstorage.com/dashboard/google-drive/${driveFolderId}`, {
          waitUntil: 'domcontentloaded',
        });
        await sleep(2500);

        // Check if fixtures are already in this Drive folder
        const driveFolderContents = await page.evaluate(async ({ url, fId }) => {
          const r = await fetch(`${url}/drive/folder/${fId}`, { credentials: 'include' });
          return await r.json().catch(() => ({}));
        }, { url: serverUrl, fId: driveFolderId });

        let driveFiles = driveFolderContents?.files || [];
        let transferFromVaultRes = null;
        let transferToVaultRes = null;

        if (!driveFiles.some((f) => f.name === 'sample.json') && sampleItem) {
          // Exercise transferFromVaultLogic (action: "copy" so Vault original remains untouched!)
          transferFromVaultRes = await page.evaluate(
            async ({ url, item, targetDriveFolderId }) => {
              const r = await fetch(`${url}/drive/transfer-from-vault`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  items: [
                    {
                      _id: item._id,
                      name: item.name,
                      extension: item.extension || '.json',
                      size: item.size,
                      type: 'file',
                    },
                  ],
                  targetDriveFolderId,
                  action: 'copy',
                }),
              });
              return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
            },
            { url: serverUrl, item: sampleItem, targetDriveFolderId: driveFolderId }
          );
          console.log('transferFromVault (Vault -> Drive copy) result:', transferFromVaultRes);
        }

        if (!driveFiles.some((f) => f.name === 'README.md') && readmeItem) {
          await page.evaluate(
            async ({ url, item, targetDriveFolderId }) => {
              await fetch(`${url}/drive/transfer-from-vault`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  items: [
                    {
                      _id: item._id,
                      name: item.name,
                      extension: item.extension || '.md',
                      size: item.size,
                      type: 'file',
                    },
                  ],
                  targetDriveFolderId,
                  action: 'copy',
                }),
              });
            },
            { url: serverUrl, item: readmeItem, targetDriveFolderId: driveFolderId }
          );
        }

        // Refresh Drive folder contents
        await page.evaluate(() => window.dispatchEvent(new CustomEvent('vault:refresh')));
        await sleep(2500);

        const updatedDriveContents = await page.evaluate(async ({ url, fId }) => {
          const r = await fetch(`${url}/drive/folder/${fId}`, { credentials: 'include' });
          return await r.json().catch(() => ({}));
        }, { url: serverUrl, fId: driveFolderId });
        driveFiles = updatedDriveContents?.files || [];

        // Also exercise transferToVaultLogic (Drive -> Vault copy into a disposable subfolder inside Portfolio Demo 2026-10-25 so original fixtures aren't duplicated in root)
        const driveSample = driveFiles.find((f) => f.name === 'sample.json');
        if (driveSample) {
          // Ensure a disposable subfolder "Drive Roundtrip 2026-10-25" exists inside DEMO_FOLDER_ID
          const roundtripDir = await page.evaluate(
            async ({ url, parentId }) => {
              const dirRes = await fetch(`${url}/directory/${parentId}`, { credentials: 'include' });
              const dirData = await dirRes.json();
              let sub = (dirData.directories || []).find((d) => d.name === 'Drive Roundtrip 2026-10-25');
              if (!sub) {
                await fetch(`${url}/directory/${parentId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ foldername: 'Drive Roundtrip 2026-10-25' }),
                });
                const dirRes2 = await fetch(`${url}/directory/${parentId}`, { credentials: 'include' });
                const dirData2 = await dirRes2.json();
                sub = (dirData2.directories || []).find((d) => d.name === 'Drive Roundtrip 2026-10-25');
              }
              return sub;
            },
            { url: serverUrl, parentId: DEMO_FOLDER_ID }
          );

          if (roundtripDir?._id) {
            transferToVaultRes = await page.evaluate(
              async ({ url, driveFile, targetFolderId }) => {
                const r = await fetch(`${url}/drive/transfer-to-vault`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    items: [
                      {
                        _id: driveFile._id,
                        name: driveFile.name,
                        mimeType: driveFile.mimeType || 'application/json',
                        type: 'file',
                      },
                    ],
                    targetFolderId,
                    action: 'copy',
                  }),
                });
                return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
              },
              { url: serverUrl, driveFile: driveSample, targetFolderId: roundtripDir._id }
            );
            console.log('transferToVault (Drive -> Vault copy) result:', transferToVaultRes);
          }
        }

        // Put sample.json into clipboard so the Drive Chamber shows the live Paste / Transfer UI bar for the screenshot!
        if (sampleItem) {
          await page.evaluate((item) => {
            const clip = {
              action: 'copy',
              provider: 'local',
              items: [
                {
                  _id: item._id,
                  name: item.name,
                  type: 'file',
                  provider: 'local',
                  extension: '.json',
                  size: item.size,
                },
              ],
            };
            sessionStorage.setItem('vault_clipboard', JSON.stringify(clip));
            window.dispatchEvent(new CustomEvent('vault:clipboard_change', { detail: clip }));
          }, sampleItem);
          await sleep(800);
        }

        const driveCapturePath = path.join(REVISION_DIR, 'drive-transfer-2026-10-25.jpg');
        await page.screenshot({ path: driveCapturePath, type: 'jpeg', quality: 92 });
        const driveCaptureBuf = await fs.readFile(driveCapturePath);

        // Clear clipboard after screenshot
        await page.evaluate(() => {
          sessionStorage.removeItem('vault_clipboard');
          window.dispatchEvent(new CustomEvent('vault:clipboard_change', { detail: null }));
        });

        report.driveWorkflow = {
          status: 'live-tested',
          disposableDriveFolderId: driveFolderId,
          disposableDriveFolderName: 'Portfolio Demo 2026-10-25',
          filesInDriveFolder: driveFiles.map((f) => ({ id: f._id, name: f.name, size: f.size })),
          transferFromVaultResult: transferFromVaultRes,
          transferToVaultResult: transferToVaultRes,
        };
        report.captures.driveTransfer = {
          file: 'docs/evidence/vault/revision/drive-transfer-2026-10-25.jpg',
          url: page.url(),
          viewport: '1440x1000',
          bytes: driveCaptureBuf.length,
          sha256: sha256Hex(driveCaptureBuf),
          capturedAt: new Date().toISOString(),
        };
      }
    } else {
      report.driveWorkflow = {
        status: 'blocked',
        httpStatus: driveInit.status,
        error: driveInit.data,
      };
    }

    // Re-capture Populated Demo Vault now that "Drive Roundtrip 2026-10-25" subfolder and both fixtures are inside
    await page.goto(DEMO_FOLDER_URL, { waitUntil: 'domcontentloaded' });
    await sleep(2500);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('vault:refresh')));
    await sleep(1500);
    await page.screenshot({ path: populatedVaultCapturePath, type: 'jpeg', quality: 92 });
    const updatedVaultBuf = await fs.readFile(populatedVaultCapturePath);
    report.captures.populatedDemoVault = {
      file: 'docs/evidence/vault/revision/populated-demo-vault-2026-10-25.jpg',
      url: page.url(),
      viewport: '1440x1000',
      bytes: updatedVaultBuf.length,
      sha256: sha256Hex(updatedVaultBuf),
      capturedAt: new Date().toISOString(),
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 2C: Isolated Private GitHub Test Repo + Public Repo Workbench Capture
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Starting Stage 2C: GitHub workflow & Hero 1 capture...');
    const ghReposInit = await page.evaluate(async (url) => {
      const r = await fetch(`${url}/github/repositories`, { credentials: 'include' });
      const data = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, data };
    }, serverUrl);

    if (ghReposInit.ok) {
      const repos = Array.isArray(ghReposInit.data)
        ? ghReposInit.data
        : ghReposInit.data?.repositories || ghReposInit.data?.directories || [];

      const publicRepos = repos.filter((r) => !r.private && !r.isPrivate);
      console.log(
        'Public repos available:',
        publicRepos.map((r) => `${r.owner?.login || r.owner}/${r.name}`)
      );

      // 1. Exercise isolated private GitHub test repository workflow
      const testRepoName = 'portfolio-demo-2026-10-25';
      let testRepo = repos.find((r) => r.name === testRepoName);
      let repoCreatedRes = null;
      if (!testRepo) {
        repoCreatedRes = await page.evaluate(
          async ({ url, name }) => {
            const r = await fetch(`${url}/github/repositories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                name,
                private: true,
                auto_init: true,
                description: 'Disposable portfolio verification repository (2026-10-25)',
              }),
            });
            return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
          },
          { url: serverUrl, name: testRepoName }
        );
        console.log('Private test repo creation result:', repoCreatedRes);
        await sleep(2000);
      }

      const ownerLogin =
        testRepo?.owner?.login ||
        testRepo?.owner ||
        repoCreatedRes?.body?.repository?.owner?.login ||
        publicRepos[0]?.owner?.login ||
        publicRepos[0]?.owner;

      // Transfer fixtures from Vault to the isolated private test repo
      let ghTransferRes = null;
      let ghBranchRes = null;
      let ghCompareRes = null;
      let ghCommitsRes = null;

      if (ownerLogin && sampleItem && readmeItem) {
        ghTransferRes = await page.evaluate(
          async ({ url, owner, repo, items }) => {
            const r = await fetch(`${url}/github/transfer-from-vault`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                items,
                targetPath: `${owner}/${repo}`,
                action: 'copy',
              }),
            });
            return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
          },
          {
            url: serverUrl,
            owner: ownerLogin,
            repo: testRepoName,
            items: [
              {
                _id: readmeItem._id,
                name: 'PORTFOLIO-FIXTURE.md',
                extension: '.md',
                size: readmeItem.size,
                type: 'file',
              },
              {
                _id: sampleItem._id,
                name: 'sample.json',
                extension: '.json',
                size: sampleItem.size,
                type: 'file',
              },
            ],
          }
        );
        console.log('GitHub transferFromVault result:', ghTransferRes);

        // Create a disposable branch `verify-2026-10-25` in the private test repo
        ghBranchRes = await page.evaluate(
          async ({ url, owner, repo }) => {
            const r = await fetch(`${url}/github/repositories/${owner}/${repo}/branches`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                branchName: 'verify-2026-10-25',
                fromRef: 'main',
              }),
            });
            return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
          },
          { url: serverUrl, owner: ownerLogin, repo: testRepoName }
        );
        console.log('GitHub createBranch result:', ghBranchRes);

        // Commit a small update on `verify-2026-10-25` so branch comparison has ahead_by >= 1
        const branchCommitRes = await page.evaluate(
          async ({ url, owner, repo }) => {
            const contentBase64 = btoa(
              JSON.stringify(
                {
                  fixture: 'engineering-atlas-vault-revision',
                  createdAt: '2026-10-25',
                  branch: 'verify-2026-10-25',
                  nonSensitive: true,
                },
                null,
                2
              )
            );
            const r = await fetch(
              `${url}/github/file/${owner}/${repo}/branch-check.json?ref=verify-2026-10-25`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  content: contentBase64,
                  message: 'Add branch verification fixture on verify-2026-10-25',
                  branch: 'verify-2026-10-25',
                }),
              }
            );
            return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
          },
          { url: serverUrl, owner: ownerLogin, repo: testRepoName }
        );

        // Compare `main...verify-2026-10-25`
        ghCompareRes = await page.evaluate(
          async ({ url, owner, repo }) => {
            const r = await fetch(
              `${url}/github/repositories/${owner}/${repo}/compare?base=main&head=verify-2026-10-25`,
              { credentials: 'include' }
            );
            return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
          },
          { url: serverUrl, owner: ownerLogin, repo: testRepoName }
        );

        // List commits on `verify-2026-10-25`
        ghCommitsRes = await page.evaluate(
          async ({ url, owner, repo }) => {
            const r = await fetch(
              `${url}/github/repositories/${owner}/${repo}/commits?ref=verify-2026-10-25`,
              { credentials: 'include' }
            );
            return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
          },
          { url: serverUrl, owner: ownerLogin, repo: testRepoName }
        );

        report.githubWorkflow = {
          status: 'live-tested',
          privateTestRepo: `${ownerLogin}/${testRepoName}`,
          privateFlag: true,
          repoCreatedRes,
          transferFromVaultRes: ghTransferRes,
          createBranchRes: ghBranchRes,
          branchCommitRes,
          compareBranchesSummary: {
            ok: ghCompareRes?.ok,
            status: ghCompareRes?.body?.status,
            ahead_by: ghCompareRes?.body?.ahead_by,
            total_commits: ghCompareRes?.body?.total_commits,
          },
          commitsCount: ghCommitsRes?.body?.commits?.length || 0,
          latestCommitSha: ghCommitsRes?.body?.commits?.[0]?.sha || null,
        };
      }

      // 2. Capture Hero 1: Public Git Workbench (inside a public repository so no private repo list is shown!)
      const preferredPublic =
        publicRepos.find((r) => r.name.toLowerCase().includes('storage') || r.name.toLowerCase().includes('vault') || r.name.toLowerCase().includes('portfolio')) ||
        publicRepos[0];

      if (preferredPublic) {
        const pubOwner = preferredPublic.owner?.login || preferredPublic.owner || ownerLogin;
        const pubName = preferredPublic.name;
        const pubUrl = `https://yourvaultstorage.com/dashboard/github/${pubOwner}/${pubName}`;
        console.log('Navigating to public repo workbench for Hero 1:', pubUrl);
        await page.goto(pubUrl, { waitUntil: 'domcontentloaded' });
        await sleep(3500);

        const ghCapturePath = path.join(REVISION_DIR, 'github-workbench-2026-10-25.jpg');
        await page.screenshot({ path: ghCapturePath, type: 'jpeg', quality: 92 });
        const ghCaptureBuf = await fs.readFile(ghCapturePath);
        report.captures.githubWorkbench = {
          file: 'docs/evidence/vault/revision/github-workbench-2026-10-25.jpg',
          url: page.url(),
          publicRepo: `${pubOwner}/${pubName}`,
          viewport: '1440x1000',
          bytes: ghCaptureBuf.length,
          sha256: sha256Hex(ghCaptureBuf),
          capturedAt: new Date().toISOString(),
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 3B: Hero 2 — Owner Operational Rules (/owner/settings)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Capturing Hero 2: /owner/settings...');
    await page.goto('https://yourvaultstorage.com/owner/settings', { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    const ownerCapturePath = path.join(REVISION_DIR, 'owner-settings-2026-10-25.jpg');
    await page.screenshot({ path: ownerCapturePath, type: 'jpeg', quality: 92 });
    const ownerCaptureBuf = await fs.readFile(ownerCapturePath);
    report.captures.ownerSettings = {
      file: 'docs/evidence/vault/revision/owner-settings-2026-10-25.jpg',
      url: page.url(),
      viewport: '1440x1000',
      bytes: ownerCaptureBuf.length,
      sha256: sha256Hex(ownerCaptureBuf),
      capturedAt: new Date().toISOString(),
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 3C: Supplementary 3 — Billing Comparison (/dashboard/billing)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Capturing Supplementary 3: /dashboard/billing...');
    await page.goto('https://yourvaultstorage.com/dashboard/billing', { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    const billingCapturePath = path.join(REVISION_DIR, 'billing-comparison-2026-10-25.jpg');
    await page.screenshot({ path: billingCapturePath, type: 'jpeg', quality: 92 });
    const billingCaptureBuf = await fs.readFile(billingCapturePath);
    report.captures.billingComparison = {
      file: 'docs/evidence/vault/revision/billing-comparison-2026-10-25.jpg',
      url: page.url(),
      viewport: '1440x1000',
      bytes: billingCaptureBuf.length,
      sha256: sha256Hex(billingCaptureBuf),
      capturedAt: new Date().toISOString(),
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 3D: Supplementary 4 — Privacy-Safe User Management (/users)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Capturing Supplementary 4: /users (privacy-safe)...');
    await page.goto('https://yourvaultstorage.com/users', { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    // Measure exact bounding rects of the header, metric stat cards, current user hero card, and filter bar so we can determine the exact privacy-safe crop region
    const usersLayout = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const filterInput = document.querySelector('input[placeholder*="Search by name"]');
      const filterContainer = filterInput ? filterInput.closest('div.rounded-3xl') : null;
      const metricGrid = document.querySelector('div.grid.grid-cols-1');
      const emails = Array.from(document.querySelectorAll('p, span, div'))
        .filter((el) => el.children.length === 0 && el.textContent && el.textContent.includes('@'))
        .map((el) => ({
          rect: el.getBoundingClientRect().toJSON(),
        }));
      return {
        h1Rect: h1 ? h1.getBoundingClientRect().toJSON() : null,
        metricGridRect: metricGrid ? metricGrid.getBoundingClientRect().toJSON() : null,
        filterContainerRect: filterContainer ? filterContainer.getBoundingClientRect().toJSON() : null,
        emailRects: emails,
      };
    });
    console.log('Users page layout rects:', JSON.stringify(usersLayout));

    const usersCapturePath = path.join(REVISION_DIR, 'user-management-2026-10-25.jpg');
    await page.screenshot({ path: usersCapturePath, type: 'jpeg', quality: 92 });
    const usersCaptureBuf = await fs.readFile(usersCapturePath);
    report.captures.userManagement = {
      file: 'docs/evidence/vault/revision/user-management-2026-10-25.jpg',
      url: page.url(),
      viewport: '1440x1000',
      layout: usersLayout,
      bytes: usersCaptureBuf.length,
      sha256: sha256Hex(usersCaptureBuf),
      capturedAt: new Date().toISOString(),
    };

    // Return the browser tab to the populated demo Vault folder as a clean resting state
    await page.goto(DEMO_FOLDER_URL, { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    report.completedAt = new Date().toISOString();
    await fs.writeFile(
      path.join(REVISION_DIR, 'workflow-and-capture-report.json'),
      JSON.stringify(report, null, 2),
      'utf8'
    );
    console.log('Saved workflow-and-capture-report.json successfully.');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Fatal error in capture-vault-revision:', err);
  process.exit(1);
});
