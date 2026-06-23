import zipfile
import os

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
path = os.path.join(cwd, 'public/models/shawarma_deal-v2.usdz')

with zipfile.ZipFile(path, 'r') as z:
    usda = z.read("model.usda").decode("utf-8")
    # find first Material definition
    idx = usda.find('def Material')
    if idx != -1:
        print(usda[idx:idx+1500])
    else:
        print("Material not found")
