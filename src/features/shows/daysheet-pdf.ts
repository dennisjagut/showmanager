import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib";
import type { Guest, ScheduleItem, Show } from "@/lib/api/types";
import { formatLongDate } from "@/lib/dates";
import { guestCount, type LogisticsField, logisticsBlocks, place } from "./infos";

// A4 in points
const WIDTH = 595.28;
const HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT = WIDTH - 2 * MARGIN;

const BLACK = rgb(0.09, 0.09, 0.11);
const GREY = rgb(0.45, 0.45, 0.5);
const LINE = rgb(0.88, 0.88, 0.9);

type Data = { show: Show; schedule: ScheduleItem[]; guests: Guest[] };

// Translated texts, so this module does not depend on the request
export type DaysheetTexts = {
  locale: string;
  // "Daysheet"
  title: string;
  // shown next to "Daysheet" unless the show is confirmed
  status: string | null;
  schedule: string;
  noSchedule: string;
  contact: string;
  logistics: Record<LogisticsField, string>;
  guestList: (people: number) => string;
  addedBy: (name: string) => string;
  page: (page: number, total: number) => string;
};

type TextOptions = {
  size?: number;
  font?: PDFFont;
  color?: ReturnType<typeof rgb>;
  // extra space above
  spacing?: number;
  indent?: number;
};

/** Builds the daysheet as a PDF – independent of the browser's print dialog, so it also works on phones. */
export async function daysheetPdf({ show, schedule, guests }: Data, texts: DaysheetTexts): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${texts.title} ${show.title}`);
  pdf.setLanguage(texts.locale);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(pdf, regular, bold);
  const date = formatLongDate(show.date, texts.locale);

  w.text(`${texts.title.toUpperCase()}${texts.status ? ` · ${texts.status.toUpperCase()}` : ""}`, {
    size: 9,
    font: bold,
    color: GREY,
  });
  w.text(show.title, { size: 24, font: bold, spacing: 4 });
  w.text(date, { size: 14, spacing: 2 });
  if (place(show)) w.text(place(show), { size: 11, spacing: 2 });
  w.divider();

  w.heading(texts.schedule);
  if (schedule.length === 0) w.text(texts.noSchedule, { color: GREY });
  for (const p of schedule) w.timeRow(p.time, p.item);

  const contact = [show.contactName, show.contactPhone, show.contactEmail].filter(Boolean).join("\n");
  const blocks: [string, string][] = contact ? [[texts.contact, contact]] : [];
  for (const [field, text] of logisticsBlocks(show)) blocks.push([texts.logistics[field], text]);
  for (const [title, content] of blocks) {
    w.heading(title);
    w.text(content);
  }

  if (guests.length > 0) {
    w.heading(texts.guestList(guestCount(guests)));
    for (const g of guests) {
      const extra = [g.addedBy && texts.addedBy(g.addedBy), g.note].filter(Boolean).join(" · ");
      w.text(`${g.name}${g.plusOnes > 0 ? ` +${g.plusOnes}` : ""}${extra ? `  (${extra})` : ""}`);
    }
  }

  w.footers(`${show.title} · ${date}`, texts.page);
  return pdf.save();
}

// Small layout helper: writes from top to bottom and wraps lines and pages
class Writer {
  private page: PDFPage;
  private y = HEIGHT - MARGIN;
  private chars: Set<number>;

  constructor(
    private pdf: PDFDocument,
    private regular: PDFFont,
    private bold: PDFFont,
  ) {
    this.page = pdf.addPage([WIDTH, HEIGHT]);
    // The standard fonts only support WinAnsi (incl. umlauts, €, –); anything else, e.g. emojis, is dropped
    this.chars = new Set(regular.getCharacterSet());
  }

  // For a single line: line breaks are not WinAnsi characters and must be split beforehand
  private safe(line: string): string {
    return [...line.replace(/\t/g, " ")]
      .filter((c) => this.chars.has(c.codePointAt(0)!))
      .join("")
      .replace(/ {2,}/g, " ");
  }

  private space(height: number) {
    if (this.y - height < MARGIN + 20) {
      this.page = this.pdf.addPage([WIDTH, HEIGHT]);
      this.y = HEIGHT - MARGIN;
    }
  }

  private wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const lines: string[] = [];
    for (const paragraph of text.split(/\r?\n/).map((a) => this.safe(a))) {
      let line = "";
      for (const word of paragraph.split(" ")) {
        const attempt = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(attempt, size) <= width || !line) line = attempt;
        else {
          lines.push(line);
          line = word;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  text(text: string, { size = 11, font = this.regular, color = BLACK, spacing = 0, indent = 0 }: TextOptions = {}) {
    const lineHeight = size * 1.35;
    this.y -= spacing;
    for (const line of this.wrap(text, font, size, CONTENT - indent)) {
      this.space(lineHeight);
      this.y -= lineHeight;
      this.page.drawText(line, { x: MARGIN + indent, y: this.y + size * 0.3, size, font, color });
    }
  }

  heading(title: string) {
    this.space(40);
    this.text(title.toUpperCase(), { size: 9, font: this.bold, color: GREY, spacing: 14 });
    this.y -= 2;
  }

  timeRow(time: string, item: string) {
    const size = 12;
    const lineHeight = size * 1.35;
    const lines = this.wrap(item, this.regular, size, CONTENT - 60);
    this.space(lines.length * lineHeight + 8);
    this.y -= 4;
    lines.forEach((line, i) => {
      this.y -= lineHeight;
      const baseline = this.y + size * 0.3;
      if (i === 0) this.page.drawText(time, { x: MARGIN, y: baseline, size, font: this.bold, color: BLACK });
      this.page.drawText(line, { x: MARGIN + 60, y: baseline, size, font: this.regular, color: BLACK });
    });
    this.y -= 4;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: WIDTH - MARGIN, y: this.y },
      thickness: 0.5,
      color: LINE,
    });
  }

  divider() {
    this.y -= 10;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: WIDTH - MARGIN, y: this.y },
      thickness: 1,
      color: LINE,
    });
  }

  footers(text: string, page: (page: number, total: number) => string) {
    const pages = this.pdf.getPages();
    pages.forEach((p, i) => {
      const footer = this.safe(`${text} · ${page(i + 1, pages.length)}`);
      p.drawText(footer, { x: MARGIN, y: MARGIN - 20, size: 8, font: this.regular, color: GREY });
    });
  }
}
