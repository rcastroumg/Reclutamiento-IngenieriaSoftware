import { readFileSync, writeFileSync } from 'fs';
import { marked } from 'marked';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join(__dirname, '..', 'documento-final.md');
const outPath = path.join(__dirname, '..', 'documento-final.html');

const markdown = readFileSync(mdPath, 'utf-8');

// Configure marked
marked.setOptions({ breaks: true, gfm: true });

// Pre-process: extract mermaid blocks before marked processes them
// Replace ```mermaid ... ``` with a placeholder div
let processedMd = markdown;
const mermaidBlocks = [];
processedMd = processedMd.replace(/```mermaid\n([\s\S]*?)```/g, (match, code) => {
  const id = `mermaid-${mermaidBlocks.length}`;
  mermaidBlocks.push({ id, code: code.trim() });
  return `<div class="mermaid-placeholder" data-id="${id}"></div>`;
});

let htmlBody = marked.parse(processedMd);

// Replace placeholders with actual mermaid divs
mermaidBlocks.forEach(({ id, code }) => {
  const escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  htmlBody = htmlBody.replace(
    `<div class="mermaid-placeholder" data-id="${id}"></div>`,
    `<div class="mermaid">${escapedCode}</div>`
  );
});

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistema SaaS de Reclutamiento — Documento Final</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    :root {
      --primary: #1a3a5c;
      --primary-light: #2563a8;
      --accent: #e07b2e;
      --accent-light: #f59e3f;
      --bg: #ffffff;
      --bg-alt: #f4f7fb;
      --text: #1e2d3d;
      --text-muted: #4a5568;
      --border: #cdd5e0;
      --code-bg: #eef2f7;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: var(--text);
      background: var(--bg);
    }

    /* ── PAGE WRAPPER ── */
    .page-wrapper {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 3rem 4rem;
    }

    /* ── COVER ── */
    .cover {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: #ffffff;
      padding: 4rem 3rem;
      border-radius: 4px;
      margin-bottom: 3rem;
      text-align: center;
    }
    .cover h1 {
      font-size: 24pt;
      font-weight: 700;
      margin-bottom: 0.5rem;
      border: none;
      color: #fff;
    }
    .cover .subtitle {
      font-size: 13pt;
      color: rgba(255,255,255,0.85);
      margin-bottom: 2rem;
    }
    .cover .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem 2rem;
      text-align: left;
      font-size: 10pt;
      color: rgba(255,255,255,0.9);
      margin-top: 1.5rem;
    }
    .cover .meta-label { font-weight: 600; }
    .cover hr { border-color: rgba(255,255,255,0.3); margin: 1.5rem 0; }
    .cover .badge {
      display: inline-block;
      background: var(--accent);
      color: #fff;
      padding: 0.3rem 1rem;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* ── HEADINGS ── */
    h1, h2, h3, h4, h5, h6 {
      color: var(--primary);
      font-weight: 700;
      margin: 1.8rem 0 0.7rem;
      line-height: 1.3;
    }

    /* The first H1 is used as cover — hide it in the flow */
    .content > h1:first-child { display: none; }

    h2 {
      font-size: 16pt;
      border-left: 5px solid var(--accent);
      padding-left: 0.8rem;
      margin-top: 2.5rem;
    }

    h3 {
      font-size: 13pt;
      border-bottom: 2px solid var(--border);
      padding-bottom: 0.3rem;
    }

    h4 { font-size: 11.5pt; color: var(--primary-light); }

    p { margin: 0.6rem 0; }

    /* ── HORIZONTAL RULE ── */
    hr {
      border: none;
      border-top: 2px solid var(--border);
      margin: 2.5rem 0;
    }

    /* ── LISTS ── */
    ul, ol {
      margin: 0.5rem 0 0.5rem 1.5rem;
    }
    li { margin: 0.2rem 0; }

    /* ── TABLES ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0 1.5rem;
      font-size: 10pt;
    }
    thead {
      background: var(--primary);
      color: #ffffff;
    }
    thead th {
      padding: 0.55rem 0.8rem;
      text-align: left;
      font-weight: 600;
    }
    tbody tr:nth-child(even) { background: var(--bg-alt); }
    tbody tr:hover { background: #dbe8f6; }
    tbody td {
      padding: 0.45rem 0.8rem;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }

    /* ── CODE ── */
    code {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 0.1rem 0.35rem;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
      font-size: 9.5pt;
      color: var(--primary);
    }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1rem;
      overflow-x: auto;
      margin: 0.8rem 0;
    }
    pre code {
      border: none;
      background: transparent;
      padding: 0;
      font-size: 9pt;
    }

    /* ── BLOCKQUOTE ── */
    blockquote {
      border-left: 4px solid var(--accent);
      background: var(--bg-alt);
      padding: 0.6rem 1rem;
      margin: 1rem 0;
      color: var(--text-muted);
      font-style: italic;
      border-radius: 0 4px 4px 0;
    }

    /* ── MERMAID ── */
    .mermaid {
      background: var(--bg-alt);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      text-align: center;
      overflow-x: auto;
    }

    /* ── BOLD / STRONG ── */
    strong { color: var(--primary); }

    /* ── PRINT STYLES ── */
    @media print {
      body { font-size: 10pt; }
      .page-wrapper { max-width: 100%; padding: 1rem 2rem; }
      h2 { page-break-before: always; }
      h2:first-of-type { page-break-before: avoid; }
      .mermaid { page-break-inside: avoid; }
      table { page-break-inside: avoid; }
      .cover { page-break-after: always; border-radius: 0; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="page-wrapper">

    <!-- COVER CARD -->
    <div class="cover">
      <div class="badge">Documento Formal de Entrega</div>
      <h1>Sistema SaaS de Reclutamiento<br>y Portal de Empleos</h1>
      <p class="subtitle">Documento Integral de Visión, Planificación, Requerimientos y Diseño</p>
      <hr>
      <div class="meta-grid">
        <span class="meta-label">Institución:</span><span>Universidad Mariano Gálvez de Guatemala</span>
        <span class="meta-label">Carrera:</span><span>Ingeniería en Sistemas de Información</span>
        <span class="meta-label">Curso:</span><span>Ingeniería del Software</span>
        <span class="meta-label">Docente:</span><span>Ing. Leonardo Cruz</span>
        <span class="meta-label">Cliente:</span><span>Recruitment Solutions</span>
        <span class="meta-label">Autor:</span><span>Roberto Castro</span>
        <span class="meta-label">Versión:</span><span>1.0</span>
        <span class="meta-label">Fecha:</span><span>09 de mayo de 2026</span>
      </div>
    </div>

    <!-- DOCUMENT CONTENT -->
    <div class="content">
      ${htmlBody}
    </div>

  </div>

  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        primaryColor: '#1a3a5c',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#2563a8',
        lineColor: '#4a5568',
        secondaryColor: '#f4f7fb',
        tertiaryColor: '#ffffff',
        fontSize: '13px'
      },
      flowchart: { htmlLabels: true, curve: 'basis' },
      er: { useMaxWidth: true },
      sequence: { useMaxWidth: true }
    });
  </script>
</body>
</html>`;

writeFileSync(outPath, html, 'utf-8');
console.log(`HTML generado: ${outPath}`);
console.log(`Tamaño: ${(html.length / 1024).toFixed(1)} KB`);
