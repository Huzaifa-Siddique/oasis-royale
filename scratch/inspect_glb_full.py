import struct
import json
import os

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
path = os.path.join(cwd, 'public/models/extra_chocolate_marshmallow_cupcake.glb')

if not os.path.exists(path):
    print("Cupcake GLB does not exist!")
else:
    with open(path, 'rb') as f:
        # Read GLB header
        magic = f.read(4)
        version, length = struct.unpack('<II', f.read(8))
        print(f"GLB Version: {version}, Length: {length} bytes")
        
        # Read JSON chunk header
        chunk_length, chunk_type = struct.unpack('<II', f.read(8))
        print(f"Chunk length: {chunk_length}, Type: {chunk_type}")
        
        # Read JSON content
        json_data = f.read(chunk_length).decode('utf-8')
        gltf = json.loads(json_data)
        
        print("\n=== GLTF Materials JSON ===")
        print(json.dumps(gltf.get('materials', []), indent=2))
        
        print("\n=== GLTF Extensions Used ===")
        print(gltf.get('extensionsUsed', []))
        
        print("\n=== GLTF Textures JSON ===")
        print(json.dumps(gltf.get('textures', []), indent=2))
        
        print("\n=== GLTF Images JSON ===")
        print(json.dumps(gltf.get('images', []), indent=2))
