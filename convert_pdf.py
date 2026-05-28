from pdf2docx import Converter

pdf_file = r'e:\Project_Parking\SmartParking_Project_Report.pdf'
docx_file = r'e:\Project_Parking\SmartParking_Project_Report.docx'

# convert pdf to docx
cv = Converter(pdf_file)
cv.convert(docx_file, start=0, end=None)
cv.close()

print(f"Successfully converted to {docx_file}")
