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
✅ *Data realisasi berhasil disimpan!*

*📊 Ringkasan:*
━━━━━━━━━━━━━━━━━━
👤 *Nama*      : ${data.nama_karyawan}
${inputByLine}
📅 *Tanggal*   : ${formatDate(data.tgl)}
⏰ *Shift*     : ${data.shift}
🏭 *Bagian*    : ${data.bagian}
📦 *Order*     : ${data.no_order || '-'}
⚙️ *Pekerjaan* : ${data.pekerjaan || '-'}
${data.target ? `🎯 *Target*    : ${formatNumber(data.target)}` : ''}
✔️ *Realisasi* : ${formatNumber(data.realisasi)}${percentage ? ` (${percentage}%)` : ''}
${data.inscheet ? `📄 *Inscheet*  : ${formatNumber(data.inscheet)}` : ''}
${data.rijek ? `❌ *Rijek*     : ${formatNumber(data.rijek)}` : ''}
━━━━━━━━━━━━━━━━━━

Gunakan /history untuk melihat riwayat.
  `.trim();
}

export function formatHistoryItem(item: any, index: number): string {
  const percentage = item.target && item.realisasi 
    ? Math.round((item.realisasi / item.target) * 100)
    : null;

  const statusBadge = item.deleted_at
    ? `🗑️ *DIHAPUS* ${item.deleted_by ? `oleh ${item.deleted_by}` : ''}`
    : item.updated_by && item.updated_by !== 'telegram-bot'
      ? `✏️ *Diedit* ${item.updated_by}`
      : '';

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${statusBadge ? statusBadge + '\n' : ''}👤 ${item.nama_karyawan || '-'}
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
🤖 *SINTAK Bot - Bagian ${bagian}*

*📝 Cara Input Realisasi:*

Ketik /input lalu kirim template berikut:

\`\`\`
Nama: Budi
Tgl: 2026-06-29
Shift: 1
Order: OP.001.SOPd.I.2026
Pekerjaan: Setting Mesin
Bahan Kertas:
Jml. Plate:
Warna:
Insheet:
Rijek:
Jam Kerja:
Kendala:
Keterangan:
Target: 100
Realisasi: 95
\`\`\`

⚡ *Field Wajib:* Nama, Tgl, Shift, Order, Pekerjaan, Target, Realisasi

*⚡ Tips:*
• Order & Pekerjaan akan divalidasi otomatis dengan suggestions
• Nama tidak ditemukan? Bot kasih pilihan nama yang cocok
• Jam Kerja kosong? Otomatis terisi sesuai Shift (1=07:00-15:00, 2=15:00-23:00, 3=23:00-07:00)

*📌 Perintah Lain:*
*/start* - Menu utama
*/register* - Daftar ke bot
*/input_realisasi_by_target* - Input realisasi ke target existing
*/history* - Lihat riwayat
*/batal* - Batalkan proses yang sedang berjalan
*/help* - Bantuan ini
  `.trim();
}
