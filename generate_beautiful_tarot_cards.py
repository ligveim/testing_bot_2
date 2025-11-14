#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генератор красивых карт таро с минималистичным дизайном
Создает все 78 карт с уникальными символическими иллюстрациями
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

# Размеры карты
CARD_WIDTH = 960
CARD_HEIGHT = 1658

# Цветовая палитра - бежевые оттенки
COLOR_BEIGE_LIGHT = '#F5E6D3'   # Светлый бежевый для фона
COLOR_BEIGE_DARK = '#D4C4A8'    # Темный бежевый для внутренней рамки
COLOR_BLACK = '#1A1A1A'         # Черный для рамок и текста
COLOR_GOLD = '#B8860B'          # Золотой для акцентов

# Параметры рамок
OUTER_BORDER = 20               # Внешняя черная рамка
INNER_BORDER = 15               # Внутренняя линия
BOTTOM_TEXT_HEIGHT = 120        # Высота области для текста внизу
TOP_NUMBER_HEIGHT = 80          # Высота области для номера вверху

def int_to_roman(num):
    """Конвертирует число в римские цифры"""
    val = [
        1000, 900, 500, 400,
        100, 90, 50, 40,
        10, 9, 5, 4,
        1
    ]
    syms = [
        'M', 'CM', 'D', 'CD',
        'C', 'XC', 'L', 'XL',
        'X', 'IX', 'V', 'IV',
        'I'
    ]
    roman_num = ''
    i = 0
    while num > 0:
        for _ in range(num // val[i]):
            roman_num += syms[i]
            num -= val[i]
        i += 1
    return roman_num

def draw_star(draw, center_x, center_y, outer_radius, inner_radius, points, color, width=3):
    """Рисует звезду"""
    coords = []
    for i in range(points * 2):
        angle = math.pi / 2 + (2 * math.pi * i / (points * 2))
        radius = outer_radius if i % 2 == 0 else inner_radius
        x = center_x + radius * math.cos(angle)
        y = center_y - radius * math.sin(angle)
        coords.append((x, y))
    draw.polygon(coords, outline=color, width=width)

def draw_circle(draw, center_x, center_y, radius, color, width=3, fill=None):
    """Рисует круг"""
    draw.ellipse(
        [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
        outline=color, width=width, fill=fill
    )

def draw_moon(draw, center_x, center_y, radius, color, width=3):
    """Рисует полумесяц"""
    # Внешний круг
    draw.arc(
        [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
        start=270, end=90, fill=color, width=width
    )
    # Внутренний вырез
    offset = radius // 3
    draw.arc(
        [center_x - radius + offset, center_y - radius, center_x + radius + offset, center_y + radius],
        start=90, end=270, fill=COLOR_BEIGE_LIGHT, width=width
    )

def draw_infinity(draw, center_x, center_y, width_size, height_size, color, line_width=3):
    """Рисует символ бесконечности"""
    # Левый круг
    draw.ellipse(
        [center_x - width_size, center_y - height_size, center_x, center_y + height_size],
        outline=color, width=line_width
    )
    # Правый круг
    draw.ellipse(
        [center_x, center_y - height_size, center_x + width_size, center_y + height_size],
        outline=color, width=line_width
    )

def draw_triangle(draw, center_x, center_y, size, color, width=3, pointing_up=True):
    """Рисует треугольник"""
    if pointing_up:
        points = [
            (center_x, center_y - size),
            (center_x - size, center_y + size),
            (center_x + size, center_y + size)
        ]
    else:
        points = [
            (center_x, center_y + size),
            (center_x - size, center_y - size),
            (center_x + size, center_y - size)
        ]
    draw.polygon(points, outline=color, width=width)

def draw_chalice(draw, center_x, center_y, size, color, width=3):
    """Рисует чашу (символ кубков)"""
    # Чаша
    draw.arc(
        [center_x - size, center_y - size//2, center_x + size, center_y + size],
        start=0, end=180, fill=color, width=width
    )
    # Ножка
    draw.line([center_x, center_y + size//2, center_x, center_y + size * 1.3], fill=color, width=width)
    # Основание
    draw.line([center_x - size//2, center_y + size * 1.3, center_x + size//2, center_y + size * 1.3], fill=color, width=width)

def draw_wand(draw, center_x, center_y, length, color, width=3):
    """Рисует жезл"""
    # Основной жезл
    draw.line([center_x, center_y - length, center_x, center_y + length], fill=color, width=width * 2)
    # Листья сверху
    draw.line([center_x - 20, center_y - length + 30, center_x, center_y - length], fill=color, width=width)
    draw.line([center_x + 20, center_y - length + 30, center_x, center_y - length], fill=color, width=width)

def draw_sword(draw, center_x, center_y, length, color, width=3):
    """Рисует меч"""
    # Лезвие
    draw.line([center_x, center_y - length, center_x, center_y + length], fill=color, width=width * 2)
    # Гарда
    draw.line([center_x - 40, center_y - length // 2, center_x + 40, center_y - length // 2], fill=color, width=width)
    # Рукоять
    draw.rectangle([center_x - 10, center_y - length // 2, center_x + 10, center_y - length // 2 + 60], outline=color, width=width)

def draw_pentacle(draw, center_x, center_y, radius, color, width=3):
    """Рисует пентакль (пятиконечная звезда в круге)"""
    draw_circle(draw, center_x, center_y, radius, color, width=width)
    draw_star(draw, center_x, center_y, radius * 0.8, radius * 0.3, 5, color, width=width)

def get_major_arcana_symbol(card_id, draw, center_x, center_y, size):
    """Возвращает функцию для рисования символа Major Arcana"""
    color = COLOR_BLACK

    symbols = {
        0: lambda: [  # The Fool - Солнце и бездна
            draw_circle(draw, center_x, center_y - 100, size // 3, color, width=4),
            [draw.line([center_x + i * 15, center_y - 100, center_x + i * 30, center_y - 130], fill=color, width=3) for i in range(-3, 4)],
            draw.line([center_x - 80, center_y + 80, center_x + 80, center_y + 80], fill=color, width=4)
        ],
        1: lambda: [  # The Magician - Infinity and wand
            draw_infinity(draw, center_x, center_y - 80, 70, 30, color, 4),
            draw_wand(draw, center_x, center_y + 50, size // 2, color, 3)
        ],
        2: lambda: [  # The High Priestess - Moon and pillars
            draw_moon(draw, center_x, center_y - 50, size // 3, color, 4),
            draw.line([center_x - 80, center_y, center_x - 80, center_y + 120], fill=color, width=8),
            draw.line([center_x + 80, center_y, center_x + 80, center_y + 120], fill=color, width=8)
        ],
        3: lambda: [  # The Empress - Venus symbol
            draw_circle(draw, center_x, center_y - 40, size // 4, color, width=4),
            draw.line([center_x, center_y + size // 4 - 40, center_x, center_y + 60], fill=color, width=4),
            draw.line([center_x - 50, center_y + 20, center_x + 50, center_y + 20], fill=color, width=4),
            draw_star(draw, center_x, center_y - 120, 30, 12, 12, COLOR_GOLD, width=2)
        ],
        4: lambda: [  # The Emperor - Square throne
            draw.rectangle([center_x - 70, center_y - 70, center_x + 70, center_y + 70], outline=color, width=5),
            draw.line([center_x - 50, center_y - 90, center_x - 50, center_y - 70], fill=color, width=5),
            draw.line([center_x + 50, center_y - 90, center_x + 50, center_y - 70], fill=color, width=5)
        ],
        5: lambda: [  # The Hierophant - Triple cross
            draw.line([center_x, center_y - 80, center_x, center_y + 80], fill=color, width=5),
            draw.line([center_x - 40, center_y - 60, center_x + 40, center_y - 60], fill=color, width=4),
            draw.line([center_x - 50, center_y - 20, center_x + 50, center_y - 20], fill=color, width=4),
            draw.line([center_x - 60, center_y + 20, center_x + 60, center_y + 20], fill=color, width=4)
        ],
        6: lambda: [  # The Lovers - Two circles connected
            draw_circle(draw, center_x - 50, center_y, size // 3, color, width=4),
            draw_circle(draw, center_x + 50, center_y, size // 3, color, width=4),
            draw.line([center_x, center_y - 120, center_x, center_y - 80], fill=COLOR_GOLD, width=3),
            draw_triangle(draw, center_x, center_y - 100, 15, COLOR_GOLD, width=2, pointing_up=False)
        ],
        7: lambda: [  # The Chariot - Square with wheels
            draw.rectangle([center_x - 80, center_y - 40, center_x + 80, center_y + 40], outline=color, width=5),
            draw_circle(draw, center_x - 60, center_y + 70, 30, color, width=4),
            draw_circle(draw, center_x + 60, center_y + 70, 30, color, width=4)
        ],
        8: lambda: [  # Strength - Infinity over lion
            draw_infinity(draw, center_x, center_y - 80, 60, 25, color, 4),
            draw_circle(draw, center_x, center_y + 30, size // 3, color, width=5),
            [draw.line([center_x, center_y + 30 + size // 3, center_x + i * 20, center_y + 30 + size // 3 + 30], fill=color, width=3) for i in range(-2, 3)]
        ],
        9: lambda: [  # The Hermit - Lantern
            draw.line([center_x, center_y - 100, center_x, center_y + 80], fill=color, width=4),
            draw.polygon([
                (center_x - 30, center_y - 100),
                (center_x + 30, center_y - 100),
                (center_x + 20, center_y - 60),
                (center_x - 20, center_y - 60)
            ], outline=color, width=3),
            draw_circle(draw, center_x, center_y - 80, 8, COLOR_GOLD, width=2, fill=COLOR_GOLD)
        ],
        10: lambda: [  # Wheel of Fortune - Wheel
            draw_circle(draw, center_x, center_y, size // 2, color, width=5),
            [draw.line([center_x, center_y,
                       center_x + (size // 2) * math.cos(i * math.pi / 4),
                       center_y + (size // 2) * math.sin(i * math.pi / 4)], fill=color, width=3) for i in range(8)],
            draw_circle(draw, center_x, center_y, size // 6, color, width=4)
        ],
        11: lambda: [  # Justice - Scales
            draw.line([center_x, center_y - 80, center_x, center_y + 20], fill=color, width=4),
            draw.line([center_x - 70, center_y - 80, center_x + 70, center_y - 80], fill=color, width=4),
            draw.line([center_x - 70, center_y - 80, center_x - 70, center_y - 50], fill=color, width=3),
            draw.line([center_x + 70, center_y - 80, center_x + 70, center_y - 50], fill=color, width=3),
            draw.rectangle([center_x - 85, center_y - 50, center_x - 55, center_y - 35], outline=color, width=2),
            draw.rectangle([center_x + 55, center_y - 50, center_x + 85, center_y - 35], outline=color, width=2)
        ],
        12: lambda: [  # The Hanged Man - Upside down person
            draw.line([center_x - 80, center_y - 80, center_x + 80, center_y - 80], fill=color, width=5),
            draw.line([center_x, center_y - 80, center_x, center_y], fill=color, width=4),
            draw_circle(draw, center_x, center_y + 30, 25, color, width=4),
            draw.line([center_x - 40, center_y + 60, center_x, center_y + 15], fill=color, width=4),
            draw.line([center_x + 40, center_y + 60, center_x, center_y + 15], fill=color, width=4)
        ],
        13: lambda: [  # Death - Skull and scythe
            draw_circle(draw, center_x, center_y - 20, 50, color, width=4),
            draw_circle(draw, center_x - 20, center_y - 30, 12, color, width=3),
            draw_circle(draw, center_x + 20, center_y - 30, 12, color, width=3),
            draw.arc([center_x - 80, center_y + 30, center_x + 80, center_y + 100], start=180, end=0, fill=color, width=4)
        ],
        14: lambda: [  # Temperance - Pouring water
            draw_triangle(draw, center_x - 40, center_y - 50, 30, color, width=3, pointing_up=False),
            draw_triangle(draw, center_x + 40, center_y + 50, 30, color, width=3, pointing_up=True),
            [draw.line([center_x - 20 + i * 5, center_y - 30, center_x + 20 + i * 5, center_y + 30], fill=COLOR_GOLD, width=2) for i in range(-2, 3)]
        ],
        15: lambda: [  # The Devil - Inverted pentagram
            draw_circle(draw, center_x, center_y, size // 2, color, width=5),
            draw_star(draw, center_x, center_y, size // 2 * 0.8, size // 2 * 0.3, 5, color, width=4),
            draw.line([center_x - 40, center_y - size // 2 - 30, center_x - 20, center_y - size // 2 - 50], fill=color, width=4),
            draw.line([center_x + 40, center_y - size // 2 - 30, center_x + 20, center_y - size // 2 - 50], fill=color, width=4)
        ],
        16: lambda: [  # The Tower - Tower struck by lightning
            draw.rectangle([center_x - 50, center_y - 50, center_x + 50, center_y + 100], outline=color, width=5),
            draw.polygon([
                (center_x - 60, center_y - 50),
                (center_x - 30, center_y - 80),
                (center_x + 30, center_y - 80),
                (center_x + 60, center_y - 50)
            ], outline=color, width=3),
            draw.line([center_x + 10, center_y - 100, center_x - 30, center_y - 30], fill=COLOR_GOLD, width=5)
        ],
        17: lambda: [  # The Star - Large star with smaller stars
            draw_star(draw, center_x, center_y, size // 2, size // 5, 8, color, width=4),
            draw_star(draw, center_x - 80, center_y - 80, 20, 8, 5, COLOR_GOLD, width=2),
            draw_star(draw, center_x + 80, center_y - 80, 20, 8, 5, COLOR_GOLD, width=2),
            draw_star(draw, center_x - 70, center_y + 70, 20, 8, 5, COLOR_GOLD, width=2),
            draw_star(draw, center_x + 70, center_y + 70, 20, 8, 5, COLOR_GOLD, width=2)
        ],
        18: lambda: [  # The Moon - Moon and towers
            draw_moon(draw, center_x, center_y - 60, size // 3, color, 5),
            draw.rectangle([center_x - 90, center_y + 30, center_x - 60, center_y + 90], outline=color, width=4),
            draw.rectangle([center_x + 60, center_y + 30, center_x + 90, center_y + 90], outline=color, width=4)
        ],
        19: lambda: [  # The Sun - Sun with rays
            draw_circle(draw, center_x, center_y, size // 3, COLOR_GOLD, width=5, fill=COLOR_GOLD),
            [draw.line([
                center_x + (size // 3 + 20) * math.cos(i * math.pi / 8),
                center_y + (size // 3 + 20) * math.sin(i * math.pi / 8),
                center_x + (size // 3 + 60) * math.cos(i * math.pi / 8),
                center_y + (size // 3 + 60) * math.sin(i * math.pi / 8)
            ], fill=COLOR_GOLD, width=4) for i in range(16)]
        ],
        20: lambda: [  # Judgement - Angel trumpet
            draw_triangle(draw, center_x, center_y - 80, 40, color, width=4, pointing_up=True),
            draw.rectangle([center_x - 15, center_y - 40, center_x + 15, center_y + 60], outline=color, width=4),
            draw_circle(draw, center_x, center_y + 90, 25, color, width=3)
        ],
        21: lambda: [  # The World - Circle with four corners
            draw_circle(draw, center_x, center_y, size // 2, color, width=5),
            draw_infinity(draw, center_x, center_y, 60, 25, color, 4),
            draw_circle(draw, center_x - 100, center_y - 100, 15, COLOR_GOLD, width=2),
            draw_circle(draw, center_x + 100, center_y - 100, 15, COLOR_GOLD, width=2),
            draw_circle(draw, center_x - 100, center_y + 100, 15, COLOR_GOLD, width=2),
            draw_circle(draw, center_x + 100, center_y + 100, 15, COLOR_GOLD, width=2)
        ]
    }

    if card_id in symbols:
        symbols[card_id]()

def get_minor_arcana_symbol(suit, rank, draw, center_x, center_y, size):
    """Рисует символ для Minor Arcana"""
    color = COLOR_BLACK

    # Определяем символ масти
    if suit == 'wands':
        suit_drawer = lambda x, y: draw_wand(draw, x, y, size // 2, color, 3)
    elif suit == 'cups':
        suit_drawer = lambda x, y: draw_chalice(draw, x, y, size // 3, color, 3)
    elif suit == 'swords':
        suit_drawer = lambda x, y: draw_sword(draw, x, y, size // 2, color, 3)
    else:  # pentacles
        suit_drawer = lambda x, y: draw_pentacle(draw, x, y, size // 3, color, 3)

    # Для числовых карт рисуем соответствующее количество символов
    if rank <= 10:
        positions = {
            1: [(0, 0)],
            2: [(0, -60), (0, 60)],
            3: [(0, -80), (0, 0), (0, 80)],
            4: [(-50, -50), (50, -50), (-50, 50), (50, 50)],
            5: [(-50, -50), (50, -50), (0, 0), (-50, 50), (50, 50)],
            6: [(-50, -80), (50, -80), (-50, 0), (50, 0), (-50, 80), (50, 80)],
            7: [(-50, -80), (50, -80), (-50, -30), (0, 20), (50, -30), (-50, 80), (50, 80)],
            8: [(-60, -90), (0, -90), (60, -90), (-60, -30), (60, -30), (-60, 30), (0, 30), (60, 30)],
            9: [(-60, -80), (0, -80), (60, -80), (-60, 0), (0, 0), (60, 0), (-60, 80), (0, 80), (60, 80)],
            10: [(-60, -90), (0, -90), (60, -90), (-60, -30), (60, -30), (-60, 30), (60, 30), (-60, 90), (0, 90), (60, 90)]
        }

        for dx, dy in positions[rank]:
            suit_drawer(center_x + dx, center_y + dy)

    # Для придворных карт - один большой символ с особым обрамлением
    else:
        suit_drawer(center_x, center_y)
        if rank == 11:  # Page
            draw.rectangle([center_x - 80, center_y - 100, center_x + 80, center_y + 100], outline=color, width=3)
        elif rank == 12:  # Knight
            draw.rectangle([center_x - 90, center_y - 110, center_x + 90, center_y + 110], outline=color, width=4)
            draw.rectangle([center_x - 85, center_y - 105, center_x + 85, center_y + 105], outline=color, width=2)
        elif rank == 13:  # Queen
            draw.arc([center_x - 100, center_y - 120, center_x + 100, center_y + 120], start=0, end=180, fill=color, width=4)
            draw.line([center_x - 100, center_y, center_x - 100, center_y + 120], fill=color, width=4)
            draw.line([center_x + 100, center_y, center_x + 100, center_y + 120], fill=color, width=4)
        elif rank == 14:  # King
            draw.polygon([
                (center_x - 100, center_y + 120),
                (center_x - 100, center_y - 80),
                (center_x, center_y - 120),
                (center_x + 100, center_y - 80),
                (center_x + 100, center_y + 120)
            ], outline=color, width=5)

def create_tarot_card(card_id, name_ru, name_en, roman_numeral=None, is_major=True, suit=None, rank=None):
    """Создает одну карту таро с красивым дизайном"""

    # Создаем изображение
    img = Image.new('RGB', (CARD_WIDTH, CARD_HEIGHT), COLOR_BEIGE_LIGHT)
    draw = ImageDraw.Draw(img)

    # 1. Внешняя черная рамка
    draw.rectangle([0, 0, CARD_WIDTH - 1, CARD_HEIGHT - 1], outline=COLOR_BLACK, width=OUTER_BORDER)

    # 2. Внутренняя бежевая область (чуть темнее)
    draw.rectangle(
        [OUTER_BORDER, OUTER_BORDER, CARD_WIDTH - OUTER_BORDER, CARD_HEIGHT - OUTER_BORDER],
        fill=COLOR_BEIGE_DARK,
        outline=COLOR_BLACK,
        width=2
    )

    # 3. Линия отделяющая текст внизу
    text_line_y = CARD_HEIGHT - OUTER_BORDER - BOTTOM_TEXT_HEIGHT
    draw.line(
        [OUTER_BORDER + INNER_BORDER, text_line_y, CARD_WIDTH - OUTER_BORDER - INNER_BORDER, text_line_y],
        fill=COLOR_BLACK,
        width=3
    )

    # 4. Линия отделяющая номер вверху (только для Major Arcana)
    if is_major and roman_numeral is not None:
        number_line_y = OUTER_BORDER + TOP_NUMBER_HEIGHT
        draw.line(
            [OUTER_BORDER + INNER_BORDER, number_line_y, CARD_WIDTH - OUTER_BORDER - INNER_BORDER, number_line_y],
            fill=COLOR_BLACK,
            width=3
        )

    # 5. Римские цифры вверху (для Major Arcana)
    try:
        if is_major and roman_numeral is not None:
            font_number = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 50)
            text_bbox = draw.textbbox((0, 0), roman_numeral, font=font_number)
            text_width = text_bbox[2] - text_bbox[0]
            text_x = (CARD_WIDTH - text_width) // 2
            text_y = OUTER_BORDER + (TOP_NUMBER_HEIGHT - 50) // 2
            draw.text((text_x, text_y), roman_numeral, fill=COLOR_BLACK, font=font_number)
    except:
        pass  # Если шрифт не найден, пропускаем

    # 6. Область для иллюстрации
    if is_major:
        illustration_top = OUTER_BORDER + TOP_NUMBER_HEIGHT + 30 if roman_numeral else OUTER_BORDER + 30
    else:
        illustration_top = OUTER_BORDER + 60

    illustration_bottom = text_line_y - 30
    illustration_center_x = CARD_WIDTH // 2
    illustration_center_y = (illustration_top + illustration_bottom) // 2
    illustration_size = min(CARD_WIDTH - 200, illustration_bottom - illustration_top - 100)

    # 7. Рисуем символическую иллюстрацию
    if is_major:
        get_major_arcana_symbol(card_id, draw, illustration_center_x, illustration_center_y, illustration_size)
    else:
        get_minor_arcana_symbol(suit, rank, draw, illustration_center_x, illustration_center_y, illustration_size)

    # 8. Название карты внизу
    try:
        font_name = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', 42)
        text_bbox = draw.textbbox((0, 0), name_ru, font=font_name)
        text_width = text_bbox[2] - text_bbox[0]
        text_x = (CARD_WIDTH - text_width) // 2
        text_y = text_line_y + (BOTTOM_TEXT_HEIGHT - 42) // 2
        draw.text((text_x, text_y), name_ru, fill=COLOR_BLACK, font=font_name)
    except:
        # Fallback если шрифт не найден
        pass

    return img

def generate_all_cards():
    """Генерирует все 78 карт таро"""

    output_dir = 'tarot_cards'
    os.makedirs(output_dir, exist_ok=True)

    # Major Arcana (22 карты)
    major_arcana = [
        (0, "Шут", "The Fool"),
        (1, "Маг", "The Magician"),
        (2, "Верховная Жрица", "The High Priestess"),
        (3, "Императрица", "The Empress"),
        (4, "Император", "The Emperor"),
        (5, "Иерофант", "The Hierophant"),
        (6, "Влюбленные", "The Lovers"),
        (7, "Колесница", "The Chariot"),
        (8, "Сила", "Strength"),
        (9, "Отшельник", "The Hermit"),
        (10, "Колесо Фортуны", "Wheel of Fortune"),
        (11, "Справедливость", "Justice"),
        (12, "Повешенный", "The Hanged Man"),
        (13, "Смерть", "Death"),
        (14, "Умеренность", "Temperance"),
        (15, "Дьявол", "The Devil"),
        (16, "Башня", "The Tower"),
        (17, "Звезда", "The Star"),
        (18, "Луна", "The Moon"),
        (19, "Солнце", "The Sun"),
        (20, "Суд", "Judgement"),
        (21, "Мир", "The World")
    ]

    print("Генерация Major Arcana...")
    for card_id, name_ru, name_en in major_arcana:
        roman = int_to_roman(card_id) if card_id > 0 else "0"
        img = create_tarot_card(card_id, name_ru, name_en, roman, is_major=True)
        img.save(os.path.join(output_dir, f'{card_id}.png'))
        print(f"  ✓ {card_id}. {name_ru} ({roman})")

    # Minor Arcana (56 карт)
    suits = {
        'wands': 'Жезлов',
        'cups': 'Кубков',
        'swords': 'Мечей',
        'pentacles': 'Пентаклей'
    }

    ranks = {
        1: 'Туз', 2: 'Двойка', 3: 'Тройка', 4: 'Четверка', 5: 'Пятерка',
        6: 'Шестерка', 7: 'Семерка', 8: 'Восьмерка', 9: 'Девятка', 10: 'Десятка',
        11: 'Паж', 12: 'Рыцарь', 13: 'Королева', 14: 'Король'
    }

    card_id = 22
    for suit_en, suit_ru in suits.items():
        print(f"\nГенерация {suit_ru}...")
        for rank in range(1, 15):
            name_ru = f"{ranks[rank]} {suit_ru}"
            name_en = f"{rank} of {suit_en}"
            img = create_tarot_card(card_id, name_ru, name_en, roman_numeral=None, is_major=False, suit=suit_en, rank=rank)
            img.save(os.path.join(output_dir, f'{card_id}.png'))
            print(f"  ✓ {card_id}. {name_ru}")
            card_id += 1

    print(f"\n✅ Все 78 карт созданы в папке {output_dir}/")

if __name__ == '__main__':
    print("🎴 Генератор красивых карт таро")
    print("=" * 50)
    generate_all_cards()
