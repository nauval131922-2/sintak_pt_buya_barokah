import { Bot, Context } from 'grammy';
import * as dotenv from 'dotenv';
import { handleStart } from './handlers/start';
import { handleRegister, handleRegistrationInput, handleRegisterCallback, userStates } from './handlers/register';
import { handleInputCommand, handleInputTemplate, handleInputCorrectionCallback, inputStates } from './handlers/input';
import { handleInputTargetCommand, handleInputTargetCallback, handleInputTargetText, targetStates } from './handlers/input-target';
import { handleHistory, handleHistoryCallback, handleHistoryText, historyStates } from './handlers/history';
import { handleHelp } from './handlers/help';
import { handleBatal } from './handlers/batal';
import { handleVoiceMessage } from './handlers/voice';
import { checkSessionTimeout, updateActivity, startSessionCleanup } from './utils/session-timeout';

dotenv.config({ path: `${process.cwd()}/.env` });

// Set timezone
process.env.TZ = 'Asia/Jakarta';

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN tidak ditemukan di .env');
  process.exit(1);
}

console.log(`🤖 Starting SINTAK Bot (Multi-Bagian)...`);

const bot = new Bot(BOT_TOKEN);

// Register command suggestions for Telegram auto-complete
bot.api.setMyCommands([
  { command: 'start', description: 'Menu utama' },
  { command: 'register', description: 'Daftar ke bot' },
  { command: 'input', description: 'Input realisasi (standalone)' },
  { command: 'input_realisasi_by_target', description: 'Input realisasi ke target existing' },
  { command: 'history', description: 'Lihat riwayat' },
  { command: 'batal', description: 'Batalkan proses yang sedang berjalan' },
  { command: 'help', description: 'Bantuan' },
]).catch(() => {}); // non-blocking

function clearConflicting(telegramId: number | undefined) {
  if (!telegramId) return;
  userStates.delete(telegramId);
  inputStates.delete(telegramId);
  targetStates.delete(telegramId);
  historyStates.delete(telegramId);
}

// Command handlers — clear conflicting states sebelum masuk flow baru
bot.command('start', async (ctx) => { 
  const telegramId = ctx.from?.id;
  if (telegramId) updateActivity(telegramId);
  clearConflicting(telegramId); 
  return handleStart(ctx); 
});
bot.command('register', async (ctx) => { 
  const telegramId = ctx.from?.id;
  if (telegramId) updateActivity(telegramId);
  clearConflicting(telegramId); 
  return handleRegister(ctx); 
});
bot.command('input', async (ctx) => { 
  const telegramId = ctx.from?.id;
  if (telegramId) updateActivity(telegramId);
  clearConflicting(telegramId); 
  return handleInputCommand(ctx); 
});
bot.command('input_realisasi_by_target', async (ctx) => { 
  const telegramId = ctx.from?.id;
  if (telegramId) updateActivity(telegramId);
  clearConflicting(telegramId); 
  return handleInputTargetCommand(ctx); 
});
bot.command('history', async (ctx) => { 
  const telegramId = ctx.from?.id;
  if (telegramId) updateActivity(telegramId);
  clearConflicting(telegramId); 
  return handleHistory(ctx); 
});
bot.command('batal', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (telegramId) updateActivity(telegramId);
  return handleBatal(ctx);
});
bot.command('help', async (ctx) => { 
  const telegramId = ctx.from?.id;
  if (telegramId) updateActivity(telegramId);
  clearConflicting(telegramId); 
  return handleHelp(ctx); 
});

// Callback queries
bot.on('callback_query:data', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    const expired = await checkSessionTimeout(bot, telegramId, () => clearConflicting(telegramId));
    if (expired) return; // Stop if session expired
    updateActivity(telegramId);
  }
  
  const data = ctx.callbackQuery?.data || '';
  if (data.startsWith('register_select:') || data.startsWith('register_bagian:')) return handleRegisterCallback(ctx);
  if (data.startsWith('input_')) return handleInputCorrectionCallback(ctx);
  if (data.startsWith('it_')) return handleInputTargetCallback(ctx);
  if (data.startsWith('hist_')) return handleHistoryCallback(ctx);
});

// Voice message handler
bot.on('message:voice', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const expired = await checkSessionTimeout(bot, telegramId, () => clearConflicting(telegramId));
  if (expired) return;
  updateActivity(telegramId);

  return handleVoiceMessage(ctx);
});

// Text message handler
bot.on('message:text', async (ctx) => {
  const telegramId = ctx.from?.id;
  const text = ctx.message.text;

  if (!telegramId || !text) return;

  // Skip commands
  if (text.startsWith('/')) return;
  
  // Check session timeout
  const expired = await checkSessionTimeout(bot, telegramId, () => clearConflicting(telegramId));
  if (expired) return;
  updateActivity(telegramId);

  // Registration flow
  const userState = userStates.get(telegramId);
  if (userState && userState.state === 'waiting_nama') {
    return handleRegistrationInput(ctx);
  }

  // History edit flow
  if (historyStates.has(telegramId) && historyStates.get(telegramId)?.editing) {
    return handleHistoryText(ctx);
  }

  // Input-target flow (check BEFORE template detection — target updates existing row)
  if (targetStates.has(telegramId)) {
    return handleInputTargetText(ctx);
  }

  // Template detection — standalone input (INSERT baru)
  if (text.includes('Tgl:') && text.includes('Shift:')) {
    userStates.delete(telegramId);
    return handleInputTemplate(ctx);
  }

  // Input flow
  const inputState = inputStates.get(telegramId);
  if (inputState) {
    return handleInputTemplate(ctx);
  }

  // Default
  await ctx.reply(
    `ℹ️ *Perintah tidak dikenali.*\n\n` +
    `Gunakan:\n` +
    `*/start* - Menu utama\n` +
    `*/register* - Daftar ke bot\n` +
    `*/input* - Input realisasi\n` +
    `*/input_realisasi_by_target* - Input realisasi ke target existing\n` +
    `*/history* - Lihat riwayat\n` +
    `*/help* - Bantuan`,
    { parse_mode: 'Markdown' }
  );
});

// Error handler
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[BOT] Error while handling update ${ctx.update.update_id}:`);
  console.error(err.error);
});

// ponytail: health-check SINTAK webhook URL pas boot — fail loud, not silent 404
async function checkSintakWebhook() {
  const base = process.env.WEBHOOK_URL || 'http://localhost:3000';
  const url = `${base}/api/telegram/register-webhook`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama_karyawan: '__health_check__', bagian: 'HEALTH' })
    });
    if (res.status === 404) {
      console.error(`\n❌ [WEBHOOK HEALTH] ${url} -> 404 NOT FOUND`);
      console.error(`   Push notification TIDAK AKAN JALAN. Kemungkinan:`);
      console.error(`   1. SINTAK server mati / port salah (cek WEBHOOK_URL di .env bot)`);
      console.error(`   2. SINTAK jalan di port beda dari WEBHOOK_URL`);
      console.error(`   Fix: set WEBHOOK_URL ke URL SINTAK yang benar, lalu restart bot.\n`);
    } else if (res.status >= 500) {
      console.error(`\n⚠️  [WEBHOOK HEALTH] ${url} -> ${res.status} (server error, push mungkin gagal)\n`);
    } else {
      console.log(`✅ [WEBHOOK HEALTH] ${url} -> ${res.status} OK`);
    }
  } catch (err: any) {
    console.error(`\n❌ [WEBHOOK HEALTH] ${url} -> ERROR: ${err.message}`);
    console.error(`   SINTAK server tidak reachable. Push notification TIDAK AKAN JALAN.`);
    console.error(`   Fix: pastikan SINTAK jalan & WEBHOOK_URL benar, lalu restart bot.\n`);
  }
}

// Start bot
bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot started: @${botInfo.username}`);
    console.log(`📍 Multi-Bagian: SETTING, QUALITY CONTROL, CETAK, FINISHING, GUDANG, TEKNISI`);
    checkSintakWebhook();
  }
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Stopping bot...');
  bot.stop();
});
process.once('SIGTERM', () => {
  console.log('\n🛑 Stopping bot...');
  bot.stop();
});

export { userStates, inputStates };
