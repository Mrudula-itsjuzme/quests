import math
from PIL import Image, ImageDraw

def draw_icon(size):
    img = Image.new("RGBA", (size, size), (10, 20, 16, 255))
    draw = ImageDraw.Draw(img)
    
    # Background radial gradient
    center = size / 2
    for r in range(int(size * 0.7), 0, -1):
        ratio = r / (size * 0.7)
        g = int(20 + (30 * (1 - ratio)))
        b = int(16 + (20 * (1 - ratio)))
        draw.ellipse([center - r, center - r, center + r, center + r], fill=(10, g, b, 255))

    # Outer ornate gold ring
    margin = size * 0.08
    draw.ellipse([margin, margin, size - margin, size - margin], outline=(212, 175, 55, 200), width=max(2, int(size * 0.02)))
    
    inner_margin = size * 0.12
    draw.ellipse([inner_margin, inner_margin, size - inner_margin, size - inner_margin], outline=(229, 193, 88, 120), width=max(1, int(size * 0.01)))

    # Central emblem: 4-pointed star / compass star
    star_r_outer = size * 0.32
    star_r_inner = size * 0.10
    points = []
    for i in range(8):
        angle = i * (math.pi / 4) - (math.pi / 2)
        r = star_r_outer if i % 2 == 0 else star_r_inner
        x = center + r * math.cos(angle)
        y = center + r * math.sin(angle)
        points.append((x, y))

    draw.polygon(points, fill=(229, 193, 88, 240), outline=(255, 223, 128, 255))

    # Center gem dot
    gem_r = size * 0.06
    draw.ellipse([center - gem_r, center - gem_r, center + gem_r, center + gem_r], fill=(16, 185, 129, 255), outline=(255, 255, 255, 220), width=max(1, int(size * 0.01)))

    return img

draw_icon(192).save("public/icon-192.png")
draw_icon(512).save("public/icon-512.png")
print("Icons generated successfully!")
