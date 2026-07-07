#!/usr/bin/env python3
"""OG 카드용 폰트 생성 — shared/fonts/PretendardVariable.woff2 → static ttf(400·700).

satori(next/og)는 woff2를 파싱하지 못한다(ttf/otf/woff만). 셀프호스트 Variable woff2를
라틴+한글 음절 전체로 subset한 static ttf로 변환해 shared/og/fonts/에 둔다.
빌드타임 전용 에셋이라 클라이언트 번들과 무관하다(design.md §2.2 — Pretendard 한 종).

의존성: fonttools, brotli.  실행: python3 scripts/build-og-fonts.py
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.subset import Subsetter, Options

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "shared/fonts/PretendardVariable.woff2")
OUT_DIR = os.path.join(ROOT, "shared/og/fonts")

# 한글 제목 100% 커버: 라틴 + 한글 자모/음절 전체 + 문장부호·화살표·기호. 한자 등은 제외.
RANGES = [(0x0020, 0x00FF), (0x1100, 0x11FF), (0x3130, 0x318F),
          (0xAC00, 0xD7A3), (0x2000, 0x206F), (0x2190, 0x21FF), (0x2500, 0x25FF)]
UNICODES = [cp for lo, hi in RANGES for cp in range(lo, hi + 1)]

os.makedirs(OUT_DIR, exist_ok=True)
for weight in (400, 700):
    font = instantiateVariableFont(TTFont(SRC), {"wght": weight}, inplace=False)
    opt = Options()
    opt.flavor = None            # woff2 아닌 순수 ttf
    opt.desubroutinize = True
    opt.name_IDs = ["*"]
    ss = Subsetter(options=opt)
    ss.populate(unicodes=UNICODES)
    ss.subset(font)
    font.flavor = None  # woff2에서 로드해 flavor가 woff2로 남으면 satori가 못 읽는다 → 순수 ttf로.
    out = os.path.join(OUT_DIR, f"Pretendard-{weight}.ttf")
    font.save(out)
    print(f"weight {weight}: {os.path.getsize(out) / 1024:.0f} KB -> {out}")
