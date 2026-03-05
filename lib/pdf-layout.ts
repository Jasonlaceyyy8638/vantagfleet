/**
 * Shared layout for IFTA and Audit PDFs: header (logo + OFFICIAL IFTA RECORD),
 * carrier metadata block, diagonal watermark, and footer with page numbers and disclaimer.
 * Used by lib/ifta-pdf.ts and lib/ifta-audit-pdf.ts.
 */
import { rgb, degrees } from 'pdf-lib';

/** Minimal type for page: has drawText. */
type PageLike = { drawText: (text: string, options: Record<string, unknown>) => void };
/** Minimal type for font: has widthOfTextAtSize. */
type FontLike = { widthOfTextAtSize: (text: string, size: number) => number };

export const PDF_LAYOUT = {
  PAGE_WIDTH: 612,
  PAGE_HEIGHT: 792,
  MARGIN: 50,
  FOOTER_Y: 36,
  HEADER_LOGO_LEFT: 'VantagFleet',
  OFFICIAL_LABEL: 'OFFICIAL IFTA RECORD',
  WATERMARK_TEXT: 'Certified by VantagFleet Automation',
  FOOTER_DISCLAIMER: 'This report was generated using synchronized ELD data. Visit vantagfleet.com for verification.',
} as const;

export type CarrierMetadata = {
  companyName: string;
  dotNumber: string;
  exportDate: string;
};

export type PdfLayoutFonts = {
  font: FontLike;
  fontBold: FontLike;
};

const black = rgb(0, 0, 0);
const gray = rgb(0.5, 0.5, 0.5);
const watermarkGray = rgb(0.85, 0.85, 0.85);

/**
 * Draw the professional header on every page: logo (text) left, "OFFICIAL IFTA RECORD" right.
 */
export function drawReportHeader(
  page: PageLike,
  fonts: PdfLayoutFonts,
  yStart: number
): number {
  const { font, fontBold } = fonts;
  let y = yStart;
  const headerSize = 11;
  const lineH = 14;

  page.drawText(PDF_LAYOUT.HEADER_LOGO_LEFT, {
    x: PDF_LAYOUT.MARGIN,
    y,
    size: headerSize,
    font: fontBold,
    color: black,
  });
  const officialW = fontBold.widthOfTextAtSize(PDF_LAYOUT.OFFICIAL_LABEL, 10);
  page.drawText(PDF_LAYOUT.OFFICIAL_LABEL, {
    x: PDF_LAYOUT.PAGE_WIDTH - PDF_LAYOUT.MARGIN - officialW,
    y,
    size: 10,
    font: fontBold,
    color: black,
  });
  y -= lineH;
  return y;
}

/**
 * Draw carrier metadata block: Company Name, DOT Number, Export Date.
 */
export function drawCarrierBlock(
  page: PageLike,
  fonts: PdfLayoutFonts,
  meta: CarrierMetadata,
  yStart: number
): number {
  const { font } = fonts;
  let y = yStart;
  const lineH = 12;
  const labelSize = 9;
  const valueSize = 10;

  page.drawText('Company Name', { x: PDF_LAYOUT.MARGIN, y, size: labelSize, font, color: gray });
  page.drawText(meta.companyName || '—', { x: PDF_LAYOUT.MARGIN + 90, y, size: valueSize, font, color: black });
  y -= lineH;
  page.drawText('DOT Number', { x: PDF_LAYOUT.MARGIN, y, size: labelSize, font, color: gray });
  page.drawText(meta.dotNumber || '—', { x: PDF_LAYOUT.MARGIN + 90, y, size: valueSize, font, color: black });
  y -= lineH;
  page.drawText('Export Date', { x: PDF_LAYOUT.MARGIN, y, size: labelSize, font, color: gray });
  page.drawText(meta.exportDate || '—', { x: PDF_LAYOUT.MARGIN + 90, y, size: valueSize, font, color: black });
  y -= lineH + 8;
  return y;
}

/**
 * Draw a subtle diagonal watermark across the center of the page.
 */
export function drawWatermark(page: PageLike, fonts: PdfLayoutFonts): void {
  const { font } = fonts;
  const cx = PDF_LAYOUT.PAGE_WIDTH / 2;
  const cy = PDF_LAYOUT.PAGE_HEIGHT / 2;
  const size = 22;
  const textW = font.widthOfTextAtSize(PDF_LAYOUT.WATERMARK_TEXT, size);
  const x = cx - textW / 2;
  const y = cy - size / 2;

  page.drawText(PDF_LAYOUT.WATERMARK_TEXT, {
    x,
    y,
    size,
    font,
    color: watermarkGray,
    rotate: degrees(-35),
  });
}

/**
 * Draw footer: "Page X of Y" and disclaimer.
 */
export function drawFooter(
  page: PageLike,
  fonts: PdfLayoutFonts,
  pageNum: number,
  totalPages: number
): void {
  const { font } = fonts;
  const smallSize = 8;
  const pageText = `Page ${pageNum} of ${totalPages}`;
  const pageW = font.widthOfTextAtSize(pageText, smallSize);
  const disclaimerLines = PDF_LAYOUT.FOOTER_DISCLAIMER;
  const y = PDF_LAYOUT.FOOTER_Y;

  page.drawText(pageText, {
    x: PDF_LAYOUT.PAGE_WIDTH - PDF_LAYOUT.MARGIN - pageW,
    y: y + 10,
    size: smallSize,
    font,
    color: gray,
  });
  page.drawText(disclaimerLines, {
    x: PDF_LAYOUT.MARGIN,
    y,
    size: smallSize,
    font,
    color: gray,
  });
}
