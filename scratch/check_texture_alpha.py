import struct
import json
import os
from PIL import Image
import io

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
glb_path = os.path.join(cwd, 'public/models/extra_chocolate_marshmallow_cupcake.glb')

with open(glb_path, 'rb') as f:
    f.read(4) # magic
    struct.unpack('<II', f.read(8)) # version, length
    chunk_length, chunk_type = struct.unpack('<II', f.read(8))
    json_data = f.read(chunk_length).decode('utf-8')
    gltf = json.loads(json_data)
    
    # Read binary chunk
    bin_chunk_length, bin_chunk_type = struct.unpack('<II', f.read(8))
    bin_data = f.read(bin_chunk_length)
    
    buffer_views = gltf.get('bufferViews', [])
    images = gltf.get('images', [])
    
    print("=== Texture Alpha Channel Inspection ===")
    for idx, img_info in enumerate(images):
        bv_idx = img_info.get('bufferView')
        bv = buffer_views[bv_idx]
        offset = bv.get('byteOffset', 0)
        length = bv.get('byteLength')
        
        img_bytes = bin_data[offset:offset+length]
        
        # Load image with PIL
        img = Image.open(io.BytesIO(img_bytes))
        print(f"\nImage {idx}: format={img.format}, size={img.size}, mode={img.mode}")
        
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            # Check if there is actual transparency
            alpha = img.split()[-1]
            extrema = alpha.getextrema()
            print(f"  Alpha channel min/max: {extrema}")
            # Count pixels that are semi-transparent
            alpha_data = list(alpha.getdata())
            transparent_count = sum(1 for val in alpha_data if val < 255)
            print(f"  Semi-transparent pixels: {transparent_count} out of {len(alpha_data)} ({transparent_count/len(alpha_data)*100:.2f}%)")
        else:
            print("  No alpha channel (completely opaque)")
