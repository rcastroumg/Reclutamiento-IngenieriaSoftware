import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'

const [, , inputArg, outputArg] = process.argv

if (!inputArg || !outputArg) {
  console.error('Usage: node render-pdfkit.mjs <input.md> <output.pdf>')
  process.exit(1)
}

const inputPath = path.resolve(inputArg)
const outputPath = path.resolve(outputArg)
const markdown = await fsp.readFile(inputPath, 'utf8')

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 55, left: 50, right: 50 },
  bufferPages: true,
  autoFirstPage: true,
})

const stream = fs.createWriteStream(outputPath)
doc.pipe(stream)

const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right

const cleanInline = (text) =>
  text
    .replace(/\r/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')

const ensureSpace = (needed = 40) => {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage()
  }
}

const writeParagraph = (text, options = {}) => {
  ensureSpace(40)
  doc
    .font(options.font || 'Helvetica')
    .fontSize(options.size || 10.5)
    .fillColor(options.color || '#1f2937')
    .text(cleanInline(text).trim(), { width: pageWidth, align: options.align || 'justify' })
  doc.moveDown(options.after || 0.6)
}

const writeHeading = (text, level) => {
  const config = {
    1: { size: 22, after: 0.8 },
    2: { size: 17, after: 0.7 },
    3: { size: 14, after: 0.5 },
    4: { size: 12, after: 0.4 },
  }[level] || { size: 11, after: 0.3 }

  ensureSpace(60)
  doc.font('Helvetica-Bold').fontSize(config.size).fillColor('#0f172a').text(cleanInline(text), {
    width: pageWidth,
    align: level === 1 ? 'center' : 'left',
  })
  doc.moveDown(config.after)
}

const writeList = (items, ordered = false) => {
  for (let i = 0; i < items.length; i++) {
    ensureSpace(28)
    const prefix = ordered ? `${i + 1}. ` : '- '
    doc.font('Helvetica').fontSize(10.5).fillColor('#1f2937').text(prefix + cleanInline(items[i]), {
      width: pageWidth,
      indent: 14,
    })
    doc.moveDown(0.25)
  }
  doc.moveDown(0.35)
}

const writeRule = () => {
  ensureSpace(20)
  const y = doc.y + 4
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor('#cbd5e1').stroke()
  doc.moveDown(1)
}

const writeTable = (rows) => {
  const sanitized = rows.filter((row) => row.includes('|')).map((row) => row.trim())
  if (sanitized.length < 2) return
  for (const row of sanitized) {
    if (/^\|?\s*[-:]+/.test(row.replace(/\|/g, '').trim())) continue
    ensureSpace(24)
    const cells = row.split('|').map((c) => cleanInline(c.trim())).filter(Boolean)
    doc.font('Courier').fontSize(9).fillColor('#111827').text(cells.join(' | '), {
      width: pageWidth,
      align: 'left',
    })
    doc.moveDown(0.2)
  }
  doc.moveDown(0.5)
}

const writeCodeBlock = (code, lang = '') => {
  ensureSpace(70)
  if (lang) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text(lang.toUpperCase(), { width: pageWidth })
    doc.moveDown(0.2)
  }
  const blockHeight = 18 + code.split('\n').length * 10
  const top = doc.y
  doc.roundedRect(doc.page.margins.left, top, pageWidth, blockHeight).fill('#0f172a')
  doc.fillColor('#e5e7eb').font('Courier').fontSize(8.3)
  doc.text(code, doc.page.margins.left + 10, top + 8, {
    width: pageWidth - 20,
    align: 'left',
  })
  doc.y = top + blockHeight + 10
}

const renderSvgFit = (svgText, title) => {
  ensureSpace(260)
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(title, { width: pageWidth })
  doc.moveDown(0.3)
  const x = doc.page.margins.left
  const y = doc.y
  SVGtoPDF(doc, svgText, x, y, {
    width: pageWidth,
    height: 420,
    preserveAspectRatio: 'xMidYMid meet',
  })
  doc.y = y + 240
  doc.moveDown(0.6)
}

const fetchMermaidSvg = async (code) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  const res = await fetch('https://kroki.io/mermaid/svg', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: code,
    signal: controller.signal,
  })
  clearTimeout(timeout)
  if (!res.ok) {
    throw new Error(`Kroki error: ${res.status}`)
  }
  return await res.text()
}

const lines = markdown.split('\n')
let i = 0
let diagramCounter = 1

while (i < lines.length) {
  const line = lines[i]
  const trimmed = line.trim()

  if (!trimmed) {
    doc.moveDown(0.35)
    i += 1
    continue
  }

  if (/^---+$/.test(trimmed)) {
    writeRule()
    i += 1
    continue
  }

  const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed)
  if (heading) {
    writeHeading(heading[2], heading[1].length)
    i += 1
    continue
  }

  if (trimmed.startsWith('```')) {
    const lang = trimmed.slice(3).trim()
    const block = []
    i += 1
    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      block.push(lines[i])
      i += 1
    }
    i += 1

    const code = block.join('\n')
    if (lang === 'mermaid') {
      try {
        const svg = await fetchMermaidSvg(code)
        renderSvgFit(svg, `Diagrama ${diagramCounter}`)
      } catch (error) {
        writeParagraph(`No fue posible renderizar un diagrama Mermaid automaticamente: ${error.message}`, {
          color: '#991b1b',
          font: 'Helvetica-Oblique',
          after: 0.3,
        })
        writeCodeBlock(code, 'mermaid')
      }
      diagramCounter += 1
    } else {
      writeCodeBlock(code, lang)
    }
    continue
  }

  if (trimmed.includes('|')) {
    const tableLines = []
    while (i < lines.length && lines[i].includes('|')) {
      tableLines.push(lines[i])
      i += 1
    }
    writeTable(tableLines)
    continue
  }

  if (/^[-*]\s+/.test(trimmed)) {
    const items = []
    while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
      items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
      i += 1
    }
    writeList(items, false)
    continue
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    const items = []
    while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
      items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
      i += 1
    }
    writeList(items, true)
    continue
  }

  const paragraph = [trimmed]
  i += 1
  while (i < lines.length) {
    const candidate = lines[i].trim()
    if (!candidate) break
    if (/^(#{1,4})\s+/.test(candidate)) break
    if (/^---+$/.test(candidate)) break
    if (candidate.startsWith('```')) break
    if (candidate.includes('|')) break
    if (/^[-*]\s+/.test(candidate)) break
    if (/^\d+\.\s+/.test(candidate)) break
    paragraph.push(candidate)
    i += 1
  }
  writeParagraph(paragraph.join(' '))
}

const range = doc.bufferedPageRange()
for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex++) {
  doc.switchToPage(pageIndex)
  doc.font('Helvetica').fontSize(8).fillColor('#6b7280')
  doc.text('Plataforma SaaS de Reclutamiento y Portal de Empleos', doc.page.margins.left, doc.page.height - 30, {
    width: pageWidth - 50,
    align: 'left',
  })
  doc.text(`${pageIndex + 1}`, doc.page.width - doc.page.margins.right - 20, doc.page.height - 30, {
    width: 20,
    align: 'right',
  })
}

doc.end()

await new Promise((resolve, reject) => {
  stream.on('finish', resolve)
  stream.on('error', reject)
})

console.log(`PDF generated at ${outputPath}`)
