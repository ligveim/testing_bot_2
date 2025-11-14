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

// ⚙️ НАСТРОЙКИ ПОВОРОТА КАРТ (можно редактировать здесь)
// Диапазон углов отклонения от нормального положения (в градусах)
const MIN_ROTATION_ANGLE = 1;   // Минимальный наклон (всегда есть наклон)
const MAX_ROTATION_ANGLE = 3;   // Максимальный наклон

// Пути к фоновым изображениям
const BACKGROUNDS_DIR = path.join(__dirname, 'backgrounds');
const BACKGROUND_FILES = ['1.png', '2.png', '3.png'];

// Создаем директорию для временных коллажей
const TEMP_DIR = path.join(__dirname, 'temp_collages');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

/**
 * Генерирует случайный угол поворота (ВСЕГДА с наклоном)
 * @param {boolean} reversed - Перевернута ли карта
 * @returns {number} Угол поворота в градусах
 */
function getRandomRotation(reversed) {
  // Генерируем угол от MIN до MAX (например, от 1 до 3)
  const angle = MIN_ROTATION_ANGLE + Math.random() * (MAX_ROTATION_ANGLE - MIN_ROTATION_ANGLE);

  // Случайно выбираем направление наклона (+ или -)
  const direction = Math.random() < 0.5 ? -1 : 1;
  const deviation = angle * direction;

  if (reversed) {
    // Если карта перевернута: 180 ± наклон (например, 177° или 183°)
    return 180 + deviation;
  } else {
    // Если карта прямая: 0 ± наклон (например, -2° или +2°)
    return deviation;
  }
}

/**
 * Создает коллаж из трех карт таро
 * @param {Array} cards - Массив из 3 карт
 * @param {string} userId - ID пользователя для уникального имени файла
 * @returns {Promise<string>} Путь к созданному коллажу
 */
async function createCollage(cards, userId) {
  try {
    // Выбираем случайный фон из трёх
    const randomBackgroundIndex = Math.floor(Math.random() * BACKGROUND_FILES.length);
    const backgroundPath = path.join(BACKGROUNDS_DIR, BACKGROUND_FILES[randomBackgroundIndex]);

    // Размер одной карты в коллаже (делаем меньше, чтобы было место для промежутков)
    const cardInCollageHeight = Math.floor(COLLAGE_HEIGHT * 0.75); // 75% высоты для более компактного вида
    const cardInCollageWidth = Math.floor((CARD_WIDTH / CARD_HEIGHT) * cardInCollageHeight);

    // Расстояние между картами
    const spacing = 60; // Увеличили с 20 до 60 для более заметных промежутков

    // Вычисляем ширину всех трех карт с промежутками
    const totalCardsWidth = cardInCollageWidth * 3 + spacing * 2;

    // Вычисляем начальную позицию для центрирования
    const startX = Math.floor((COLLAGE_WIDTH - totalCardsWidth) / 2);
    const startY = Math.floor((COLLAGE_HEIGHT - cardInCollageHeight) / 2);

    // Загружаем случайный фон
    let background = sharp(backgroundPath);

    // Подготавливаем карты для композиции
    const compositeCards = [];

    for (let i = 0; i < 3; i++) {
      const card = cards[i];

      // Генерируем случайный угол поворота
      const rotationAngle = getRandomRotation(card.reversed);

      // Загружаем и поворачиваем карту
      let cardImage = sharp(card.imagePath)
        .rotate(rotationAngle, { background: { r: 0, g: 0, b: 0, alpha: 0 } });

      // Изменяем размер карты
      const resizedCard = await cardImage
        .resize(cardInCollageWidth, cardInCollageHeight, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Вычисляем позицию карты
      const x = startX + i * (cardInCollageWidth + spacing);

      compositeCards.push({
        input: resizedCard,
        top: startY,
        left: x
      });
    }

    // Создаем коллаж
    const collagePath = path.join(TEMP_DIR, `tarot_reading_${userId}_${Date.now()}.png`);

    await background
      .composite(compositeCards)
      .png()
      .toFile(collagePath);

    console.log(`Коллаж создан: ${collagePath} (фон: ${BACKGROUND_FILES[randomBackgroundIndex]})`);
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
