/**
 * 历事/风闻折叠列表性能与正确性验证（系统 Chrome + CDP）
 * 用法：npm run verify:status && node scripts/copy_dawei_static.mjs && node scripts/test_dwf_list_perf.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const statusDir = path.join(root, 'dist/dawei/ui/status');
const port = Number(process.env.DWF_PERF_PORT || 8766);
const debugPort = Number(process.env.DWF_CDP_PORT || 9223);

function buildHeavyStat() {
  const stat = {
    世界与剧情: {
      行程: 200,
      当前地点: '洛阳·性能测试',
      已终局: false,
      天时: { 显示: '正始十年·性能压测' },
    },
    朝局: {
      皇帝: '曹芳',
      权柄: '勤王系',
      纪年: { 年号: '正始', 年数: '十' },
    },
    命途: { 标签: ['仕进', '从龙'], 已锁: [], 主导: '潜龙' },
    命途印记: {},
    鼎革纪: { 洛阳权柄: '勤王军控洛阳', 禅代: '未发生' },
    任务录: { 当前: {}, 已放弃: {} },
    风闻录: {
      机宜: { 津渡: {}, 支汊: {} },
      邸报: {},
      里巷: {},
      预制选项: {
        日常句: '我先整理眼下头绪，按面前之事逐项理清再定。',
        桃色句: '向身旁的女眷靠近些，试探她一句体己话。',
      },
    },
    房名次: {},
    子嗣: {},
    履历: {},
    群芳录: {},
  };

  for (let i = 1; i <= 80; i++) {
    const key = String(i).padStart(3, '0');
    stat.履历[key] =
      '正始' +
      Math.ceil(i / 12) +
      '年·洛阳·节点' +
      i +
      '：率军议事、内闱周旋、边关军报往来，一段较长履历以贴近真实对局体量。';
  }

  for (let i = 1; i <= 35; i++) {
    stat.风闻录.邸报['潮汛_' + String(i).padStart(2, '0')] =
      '邸报·第' + i + '则：朝局风动，淮南军情、洛阳诏令与边关驿报同日抵京。';
    stat.风闻录.里巷['坊间_' + String(i).padStart(2, '0')] =
      '坊间·第' + i + '则：里巷酒肆、驿城茶棚议论天下大势与秦府旧事。';
  }

  return stat;
}

function startStaticServer() {
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  };
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? '/index.html' : urlPath;
    const file = path.normalize(path.join(statusDir, rel));
    if (!file.startsWith(statusDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

function findSystemBrowser() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const paths = [
    path.join(programFiles, 'Google/Chrome/Application/chrome.exe'),
    path.join(programFilesX86, 'Google/Chrome/Application/chrome.exe'),
    path.join(localAppData, 'Google/Chrome/Application/chrome.exe'),
    path.join(programFiles, 'Microsoft/Edge/Application/msedge.exe'),
    path.join(programFilesX86, 'Microsoft/Edge/Application/msedge.exe'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch failed: ' + url + ' ' + res.status);
  return res.json();
}

class CdpSession {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || 'cdp error'));
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  evaluate(expression, awaitPromise = true) {
    return this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
    }).then((r) => {
      if (r.exceptionDetails) {
        throw new Error(JSON.stringify(r.exceptionDetails));
      }
      return r.result.value;
    });
  }
}

async function waitForCdp(debugPort, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const targets = await fetchJson(`http://127.0.0.1:${debugPort}/json/list`);
      const page = targets.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* retry */
    }
    await sleep(200);
  }
  throw new Error('CDP endpoint not ready');
}

async function launchChrome(debugPort) {
  const executablePath = findSystemBrowser();
  if (!executablePath) throw new Error('system Chrome/Edge not found');
  const proc = spawn(
    executablePath,
    [
      `--remote-debugging-port=${debugPort}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=420,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  const wsUrl = await waitForCdp(debugPort);
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  const cdp = new CdpSession(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  return {
    cdp,
    close: async () => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      proc.kill('SIGTERM');
    },
  };
}

function median(nums) {
  const arr = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

const BENCH_SOURCE = String(async function benchInPage(statJson) {
  sessionStorage.setItem('__dwf_preview_stat__', statJson);
  sessionStorage.setItem('__dwf_preview_user_name__', '仲明');
  window.__DWF_PREVIEW_STAT__ = JSON.parse(statJson);
  const stat = window.__DWF_PREVIEW_STAT__;
  const Dwf = window.DwfMvu;

  function countNodes(panelId, selectors) {
    const root = document.querySelector('#dwf-panel-' + panelId);
    if (!root) return { total: 0 };
    const out = { total: root.querySelectorAll('*').length };
    selectors.forEach((sel) => {
      out[sel] = root.querySelectorAll(sel).length;
    });
    return out;
  }

  function clickExpand(target) {
    const btn = document.querySelector(
      '[data-dwf-list-target="' + target + '"][data-dwf-list-expand]',
    );
    if (btn) btn.click();
  }

  function clickCollapse(target) {
    const btn = document.querySelector(
      '[data-dwf-list-target="' + target + '"][data-dwf-list-collapse]',
    );
    if (btn) btn.click();
  }

  function timeLishiRender() {
    const t0 = performance.now();
    Dwf.renderDwfSubPanels(stat, { only: 'lishi', force: true, activePanel: 'lishi' });
    return performance.now() - t0;
  }

  function timeFengwenRender() {
    const t0 = performance.now();
    Dwf.renderDwfSubPanels(stat, { only: 'fengwen', force: true, activePanel: 'fengwen' });
    return performance.now() - t0;
  }

  await Dwf.switchMainPanel('lishi', stat);
  Dwf.renderDwfSubPanels(stat, { only: 'lishi', force: true, activePanel: 'lishi' });

  const lishiCollapsedMs = [];
  for (let i = 0; i < 8; i++) {
    clickCollapse('lishi');
    lishiCollapsedMs.push(timeLishiRender());
  }
  const lishiCollapsedDom = countNodes('lishi', ['.dwf-lvli-card', '[data-dwf-list-expand]']);

  const lishiExpandedMs = [];
  for (let i = 0; i < 5; i++) {
    clickCollapse('lishi');
    Dwf.renderDwfSubPanels(stat, { only: 'lishi', force: true, activePanel: 'lishi' });
    clickExpand('lishi');
    lishiExpandedMs.push(timeLishiRender());
  }
  clickExpand('lishi');
  Dwf.renderDwfSubPanels(stat, { only: 'lishi', force: true, activePanel: 'lishi' });
  const lishiExpandedDom = countNodes('lishi', ['.dwf-lvli-card']);

  await Dwf.switchMainPanel('fengwen', stat);
  Dwf.renderDwfSubPanels(stat, { only: 'fengwen', force: true, activePanel: 'fengwen' });

  const fengwenCollapsedMs = [];
  for (let i = 0; i < 8; i++) {
    clickCollapse('dibao');
    clickCollapse('lixiang');
    fengwenCollapsedMs.push(timeFengwenRender());
  }
  const fengwenCollapsedDom = countNodes('fengwen', ['.dwf-rumor-item', '[data-dwf-list-expand]']);
  const dibaoItems = document.querySelectorAll('[data-dwf-list-section="dibao"] .dwf-rumor-item').length;
  const lixiangItems = document.querySelectorAll('[data-dwf-list-section="lixiang"] .dwf-rumor-item').length;

  const fengwenExpandedMs = [];
  for (let i = 0; i < 5; i++) {
    clickCollapse('dibao');
    clickCollapse('lixiang');
    Dwf.renderDwfSubPanels(stat, { only: 'fengwen', force: true, activePanel: 'fengwen' });
    clickExpand('dibao');
    clickExpand('lixiang');
    fengwenExpandedMs.push(timeFengwenRender());
  }

  const tabs = ['tianji', 'fengxin', 'fengwen', 'lishi', 'fangming'];
  const switchStart = performance.now();
  for (let r = 0; r < 10; r++) {
    for (const tab of tabs) {
      await Dwf.switchMainPanel(tab, stat);
    }
  }
  const tabSwitch = performance.now() - switchStart;

  await Dwf.switchMainPanel('lishi', stat);
  Dwf.renderDwfSubPanels(stat, { only: 'lishi', force: true, activePanel: 'lishi' });
  const firstLvliKey = document.querySelector('#dwf-panel-lishi .dwf-lvli-seq')?.textContent?.trim();

  await Dwf.switchMainPanel('fengwen', stat);
  Dwf.renderDwfSubPanels(stat, { only: 'fengwen', force: true, activePanel: 'fengwen' });
  const firstDibaoKey = document
    .querySelector('[data-dwf-list-section="dibao"] .dwf-rumor-key')
    ?.textContent?.trim();

  return {
    counts: {
      lishi: Object.keys(stat.履历 || {}).length,
      dibao: Object.keys((stat.风闻录 || {}).邸报 || {}).length,
      lixiang: Object.keys((stat.风闻录 || {}).里巷 || {}).length,
    },
    timings: { lishiCollapsedMs, lishiExpandedMs, fengwenCollapsedMs, fengwenExpandedMs, tabSwitch },
    dom: { lishiCollapsed: lishiCollapsedDom, lishiExpanded: lishiExpandedDom, fengwenCollapsed: fengwenCollapsedDom, dibaoItems, lixiangItems },
    order: { firstLvliKey, firstDibaoKey },
  };
});

async function runBrowserBench(cdp, statJson) {
  const targetUrl = `http://127.0.0.1:${port}/index.html?dwf_preview=1&embed=1`;
  await cdp.send('Page.navigate', { url: targetUrl });
  await sleep(1500);

  for (let i = 0; i < 120; i++) {
    const ready = await cdp.evaluate('!!(window.DwfMvu && window.DwfMvu.renderDwfSubPanels)');
    if (ready) break;
    await sleep(500);
  }

  const ready = await cdp.evaluate('!!(window.DwfMvu && window.DwfMvu.renderDwfSubPanels)');
  if (!ready) throw new Error('DwfMvu not loaded');

  const expr =
    '(' +
    BENCH_SOURCE +
    ')(' +
    JSON.stringify(statJson) +
    ')';
  return cdp.evaluate(expr, true);
}

const THRESHOLDS = {
  lishiCollapsedMs: 80,
  lishiExpandedMs: 250,
  fengwenCollapsedMs: 80,
  fengwenExpandedMs: 250,
  tabSwitchMs: 3000,
};

if (!fs.existsSync(path.join(statusDir, 'index.html'))) {
  console.error('[test_dwf_list_perf] missing dist status; run: npm run verify:status && node scripts/copy_dawei_static.mjs');
  process.exit(1);
}

const stat = buildHeavyStat();
const statJson = JSON.stringify(stat);
const server = await startStaticServer();
const chrome = await launchChrome(debugPort);

try {
  const result = await runBrowserBench(chrome.cdp, statJson);
  const med = {
    lishiCollapsed: median(result.timings.lishiCollapsedMs),
    lishiExpanded: median(result.timings.lishiExpandedMs),
    fengwenCollapsed: median(result.timings.fengwenCollapsedMs),
    fengwenExpanded: median(result.timings.fengwenExpandedMs),
    tabSwitch: result.timings.tabSwitch,
  };

  console.log('[test_dwf_list_perf] data volume:', result.counts);
  console.log(
    '[test_dwf_list_perf] render ms (median):',
    'lishi collapsed',
    med.lishiCollapsed.toFixed(2),
    '| expanded',
    med.lishiExpanded.toFixed(2),
    '| fengwen collapsed',
    med.fengwenCollapsed.toFixed(2),
    '| expanded',
    med.fengwenExpanded.toFixed(2),
    '| tab switch 50x',
    med.tabSwitch.toFixed(2),
  );
  console.log('[test_dwf_list_perf] DOM nodes:', result.dom);
  console.log('[test_dwf_list_perf] newest-first keys:', result.order);

  assert.equal(result.dom.lishiCollapsed['.dwf-lvli-card'], 15, 'collapsed lishi should render 15 cards');
  assert.ok(result.dom.lishiCollapsed['[data-dwf-list-expand]'] >= 1, 'lishi should show expand button');
  assert.equal(result.dom.lishiExpanded['.dwf-lvli-card'], 80, 'expanded lishi should render all cards');
  assert.equal(result.dom.dibaoItems + result.dom.lixiangItems, 16, 'dibao+lixiang collapsed should show 8+8 items');
  assert.equal(result.order.firstLvliKey, '080', 'lishi newest key should be 080 on top');
  assert.equal(result.order.firstDibaoKey, '潮汛_35', 'dibao newest key should be last inserted');

  assert.ok(med.lishiCollapsed < THRESHOLDS.lishiCollapsedMs, 'lishi collapsed render too slow');
  assert.ok(med.lishiExpanded < THRESHOLDS.lishiExpandedMs, 'lishi expanded render too slow');
  assert.ok(med.fengwenCollapsed < THRESHOLDS.fengwenCollapsedMs, 'fengwen collapsed render too slow');
  assert.ok(med.fengwenExpanded < THRESHOLDS.fengwenExpandedMs, 'fengwen expanded render too slow');
  assert.ok(med.tabSwitch < THRESHOLDS.tabSwitchMs, 'tab switching too slow');

  console.log('dwf list perf tests passed');
} finally {
  await chrome.close();
  server.close();
}
