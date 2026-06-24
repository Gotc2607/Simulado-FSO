import json

with open('user_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

snippets = [s.strip() for s in text.split('\n\n') if s.strip()]

with open('simulado_so_2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Reset all to non-fixed
for q in data:
    q['fixa'] = False

matched_count = 0
for snippet in snippets:
    import re
    s_clean = re.sub(r'\s+', '', snippet)[:50]
    # Find first non-fixed matching question
    for q in data:
        if not q['fixa']:
            p_clean = re.sub(r'\s+', '', q.get('pergunta', ''))
            if s_clean in p_clean:
                q['fixa'] = True
                matched_count += 1
                break

print(f"Matched exactly {matched_count} questions as fixed out of {len(snippets)} snippets.")

fixed = sum(1 for q in data if q['fixa'])
print(f"Total fixed: {fixed}, Total non-fixed: {len(data) - fixed}")

with open('simulado_so_2.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

