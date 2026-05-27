# DOCS - Tai Lieu Use Case

Thu muc chua tai lieu mo ta use case cua he thong AppBanHang.

## Cau truc

```
DOCS/
├── TaiLieuUseCase_AppBanHang_v1.1.1.docx   # Tai lieu use case (Word) - phien ban hien tai
├── CHANGELOG.md                              # Lich su cap nhat
├── VERSION.md                                # Phien ban hien tai
└── generator/
    ├── generate_usecase_doc.py               # Script tao tai lieu moi
    ├── update_usecase_doc.py                 # Script cap nhat khi co thay doi
    ├── requirements.txt                      # Python dependencies
    └── README.md                             # Huong dan su dung (file nay)
```

## Tao tai lieu moi (lan dau)

Neu chua co tai lieu, chay script generate:

```bash
cd DOCS/generator
pip install python-docx
python generate_usecase_doc.py
```

Script se tao file `TaiLieuUseCase_AppBanHang_v1.0.1.docx` trong thu muc DOCS.

## Cap nhat tai lieu khi co thay doi

Khi codebase co thay doi (them chuc nang moi, sua loi, thay doi quy trinh), chay:

### Che do tuong tac (de su dung hon)

```bash
cd DOCS/generator
python update_usecase_doc.py --interactive
```

### Che do lenh

```bash
cd DOCS/generator
python update_usecase_doc.py \
    --author "Nguyen Van A" \
    --uc "UC-007, UC-008" \
    --type "Updated" \
    --bump "patch" \
    --description "Cap nhat buoc 3: them truong ExpectedDelivery" \
    --reason "Yeu cau moi tu khach hang"
```

## Quy tac phien ban

| Loai | Cu phap | Vi du | Khi nao |
|------|---------|-------|---------|
| Patch | vX.Y.**Z** | v1.0.0 -> v1.0.1 | Sua loi nho, cap nhat chi tiet, dinh dang |
| Minor | vX.**Y**.Z | v1.0.1 -> v1.1.0 | Them use case moi, cap nhat nhieu UC |
| Major | v**X**.Y.Z | v1.1.0 -> v2.0.0 | Them/xoa nhieu UC, thay doi quy trinh lon |

## Quy trinh cap nhat

1. **Phat hien thay doi** trong codebase
2. **Xac dinh phien ban** moi (major/minor/patch)
3. **Chay script cap nhat** voi thong tin:
   - Ten nguoi thuc hien
   - Ma use case bi anh huong
   - Loai thay doi (Added/Updated/Fixed/Removed)
   - Mo ta chi tiet
   - Ly do
4. **Script tu dong**:
   - Tao file Word moi: `TaiLieuUseCase_AppBanHang_vX.Y.Z.docx`
   - Cap nhat `CHANGELOG.md`
   - Cap nhat `VERSION.md`
   - Cap nhat bang trang thai trong `CHANGELOG.md`

## Theo doi thay doi

Moi thay doi deu duoc ghi lai trong `CHANGELOG.md` voi cac truong:
- **Version**: Phien ban moi
- **Date**: Ngay cap nhat
- **Author**: Nguoi thuc hien
- **Use Case(s)**: Ma use case bi anh huong
- **Type**: Loai thay doi
- **Description**: Mo ta chi tiet
- **Reason**: Ly do

## Xem trang thai hien tai

```bash
cat VERSION.md
```

Hoac xem `CHANGELOG.md` de xem toan bo lich su.

## Noi dung tai lieu

Tai lieu bao gom **21 use case** duoc mo ta chi tiet cho 5 vai tro:

| Vai tro | So UC | Mo ta |
|---------|-------|-------|
| Admin | 4 | Quan ly tai khoan, mat hang, chi nhanh |
| Overseas | 6 | Xu ly yeu cau, gui kiem tra ton kho, tao PO |
| Site | 4 | Tra loi kiem tra ton kho, xac nhan/tu choi PO |
| Warehouse | 4 | Nhan hang, giai quyet chenh lech |
| Sales | 3 | Tao yeu cau dat hang, xem lich su |

Moi use case bao gom: ten, tac nhan, loai, URL, API endpoint, mo ta ngan, du lieu dau vao, cac buoc thuc hien, ket qua dau ra, va ngoai le.
