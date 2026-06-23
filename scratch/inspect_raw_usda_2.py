import zipfile
import os

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
path = os.path.join(cwd, 'public/models/shawarma_deal-v2.usdz')

with zipfile.ZipFile(path, 'r') as z:
    usda = z.read("model.usda").decode("utf-8")
    idx = usda.find('def Material "Material_2"')
    if idx != -1:
        # print 3000 characters from there
        print(usda[idx:idx+4000])
    else:
        print("Material_2 not found")
