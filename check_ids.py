import re
with open('static/app.js', encoding='utf-8') as f: js = f.read()
with open('static/index.html', encoding='utf-8') as f: html = f.read()

ids_in_js = re.findall(r"getElementById\('([^']+)'\)", js)
missing = [i for i in ids_in_js if f'id="{i}"' not in html]
print('MISSING IDs:', set(missing))

