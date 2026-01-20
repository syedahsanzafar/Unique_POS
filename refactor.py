import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the style block
# Match <style> ... </style> but only the large one. 
# Actually, there's only one <style> block usually.
content = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="style.css">\n    <link rel="manifest" href="manifest.json">', content, flags=re.DOTALL)

# Replace the large script block at the end.
# We want to keep the external lib scripts at the top.
# The large script block starts with const DB_KEY = 'ugp_v37_final';
content = re.sub(r'<script>\s+const DB_KEY = .*?</script>', '<script src="script.js"></script>', content, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
