import os
import shutil
import re

src_dir = r"e:\Project_Parking\project photo"
dst_dir1 = r"e:\Project_Parking\images"
dst_dir2 = r"e:\Project_Parking\SmartParking.Server\wwwroot\images"

for d in [dst_dir1, dst_dir2]:
    if not os.path.exists(d):
        os.makedirs(d)

mappings = {
    "WhatsApp Image 2026-04-24 at 10.18.16 PM.jpeg": "er_diagram.jpeg",
    "WhatsApp Image 2026-04-24 at 10.18.17 PM (1).jpeg": "sequence_diagram.jpeg",
    "WhatsApp Image 2026-04-24 at 10.18.17 PM.jpeg": "use_case_diagram.jpeg",
    "WhatsApp Image 2026-04-24 at 10.18.18 PM (1).jpeg": "activity_owner.jpeg",
    "WhatsApp Image 2026-04-24 at 10.18.18 PM (2).jpeg": "deployment_diagram.jpeg",
    "WhatsApp Image 2026-04-24 at 10.18.18 PM (3).jpeg": "component_diagram.jpeg",
    "WhatsApp Image 2026-04-24 at 10.18.18 PM.jpeg": "activity_user.jpeg"
}

for src_name, dst_name in mappings.items():
    src_path = os.path.join(src_dir, src_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, os.path.join(dst_dir1, dst_name))
        shutil.copy2(src_path, os.path.join(dst_dir2, dst_name))

html_path = r'e:\Project_Parking\SmartParking_Project_Report.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

def replace_diagram(title, img_html, content_str):
    pattern = r'<div class="diagram-box">\s*<strong>' + re.escape(title) + r'</strong>.*?<span class="label">(.*?)</span>\s*</div>'
    replacement = r'''<div class="diagram-box">
      <strong>''' + title + r'''</strong><br>
      ''' + img_html + r'''
      <br><span class="label">\1</span>
    </div>'''
    return re.sub(pattern, replacement, content_str, flags=re.DOTALL)

img1 = '<img src="images/use_case_diagram.jpeg" style="max-width: 100%; max-height: 800px; margin-top: 10px;" alt="Use Case Diagram">'
content = replace_diagram("Use Case Diagram", img1, content)

img2 = '<img src="images/sequence_diagram.jpeg" style="max-width: 100%; max-height: 800px; margin-top: 10px;" alt="Sequence Diagram">'
content = replace_diagram("Sequence Diagram (Booking Flow)", img2, content)

img3 = '''<img src="images/activity_user.jpeg" style="max-width: 100%; max-height: 800px; margin-top: 10px;" alt="Activity Diagram User"><br><br>
      <strong>Activity Diagram (Owner)</strong><br>
      <img src="images/activity_owner.jpeg" style="max-width: 100%; max-height: 800px; margin-top: 10px;" alt="Activity Diagram Owner">'''
content = replace_diagram("Activity Diagram (Login)", img3, content)
content = content.replace("<strong>Activity Diagram (Login)</strong>", "<strong>Activity Diagrams</strong>")
content = content.replace("Fig 3.3.7 – Login Activity Diagram", "Fig 3.3.7 – Activity Diagrams")

img4 = '<img src="images/component_diagram.jpeg" style="max-width: 100%; max-height: 800px; margin-top: 10px;" alt="Component Diagram">'
content = replace_diagram("Component Diagram", img4, content)

img5 = '<img src="images/deployment_diagram.jpeg" style="max-width: 100%; max-height: 800px; margin-top: 10px;" alt="Deployment Diagram">'
content = replace_diagram("Deployment Diagram", img5, content)

img6 = '<img src="images/er_diagram.jpeg" style="max-width: 100%; max-height: 800px; margin-top: 10px;" alt="ER Diagram">'
content = replace_diagram("Entity Relationship Diagram", img6, content)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Images inserted successfully!")
