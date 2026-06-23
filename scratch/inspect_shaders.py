import zipfile
import re
import os

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'

for name in ['shawarma_deal-v2', 'fruit_cream_cake']:
    path = os.path.join(cwd, 'public/models', f'{name}.usdz')
    if not os.path.exists(path):
        print(f"{name}.usdz does not exist")
        continue
    print(f"\n=== {name}.usdz Shaders ===")
    with zipfile.ZipFile(path, 'r') as z:
        usda = z.read("model.usda").decode("utf-8")
        shaders = re.findall(r'def Shader "([^"]+)"', usda)
        for s in shaders:
            print(f"  Shader: {s}")
