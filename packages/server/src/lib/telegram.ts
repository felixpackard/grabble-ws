import { Telegraf } from "telegraf";

if (!process.env.TELEGRAM_BOT_TOKEN) {
	throw new Error("TELEGRAM_BOT_TOKEN is not set");
}
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export async function notify(text: string) {
	if (!process.env.TELEGRAM_USER_ID) {
		throw new Error("TELEGRAM_USER_ID is not set");
	}
	return bot.telegram.sendMessage(process.env.TELEGRAM_USER_ID, text);
}
