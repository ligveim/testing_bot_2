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
  const welcomeMessage = `🔮 Добро пожаловать в бот гадания на таро!

Я помогу тебе заглянуть в будущее и узнать, что ждет тебя в 2026 году.

Задай мне личный вопрос о своей судьбе, и я разложу для тебя карты таро.

Например:
• Уволят ли меня в 2026 году?
• Что мне ждать от новых отношений?
• Какие перемены ждут меня в следующем году?

⚠️ Обрати внимание: я раскладываю таро только по личным вопросам.

Задай свой вопрос:`;

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

    // Если вопрос отклонен
    if (verification.status === 'reject') {
      bot.sendMessage(chatId,
        '😔 Прости, но мы раскладываем таро только по личным вопросам. Задай вопрос по своей судьбе.',
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

    // Определяем финальный вопрос
    let finalQuestion = text;
    let warningText = '';

    if (verification.status === 'reformulate' && verification.reformulated_question) {
      finalQuestion = verification.reformulated_question;
      warningText = verification.warning_message ||
        `⚠️ Не шутим с судьбой по таким вопросам, поэтому разложим таро на вопрос попроще: "${finalQuestion}"\n\n`;
    }

    // Шаг 2: Раскладываем карты
    bot.sendMessage(chatId, '🃏 Раскладываю карты таро...');

    const cards = drawThreeCards();
    console.log('🎴 Выпали карты:', cards.map(c =>
      `${c.name} (${c.reversed ? 'перевернутая' : 'прямая'})`
    ).join(', '));

    // Шаг 3: Создаем коллаж
    bot.sendMessage(chatId, '🖼 Создаю изображение...');

    const collagePath = await createCollage(cards, chatId);

    // Шаг 4: Получаем маркетинговое сообщение
    const marketing = getMarketingMessage(verification.category);
    const marketingTextForClaude = formatMarketingText(verification.category);

    // Шаг 5: Генерируем интерпретацию
    bot.sendMessage(chatId, '🔮 Читаю карты...');

    const interpretation = await generateInterpretation(
      finalQuestion,
      cards,
      marketingTextForClaude
    );

    // Шаг 6: Формируем финальное сообщение
    const cardsList = cards.map((card, index) => {
      const position = index === 0 ? '🕰 Прошлое' : index === 1 ? '⏳ Настоящее' : '🔮 Будущее';
      const orientation = card.reversed ? '(перевернутая)' : '';
      return `${position}: ${card.name} ${orientation}`;
    }).join('\n');

    let finalMessage = `🔮 Расклад на вопрос: "${finalQuestion}"\n\n`;

    if (warningText) {
      finalMessage += warningText;
    }

    finalMessage += `${cardsList}\n\n`;
    finalMessage += `💫 Интерпретация:\n${interpretation}\n\n`;

    // Добавляем маркетинговый блок только если он заполнен
    if (marketing.message && !marketing.message.startsWith('ЗАПОЛНИТЕ')) {
      finalMessage += `\n${marketing.message}`;
    }

    // Шаг 7: Отправляем результат
    await bot.sendPhoto(chatId, collagePath, {
      caption: finalMessage,
      reply_markup: {
        inline_keyboard: [[
          { text: '🔮 Задать ещё вопрос', callback_data: 'ask_another' }
        ]]
      }
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
