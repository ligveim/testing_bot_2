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
 * Верификация вопроса и определение категории
 * Мягкая модерация: отказывает только на опасные вопросы по УК РФ
 *
 * @param {string} question - Вопрос пользователя
 * @returns {Promise<Object>} Результат верификации с категорией и статусом
 */
async function verifyQuestion(question) {
  const prompt = `Ты помощник для телеграм-бота с гаданием на таро. Проверь вопрос пользователя и определи его категорию.

Вопрос пользователя: "${question}"

МОДЕРАЦИЯ (очень мягкая):
Отклоняй (status: "reject") ТОЛЬКО вопросы, которые могут быть опасны в рамках Уголовного Кодекса РФ:
- Призывы к насилию, терроризму, экстремизму
- Вопросы о том, как совершить преступление
- Пропаганда наркотиков, детской порнографии

ВСЕ остальные вопросы принимай (status: "accept"), включая:
- Политические вопросы (война, выборы, власть)
- Личные вопросы (отношения, здоровье, работа)
- Общие вопросы о будущем
- Вопросы о других людях

Категории для маркетинга:
- money: деньги, финансы, доход, зарплата, инвестиции
- life: жизнь, судьба, будущее, счастье, смысл, общие вопросы
- health: здоровье, болезнь, лечение, самочувствие
- work: работа, карьера, бизнес, увольнение, повышение
- home: дом, быт, ремонт, хозяйство
- relationships: отношения, любовь, партнер, семья, брак
- children: дети, воспитание, родительство
- auto: автомобиль, транспорт
- real_estate: недвижимость, квартира, жилье, ипотека
- other: политика, война, события в мире, всё остальное

Ответь СТРОГО в формате JSON:
{
  "status": "accept" или "reject",
  "category": "название_категории"
}`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
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
    console.log('Верификация:', result);

    return {
      status: result.status || 'accept',
      category: result.category || 'other'
    };
  } catch (error) {
    console.error('Ошибка при верификации вопроса:', error);
    // В случае ошибки принимаем вопрос
    return {
      status: 'accept',
      category: 'other'
    };
  }
}

/**
 * Генерация интерпретации расклада таро
 *
 * @param {string} question - Вопрос пользователя
 * @param {Array} cards - Массив выпавших карт
 * @returns {Promise<string>} Интерпретация расклада
 */
async function generateInterpretation(question, cards) {
  // Формируем описание карт
  const cardsDescription = cards.map((card, index) => {
    const position = index === 0 ? 'Прошлое' : index === 1 ? 'Настоящее' : 'Будущее';
    const orientation = card.reversed ? 'перевернутая' : 'прямая';
    const meaning = card.reversed ? card.interpretation.reversed : card.interpretation.upright;

    return `${position}: ${card.name} (${orientation})
Ключи: ${meaning}`;
  }).join('\n\n');

  const prompt = `Ты делаешь расклад таро на вопрос: "${question}"

Выпавшие карты:
${cardsDescription}

СТИЛЬ ИНТЕРПРЕТАЦИИ (очень важно!):
- Конкретно и прямо отвечай на вопрос пользователя, используя их же формулировки
- Пиши проще, меньше воды и общих фраз
- Добавь скрытую иронию, лёгкую язвительность (но не оскорбительную)
- Говори честно, даже если карты показывают не самое приятное
- Используй живой разговорный русский язык
- Объём: 5-7 предложений (примерно 90-120 слов)

ПРИМЕР СТИЛЯ (но сделай в 3-4 раза длиннее и конкретнее к вопросу):
"Ваше прошлое очень туманно (даже слишком) — и от него всё зависит до сих пор. В настоящем ничего особенного, хотя вы наверняка хотели бы иначе. А вот в будущем — в будущем карты подсказывают, что всё станет наконец-то хорошо."

ТРЕБОВАНИЯ:
- Один связный абзац без заголовков
- Обязательно упомяни все три временных периода (прошлое, настоящее, будущее)
- Интерпретируй ключи применительно к КОНКРЕТНОМУ вопросу пользователя
- НЕ копируй ключи дословно
- Используй русские кавычки «» если цитируешь вопрос
- Пиши на русском языке`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
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
