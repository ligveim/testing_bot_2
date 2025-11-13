/**
 * Модуль для создания коллажей из карт таро
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Размеры
const COLLAGE_WIDTH = 1920;
const COLLAGE_HEIGHT = 1080;
const CARD_WIDTH = 960;
const CARD_HEIGHT = 1658;

// Создаем директорию для временных коллажей
const TEMP_DIR = path.join(__dirname, 'temp_collages');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

/**
 * Создает коллаж из трех карт таро
 * @param {Array} cards - Массив из 3 карт
 * @param {string} userId - ID пользователя для уникального имени файла
 * @returns {Promise<string>} Путь к созданному коллажу
 */
async function createCollage(cards, userId) {
  try {
    // Размер одной карты в коллаже (уменьшаем пропорционально)
    const cardInCollageHeight = COLLAGE_HEIGHT;
    const cardInCollageWidth = Math.floor((CARD_WIDTH / CARD_HEIGHT) * cardInCollageHeight);

    // Расстояние между картами
    const spacing = 20;

    // Вычисляем ширину всех трех карт с промежутками
    const totalCardsWidth = cardInCollageWidth * 3 + spacing * 2;

    // Вычисляем начальную позицию X для центрирования
    const startX = Math.floor((COLLAGE_WIDTH - totalCardsWidth) / 2);

    // Создаем фон (черный)
    const background = sharp({
      create: {
        width: COLLAGE_WIDTH,
        height: COLLAGE_HEIGHT,
        channels: 3,
        background: { r: 20, g: 20, b: 30 }
      }
    });

    // Подготавливаем карты для композиции
    const compositeCards = [];

    for (let i = 0; i < 3; i++) {
      const card = cards[i];
      let cardImage = sharp(card.imagePath);

      // Если карта перевернута, переворачиваем изображение
      if (card.reversed) {
        cardImage = cardImage.rotate(180);
      }

      // Изменяем размер карты
      const resizedCard = await cardImage
        .resize(cardInCollageWidth, cardInCollageHeight, {
          fit: 'contain',
          background: { r: 20, g: 20, b: 30 }
        })
        .toBuffer();

      // Вычисляем позицию карты
      const x = startX + i * (cardInCollageWidth + spacing);

      compositeCards.push({
        input: resizedCard,
        top: 0,
        left: x
      });
    }

    // Создаем коллаж
    const collagePath = path.join(TEMP_DIR, `tarot_reading_${userId}_${Date.now()}.png`);

    await background
      .composite(compositeCards)
      .png()
      .toFile(collagePath);

    console.log(`Коллаж создан: ${collagePath}`);
    return collagePath;

  } catch (error) {
    console.error('Ошибка при создании коллажа:', error);
    throw error;
  }
}

/**
 * Удаляет старые коллажи (старше 1 часа)
 */
function cleanupOldCollages() {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > oneHour) {
        fs.unlinkSync(filePath);
        console.log(`Удален старый коллаж: ${file}`);
      }
    });
  } catch (error) {
    console.error('Ошибка при очистке старых коллажей:', error);
  }
}

// Запускаем очистку каждые 30 минут
setInterval(cleanupOldCollages, 30 * 60 * 1000);

module.exports = {
  createCollage,
  cleanupOldCollages
};
