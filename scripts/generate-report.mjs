#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const resultsPath = join(root, 'test-results', 'results.json');
const outputPath = join(root, 'test-report.html');

let data;
try {
  data = JSON.parse(readFileSync(resultsPath, 'utf-8'));
} catch {
  console.error('Error: test-results/results.json not found.\nRun: npm run test:ci');
  process.exit(1);
}

const {
  numTotalTestSuites = 0,
  numPassedTestSuites = 0,
  numFailedTestSuites = 0,
  numTotalTests = 0,
  numPassedTests = 0,
  numFailedTests = 0,
  numPendingTests = 0,
  startTime,
  testResults = [],
} = data;

const totalMs = testResults.reduce((s, r) => s + (r.endTime - r.startTime), 0);
const passRate = numTotalTests > 0 ? Math.round((numPassedTests / numTotalTests) * 100) : 0;
const allPassing = numFailedTests === 0 && numFailedTestSuites === 0;
const runDate = new Date(startTime).toLocaleString('en-US', {
  year: 'numeric', month: 'short', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function ms(n) {
  if (n >= 60000) return `${(n / 60000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}s`;
  return `${n}ms`;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function suiteName(path) {
  return basename(path).replace(/\.test\.[jt]s$/, '').replace(/-/g, ' ');
}

function suiteFile(path) {
  return basename(path);
}

function statusIcon(status) {
  if (status === 'passed') return '<span class="icon pass">✓</span>';
  if (status === 'failed') return '<span class="icon fail">✗</span>';
  return '<span class="icon skip">−</span>';
}

const sortedSuites = [...testResults].sort((a, b) => {
  if (a.status === 'failed' && b.status !== 'failed') return -1;
  if (b.status === 'failed' && a.status !== 'failed') return 1;
  return suiteFile(a.name).localeCompare(suiteFile(b.name));
});

const suitesHtml = sortedSuites.map(suite => {
  const tests = suite.assertionResults ?? [];
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const skipped = tests.length - passed - failed;
  const duration = suite.endTime - suite.startTime;
  const suiteStatus = suite.status === 'failed' ? 'fail' : 'pass';
  const file = suiteFile(suite.name);
  const label = suiteName(suite.name);

  const testsHtml = tests.map(t => {
    const cls = t.status === 'passed' ? 'pass' : t.status === 'failed' ? 'fail' : 'skip';
    const dur = t.duration != null ? ms(t.duration) : '';
    const failures = (t.failureMessages ?? []).map(m =>
      `<pre class="failure-msg">${esc(m.trim())}</pre>`
    ).join('');
    return `
      <div class="test-row ${cls}">
        <div class="test-left">
          ${statusIcon(t.status)}
          <span class="test-name">${esc(t.title)}</span>
        </div>
        <span class="test-dur">${dur}</span>
      </div>${failures}`;
  }).join('');

  const statsLabel = failed > 0
    ? `<span class="suite-stat fail">${failed} failed</span> <span class="suite-stat pass">${passed} passed</span>`
    : `<span class="suite-stat pass">${passed} passed</span>`;

  return `
  <details class="suite ${suiteStatus}" ${suite.status === 'failed' ? 'open' : ''}>
    <summary class="suite-header">
      <div class="suite-left">
        <span class="suite-icon">${suite.status === 'failed' ? '✗' : '✓'}</span>
        <span class="suite-file">${esc(file)}</span>
        <span class="suite-label">${esc(label)}</span>
      </div>
      <div class="suite-right">
        ${statsLabel}
        <span class="suite-dur">${ms(duration)}</span>
      </div>
    </summary>
    <div class="tests">${testsHtml}</div>
  </details>`;
}).join('\n');

const overallBadge = allPassing
  ? '<span class="badge pass">ALL PASSING</span>'
  : `<span class="badge fail">${numFailedTests} FAILING</span>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Test Report — vibium-test-js</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #f0f4f8;
    color: #1e293b;
    font-size: 14px;
    line-height: 1.5;
    padding: 0 0 48px;
  }

  /* ── header ── */
  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
    color: #f8fafc;
    padding: 32px 40px 28px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .header-left h1 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.3px;
    margin-bottom: 4px;
  }
  .header-left .meta {
    font-size: 12px;
    color: #94a3b8;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  .badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    align-self: flex-start;
  }
  .badge.pass { background: #059669; color: #fff; }
  .badge.fail { background: #dc2626; color: #fff; }

  /* ── container ── */
  .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

  /* ── summary cards ── */
  .summary {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    margin: 28px 0 20px;
  }
  @media (max-width: 800px) {
    .summary { grid-template-columns: repeat(3, 1fr); }
  }
  .card {
    background: #fff;
    border-radius: 10px;
    padding: 18px 14px 14px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,.07);
    border: 1px solid #e2e8f0;
  }
  .card .val {
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 6px;
  }
  .card .lbl {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #64748b;
  }
  .card.c-total .val { color: #1e293b; }
  .card.c-pass  .val { color: #059669; }
  .card.c-fail  .val { color: #dc2626; }
  .card.c-skip  .val { color: #d97706; }
  .card.c-dur   .val { color: #2563eb; font-size: 24px; }
  .card.c-rate  .val { color: ${passRate === 100 ? '#059669' : passRate >= 80 ? '#d97706' : '#dc2626'}; }

  /* ── progress bar ── */
  .progress-wrap {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 20px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,.07);
  }
  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  .progress-bar {
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: ${passRate === 100 ? '#059669' : passRate >= 80 ? '#d97706' : '#dc2626'};
    width: ${passRate}%;
    border-radius: 4px;
    transition: width 0.4s ease;
  }

  /* ── section heading ── */
  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #64748b;
    margin-bottom: 10px;
    padding-left: 2px;
  }

  /* ── suite ── */
  .suite {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    overflow: hidden;
  }
  .suite.fail { border-left: 4px solid #dc2626; }
  .suite.pass { border-left: 4px solid #059669; }

  .suite-header {
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 18px;
    cursor: pointer;
    user-select: none;
    gap: 12px;
  }
  .suite-header::-webkit-details-marker { display: none; }
  .suite-header::marker { display: none; }
  .suite-header:hover { background: #f8fafc; }

  .suite-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }
  .suite-icon {
    font-size: 14px;
    flex-shrink: 0;
  }
  .suite.pass .suite-icon { color: #059669; }
  .suite.fail .suite-icon { color: #dc2626; }

  .suite-file {
    font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    flex-shrink: 0;
  }
  .suite-label {
    font-size: 12px;
    color: #94a3b8;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .suite-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .suite-stat {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
  }
  .suite-stat.pass { background: #d1fae5; color: #065f46; }
  .suite-stat.fail { background: #fee2e2; color: #991b1b; }
  .suite-dur {
    font-size: 12px;
    color: #64748b;
    font-family: monospace;
    min-width: 40px;
    text-align: right;
  }

  /* ── tests ── */
  .tests { padding: 0 18px 10px; border-top: 1px solid #f1f5f9; }
  .test-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 7px 0;
    border-bottom: 1px solid #f8fafc;
    gap: 12px;
  }
  .test-row:last-child { border-bottom: none; }
  .test-left {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
    flex: 1;
  }
  .icon {
    font-size: 13px;
    flex-shrink: 0;
    margin-top: 1px;
    font-weight: 700;
  }
  .icon.pass { color: #059669; }
  .icon.fail { color: #dc2626; }
  .icon.skip { color: #d97706; }
  .test-name {
    font-size: 13px;
    color: #334155;
    line-height: 1.4;
    word-break: break-word;
  }
  .test-dur {
    font-size: 11px;
    color: #94a3b8;
    font-family: monospace;
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .failure-msg {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 11px;
    font-family: monospace;
    color: #7f1d1d;
    margin: 4px 0 8px 22px;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: auto;
  }

  /* ── footer ── */
  .footer {
    text-align: center;
    margin-top: 36px;
    font-size: 11px;
    color: #94a3b8;
  }

  /* ── print ── */
  @media print {
    body { background: #fff; padding: 0; }
    .header { background: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    details { display: block; }
    summary { cursor: default; }
    .suite { box-shadow: none; page-break-inside: avoid; }
    .progress-fill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>Test Run Report — vibium-test-js</h1>
    <div class="meta">
      <span>📅 ${esc(runDate)}</span>
      <span>🗂 ${numTotalTestSuites} suites</span>
      <span>⏱ ${ms(totalMs)} total</span>
    </div>
  </div>
  ${overallBadge}
</div>

<div class="container">

  <div class="summary">
    <div class="card c-total">
      <div class="val">${numTotalTests}</div>
      <div class="lbl">Total</div>
    </div>
    <div class="card c-pass">
      <div class="val">${numPassedTests}</div>
      <div class="lbl">Passed</div>
    </div>
    <div class="card c-fail">
      <div class="val">${numFailedTests}</div>
      <div class="lbl">Failed</div>
    </div>
    <div class="card c-skip">
      <div class="val">${numPendingTests}</div>
      <div class="lbl">Skipped</div>
    </div>
    <div class="card c-dur">
      <div class="val">${ms(totalMs)}</div>
      <div class="lbl">Duration</div>
    </div>
    <div class="card c-rate">
      <div class="val">${passRate}%</div>
      <div class="lbl">Pass rate</div>
    </div>
  </div>

  <div class="progress-wrap">
    <div class="progress-label">
      <span>Pass rate</span>
      <span>${numPassedTests} / ${numTotalTests} tests passed</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
  </div>

  <div class="section-title">Test Suites (${numPassedTestSuites} passed${numFailedTestSuites > 0 ? `, ${numFailedTestSuites} failed` : ''})</div>

  ${suitesHtml}

  <div class="footer">
    Generated by vibium-test-js · ${esc(runDate)}
  </div>

</div>
</body>
</html>`;

writeFileSync(outputPath, html, 'utf-8');
console.log(`Report written to: test-report.html`);
