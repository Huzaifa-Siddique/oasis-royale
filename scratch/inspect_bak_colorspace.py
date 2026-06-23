import zipfile
import os

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
path = os.path.join(cwd, 'public/models/extra_chocolate_marshmallow_cupcake.usdz.bak')

if os.path.exists(path):
    print("=== Backup USDZ texture color spaces ===")
    with zipfile.ZipFile(path, 'r') as z:
        usda = z.read("model.usda").decode("utf-8")
        for line in usda.split('\n'):
            if 'sourceColorSpace' in line or 'inputs:file' in line or 'def Shader "Texture_' in line:
                print(line.strip())
else:
    print("Backup does not exist!")
