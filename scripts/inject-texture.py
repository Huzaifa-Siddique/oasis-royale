import zipfile, os, shutil, sys

usdz_path = sys.argv[1]
png_path = sys.argv[2]
output_path = sys.argv[3]

tmp_dir = os.path.join(os.environ.get('TEMP', '/tmp'), 'usdz_fix')
os.makedirs(tmp_dir, exist_ok=True)

with zipfile.ZipFile(usdz_path, 'r') as z:
    z.extractall(tmp_dir)

# Read USDA
usda_path = os.path.join(tmp_dir, 'model.usda')
with open(usda_path, 'r') as f:
    usda = f.read()

# Add texture dir
tex_dir = os.path.join(tmp_dir, 'textures')
os.makedirs(tex_dir, exist_ok=True)
shutil.copy(png_path, os.path.join(tex_dir, 'Texture_0.png'))

# Inject texture reference into the material block
old_mat = '''def Material "Material_2"
	{
		token outputs:surface.connect = </Materials/Material_2/PreviewSurface.outputs:surface>

		def Shader "PreviewSurface"
		{
			uniform token info:id = "UsdPreviewSurface"
			color3f inputs:diffuseColor = (1, 1, 1)
			float inputs:roughness = 1
			float inputs:metallic = 1
			float inputs:opacity = 1
			int inputs:useSpecularWorkflow = 0
			token outputs:surface
		}
	}'''

new_mat = '''def Material "Material_2"
	{
		token outputs:surface.connect = </Materials/Material_2/PreviewSurface.outputs:surface>

		def Shader "PreviewSurface"
		{
			uniform token info:id = "UsdPreviewSurface"
			color3f inputs:diffuseColor.connect = </Materials/Material_2/Texture_0.outputs:rgb>
			float inputs:roughness = 1
			float inputs:metallic = 0
			float inputs:opacity = 1
			int inputs:useSpecularWorkflow = 0
			token outputs:surface
		}

		def Shader "Texture_0"
		{
			uniform token info:id = "UsdUVTexture"
			asset inputs:file = @textures/Texture_0.png@
			float2 inputs:st.connect = </Materials/Material_2/uvReader_0.outputs:result>
			token inputs:wrapS = "repeat"
			token inputs:wrapT = "repeat"
			float outputs:r
			float outputs:g
			float outputs:b
			float3 outputs:rgb
		}

		def Shader "uvReader_0"
		{
			uniform token info:id = "UsdPrimvarReader_float2"
			token inputs:varname = "st"
			float2 outputs:result
		}
	}'''

if old_mat in usda:
    usda = usda.replace(old_mat, new_mat)
else:
    print("ERROR: Could not find material block in USDA")
    # Debug: show what's in the Materials section
    import re
    m = re.search(r'def "Materials".*?(?=\n\ndef|$)', usda, re.DOTALL)
    if m:
        print("Found materials section:")
        print(m.group(0)[:500])
    sys.exit(1)

with open(usda_path, 'w') as f:
    f.write(usda)

# Re-zip
with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zout:
    zout.write(usda_path, 'model.usda')
    geo_dir = os.path.join(tmp_dir, 'geometries')
    for fname in os.listdir(geo_dir):
        zout.write(os.path.join(geo_dir, fname), f'geometries/{fname}')
    zout.write(os.path.join(tex_dir, 'Texture_0.png'), 'textures/Texture_0.png')

print(f"Written {output_path}")
with zipfile.ZipFile(output_path, 'r') as z:
    for f in z.namelist():
        info = z.getinfo(f)
        print(f"  {f}: {info.file_size} bytes")

shutil.rmtree(tmp_dir)
