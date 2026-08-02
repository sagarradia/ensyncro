import { PdfService, PdfDocModel } from './pdf.service';

describe('PdfService', () => {
  const svc = new PdfService();

  const model: PdfDocModel = {
    kicker: 'Teaser',
    title: 'Verdant Labs',
    subtitle: 'Precision agriculture',
    footerNote: 'Confidential',
    blocks: [
      { type: 'callout', label: 'Pitch', text: 'One line.' },
      { type: 'heading', text: 'Snapshot' },
      { type: 'subheading', text: 'Details' },
      { type: 'paragraph', text: 'Some prose about the company.' },
      { type: 'keyValues', rows: [['Sector', 'Agritech'], ['Stage', 'Seed']] },
      { type: 'bullets', items: ['One', 'Two'] },
      { type: 'table', columns: ['A', 'B'], rows: [['1', '2'], ['3', '4']] },
      { type: 'divider' },
      { type: 'spacer', size: 1 },
    ],
  };

  it('renders a valid, non-trivial PDF exercising every block type', async () => {
    const buf = await svc.render(model);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(500);
  });

  it('renders a minimal document (title only, no blocks)', async () => {
    const buf = await svc.render({ title: 'Empty', blocks: [] });
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });
});
