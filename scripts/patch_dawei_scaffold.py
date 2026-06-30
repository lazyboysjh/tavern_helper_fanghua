# -*- coding: utf-8 -*-
"""一次性：将祝英台 UI 脚手架改为天可汗命名与 MVU 字段。"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / "src" / "dawei" / "ui"

OPENINGS_JS = """const OPENINGS = [
  {
    "no": "01",
    "swipe": 1,
    "title": "千福寺 · 佛前偶遇",
    "meta": ["日西", "千福寺", "宇文姬"],
    "summary": "景云二年日西斜，赴公主府问安尚早，入千福寺偶遇正在祈祷的宇文姬。"
  },
  {
    "no": "02",
    "swipe": 2,
    "title": "古寺巷 · 夜救蒙面女",
    "meta": ["夜", "古寺巷", "三娘"],
    "summary": "问安后家宴未成，夜归安邑坊，于古寺巷救下被追杀的蒙面女子。"
  },
  {
    "no": "03",
    "swipe": 3,
    "title": "大秦寺 · 雨中赠伞",
    "meta": ["雨", "大秦寺", "蒙小雨"],
    "summary": "春雨中的大秦寺，问安途中躲雨，赠伞予一名素不相识的秀丽女子。"
  },
  {
    "no": "04",
    "swipe": 4,
    "title": "公主府 · 雨中进言",
    "meta": ["雨", "镇国太平公主府", "太平公主"],
    "summary": "细雨中，于公主府回廊向太平公主进言：想尽一切办法，杀掉太子。"
  },
  {
    "no": "05",
    "swipe": 5,
    "title": "麟德殿 · 初见金城",
    "meta": ["端午", "大明宫", "金城公主"],
    "summary": "端午麟德殿宴前，初见金城公主，惊艳之余不慎踩住其裙摆。"
  },
  {
    "no": "06",
    "swipe": 6,
    "title": "卫国公府 · 裴娘暖阁",
    "meta": ["夜", "卫国公府", "裴娘"],
    "summary": "自氤氲斋归来后，于暖阁夜读；厨娘之女裴娘依庞二先前所传，夜来叩门。"
  },
  {
    "no": "07",
    "swipe": 7,
    "title": "氤氲斋 · 沐蒸审问",
    "meta": ["夜", "氤氲斋", "三娘"],
    "summary": "古寺巷救人之后，将蒙面女子带入氤氲斋，于烧石沐蒸的小木屋中审问其来历。"
  }
];"""

CHAR_BLOCK = """        var CHAR_ORDER = ['宇文姬', '三娘', '裴娘', '蒙小雨', '白无常', '金城公主', '程婷', '太平公主'];
        var CHAR_IDENTITY = {
            '宇文姬': '长安女神医 · 冯元俊未婚妻',
            '三娘': '宇文家收养之孤儿 · 女无常',
            '裴娘': '薛府厨娘之女 · 近侍',
            '蒙小雨': '水云间歌妓',
            '白无常': '宇文家暗线 · 白无常',
            '金城公主': '章怀太子孙女 · 宗室公主',
            '程婷': '太平公主府侍女',
            '太平公主': '镇国公主 · {{user}}生母'
        };

        var CHAR_META = {
            '宇文姬': { c: '#8b4513' },
            '三娘': { c: '#708090' },
            '裴娘': { c: '#cd853f' },
            '蒙小雨': { c: '#6a8caf' },
            '白无常': { c: '#c0c0c0' },
            '金城公主': { c: '#daa520' },
            '程婷': { c: '#9b7a9e' },
            '太平公主': { c: '#b22222' }
        };"""

IMG_DATA_STUB = """        var IMG_DATA = {
            "宇文姬": [],
            "三娘": [],
            "裴娘": [],
            "蒙小雨": [],
            "白无常": [],
            "金城公主": [],
            "程婷": [],
            "太平公主": []
        };"""

GALLERY_BLOCK = """        var GALLERY_ROLE_ORDER = ['宇文姬', '三娘', '裴娘', '蒙小雨', '白无常', '金城公主', '程婷', '太平公主'];
        var CORE_GALLERY_ROLES = { '宇文姬': true, '三娘': true, '裴娘': true, '蒙小雨': true, '白无常': true, '金城公主': true, '程婷': true, '太平公主': true };
        var ROLE_SLUG = { '宇文姬':'wenyu-ji', '三娘':'san-niang', '裴娘':'pei-niang', '蒙小雨':'meng-xiaoyu', '白无常':'bai-wuchang', '金城公主':'jin-cheng', '程婷':'cheng-ting', '太平公主':'tai-ping' };"""


def patch_file(path: Path, pairs: list[tuple[str, str]]):
    text = path.read_text(encoding="utf-8")
    orig = text
    for old, new in pairs:
        text = text.replace(old, new)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("patched", path.relative_to(ROOT))


def patch_all():
    common = [
        ("liangzhu-debug-v1", "dawei-debug-v1"),
        ("liangzhu-opts-mode-v4", "dawei-opts-mode-v4"),
        ("liangzhu-options-mobile-final", "dawei-options-mobile-final"),
        ("liangzhu-flip-v1", "dawei-flip-v1"),
        ("liangzhu micro-ui", "dawei micro-ui"),
        ("[梁祝:UI]", "[天可汗:UI]"),
        ("[梁祝封面]", "[天可汗封面]"),
        ("梁祝行动选项", "天可汗行动选项"),
        ("按足始知女儿身", "天可汗"),
        ("按足始知<span>女儿身</span>", "天可汗<span>卫国公</span>"),
        ("按足始知女儿身 · 舒筋堂推拿录", "天可汗 · 景云二年长安"),
        ("舒筋堂推拿录", "景云二年长安"),
        ("群芳谱", "粉黛录"),
        ("mnxImgUnlockV1", "dwfImgUnlockV1"),
        ("mnxAllUnlockV1", "dwfAllUnlockV1"),
        ("mnxCustomColorsV1", "dwfCustomColorsV1"),
        ("mnxUnlockStageV1", "dwfUnlockStageV1"),
        ("mnx_gallery:v1:", "dwf_gallery:v1:"),
        ("message_stat_data['祝英台']", "message_stat_data['粉黛录']"),
        ("stat_data['祝英台']", "stat_data['粉黛录']"),
        ("var charName = '梁祝'", "var charName = '天可汗'"),
        ("var LZ_STATUS_LOG = '[梁祝:UI][status]'", "var dwf_STATUS_LOG = '[天可汗:UI][status]'"),
    ]
    for p in UI.rglob("*"):
        if p.suffix in {".html", ".css", ".js"}:
            patch_file(p, common)

    status = UI / "status" / "index.html"
    text = status.read_text(encoding="utf-8")
    text = re.sub(r"var CHAR_ORDER = \[.*?\];\s*var CHAR_IDENTITY = \{[\s\S]*?\};\s*var CHAR_META = \{[\s\S]*?\};", CHAR_BLOCK, text, count=1)
    text = re.sub(
        r"var GALLERY_ROLE_ORDER = \[.*?\];\s*var CORE_GALLERY_ROLES = \{[\s\S]*?\};\s*var ROLE_SLUG = \{[\s\S]*?\};",
        GALLERY_BLOCK,
        text,
        count=1,
    )
    text = re.sub(r"var IMG_DATA = \{[\s\S]*?\n        \};", IMG_DATA_STUB, text, count=1)
    text = text.replace("LZ_STATUS_LOG", "dwf_STATUS_LOG")
    status.write_text(text, encoding="utf-8")
    print("patched status role blocks")

    cover = UI / "cover" / "index.html"
    ctext = cover.read_text(encoding="utf-8")
    ctext = re.sub(r"const OPENINGS = \[[\s\S]*?\];", OPENINGS_JS, ctext, count=1)
    cover.write_text(ctext, encoding="utf-8")
    print("patched cover OPENINGS")


if __name__ == "__main__":
    patch_all()
