import zipfile
import os

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
path_fixed = os.path.join(cwd, 'public/models/extra_chocolate_marshmallow_cupcake.usdz')
path_bak = os.path.join(cwd, 'public/models/extra_chocolate_marshmallow_cupcake.usdz.bak')

def get_usda(path):
    if not os.path.exists(path):
        return None
    with zipfile.ZipFile(path, 'r') as z:
        return z.read("model.usda").decode("utf-8")

usda_fixed = get_usda(path_fixed)
usda_bak = get_usda(path_bak)

if usda_fixed and usda_bak:
    print("=== FIXED vs BACKUP comparison ===")
    
    # Check the lines that were changed or differences in PreviewSurface
    fixed_lines = usda_fixed.split('\n')
    bak_lines = usda_bak.split('\n')
    
    print("Fixed line count:", len(fixed_lines))
    print("Backup line count:", len(bak_lines))
    
    # Let's print the first PreviewSurface shader block in both
    def find_preview_surfaces(usda):
        import re
        return re.findall(r'def Shader "PreviewSurface"[^{}]*\{[^{}]*\}', usda)
    
    fixed_surfaces = find_preview_surfaces(usda_fixed)
    bak_surfaces = find_preview_surfaces(usda_bak)
    
    print("\n--- Backup PreviewSurfaces ---")
    for s in bak_surfaces[:3]:
        print(s)
        print("-" * 10)
        
    print("\n--- Fixed PreviewSurfaces ---")
    for s in fixed_surfaces[:3]:
        print(s)
        print("-" * 10)
else:
    print(f"Fixed exists: {os.path.exists(path_fixed)}, Backup exists: {os.path.exists(path_bak)}")
