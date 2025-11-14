/**
 * Модуль для работы с картами таро
 */

const fs = require('fs');
const path = require('path');

// Загружаем интерпретации карт
const interpretations = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tarot_interpretations.json'), 'utf8')
);

// Загружаем маркетинговые сообщения
const marketingMessages = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'marketing_messages.json'), 'utf8')
);

/**
 * Получает все карты в плоском массиве с метаданными
 * @returns {Array} Массив всех карт
 */
function getAllCards() {
  const cards = [];
  let numericId = 0;

  // Старшие Арканы (0-21)
  interpretations.major_arcana.forEach(card => {
    cards.push({
      type: 'major',
      id: `major_${card.id}`,
      numericId: card.id,  // Используем числовой id для файлов
      name: card.name,
      name_en: card.name_en,
      interpretation: {
        upright: card.upright,
        reversed: card.reversed
      }
    });
  });

  // Младшие Арканы (22-77)
  // Порядок: wands (22-35), cups (36-49), swords (50-63), pentacles (64-77)
  numericId = 22;
  const suitsOrder = ['wands', 'cups', 'swords', 'pentacles'];

  suitsOrder.forEach(suit => {
    interpretations.minor_arcana[suit].forEach(card => {
      cards.push({
        type: 'minor',
        suit: suit,
        id: card.id,
        numericId: numericId++,  // Числовой id для файлов
        name: card.name,
        name_en: card.name_en,
        interpretation: {
          upright: card.upright,
          reversed: card.reversed
        }
      });
    });
  });

  return cards;
}

/**
 * Перемешивает массив (алгоритм Fisher-Yates)
 * @param {Array} array - Массив для перемешивания
 * @returns {Array} Перемешанный массив
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Вытягивает 3 карты для расклада
 * @returns {Array} Массив из 3 карт с информацией о перевернутости
 */
function drawThreeCards() {
  const allCards = getAllCards();
  const shuffled = shuffleArray(allCards);
  const drawnCards = shuffled.slice(0, 3);

  // Для каждой карты определяем, перевернута ли она (50% вероятность)
  return drawnCards.map(card => ({
    ...card,
    reversed: Math.random() < 0.5,
    imagePath: path.join(__dirname, 'tarot_cards', `${card.numericId}.png`)
  }));
}

/**
 * Определяет категорию вопроса и возвращает соответствующий маркетинговый текст
 * @param {string} category - Категория вопроса
 * @returns {Object} Объект с маркетинговым сообщением и URL
 */
function getMarketingMessage(category) {
  const categories = marketingMessages.categories;

  if (categories[category]) {
    return {
      message: categories[category].message,
      url: categories[category].url
    };
  }

  // Возвращаем сообщение по умолчанию
  return {
    message: categories.other.message,
    url: categories.other.url
  };
}

/**
 * Форматирует маркетинговый текст для интерпретации
 * @param {string} category - Категория вопроса
 * @returns {string} Отформатированный маркетинговый текст
 */
function formatMarketingText(category) {
  const marketing = getMarketingMessage(category);
  return marketing.message;
}

module.exports = {
  getAllCards,
  drawThreeCards,
  getMarketingMessage,
  formatMarketingText
};
