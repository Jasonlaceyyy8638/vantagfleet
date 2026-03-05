import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  PDF_LAYOUT,
  drawReportHeader,
  drawCarrierBlock,
  drawWatermark,
  drawFooter,
  type CarrierMetadata,
} from '@/lib/pdf-layout';

const MARGIN = PDF_LAYOUT.MARGIN;
const PAGE_WIDTH = PDF_LAYOUT.PAGE_WIDTH;
const PAGE_HEIGHT = PDF_LAYOUT.PAGE_HEIGHT;
const LINE_HEIGHT = 14;
const FONT_SIZE = 10;
const FONT_SMALL = 8;

export type AuditSummaryRow = {
  state_code: string;
  taxableMiles: number;
  fuelPurchases: number;
};

export type AuditTripLogRow = {
  state: string;
  enterTime: string;
  exitTime: string;
  distance: number;
  /** Optional: e.g. vehicle or driver id for display */
  source?: string;
};

/**
 * Generate Summary Report PDF: State, Taxable Miles, Fuel Purchases.
 * Includes professional header, carrier metadata, watermark, and footer.
 */
export async function generateAuditSummaryPdf(
  companyName: string,
  quarter: number,
  year: number,
  rows: AuditSummaryRow[],
  options?: { dotNumber?: string; exportDate?: string }
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const fonts = { font, fontBold };

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  drawReportHeader(page, fonts, y);
  y -= 18;

  const exportDate = options?.exportDate ?? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const carrierMeta: CarrierMetadata = {
    companyName: companyName || '—',
    dotNumber: options?.dotNumber ?? '—',
    exportDate,
  };
  y = drawCarrierBlock(page, fonts, carrierMeta, y);

  page.drawText('IFTA Audit Summary Report', {
    x: MARGIN,
    y,
    size: 14,
    font: fontBold,
    color: black,
  });
  y -= LINE_HEIGHT + 4;
  page.drawText(`Period: Q${quarter} ${year}`, { x: MARGIN, y, size: FONT_SIZE, font, color: black });
  y -= LINE_HEIGHT * 2;

  const colW = [60, 100, 100];
  const headers = ['State', 'Taxable Miles', 'Fuel Purchases (gal)'];
  let colX = MARGIN;
  headers.forEach((h, i) => {
    page.drawText(h, { x: colX + 2, y, size: FONT_SMALL, font: fontBold, color: black });
    colX += colW[i];
  });
  y -= LINE_HEIGHT;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + colW.reduce((a, b) => a + b, 0), y },
    thickness: 0.5,
    color: black,
  });
  y -= 6;

  for (const row of rows) {
    if (y < PDF_LAYOUT.FOOTER_Y + 60) break;
    colX = MARGIN;
    page.drawText(row.state_code, { x: colX + 2, y, size: FONT_SMALL, font, color: black });
    colX += colW[0];
    page.drawText(row.taxableMiles.toFixed(1), { x: colX + 2, y, size: FONT_SMALL, font, color: black });
    colX += colW[1];
    page.drawText(row.fuelPurchases.toFixed(2), { x: colX + 2, y, size: FONT_SMALL, font, color: black });
    y -= LINE_HEIGHT - 2;
  }

  drawWatermark(page, fonts);
  drawFooter(page, fonts, 1, 1);

  return doc.save();
}

/**
 * Generate Detailed Trip Log PDF: state line crossings with entry/exit and distance.
 * Includes professional header, carrier metadata, watermark, and footer. Handles multiple pages.
 */
export async function generateAuditTripLogPdf(
  companyName: string,
  quarter: number,
  year: number,
  rows: AuditTripLogRow[],
  options?: { dotNumber?: string; exportDate?: string }
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const fonts = { font, fontBold };

  const exportDate = options?.exportDate ?? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const carrierMeta: CarrierMetadata = {
    companyName: companyName || '—',
    dotNumber: options?.dotNumber ?? '—',
    exportDate,
  };

  const colW = [50, 90, 90, 60];
  const tableWidth = colW.reduce((a, b) => a + b, 0);
  const contentBottom = PDF_LAYOUT.FOOTER_Y + 50;
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  let pageNum = 1;

  drawReportHeader(page, fonts, y);
  y -= 18;
  y = drawCarrierBlock(page, fonts, carrierMeta, y);

  page.drawText('IFTA Detailed Trip Log (State Line Crossings)', {
    x: MARGIN,
    y,
    size: 14,
    font: fontBold,
    color: black,
  });
  y -= LINE_HEIGHT + 4;
  page.drawText(`Period: Q${quarter} ${year}`, { x: MARGIN, y, size: FONT_SIZE, font, color: black });
  y -= LINE_HEIGHT * 2;

  const headers = ['State', 'Enter (UTC)', 'Exit (UTC)', 'Miles'];
  let colX = MARGIN;
  headers.forEach((h, i) => {
    page.drawText(h, { x: colX + 2, y, size: FONT_SMALL, font: fontBold, color: black });
    colX += colW[i];
  });
  y -= LINE_HEIGHT;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + tableWidth, y },
    thickness: 0.5,
    color: black,
  });
  y -= 6;

  for (const row of rows) {
    if (y < contentBottom) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNum += 1;
      y = PAGE_HEIGHT - MARGIN;
      drawReportHeader(page, fonts, y);
      y -= LINE_HEIGHT + 8;
    }
    colX = MARGIN;
    page.drawText(row.state, { x: colX + 2, y, size: FONT_SMALL, font, color: black });
    colX += colW[0];
    page.drawText(row.enterTime, { x: colX + 2, y, size: FONT_SMALL, font, color: black });
    colX += colW[1];
    page.drawText(row.exitTime, { x: colX + 2, y, size: FONT_SMALL, font, color: black });
    colX += colW[2];
    page.drawText(row.distance.toFixed(1), { x: colX + 2, y, size: FONT_SMALL, font, color: black });
    y -= LINE_HEIGHT - 2;
  }

  if (rows.length === 0) {
    page.drawText('No detailed trip records for this period. Connect Geotab for state-line crossing details.', {
      x: MARGIN,
      y,
      size: FONT_SIZE,
      font,
      color: gray,
    });
  }

  const totalPages = doc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const p = doc.getPage(i);
    drawWatermark(p, fonts);
    drawFooter(p, fonts, i + 1, totalPages);
  }

  return doc.save();
}
