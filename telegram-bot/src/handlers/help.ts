import { Context } from 'grammy';
import { getHelpText } from '../utils/formatter';

const BAGIAN = process.env.BAGIAN || 'SETTING';

export async function handleHelp(ctx: Context) {
  const helpText = getHelpText(BAGIAN);
  await ctx.reply(helpText, { parse_mode: 'Markdown' });
}
