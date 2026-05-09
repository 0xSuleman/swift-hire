from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape
import datetime as dt
import math
import textwrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "SDA-Team-1-Deliverable-3.docx"
ASSET_DIR = ROOT / "generated"
BUILD_DIR = ROOT / "ooxml_build"
ASSET_DIR.mkdir(exist_ok=True)
BUILD_DIR.mkdir(exist_ok=True)

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
BLUE = BLACK
LIGHT_BLUE = WHITE
LIGHT_GREEN = WHITE
LIGHT_YELLOW = WHITE
LIGHT_GRAY = WHITE
MID_GRAY = BLACK
DARK = BLACK

PAGE_W = 12240
PAGE_H = 15840
MARGIN_TOP = 1080
MARGIN_RIGHT = 1152
MARGIN_BOTTOM = 1008
MARGIN_LEFT = 1152
CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT


def font(size=30, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


FONT_22 = font(22)
FONT_24 = font(24)
FONT_28_B = font(28, True)
FONT_32_B = font(32, True)
FONT_36_B = font(36, True)


def wrap_lines(draw, text, fnt, max_width):
    lines = []
    for raw in text.split("\n"):
        words = raw.split()
        if not words:
            lines.append("")
            continue
        line = words[0]
        for word in words[1:]:
            test = f"{line} {word}"
            if draw.textbbox((0, 0), test, font=fnt)[2] <= max_width:
                line = test
            else:
                lines.append(line)
                line = word
        lines.append(line)
    return lines


def center_text(draw, box, text, fnt, fill=DARK, line_gap=8):
    x1, y1, x2, y2 = box
    lines = wrap_lines(draw, text, fnt, x2 - x1 - 28)
    heights = [draw.textbbox((0, 0), line, font=fnt)[3] for line in lines]
    total_h = sum(heights) + line_gap * (len(lines) - 1)
    y = y1 + ((y2 - y1) - total_h) / 2
    for line, h in zip(lines, heights):
        tw = draw.textbbox((0, 0), line, font=fnt)[2]
        draw.text((x1 + ((x2 - x1) - tw) / 2, y), line, font=fnt, fill=fill)
        y += h + line_gap


def draw_box(draw, box, text, fill=WHITE, outline=BLACK, radius=0, fnt=FONT_24, width=3):
    draw.rectangle(box, fill=fill, outline=outline, width=width)
    center_text(draw, box, text, fnt)


def arrow(draw, start, end, color=BLACK, width=4):
    draw.line([start, end], fill=color, width=width)
    sx, sy = start
    ex, ey = end
    dx, dy = ex - sx, ey - sy
    if dx == 0 and dy == 0:
        return
    ang = math.atan2(dy, dx)
    size = 18
    pts = [
        (ex, ey),
        (ex - size * math.cos(ang - math.pi / 6), ey - size * math.sin(ang - math.pi / 6)),
        (ex - size * math.cos(ang + math.pi / 6), ey - size * math.sin(ang + math.pi / 6)),
    ]
    draw.polygon(pts, fill=color)


def double_arrow(draw, start, end, color=BLACK, width=4):
    arrow(draw, start, end, color=color, width=width)
    arrow(draw, end, start, color=color, width=width)


def label(draw, xy, text, fnt=FONT_22, fill=BLACK):
    draw.text(xy, text, font=fnt, fill=fill)


def build_arcd():
    img = Image.new("RGB", (1800, 1150), "white")
    d = ImageDraw.Draw(img)
    d.text((70, 45), "Architecture Context Diagram (ArCD) - Swift Hire", font=FONT_36_B, fill=BLACK)
    d.text((70, 92), "Box-and-arrow context view; external actors and systems around Swift Hire.", font=FONT_24, fill=BLACK)

    boundary = (540, 245, 1260, 840)
    d.rectangle(boundary, outline=BLACK, width=3)
    d.text((565, 260), "System Boundary", font=FONT_22, fill=BLACK)

    system = (635, 380, 1165, 705)
    draw_box(d, system, "Swift Hire System\nReact Web UI\nSpring Boot REST API\nMySQL Repository", fnt=FONT_32_B)

    boxes = {
        "Candidate\nCV, preferences,\njob search": (90, 230, 430, 390),
        "Employer\nPrompt, candidates,\nscheduling": (90, 700, 430, 860),
        "Admin\nUsers, reports,\nanalytics": (1370, 230, 1710, 390),
        "SMTP Mail Server\nEmails and reminders": (1370, 700, 1710, 860),
        "Jitsi Meet\nInterview link": (730, 935, 1070, 1055),
    }
    for text, box in boxes.items():
        draw_box(d, box, text, fnt=FONT_24)

    double_arrow(d, (430, 310), (635, 455), width=4)
    label(d, (245, 410), "HTTPS request/response")
    double_arrow(d, (430, 780), (635, 630), width=4)
    label(d, (245, 885), "HTTPS request/response")
    double_arrow(d, (1370, 310), (1165, 455), width=4)
    label(d, (1290, 410), "Admin request/response")
    arrow(d, (1165, 630), (1370, 780), width=4)
    label(d, (1255, 890), "Email notification")
    arrow(d, (900, 705), (900, 935), width=4)
    label(d, (935, 810), "Meeting link")

    out = ASSET_DIR / "deliverable_3_arcd.png"
    img.save(out)
    return out


def build_ba():
    img = Image.new("RGB", (1900, 1250), "white")
    d = ImageDraw.Draw(img)
    d.text((70, 45), "Box and Arrow Design Notation - Swift Hire", font=FONT_36_B, fill=BLACK)
    d.text((70, 92), "Boxes = components; arrows = control/data flow.", font=FONT_24, fill=BLACK)

    # Layer boundaries are plain outlined boxes; component boxes remain unfilled.
    layers = [
        (110, 160, 1790, 300, "Presentation Layer"),
        (110, 340, 1790, 500, "API / Security Layer"),
        (110, 545, 1790, 805, "Business Service Layer"),
        (110, 855, 1790, 970, "Data Access Layer"),
        (110, 1020, 1790, 1175, "Repository / External Systems"),
    ]
    for x1, y1, x2, y2, title in layers:
        d.rectangle((x1, y1, x2, y2), outline=BLACK, width=2)
        d.text((x1 + 20, y1 + 14), title, font=FONT_28_B, fill=BLACK)

    draw_box(d, (700, 190, 1200, 275), "React Web Client\nCandidate | Employer | Admin", fnt=FONT_24)
    draw_box(d, (360, 385, 820, 470), "Spring Security + JWT\nAuthentication | RBAC", fnt=FONT_24)
    draw_box(d, (1080, 385, 1540, 470), "REST Controllers\nAuth | Jobs | Schedule | Admin", fnt=FONT_24)

    service_group = (255, 595, 1645, 760)
    d.rectangle(service_group, outline=BLACK, width=3)
    d.text((280, 608), "Business Services", font=FONT_28_B, fill=BLACK)
    service_boxes = [
        (290, 655, 500, 735, "Auth\nService"),
        (535, 655, 745, 735, "Candidate\nService"),
        (780, 655, 990, 735, "Job + ATS\nService"),
        (1025, 655, 1235, 735, "Scheduling\nService"),
        (1270, 655, 1480, 735, "Admin / Review\nAnalytics"),
    ]
    for x1, y1, x2, y2, text in service_boxes:
        draw_box(d, (x1, y1, x2, y2), text, fnt=FONT_22, width=2)

    draw_box(d, (735, 885, 1165, 950), "Spring Data JPA Repositories", fnt=FONT_24)
    draw_box(d, (510, 1060, 760, 1140), "CV File Storage", fnt=FONT_24)
    draw_box(d, (820, 1060, 1140, 1140), "MySQL Database\nswift_hire", fnt=FONT_24)
    draw_box(d, (1250, 1060, 1530, 1140), "SMTP Mail Server", fnt=FONT_24)
    draw_box(d, (1580, 1060, 1760, 1140), "Jitsi Meet", fnt=FONT_24)

    arrow(d, (950, 275), (590, 385), width=4)
    arrow(d, (820, 428), (1080, 428), width=4)
    arrow(d, (1310, 470), (1310, 595), width=4)
    arrow(d, (950, 760), (950, 885), width=4)
    arrow(d, (950, 950), (950, 1060), width=4)
    arrow(d, (640, 735), (640, 1060), width=3)
    arrow(d, (1235, 700), (1390, 1060), width=3)
    arrow(d, (1235, 690), (1670, 1060), width=3)

    label(d, (990, 305), "HTTPS / JSON")
    label(d, (1025, 815), "Repository calls")

    out = ASSET_DIR / "deliverable_3_box_arrow.png"
    img.save(out)
    return out


def t(text):
    return escape(str(text), quote=False)


def r(text, bold=False, size=24):
    b = "<w:b/>" if bold else ""
    return f'<w:r><w:rPr>{b}<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="{size}"/></w:rPr><w:t xml:space="preserve">{t(text)}</w:t></w:r>'


def p(text="", style=None, align=None, bold=False, size=24, before=0, after=120, line=259):
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        ppr.append(f'<w:jc w:val="{align}"/>')
    ppr.append(f'<w:spacing w:before="{before}" w:after="{after}" w:line="{line}" w:lineRule="auto"/>')
    return f"<w:p><w:pPr>{''.join(ppr)}</w:pPr>{r(text, bold=bold, size=size)}</w:p>"


def p_runs(runs, style=None, align=None, before=0, after=120):
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        ppr.append(f'<w:jc w:val="{align}"/>')
    ppr.append(f'<w:spacing w:before="{before}" w:after="{after}" w:line="259" w:lineRule="auto"/>')
    return f"<w:p><w:pPr>{''.join(ppr)}</w:pPr>{''.join(runs)}</w:p>"


def tab_run():
    return "<w:r><w:tab/></w:r>"


def br_page():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def sect_pr(header=None, footer=None, page_start=None, page_fmt=None):
    refs = ""
    if header:
        refs += f'<w:headerReference w:type="default" r:id="{header}"/>'
    if footer:
        refs += f'<w:footerReference w:type="default" r:id="{footer}"/>'
    pg_num = ""
    if page_start is not None:
        fmt = f' w:fmt="{page_fmt}"' if page_fmt else ""
        pg_num = f'<w:pgNumType w:start="{page_start}"{fmt}/>'
    return (
        f"<w:sectPr>{refs}{pg_num}"
        f'<w:pgSz w:w="{PAGE_W}" w:h="{PAGE_H}"/>'
        f'<w:pgMar w:top="{MARGIN_TOP}" w:right="{MARGIN_RIGHT}" w:bottom="{MARGIN_BOTTOM}" '
        f'w:left="{MARGIN_LEFT}" w:header="720" w:footer="720" w:gutter="0"/>'
        "</w:sectPr>"
    )


def section_break(section_xml):
    return f"<w:p><w:pPr>{section_xml}</w:pPr></w:p>"


def image_para(rid, img_path, width_inches, caption=False):
    img = Image.open(img_path)
    height_inches = width_inches * (img.height / img.width)
    cx = int(width_inches * 914400)
    cy = int(height_inches * 914400)
    doc_pr_id = "1" if "arcd" in img_path.name else "2"
    drawing = f"""
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="{cx}" cy="{cy}"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        <wp:docPr id="{doc_pr_id}" name="{t(img_path.name)}"/>
        <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>
              <pic:nvPicPr><pic:cNvPr id="0" name="{t(img_path.name)}"/><pic:cNvPicPr/></pic:nvPicPr>
              <pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
              <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
    """
    return f'<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr><w:r>{drawing}</w:r></w:p>'


def table(rows, widths, header=True):
    border = (
        '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="808080"/>'
        '<w:left w:val="single" w:sz="4" w:space="0" w:color="808080"/>'
        '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="808080"/>'
        '<w:right w:val="single" w:sz="4" w:space="0" w:color="808080"/>'
        '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="A0A0A0"/>'
        '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="A0A0A0"/></w:tblBorders>'
    )
    tbl = [f'<w:tbl><w:tblPr><w:tblW w:w="{sum(widths)}" w:type="dxa"/><w:tblInd w:w="0" w:type="dxa"/><w:tblLayout w:type="fixed"/>{border}</w:tblPr>']
    tbl.append("<w:tblGrid>" + "".join(f'<w:gridCol w:w="{w}"/>' for w in widths) + "</w:tblGrid>")
    for row_idx, row in enumerate(rows):
        trpr = "<w:trPr><w:tblHeader w:val=\"true\"/></w:trPr>" if row_idx == 0 and header else ""
        tbl.append(f"<w:tr>{trpr}")
        for col_idx, cell in enumerate(row):
            fill = '<w:shd w:fill="E8EEF7"/>' if row_idx == 0 and header else ""
            jc = "center" if col_idx == 0 else "left"
            bold = row_idx == 0 and header
            size = 20 if row_idx == 0 else 18
            tcpr = (
                f'<w:tcPr><w:tcW w:w="{widths[col_idx]}" w:type="dxa"/>{fill}'
                '<w:tcMar><w:top w:w="100" w:type="dxa"/><w:start w:w="120" w:type="dxa"/>'
                '<w:bottom w:w="100" w:type="dxa"/><w:end w:w="120" w:type="dxa"/></w:tcMar>'
                '<w:vAlign w:val="center"/></w:tcPr>'
            )
            paras = []
            wrapped = textwrap.wrap(str(cell), width=70 if col_idx == 2 else 35) or [""]
            for line in wrapped:
                paras.append(p(line, align=jc, bold=bold, size=size, after=0))
            tbl.append(f"<w:tc>{tcpr}{''.join(paras)}</w:tc>")
        tbl.append("</w:tr>")
    tbl.append("</w:tbl>")
    return "".join(tbl)


def header_xml():
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:tabs><w:tab w:val="center" w:pos="4680"/><w:tab w:val="right" w:pos="9360"/></w:tabs>
      <w:spacing w:after="0"/>
    </w:pPr>
    {r("Team 1", size=20)}<w:r><w:tab/></w:r>{r("Swift Hire", size=20)}<w:r><w:tab/></w:r>{r("Phase 3", size=20)}
  </w:p>
</w:hdr>"""


def footer_xml(page_field=False, roman=False):
    page = r("ii", size=20) if roman else (
        '<w:r><w:fldChar w:fldCharType="begin"/></w:r>'
        '<w:r><w:instrText xml:space="preserve">PAGE</w:instrText></w:r>'
        '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
    )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:tabs><w:tab w:val="right" w:pos="9360"/></w:tabs>
      <w:spacing w:after="0"/>
    </w:pPr>
    {r("Spring 2026", size=20)}<w:r><w:tab/></w:r>{r("Page ", size=20)}{page}
  </w:p>
</w:ftr>"""


def styles_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="0" w:after="160"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
</w:styles>"""


def content_types_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/word/footer2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>"""


def root_rels_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""


def document_rels_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
  <Relationship Id="rIdFooter2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/>
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/deliverable_3_arcd.png"/>
  <Relationship Id="rIdImage2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/deliverable_3_box_arrow.png"/>
</Relationships>"""


def core_xml():
    now = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>SDA Team 1 Deliverable 3</dc:title>
  <dc:subject>Swift Hire Phase 3 SAD</dc:subject>
  <dc:creator>Team 1</dc:creator>
  <cp:lastModifiedBy>Team 1</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>"""


def app_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>"""


def settings_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:updateFields w:val="true"/>
</w:settings>"""


def build_document_xml(arcd, ba):
    body = []
    body.append(p_runs([r("SE2004 BSE-4A"), tab_run(), r("FAST-NUCES"), tab_run(), r("Dr. Ali Afzal Malik")], after=0))
    body.extend([p("", after=0) for _ in range(6)])
    body.append(p("Phase 3", align="center", bold=True, size=40, after=80))
    body.append(p("Team 1", align="center", bold=True, size=36, after=260))
    member_rows = [
        ["Member Name", "Member Roll #", "Primary Responsibility"],
        ["Saad Mehmood", "24L-3050", "SAD Review"],
        ["Natiq Ali", "23L-0882", "Rationale"],
        ["Abdul Muiz", "23L-3097", "ArCD"],
        ["Suleman Ahmed", "24L-3072", "SAD Integration, Formatting"],
        ["Ammar Arif", "24L-3067", "B & A Architecture"],
        ["M. Waleed", "24L-3035", "Description Table"],
    ]
    body.append(table(member_rows, [3100, 2100, 4150]))
    body.append(section_break(sect_pr()))

    body.append(p("Table of Contents", bold=True, size=32, after=240))
    toc = [
        ("Table of Contents", "ii"),
        ("1. ArCD", "1"),
        ("2. B & A Architecture", "2"),
        ("3. Rationale", "3"),
        ("4. Description Table", "4"),
    ]
    for title, page in toc:
        leader = "." * max(10, 100 - len(title) - len(page))
        body.append(p(f"{title} {leader} {page}", after=80))
    body.append(section_break(sect_pr(header="rIdHeader1", footer="rIdFooter1", page_start=2, page_fmt="lowerRoman")))

    body.append(p("1. ArCD", style="Heading1", size=32, bold=True))
    body.append(image_para("rIdImage1", arcd, 6.5))
    body.append(p("Fig.1 ArCD: Swift Hire", align="center", bold=True, size=22, after=0))
    body.append(br_page())

    body.append(p("2. B & A Architecture", style="Heading1", size=32, bold=True))
    body.append(image_para("rIdImage2", ba, 6.55))
    body.append(p("Fig.2 B & A Architecture: Swift Hire", align="center", bold=True, size=22, after=0))
    body.append(br_page())

    rationale = (
        "Swift Hire uses a combined client-server, layered, and data-centered repository architecture "
        "because the system has three clear user roles, separate web and backend responsibilities, and "
        "persistent recruitment data shared by all major use cases. The React client acts as the "
        "presentation layer and sends HTTPS/JSON requests to the Spring Boot REST API, while Spring "
        "Security, controllers, services, repositories, and MySQL are kept in separate layers. This "
        "keeps UI concerns separate from business rules such as prompt parsing, ATS scoring, CV parsing, "
        "auto-scheduling, reminders, reviews, reports, and account administration. The repository-centered "
        "MySQL design is suitable because users, candidates, employers, job postings, match scores, "
        "interview slots, reviews, reports, audit logs, notification logs, and dictionary entries must "
        "remain consistent across UC-01 to UC-17. This architecture also supports the required NFRs: "
        "performance is improved by placing matching and parsing inside focused services, scalability is "
        "supported by separating the React frontend, Spring Boot backend, database, and email integration, "
        "security is enforced through JWT and RBAC in the security layer, and notifications remain "
        "non-blocking through the email and reminder components."
    )
    body.append(p("3. Rationale", style="Heading1", size=32, bold=True))
    body.append(p(rationale, align="both", after=120))
    body.append(br_page())

    rows = [
        ["S#", "C Name", "C Desc", "Req. Ref"],
        ["1", "React Web Client", "Presentation component for Candidate, Employer, and Admin dashboards. It collects input, displays responses, and communicates with backend REST APIs.", "UC-01 to UC-17; NFR 3.3.1 to 3.3.4"],
        ["2", "REST Controllers", "Boundary component that receives HTTPS/JSON requests, maps them to use-case endpoints, validates request structure, and returns API responses.", "UC-01 to UC-17; NFR 3.4.2"],
        ["3", "Spring Security + JWT", "Security component that authenticates users, verifies tokens, enforces RBAC, limits login abuse, and protects role-specific operations.", "UC-01, UC-06, UC-07; NFR 3.6.1 to 3.6.6; NFR 3.8.2 to 3.8.4"],
        ["4", "Auth Service", "Business component for signup, login, logout, email verification, password reset, account lock, and credential handling.", "UC-01, UC-06, UC-07; NFR 3.4.4; NFR 3.8.2 to 3.8.4"],
        ["5", "Candidate Service", "Business component for candidate profile management, CV upload, CV parsing, preferences, and ranked job visibility.", "UC-08, UC-09, UC-10, UC-11; NFR 3.1.2; NFR 3.4.1; NFR 3.5.3 to 3.5.4"],
        ["6", "Employer + Job Service", "Business component for employer profile, prompt processing, KnownSkillsDictionary matching, job posting creation, ATS score calculation, and ranked candidates.", "UC-02, UC-03, UC-17; NFR 3.1.1; NFR 3.1.4; NFR 3.5.1 to 3.5.2; NFR 3.9.1 to 3.9.5"],
        ["7", "Scheduling Service", "Business component that creates interview windows, generates 45-minute slots, assigns top candidates, and manages interview slot status.", "UC-04, UC-15; NFR 3.7.4 to 3.7.5; NFR 3.10.2"],
        ["8", "Email + Reminder Scheduler", "Automation component that sends verification, reset, invitation, and reminder emails asynchronously and records notification events.", "UC-15; NFR 3.2.3; NFR 3.7.1 to 3.7.5; NFR 3.10.1; NFR 3.10.4"],
        ["9", "Review Service", "Business component for candidate and employer ratings after interviews, including rating validation and average rating updates.", "UC-05, UC-12"],
        ["10", "Admin + Analytics", "Business component for user management, account status changes, audit logs, graphical reports, CSV exports, and hiring analytics.", "UC-13, UC-14, UC-16; NFR 3.8.5"],
        ["11", "Spring Data JPA Repositories", "Data access component that isolates persistence operations for users, jobs, schedules, reviews, reports, dictionary data, and notification logs.", "UC-01 to UC-17; NFR 3.2.2; NFR 3.9.4"],
        ["12", "MySQL Database", "Repository component that stores authoritative system data including users, candidates, employers, jobs, prompts, match scores, slots, reviews, reports, logs, and skill dictionary entries.", "UC-01 to UC-17; NFR 3.7.3; NFR 3.8.5; NFR 3.9.5"],
        ["13", "CV File Storage", "Storage component for uploaded PDF files; file paths are linked with candidate records and parsed skills are saved for matching.", "UC-09, UC-11; NFR 3.1.2; NFR 3.4.1; NFR 3.6.4"],
        ["14", "SMTP Mail Server", "External integration that sends transactional emails, interview invitations, verification messages, reset links, and reminders.", "UC-15; NFR 3.7.1 to 3.7.5; NFR 3.10.1; NFR 3.10.3"],
        ["15", "Jitsi Meet", "External integration used to provide meeting links for auto-scheduled interview slots.", "UC-04, UC-15; NFR 3.10.2 to 3.10.5"],
    ]
    body.append(p("4. Description Table", style="Heading1", size=32, bold=True))
    body.append(table(rows, [600, 1750, 4550, 3036]))

    final_sect = sect_pr(header="rIdHeader1", footer="rIdFooter2", page_start=1)
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
 xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
 <w:body>{''.join(body)}{final_sect}</w:body>
</w:document>"""


def write_docx():
    arcd = build_arcd()
    ba = build_ba()
    with ZipFile(OUT, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types_xml())
        z.writestr("_rels/.rels", root_rels_xml())
        z.writestr("docProps/core.xml", core_xml())
        z.writestr("docProps/app.xml", app_xml())
        z.writestr("word/document.xml", build_document_xml(arcd, ba))
        z.writestr("word/_rels/document.xml.rels", document_rels_xml())
        z.writestr("word/styles.xml", styles_xml())
        z.writestr("word/settings.xml", settings_xml())
        z.writestr("word/header1.xml", header_xml())
        z.writestr("word/footer1.xml", footer_xml(roman=True))
        z.writestr("word/footer2.xml", footer_xml(page_field=True))
        z.write(arcd, "word/media/deliverable_3_arcd.png")
        z.write(ba, "word/media/deliverable_3_box_arrow.png")
    print(OUT)


if __name__ == "__main__":
    write_docx()
