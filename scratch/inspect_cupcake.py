import zipfile
import os

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
path = os.path.join(cwd, 'public/models/extra_chocolate_marshmallow_cupcake.usdz')

if not os.path.exists(path):
    print("Cupcake USDZ does not exist!")
else:
    print("=== Cupcake USDA inspection ===")
    with zipfile.ZipFile(path, 'r') as z:
        usda = z.read("model.usda").decode("utf-8")
        
        # print some properties of model.usda
        print("Length of USDA:", len(usda))
        
        # Find and print PreviewSurface shaders and material blocks
        print("\n--- Material & Shader blocks ---")
        lines = usda.split('\n')
        # Let's print sections containing PreviewSurface and Material
        for i, line in enumerate(lines):
            if 'def Material' in line or 'def Shader "PreviewSurface"' in line or 'asset inputs:file =' in line or 'sourceColorSpace' in line:
                # Print from i-2 to i+15
                print(f"--- Line {i} ---")
                start = max(0, i-2)
                end = min(len(lines), i+15)
                print('\n'.join(lines[start:end]))
                print('-'*20)
