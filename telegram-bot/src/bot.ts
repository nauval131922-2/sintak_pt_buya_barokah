import { Bot, Context } from 'grammy';
import * as dotenv from 'dotenv';
import { handleStart } from './handlers/start';
import { handleRegister, handleRegistrationInput, userStates } from './handlers/register';
import { handleInputCommand, handleInputTemplate, inputStates } from './handlers/input';
import { handleHistory } from './handlers/history';
import { handleHelp } from './handlers/help';
import { handleSearch } from './handlers/search';

dotenv.config({ path: `${process.cwd()}/.env` });

// Set timezone
process.env.TZ = 'Asia/Jakarta';

const BOT_TOKEN = process.env.BOT_TOKEN;
const BAGIAN = process.env.BAGIAN || 'SETTING';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN tidak ditemukan di .env');
  process.exit(1);
}

console.log(`🤖 Starting SINTAK Bot - Bagian ${BAGIAN}...`);

const bot = new Bot(BOT_TOKEN);

// Command handlers
bot.command('start', handleStart);
bot.command('register', handleRegister);
bot.command('input', handleInputCommand);
bot.command('cari', handleSearch);
bot.command('history', handleHistory);
bot.command('help', handleHelp);

// Text message handler
bot.on('message:text', async (ctx) => {
  const telegramId = ctx.from?.id;
  const text = ctx.message.text;

  if (!telegramId || !text) return;

  // Skip commands
  if (text.startsWith('/')) return;

  // Registration flow
  const userState = userStates.get(telegramId);
  if (userState && userState.state === 'waiting_nama') {
    return handleRegistrationInput(ctx);
  }

  // Input flow
  const inputState = inputStates.get(telegramId);
  const isTemplate = text.includes('Tgl:') && text.includes('Shift:');

  if (inputState || isTemplate) {
    return handleInputTemplate(ctx);
  }

  // Default
  await ctx.reply(
    `ℹ️ Perintah tidak dikenali.\n\n` +
    `Gunakan:\n` +
    `/start - Menu utama\n` +
    `/register - Daftar ke bot\n` +
    `/cari - Cari karyawan\n` +
    `/input - Input realisasi\n` +
    `/history - Lihat riwayat\n` +
    `/help - Bantuan`
  );
});

// Error handler
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[BOT] Error while handling update ${ctx.update.update_id}:`);
  console.error(err.error);
});

// Start bot
bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot started: @${botInfo.username}`);
    console.log(`📍 Bagian: ${BAGIAN}`);
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
