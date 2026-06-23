import re

test_cases = [
    'def Shader "Texture_6_occlusion"\n{\n\tuniform token info:id = "UsdUVTexture"\n\tasset inputs:file = @textures/Texture_6_false.png@\n}',
    'def Shader "PrimvarReader_occlusion"\n{\n\tuniform token info:id = "UsdPrimvarReader_float2"\n}',
    'def Shader "Transform2d_occlusion"\n{\n\tuniform token info:id = "UsdTransform2d"\n}',
    'def Shader "Texture_5_emissive"\n{\n\tasset inputs:file = @textures/Texture_5_false.png@\n}'
]

pattern = r'def Shader "(Texture|PrimvarReader|Transform2d)(_\w+)?_(normal|roughness|metallic|occlusion|emissive)"\s*\{[^}]*\}'

for tc in test_cases:
    match = re.search(pattern, tc)
    if match:
        print(f"MATCHED: {match.group(0)}")
        replaced = re.sub(pattern, '', tc)
        print(f"REPLACED WITH: '{replaced}'")
    else:
        print(f"FAILED TO MATCH: {tc}")
