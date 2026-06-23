import zipfile
import os
from PIL import Image
import io

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
usdz_path = os.path.join(cwd, 'public/models/extra_chocolate_marshmallow_cupcake.usdz')

with zipfile.ZipFile(usdz_path, 'r') as z:
    for name in z.namelist():
        if name.startswith('textures/'):
            data = z.read(name)
            img = Image.open(io.BytesIO(data))
            print(f"Texture: {name}")
            print(f"  Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
            
            # Check a few pixel values to see if they are transparent or faded
            if img.mode == 'RGBA':
                pixels = list(img.getdata())
                alphas = [p[3] for p in pixels]
                min_alpha = min(alphas)
                max_alpha = max(alphas)
                print(f"  Alpha min/max: {min_alpha}/{max_alpha}")
                
                # Check color channel values (average RGB)
                rgbs = [p[:3] for p in pixels]
                avg_r = sum(p[0] for p in rgbs) / len(rgbs)
                avg_g = sum(p[1] for p in rgbs) / len(rgbs)
                avg_b = sum(p[2] for p in rgbs) / len(rgbs)
                print(f"  Average R/G/B: {avg_r:.2f}/{avg_g:.2f}/{avg_b:.2f}")
                
                # Check if there are any pixels with alpha < 255
                trans_count = sum(1 for a in alphas if a < 255)
                print(f"  Semi-transparent pixels: {trans_count}")
            elif img.mode == 'RGB':
                pixels = list(img.getdata())
                avg_r = sum(p[0] for p in pixels) / len(pixels)
                avg_g = sum(p[1] for p in pixels) / len(pixels)
                avg_b = sum(p[2] for p in pixels) / len(pixels)
                print(f"  Average R/G/B: {avg_r:.2f}/{avg_g:.2f}/{avg_b:.2f}")
