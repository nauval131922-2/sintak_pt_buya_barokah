// e2e-visual-assert.ts — matrix baku E2E visual (fungsi + visual, tanpa yang terlewat).
// Pakai di tiap E2E halaman: panggil collectVisualMetrics di browser context,
// lalu assertVisualMetrics di Node/CI. Semua cek terukur via getBoundingClientRect,
// BUKAN dari style inline (style bisa meleset dari render bila ada ancestor transform/zoom).
//
// 5 cek baku:
//  1. alignment — panel (dropdown/popover) sejajar anchor (textbox pemicu)
//  2. overlap    — panel tidak menutupi textbox/tombol lain selain anchor-nya
//  3. truncation — teks item tidak kepotong (scroll > client)
//  4. overflow   — dokumen tidak scroll-X liar
//  5. viewport   — ulangi 1-4 di desktop + mobile (390px)

export interface RectLike { left: number; top: number; width: number; height: number }
export interface VisualItemMetric {
  text: string;
  truncatedX: boolean;
  truncatedY: boolean;
}
export interface VisualMetrics {
  anchor: RectLike | null;
  panel: RectLike | null;
  panelItemCount: number;
  items: VisualItemMetric[];
  overlappedControls: string[]; // label kontrol tertutup panel (selain anchor)
  docOverX: number;
  viewportWidth: number;
}

export interface VisualAssertionResult {
  ok: boolean;
  failures: string[];
}

// Toleransi piksel untuk alignment (sub-pixel rendering).
const ALIGN_TOL = 4;

export function assertVisualMetrics(m: VisualMetrics, label: string): VisualAssertionResult {
  const failures: string[] = [];
  if (!m.anchor) failures.push(`[${label}] anchor tidak ditemukan`);
  if (!m.panel) failures.push(`[${label}] panel tidak ditemukan`);
  if (m.anchor && m.panel) {
    if (Math.abs(m.panel.left - m.anchor.left) > ALIGN_TOL) {
      failures.push(
        `[${label}] alignment: panel.left=${Math.round(m.panel.left)} vs anchor.left=${Math.round(m.anchor.left)} (selisih > ${ALIGN_TOL}px)`,
      );
    }
    if (m.panel.top < m.anchor.top + m.anchor.height - 2) {
      failures.push(
        `[${label}] overlap-anchor: panel.top=${Math.round(m.panel.top)} menutupi anchor.bottom=${Math.round(m.anchor.top + m.anchor.height)}`,
      );
    }
  }
  if (m.overlappedControls.length > 0) {
    failures.push(`[${label}] overlap: panel menutupi kontrol [${m.overlappedControls.join(', ')}]`);
  }
  const trunc = m.items.filter((i) => i.truncatedX || i.truncatedY);
  if (trunc.length > 0) {
    failures.push(
      `[${label}] truncation: ${trunc.length}/${m.items.length} item kepotong (contoh: "${trunc[0].text.slice(0, 50)}")`,
    );
  }
  if (m.docOverX > 0) failures.push(`[${label}] overflow-X dokumen: ${m.docOverX}px`);
  return { ok: failures.length === 0, failures };
}

// Kolektor — jalankan dalam browser context (page.evaluate).
// anchorSel: textbox pemicu; panelSel: dropdown/panel; controlSel: kontrol yang tidak boleh tertutup.
export const COLLECT_VISUAL_METRICS_FN = `() => {
  const q = (sel) => document.querySelector(sel);
  const anchorSel = window.__visualAnchorSel;
  const panelSel = window.__visualPanelSel;
  const anchor = q(anchorSel);
  const panel = q(panelSel);
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };
  const items = panel
    ? Array.from(panel.querySelectorAll('button')).slice(0, 12).map((b) => {
        const last = b.querySelector('span:last-child');
        const target = last ?? b;
        return {
          text: (b.textContent || '').trim().slice(0, 80),
          truncatedX: target.scrollWidth > target.clientWidth + 2,
          truncatedY: target.scrollHeight > target.clientHeight + 2,
        };
      })
    : [];
  // Kontrol yang intersect panel tapi bukan anchor maupun isi panel.
  const overlappedControls = [];
  if (panel) {
    const pr = panel.getBoundingClientRect();
    const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const pBox = { left: pr.left, top: pr.top, right: pr.right, bottom: pr.bottom };
    for (const el of document.querySelectorAll('input, button')) {
      if (el === anchor || panel.contains(el) || el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (hit(pBox, { left: r.left, top: r.top, right: r.right, bottom: r.bottom })) {
        overlappedControls.push(((el.placeholder || el.textContent) || el.tagName).trim().slice(0, 40));
        if (overlappedControls.length >= 5) break;
      }
    }
  }
  return {
    anchor: anchor ? rect(anchor) : null,
    panel: panel ? rect(panel) : null,
    panelItemCount: items.length,
    items,
    overlappedControls,
    docOverX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    viewportWidth: window.innerWidth,
  };
}`;
