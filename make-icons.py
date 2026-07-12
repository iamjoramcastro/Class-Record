import sys, os
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else "eClassRecord.png"
if not os.path.exists(src):
    print("Source not found:", src); sys.exit(1)

os.makedirs("icons", exist_ok=True)
img = Image.open(src).convert("RGBA")

# center-crop to square
w, h = img.size
side = min(w, h)
img = img.crop(((w-side)//2, (h-side)//2, (w-side)//2+side, (h-side)//2+side))

def resize(size):
    return img.resize((size, size), Image.LANCZOS)

resize(192).save("icons/eClassRecord192.png")
resize(512).save("icons/eClassRecord512.png")
resize(180).save("icons/eClassRecord512.png")

BG = (14, 42, 71, 255)  # #0E2A47
m = Image.new("RGBA", (512, 512), BG)
inner = int(512 * 0.80)              # 80% safe area
logo = resize(inner)
off = (512 - inner) // 2
m.paste(logo, (off, off), logo)
m.save("icons/icon-maskable-512.png")

print("Wrote: icons/eClassRecord192.png, eClassRecord512.png, eClassRecord512.png, eClassRecord.png")
