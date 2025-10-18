# 🐱 Cat Weather Telegram Bot - An educational Telegram bot project — made with love for JavaScript and cats ❤️

A simple **Telegram bot** built with **Node.js** and **JavaScript** that shows the current weather based on your location 🌤️ and sends you random cat pictures 🐾  

This project is made for educational purposes — to demonstrate how to use **Telegraf**, **Axios**, and **Netlify Functions** to deploy a Telegram bot without running your own server.

---

## 🚀 Features

After you start the bot with `/start`, you’ll see a simple menu with **three buttons**:

1️⃣ **Get weather by location**  
   → The bot sends the current temperature and weather conditions based on your location.  
   ⚠️ *Make sure that location services (GPS) are enabled on your phone.*

2️⃣ **Get a cat picture**  
   → The bot sends a random cat image using [TheCatAPI](https://thecatapi.com/).  

3️⃣ **Close menu**  
   → The bot hides the menu and stops interacting.

---

## 🛠️ Technologies

- [Node.js](https://nodejs.org/)  
- [Telegraf](https://telegraf.js.org/) — Telegram Bot Framework  
- [Axios](https://axios-http.com/) — HTTP client for API requests  
- [OpenWeather API](https://openweathermap.org/) — for weather data  
- [TheCatAPI](https://thecatapi.com/) — for cat images 🐈  
- [Netlify Functions](https://docs.netlify.com/functions/overview/) — for serverless deployment  

---

## 📁 Project Structure

cat-bot/

├─ netlify/

│ └─ functions/

│ └─ bot.js # Main bot logic (webhook)

├─ config.js # API keys and configuration

├─ weather.js # Handles weather requests

├─ cat.js # Handles cat picture requests

├─ menu.js # Displays and closes the menu

├─ netlify.toml # Netlify deployment settings

├─ package.json

├─ .gitignore


---

## 🔐 API Keys

> ⚠️ In this example, the Telegram token and API keys are stored directly in `config.js` for simplicity and demonstration purposes.  
> However, for **real-world projects**, it’s strongly recommended to store all sensitive data in a `.env` file.  
> This improves security and keeps your keys hidden from public repositories.

---

## 💻 Run Locally

1. Install dependencies:
   ```bash
   npm install
2. Start the bot locally (polling mode):
   node netlify/functions/bot.js (bash)
3. Open Telegram and send /start to your bot.
✅ You should see:
Bot is running locally...


☁️ Deploy to Netlify

Create an account on Netlify
.

Push your project to GitHub.

Connect the repository to Netlify and deploy it.

Once deployed, set the Telegram webhook:
https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<YOUR_SITE>.netlify.app/.netlify/functions/bot
✅ Your bot will now run 24/7 using Netlify Functions!

