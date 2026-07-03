# -*- coding: utf-8 -*-
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parents[1]
IMAGE_ROOT = PROJECT / "人设图"
CDN_BASE = "https://testingcf.jsdelivr.net/gh/lazyboysjh/image@main/"

STATUS_ROLES = [
    "白氏", "董氏", "张氏", "卢氏", "王令君", "薛夫人", "朝云", "王玄姬", "郭太后",
    "羊徽瑜", "甄氏", "宪英", "费氏", "吴心", "潘淑", "柏氏", "吴氏", "诸葛氏",
    "夏侯徽", "金乡公主", "王元姬", "袁夫人", "蔡贞姬", "陆氏", "荀氏", "徐氏",
    "杨氏", "王夫人", "杜夫人", "朱夫人", "孙鲁班", "张春华", "阮氏", "令狐氏",
    "夏侯氏", "辛氏",
]

COVER_ROLES = ["郭太后", "羊徽瑜", "王令君", "王玄姬", "潘淑", "卢氏", "朝云", "张氏", "董氏"]

COVER_META = {
    "张氏": ("张", "嫂嫂 · 秦家庄持家", "脸饱满圆润，素衣白布巾；兄困清河时护小叔、劝仕心切。"),
    "董氏": ("董", "庄邻 · 王康之妻", "旧布粗衣，脖颈白净；麦田里添了几分鲜活气息。"),
    "王令君": ("令", "淮南王氏 · 婚约有议", "瓜子脸明艳如玉，礼法一丝不苟；扇子遮面时也难掩仪态。"),
    "王玄姬": ("玄", "王家幼女", "王家二姐，性情与令君迥异；淮南风声里常闻其名。"),
    "卢氏": ("卢", "太学故人 · 驿城", "声清脆语气好，清河案中或为兄长一线生机。"),
    "朝云": ("朝", "平康坊 · 剑舞", "婀娜柔韧似柳，剑舞时鼓急人目不敢离。"),
    "郭太后": ("郭", "永宁宫 · 皇太后", "才三十余岁，素雅清冷；宫门深闭，却仍牵动皇室法统。"),
    "羊徽瑜": ("羊", "泰山羊氏 · 士族女", "门第清贵，仪态端严；局势渐急时，常在礼法与自保之间取舍。"),
    "潘淑": ("潘", "江东后宫 · 神女之姿", "江东传闻里的明艳女子，后宫线由此铺开，柔媚中自有盘算。"),
}


def image_sort_key(path):
    name = path.name
    if name.endswith("_sfw_fengmian.png"):
        return (0, 0, name)
    match = re.search(r"_nsfw_(\d+)\.png$", name)
    if match:
        return (1, int(match.group(1)), name)
    return (2, 0, name)


def role_files(role):
    role_dir = IMAGE_ROOT / role
    if not role_dir.exists():
        return []
    return [p.name for p in sorted(role_dir.glob("*.png"), key=image_sort_key)]


def image_items(role):
    files = role_files(role)
    nsfw_files = [name for name in files if "_nsfw_" in name]
    if len(nsfw_files) <= 1:
        needs = [10]
    else:
        step = 90 / max(1, len(nsfw_files) - 1)
        needs = [int(round(10 + i * step)) for i in range(len(nsfw_files))]
        needs[-1] = 100

    nsfw_need = dict(zip(nsfw_files, needs))
    items = []
    for name in files:
        if name.endswith("_sfw_fengmian.png"):
            kind = "sfw_cover"
            need = 0
        else:
            kind = "nsfw"
            need = nsfw_need.get(name, 10)
        items.append({"file": name, "u": CDN_BASE + name, "need": need, "kind": kind})
    return items


def build_img_data():
    return {role: image_items(role) for role in STATUS_ROLES}


def build_personas(img_data):
    personas = []
    for role in COVER_ROLES:
        mark, role_text, copy = COVER_META[role]
        images = [item["u"] for item in img_data[role]]
        sfw = next((url for url in images if url.endswith("_sfw_fengmian.png")), images[0] if images else "")
        nsfw = next((url for url in images if "_nsfw_" in url), sfw)
        personas.append({"mark": mark, "name": role, "role": role_text, "copy": copy, "images": [sfw, nsfw]})
    return personas


def replace_status_img_data_in_file(path, img_data, required=True):
    text = path.read_text(encoding="utf-8")
    block = "var IMG_DATA = " + json.dumps(img_data, ensure_ascii=False, indent=12) + ";\n"
    text, count = re.subn(
        r"var IMG_DATA = \{[\s\S]*?\n\};\n\s*/\* __DWF_CHAR_ROSTER_END__ \*/",
        block + "        /* __DWF_CHAR_ROSTER_END__ */",
        text,
        count=1,
    )
    if count != 1 and required:
        raise RuntimeError(f"IMG_DATA block not found in {path}")
    if count != 1:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def replace_status_img_data(img_data):
    status_dir = ROOT / "src/dawei/ui/status"
    replace_status_img_data_in_file(status_dir / "index.html", img_data, required=True)
    replace_status_img_data_in_file(status_dir / "dwf-mvu.js", img_data, required=False)


def replace_cover_personas(personas):
    path = ROOT / "src/dawei/ui/cover/index.html"
    text = path.read_text(encoding="utf-8")
    block = "const PERSONAS = " + json.dumps(personas, ensure_ascii=False, indent=2) + ";\n"
    text = re.sub(r"const PERSONAS = \[[\s\S]*?\];\n\nconst OPENINGS", block + "\nconst OPENINGS", text, count=1)
    path.write_text(text, encoding="utf-8")


def main():
    img_data = build_img_data()
    replace_status_img_data(img_data)
    replace_cover_personas(build_personas(img_data))
    total = sum(len(items) for items in img_data.values())
    print(f"Injected {total} gallery image(s) for {len(img_data)} role(s).")
    print(f"CDN base: {CDN_BASE}")


if __name__ == "__main__":
    main()
