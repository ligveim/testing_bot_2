/**
 * Модуль для работы с Claude API (Haiku 4.5)
 */

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5';

/**
 * Верификация вопроса пользователя
 * Проверяет вопрос на политический/этический контент и при необходимости переформулирует
 *
 * @param {string} question - Вопрос пользователя
 * @returns {Promise<Object>} Результат верификации
 */
async function verifyQuestion(question) {
  const prompt = `Ты помощник для телеграм-бота с гаданием на таро. Твоя задача - проверить вопрос пользователя и определить:

1. Является ли вопрос политическим или слишком этически нагруженным (война, политические события, смерть и т.п.)?
2. Можно ли переформулировать вопрос в более нейтральный и личный?
3. К какой категории относится вопрос?

Вопрос пользователя: "${question}"

Категории:
- money: деньги, финансы, доход, зарплата
- life: жизнь, судьба, будущее, счастье, смысл
- health: здоровье, болезнь, лечение
- work: работа, карьера, бизнес
- home: дом, быт, ремонт
- relationships: отношения, любовь, партнер, семья
- children: дети, воспитание
- auto: автомобиль, транспорт
- real_estate: недвижимость, квартира, жилье
- other: все остальное

Ответь СТРОГО в формате JSON:
{
  "status": "accept" | "reject" | "reformulate",
  "category": "название_категории",
  "reformulated_question": "переформулированный вопрос (если status=reformulate)" или null,
  "warning_message": "предупреждение для пользователя (если status=reformulate)" или null
}

Правила:
- Если вопрос про войну, политику, смерть других людей -> status: "reject"
- Если вопрос затрагивает чувствительные темы, но можно переформулировать -> status: "reformulate"
- Если вопрос личный и безопасный -> status: "accept"
- Всегда определяй category даже для отклоненных вопросов (используй "other" если не подходит)`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;

    // Извлекаем JSON из ответа
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Claude не вернул валидный JSON');
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log('Результат верификации:', result);

    return result;
  } catch (error) {
    console.error('Ошибка при верификации вопроса:', error);
    // В случае ошибки принимаем вопрос и относим к категории "other"
    return {
      status: 'accept',
      category: 'other',
      reformulated_question: null,
      warning_message: null
    };
  }
}

/**
 * Генерация интерпретации расклада таро
 *
 * @param {string} question - Вопрос пользователя
 * @param {Array} cards - Массив выпавших карт
 * @param {string} marketingText - Маркетинговый текст
 * @returns {Promise<string>} Интерпретация расклада
 */
async function generateInterpretation(question, cards, marketingText) {
  // Формируем описание карт
  const cardsDescription = cards.map((card, index) => {
    const position = index === 0 ? 'Прошлое' : index === 1 ? 'Настоящее' : 'Будущее';
    const orientation = card.reversed ? 'перевернутая' : 'прямая';
    const meaning = card.reversed ? card.interpretation.reversed : card.interpretation.upright;

    return `${position}: ${card.name} (${orientation})
Ключи: ${meaning}`;
  }).join('\n\n');

  const prompt = `Дай интепретацию на расклад таро в один большой абзац на вопрос пользователя "${question}".

При раскладе таро давай общие, но мотивирующие формулировки, а также ориентируйся на ключи.

Пользователю выпали карты:

${cardsDescription}

${marketingText}

Требования к ответу:
- Один большой связный абзац (3-5 предложений)
- Мотивирующий и позитивный тон
- Используй ключи из интерпретаций карт
- Свяжи все три карты в единую историю (прошлое-настоящее-будущее)
- НЕ копируй ключи дословно, а интерпретируй их применительно к вопросу
- Пиши на русском языке`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const interpretation = message.content[0].text.trim();
    console.log('Сгенерирована интерпретация:', interpretation.substring(0, 100) + '...');

    return interpretation;
  } catch (error) {
    console.error('Ошибка при генерации интерпретации:', error);
    return 'К сожалению, не удалось сгенерировать интерпретацию. Попробуйте еще раз.';
  }
}

module.exports = {
  verifyQuestion,
  generateInterpretation
};
