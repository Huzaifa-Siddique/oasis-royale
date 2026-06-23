import struct
import json
import os

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
models_dir = os.path.join(cwd, 'public/models')

for name in os.listdir(models_dir):
    if not name.endswith('.glb'):
        continue
    path = os.path.join(models_dir, name)
    try:
        with open(path, 'rb') as f:
            magic = f.read(4)
            if magic != b'glTF':
                continue
            version, length = struct.unpack('<II', f.read(8))
            chunk_length, chunk_type = struct.unpack('<II', f.read(8))
            json_data = f.read(chunk_length).decode('utf-8')
            gltf = json.loads(json_data)
            
            materials = gltf.get('materials', [])
            unlit_count = sum(1 for m in materials if 'extensions' in m and 'KHR_materials_unlit' in m['extensions'])
            
            if unlit_count > 0 or 'KHR_materials_unlit' in gltf.get('extensionsUsed', []):
                print(f"Model: {name} uses KHR_materials_unlit on {unlit_count}/{len(materials)} materials.")
    except Exception as e:
        print(f"Error checking {name}: {e}")
