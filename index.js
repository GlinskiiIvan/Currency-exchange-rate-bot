const { Telegraf } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');
const emoji = require('node-emoji');
const CURRENCY_LIST = require('./currency-list');
require('dotenv').config();

// const link = `https://ifin.kz/exchange/ust-kamenogorsk`;
const link = `https://ifin.kz/nbrk`;

const getHTML = async (url) => {
  const { data } = await axios.get(url);
  return cheerio.load(data);
};

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
  await ctx.replyWithHTML(
    `
Привет, ${ctx.message.from.first_name}!

Я помогу тебе узнать официальный обменный курс валют в Казахстане(тенге) - Национальный Банк РК.
Для этого ты должен отправить мне название интересующей тебя валюты.
Список всех валют можно посмотреть использовав команду /help.

Вся информация взята с сайта <a href="https://ifin.kz/nbrk">iFin.kz</a>
  `,
    { disable_web_page_preview: true }
  );
});

bot.help(async (ctx) => {
  ctx.reply(CURRENCY_LIST);
});

bot.on('text', async (ctx) => {
  const $ = await getHTML(link);

  try {
    let flag = false;
    $('tbody', '.table.table-hovered.no-filter')
      .find('tr')
      .each((index, element) => {
        const title = $(element).find('.table-row-title').text().trim().toLowerCase();
        const currencyInfo = $(element)
          .find('.table-row-info')
          .text()
          .replace(/[^a-zа-яё]/gi, '')
          .toLocaleLowerCase();
        const messageText = ctx.message.text.toLowerCase();
        if (title === messageText || currencyInfo == messageText) {
          flag = true;
          const currency = $(element).find('td');
          let changeDay =
            currency.eq(3).find('i').attr('class') === 'caret-up'
              ? emoji.find('chart_with_upwards_trend').emoji
              : emoji.find('chart_with_downwards_trend').emoji;
          let changeMonthly =
            currency.eq(4).find('i').attr('class') === 'caret-up'
              ? emoji.find('chart_with_upwards_trend').emoji
              : emoji.find('chart_with_downwards_trend').emoji;

          ctx.replyWithHTML(
            `
<i>Валюта:</i> <b>${title}</b>

<i>Курс:</i> <b>${currency.eq(2).text().trim()}</b>

<i>Изменение за день:</i> <b>${changeDay} ${currency.eq(3).text().trim()}</b>

<i>Изменение за месяц:</i> <b>${changeMonthly} ${currency.eq(4).text().trim()}</b>

Вся информация взята с сайта <a href="https://ifin.kz/nbrk">iFin.kz</a>
      `,
            { disable_web_page_preview: true }
          );
        }
      });
    if (!flag) ctx.reply('Ошибка, такой валюты нет.');
  } catch (e) {
    console.log(e);
  }
});

bot.launch();

console.log('Бот запущен!');
