import zlib
import struct
import math

width, height = 512, 512
# Create RGBA buffer
img = [[(0, 0, 0, 0) for _ in range(width)] for _ in range(height)]

def set_pixel(x, y, color):
    if 0 <= x < width and 0 <= y < height:
        img[y][x] = color

def blend_pixel(x, y, color):
    if 0 <= x < width and 0 <= y < height:
        r2, g2, b2, a2 = color
        if a2 <= 0: return
        r1, g1, b1, a1 = img[y][x]
        if a1 == 0:
            img[y][x] = color
            return
        alpha = a2 / 255.0
        out_a = int(a1 + a2 * (1 - a1 / 255.0))
        out_r = int((r2 * a2 + r1 * a1 * (1 - alpha)) / (out_a if out_a > 0 else 1))
        out_g = int((g2 * a2 + g1 * a1 * (1 - alpha)) / (out_a if out_a > 0 else 1))
        out_b = int((b2 * a2 + b1 * a1 * (1 - alpha)) / (out_a if out_a > 0 else 1))
        img[y][x] = (min(255, max(0, out_r)), min(255, max(0, out_g)), min(255, max(0, out_b)), min(255, max(0, out_a)))

