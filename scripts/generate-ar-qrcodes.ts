/**
 * generate-ar-qrcodes.ts
 *
 * Generates QR codes for all AR points and a print-ready PDF grid.
 *
 * Usage:
 *   npx tsx scripts/generate-ar-qrcodes.ts [output-dir]
 *
 * Each QR code links to: https://guelaguetzaconnect.com/ar/point/{codigo}
 * Output: qr_{codigo}.png (300×300 px) + ar-qrcodes-print.pdf
 */

import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// AR POINTS — sourced from ar_migration_complete.sql seed data
// ============================================================================

const AR_POINTS = [
  // Monuments
  { codigo: 'santo_domingo',        nombre: 'Templo de Santo Domingo',    region: 'Valles Centrales', color: '#D4AF37' },
  { codigo: 'teatro_macedonio',     nombre: 'Teatro Macedonio Alcalá',    region: 'Valles Centrales', color: '#8B4513' },

  // Quest items — La Búsqueda de Donají
  { codigo: 'donaji_lirio_1',       nombre: 'Lirio de Donají - Catedral',         region: 'Valles Centrales', color: '#FFD700' },
  { codigo: 'donaji_lirio_2',       nombre: 'Lirio de Donají - Alameda de León',  region: 'Valles Centrales', color: '#FFD700' },
  { codigo: 'donaji_lirio_3',       nombre: 'Lirio de Donají - Museo de Culturas', region: 'Valles Centrales', color: '#FFD700' },
  { codigo: 'donaji_lirio_final',   nombre: 'Lirio de Donají - Escudo Ciudad',    region: 'Valles Centrales', color: '#FFD700' },

  // Tiliches / Personajes regionales
  { codigo: 'tiliche_danzante_pluma',   nombre: 'Danzante de la Pluma',   region: 'Valles Centrales', color: '#E63946' },
  { codigo: 'tiliche_china_oaxaquena',  nombre: 'China Oaxaqueña',        region: 'Valles Centrales', color: '#E63946' },
  { codigo: 'tiliche_tehuana',          nombre: 'Tehuana',                region: 'Istmo',            color: '#9B59B6' },
  { codigo: 'tiliche_flor_pina',        nombre: 'Flor de Piña',           region: 'Papaloapan',       color: '#1ABC9C' },
  { codigo: 'tiliche_jarabe_mixteco',   nombre: 'Jarabe Mixteco',         region: 'Mixteca',          color: '#3498DB' },
  { codigo: 'tiliche_putla',            nombre: 'Tiliche de Putla',       region: 'Sierra Sur',       color: '#2A9D8F' },
  { codigo: 'tiliche_chilena',          nombre: 'La Chilena',             region: 'Costa',            color: '#F4A261' },
  { codigo: 'tiliche_sandunga',         nombre: 'La Sandunga',            region: 'Istmo',            color: '#9B59B6' },
] as const;

const BASE_URL = 'https://guelaguetzaconnect.com/ar/point';
const QR_SIZE = 300;

// ============================================================================
// QR PNG generation
// ============================================================================

async function generateQRPng(codigo: string, outputDir: string): Promise<string> {
  const url = `${BASE_URL}/${codigo}`;
  const outputPath = path.join(outputDir, `qr_${codigo}.png`);

  await QRCode.toFile(outputPath, url, {
    type: 'png',
    width: QR_SIZE,
    margin: 2,
    color: {
      dark: '#1a1a1a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H', // High — tolerates ~30% damage; good for print
  });

  return outputPath;
}

// ============================================================================
// Print-ready PDF via simple HTML+SVG (using QRCode.toDataURL)
// ============================================================================

async function generatePrintPdf(outputDir: string): Promise<string> {
  const cells: string[] = [];

  for (const point of AR_POINTS) {
    const url = `${BASE_URL}/${point.codigo}`;
    const dataUrl = await QRCode.toDataURL(url, {
      type: 'image/png',
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'H',
    });

    const borderColor = point.color;
    cells.push(`
      <div class="qr-cell">
        <div class="qr-border" style="border-color: ${borderColor};">
          <img src="${dataUrl}" width="160" height="160" alt="QR ${point.nombre}" />
        </div>
        <p class="qr-nombre">${point.nombre}</p>
        <p class="qr-region">${point.region}</p>
        <p class="qr-url">${url}</p>
      </div>
    `);
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Guelaguetza AR — Códigos QR</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, serif;
      background: #fff;
      color: #1a1a1a;
      padding: 24px;
    }
    h1 {
      text-align: center;
      font-size: 22px;
      margin-bottom: 8px;
      color: #C0392B;
    }
    .subtitle {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .qr-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .qr-border {
      border: 4px solid #E63946;
      border-radius: 8px;
      padding: 8px;
      margin-bottom: 10px;
    }
    .qr-nombre {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 2px;
    }
    .qr-region {
      font-size: 10px;
      color: #666;
      text-align: center;
      margin-bottom: 4px;
    }
    .qr-url {
      font-size: 8px;
      color: #999;
      text-align: center;
      word-break: break-all;
    }
    @media print {
      body { padding: 12px; }
      .grid { gap: 12px; }
    }
  </style>
</head>
<body>
  <h1>Guelaguetza AR — Puntos de Realidad Aumentada</h1>
  <p class="subtitle">Escanea el código QR con tu cámara para activar la experiencia AR</p>
  <div class="grid">
    ${cells.join('\n')}
  </div>
</body>
</html>`;

  const htmlPath = path.join(outputDir, 'ar-qrcodes-print.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`Print-ready HTML saved: ${htmlPath}`);
  console.log('Open this file in Chrome and use File > Print to export as PDF.');

  return htmlPath;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const outputDir = process.argv[2] ?? path.join(process.cwd(), 'public', 'qrcodes');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Generating ${AR_POINTS.length} QR codes → ${outputDir}`);

  const results: { codigo: string; path: string }[] = [];

  for (const point of AR_POINTS) {
    const filePath = await generateQRPng(point.codigo, outputDir);
    results.push({ codigo: point.codigo, path: filePath });
    console.log(`  ✓ ${point.codigo} → ${path.basename(filePath)}`);
  }

  await generatePrintPdf(outputDir);

  console.log(`\nDone — ${results.length} QR codes generated.`);
  console.log(`Output directory: ${outputDir}`);
}

main().catch((err) => {
  console.error('Error generating QR codes:', err);
  process.exit(1);
});
