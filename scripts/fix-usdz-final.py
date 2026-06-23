import zipfile
import os
import shutil
import re
import sys

if len(sys.argv) < 2:
    print("Usage: python scripts/fix-usdz-final.py <model_name> [metersPerUnit] [roughness] [forceOpaque] [isUnlit]")
    sys.exit(1)

model_name = sys.argv[1]
USDZ_PATH = f"public/models/{model_name}.usdz"
TMP_DIR = f"tmp_usdz_final_{model_name}"

if not os.path.exists(USDZ_PATH):
    print(f"Error: {USDZ_PATH} does not exist!")
    sys.exit(1)

print(f"Applying final Quick Look compatibility fix to {USDZ_PATH}...")

os.makedirs(TMP_DIR, exist_ok=True)

# 1. Unzip the USDZ
with zipfile.ZipFile(USDZ_PATH, "r") as z:
    z.extractall(TMP_DIR)

# 2. Parse model.usda
model_usda_path = os.path.join(TMP_DIR, "model.usda")
if not os.path.exists(model_usda_path):
    print(f"Error: model.usda not found in {USDZ_PATH}!")
    shutil.rmtree(TMP_DIR)
    sys.exit(1)

with open(model_usda_path, "r", encoding="utf-8") as f:
    text = f.read()

# Normalize line endings
text = text.replace("\r\n", "\n")

# Fix metersPerUnit
meters_per_unit = "0.01"
if len(sys.argv) >= 3:
    meters_per_unit = sys.argv[2]
print(f"Setting metersPerUnit to {meters_per_unit}")
text = text.replace("metersPerUnit = 1", f"metersPerUnit = {meters_per_unit}")

# Get roughness value
roughness_val = "1.0"
if len(sys.argv) >= 4:
    roughness_val = sys.argv[3]
print(f"Setting roughness to {roughness_val}")

# Get forceOpaque option
force_opaque = False
if len(sys.argv) >= 5:
    force_opaque = sys.argv[4].lower() in ['true', '1', 'yes', 'force']
print(f"Force opaque: {force_opaque}")

# Get isUnlit option
is_unlit = False
if len(sys.argv) >= 6:
    is_unlit = sys.argv[5].lower() in ['true', '1', 'yes', 'unlit']
print(f"Is unlit: {is_unlit}")

# Fix color space to sRGB to prevent washed out colors
text = text.replace('sourceColorSpace = "raw"', 'sourceColorSpace = "sRGB"')

# Find all PreviewSurface shader blocks
preview_surface_pattern = r'(def Shader "PreviewSurface"\s*\{([^{}]+)\})'
matches = list(re.finditer(preview_surface_pattern, text))

keep_textures = set()

if matches:
    print(f"Found {len(matches)} PreviewSurface shaders to clean.")
    
    # Process in reverse order so replacement indices remain correct
    for match in reversed(matches):
        full_block = match.group(1)
        inner_content = match.group(2)
        start_pos = match.start()
        end_pos = match.end()
        
        # Search backward for the material name
        mat_search_text = text[:start_pos]
        mat_matches = list(re.finditer(r'def Material "([^"]+)"', mat_search_text))
        if not mat_matches:
            print("Warning: could not find parent material for PreviewSurface!")
            continue
        mat_name = mat_matches[-1].group(1)
        
        # Extract diffuseColor connection or value
        diffuse_conn = re.search(r'color3f inputs:diffuseColor\.connect = </Materials/([^/]+)/Texture_(\w+)_diffuse\.outputs:rgb>', inner_content)
        diffuse_val = re.search(r'color3f inputs:diffuseColor\s*=\s*\(([^)]+)\)', inner_content)
        
        diffuse_line = ""
        emissive_line = ""
        if is_unlit:
            diffuse_line = "color3f inputs:diffuseColor = (0, 0, 0)"
            roughness_val = "1.0" # Force roughness=1.0 to disable any specular reflections
            if diffuse_conn:
                diff_mat = diffuse_conn.group(1)
                diff_id = diffuse_conn.group(2)
                emissive_line = f"color3f inputs:emissiveColor.connect = </Materials/{diff_mat}/Texture_{diff_id}_diffuse.outputs:rgb>"
                
                # Keep the texture registered so it's not deleted from the USDZ package
                tex_pattern = r'def Shader "Texture_' + diff_id + r'_diffuse"\s*\{[^}]*asset inputs:file = @([^@]+)@'
                tex_file_match = re.search(tex_pattern, text)
                if tex_file_match:
                    diffuse_filename = tex_file_match.group(1)
                    keep_textures.add(os.path.basename(diffuse_filename))
                    print(f"Material {mat_name} is UNLIT: mapped texture to emissive: {diffuse_filename}")
                else:
                    print(f"Warning: Could not resolve diffuse texture file for unlit ID {diff_id}")
            elif diffuse_val:
                val = diffuse_val.group(1)
                emissive_line = f"color3f inputs:emissiveColor = ({val})"
                print(f"Material {mat_name} is UNLIT: mapped flat color to emissive: ({val})")
        else:
            if diffuse_conn:
                diff_mat = diffuse_conn.group(1)
                diff_id = diffuse_conn.group(2)
                diffuse_line = f"color3f inputs:diffuseColor.connect = </Materials/{diff_mat}/Texture_{diff_id}_diffuse.outputs:rgb>"
                
                # Find the filename of this diffuse texture to keep it
                tex_pattern = r'def Shader "Texture_' + diff_id + r'_diffuse"\s*\{[^}]*asset inputs:file = @([^@]+)@'
                tex_file_match = re.search(tex_pattern, text)
                if tex_file_match:
                    diffuse_filename = tex_file_match.group(1)
                    keep_textures.add(os.path.basename(diffuse_filename))
                    print(f"Material {mat_name} uses diffuse texture: {diffuse_filename}")
                else:
                    print(f"Warning: Could not resolve diffuse texture file for ID {diff_id}")
            elif diffuse_val:
                val = diffuse_val.group(1)
                diffuse_line = f"color3f inputs:diffuseColor = ({val})"
                print(f"Material {mat_name} uses flat diffuse color: ({val})")
            else:
                diffuse_line = "color3f inputs:diffuseColor = (1, 1, 1)"
                print(f"Material {mat_name} has no diffuse, using fallback (1, 1, 1)")
            
        # Extract opacity if present (could be a connection or a value)
        opacity_conn = re.search(r'(float inputs:opacity\.connect\s*=\s*</Materials/[^>]+>)', inner_content)
        opacity_val_match = re.search(r'float inputs:opacity\s*=\s*([\d.]+)', inner_content)
        
        opacity_line = ""
        if force_opaque:
            opacity_line = "float inputs:opacity = 1"
            print(f"Material {mat_name} opacity connection overridden (forced opaque)")
        elif opacity_conn:
            opacity_line = opacity_conn.group(1)
        elif opacity_val_match:
            opacity_line = f"float inputs:opacity = {opacity_val_match.group(1)}"
        else:
            opacity_line = "float inputs:opacity = 1"
            
        new_preview_surface = f'''def Shader "PreviewSurface"
		{{
			uniform token info:id = "UsdPreviewSurface"
			{diffuse_line}
			{emissive_line}
			float inputs:roughness = {roughness_val}
			float inputs:metallic = 0
			{opacity_line}
			int inputs:useSpecularWorkflow = 0
			token outputs:surface
		}}'''
        
        text = text[:start_pos] + new_preview_surface + text[end_pos:]

    # Clean up normal/roughness/metallic/occlusion/emissive shader definitions globally
    text = re.sub(r'def Shader "(Texture|PrimvarReader|Transform2d)(_\w+)?_(normal|roughness|metallic|occlusion|emissive)"\s*\{[^}]*\}', '', text)
    
    # Clean up extra texture files from the zip folder (keep only mapped diffuse textures)
    textures_dir = os.path.join(TMP_DIR, "textures")
    if os.path.exists(textures_dir):
        for file in os.listdir(textures_dir):
            if file not in keep_textures:
                print(f"Removing extra texture file: textures/{file}")
                full_file_path = os.path.join(textures_dir, file)
                if os.path.isfile(full_file_path):
                    os.remove(full_file_path)
else:
    print("Warning: No PreviewSurface shader definitions found in model.usda")

# Write model.usda back
with open(model_usda_path, "w", newline="\n", encoding="utf-8") as f:
    f.write(text)

# 3. Create a backup of the original USDZ
BACKUP_PATH = USDZ_PATH + ".bak"
shutil.copy2(USDZ_PATH, BACKUP_PATH)
print(f"Saved backup: {BACKUP_PATH}")

# 4. Repack with STORE compression (MANDATORY for USDZ spec)
if os.path.exists(USDZ_PATH):
    os.remove(USDZ_PATH)

with zipfile.ZipFile(USDZ_PATH, "w", zipfile.ZIP_STORED) as z:
    for root, _, files in os.walk(TMP_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, TMP_DIR)
            z.write(full_path, arcname)

# 5. Cleanup temp folder
shutil.rmtree(TMP_DIR)

print(f"Fixed USDZ successfully: {USDZ_PATH}\n")
