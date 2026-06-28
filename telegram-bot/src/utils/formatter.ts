export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num) : num;
  return n.toLocaleString('id-ID');
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  };
  return date.toLocaleDateString('id-ID', options);
}

export function formatRealisasiSummary(data: any): string {
  const percentage = data.target && data.realisasi 
    ? Math.round((parseInt(data.realisasi) / parseInt(data.target)) * 100)
    : null;
  const inputByLine = data.input_by && data.input_by !== data.nama_karyawan
    ? `📝 Diinput oleh: ${data.input_by}`
    : '';

  return `
✅ Data realisasi berhasil disimpan!

📊 Ringkasan:
━━━━━━━━━━━━━━━━━━
👤 Nama      : ${data.nama_karyawan}
${inputByLine}
📅 Tanggal   : ${formatDate(data.tgl)}
⏰ Shift     : ${data.shift}
🏭 Bagian    : ${data.bagian}
📦 Order     : ${data.no_order || '-'}
⚙️ Pekerjaan : ${data.pekerjaan || '-'}
${data.target ? `🎯 Target    : ${formatNumber(data.target)}` : ''}
✔️ Realisasi : ${formatNumber(data.realisasi)}${percentage ? ` (${percentage}%)` : ''}
${data.inscheet ? `📄 Inscheet  : ${formatNumber(data.inscheet)}` : ''}
${data.rijek ? `❌ Rijek     : ${formatNumber(data.rijek)}` : ''}
━━━━━━━━━━━━━━━━━━

Gunakan /history untuk melihat riwayat.
  `.trim();
}

export function formatHistoryItem(item: any, index: number): string {
  const percentage = item.target && item.realisasi 
    ? Math.round((item.realisasi / item.target) * 100)
    : null;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${item.nama_karyawan || '-'}
📅 ${formatDate(item.tgl)} | Shift ${item.shift}
🏭 ${item.bagian}
📦 ${item.no_order || '-'} - ${item.pekerjaan || '-'}
✔️ ${formatNumber(item.realisasi)}${item.target ? ` / 🎯 ${formatNumber(item.target)}` : ''}${percentage ? ` (${percentage}%)` : ''}
  `.trim();
}

export function formatHistoryList(data: any[], title = 'Riwayat Realisasi'): string {
  if (data.length === 0) {
    return `📊 Belum ada riwayat realisasi dalam 7 hari terakhir.`;
  }

  const header = `📊 ${title} (7 hari terakhir):\n`;
  const items = data.map((item, i) => formatHistoryItem(item, i)).join('\n');
  
  return header + items + '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━';
}

export function getHelpText(bagian: string): string {
  return `
🤖 SINTAK Bot - Bagian ${bagian}

📝 Cara Input Realisasi:

Ketik /input lalu kirim template berikut:

\`\`\`
Nama: Nauval Gunawan
Absensi: 190
Tgl: 2026-06-26
Shift: 1
Order: SO-12345
Pekerjaan: Setting Mesin
Target: 100
Realisasi: 95
Kendala: -
\`\`\`

📋 Field Wajib:
• Tgl (format YYYY-MM-DD)
• Shift (1/2/3)
• Realisasi (angka)

📋 Field Optional:
• Nama
• Absensi (opsional, kalau Nama tidak diketahui)
• Order, Pekerjaan, Target
• Bahan, Warna, Inscheet, Rijek, Plate
• Jam, Kendala, Keterangan

⚡ Tips:
• Tanggal bisa hingga 7 hari ke belakang
• Order akan divalidasi otomatis
• Pakai \`/cari <nama>\` jika tidak ingat nama lengkap
• Cukup isi \`Nama:\` saja, absensi akan otomatis terisi dari database

📌 Perintah Lain:
/start - Menu utama
/register - Daftar ke bot
/cari - Cari karyawan
/history - Lihat riwayat
/help - Bantuan ini

Butuh bantuan? Hubungi admin SINTAK.
  `.trim();
}
