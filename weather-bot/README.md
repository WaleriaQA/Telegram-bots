**Weather Telegram Bot — Deploy to Netlify (step-by-step)**

This README explains, using Git Bash commands and sample outputs, how to prepare the project, deploy a Telegram webhook bot to Netlify, set environment variables, test it, and debug common problems you may encounter (including 'Wrong response from the webhook: 502 Bad Gateway'). Use placeholders like <BOT_TOKEN>, <WEATHER_API_KEY>, <SITE_NAME>, <GITHUB_URL> and replace them with your real values.

**Quick summary**

Local dev: use a .env + dotenv.

Production on Netlify: put secrets into Site settings → Environment variables (or use netlify env:set).

Bot architecture: webhook model — Telegram does POST to your Netlify Function URL; no persistent process required.

Files of interest:

* netlify/functions/bot.js (Netlify Function handler)

* netlify.toml

* .env (local only)

* .gitignore

**1. Prerequisites (Git Bash)**

Install Node.js & npm and Netlify CLI:

node -v
npm -v
npm install -g netlify-cli
netlify --version


Expected (example):

v22.13.0
9.8.1
netlify-cli/23.8.1 win32-x64 node-v22.13.0


Make sure package.json contains the dependencies you need, e.g.:

{
  "dependencies": {
    "telegraf": "^4.x",
    "axios": "^1.x"
  }
}


Install them locally before committing:

npm install

**2. Project layout (recommended)**

project-root/
  netlify.toml
  package.json
  netlify/functions/bot.js
  .gitignore
  .env            # local only (ignored by git)


netlify.toml (minimal):

[build]
  functions = "netlify/functions"


.gitignore:

node_modules/
.env
.netlify

**3. Netlify: login, init and connect project**

From your project folder:

cd /path/to/project
netlify login
netlify init


During netlify init choose:

Create & configure a new site (or link to existing),

Select your team,

Enter the project name (or accept random).

Sample netlify init outcome:

✔ Linked to <your-site-id>
⚙ Created site: <SITE_NAME>

**4. Add environment variables (two options)**

Option A — CLI (quick):

netlify env:set BOT_TOKEN "<BOT_TOKEN>"
netlify env:set WEATHER_API_KEY "<WEATHER_API_KEY>"

# verify
netlify env:list


Expected:

BOT_TOKEN
WEATHER_API_KEY


Option B — Dashboard:

* Open Netlify → Sites → your site → Site settings → Environment → Environment variables.

* Add BOT_TOKEN and WEATHER_API_KEY (no quotes).

* Save. Then re-deploy (Netlify reads env vars at build time).

**5. Netlify Function: correct handler (example)**

Put this into netlify/functions/bot.js (minimal, safe handler — GET shows random cat + rocket, POST processes Telegram update):

```js
// netlify/functions/bot.js
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

const weatherEmoji = { /* ...your map...*/ };

// Bot logic
bot.start((ctx) => ctx.reply("Hello, send me your location 🌍"));

bot.on("message", async (ctx) => {
  if (ctx.message.location) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${ctx.message.location.latitude}&lon=${ctx.message.location.longitude}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
    const response = await axios.get(url);
    const temp = `${response.data.name} : ${Math.round(response.data.main.temp)}°C`;
    const icon = response.data.weather[0].icon;
    const emoji = weatherEmoji[icon] || "";
    const description = response.data.weather[0].description;
    await ctx.reply(temp);
    await ctx.reply(`${emoji} ${description}`);
  }
});

// Netlify function handler
exports.handler = async (event) => {
  // POST from Telegram — process webhook update
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body);
      await bot.handleUpdate(body);
      return { statusCode: 200, body: "ok" };
    } catch (err) {
      console.error("Error handling update:", err);
      return { statusCode: 500, body: "Error handling update" };
    }
  }

  // GET — health check. show random cat + rocket
  const catEmojis = ["🐱","😺","😸","😹","😻","😼","😽","🙀","😿","😾"];
  const randomCat = catEmojis[Math.floor(Math.random() * catEmojis.length)];
  return { statusCode: 200, body: `Bot is running ${randomCat} 🚀` };
};
```

Important:

Use event.body (string) and JSON.parse it.

Only one exports.handler must exist in the file.

Remove require('dotenv').config() in production or load it conditionally as above.

**6. Deploy (draft → prod)**

Draft deploy (preview):

netlify deploy
# CLI prompts:
#  -> "Which folder would you like to deploy?" -> enter .
#  -> "Publish directory" -> enter .


Sample output (draft):

Deploy complete
Draft URL: https://<random>--<SITE_NAME>.netlify.app


Production deploy:

netlify deploy --prod


Sample output:

Deploy complete
Deployed to production URL: https://<SITE_NAME>.netlify.app

**7. Set Telegram webhook**

Replace <BOT_TOKEN> and <SITE_NAME>:

Set webhook:

curl -s "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<SITE_NAME>.netlify.app/.netlify/functions/bot"


Expected response:

{"ok":true,"result":true,"description":"Webhook was set"}


Check webhook info:

curl -s "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo" | jq .


(If you don't have jq, omit | jq . — it will be raw JSON.)

Expected fields include:

"url": "https://<SITE_NAME>.netlify.app/.netlify/functions/bot"

"pending_update_count": 0

Delete webhook (if needed):

curl -s "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"

**8. Quick health checks**

Check function GET (returns random cat + rocket):

curl -i https://<SITE_NAME>.netlify.app/.netlify/functions/bot

Expected body:

Bot is running 😺 🚀


(e.g. Bot is running 😸 🚀 — cat varies)

Check webhook errors:

curl -s "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"


If last_error_message contains "Wrong response from the webhook: **502 Bad Gateway**", read the troubleshooting below.

**9. GitHub: push code & recommended commit message**

Initialize git (if not already), add remote, commit and push:

git init
git add .
git commit -m "migrate project from Vercel to Netlify"
git branch -M main
git remote add origin <GITHUB_URL>
git push -u origin main


Commit message example (you asked earlier):

migrate project from Vercel to Netlify


**Troubleshooting (common issues & fixes)**

Below are issues you encountered earlier and step-by-step fixes.

**A — Wrong response from the webhook: 502 Bad Gateway (most common)**

What it means: Telegram POSTed an update to your webhook URL, but Netlify returned 502 — your function failed.

How to debug & fix:

**Check Netlify Function logs**

Open Netlify → Sites → your site → Functions → choose bot → Logs.

Look for stacktrace or console.error output.

**Common root causes & solutions**

Missing environment variables → function throws when referencing process.env.*.

Solution: set BOT_TOKEN and WEATHER_API_KEY in Netlify Dashboard (Site settings → Environment → Environment variables) OR via CLI:

netlify env:set BOT_TOKEN "<BOT_TOKEN>"
netlify env:set WEATHER_API_KEY "<WEATHER_API_KEY>"


After adding env vars, re-deploy: netlify deploy --prod.

Bad handler shape (multiple handlers or wrong request parsing)

Ensure only one exports.handler = async (event, context) => { ... }.

When Telegram POSTs, parse event.body with JSON.parse(event.body).

Unhandled exceptions inside bot logic (e.g., network error from OpenWeather)

Wrap external calls in try/catch or add logging to see exact error in function logs.

Example: if OpenWeather rate-limits or returns non-200, handle it gracefully.

Function timeouts or long-running operations

Netlify has execution limits. Avoid blocking long tasks. If you need longer processing, consider returning 200 quickly and performing work via a queue/external worker.

**Reset webhook (safe troubleshooting step)**

curl -s "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"
curl -s "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<SITE_NAME>.netlify.app/.netlify/functions/bot"
curl -s "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"


**Test the function GET to ensure the function is responsive:**

curl -i https://<SITE_NAME>.netlify.app/.netlify/functions/bot


If GET works but POSTs fail, it’s almost always code parsing/logic or missing env vars.

**B — Missing environment variables or 500 while handling update**

Symptom: Netlify logs show ⚠️ Missing environment variables! or errors referencing undefined.

Fix:

Confirm env vars in Netlify dashboard for the same site and redeploy:

netlify deploy --prod


Locally keep .env (and load via dotenv only for non-production):

if (process.env.NODE_ENV !== "production") require("dotenv").config();

**C — curl command printed No such file or directory when pasting URL**

Cause: You pasted the webhook URL directly into Bash (not using curl), so Bash tried to execute it.

Fix: Use curl or open the URL in browser:

curl -s "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<SITE_NAME>.netlify.app/.netlify/functions/bot"

**D — Function returns only 🚀 (cat missing)**

Cause: body must be a string. If you returned a non-string or the deployed build is stale, you may see old content.

Fix:

Ensure body is a string:

return { statusCode: 200, body: `Bot is running ${randomCat} 🚀` };


Re-deploy: netlify deploy --prod

Test with curl -i https://<SITE_NAME>.netlify.app/.netlify/functions/bot

**E — “Bot works only when VS Code is open” / “bot seems to sleep”**

Cause: That was because you were running a local process (e.g., bot.launch() in local server). On Netlify, serverless functions are cold-started by incoming requests — they do not run continuously.

Fix: Use webhook pattern (your code uses bot.handleUpdate(body)), set webhook to Netlify function URL. No need to run VS Code. If you see behavior where requests sometimes fail until a GET warms the function, that’s normal cold start behavior; it should still handle POSTs normally once the function is reachable.

**Extra: Local testing short commands**

Quick test that handler returns the GET string (local require):

node -e "require('./netlify/functions/bot').handler({httpMethod:'GET'}).then(r=>console.log(r.body))"


Expected:

Bot is running 😸 🚀


Testing webhook locally with ngrok (optional)

Start local server or use bot.launch(...) on port 3000.

ngrok http 3000

Set webhook to https://<ngrok>.ngrok.io

Test via Telegram.


**Final notes & tips**

* Never commit .env with real secrets. Keep .env in .gitignore.

* Use conditional dotenv load: if (process.env.NODE_ENV !== "production") require("dotenv").config();

* Always check function logs in Netlify console — they show the exact runtime exceptions.

* If you still hit 502 after checking code and env vars, copy the exact error stack from Netlify logs and paste it into an issue/PR or ask for help — that stacktrace is the fastest route to a fix.
 

🧪 Tests

This project uses Cypress for end-to-end (E2E) testing. Although these are defined as E2E tests in Cypress, they effectively serve as integration tests, verifying the live Netlify Function endpoint of the Telegram bot. 

🧰 Installation

If you haven’t installed Cypress yet, run:
**npm install cypress --save-dev**

🧩 Project structure

Cypress creates the following folder structure automatically:

**cypress/**

  **e2e/
       bot_healthcheck.cy.js  ← your test file**
    
  **fixtures/**
 
  **support/**
 
**cypress.config.js**

✍️ Example test

Here’s a simple test that checks if your Netlify bot endpoint is alive:
```js
// cypress/e2e/bot_healthcheck.cy.js
describe('Bot healthcheck', () => {
  it('should return "Bot is running 🚀"', () => {
    cy.request('https://waleriaqaweatherbot.netlify.app/.netlify/functions/bot')
      .its('body')
      .should('include', 'Bot is running');
  });
});
```

🚀 How to run tests

Open Cypress UI:
**npx cypress open**
Then select **E2E Testing → Chrome (or any browser)** → Start E2E Testing in Chrome,
and click on **bot_healthcheck.cy.js** to run the test visually.

Or run all tests headlessly (in CI or terminal):
**npx cypress run**

⚙️ .gitignore setup

Make sure to ignore temporary Cypress files:

## Cypress artifacts

**cypress/screenshots/**


**cypress/videos/**


**cypress/downloads/**


**.cypress-cache/**







