import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Fonnte webhook is active' });
}

export async function POST(request: NextRequest) {
  try {
    let sender = '';
    let message = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      sender = body.sender || '';
      message = body.message || '';
    } else {
      const formData = await request.formData();
      sender = (formData.get('sender') as string) || '';
      message = (formData.get('message') as string) || '';
    }

    if (!sender || !message) {
      return NextResponse.json({ text: 'Error: Data tidak lengkap.' }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    let replyText = '';

    if (trimmedMsg.startsWith('/task ')) {
      const taskText = trimmedMsg.substring(6).trim();
      if (!taskText) {
        replyText = '❌ Tugas tidak boleh kosong. Gunakan format: /task <nama tugas>';
      } else {
        await db.execute({
          sql: 'INSERT INTO personal_tasks (task, sender, source, status) VALUES (?, ?, ?, ?)',
          args: [taskText, sender, 'whatsapp', 'pending'],
        });
        replyText = `✅ Tugas berhasil ditambahkan!\n📌 "${taskText}"`;
      }
    } else if (trimmedMsg === '/tasks') {
      const result = await db.execute({
        sql: "SELECT id, task FROM personal_tasks WHERE status = 'pending' ORDER BY id ASC",
        args: [],
      });

      if (result.rows.length === 0) {
        replyText = '📋 Tidak ada tugas pending saat ini.';
      } else {
        replyText = '📋 *Daftar Tugas Pending:*\n\n';
        result.rows.forEach((row: any, idx: number) => {
          replyText += `${idx + 1}. [ID: ${row.id}] ${row.task}\n`;
        });
        replyText += '\nGunakan `/done <id>` untuk menyelesaikan tugas.';
      }
    } else if (trimmedMsg.startsWith('/done ')) {
      const idStr = trimmedMsg.substring(6).trim();
      const id = parseInt(idStr, 10);

      if (isNaN(id)) {
        replyText = '❌ ID tidak valid. Gunakan format: /done <id>';
      } else {
        const updateResult = await db.execute({
          sql: "UPDATE personal_tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'",
          args: [id],
        });

        if (updateResult.rowsAffected && updateResult.rowsAffected > 0) {
          replyText = `✅ Tugas [ID: ${id}] berhasil diselesaikan.`;
        } else {
          replyText = `❌ Tugas [ID: ${id}] tidak ditemukan atau sudah selesai.`;
        }
      }
    } else if (trimmedMsg === '/help' || trimmedMsg === '/task' || trimmedMsg === '/done') {
      replyText = '🤖 *SINTAK Task Bot*\n\n' +
                  'Gunakan perintah berikut:\n' +
                  '• `/task <tugas>` : Tambah tugas baru\n' +
                  '• `/tasks` : Lihat semua tugas pending\n' +
                  '• `/done <id>` : Selesaikan tugas tertentu';
    }

    if (replyText) {
      return NextResponse.json({ text: replyText });
    }

    // Jika tidak ada command yang cocok, return JSON kosong agar Fonnte tidak mengirim spam
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[FONNTE WEBHOOK ERROR]', error);
    return NextResponse.json({ text: `❌ Terjadi kesalahan internal: ${error.message}` }, { status: 500 });
  }
}
