#!/usr/bin/env python3
"""
YSACC TANK CAD - Version Bumping Script
Usage:
    python bump_version.py 1.2.1
    python bump_version.py patch   # 1.2.0 -> 1.2.1
    python bump_version.py minor   # 1.2.0 -> 1.3.0
    python bump_version.py major   # 1.2.0 -> 2.0.0
"""
import sys
import re
import json
import subprocess

def bump_semver(current_ver, bump_type):
    parts = list(map(int, current_ver.split(".")))
    if bump_type == "patch":
        parts[2] += 1
    elif bump_type == "minor":
        parts[1] += 1
        parts[2] = 0
    elif bump_type == "major":
        parts[0] += 1
        parts[1] = 0
        parts[2] = 0
    else:
        return bump_type  # explicit version string
    return ".".join(map(str, parts))

def main():
    if len(sys.argv) < 2:
        print("Usage: python bump_version.py <patch|minor|major|X.Y.Z>")
        sys.exit(1)

    arg = sys.argv[1]

    # 1. Read package.json
    with open("package.json", "r", encoding="utf-8") as f:
        pkg = json.load(f)

    current_ver = pkg.get("version", "1.0.0")
    new_ver = bump_semver(current_ver, arg)

    print(f"[*] Bumping version: {current_ver} -> {new_ver}")

    # 2. Update package.json
    pkg["version"] = new_ver
    with open("package.json", "w", encoding="utf-8") as f:
        json.dump(pkg, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"[+] Updated package.json")

    # 3. Update web/index.src.html
    with open("web/index.src.html", "r", encoding="utf-8") as f:
        src = f.read()

    new_src = re.sub(
        r'<span class="ver-badge">v[\d\.]+.*?</span>',
        f'<span class="ver-badge">v{new_ver}</span>',
        src
    )
    with open("web/index.src.html", "w", encoding="utf-8") as f:
        f.write(new_src)
    print(f"[+] Updated web/index.src.html")

    # 4. Rebuild web/index.html & index.html
    subprocess.run([sys.executable, "build.py"], check=True)
    print(f"[+] Rebuilt web/index.html and root index.html")

    print(f"\n[OK] Version successfully bumped to v{new_ver}!")
    print(f"Next steps:")
    print(f"    git add .")
    print(f"    git commit -m \"chore(release): v{new_ver}\"")
    print(f"    git tag v{new_ver}")
    print(f"    git push origin main --tags")

if __name__ == "__main__":
    main()
