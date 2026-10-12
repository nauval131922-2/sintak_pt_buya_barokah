// e2e-visual-assert.ts — matrix baku E2E visual: fungsi + visual, tanpa yang terlewat.
// Dipakai di TIAP E2E halaman, bukan cuma kasus dropdown kemarin.
//
// Prinsip:
//  - Semua cek terukur via getBoundingClientRect HASIL RENDER, bukan style inline
//    (style bisa meleset bila ada ancestor transform/zoom — pelajaran bug dropdown Portal).
//  - Setiap E2E halaman WAJIB mengisi PageVisualReport (fungsi + 8 cek visual)
//    di DUA viewport (desktop + 390px). Gate lolos = semua hijau.
//
// 8 cek visual baku (umum, berlaku untuk komponen apa pun):
//  1. alignment  — panel/dropdown/modal sejajar anchor-nya (kiri + di bawah, tidak menimpa)
//  2. overlap    — tidak ada kontrol (input/button) tertutup elemen lain, kecuali anchor
//  3. truncation — tidak ada teks kepotong (scroll > client) di tabel/saran/kartu,
//                  KECUALI yang by-design ber-tooltip (wajib cantumkan di allowTruncate)
//  4. overflow   — dokumen tidak scroll-X liar (docOverX = 0)
//  5. scrollwrap — tabel lebar terbungkus container overflow-auto (scroll di dalam, bukan halaman)
//  6. toolbar    — tidak ada tombol toolbar kepotong (scrollWidth > clientWidth)
//  7. dialog     — modal terpusat di viewport, backdrop menutup seluruh layar, tombol X terlihat
//  8. responsive — ulangi 1-7 di desktop DAN mobile 390px

export interface RectLike { left: number; top: number; width: number; height: number }
export interface VisualItemMetric {
  text: string;
  truncatedX: boolean;
  truncatedY: boolean;
  hasTooltip: boolean;
}
export interface DialogMetric {
  found: boolean;
  centeredX: boolean;
  backdropCovers: boolean;
  closeVisible: boolean;
}
export interface VisualMetrics {
  // 1-2. anchor/panel (dropdown, popover, tooltip). null bila halaman ini tak menguji panel.
  anchor: RectLike | null;
  panel: RectLike | null;
  panelItemCount: number;
  items: VisualItemMetric[];
  overlappedControls: string[]; // label kontrol tertutup panel (selain anchor)
  // 3. truncation global: semua sel/item terpotong di halaman (td, kartu, saran).
  truncatedGlobal: string[];
  // 4-5. overflow + scrollwrap tabel.
  docOverX: number;
  tableScrollable: boolean | null; // null = tak ada tabel di halaman
  // 6. toolbar buttons kepotong.
  cutToolbarButtons: string[];
   // 7. dialog/modal bila terbuka.
   dialog: DialogMetric | null;
   // 9. clipping: elemen keluar viewport (kiri/kanan/atas/bawah).
   clippedControls: string[];
   // 10. covering: kontrol interaktif tertutup layer lain (z-index/backdrop) sehingga tak bisa diklik.
   coveredControls: string[];
   // 11. dead controls: tampak aktif tapi tak responsif (disabled tanpa gaya / pointer-events none).
   deadControls: string[];
   // 12. nested scroll: container scroll di dalam container scroll (scrollbar liar).
   nestedScrolls: string[];
   // 13. kontras: teks di bawah ambang baca.
   lowContrastTexts: string[];
   viewportWidth: number;
}

export interface PageVisualReport {
  label: string;
  functional: { apiOk: boolean; dbOk: boolean; note: string };
  desktop: VisualAssertionResult;
  mobile: VisualAssertionResult;
}

export interface VisualAssertionResult {
  ok: boolean;
  failures: string[];
}

// Toleransi piksel alignment (sub-pixel rendering).
const ALIGN_TOL = 4;

export function assertVisualMetrics(
  m: VisualMetrics,
  label: string,
  opts?: { allowTruncate?: string[]; expectPanel?: boolean; expectTable?: boolean },
): VisualAssertionResult {
  const failures: string[] = [];
  const allow = opts?.allowTruncate ?? [];

  // 1. alignment + 2. overlap anchor.
  if (opts?.expectPanel !== false && (m.anchor || m.panel)) {
    if (!m.anchor) failures.push(`[${label}] alignment: anchor tidak ditemukan`);
    if (!m.panel) failures.push(`[${label}] alignment: panel tidak ditemukan`);
    if (m.anchor && m.panel) {
      if (Math.abs(m.panel.left - m.anchor.left) > ALIGN_TOL) {
        failures.push(
          `[${label}] alignment: panel.left=${Math.round(m.panel.left)} vs anchor.left=${Math.round(m.anchor.left)} (toleransi ${ALIGN_TOL}px)`,
        );
      }
      if (m.panel.top < m.anchor.top + m.anchor.height - 2) {
        failures.push(
          `[${label}] overlap-anchor: panel.top=${Math.round(m.panel.top)} menimpa anchor.bottom=${Math.round(m.anchor.top + m.anchor.height)}`,
        );
      }
    }
  }
  // 2. overlap kontrol lain.
  if (m.overlappedControls.length > 0) {
    failures.push(`[${label}] overlap: tertutup [${m.overlappedControls.join(', ')}]`);
  }
  // 3. truncation item panel + global (kecuali allowlist + yang ber-tooltip).
  const truncItem = m.items.filter((i) => (i.truncatedX || i.truncatedY) && !i.hasTooltip);
  if (truncItem.length > 0) {
    failures.push(
      `[${label}] truncation-panel: ${truncItem.length}/${m.items.length} kepotong tanpa tooltip ("${truncItem[0].text.slice(0, 50)}")`,
    );
  }
  const truncGlobal = m.truncatedGlobal.filter((t) => !allow.some((a) => t.includes(a)));
  if (truncGlobal.length > 0) {
    failures.push(`[${label}] truncation-global: ${truncGlobal.length} sel kepotong ("${truncGlobal[0].slice(0, 50)}")`);
  }
  // 4. overflow dokumen.
  if (m.docOverX > 0) failures.push(`[${label}] overflow-X: ${m.docOverX}px keluar viewport ${m.viewportWidth}px`);
  // 5. scrollwrap tabel.
  if (opts?.expectTable !== false && m.tableScrollable === false && m.viewportWidth < 768) {
    failures.push(`[${label}] scrollwrap: tabel tidak bisa scroll horizontal di mobile`);
  }
  // 6. toolbar.
  if (m.cutToolbarButtons.length > 0) {
    failures.push(`[${label}] toolbar: tombol kepotong [${m.cutToolbarButtons.join(', ')}]`);
  }
   // 7. dialog (hanya bila ada yang terbuka).
   if (m.dialog?.found) {
     if (!m.dialog.centeredX) failures.push(`[${label}] dialog: tidak terpusat horizontal`);
     if (!m.dialog.backdropCovers) failures.push(`[${label}] dialog: backdrop tidak menutup layar`);
     if (!m.dialog.closeVisible) failures.push(`[${label}] dialog: tombol tutup tidak terlihat`);
   }
   // 9. clipping: elemen keluar viewport.
   if (m.clippedControls.length > 0) {
     failures.push(`[${label}] clipping: keluar viewport [${m.clippedControls.join(', ')}]`);
   }
   // 10. covering: kontrol tertutup layer lain (elementFromPoint bukan dirinya).
   if (m.coveredControls.length > 0) {
     failures.push(`[${label}] covering: tak bisa diklik, tertutup layer [${m.coveredControls.join(', ')}]`);
   }
   // 11. dead controls.
   if (m.deadControls.length > 0) {
     failures.push(`[${label}] dead-control: tampak aktif tapi mati [${m.deadControls.join(', ')}]`);
   }
   // 12. nested scroll liar.
   if (m.nestedScrolls.length > 0) {
     failures.push(`[${label}] nested-scroll: scrollbar di dalam scrollbar [${m.nestedScrolls.join(', ')}]`);
   }
   // 13. kontras.
   if (m.lowContrastTexts.length > 0) {
     failures.push(`[${label}] contrast: teks sulit dibaca [${m.lowContrastTexts.join(', ')}]`);
   }
  return { ok: failures.length === 0, failures };
}

// Kolektor umum — jalankan dalam browser context (page.evaluate).
// Set window.__visualAnchorSel / window.__visualPanelSel / window.__visualAllowTruncate
// sebelum memanggil; kosongkan bila halaman tak menguji panel.
export const COLLECT_VISUAL_METRICS_FN = `() => {
  const anchor = window.__visualAnchorSel ? document.querySelector(window.__visualAnchorSel) : null;
  const panel = window.__visualPanelSel ? document.querySelector(window.__visualPanelSel) : null;
  const rect = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
  const items = panel ? Array.from(panel.querySelectorAll('button')).slice(0, 12).map((b) => {
    const t = b.querySelector('span:last-child') ?? b;
    return { text: (b.textContent || '').trim().slice(0, 80),
      truncatedX: t.scrollWidth > t.clientWidth + 2, truncatedY: t.scrollHeight > t.clientHeight + 2,
      hasTooltip: !!(b.title || b.querySelector('[title]')) };
  }) : [];
  const overlappedControls = [];
  if (panel) {
    const pr = panel.getBoundingClientRect();
    const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const pb = { left: pr.left, top: pr.top, right: pr.right, bottom: pr.bottom };
    for (const el of document.querySelectorAll('input, button')) {
      if (el === anchor || panel.contains(el) || el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (hit(pb, { left: r.left, top: r.top, right: r.right, bottom: r.bottom })) {
        overlappedControls.push(((el.placeholder || el.textContent) || '').trim().slice(0, 40));
        if (overlappedControls.length >= 5) break;
      }
    }
  }
  const truncatedGlobal = Array.from(document.querySelectorAll('table td, [data-card]'))
    .filter((el) => el.scrollWidth > el.clientWidth + 2 && !(el.title || el.querySelector('[title]')))
    .slice(0, 8).map((el) => (el.textContent || '').trim().slice(0, 60));
  const tbl = document.querySelector('table');
  const wrap = tbl ? tbl.closest('div.overflow-auto, div.overflow-x-auto') : null;
  const cutToolbarButtons = Array.from(document.querySelectorAll('header button, [role="toolbar"] button'))
    .filter((b) => b.offsetParent !== null && b.scrollWidth > b.clientWidth + 4)
    .slice(0, 5).map((b) => (b.textContent || '').trim().slice(0, 40));
  const dlgEl = document.querySelector('div.fixed.inset-0.z-\\[9999\\], [role="dialog"]');
  let dialog = null;
  if (dlgEl && dlgEl.offsetParent !== null) {
    const dr = dlgEl.getBoundingClientRect();
    const card = dlgEl.querySelector('div[class*="max-w"], div[class*="rounded"]');
    const cr = card ? card.getBoundingClientRect() : dr;
    dialog = { found: true,
      centeredX: Math.abs((cr.left + cr.width / 2) - window.innerWidth / 2) < 60,
      backdropCovers: dr.width >= window.innerWidth - 2 && dr.height >= window.innerHeight - 2,
      closeVisible: !!Array.from(dlgEl.querySelectorAll('button')).find((b) => b.offsetParent !== null) };
  }
   const vw = window.innerWidth, vh = window.innerHeight;
   const clippedControls = Array.from(document.querySelectorAll('input, button, table'))
     .filter((el) => el.offsetParent !== null).filter((el) => {
       const r = el.getBoundingClientRect();
       return r.right < -4 || r.left > vw + 4 || r.bottom < -4 || r.top > vh + 4;
     }).slice(0, 5).map((el) => ((el.placeholder || el.textContent) || el.tagName).trim().slice(0, 40));
   const coveredControls = Array.from(document.querySelectorAll('input, button'))
     .filter((el) => el.offsetParent !== null && !el.disabled).filter((el) => {
       const r = el.getBoundingClientRect();
       if (r.width === 0 || r.height === 0) return false;
       const cx = Math.min(Math.max(r.left + r.width / 2, 1), vw - 1);
       const cy = Math.min(Math.max(r.top + r.height / 2, 1), vh - 1);
       const top = document.elementFromPoint(cx, cy);
       return top && top !== el && !el.contains(top) && !top.contains(el);
     }).slice(0, 5).map((el) => ((el.placeholder || el.textContent) || '').trim().slice(0, 40));
   const deadControls = Array.from(document.querySelectorAll('button, input, a'))
     .filter((el) => {
       const cs = getComputedStyle(el);
       return el.offsetParent !== null && cs.pointerEvents === 'none' && cs.opacity !== '0' && !el.disabled;
     }).slice(0, 5).map((el) => ((el.placeholder || el.textContent) || '').trim().slice(0, 40));
   const scrollers = Array.from(document.querySelectorAll('div, section, main'))
     .filter((el) => { const cs = getComputedStyle(el); return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 4; });
   const nestedScrolls = scrollers.filter((el) => scrollers.some((p) => p !== el && p.contains(el)))
     .slice(0, 4).map((el) => (el.className || el.tagName).toString().slice(0, 50));
   const lum = (c) => { const m = c.match(/\\d+(\\.\\d+)?/g); if (!m) return -1;
     const v = [m[0] / 255, m[1] / 255, m[2] / 255].map((x) => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
     return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
   const lowContrastTexts = Array.from(document.querySelectorAll('td, th, p, span'))
     .filter((el) => el.offsetParent !== null && (el.textContent || '').trim().length > 3).filter((el) => {
       const cs = getComputedStyle(el);
       const fg = lum(cs.color), bg = lum(cs.backgroundColor);
       if (fg < 0 || bg < 0) return false;
       const [l1, l2] = fg > bg ? [fg, bg] : [bg, fg];
       return (l1 + 0.05) / (l2 + 0.05) < 2.5;
     }).slice(0, 5).map((el) => (el.textContent || '').trim().slice(0, 40));
   return { anchor: anchor ? rect(anchor) : null, panel: panel ? rect(panel) : null,
     panelItemCount: items.length, items, overlappedControls, truncatedGlobal,
     docOverX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
     tableScrollable: tbl ? (wrap ? wrap.scrollWidth > wrap.clientWidth + 2 || window.innerWidth >= 768 : window.innerWidth >= 768) : null,
     cutToolbarButtons, dialog, clippedControls, coveredControls, deadControls, nestedScrolls, lowContrastTexts, viewportWidth: vw };
}`;
