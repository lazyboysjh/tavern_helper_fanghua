# -*- coding: utf-8 -*-
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parents[1]
IMAGE_ROOT = PROJECT / "人设图"
CDN_BASE = "https://testingcf.jsdelivr.net/gh/lazyboysjh/image@main/"

EXPECTED_ROLES = [
    "白氏", "董氏", "张氏", "卢氏", "王令君", "薛夫人", "朝云", "王玄姬", "郭太后",
    "羊徽瑜", "甄氏", "宪英", "费氏", "吴心", "潘淑", "柏氏", "吴氏", "诸葛氏",
    "夏侯徽", "金乡公主", "王元姬", "袁夫人", "蔡贞姬", "陆氏", "荀氏", "徐氏",
    "杨氏", "王夫人", "杜夫人", "朱夫人", "孙鲁班", "张春华", "阮氏", "令狐氏",
    "夏侯氏", "辛氏",
]

COVER_ROLES = ["张氏", "董氏", "王令君", "王玄姬", "卢氏", "朝云", "郭太后", "羊徽瑜", "潘淑"]


def image_sort_key(name):
    if name.endswith("_sfw_fengmian.png"):
        return (0, 0, name)
    match = re.search(r"_nsfw_(\d+)\.png$", name)
    if match:
        return (1, int(match.group(1)), name)
    return (2, 0, name)


def collect_images():
    roles = {}
    names = []
    for role_dir in IMAGE_ROOT.iterdir():
        if not role_dir.is_dir():
            continue
        files = sorted((p.name for p in role_dir.glob("*.png")), key=image_sort_key)
        roles[role_dir.name] = files
        names.extend(files)
    return roles, names


def extract_js_value(html, name):
    pattern = re.compile(rf"const {name} = (\[[\s\S]*?\]);\n\nconst OPENINGS")
    match = pattern.search(html)
    if not match:
        raise AssertionError(f"missing const {name}")
    return json.loads(match.group(1))


def extract_img_data(html):
    pattern = re.compile(r"var IMG_DATA = (\{[\s\S]*?\n\});\n\s*/\* __DWF_CHAR_ROSTER_END__ \*/")
    match = pattern.search(html)
    if not match:
        raise AssertionError("missing IMG_DATA block")
    return json.loads(match.group(1))


def test_image_filenames_are_globally_unique():
    _, names = collect_images()
    duplicates = sorted({name for name in names if names.count(name) > 1})
    assert duplicates == []
    assert not any(path.name.startswith("baishi_") for path in (IMAGE_ROOT / "柏氏").glob("*.png"))
    assert not any(path.name.startswith("lushi_") for path in (IMAGE_ROOT / "陆氏").glob("*.png"))


def test_status_gallery_covers_all_local_images():
    roles, _ = collect_images()
    status_html = (ROOT / "src/dawei/ui/status/index.html").read_text(encoding="utf-8")
    img_data = extract_img_data(status_html)

    assert list(img_data.keys()) == EXPECTED_ROLES
    for role in EXPECTED_ROLES:
        local_files = roles.get(role, [])
        entry_files = [item["file"] for item in img_data[role]]
        assert entry_files == local_files, role
        for item in img_data[role]:
            assert item["u"] == CDN_BASE + item["file"]
            assert item["need"] >= 0
            assert item["kind"] in {"sfw_cover", "nsfw"}


def test_cover_personas_have_lazy_cdn_images():
    cover_html = (ROOT / "src/dawei/ui/cover/index.html").read_text(encoding="utf-8")
    personas = extract_js_value(cover_html, "PERSONAS")
    assert [item["name"] for item in personas] == COVER_ROLES
    for item in personas:
        images = item["images"]
        assert len(images) == 2, item["name"]
        assert all(url.startswith(CDN_BASE) for url in images)
        assert images[0].endswith("_sfw_fengmian.png")


if __name__ == "__main__":
    tests = [
        test_image_filenames_are_globally_unique,
        test_status_gallery_covers_all_local_images,
        test_cover_personas_have_lazy_cdn_images,
    ]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
