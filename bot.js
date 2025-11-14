/**
 * Телеграм-бот для гадания на таро с использованием Claude Haiku 4.5
 */

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const { verifyQuestion, generateInterpretation } = require('./claude');
const { drawThreeCards, getMarketingMessage, formatMarketingText } = require('./tarot');
const { createCollage } = require('./collage');

// Создаем бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Храним состояние пользователей
const userStates = new Map();

console.log('🤖 Бот запущен!');

/**
 * Команда /start
 */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `🔮 Привет, давай разложим таро на будущее. Лучше всего я отвечаю на личные вопросы, на которые нет правильных ответов. Например:

— Нужно ли мне переехать в другую страну?
— Пора ли заводить кота?
— Стоит ли увольняться?

Напиши и отправь сообщение с вопросом 👇`;

  bot.sendMessage(chatId, welcomeMessage);
  userStates.delete(chatId); // Сбрасываем состояние
});

/**
 * Кнопка "Задать ещё вопрос"
 */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'ask_another') {
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, '🔮 Задай свой следующий вопрос:');
    userStates.delete(chatId);
  }
});

/**
 * Обработка текстовых сообщений
 */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Игнорируем команды
  if (text && text.startsWith('/')) {
    return;
  }

  // Если нет текста, игнорируем
  if (!text || text.trim() === '') {
    return;
  }

  try {
    // Показываем индикатор набора текста
    bot.sendChatAction(chatId, 'typing');

    console.log(`\n📝 Получен вопрос от ${msg.from.username || msg.from.first_name}: ${text}`);

    // Шаг 1: Верификация вопроса
    bot.sendMessage(chatId, '⏳ Проверяю вопрос...');

    const verification = await verifyQuestion(text);
    console.log('✅ Верификация завершена:', verification);

    // Проверка на бессмысленные вопросы
    if (verification.status === 'invalid') {
      bot.sendMessage(chatId,
        '🤨 На такое я не смогу разложить таро. Напишите конкретный вопрос, например, «Что меня ждёт в 2026 году на работе?»',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '🔮 Задать другой вопрос', callback_data: 'ask_another' }
            ]]
          }
        }
      );
      return;
    }

    // Проверка на щепетильные темы
    if (verification.status === 'sensitive') {
      bot.sendMessage(chatId,
        '🤨 На такое я не смогу разложить таро — не стоит гадать на щепетильные темы. Напишите личный вопрос, например, «Что меня ждёт в 2026 году на работе?»',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '🔮 Задать другой вопрос', callback_data: 'ask_another' }
            ]]
          }
        }
      );
      return;
    }

    // Используем оригинальный вопрос
    let finalQuestion = text;

    // Шаг 2: Раскладываем карты
    bot.sendMessage(chatId, '🃏 Раскладываю карты таро...');

    const cards = drawThreeCards();
    console.log('🎴 Выпали карты:', cards.map(c =>
      `${c.name} (${c.reversed ? 'перевернутая' : 'прямая'})`
    ).join(', '));

    // Шаг 3: Создаем коллаж
    const collagePath = await createCollage(cards, chatId);

    // Шаг 4: Получаем маркетинговое сообщение
    const marketing = getMarketingMessage(verification.category);

    // Шаг 5: Генерируем интерпретацию
    const interpretation = await generateInterpretation(
      finalQuestion,
      cards
    );

    // Шаг 6: Формируем сообщения
    const cardsList = cards.map((card, index) => {
      const position = index === 0 ? '🕰 Прошлое' : index === 1 ? '🫧 Настоящее' : '👁 Будущее';
      const orientation = card.reversed ? '(перевернутая)' : '';
      return `${position}: ${card.name} ${orientation}`;
    }).join('\n');

    // Краткое сообщение для caption (до 1024 символов)
    let photoCaption = `Расклад на вопрос «${finalQuestion}»\n\n${cardsList}`;

    // Полное сообщение с интерпретацией
    let interpretationMessage = `💫 **Интерпретация на вопрос «${finalQuestion}»**\n\n${interpretation}`;

    // Добавляем маркетинговый блок в конце
    if (marketing.message) {
      interpretationMessage += `\n\n—\n\n${marketing.message}`;
    }

    // Шаг 7: Отправляем результат (сначала фото, потом интерпретацию)
    await bot.sendPhoto(chatId, collagePath, {
      caption: photoCaption
    });

    await bot.sendMessage(chatId, interpretationMessage, {
      reply_markup: {
        inline_keyboard: [[
          { text: '📚 Пройти курс', url: marketing.url }
        ]]
      },
      parse_mode: 'Markdown'
    });

    console.log('✅ Расклад отправлен пользователю');

  } catch (error) {
    console.error('❌ Ошибка при обработке сообщения:', error);
    bot.sendMessage(chatId,
      '😔 Произошла ошибка при раскладе карт. Попробуй ещё раз.',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🔮 Попробовать снова', callback_data: 'ask_another' }
          ]]
        }
      }
    );
  }
});

// Обработка ошибок polling
bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error);
});

console.log('✅ Бот готов к работе!');
