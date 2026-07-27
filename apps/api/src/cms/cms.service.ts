import { BadRequestException, Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import type { Cell } from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import {
  CMS_FIELDS,
  CMS_FIELD_BY_KEY,
  CmsGroup,
  isKnownCmsKey,
  toList,
} from './cms-fields';

export interface CmsUpdate {
  key: string;
  value: string;
}

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Current stored values keyed by field key (unset keys fall back to defaults). */
  private async values(): Promise<Map<string, string>> {
    const rows = await this.prisma.cmsContent.findMany({ select: { key: true, value: true } });
    const stored = new Map(rows.map((r) => [r.key, r.value]));
    const out = new Map<string, string>();
    for (const f of CMS_FIELDS) out.set(f.key, stored.get(f.key) ?? f.default);
    return out;
  }

  /**
   * The admin edit form: every field with its metadata and current value,
   * grouped so the UI can render sections without hardcoding the field list.
   */
  async adminContent() {
    const values = await this.values();
    const groups: Record<CmsGroup, unknown[]> = { homepage: [], pricing: [], settings: [] };
    for (const f of CMS_FIELDS) {
      groups[f.group].push({
        key: f.key,
        label: f.label,
        type: f.type,
        help: f.help ?? null,
        value: values.get(f.key) ?? f.default,
      });
    }
    return {
      groups: (Object.keys(groups) as CmsGroup[]).map((name) => ({ name, fields: groups[name] })),
    };
  }

  /**
   * The world-readable content the homepage renders from — so admin edits show
   * up live instead of being baked into the bundle.
   */
  async publicContent() {
    const v = await this.values();
    const tier = (n: 1 | 2 | 3) => ({
      name: v.get(`pricing.tier${n}.name`) ?? '',
      price: v.get(`pricing.tier${n}.price`) ?? '',
      features: toList(v.get(`pricing.tier${n}.features`) ?? ''),
    });
    return {
      homepage: {
        tagline: v.get('homepage.tagline') ?? '',
        headline: v.get('homepage.headline') ?? '',
        subtext: v.get('homepage.subtext') ?? '',
        cta: {
          headline: v.get('homepage.cta.headline') ?? '',
          subtext: v.get('homepage.cta.subtext') ?? '',
          button: v.get('homepage.cta.button') ?? '',
        },
      },
      pricing: {
        tiers: [tier(1), tier(2), tier(3)],
        successFeePct: Number(v.get('settings.success_fee_pct') ?? '0'),
      },
    };
  }

  /** Upserts a set of updates, ignoring unknown keys. Returns what changed. */
  async saveMany(updates: CmsUpdate[], userId: string) {
    const applied: string[] = [];
    const skipped: string[] = [];

    const clean = updates.filter((u) => {
      if (!isKnownCmsKey(u.key)) {
        skipped.push(u.key);
        return false;
      }
      return true;
    });

    // Reject a nonsensical success fee rather than silently storing it.
    for (const u of clean) {
      const field = CMS_FIELD_BY_KEY.get(u.key)!;
      if (field.type === 'number') {
        const n = Number(u.value);
        if (!Number.isFinite(n)) throw new BadRequestException(`${field.label} must be a number`);
        if (u.key === 'settings.success_fee_pct' && (n < 0 || n > 100)) {
          throw new BadRequestException('Success fee must be between 0 and 100');
        }
      }
    }

    await this.prisma.$transaction(
      clean.map((u) =>
        this.prisma.cmsContent.upsert({
          where: { key: u.key },
          create: { key: u.key, value: u.value, updatedById: userId },
          update: { value: u.value, updatedById: userId },
        }),
      ),
    );
    applied.push(...clean.map((u) => u.key));
    return { updated: applied.length, appliedKeys: applied, skippedKeys: skipped };
  }

  // ── Excel bulk upload ──────────────────────────────────────────

  /** Parses an uploaded .xlsx into key/value updates for known fields. */
  async parseWorkbook(buffer: Buffer): Promise<{ updates: CmsUpdate[]; skipped: string[] }> {
    const wb = new Workbook();
    try {
      await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    } catch {
      throw new BadRequestException('That file is not a readable .xlsx workbook');
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('The workbook has no sheets');

    // Locate the "key" and "value" columns from the header row (default A/B).
    let keyCol = 1;
    let valCol = 2;
    ws.getRow(1).eachCell((cell, col) => {
      const h = cellText(cell).trim().toLowerCase();
      if (h === 'key') keyCol = col;
      if (h === 'value') valCol = col;
    });

    const updates: CmsUpdate[] = [];
    const skipped: string[] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // header
      const key = cellText(row.getCell(keyCol)).trim();
      if (!key) return;
      const value = cellText(row.getCell(valCol));
      if (isKnownCmsKey(key)) updates.push({ key, value });
      else skipped.push(key);
    });

    if (!updates.length) {
      throw new BadRequestException(
        'No known content keys found. Use the template — column A "key", column B "value".',
      );
    }
    return { updates, skipped };
  }

  async bulkUpload(buffer: Buffer, userId: string) {
    const { updates, skipped } = await this.parseWorkbook(buffer);
    const result = await this.saveMany(updates, userId);
    // Merge keys skipped at parse time (unknown) with any skipped on save.
    return { ...result, skippedKeys: [...new Set([...skipped, ...result.skippedKeys])] };
  }

  /** A prefilled template workbook (key | value) the admin edits and re-uploads. */
  async templateWorkbook(): Promise<Buffer> {
    const values = await this.values();
    const wb = new Workbook();
    wb.creator = 'Ensyncro';
    const ws = wb.addWorksheet('CMS content');
    ws.columns = [
      { header: 'key', key: 'key', width: 32 },
      { header: 'value', key: 'value', width: 70 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const f of CMS_FIELDS) {
      const row = ws.addRow({ key: f.key, value: values.get(f.key) ?? f.default });
      if (f.type === 'list' || f.type === 'textarea') {
        row.getCell('value').alignment = { wrapText: true, vertical: 'top' };
      }
    }
    const out = await wb.xlsx.writeBuffer();
    return Buffer.from(out);
  }
}

/** Extracts plain text from any exceljs cell value shape. */
function cellText(cell: Cell): string {
  const v = cell?.value as unknown;
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.text === 'string') return o.text;
    if (Array.isArray(o.richText)) return o.richText.map((r) => (r as { text: string }).text).join('');
    if ('result' in o) return o.result == null ? '' : String(o.result);
    if (o.hyperlink && typeof o.hyperlink === 'string') return o.hyperlink;
  }
  return String(v);
}
