# -*- coding: utf-8 -*-
"""将 天可汗.json CDN 锁定到 tavern_helper_tiankehan 的指定 git ref（tag 或 commit）。"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CARD = Path(os.environ.get("TIANKEHAN_CARD_PATH", ROOT.parents[1] / "天可汗.json"))
REPO = os.environ.get("TIANKEHAN_CDN_REPO", "lazyboysjh/tavern_helper_tiankehan")


def latest_tag():
    out = subprocess.check_output(
        ["git", "ls-remote", "--tags", "--sort=-v:refname", f"https://github.com/{REPO}.git", "v*"],
        text=True,
        cwd=ROOT,
    )
    for line in out.splitlines():
        ref = line.split("\t")[-1].strip()
        if ref.endswith("^{}"):
            continue
        return ref.replace("refs/tags/", "")
    return ""


def main():
    ref = os.environ.get("TIANKEHAN_CDN_REF", "").strip()
    if not ref:
        ref = latest_tag()
    if not ref:
        print("FAIL: no tag found; set TIANKEHAN_CDN_REF", file=sys.stderr)
        sys.exit(1)
    env = {**os.environ, "TIANKEHAN_CDN_REF": ref, "TIANKEHAN_CARD_PATH": str(CARD)}
    subprocess.check_call([sys.executable, str(ROOT / "scripts" / "apply_cdn_loaders.py")], env=env, cwd=ROOT)
    print(f"Pinned 天可汗.json CDN to @{ref}")


if __name__ == "__main__":
    main()
