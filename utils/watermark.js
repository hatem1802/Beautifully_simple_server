import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, degrees, rgb } from "pdf-lib";

const FONT_PATH = path.resolve("assets/fonts/Amiri-Regular.ttf");
const INK = rgb(0, 0, 0);
const HALO = rgb(1, 1, 1);

let typeface;
const lineCache = new Map();

const getTypeface = () => {
  if (!typeface) typeface = fontkit.create(fs.readFileSync(FONT_PATH));
  return typeface;
};

const visualRuns = (text) =>
  text.match(
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+|[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g
  ) || [];

// Outlines come from the font shaper, so Arabic is drawn as letters instead of broken glyphs.
const linePath = (text) => {
  const cached = lineCache.get(text);
  if (cached) return cached;

  const font = getTypeface();
  let pen = 0;
  const pieces = [];
  for (const runText of visualRuns(text)) {
    const run = font.layout(runText);
    for (let i = 0; i < run.glyphs.length; i += 1) {
      const position = run.positions[i];
      const placed = run.glyphs[i].path
        .translate(pen + position.xOffset, position.yOffset)
        .scale(1, -1);
      const svg = placed.toSVG();
      if (svg) pieces.push(svg);
      pen += position.xAdvance;
    }
  }

  const line = { svg: pieces.join(" "), width: pen };
  lineCache.set(text, line);
  return line;
};

const lineWidth = (text, size) => (linePath(text).width * size) / getTypeface().unitsPerEm;

const drawLine = (page, text, { x, y, size, rotate }) => {
  const line = linePath(text);
  if (!line.svg) return;
  const scale = size / getTypeface().unitsPerEm;
  page.drawSvgPath(line.svg, {
    x,
    y,
    scale,
    rotate,
    color: INK,
    opacity: 1,
    borderColor: HALO,
    borderWidth: 1.4 / scale,
    borderOpacity: 0.5,
  });
};

const stampPdf = async (bytes, { name, email }) => {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const labelName = String(name || "").trim() || "Student";
  const labelEmail = String(email || "").trim();
  const footer = [labelName, labelEmail].filter(Boolean).join("    ");
  const tilt = degrees(32);

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    for (let y = 80; y < height; y += 170) {
      for (let x = 24; x < width; x += 280) {
        drawLine(page, labelName, { x, y, size: 15, rotate: tilt });
        if (labelEmail) drawLine(page, labelEmail, { x, y: y - 20, size: 11, rotate: tilt });
      }
    }

    const footerWidth = lineWidth(footer, 12);
    drawLine(page, footer, {
      x: Math.max(16, (width - footerWidth) / 2),
      y: 18,
      size: 12,
    });
  }

  return Buffer.from(await pdf.save());
};

export { stampPdf };
