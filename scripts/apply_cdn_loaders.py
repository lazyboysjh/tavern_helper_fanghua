# -*- coding: utf-8 -*-
"""将 天可汗.json 的正则/first_mes 指向本仓库 dist/tiankehan/ui CDN。

大魏芳华请使用仓库根目录 build_dawei_card.py；本脚本仅服务天可汗卡。
行动选项栏相关正则（显示-行动选项栏美化 等）已废弃，勿再写入。
"""
import json
import os
import re
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CARD_PATH = Path(os.environ.get("TIANKEHAN_CARD_PATH", ROOT.parents[1] / "天可汗.json"))
GITHUB_REPO = os.environ.get("TIANKEHAN_CDN_REPO", "lazyboysjh/tavern_helper_tiankehan")
GITHUB_REF = os.environ.get("TIANKEHAN_CDN_REF", "main")
CDN = f"https://testingcf.jsdelivr.net/gh/{GITHUB_REPO}@{GITHUB_REF}/dist/tiankehan/ui"
V = f"?v={int(time.time())}"

STATUS_SHELL = f"""```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>
<body style="margin:0;padding:0;background:transparent;">
<script>
$('body').load('{CDN}/status/index.html{V}');
</script>
</body>
</html>
```"""

COVER_SHELL = f"""```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>
<body style="margin:0;padding:0;background:transparent;">
<script>
$('body').load('{CDN}/cover/index.html{V}');
</script>
</body>
</html>
```"""

ORDER_REPLACE = "$3\n$1$2"

OPTIONS_SHELL = f"""```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>天可汗行动选项</title>
<link rel="stylesheet" href="{CDN}/options/styles.css{V}">
</head>
<body style="margin:0;padding:0;background:transparent;">
<div class="mnx-opts-wrap" data-mnx-inline="1">
<div class="mnx-opts-head"><span class="mnx-opts-head-core"><span class="mnx-opts-title">行动抉择</span><button type="button" class="mnx-mode-btn">直接发送</button></span></div>
$1
</div>
<script src="{CDN}/options/controller.js{V}"></script>
</body>
</html>
```"""


def split_options(html: str):
    m = re.search(r"<style>([\s\S]*?)</style>", html)
    if not m:
        raise SystemExit("options: no style block")
    css = m.group(1).strip()
    m2 = re.search(
        r'<div class="mnx-opts-wrap"[^>]*>\s*<div class="mnx-opts-head">[\s\S]*?</div>\$1<script>([\s\S]*?)</script>',
        html,
    )
    if not m2:
        raise SystemExit("options: no controller script block")
    return css, m2.group(1).strip()


def main():
    opt_html = (ROOT / "src/tiankehan/ui/options/index.html").read_text(encoding="utf-8")
    css, _ = split_options(opt_html)
    js = (ROOT / "src/tiankehan/ui/options/controller.js").read_text(encoding="utf-8").strip()
    out = ROOT / "src/tiankehan/ui/options"
    (out / "styles.css").write_text(css + "\n", encoding="utf-8")
    (out / "controller.js").write_text(js + "\n", encoding="utf-8")
    print(f"Wrote options styles.css ({len(css)} chars)")
    print(f"Wrote options controller.js ({len(js)} chars)")

    card = json.loads(CARD_PATH.read_text(encoding="utf-8"))
    card["first_mes"] = COVER_SHELL
    data = card["data"]
    data["first_mes"] = COVER_SHELL
    for r in data["extensions"]["regex_scripts"]:
        if r["scriptName"] == "显示-状态栏与选项栏排序":
            r["scriptName"] = "显示-状态栏排序"
            r["replaceString"] = "$1"
            r["findRegex"] = "/(<StatusPlaceHolderImpl\\s*\\/>)/gim"
        elif r["scriptName"] == "显示-状态栏排序":
            r["replaceString"] = "$1"
        elif r["scriptName"] == "显示-状态栏美化":
            r["replaceString"] = STATUS_SHELL
        elif "replaceString" in r and "dist/tiankehan/ui/status" in r["replaceString"]:
            r["replaceString"] = STATUS_SHELL
        elif "replaceString" in r and "dist/tiankehan/ui/cover" in r["replaceString"]:
            r["replaceString"] = COVER_SHELL
        elif "replaceString" in r and "dist/liangzhu/ui" in r["replaceString"]:
            r["replaceString"] = r["replaceString"].replace(
                "lazyboysjh/tavern_helper_template@695b517/dist/liangzhu/ui",
                f"{GITHUB_REPO}@{GITHUB_REF}/dist/tiankehan/ui",
            ).replace(
                "lazyboysjh/tavern_helper_template@main/dist/liangzhu/ui",
                f"{GITHUB_REPO}@{GITHUB_REF}/dist/tiankehan/ui",
            )
        if "findRegex" in r and "dist/liangzhu/ui" in r["findRegex"]:
            r["findRegex"] = r["findRegex"].replace("dist/liangzhu/ui", "dist/tiankehan/ui")
        elif "findRegex" in r and "dist\\/liangzhu\\/ui" in r["findRegex"]:
            r["findRegex"] = r["findRegex"].replace("dist\\/liangzhu\\/ui", "dist\\/tiankehan\\/ui")

    CARD_PATH.write_text(json.dumps(card, ensure_ascii=False, indent=4), encoding="utf-8")
    print(f"Updated {CARD_PATH.name}")
    print("CDN:", CDN)


if __name__ == "__main__":
    main()
