import zipfile
import os

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
path = os.path.join(cwd, 'public/models/shawarma_deal-v2.usdz')

with zipfile.ZipFile(path, 'r') as z:
    usda = z.read("model.usda").decode("utf-8")
    idx = usda.find('def Material "Material_4"')
    if idx != -1:
        print(usda[idx:idx+3000])
    else:
        print("Material_4 not found")
