#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генератор трёх светло-бежевых фонов для коллажей таро
"""

from PIL import Image, ImageDraw
import random
import math

WIDTH = 1920
HEIGHT = 1080

# Три вариации светло-бежевых оттенков
BACKGROUNDS = [
    {
        'name': 'warm_beige',
        'base': (250, 245, 235),  # Теплый бежевый
        'patterns': [(245, 238, 225), (255, 250, 240)]
    },
    {
        'name': 'cool_beige',
        'base': (245, 245, 250),  # Прохладный бежевый
        'patterns': [(240, 240, 245), (250, 250, 255)]
    },
    {
        'name': 'neutral_beige',
        'base': (248, 244, 238),  # Нейтральный бежевый
        'patterns': [(243, 239, 233), (253, 249, 243)]
    }
]

def add_subtle_texture(img, intensity=10):
    """Добавляет едва заметную текстуру"""
    pixels = img.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            r, g, b = pixels[x, y]
            noise = random.randint(-intensity, intensity)
            pixels[x, y] = (
                max(0, min(255, r + noise)),
                max(0, min(255, g + noise)),
                max(0, min(255, b + noise))
            )

def add_soft_circles(draw, base_color, pattern_colors):
    """Добавляет мягкие круги для текстуры"""
    num_circles = random.randint(15, 25)
    for _ in range(num_circles):
        x = random.randint(-200, WIDTH + 200)
        y = random.randint(-200, HEIGHT + 200)
        radius = random.randint(100, 400)
        color = random.choice(pattern_colors)

        # Рисуем полупрозрачный круг
        overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.ellipse(
            [x - radius, y - radius, x + radius, y + radius],
            fill=(*color, 10)  # Очень низкая прозрачность
        )
        return overlay

def add_soft_lines(draw, base_color, pattern_colors):
    """Добавляет мягкие волнистые линии"""
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)

    num_lines = random.randint(5, 10)
    for _ in range(num_lines):
        y_start = random.randint(0, HEIGHT)
        points = []

        for x in range(0, WIDTH + 100, 50):
            y_offset = math.sin(x / 100) * 30
            points.append((x, y_start + y_offset))

        if len(points) > 1:
            color = random.choice(pattern_colors)
            overlay_draw.line(points, fill=(*color, 15), width=3)

    return overlay

def generate_background(name, base_color, pattern_colors):
    """Генерирует один фон"""
    # Создаём базовое изображение
    img = Image.new('RGB', (WIDTH, HEIGHT), base_color)

    # Добавляем едва заметную текстуру
    add_subtle_texture(img, intensity=5)

    # Выбираем случайный тип паттерна
    pattern_type = random.choice(['circles', 'lines', 'both'])

    if pattern_type in ['circles', 'both']:
        circles_overlay = add_soft_circles(ImageDraw.Draw(img), base_color, pattern_colors)
        if circles_overlay:
            img = Image.alpha_composite(img.convert('RGBA'), circles_overlay).convert('RGB')

    if pattern_type in ['lines', 'both']:
        lines_overlay = add_soft_lines(ImageDraw.Draw(img), base_color, pattern_colors)
        if lines_overlay:
            img = Image.alpha_composite(img.convert('RGBA'), lines_overlay).convert('RGB')

    return img

def generate_all_backgrounds():
    """Генерирует все три фона"""
    import os

    output_dir = 'backgrounds'
    os.makedirs(output_dir, exist_ok=True)

    print("🎨 Генерация светло-бежевых фонов для коллажей таро...")
    print("=" * 60)

    for i, bg_config in enumerate(BACKGROUNDS, 1):
        print(f"Создание фона {i}/3: {bg_config['name']}...")
        img = generate_background(
            bg_config['name'],
            bg_config['base'],
            bg_config['patterns']
        )

        filename = f"{i}.png"
        filepath = os.path.join(output_dir, filename)
        img.save(filepath, quality=95)
        print(f"  ✓ Сохранён: {filepath}")

    print(f"\n✅ Все 3 фона созданы в папке {output_dir}/")

if __name__ == '__main__':
    generate_all_backgrounds()
