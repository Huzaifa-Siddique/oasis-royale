import zipfile
import re
import os

cwd = 'd:/HUZAIFA/Oasis Royale.worktrees/agents-netlify-supabase-env-fix'
path = os.path.join(cwd, 'public/models/shawarma_deal-v2.usdz')

with zipfile.ZipFile(path, 'r') as z:
    text = z.read("model.usda").decode("utf-8")

# Normalize line endings
text = text.replace("\r\n", "\n")

# Find all PreviewSurface shader blocks
preview_surface_pattern = r'(def Shader "PreviewSurface"\s*\{([^{}]+)\})'
matches = list(re.finditer(preview_surface_pattern, text))

print(f"Found {len(matches)} PreviewSurface shaders.")

for match in matches:
    full_block = match.group(1)
    inner_content = match.group(2)
    start_pos = match.start()
    
    # Search backward for the material name
    mat_search_text = text[:start_pos]
    mat_matches = list(re.finditer(r'def Material "([^"]+)"', mat_search_text))
    if not mat_matches:
        print("Error: could not find parent material")
        continue
    mat_name = mat_matches[-1].group(1)
    
    print(f"\nParent Material: {mat_name}")
    
    # Extract diffuseColor connection or value
    diffuse_conn = re.search(r'color3f inputs:diffuseColor\.connect = </Materials/([^/]+)/Texture_(\w+)_diffuse\.outputs:rgb>', inner_content)
    diffuse_val = re.search(r'color3f inputs:diffuseColor\s*=\s*\(([^)]+)\)', inner_content)
    
    diffuse_line = ""
    if diffuse_conn:
        diff_mat = diffuse_conn.group(1)
        diff_id = diffuse_conn.group(2)
        diffuse_line = f"color3f inputs:diffuseColor.connect = </Materials/{diff_mat}/Texture_{diff_id}_diffuse.outputs:rgb>"
        print(f"  Diffuse texture connected: {diff_mat} / {diff_id}")
    elif diffuse_val:
        val = diffuse_val.group(1)
        diffuse_line = f"color3f inputs:diffuseColor = ({val})"
        print(f"  Diffuse flat color: ({val})")
    else:
        # Default fallback color
        diffuse_line = "color3f inputs:diffuseColor = (1, 1, 1)"
        print("  No diffuse found, using fallback (1, 1, 1)")
        
    # Extract opacity if present
    opacity_match = re.search(r'float inputs:opacity\s*=\s*([\d.]+)', inner_content)
    opacity_val = "1"
    if opacity_match:
        opacity_val = opacity_match.group(1)
        print(f"  Opacity: {opacity_val}")
        
    new_block = f'''def Shader "PreviewSurface"
		{{
			uniform token info:id = "UsdPreviewSurface"
			{diffuse_line}
			float inputs:roughness = 1
			float inputs:metallic = 0
			float inputs:opacity = {opacity_val}
			int inputs:useSpecularWorkflow = 0
			token outputs:surface
		}}'''
    print("  --- Generated Block ---")
    print(new_block)
