import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

/**
 * A small, presentation-agnostic document model. Callers describe *what* the
 * document says as an ordered list of blocks; this service owns *how* it looks
 * (fonts, the brand palette, spacing, page breaks, headers and footers). Keeping
 * the model this simple is what makes the service reusable beyond Teasers and
 * IMs (PRD v2 §14.3) — any feature that needs a branded PDF can build one of
 * these without touching pdfkit.
 */
export type DocBlock =
  | { type: 'heading'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'keyValues'; rows: Array<[string, string]> }
  | { type: 'bullets'; items: string[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'callout'; label: string; text: string }
  | { type: 'divider' }
  | { type: 'spacer'; size?: number };

export interface PdfDocModel {
  /** Big title on the cover / first page. */
  title: string;
  subtitle?: string;
  /** Small caps label above the title, e.g. "TEASER". */
  kicker?: string;
  /** Right-aligned note in the footer, e.g. a confidentiality line. */
  footerNote?: string;
  blocks: DocBlock[];
}

/** The locked charcoal-green brand palette. */
const COLOR = {
  text: '#2C2C2A',
  accent: '#1F6D3B',
  muted: '#7A7870',
  border: '#E1DFD6',
  band: '#F6F5F1',
} as const;

const PAGE_MARGIN = 54; // 0.75in
const FONT = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const FONT_OBLIQUE = 'Helvetica-Oblique';

@Injectable()
export class PdfService {
  /**
   * Renders a document model to a PDF and resolves the finished bytes. pdfkit
   * uses only its built-in AFM fonts, so no font files are read at request time
   * — important for the serverless deploy.
   */
  render(model: PdfDocModel): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN + 20, left: PAGE_MARGIN, right: PAGE_MARGIN },
        bufferPages: true,
        info: { Title: model.title, Author: 'Ensyncro' },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.renderCover(doc, model);
        for (const block of model.blocks) this.renderBlock(doc, block);
        this.paintFooters(doc, model);
        doc.end();
      } catch (err) {
        reject(err as Error);
      }
    });
  }

  private get contentWidth() {
    return 595.28 - PAGE_MARGIN * 2; // A4 width in pt minus both margins
  }

  private renderCover(doc: PDFKit.PDFDocument, model: PdfDocModel) {
    // Brand wordmark (kept as text so no image asset is loaded at runtime).
    doc.fillColor(COLOR.accent).font(FONT_BOLD).fontSize(20).text('ENSYNCRO', { characterSpacing: 2 });
    doc.moveDown(1.5);

    if (model.kicker) {
      doc.fillColor(COLOR.muted).font(FONT_BOLD).fontSize(10).text(model.kicker.toUpperCase(), {
        characterSpacing: 3,
      });
      doc.moveDown(0.4);
    }

    doc.fillColor(COLOR.text).font(FONT_BOLD).fontSize(26).text(model.title);
    if (model.subtitle) {
      doc.moveDown(0.3);
      doc.fillColor(COLOR.muted).font(FONT).fontSize(13).text(model.subtitle);
    }

    doc.moveDown(0.8);
    this.rule(doc, COLOR.accent, 2);
    doc.moveDown(1);
  }

  private renderBlock(doc: PDFKit.PDFDocument, block: DocBlock) {
    switch (block.type) {
      case 'heading':
        this.spaceBeforeHeading(doc);
        doc.fillColor(COLOR.accent).font(FONT_BOLD).fontSize(15).text(block.text);
        doc.moveDown(0.15);
        this.rule(doc, COLOR.border, 1);
        doc.moveDown(0.5);
        break;
      case 'subheading':
        doc.moveDown(0.4);
        doc.fillColor(COLOR.text).font(FONT_BOLD).fontSize(11.5).text(block.text);
        doc.moveDown(0.25);
        break;
      case 'paragraph':
        doc.fillColor(COLOR.text).font(FONT).fontSize(10.5).text(block.text, { align: 'left', lineGap: 2 });
        doc.moveDown(0.5);
        break;
      case 'bullets':
        doc.fillColor(COLOR.text).font(FONT).fontSize(10.5);
        for (const item of block.items) {
          doc.text(item, { indent: 12, lineGap: 2, listType: 'bullet' } as never);
        }
        doc.moveDown(0.5);
        break;
      case 'keyValues':
        this.renderKeyValues(doc, block.rows);
        break;
      case 'table':
        this.renderTable(doc, block.columns, block.rows);
        break;
      case 'callout':
        this.renderCallout(doc, block.label, block.text);
        break;
      case 'divider':
        doc.moveDown(0.3);
        this.rule(doc, COLOR.border, 1);
        doc.moveDown(0.5);
        break;
      case 'spacer':
        doc.moveDown(block.size ?? 0.5);
        break;
    }
  }

  /** Two-column label/value list — the workhorse for profile facts. */
  private renderKeyValues(doc: PDFKit.PDFDocument, rows: Array<[string, string]>) {
    const labelW = 150;
    const valueW = this.contentWidth - labelW - 10;
    doc.fontSize(10.5);
    for (const [label, value] of rows) {
      this.ensureRoom(doc, 24);
      const y = doc.y;
      doc.font(FONT_BOLD).fillColor(COLOR.muted).text(label, PAGE_MARGIN, y, { width: labelW });
      const labelBottom = doc.y;
      doc.font(FONT).fillColor(COLOR.text).text(value || '—', PAGE_MARGIN + labelW + 10, y, {
        width: valueW,
        lineGap: 1,
      });
      // Advance past whichever column ran taller so rows never overlap.
      doc.y = Math.max(labelBottom, doc.y) + 4;
    }
    doc.moveDown(0.4);
  }

  private renderTable(doc: PDFKit.PDFDocument, columns: string[], rows: string[][]) {
    const colCount = columns.length;
    const colW = this.contentWidth / colCount;
    const cellPad = 5;

    const drawRow = (cells: string[], bold: boolean, bg?: string) => {
      doc.font(bold ? FONT_BOLD : FONT).fontSize(9.5);
      // Height is driven by the tallest wrapped cell in the row.
      const heights = cells.map((c) =>
        doc.heightOfString(c || '—', { width: colW - cellPad * 2 }),
      );
      const rowH = Math.max(16, ...heights) + cellPad * 2;
      this.ensureRoom(doc, rowH);
      const top = doc.y;
      if (bg) doc.rect(PAGE_MARGIN, top, this.contentWidth, rowH).fill(bg);
      doc.fillColor(bold ? COLOR.text : COLOR.text);
      cells.forEach((c, i) => {
        doc.font(bold ? FONT_BOLD : FONT).fillColor(bold ? COLOR.text : COLOR.text);
        doc.text(c || '—', PAGE_MARGIN + i * colW + cellPad, top + cellPad, {
          width: colW - cellPad * 2,
        });
      });
      doc.y = top + rowH;
      this.rule(doc, COLOR.border, 0.5);
    };

    this.ensureRoom(doc, 40);
    drawRow(columns, true, COLOR.band);
    for (const r of rows) drawRow(r, false);
    doc.moveDown(0.6);
  }

  private renderCallout(doc: PDFKit.PDFDocument, label: string, text: string) {
    this.ensureRoom(doc, 46);
    const top = doc.y;
    doc.font(FONT_BOLD).fontSize(9).fillColor(COLOR.accent);
    const labelH = doc.heightOfString(label.toUpperCase(), { width: this.contentWidth - 24, characterSpacing: 2 });
    doc.font(FONT_OBLIQUE).fontSize(11);
    const textH = doc.heightOfString(text, { width: this.contentWidth - 24 });
    const boxH = labelH + textH + 22;
    this.ensureRoom(doc, boxH);
    const boxTop = doc.y;
    doc.rect(PAGE_MARGIN, boxTop, this.contentWidth, boxH).fill(COLOR.band);
    doc.rect(PAGE_MARGIN, boxTop, 3, boxH).fill(COLOR.accent);
    doc.fillColor(COLOR.accent).font(FONT_BOLD).fontSize(9).text(label.toUpperCase(), PAGE_MARGIN + 12, boxTop + 8, {
      width: this.contentWidth - 24,
      characterSpacing: 2,
    });
    doc.fillColor(COLOR.text).font(FONT_OBLIQUE).fontSize(11).text(text, PAGE_MARGIN + 12, doc.y + 2, {
      width: this.contentWidth - 24,
    });
    doc.y = boxTop + boxH + 8;
    void top;
  }

  // ── Layout helpers ───────────────────────────────────────────

  private rule(doc: PDFKit.PDFDocument, color: string, width: number) {
    const y = doc.y;
    doc
      .moveTo(PAGE_MARGIN, y)
      .lineTo(595.28 - PAGE_MARGIN, y)
      .lineWidth(width)
      .strokeColor(color)
      .stroke();
    doc.y = y + width + 2;
  }

  /** Adds a page if there isn't room for the next `needed` points of content. */
  private ensureRoom(doc: PDFKit.PDFDocument, needed: number) {
    const bottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + needed > bottom) doc.addPage();
  }

  /** A heading near the bottom of a page should start the next one. */
  private spaceBeforeHeading(doc: PDFKit.PDFDocument) {
    doc.moveDown(0.6);
    this.ensureRoom(doc, 60);
  }

  /** Footer with page numbers + a confidentiality note, painted last. */
  private paintFooters(doc: PDFKit.PDFDocument, model: PdfDocModel) {
    const range = doc.bufferedPageRange();
    const generated = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const y = doc.page.height - doc.page.margins.bottom + 8;
      doc.font(FONT).fontSize(8).fillColor(COLOR.muted);
      doc.text(`Generated ${generated} · Ensyncro`, PAGE_MARGIN, y, {
        width: this.contentWidth / 2,
        align: 'left',
        lineBreak: false,
      });
      const right = model.footerNote ?? `Page ${i - range.start + 1} of ${range.count}`;
      doc.text(right, PAGE_MARGIN + this.contentWidth / 2, y, {
        width: this.contentWidth / 2,
        align: 'right',
        lineBreak: false,
      });
    }
  }
}
