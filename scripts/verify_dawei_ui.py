# -*- coding: utf-8 -*-
"""验证大魏芳华 UI dist 与 大魏芳华.json CDN / 正则配置一致。"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "dawei" / "ui"
CARD = ROOT.parents[1] / "大魏芳华.json"
CDN_PREFIX = "lazyboysjh/tavern_helper_fanghua"
REQUIRED = [
    DIST / "cover" / "index.html",
    DIST / "status" / "index.html",
]


def fail(msg):
    print("FAIL:", msg)
    sys.exit(1)


def main():
    for p in REQUIRED:
        if not p.is_file():
            fail(f"missing {p.relative_to(ROOT)}")

    status = (DIST / "status" / "index.html").read_text(encoding="utf-8")
    for needle in (
        "dwf-main-nav",
        "dwf-panel-tianji",
        "dwf-panel-fangming",
        "dwfMvu",
        "dwf-tab-h",
        "getPinkBook",
        "getPinkBookFromStat",
        "renderActionOptionsPanel",
        "dwf-fengxin-stage",
    ):
        if needle not in status:
            fail(f"status missing {needle}")

    forbidden = ("ActionOptions>", "显示-行动选项栏美化", "显示-状态栏与选项栏排序")
    for token in forbidden:
        if token in status:
            fail(f"status still contains legacy token: {token}")

    if not CARD.is_file():
        fail(f"missing card {CARD}")

    card = json.loads(CARD.read_text(encoding="utf-8"))
    blob = json.dumps(card, ensure_ascii=False)
    if "liangzhu" in blob or "tavern_helper_template" in blob:
        fail("card still references liangzhu/template CDN")
    if CDN_PREFIX not in blob:
        fail("card missing fanghua CDN repo")
    if "dist/dawei/ui" not in blob:
        fail("card missing dist/dawei/ui path")
    if f"{CDN_PREFIX}@main" in blob:
        fail("card still uses @main CDN ref; run pin_cdn_ref.py")

    scripts = card["data"]["extensions"]["regex_scripts"]
    names = {r.get("scriptName") for r in scripts}
    for dropped in (
        "显示-行动选项栏美化",
        "显示-状态栏与选项栏排序",
        "显示-选项按钮属性净化",
    ):
        if dropped in names:
            fail(f"card still has dropped regex: {dropped}")

    order = next((r for r in scripts if r.get("scriptName") == "显示-状态栏排序"), None)
    if not order or order.get("replaceString") != "$1":
        fail('card sort regex must be 显示-状态栏排序 with replaceString "$1"')
    if order.get("findRegex") != "/(<StatusPlaceHolderImpl\\s*\\/>)/gim":
        fail("card sort regex must only match StatusPlaceHolderImpl")

    mvu_fmt = next(
        (
            e.get("content", "")
            for e in card["data"]["character_book"]["entries"]
            if e.get("comment") == "[mvu_update]变量输出格式"
        ),
        "",
    )
    if "勿输出 ActionOptions" not in mvu_fmt:
        fail("mvu format must forbid ActionOptions output")

    print("OK: dawei UI dist + card CDN verified")


if __name__ == "__main__":
    main()
