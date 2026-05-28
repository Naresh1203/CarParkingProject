import os
import re
import subprocess

html_path = r'e:\Project_Parking\SmartParking_Project_Report.html'
output_dir = r'e:\Project_Parking\Generated_Diagrams'

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract diagram boxes and their titles
diagrams = []
matches = re.finditer(r'<div class="diagram-box">\s*<strong>(.*?)</strong>.*?<div class="mermaid">(.*?)</div>', content, flags=re.DOTALL)

for match in matches:
    title = match.group(1).replace('/', '_').replace('\\', '_').replace(':', '_').replace('*', '_').replace('?', '_').replace('"', '_').replace('<', '_').replace('>', '_').replace('|', '_').strip()
    mermaid_code = match.group(2)
    diagrams.append((title, mermaid_code))

print(f"Found {len(diagrams)} diagrams.")

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

for i, (title, mermaid_code) in enumerate(diagrams):
    safe_title = f"{i+1}_{title}"
    png_path = os.path.join(output_dir, f"{safe_title}.png")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ margin: 0; padding: 20px; background: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; }}
            .mermaid {{ width: 100%; display: flex; justify-content: center; }}
            .mermaid svg {{ max-width: 100%; height: auto; }}
        </style>
        <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
        <script>
            mermaid.initialize({{ startOnLoad: true, theme: 'neutral' }});
        </script>
    </head>
    <body>
        <div class="mermaid">{mermaid_code}</div>
    </body>
    </html>
    """
    
    temp_html_path = os.path.join(output_dir, f"temp_{i}.html")
    with open(temp_html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--virtual-time-budget=5000",
        "--window-size=1200,1600",
        f"--screenshot={png_path}",
        f"file:///{temp_html_path.replace(chr(92), '/')}"
    ]
    
    subprocess.run(cmd, capture_output=True)
    os.remove(temp_html_path)
    print(f"Generated {png_path}")

print("All diagrams extracted.")
