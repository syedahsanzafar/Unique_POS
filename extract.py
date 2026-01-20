import re

with open('Unique.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract the style block
style_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
if style_match:
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(style_match.group(1).strip())

# Extract the large script block at the end
# It starts after all the <script src=... tags
script_matches = re.finditer(r'<script>(.*?)</script>', html, re.DOTALL)
large_script = ""
for m in script_matches:
    s = m.group(1)
    if 'const DB_KEY' in s:
        large_script = s
        break

if large_script:
    # Add PWA initialization at the top of script.js
    pwa_init = """if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('SW Registered', reg);
        }).catch(err => {
            console.log('SW Failed', err);
        });
    });
}
"""
    with open('script.js', 'w', encoding='utf-8') as f:
        f.write(pwa_init + "\n" + large_script.strip())
