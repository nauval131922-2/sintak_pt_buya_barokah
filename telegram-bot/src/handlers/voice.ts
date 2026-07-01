import { Context } from 'grammy';

// ponytail: Voice transcription placeholder. Requires external STT service (Whisper API, Google Speech-to-Text, etc.)
// To implement: add API key to .env, install fetch/axios, send audio to STT endpoint, return text

export async function handleVoiceMessage(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    await ctx.reply('🎤 Memproses voice note...');

    const voice = ctx.message?.voice;
    if (!voice) return ctx.reply('❌ Voice note tidak ditemukan.');

    // ponytail: Placeholder for future STT integration
    // Steps to add STT:
    // 1. Get voice file: const file = await ctx.api.getFile(voice.file_id)
    // 2. Download audio: fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`)
    // 3. Send to STT API (Whisper/Google): const text = await transcribeAudio(buffer)
    // 4. Parse text as template: parseRealisasiTemplate(text)
    // 5. Validate & submit

    await ctx.reply(
      '⚠️ *Fitur Voice Input*\n\n' +
      'Fitur transcribe voice note membutuhkan integrasi Speech-to-Text API (seperti OpenAI Whisper).\n\n' +
      'Untuk saat ini, gunakan template text:\n' +
      '• */input* - Input realisasi baru\n' +
      '• */input_realisasi_by_target* - Input ke target existing',
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('[VOICE] Error:', error);
    await ctx.reply('❌ Gagal memproses voice note. Gunakan template text.');
  }
}
