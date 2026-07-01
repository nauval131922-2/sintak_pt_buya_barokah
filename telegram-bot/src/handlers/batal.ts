import { Context } from 'grammy';
import { userStates } from './register';
import { inputStates } from './input';
import { targetStates } from './input-target';
import { historyStates } from './history';

export async function handleBatal(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Clear all states
  userStates.delete(telegramId);
  inputStates.delete(telegramId);
  targetStates.delete(telegramId);
  historyStates.delete(telegramId);

  await ctx.reply(
    '❌ Proses dibatalkan.\n\n' +
    'Gunakan /input atau /input_realisasi_by_target untuk mulai lagi.'
  );
}
