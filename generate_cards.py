#!/usr/bin/env python3
"""
Скрипт для генерации временных изображений карт таро
Создает простые белые карты с текстом разрешением 960x1658
"""

from PIL import Image, ImageDraw, ImageFont
import os
import json

# Размеры карты
CARD_WIDTH = 960
CARD_HEIGHT = 1658

# Цвета
BG_COLOR = (255, 255, 255)  # Белый
TEXT_COLOR = (50, 50, 50)  # Темно-серый

def create_card_image(card_name, output_path):
    """Создает изображение карты с названием"""
    # Создаем изображение
    img = Image.new('RGB', (CARD_WIDTH, CARD_HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Пытаемся загрузить шрифт, если не получается - используем дефолтный
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 60)
    except:
        font = ImageFont.load_default()

    # Разбиваем длинные названия на несколько строк
    words = card_name.split()
    lines = []
    current_line = []

    for word in words:
        test_line = ' '.join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] < CARD_WIDTH - 100:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]

    if current_line:
        lines.append(' '.join(current_line))

    # Рисуем текст по центру
    total_height = len(lines) * 80
    y = (CARD_HEIGHT - total_height) // 2

    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (CARD_WIDTH - text_width) // 2
        draw.text((x, y), line, fill=TEXT_COLOR, font=font)
        y += 80

    # Рисуем рамку
    draw.rectangle([(10, 10), (CARD_WIDTH-10, CARD_HEIGHT-10)], outline=TEXT_COLOR, width=3)

    # Сохраняем
    img.save(output_path)
    print(f"Создана карта: {output_path}")

def generate_all_cards():
    """Генерирует все 78 карт таро"""

    # Создаем папку для карт
    cards_dir = "tarot_cards"
    os.makedirs(cards_dir, exist_ok=True)

    # Загружаем JSON с описанием карт
    with open('tarot_interpretations.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Генерируем Старшие Арканы
    print("\n=== Генерация Старших Арканов ===")
    for card in data['major_arcana']:
        card_id = f"major_{card['id']}"
        card_name = card['name']
        output_path = os.path.join(cards_dir, f"{card_id}.png")
        create_card_image(card_name, output_path)

    # Генерируем Младшие Арканы
    print("\n=== Генерация Младших Арканов ===")
    for suit_name, cards in data['minor_arcana'].items():
        print(f"\nМасть: {suit_name}")
        for card in cards:
            card_id = card['id']
            card_name = card['name']
            output_path = os.path.join(cards_dir, f"{card_id}.png")
            create_card_image(card_name, output_path)

    print(f"\n✓ Всего создано карт: 78")
    print(f"✓ Карты сохранены в папке: {cards_dir}/")

if __name__ == "__main__":
    generate_all_cards()
