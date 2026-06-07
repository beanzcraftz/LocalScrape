import re
with open('static/app.js', encoding='utf-8') as f: js = f.read()
with open('static/index.html', encoding='utf-8') as f: html = f.read()

q_in_js = re.findall(r"querySelector\('([^']+)'\)", js)
missing_q = []
for q in q_in_js:
    if q.startswith('.'):
        cls = q[1:]
        if cls not in html:
            missing_q.append(q)
print('MISSING Selectors:', set(missing_q))

