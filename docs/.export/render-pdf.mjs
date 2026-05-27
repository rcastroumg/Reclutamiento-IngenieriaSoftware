import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const [, , inputArg, outputArg] = process.argv

if (!inputArg || !outputArg) {
  console.error('Usage: node render-pdf.mjs <input.md> <output.pdf>')
  process.exit(1)
}

const inputPath = path.resolve(inputArg)
const outputPath = path.resolve(outputArg)
const markdown = await fs.readFile(inputPath, 'utf8')

const escapeHtml = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Documento Final</title>
    <style>
      :root {
        --text: #1f2937;
        --muted: #4b5563;
        --border: #d1d5db;
        --accent: #0f172a;
        --bg-soft: #f8fafc;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--text);
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.5;
        background: white;
      }
      main {
        max-width: 980px;
        margin: 0 auto;
        padding: 40px 48px 72px;
      }
      h1, h2, h3, h4, h5 {
        color: var(--accent);
        line-height: 1.25;
      }
      h1 {
        font-size: 28px;
        text-align: center;
        margin-top: 0;
        margin-bottom: 12px;
      }
      h2 {
        font-size: 22px;
        margin-top: 34px;
        padding-bottom: 8px;
        border-bottom: 2px solid var(--border);
        page-break-after: avoid;
      }
      h3 {
        font-size: 18px;
        margin-top: 26px;
        page-break-after: avoid;
      }
      h4 {
        font-size: 15px;
        margin-top: 20px;
        page-break-after: avoid;
      }
      p, li {
        font-size: 12px;
      }
      p {
        margin: 10px 0;
        text-align: justify;
      }
      ul, ol {
        padding-left: 22px;
      }
      code {
        font-family: "Courier New", monospace;
        font-size: 0.92em;
        background: #f3f4f6;
        padding: 1px 4px;
        border-radius: 4px;
      }
      pre {
        overflow: auto;
        background: #0b1220;
        color: #e5e7eb;
        padding: 14px;
        border-radius: 8px;
      }
      pre code {
        background: transparent;
        color: inherit;
        padding: 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0 20px;
        font-size: 11px;
      }
      th, td {
        border: 1px solid var(--border);
        padding: 8px 10px;
        vertical-align: top;
      }
      th {
        background: var(--bg-soft);
        text-align: left;
      }
      hr {
        border: 0;
        border-top: 1px solid var(--border);
        margin: 24px 0;
      }
      blockquote {
        margin: 14px 0;
        padding: 8px 14px;
        border-left: 4px solid #94a3b8;
        background: #f8fafc;
      }
      .mermaid {
        margin: 18px 0 24px;
        text-align: center;
        page-break-inside: avoid;
      }
      .title-spacer {
        height: 12px;
      }
      @page {
        size: A4;
        margin: 18mm 14mm 18mm 14mm;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  </head>
  <body>
    <main id="content"></main>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs'

      const markdown = ${JSON.stringify(markdown)}
      const content = document.getElementById('content')

      const escapeHtml = (text) =>
        text
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;')

      const renderer = new marked.Renderer()
      renderer.code = ({ text, lang }) => {
        if (lang === 'mermaid') {
          return '<div class="mermaid">' + text + '</div>'
        }
        const safeLang = lang ? 'language-' + escapeHtml(lang) : ''
        return '<pre><code class="' + safeLang + '">' + escapeHtml(text) + '</code></pre>'
      }

      content.innerHTML = marked.parse(markdown, {
        renderer,
        gfm: true,
        breaks: false,
      })

      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: true, htmlLabels: true },
        er: { useMaxWidth: true },
      })

      await mermaid.run({ querySelector: '.mermaid' })
      window.__renderDone = true
    </script>
  </body>
</html>`

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.error(msg.text())
  }
})

await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForFunction(() => window.__renderDone === true, null, { timeout: 120000 })

await page.pdf({
  path: outputPath,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `
    <div style="width:100%; font-size:8px; color:#6b7280; padding:0 12mm; display:flex; justify-content:space-between;">
      <span>Plataforma SaaS de Reclutamiento y Portal de Empleos</span>
      <span class="pageNumber"></span>/<span class="totalPages"></span>
    </div>`,
  margin: {
    top: '18mm',
    right: '14mm',
    bottom: '18mm',
    left: '14mm',
  },
})

await browser.close()
console.log(`PDF generated at ${outputPath}`)
