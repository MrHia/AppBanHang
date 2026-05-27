"""
AppBanHang - Use Case Document Generator
Tao tai lieu use case tu codebase
"""
import os
from datetime import datetime
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# ─── Config ───────────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_ROOT = os.path.dirname(OUTPUT_DIR)
CHANGELOG_PATH = os.path.join(DOCS_ROOT, "CHANGELOG.md")
VERSION_FILE = os.path.join(DOCS_ROOT, "VERSION.md")
VERSION = "1.1.1"
DOC_TITLE = "TaiLieuUseCase_AppBanHang"
DOC_FILENAME = f"{DOC_TITLE}_v{VERSION}.docx"

# ─── Colors ───────────────────────────────────────────────────────────────────
BRAND_BLUE = RGBColor(0x25, 0x63, 0xEB)   # #2563EB
BRAND_GREEN = RGBColor(0x05, 0x96, 0x69)  # #059669
BRAND_GRAY = RGBColor(0x6B, 0x72, 0x80)   # #6B7280
LIGHT_BLUE_BG = RGBColor(0xDB, 0xE8, 0xF7) # #DBE8F7
DARK_GRAY = RGBColor(0x1F, 0x29, 0x37)     # #1F2937
MID_GRAY = RGBColor(0x4B, 0x55, 0x63)     # #4B5563
TABLE_HEADER_BG = RGBColor(0x25, 0x63, 0xEB)
TABLE_ALT_BG = RGBColor(0xF3, 0xF4, 0xF6)

# ─── Helpers ──────────────────────────────────────────────────────────────────
def set_cell_bg(cell, rgb: RGBColor):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), f'{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}')
    tcPr.append(shd)

def set_cell_border(cell, **kwargs):
    """Set borders on a cell: top, bottom, left, right = (size, color, space, val)"""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side in ['top', 'left', 'bottom', 'right']:
        if side in kwargs:
            size, color, space, val = kwargs[side]
            border = OxmlElement(f'w:{side}')
            border.set(qn('w:val'), val)
            border.set(qn('w:sz'), str(size))
            border.set(qn('w:space'), str(space))
            border.set(qn('w:color'), color)
            tcBorders.append(border)
    tcPr.append(tcBorders)

def add_horizontal_line(doc, color="2563EB", size=12, space_before=0, space_after=200):
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), str(size))
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), color)
    pBdr.append(bottom)
    pPr.append(pBdr)
    p.paragraph_format.space_before = Pt(space_before / 20)
    p.paragraph_format.space_after = Pt(space_after / 20)
    return p

def set_paragraph_spacing(para, before=0, after=120, line_rule=None, line=None):
    pf = para.paragraph_format
    pf.space_before = Pt(before / 20)
    pf.space_after = Pt(after / 20)
    if line_rule:
        pf.line_spacing_rule = line_rule
        if line:
            pf.line_spacing = line

def add_styled_heading(doc, text, level=1, color=None):
    if level == 1:
        p = doc.add_heading(text, level=1)
        for run in p.runs:
            run.font.color.rgb = BRAND_BLUE
            run.font.bold = True
            run.font.size = Pt(16)
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        add_horizontal_line(doc)
    elif level == 2:
        p = doc.add_heading(text, level=2)
        for run in p.runs:
            run.font.color.rgb = BRAND_GREEN
            run.font.bold = True
            run.font.size = Pt(13)
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
    else:
        p = doc.add_heading(text, level=3)
        for run in p.runs:
            run.font.color.rgb = DARK_GRAY
            run.font.bold = True
            run.font.size = Pt(11)
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
    return p

def add_body_para(doc, text, bold=False, italic=False, color=None, size=10):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color
    set_paragraph_spacing(p, before=0, after=60)
    return p

def add_bullet(doc, text, level=0, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    if bold_prefix:
        r1 = p.add_run(bold_prefix)
        r1.bold = True
        r1.font.name = 'Arial'
        r1.font.size = Pt(10)
        r2 = p.add_run(text)
        r2.font.name = 'Arial'
        r2.font.size = Pt(10)
    else:
        r = p.add_run(text)
        r.font.name = 'Arial'
        r.font.size = Pt(10)
    set_paragraph_spacing(p, before=0, after=40)
    return p

def set_col_width(table, col_idx, width_cm):
    for row in table.rows:
        row.cells[col_idx].width = Cm(width_cm)

def make_table_header(table, headers, col_widths=None):
    header_row = table.rows[0]
    for i, (cell, header) in enumerate(zip(header_row.cells, headers)):
        set_cell_bg(cell, TABLE_HEADER_BG)
        p = cell.paragraphs[0]
        run = p.add_run(header)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.name = 'Arial'
        run.font.size = Pt(9)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

def make_table_row(table, row_idx, values, col_widths=None, bold_cols=None):
    row = table.rows[row_idx + 1]
    bg = TABLE_ALT_BG if row_idx % 2 == 1 else RGBColor(0xFF, 0xFF, 0xFF)
    for i, (cell, val) in enumerate(zip(row.cells, values)):
        set_cell_bg(cell, bg)
        p = cell.paragraphs[0]
        r = p.add_run(str(val))
        r.font.name = 'Arial'
        r.font.size = Pt(9)
        if bold_cols and i in bold_cols:
            r.bold = True
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

# ─── Document Setup ───────────────────────────────────────────────────────────
doc = Document()

# Page margins
for section in doc.sections:
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)

# ─── PAGE 1: Cover ────────────────────────────────────────────────────────────
# Blue header bar
header_table = doc.add_table(rows=1, cols=1)
header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
hcell = header_table.rows[0].cells[0]
set_cell_bg(hcell, BRAND_BLUE)
hcell.width = Cm(16)
hp = hcell.paragraphs[0]
hp.paragraph_format.space_before = Pt(12)
hp.paragraph_format.space_after = Pt(12)
hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
hr = hp.add_run("APPBANHANG")
hr.font.name = 'Arial'
hr.font.size = Pt(28)
hr.font.bold = True
hr.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

doc.add_paragraph()

# Title
tp = doc.add_paragraph()
tp.alignment = WD_ALIGN_PARAGRAPH.CENTER
tr1 = tp.add_run("TAI LIEU MO TA USE CASE")
tr1.font.name = 'Arial'
tr1.font.size = Pt(20)
tr1.font.bold = True
tr1.font.color.rgb = BRAND_BLUE
tp.paragraph_format.space_after = Pt(4)

tp2 = doc.add_paragraph()
tp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
tr2 = tp2.add_run("Import Order Management System")
tr2.font.name = 'Arial'
tr2.font.size = Pt(14)
tr2.font.bold = False
tr2.font.color.rgb = BRAND_GRAY
tp2.paragraph_format.space_after = Pt(30)

# Info table
info_data = [
    ("Phien ban", VERSION),
    ("Ngay tao", datetime.now().strftime("%d/%m/%Y")),
    ("Tac gia", "Auto-generated from codebase"),
    ("Trang thai", "Approved"),
    ("Du an", "AppBanHang - Import Order Management System"),
]
info_table = doc.add_table(rows=len(info_data), cols=2)
info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, (label, value) in enumerate(info_data):
    lc = info_table.rows[i].cells[0]
    vc = info_table.rows[i].cells[1]
    lc.width = Cm(5)
    vc.width = Cm(8)
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True
    lr.font.name = 'Arial'
    lr.font.size = Pt(10)
    lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'
    vr.font.size = Pt(10)
    vp.paragraph_format.space_before = Pt(2)
    vp.paragraph_format.space_after = Pt(2)

doc.add_paragraph()

# Summary box
summary_p = doc.add_paragraph()
summary_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
sr = summary_p.add_run("Tom tat noi dung")
sr.bold = True
sr.font.name = 'Arial'
sr.font.size = Pt(11)
sr.font.color.rgb = BRAND_BLUE
add_horizontal_line(doc, color="2563EB", size=8)

summary_text = (
    "Tai lieu mo ta chi tiet cac use case cua he thong AppBanHang - He thong quan ly don hang nhap khau. "
    "Bao gom 5 vai tro chinh: Quan tri he thong (Admin), Mua hang quoc te (Overseas), Dai dien chi nhanh (Site), "
    "Kho van phong (Warehouse), va Nhan vien kinh doanh (Sales). Moi use case bao gom ten, mo ta, tac nhan, "
    "du lieu dau vao, duong dan UI tuong ung, cac buoc thuc hien, ket qua dau ra, va ngoai le."
)
sp2 = doc.add_paragraph()
sp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
sr2 = sp2.add_run(summary_text)
sr2.font.name = 'Arial'
sr2.font.size = Pt(9)
sr2.font.color.rgb = MID_GRAY
sp2.paragraph_format.space_after = Pt(20)

doc.add_page_break()

# ─── PAGE 2: Table of Contents ───────────────────────────────────────────────
toc_title = doc.add_paragraph()
toc_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
tr = toc_title.add_run("MUC LUC")
tr.font.name = 'Arial'
tr.font.size = Pt(16)
tr.font.bold = True
tr.font.color.rgb = BRAND_BLUE
add_horizontal_line(doc)

toc_items = [
    ("1", "Gioi thieu he thong", "3"),
    ("2", "Tai khoan mac dinh", "4"),
    ("3", "So do quan ly tai khoan (Admin)", "5"),
    ("   3.1", "UC-001: Xem dashboard", "5"),
    ("   3.2", "UC-002: Quan ly tai khoan", "5"),
    ("   3.3", "UC-003: Quan ly mat hang", "6"),
    ("   3.4", "UC-004: Quan ly chi nhanh", "6"),
    ("4", "So do mua hang quoc te (Overseas)", "7"),
    ("   4.1", "UC-005: Xem dashboard", "7"),
    ("   4.2", "UC-006: Xem danh sach yeu cau", "7"),
    ("   4.3", "UC-007: Xu ly yeu cau dat hang", "8"),
    ("   4.4", "UC-008: Gui yeu cau kiem tra ton kho", "8"),
    ("   4.5", "UC-009: Tao don dat hang (PO)", "9"),
    ("   4.6", "UC-010: Xem danh sach PO", "9"),
    ("5", "So do dai dien chi nhanh (Site)", "10"),
    ("   5.1", "UC-011: Xem dashboard", "10"),
    ("   5.2", "UC-012: Xem danh muc mat hang", "10"),
    ("   5.3", "UC-013: Tra loi yeu cau kiem tra ton kho", "11"),
    ("   5.4", "UC-014: Xem va xu ly PO", "11"),
    ("6", "So do kho van phong (Warehouse)", "12"),
    ("   6.1", "UC-015: Xem dashboard", "12"),
    ("   6.2", "UC-016: Xem danh sach PO da xac nhan", "12"),
    ("   6.3", "UC-017: Nhan hang", "13"),
    ("   6.4", "UC-018: Giai quyet chenh lech", "13"),
    ("7", "So do nhan vien kinh doanh (Sales)", "14"),
    ("   7.1", "UC-019: Xem dashboard", "14"),
    ("   7.2", "UC-020: Tao yeu cau dat hang", "14"),
    ("   7.3", "UC-021: Xem lich su yeu cau", "15"),
    ("8", "Tai lieu tham khao", "15"),
    ("9", "Huong dan su dung he thong", "16"),
    ("   9.1", "Tai khoan mac dinh", "16"),
    ("   9.2", "Quy trinh lam viec chuan", "16"),
    ("   9.3", "Chuyen ngon ngu", "16"),
    ("   9.4", "Quy tac phien ban", "16"),
]

toc_table = doc.add_table(rows=len(toc_items), cols=3)
toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, (num, title, page) in enumerate(toc_items):
    c0, c1, c2 = toc_table.rows[i].cells
    c0.width = Cm(1.5)
    c1.width = Cm(12)
    c2.width = Cm(1.5)
    bg = TABLE_ALT_BG if i % 2 == 1 else RGBColor(0xFF, 0xFF, 0xFF)
    for c in [c0, c1, c2]:
        set_cell_bg(c, bg)
    p0 = c0.paragraphs[0]
    r0 = p0.add_run(num)
    r0.font.name = 'Arial'
    r0.font.size = Pt(9)
    r0.bold = True
    r0.font.color.rgb = BRAND_BLUE if not num.startswith("   ") else BRAND_GRAY
    p1 = c1.paragraphs[0]
    r1 = p1.add_run(title)
    r1.font.name = 'Arial'
    r1.font.size = Pt(9)
    r1.font.color.rgb = BRAND_BLUE if not num.startswith("   ") else DARK_GRAY
    if num.startswith("   "):
        r1.italic = True
    p2 = c2.paragraphs[0]
    r2 = p2.add_run(page)
    r2.font.name = 'Arial'
    r2.font.size = Pt(9)
    r2.font.color.rgb = BRAND_GRAY
    p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT

doc.add_page_break()

# ─── Section 1: System Overview ──────────────────────────────────────────────
add_styled_heading(doc, "1. Gioi thieu he thong")
add_body_para(doc, "AppBanHang la he thong quan ly don hang nhap khau (Import Order Management System) duoc xay dung theo kien truc "
    "full-stack voi backend Spring Boot va frontend Next.js. He thong cho phep cac bo phan Sales, Overseas, Site, va Warehouse "
    "phoi hop xu ly quy trinh dat hang - tu luc sales tao yeu cau, overseas gui kiem tra ton kho, tao don dat hang, "
    "site xac nhan don, den kho nhan hang va giai quyet chenh lech.")
add_body_para(doc, "Cac thanh phan chinh cua he thong:")

overview_items = [
    ("ITSSBE (Backend)", "Spring Boot 3.1.1, Java 17, JPA/Hibernate, MySQL. Chua 16 entity, 10 controller, 14 DTO, 17 repository."),
    ("ITSSFE (Frontend)", "Next.js 14 (Pages Router), React 18, MUI v5. 25+ trang nguoi dung voi i18n EN/VI."),
    ("Database", "MySQL qua XAMPP. Schema day du voi du lieu khoi tao trong SQL/schema.sql."),
    ("He thong tai khoan", "5 vai tro: ADMIN, OVERSEAS, SITE, WAREHOUSE, SALES. Phan quyen theo dashboard rieng."),
]
for title, desc in overview_items:
    add_bullet(doc, desc, bold_prefix=title + ": ")

add_body_para(doc, "He thong ho tro 2 ngon ngu: Tieng Anh (mac dinh) va Tieng Viet. Chuyen doi ngon ngu bang cach su dung "
    "UI toggle ben phai hoac cac phim tat trong moi truong dev.")

add_styled_heading(doc, "2. Tai khoan mac dinh")
add_body_para(doc, "He thong co san cac tai khoan kiem tra voi thong tin dang nhap nhu sau:")

acc_headers = ["Vai tro", "Email", "Mat khau", "Mo ta"]
acc_data = [
    ["ADMIN", "admin@system.com", "admin123", "Quan tri he thong"],
    ["SALES", "sales@system.com", "sales123", "Nhan vien kinh doanh"],
    ["WAREHOUSE", "warehouse@system.com", "warehouse123", "Nhan vien kho van phong"],
    ["SITE (US)", "site_us@system.com", "site123", "Dai dien chi nhanh My (US)"],
    ["SITE (JP)", "site_jp@system.com", "site123", "Dai dien chi nhanh Nhat (JP)"],
    ["SITE (DE)", "site_de@system.com", "site123", "Dai dien chi nhanh Duc (DE)"],
]
acc_table = doc.add_table(rows=len(acc_data)+1, cols=4)
acc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
make_table_header(acc_table, acc_headers, [3, 5, 3, 5])
for i, row_data in enumerate(acc_data):
    make_table_row(acc_table, i, row_data)
# Column widths
total_w = 16
widths = [3, 5, 3, 5]
for row in acc_table.rows:
    for i, w in enumerate(widths):
        row.cells[i].width = Cm(w)

doc.add_page_break()

# ─── Section 3: Admin Use Cases ───────────────────────────────────────────────
add_styled_heading(doc, "3. So do use case - Quan tri he thong (Admin)")

add_styled_heading(doc, "3.1 UC-001: Xem dashboard", level=2)
uc_table = doc.add_table(rows=10, cols=2)
uc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_table.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_fields = [
    ("Ten use case", "UC-001: Xem Dashboard Admin"),
    ("Tac nhan", "Admin"),
    ("Loai", "Xem thong tin"),
    ("URL", "/admin/dashboard"),
    ("API Endpoint", "GET /api/accounts, GET /api/sites, GET /api/merchandise, GET /api/requests, GET /api/purchase-orders"),
    ("Mo ta ngan", "Hien thi 5 the thong ke: so tai khoan, so chi nhanh, so mat hang, so yeu cau dat hang, so don dat hang."),
    ("Du lieu dau vao", "Khong co (chi hien thi dashboard)"),
    ("Ket qua dau ra", "5 the thong ke (stat cards) hien thi ten va so luong tuong ung."),
    ("Ngoai le", "Neu khong co du lieu, hien thi 0."),
]
for i, (label, value) in enumerate(uc_fields):
    lc = uc_table.rows[i].cells[0]
    vc = uc_table.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True
    lr.font.name = 'Arial'
    lr.font.size = Pt(9)
    lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'
    vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1)
    vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "3.2 UC-002: Quan ly tai khoan nguoi dung", level=2)
uc_table2 = doc.add_table(rows=10, cols=2)
uc_table2.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_table2.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_fields2 = [
    ("Ten use case", "UC-002: Quan ly tai khoan nguoi dung"),
    ("Tac nhan", "Admin"),
    ("Loai", "CRUD + QLKhoa"),
    ("URL", "/admin/accounts"),
    ("API Endpoint", "GET /api/accounts; POST /api/accounts; PUT /api/accounts/{id}; PUT /api/accounts/{id}/lock; PUT /api/accounts/{id}/unlock; PUT /api/accounts/{id}/reset-password"),
    ("Mo ta ngan", "Xem danh sach, tao moi, chinh sua, khoa, mo khoa, dat lai mat khau tai khoan nguoi dung."),
    ("Du lieu dau vao", "Form: email, firstName, lastName, phone, roleName, password (cho tao moi)."),
    ("Ket qua dau ra", "Danh sach tai khoan trong bang. Thao tac thanh cong hien thong bao."),
    ("Ngoai le", "Email da ton tai, tai khoan bi khoa 30 phut sau 5 lan dang nhap sai."),
]
for i, (label, value) in enumerate(uc_fields2):
    lc = uc_table2.rows[i].cells[0]
    vc = uc_table2.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True
    lr.font.name = 'Arial'
    lr.font.size = Pt(9)
    lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'
    vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1)
    vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "3.3 UC-003: Quan ly mat hang", level=2)
uc_table3 = doc.add_table(rows=10, cols=2)
uc_table3.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_table3.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_fields3 = [
    ("Ten use case", "UC-003: Quan ly mat hang"),
    ("Tac nhan", "Admin"),
    ("Loai", "Xem + Them moi"),
    ("URL", "/admin/merchandise"),
    ("API Endpoint", "GET /api/merchandise; POST /api/merchandise"),
    ("Mo ta ngan", "Xem danh sach mat hang (ten, ma, don vi, mo ta, trang thai) va them mat hang moi vao he thong."),
    ("Du lieu dau vao", "Form: ma mat hang, ten mat hang, don vi (unit), mo ta."),
    ("Ket qua dau ra", "Bang danh sach mat hang. Them mat hang moi thanh cong tra ve mat hang da tao."),
    ("Ngoai le", "Ma mat hang da ton tai tra ve loi 400."),
]
for i, (label, value) in enumerate(uc_fields3):
    lc = uc_table3.rows[i].cells[0]
    vc = uc_table3.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True
    lr.font.name = 'Arial'
    lr.font.size = Pt(9)
    lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'
    vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1)
    vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "3.4 UC-004: Quan ly chi nhanh", level=2)
uc_table4 = doc.add_table(rows=10, cols=2)
uc_table4.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_table4.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_fields4 = [
    ("Ten use case", "UC-004: Quan ly chi nhanh"),
    ("Tac nhan", "Admin"),
    ("Loai", "Xem + Them moi"),
    ("URL", "/admin/sites"),
    ("API Endpoint", "GET /api/sites; POST /api/sites"),
    ("Mo ta ngan", "Xem danh sach cac chi nhanh (ma, ten, quoc gia, email, dien thoai, dia chi) va them chi nhanh moi."),
    ("Du lieu dau vao", "Form: ten chi nhanh, ma chi nhanh, quoc gia, email, dien thoai, dia chi."),
    ("Ket qua dau ra", "Bang danh sach chi nhanh. Them chi nhanh moi thanh cong tra ve chi nhanh da tao."),
    ("Ngoai le", "Ma chi nhanh da ton tai tra ve loi 400."),
]
for i, (label, value) in enumerate(uc_fields4):
    lc = uc_table4.rows[i].cells[0]
    vc = uc_table4.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True
    lr.font.name = 'Arial'
    lr.font.size = Pt(9)
    lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'
    vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1)
    vp.paragraph_format.space_after = Pt(1)

doc.add_page_break()

# ─── Section 4: Overseas Use Cases ──────────────────────────────────────────
add_styled_heading(doc, "4. So do use case - Mua hang quoc te (Overseas)")

add_styled_heading(doc, "4.1 UC-005: Xem dashboard Overseas", level=2)
uc_o1 = doc.add_table(rows=10, cols=2)
uc_o1.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_o1.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_o1_data = [
    ("Ten use case", "UC-005: Xem Dashboard Overseas"),
    ("Tac nhan", "Overseas"),
    ("Loai", "Xem thong tin"),
    ("URL", "/overseas/dashboard"),
    ("API Endpoint", "GET /api/requests/status/PENDING; GET /api/requests/status/PROCESSING; GET /api/purchase-orders"),
    ("Mo ta ngan", "Hien thi 3 the thong ke: so yeu cau cho xu ly, so yeu cau dang xu ly, so don dat hang (PO)."),
    ("Du lieu dau vao", "Khong co"),
    ("Ket qua dau ra", "3 the thong ke (stat cards) hien thi ten va so luong tuong ung."),
    ("Ngoai le", "Neu khong co du lieu, hien thi 0."),
]
for i, (label, value) in enumerate(uc_o1_data):
    lc = uc_o1.rows[i].cells[0]
    vc = uc_o1.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "4.2 UC-006: Xem danh sach yeu cau dat hang", level=2)
uc_o2 = doc.add_table(rows=10, cols=2)
uc_o2.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_o2.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_o2_data = [
    ("Ten use case", "UC-006: Xem danh sach yeu cau dat hang"),
    ("Tac nhan", "Overseas"),
    ("Loai", "Xem"),
    ("URL", "/overseas/requests"),
    ("API Endpoint", "GET /api/requests"),
    ("Mo ta ngan", "Xem toan bo danh sach yeu cau dat hang cua Sales. Bang hien thi: ma yeu cau, ngay tao, nguoi tao, ngay yeu cau, trang thai, hanh dong."),
    ("Du lieu dau vao", "Khong co (lay tat ca)"),
    ("Ket qua dau ra", "Bang danh sach cac yeu cau voi cac cot: Code, Created At, Created By, Desired Date, Status, Action."),
    ("Ngoai le", "Khong co du lieu tra ve bang rong."),
]
for i, (label, value) in enumerate(uc_o2_data):
    lc = uc_o2.rows[i].cells[0]
    vc = uc_o2.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "4.3 UC-007: Xu ly yeu cau dat hang (Process Request)", level=2)
uc_o3 = doc.add_table(rows=12, cols=2)
uc_o3.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_o3.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_o3_data = [
    ("Ten use case", "UC-007: Xu ly yeu cau dat hang"),
    ("Tac nhan", "Overseas"),
    ("Loai", "Xu ly nhieu buoc"),
    ("URL", "/overseas/process-request va /overseas/process-request/[id]"),
    ("API Endpoint", "GET /api/requests/{id}; GET /api/requests/{id}/items; GET /api/sites; GET /api/inquiries/matrix/{requestId}; POST /api/inquiries; POST /api/purchase-orders"),
    ("Mo ta ngan", "Overseas xem chi tiet yeu cau, gui yeu cau kiem tra ton kho toi cac Site, xem ma tran ton kho, tao Purchase Order (PO)."),
    ("Cac buoc thuc hien", "Buoc 1: Xem chi tiet yeu cau (danh sach mat hang, so luong, ngay yeu cau).\n"
                           "Buoc 2: Nhan 'Send Stock Check Requests' de gui yeu cau kiem tra ton kho toi cac Site.\n"
                           "Buoc 3: Xem ma tran ton kho theo Site.\n"
                           "Buoc 4: Chon Site va nhap so luong dat hang, chon phuong thuc van chuyen (SHIP/AIR/LAND).\n"
                           "Buoc 5: Tao Purchase Order."),
    ("Du lieu dau vao", "Yeu cau ID, ma Site, danh sach mat hang + so luong, phuong thuc van chuyen, ngay giao du kien."),
    ("Ket qua dau ra", "Purchase Order da tao voi trang thai DRAFT/SENT."),
    ("Ngoai le", "Khong co mat hang nao trong yeu cau, Site khong co ton kho."),
]
for i, (label, value) in enumerate(uc_o3_data):
    lc = uc_o3.rows[i].cells[0]
    vc = uc_o3.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "4.4 UC-008: Gui yeu cau kiem tra ton kho (Stock Inquiry)", level=2)
uc_o4 = doc.add_table(rows=10, cols=2)
uc_o4.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_o4.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_o4_data = [
    ("Ten use case", "UC-008: Gui yeu cau kiem tra ton kho"),
    ("Tac nhan", "Overseas"),
    ("Loai", "Tao moi"),
    ("URL", "/overseas/process-request/[id]"),
    ("API Endpoint", "POST /api/inquiries"),
    ("Mo ta ngan", "Gui yeu cau kiem tra ton kho toi tat ca cac Site (US, JP, DE) de xac dinh mat hang co san."),
    ("Du lieu dau vao", "processRequestId, siteIds (danh sach cac Site)"),
    ("Ket qua dau ra", "Tao StockInquiry cho moi Site voi trang thai PENDING."),
    ("Ngoai le", "Yeu cau khong ton tai, Site khong hop le."),
]
for i, (label, value) in enumerate(uc_o4_data):
    lc = uc_o4.rows[i].cells[0]
    vc = uc_o4.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "4.5 UC-009: Tao don dat hang (Purchase Order)", level=2)
uc_o5 = doc.add_table(rows=10, cols=2)
uc_o5.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_o5.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_o5_data = [
    ("Ten use case", "UC-009: Tao don dat hang (Purchase Order)"),
    ("Tac nhan", "Overseas"),
    ("Loai", "Tao moi"),
    ("URL", "/overseas/process-request/[id]"),
    ("API Endpoint", "POST /api/purchase-orders"),
    ("Mo ta ngan", "Tao Purchase Order (PO) sau khi xem ma tran ton kho. PO chua thong tin Site, mat hang, so luong, phuong thuc van chuyen, ngay giao du kien."),
    ("Du lieu dau vao", "processRequestId, siteId, deliveryMethod (SHIP/AIR/LAND), expectedDelivery, danh sach PODetails [{merchandiseId, quantity, unit}]"),
    ("Ket qua dau ra", "PO da tao voi ma (VD: PO-2026-0001), trang thai DRAFT. Tien trinh tu dong chuyen trang thai tu DRAFT -> SENT."),
    ("Ngoai le", "Tat ca mat hang deu het hang, PO khong hop le (khong co mat hang)."),
]
for i, (label, value) in enumerate(uc_o5_data):
    lc = uc_o5.rows[i].cells[0]
    vc = uc_o5.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "4.6 UC-010: Xem danh sach Purchase Orders", level=2)
uc_o6 = doc.add_table(rows=10, cols=2)
uc_o6.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_o6.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_o6_data = [
    ("Ten use case", "UC-010: Xem danh sach Purchase Orders"),
    ("Tac nhan", "Overseas"),
    ("Loai", "Xem"),
    ("URL", "/overseas/purchase-orders"),
    ("API Endpoint", "GET /api/purchase-orders"),
    ("Mo ta ngan", "Xem toan bo danh sach Purchase Orders da tao boi Overseas. Bang hien thi: ma PO, Site, phuong thuc van chuyen, ngay giao du kien, trang thai."),
    ("Du lieu dau vao", "Khong co"),
    ("Ket qua dau ra", "Bang danh sach PO voi cac cot: Code, Site, Delivery Method, Expected Delivery, Status."),
    ("Ngoai le", "Khong co PO nao tra ve bang rong."),
]
for i, (label, value) in enumerate(uc_o6_data):
    lc = uc_o6.rows[i].cells[0]
    vc = uc_o6.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

doc.add_page_break()

# ─── Section 5: Site Use Cases ───────────────────────────────────────────────
add_styled_heading(doc, "5. So do use case - Dai dien chi nhanh (Site)")

add_styled_heading(doc, "5.1 UC-011: Xem dashboard Site", level=2)
uc_s1 = doc.add_table(rows=10, cols=2)
uc_s1.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_s1.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_s1_data = [
    ("Ten use case", "UC-011: Xem Dashboard Site"),
    ("Tac nhan", "Site (US/JP/DE)"),
    ("Loai", "Xem thong tin"),
    ("URL", "/site/dashboard"),
    ("API Endpoint", "GET /api/inquiries/pending/site/{siteId}; GET /api/purchase-orders/site/{siteId}"),
    ("Mo ta ngan", "Hien thi 2 the thong ke: so yeu cau kiem tra ton kho cho, so Purchase Orders can xu ly."),
    ("Du lieu dau vao", "siteId tu tai khoan dang nhap"),
    ("Ket qua dau ra", "2 the thong ke (stat cards) hien thi ten va so luong."),
    ("Ngoai le", "Neu khong co du lieu, hien thi 0."),
]
for i, (label, value) in enumerate(uc_s1_data):
    lc = uc_s1.rows[i].cells[0]
    vc = uc_s1.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "5.2 UC-012: Xem danh muc mat hang", level=2)
uc_s2 = doc.add_table(rows=10, cols=2)
uc_s2.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_s2.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_s2_data = [
    ("Ten use case", "UC-012: Xem danh muc mat hang"),
    ("Tac nhan", "Site (US/JP/DE)"),
    ("Loai", "Xem"),
    ("URL", "/site/merchandise"),
    ("API Endpoint", "GET /api/merchandise"),
    ("Mo ta ngan", "Xem danh sach tat ca mat hang co trong he thong (chi xem, khong chinh sua). Bang hien thi: ma, ten, don vi, mo ta, trang thai."),
    ("Du lieu dau vao", "Khong co"),
    ("Ket qua dau ra", "Bang danh sach mat hang voi cac cot: Code, Name, Unit, Description, Status."),
    ("Ngoai le", "Khong co mat hang nao tra ve bang rong."),
]
for i, (label, value) in enumerate(uc_s2_data):
    lc = uc_s2.rows[i].cells[0]
    vc = uc_s2.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "5.3 UC-013: Tra loi yeu cau kiem tra ton kho", level=2)
uc_s3 = doc.add_table(rows=10, cols=2)
uc_s3.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_s3.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_s3_data = [
    ("Ten use case", "UC-013: Tra loi yeu cau kiem tra ton kho"),
    ("Tac nhan", "Site (US/JP/DE)"),
    ("Loai", "Cap nhat"),
    ("URL", "/site/inquiries"),
    ("API Endpoint", "GET /api/inquiries/pending/site/{siteId}; GET /api/inquiries/{id}/items; PUT /api/inquiries/{id}/respond"),
    ("Mo ta ngan", "Site nhan yeu cau kiem tra ton kho tu Overseas, xem danh sach mat hang can kiem tra, nhap so luong ton kho va gui phan hoi."),
    ("Du lieu dau vao", "inquiryId, danh sach {stockInquiryItemId, quantity} (so luong ton kho thuc te)"),
    ("Ket qua dau ra", "StockInquiry chuyen trang thai tu PENDING sang RESPONDED. Ma tran ton kho cua Overseas cap nhat."),
    ("Ngoai le", "Yeu cau khong ton tai hoac da duoc phan hoi."),
]
for i, (label, value) in enumerate(uc_s3_data):
    lc = uc_s3.rows[i].cells[0]
    vc = uc_s3.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "5.4 UC-014: Xem va xu ly Purchase Orders", level=2)
uc_s4 = doc.add_table(rows=10, cols=2)
uc_s4.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_s4.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_s4_data = [
    ("Ten use case", "UC-014: Xem va xu ly Purchase Orders"),
    ("Tac nhan", "Site (US/JP/DE)"),
    ("Loai", "Xac nhan/Tu choi"),
    ("URL", "/site/purchase-orders"),
    ("API Endpoint", "GET /api/purchase-orders/site/{siteId}; PUT /api/purchase-orders/{id}/confirm; PUT /api/purchase-orders/{id}/reject"),
    ("Mo ta ngan", "Site xem danh sach Purchase Orders gui toi, co the Xac nhan (Confirm) hoac Tu choi (Reject) don hang."),
    ("Du lieu dau vao", "PO ID, ly do tu choi (neu Reject)"),
    ("Ket qua dau ra", "PO chuyen trang thai CONFIRMED hoac REJECTED. Neu REJECTED, can nhap rejectionReason."),
    ("Ngoai le", "PO khong ton tai, PO da duoc xu ly roi."),
]
for i, (label, value) in enumerate(uc_s4_data):
    lc = uc_s4.rows[i].cells[0]
    vc = uc_s4.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

doc.add_page_break()

# ─── Section 6: Warehouse Use Cases ───────────────────────────────────────────
add_styled_heading(doc, "6. So do use case - Kho van phong (Warehouse)")

add_styled_heading(doc, "6.1 UC-015: Xem dashboard Warehouse", level=2)
uc_w1 = doc.add_table(rows=10, cols=2)
uc_w1.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_w1.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_w1_data = [
    ("Ten use case", "UC-015: Xem Dashboard Warehouse"),
    ("Tac nhan", "Warehouse"),
    ("Loai", "Xem thong tin"),
    ("URL", "/warehouse/dashboard"),
    ("API Endpoint", "GET /api/warehouse/confirmed-pos"),
    ("Mo ta ngan", "Hien thi 1 the thong ke: so don da xac nhan (CONFIRMED) dang cho nhan hang."),
    ("Du lieu dau vao", "Khong co"),
    ("Ket qua dau ra", "1 the thong ke hien thi so luong PO da xac nhan."),
    ("Ngoai le", "Neu khong co don, hien thi 0."),
]
for i, (label, value) in enumerate(uc_w1_data):
    lc = uc_w1.rows[i].cells[0]
    vc = uc_w1.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "6.2 UC-016: Xem danh sach PO da xac nhan", level=2)
uc_w2 = doc.add_table(rows=10, cols=2)
uc_w2.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_w2.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_w2_data = [
    ("Ten use case", "UC-016: Xem danh sach PO da xac nhan"),
    ("Tac nhan", "Warehouse"),
    ("Loai", "Xem"),
    ("URL", "/warehouse/confirmed-pos"),
    ("API Endpoint", "GET /api/warehouse/confirmed-pos"),
    ("Mo ta ngan", "Xem danh sach tat ca Purchase Orders da duoc Site xac nhan (CONFIRMED), san sang de nhan hang. Bang hien thi: ma PO, Site, phuong thuc van chuyen, ngay giao du kien."),
    ("Du lieu dau vao", "Khong co"),
    ("Ket qua dau ra", "Bang danh sach PO CONFIRMED voi nut 'Receive' dan toi trang nhan hang."),
    ("Ngoai le", "Khong co PO nao tra ve bang rong."),
]
for i, (label, value) in enumerate(uc_w2_data):
    lc = uc_w2.rows[i].cells[0]
    vc = uc_w2.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "6.3 UC-017: Nhan hang (Receive Goods)", level=2)
uc_w3 = doc.add_table(rows=12, cols=2)
uc_w3.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_w3.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_w3_data = [
    ("Ten use case", "UC-017: Nhan hang"),
    ("Tac nhan", "Warehouse"),
    ("Loai", "Tao moi + Cap nhat"),
    ("URL", "/warehouse/receive/[id]"),
    ("API Endpoint", "GET /api/purchase-orders/{id}; GET /api/purchase-orders/{id}/details; POST /api/warehouse/receive-goods; GET /api/warehouse/receipt-items/{receiptId}; PUT /api/warehouse/confirm-receipt/{receiptId}"),
    ("Mo ta ngan", "Warehouse nhan hang theo Purchase Order. Qua trinh 2 giai doan: (1) Kich hoat nhan hang, (2) Nhap so luong thuc nhan va xac nhan."),
    ("Cac buoc thuc hien", "Buoc 1: Chon 'Receive Goods' de kich hoat qua trinh nhan hang. Tao WarehouseReceipt.\n"
                           "Buoc 2: Nhap so luong thuc te nhan duoc cho tung mat hang.\n"
                           "Buoc 3: Chon 'Confirm Receipt' de hoan tat. PO chuyen trang thai DONE."),
    ("Du lieu dau vao", "receiptId, danh sach {receiptItemId, receivedQuantity}"),
    ("Ket qua dau ra", "WarehouseReceipt da tao voi trang thai DONE. PO chuyen trang thai DONE. ReceiptItem luu so luong thuc nhan."),
    ("Ngoai le", "PO khong ton tai, PO chua duoc xac nhan boi Site."),
]
for i, (label, value) in enumerate(uc_w3_data):
    lc = uc_w3.rows[i].cells[0]
    vc = uc_w3.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "6.4 UC-018: Giai quyet chenh lech (Discrepancy Resolution)", level=2)
uc_w4 = doc.add_table(rows=12, cols=2)
uc_w4.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_w4.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_w4_data = [
    ("Ten use case", "UC-018: Giai quyet chenh lech"),
    ("Tac nhan", "Warehouse"),
    ("Loai", "Xem + Giai quyet"),
    ("URL", "/warehouse/discrepancies"),
    ("API Endpoint", "GET /api/warehouse/discrepancies; PUT /api/warehouse/discrepancies/{id}/resolve; GET /api/warehouse/discrepancies/{id}/messages; POST /api/warehouse/discrepancies/{id}/messages"),
    ("Mo ta ngan", "Xem danh sach chenh lech (thieu/du) giua so luong dat va so luong nhan thuc te. Warehouse nhap ghi chu giai quyet va gui tin nhan trao doi voi Site."),
    ("Cac buoc thuc hien", "Buoc 1: Xem danh sach chenh lech (hien thi mat hang, so luong thieu/du, trang thai).\n"
                           "Buoc 2: Chon 'Resolve', nhap ghi chu giai quyet.\n"
                           "Buoc 3: Xem/ gui tin nhan trao doi voi Site (DiscrepancyMessage)."),
    ("Du lieu dau vao", "discrepancyId, resolutionNotes (ghi chu giai quyet)"),
    ("Ket qua dau ra", "SiteDiscrepancy chuyen trang thai tu OPEN/RESOLVING sang RESOLVED."),
    ("Ngoai le", "Discrepancy khong ton tai, da duoc giai quyet roi."),
]
for i, (label, value) in enumerate(uc_w4_data):
    lc = uc_w4.rows[i].cells[0]
    vc = uc_w4.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

doc.add_page_break()

# ─── Section 7: Sales Use Cases ──────────────────────────────────────────────
add_styled_heading(doc, "7. So do use case - Nhan vien kinh doanh (Sales)")

add_styled_heading(doc, "7.1 UC-019: Xem dashboard Sales", level=2)
uc_sa1 = doc.add_table(rows=10, cols=2)
uc_sa1.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_sa1.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_sa1_data = [
    ("Ten use case", "UC-019: Xem Dashboard Sales"),
    ("Tac nhan", "Sales"),
    ("Loai", "Xem thong tin"),
    ("URL", "/sales/dashboard"),
    ("API Endpoint", "GET /api/requests/status/PENDING"),
    ("Mo ta ngan", "Hien thi 1 the thong ke: so yeu cau dang cho xu ly (PENDING). Hien thi nut 'Create Order Request' de tao yeu cau moi."),
    ("Du lieu dau vao", "Khong co"),
    ("Ket qua dau ra", "1 the thong ke hien thi so yeu cau PENDING."),
    ("Ngoai le", "Neu khong co yeu cau, hien thi 0."),
]
for i, (label, value) in enumerate(uc_sa1_data):
    lc = uc_sa1.rows[i].cells[0]
    vc = uc_sa1.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "7.2 UC-020: Tao yeu cau dat hang", level=2)
uc_sa2 = doc.add_table(rows=12, cols=2)
uc_sa2.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_sa2.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_sa2_data = [
    ("Ten use case", "UC-020: Tao yeu cau dat hang"),
    ("Tac nhan", "Sales"),
    ("Loai", "Tao moi"),
    ("URL", "/sales/create-request"),
    ("API Endpoint", "GET /api/merchandise; POST /api/requests; POST /api/requests/{id}/items"),
    ("Mo ta ngan", "Sales tao yeu cau dat hang moi voi danh sach mat hang va so luong. Sau do gui cho Overseas xu ly."),
    ("Cac buoc thuc hien", "Buoc 1: Chon ngay giao du kien va nhap ghi chu (notes).\n"
                           "Buoc 2: Nhan 'Add Merchandise' de them mat hang vao danh sach (chua so luong).\n"
                           "Buoc 3: Xem lai danh sach mat hang, co the xoa mat hang.\n"
                           "Buoc 4: Nhan 'Submit Request' de gui yeu cau."),
    ("Du lieu dau vao", "desiredDate, notes, danh sach {merchandiseId, quantity}"),
    ("Ket qua dau ra", "ProcessRequest da tao voi ma (VD: REQ-2026-0001), trang thai PENDING. Danh sach RequestItems da duoc tao."),
    ("Ngoai le", "Khong co mat hang nao duoc them, mat hang khong ton tai."),
]
for i, (label, value) in enumerate(uc_sa2_data):
    lc = uc_sa2.rows[i].cells[0]
    vc = uc_sa2.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

add_styled_heading(doc, "7.3 UC-021: Xem lich su yeu cau", level=2)
uc_sa3 = doc.add_table(rows=10, cols=2)
uc_sa3.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in uc_sa3.rows:
    for cell in row.cells:
        cell.width = Cm(8)
uc_sa3_data = [
    ("Ten use case", "UC-021: Xem lich su yeu cau"),
    ("Tac nhan", "Sales"),
    ("Loai", "Xem"),
    ("URL", "/sales/my-requests"),
    ("API Endpoint", "GET /api/requests"),
    ("Mo ta ngan", "Xem danh sach tat ca yeu cau dat hang da tao. Bang hien thi: ma yeu cau, ngay tao, ngay yeu cau, trang thai, so mat hang."),
    ("Du lieu dau vao", "Khong co"),
    ("Ket qua dau ra", "Bang danh sach yeu cau voi cac cot: Code, Created At, Desired Date, Status, Item Count."),
    ("Ngoai le", "Khong co yeu cau nao tra ve bang rong."),
]
for i, (label, value) in enumerate(uc_sa3_data):
    lc = uc_sa3.rows[i].cells[0]
    vc = uc_sa3.rows[i].cells[1]
    set_cell_bg(lc, LIGHT_BLUE_BG)
    set_cell_bg(vc, RGBColor(0xFF, 0xFF, 0xFF))
    lp = lc.paragraphs[0]
    lr = lp.add_run(label)
    lr.bold = True; lr.font.name = 'Arial'; lr.font.size = Pt(9); lr.font.color.rgb = BRAND_BLUE
    vp = vc.paragraphs[0]
    vr = vp.add_run(value)
    vr.font.name = 'Arial'; vr.font.size = Pt(9)
    vp.paragraph_format.space_before = Pt(1); vp.paragraph_format.space_after = Pt(1)

doc.add_page_break()

# ─── Appendix: API Endpoints ─────────────────────────────────────────────────
add_styled_heading(doc, "8. Tai lieu tham khao: API Endpoints")
add_body_para(doc, "Danh sach tat ca API endpoints cua he thong (Backend Spring Boot, Base URL: http://localhost:8081/api):")

api_headers = ["Method", "Endpoint", "Mo ta"]
api_data = [
    ["GET", "/api/accounts", "Lay danh sach tai khoan"],
    ["POST", "/api/accounts", "Tao tai khoan moi"],
    ["PUT", "/api/accounts/{id}", "Cap nhat tai khoan"],
    ["PUT", "/api/accounts/{id}/lock", "Khoa tai khoan"],
    ["PUT", "/api/accounts/{id}/unlock", "Mo khoa tai khoan"],
    ["PUT", "/api/accounts/{id}/reset-password", "Dat lai mat khau"],
    ["POST", "/api/auth/login", "Dang nhap"],
    ["POST", "/api/auth/logout", "Dang xuat"],
    ["GET", "/api/merchandise", "Lay danh sach mat hang"],
    ["POST", "/api/merchandise", "Tao mat hang moi"],
    ["GET", "/api/sites", "Lay danh sach chi nhanh"],
    ["POST", "/api/sites", "Tao chi nhanh moi"],
    ["GET", "/api/requests", "Lay danh sach yeu cau"],
    ["POST", "/api/requests", "Tao yeu cau dat hang"],
    ["GET", "/api/requests/{id}", "Lay chi tiet yeu cau"],
    ["GET", "/api/requests/{id}/items", "Lay danh sach mat hang trong yeu cau"],
    ["POST", "/api/requests/{id}/items", "Them mat hang vao yeu cau"],
    ["GET", "/api/requests/status/{status}", "Lay yeu cau theo trang thai"],
    ["GET", "/api/inquiries/pending/site/{siteId}", "Lay yeu cau kiem tra ton kho cho Site"],
    ["GET", "/api/inquiries/{id}/items", "Lay chi tiet yeu cau kiem tra"],
    ["POST", "/api/inquiries", "Gui yeu cau kiem tra ton kho"],
    ["PUT", "/api/inquiries/{id}/respond", "Site tra loi yeu cau kiem tra"],
    ["GET", "/api/inquiries/matrix/{requestId}", "Lay ma tran ton kho theo yeu cau"],
    ["GET", "/api/purchase-orders", "Lay danh sach PO"],
    ["POST", "/api/purchase-orders", "Tao PO moi"],
    ["GET", "/api/purchase-orders/{id}", "Lay chi tiet PO"],
    ["GET", "/api/purchase-orders/{id}/details", "Lay danh sach mat hang trong PO"],
    ["PUT", "/api/purchase-orders/{id}/confirm", "Site xac nhan PO"],
    ["PUT", "/api/purchase-orders/{id}/reject", "Site tu choi PO"],
    ["GET", "/api/purchase-orders/site/{siteId}", "Lay PO theo Site"],
    ["POST", "/api/warehouse/receive-goods", "Kich hoat nhan hang"],
    ["GET", "/api/warehouse/receipt-items/{receiptId}", "Lay chi tiet phieu nhan hang"],
    ["PUT", "/api/warehouse/confirm-receipt/{receiptId}", "Xac nhan nhan hang"],
    ["GET", "/api/warehouse/confirmed-pos", "Lay PO da xac nhan"],
    ["GET", "/api/warehouse/discrepancies", "Lay danh sach chenh lech"],
    ["PUT", "/api/warehouse/discrepancies/{id}/resolve", "Giai quyet chenh lech"],
    ["GET", "/api/warehouse/discrepancies/{id}/messages", "Lay tin nhan chenh lech"],
    ["POST", "/api/warehouse/discrepancies/{id}/messages", "Gui tin nhan chenh lech"],
    ["GET", "/api/audit-logs", "Lay nhat ky he thong"],
    ["GET", "/api/audit-logs/{entityType}/{entityId}", "Lay nhat ky theo doi tuong"],
]

api_table = doc.add_table(rows=len(api_data)+1, cols=3)
api_table.alignment = WD_TABLE_ALIGNMENT.CENTER
make_table_header(api_table, api_headers)
for i, row_data in enumerate(api_data):
    method_bg = RGBColor(0xDC, 0xF8, 0xE6) if row_data[0] == "GET" else \
                RGBColor(0xFE, 0xF3, 0xC7) if row_data[0] == "POST" else \
                RGBColor(0xDB, 0xE8, 0xF7) if row_data[0] == "PUT" else \
                RGBColor(0xFE, 0xE8, 0xE8) if row_data[0] == "DELETE" else \
                RGBColor(0xFF, 0xFF, 0xFF)
    c0 = api_table.rows[i+1].cells[0]
    c1 = api_table.rows[i+1].cells[1]
    c2 = api_table.rows[i+1].cells[2]
    bg = TABLE_ALT_BG if i % 2 == 1 else RGBColor(0xFF, 0xFF, 0xFF)
    set_cell_bg(c0, bg)
    set_cell_bg(c1, bg)
    set_cell_bg(c2, bg)
    p0 = c0.paragraphs[0]
    r0 = p0.add_run(row_data[0])
    r0.bold = True; r0.font.name = 'Courier New'; r0.font.size = Pt(8); r0.font.color.rgb = RGBColor(0x05, 0x96, 0x69)
    p1 = c1.paragraphs[0]
    r1 = p1.add_run(row_data[1])
    r1.font.name = 'Courier New'; r1.font.size = Pt(8); r1.font.color.rgb = BRAND_BLUE
    p2 = c2.paragraphs[0]
    r2 = p2.add_run(row_data[2])
    r2.font.name = 'Arial'; r2.font.size = Pt(8)

for row in api_table.rows:
    row.cells[0].width = Cm(1.8)
    row.cells[1].width = Cm(7)
    row.cells[2].width = Cm(7.2)

# ─── Page Break before Usage Guide ──────────────────────────────────────────
doc.add_page_break()

# ─── Section 9: Usage Guide ─────────────────────────────────────────────────
add_styled_heading(doc, "9. Huong dan su dung he thong")

add_styled_heading(doc, "9.1 Tai khoan mac dinh", level=2)
add_body_para(doc, "He thong co san cac tai khoan kiem tra. Su dung thong tin dang nhap sau:")

acc_guide_data = [
    ["Vai tro", "Email", "Mat khau", "Duong dan dashboard"],
    ["Admin", "admin@system.com", "admin123", "/admin/dashboard"],
    ["Sales", "sales@system.com", "sales123", "/sales/dashboard"],
    ["Warehouse", "warehouse@system.com", "warehouse123", "/warehouse/dashboard"],
    ["Site (US)", "site_us@system.com", "site123", "/site/dashboard"],
    ["Site (JP)", "site_jp@system.com", "site123", "/site/dashboard"],
    ["Site (DE)", "site_de@system.com", "site123", "/site/dashboard"],
]
acc_guide_table = doc.add_table(rows=len(acc_guide_data), cols=4)
acc_guide_table.alignment = WD_TABLE_ALIGNMENT.CENTER
make_table_header(acc_guide_table, acc_guide_data[0])
for i, row_data in enumerate(acc_guide_data[1:]):
    row = acc_guide_table.rows[i+1]
    bg = TABLE_ALT_BG if i % 2 == 1 else RGBColor(0xFF, 0xFF, 0xFF)
    for j, val in enumerate(row_data):
        cell = row.cells[j]
        set_cell_bg(cell, bg)
        p = cell.paragraphs[0]
        r = p.add_run(val)
        r.font.name = 'Arial'
        r.font.size = Pt(9)
        if j == 3:
            r.font.color.rgb = BRAND_BLUE
            r.italic = True
for row in acc_guide_table.rows:
    row.cells[0].width = Cm(3)
    row.cells[1].width = Cm(5)
    row.cells[2].width = Cm(3)
    row.cells[3].width = Cm(5)

add_body_para(doc, "Luu y: Mat khau co the duoc dat lai boi Admin tu trang /admin/accounts.")

add_styled_heading(doc, "9.2 Quy trinh lam viec chuan", level=2)
add_body_para(doc, "Quy trinh dat hang nhap khau theo 6 buoc:")

steps = [
    ("Buoc 1: Sales tao yeu cau", "Nhan vien Sales dang nhap, vao /sales/create-request, chon mat hang va so luong, nhap ngay giao du kien, gui yeu cau."),
    ("Buoc 2: Overseas xu ly yeu cau", "Overseas nhan duoc thong bao yeu cau moi, vao /overseas/process-request/[id] de xem chi tiet va bat dau xu ly."),
    ("Buoc 3: Gui kiem tra ton kho", "Overseas nhan 'Send Stock Check Requests' de gui yeu cau kiem tra ton kho toi cac Site (US, JP, DE)."),
    ("Buoc 4: Site tra loi ton kho", "Dai dien Site vao /site/inquiries, xem yeu cau kiem tra, nhap so luong ton kho thuc te va gui phan hoi."),
    ("Buoc 5: Overseas tao Purchase Order", "Sau khi nhan duoc phan hoi tu cac Site, Overseas xem ma tran ton kho, chon Site dat hang, nhap so luong va tao PO. Site xac nhan hoac tu choi PO."),
    ("Buoc 6: Warehouse nhan hang", "Khi PO duoc xac nhan, Warehouse vao /warehouse/receive/[id], nhap so luong thuc nhan va xac nhan. Neu co chenh lech, giai quyet tai /warehouse/discrepancies."),
]
for title, desc in steps:
    p = doc.add_paragraph(style='List Number')
    r1 = p.add_run(title + " - ")
    r1.bold = True; r1.font.name = 'Arial'; r1.font.size = Pt(10); r1.font.color.rgb = BRAND_BLUE
    r2 = p.add_run(desc)
    r2.font.name = 'Arial'; r2.font.size = Pt(10)
    set_paragraph_spacing(p, before=0, after=60)

add_styled_heading(doc, "9.3 Chuyen ngon ngu", level=2)
add_body_para(doc, "He thong ho tro 2 ngon ngu: Tieng Anh (mac dinh) va Tieng Viet.")
add_body_para(doc, "Cach chuyen doi ngon ngu:")
add_bullet(doc, "Su dung nut VI/EN o goc phai thanh AppBar (sau khi dang nhap)")
add_bullet(doc, "Phim tat (che do dev): Nhan `devlang` bat ky noi dau tren trang")
add_bullet(doc, "Phim tat (che do dev): Nhap Konami Code `↑ ↑ ↓ ↓ ← → ← → B A`")

add_styled_heading(doc, "9.4 Quy tac phien ban tai lieu use case", level=2)
add_body_para(doc, "Tai lieu use case duoc cap nhat khi co thay doi trong codebase. Quy tac phien ban:")

version_rules = [
    ("Patch (vX.Y.Z)", "Sua loi nho, cap nhat chi tiet, dinh dang. VD: v1.0.0 -> v1.0.1"),
    ("Minor (vX.Y.Z)", "Them use case moi, cap nhat nhieu use case cu. VD: v1.0.1 -> v1.1.0"),
    ("Major (vX.Y.Z)", "Them/xoa nhieu use case, thay doi quy trinh lon. VD: v1.1.0 -> v2.0.0"),
]
vr_table = doc.add_table(rows=len(version_rules)+1, cols=2)
vr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
make_table_header(vr_table, ["Loai", "Mo ta"])
for i, (loai, mo_ta) in enumerate(version_rules):
    row = vr_table.rows[i+1]
    bg = TABLE_ALT_BG if i % 2 == 1 else RGBColor(0xFF, 0xFF, 0xFF)
    c0, c1 = row.cells[0], row.cells[1]
    set_cell_bg(c0, bg); set_cell_bg(c1, bg)
    p0 = c0.paragraphs[0]
    r0 = p0.add_run(loai)
    r0.bold = True; r0.font.name = 'Arial'; r0.font.size = Pt(9); r0.font.color.rgb = BRAND_BLUE
    p1 = c1.paragraphs[0]
    r1 = p1.add_run(mo_ta)
    r1.font.name = 'Arial'; r1.font.size = Pt(9)
    c0.width = Cm(4); c1.width = Cm(12)

add_body_para(doc, "Moi cap nhat deu duoc ghi lai trong CHANGELOG.md voi day du thong tin: nguoi thuc hien, use case bi anh huong, loai thay doi, mo ta, va ly do.")

# ─── Save Document ───────────────────────────────────────────────────────────
output_path = os.path.join(DOCS_ROOT, DOC_FILENAME)
doc.save(output_path)
print(f"Document saved: {output_path}")

# ─── Update Version file ─────────────────────────────────────────────────────
version_content = f"""# Current Version

**Version:** {VERSION}
**Generated:** {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}
**File:** {DOC_FILENAME}

## Current Document
- File: `{DOC_FILENAME}`
- Total Use Cases: 21
- Sections: 7 (Admin, Overseas, Site, Warehouse, Sales, API Reference)
- Format: Microsoft Word (.docx)
"""
with open(VERSION_FILE, 'w', encoding='utf-8') as f:
    f.write(version_content)

print(f"Version file updated: {VERSION_FILE}")
