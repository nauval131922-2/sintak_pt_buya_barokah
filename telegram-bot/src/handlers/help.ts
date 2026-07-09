import { Context } from 'grammy';
import { getHelpText } from '../utils/formatter';
import { api } from '../utils/api';

export async function handleHelp(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const status = await api.checkStatus(String(telegramId));
    const bagian = status.registered && status.is_active === 1 ? status.bagian : 'SINTAK';
    const helpText = getHelpText(bagian);
    await ctx.reply(helpText, { parse_mode: 'Markdown' });
  } catch (error: any) {
    console.error('[HELP] Error:', error);
    await ctx.reply(getHelpText('SINTAK'), { parse_mode: 'Markdown' });
  }
}
