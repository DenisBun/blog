#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = process.env.VISUAL_PORT || '4327';
const baseUrl = process.env.VISUAL_BASE_URL || `http://${host}:${port}`;
const outputDirectory = fileURLToPath(new URL('../.visual-snapshots/', import.meta.url));
const viewports = [
  { name: 'mobile', width: 320, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 1000 },
];
const routes = [
  { name: 'home-en', path: '/' },
  { name: 'home-ru', path: '/ru' },
  { name: 'blog', path: '/blog' },
  { name: 'article', path: '/blog/welcome' },
];

const chromeCandidates = [process.env.CHROME_BIN, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);

async function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next known browser location.
    }
  }
  throw new Error('Chrome or Chromium was not found. Set CHROME_BIN to its executable path.');
}

async function waitForServer(server, output) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Astro exited before becoming ready.\n${output.value}`);
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Astro did not become ready at ${baseUrl}.\n${output.value}`);
}

function connectCdp(webSocketUrl) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    const pending = new Map();
    const eventWaiters = new Map();
    let nextId = 1;

    socket.addEventListener('error', reject, { once: true });
    socket.addEventListener(
      'open',
      () => {
        socket.addEventListener('message', ({ data }) => {
          const message = JSON.parse(data);
          if (message.id) {
            const waiter = pending.get(message.id);
            pending.delete(message.id);
            if (message.error) waiter?.reject(new Error(message.error.message));
            else waiter?.resolve(message.result);
            return;
          }
          const waiter = eventWaiters.get(message.method);
          if (waiter) {
            eventWaiters.delete(message.method);
            waiter(message.params);
          }
        });

        resolve({
          close: () => socket.close(),
          event: (method) => new Promise((eventResolve) => eventWaiters.set(method, eventResolve)),
          send: (method, params = {}) =>
            new Promise((commandResolve, commandReject) => {
              const id = nextId++;
              pending.set(id, { resolve: commandResolve, reject: commandReject });
              socket.send(JSON.stringify({ id, method, params }));
            }),
        });
      },
      { once: true },
    );
  });
}

async function capture(chrome, viewport, url, outputPath) {
  const profileDirectory = await mkdtemp(path.join(tmpdir(), 'denis-blog-visual-'));
  const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profileDirectory}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });

  try {
    const browserWebSocketUrl = await new Promise((resolve, reject) => {
      let stderr = '';
      browser.stderr.on('data', (chunk) => {
        stderr += chunk;
        const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) resolve(match[1]);
      });
      browser.once('error', reject);
      browser.once('exit', (code) => reject(new Error(`Chrome exited with code ${code}.\n${stderr}`)));
    });

    const endpoint = new URL(browserWebSocketUrl);
    const targets = await fetch(`http://${endpoint.host}/json/list`).then((response) => response.json());
    const page = targets.find((target) => target.type === 'page');
    if (!page?.webSocketDebuggerUrl) throw new Error('Chrome did not expose a page target.');

    const cdp = await connectCdp(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    });
    const loaded = cdp.event('Page.loadEventFired');
    await cdp.send('Page.navigate', { url });
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, 350));
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    await writeFile(outputPath, Buffer.from(screenshot.data, 'base64'));
    cdp.close();
  } finally {
    if (browser.exitCode === null) {
      await new Promise((resolve) => {
        browser.once('exit', resolve);
        browser.kill('SIGTERM');
        setTimeout(resolve, 1500);
      });
    }
    await rm(profileDirectory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

const chrome = await findChrome();
await mkdir(outputDirectory, { recursive: true });

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const output = { value: '' };
const server = spawn(npmCommand, ['run', 'preview', '--', '--host', host, '--port', port], {
  detached: process.platform !== 'win32',
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const rememberOutput = (chunk) => {
  output.value = `${output.value}${chunk}`.slice(-6000);
};
server.stdout.on('data', rememberOutput);
server.stderr.on('data', rememberOutput);

try {
  await waitForServer(server, output);
  for (const viewport of viewports) {
    for (const route of routes) {
      const outputPath = `${outputDirectory}${route.name}-${viewport.name}.png`;
      await capture(chrome, viewport, `${baseUrl}${route.path}`, outputPath);
    }
  }
  console.log(`Captured ${routes.length * viewports.length} responsive screenshots in ${outputDirectory}`);
} finally {
  if (server.exitCode === null) {
    if (process.platform === 'win32') server.kill('SIGTERM');
    else process.kill(-server.pid, 'SIGTERM');
  }
}
