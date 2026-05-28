import pdfplumber

with pdfplumber.open(r'e:\Project_Parking\final_8_43_SECUREGAURD.pdf') as pdf:
    total = len(pdf.pages)
    print(f"Total pages: {total}")
    for i, page in enumerate(pdf.pages[:30]):
        text = page.extract_text()
        if text:
            print(f"\n{'='*60}")
            print(f"PAGE {i+1}")
            print('='*60)
            print(text)
