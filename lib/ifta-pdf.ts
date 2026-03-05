import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { IftaResult } from '@/lib/ifta-calculate';
import { getStateTaxRate } from '@/lib/ifta-tax-rates';
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
const FOOTER_Y = PDF_LAYOUT.FOOTER_Y;

export type IftaPdfHeader = {
  legalName: string;
  fein: string;
  iftaAccountNumber: string;
  quarter: number;
  year: number;
  mpg: number;
  /** Company name for header block (defaults to legalName) */
  companyName?: string;
  /** DOT number for carrier metadata */
  dotNumber?: string;
  /** Export date for carrier metadata (e.g. formatted date string) */
  exportDate?: string;
};

/**
 * Generates an IFTA-100 style return PDF (black and white, professional).
 * Professional header (logo + OFFICIAL IFTA RECORD), carrier metadata, table, watermark, footer.
 */
export async function generateIftaPdf(
  header: IftaPdfHeader,
  iftaResult: IftaResult
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

  const carrierMeta: CarrierMetadata = {
    companyName: header.companyName ?? header.legalName ?? '—',
    dotNumber: header.dotNumber ?? '—',
    exportDate: header.exportDate ?? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  };
  y = drawCarrierBlock(page, fonts, carrierMeta, y);

  const titleSize = 14;
  const bodySize = 10;
  const smallSize = 8;
  const lineHeight = bodySize + 4;

  function drawTextLine(label: string, value: string, x: number) {
    page.drawText(`${label}: ${value}`, { x, y, size: bodySize, font, color: black });
    y -= lineHeight;
  }

  page.drawText('IFTA Quarterly Tax Return (IFTA-100 Style)', {
    x: MARGIN,
    y,
    size: titleSize,
    font: fontBold,
    color: black,
  });
  y -= lineHeight + 4;

  drawTextLine('Legal Name', header.legalName || '—', MARGIN);
  drawTextLine('FEIN', header.fein || '—', MARGIN);
  drawTextLine('IFTA Account Number', header.iftaAccountNumber || '—', MARGIN);
  drawTextLine('Period', `Q${header.quarter} ${header.year}`, MARGIN);
  drawTextLine('Overall MPG', header.mpg > 0 ? header.mpg.toFixed(2) : '—', MARGIN);
  y -= 8;

  const tableTop = y;
  const colWidths = [42, 42, 42, 48, 38, 42, 42, 48];
  const headers = ['State', 'Miles', 'Gallons', 'Taxable Gal', 'Rate', 'Tax Owed', 'Tax Paid', 'Net'];
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableLeft = MARGIN;

  let colX = tableLeft;
  headers.forEach((h, i) => {
    page.drawText(h, { x: colX + 2, y, size: smallSize, font: fontBold, color: black });
    colX += colWidths[i];
  });
  y -= lineHeight - 2;

  page.drawLine({
    start: { x: tableLeft, y },
    end: { x: tableLeft + totalWidth, y },
    thickness: 0.5,
    color: black,
  });
  y -= 4;

  for (const row of iftaResult.rows) {
    const taxableGal = iftaResult.mpg > 0 ? row.miles / iftaResult.mpg : 0;
    const rate = getStateTaxRate(row.state_code, header.quarter as 1 | 2 | 3 | 4, header.year);
    colX = tableLeft;
    const cells = [
      row.state_code,
      row.miles.toFixed(0),
      row.gallons.toFixed(1),
      taxableGal.toFixed(1),
      rate.toFixed(3),
      row.taxRequired.toFixed(2),
      row.taxPaid.toFixed(2),
      row.netOwed.toFixed(2),
    ];
    cells.forEach((cell, i) => {
      page.drawText(cell, { x: colX + 2, y, size: smallSize, font, color: black });
      colX += colWidths[i];
    });
    y -= lineHeight - 2;
    if (y < FOOTER_Y + 60) break;
  }

  y -= 6;
  page.drawLine({
    start: { x: tableLeft, y },
    end: { x: tableLeft + totalWidth, y },
    thickness: 0.5,
    color: black,
  });
  y -= lineHeight;

  const totalBalance = iftaResult.rows.reduce((s, r) => s + r.netOwed, 0);
  page.drawText('Total Balance Due:', { x: tableLeft, y, size: bodySize, font: fontBold, color: black });
  page.drawText(`$${totalBalance.toFixed(2)}`, {
    x: tableLeft + totalWidth - 60,
    y,
    size: bodySize,
    font: fontBold,
    color: black,
  });
  y -= lineHeight * 2;

  drawWatermark(page, fonts);
  drawFooter(page, fonts, 1, 1);

  const pdfBytes = await doc.save();
  return pdfBytes;
}
