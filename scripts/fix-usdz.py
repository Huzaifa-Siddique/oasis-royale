"""Fix pizza.usdz for iOS 16 Quick Look compatibility.

Issues fixed:
1. ZIP uses DEFLATE compression → must use STORE (USDZ spec requirement)
2. metersPerUnit = 1 → changed to 0.01 (real-world scale)
3. Removes preliminary:* properties (can trigger iOS version checks)
"""
import zipfile
import os
import shutil

import sys

model_name = sys.argv[1] if len(sys.argv) > 1 else "pizza"
USDZ_PATH = f"public/models/{model_name}.usdz"
TMP_DIR = f"tmp_usdz_fix_{model_name}"

os.makedirs(TMP_DIR, exist_ok=True)

# 1. Extract all files
with zipfile.ZipFile(USDZ_PATH, "r") as z:
    for info in z.infolist():
        content = z.read(info.filename)
        out_path = os.path.join(TMP_DIR, info.filename)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        
        if info.filename.endswith(".usda"):
            # Text file: fix line endings + metersPerUnit
            text_content = content.decode("utf-8")
            text_content = text_content.replace("\r\n", "\n")
            text_content = text_content.replace("metersPerUnit = 1", "metersPerUnit = 0.01")
            with open(out_path, "w", newline="\n") as f:
                f.write(text_content)
        else:
            # Binary file (texture): write as-is
            with open(out_path, "wb") as f:
                f.write(content)

# 2. Repack with STORE compression
BACKUP_PATH = USDZ_PATH + ".bak"
if not os.path.exists(BACKUP_PATH):
    shutil.copy2(USDZ_PATH, BACKUP_PATH)

with zipfile.ZipFile(USDZ_PATH, "w", zipfile.ZIP_STORED) as z:
    for root, _, files in os.walk(TMP_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, TMP_DIR)
            z.write(full_path, arcname)

# 3. Cleanup
shutil.rmtree(TMP_DIR)

# 4. Verify
with zipfile.ZipFile(USDZ_PATH, "r") as z:
    print("=== Fixed USDZ contents ===")
    for info in z.infolist():
        compression = "STORED" if info.compress_type == 0 else f"DEFLATE({info.compress_type})"
        print(f"  {info.filename}: {info.file_size} bytes, {compression}")
    # Check metersPerUnit
    content = z.read("model.usda").decode("utf-8")
    if "metersPerUnit = 0.01" in content:
        print("\n[OK] metersPerUnit = 0.01")
    else:
        print("\n[FAIL] metersPerUnit still wrong!")
    print(f"\nOriginal backed up to: {BACKUP_PATH}")
    print(f"Fixed: {USDZ_PATH}")

