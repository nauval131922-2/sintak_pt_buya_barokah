import { Bot } from 'grammy';
import * as dotenv from 'dotenv';
import { handleStart, handleRegistrationInput, userStates } from './handlers/start';
import { handleInputCommand, handleInputTemplate, inputStates } from './handlers/input';
import { handleHistory } from './handlers/history';
import { handleHelp } from './handlers/help';

// Load environment variables
dotenv.config();

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
bot.command('input', handleInputCommand);
bot.command('history', handleHistory);
bot.command('help', handleHelp);

// Text message handler (for registration and input template)
bot.on('message:text', async (ctx) => {
  const telegramId = ctx.from?.id;
  const text = ctx.message.text;

  console.log('[BOT] Text message received:', { telegramId, text: text.substring(0, 50) });

  if (!telegramId || !text) return;

  // Skip if text is a command
  if (text.startsWith('/')) {
    console.log('[BOT] Skipping command');
    return;
  }

  // Check if user is in registration flow
  const userState = userStates.get(telegramId);
  console.log('[BOT] User state:', userState);
  
  if (userState && userState.state === 'waiting_nama') {
    console.log('[BOT] Routing to handleRegistrationInput');
    return handleRegistrationInput(ctx);
  }

  // Check if user is in input flow or text contains template
  const inputState = inputStates.get(telegramId);
  const isTemplate = text.includes('Tgl:') && text.includes('Shift:');
  
  if (inputState || isTemplate) {
    return handleInputTemplate(ctx);
  }

  // Default response for unrecognized text
  await ctx.reply(
    `ℹ️ Perintah tidak dikenali.\n\n` +
    `Gunakan:\n` +
    `/start - Registrasi\n` +
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
    console.log(`🔗 SINTAK API: ${process.env.SINTAK_API_URL}`);
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
