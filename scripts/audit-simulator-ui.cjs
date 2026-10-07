const fs = require('fs');
const path = require('path');
const dir = 'src/app/pricelist';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Simulator.tsx')).sort();
const ICONS = ['Sliders','TrendingUp','DollarSign','FileText','Bookmark','BookmarkCheck','Sparkles','Check','Calculator','RotateCcw','Copy','Settings2','ShoppingBag','Info','CheckCircle2','HelpCircle','X','Printer','Layers','Scissors','Wrench','Package','BookOpen','Calendar','Percent','Cpu','Pill','Share2','Save','Folder'];
console.log('file | viewport | stepChip | sticky | grid4 | grid3 | optBtn | emeraldBtn | missingIcons');
for (const file of files) {
  const c = fs.readFileSync(path.join(dir, file), 'utf-8');
  const m = c.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
  const imp = new Set();
  if (m) m[1].split(',').forEach(s => { const p = s.trim().split(/\s+as\s+/); const n = (p[1] || p[0]).trim(); if (n) imp.add(n); });
  const tags = c.match(/<([A-Z][a-zA-Z0-9]+)/g) || [];
  const missing = [...new Set(tags.map(t => t.slice(1)).filter(n => ICONS.includes(n) && !imp.has(n)))];
  const row = [
    file.replace('Simulator.tsx',''),
    /h-\[calc\(100vh-140px\)\]/.test(c) ? 'Y' : '-',
    /stepChip/.test(c) ? 'Y' : '-',
    /sticky top-0/.test(c) ? 'Y' : '-',
    /sm:grid-cols-4|lg:grid-cols-4/.test(c) ? '4!' : '-',
    /sm:grid-cols-3/.test(c) ? '3' : '-',
    /const optBtn/.test(c) ? 'Y' : '-',
    /bg-emerald-800 text-white/.test(c) ? 'E!' : '-',
    missing.length ? missing.join(',') : '-',
  ];
  console.log(row.join(' | '));
}
