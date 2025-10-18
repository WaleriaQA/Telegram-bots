import { Telegraf } from "telegraf";
import { config } from "../../config.js";
import { getWeather } from "../../weather.js";
import { getCat } from "../../cat.js";
import { showMenu, closeMenu } from "../../menu.js";

const bot = new Telegraf(config.telegramToken);
bot.start((ctx) => ctx.reply('Welcome to the cat bot. Write "Menu"'));

bot.on("message", async (ctx) => {
  const chatId = ctx.chat.id;

  if (ctx.message.text === "Menu") {
    showMenu(bot, chatId);
  } else if (ctx.message.location) {
    const weather = await getWeather(ctx);
    ctx.reply(weather);
  } else if (ctx.message.text === "Get a cat picture") {
    const cat = await getCat(ctx);
    ctx.reply(cat);
  } else {
    closeMenu(bot, chatId);
  }
});

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    await bot.handleUpdate(body);
  } catch (err) {
    console.error("Error in webhook:", err);
  }

  return {
    statusCode: 200,
    body: "OK",
  };
};

// 🚧 Only for the local testing purposes.
if (process.env.NODE_ENV !== "production") {
  bot.launch();
  console.log("✅ Bot is running locally...");
}
