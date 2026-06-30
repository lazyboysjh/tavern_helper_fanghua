# -*- coding: utf-8 -*-
"""验证天可汗 UI dist 与 天可汗.json CDN 路径一致。"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "dawei" / "ui"
CARD = ROOT.parents[1] / "天可汗.json"
CDN_PREFIX = "lazyboysjh/tavern_helper_dawei"
REQUIRED = [
    DIST / "cover" / "index.html",
    DIST / "status" / "index.html",
    DIST / "options" / "styles.css",
    DIST / "options" / "controller.js",
]


def fail(msg):
    print("FAIL:", msg)
    sys.exit(1)


def main():
    for p in REQUIRED:
        if not p.is_file():
            fail(f"missing {p.relative_to(ROOT)}")

    status = (DIST / "status" / "index.html").read_text(encoding="utf-8")
    for needle in ("dwf-main-nav", "dwf-panel-tianji", "dwf-panel-fangming", "dwf-panel-zisi", "dwfMvu", "粉黛录"):
        if needle not in status:
            fail(f"status missing {needle}")

    card = json.loads(CARD.read_text(encoding="utf-8"))
    blob = json.dumps(card, ensure_ascii=False)
    if "liangzhu" in blob or "tavern_helper_template" in blob:
        fail("card still references liangzhu/template CDN")
    if CDN_PREFIX not in blob:
        fail("card missing dawei CDN repo")
    if "dist/dawei/ui" not in blob:
        fail("card missing dist/dawei/ui path")
    if f"{CDN_PREFIX}@main" in blob:
        fail("card still uses @main CDN ref; run pin_cdn_ref.py")

    order = next(
        (r for r in card["data"]["extensions"]["regex_scripts"] if r.get("scriptName") == "显示-状态栏与选项栏排序"),
        None,
    )
    if not order or order.get("replaceString") != "$3\n$1$2":
        fail("card sort regex must keep ActionOptions ($3\\n$1$2)")

    print("OK: dawei UI dist + card CDN verified")


if __name__ == "__main__":
    main()
