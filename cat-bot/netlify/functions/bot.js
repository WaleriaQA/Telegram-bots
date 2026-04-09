// netlify/functions/bot.js
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

// ⚠️ Ключевая часть — функция handler для Netlify
export const handler = async (event) => {
  try {
    // Защита от пустого body
    if (!event.body) {
      console.warn("Empty body received");
      return {
        statusCode: 200,
        body: "No body",
      };
    }
    const body = JSON.parse(event.body);

    // Telegram всегда шлёт объект update
    await bot.handleUpdate(body);

    return {
      statusCode: 200,
      body: "OK",
    };
  } catch (err) {
    console.error("Webhook error:", err.message);
    return {
      statusCode: 200, // даже при ошибке Telegram должен получить 200, иначе 502
      body: "Error",
    };
  }
};
