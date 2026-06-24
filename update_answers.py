import re
import json

with open('full_user_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

blocks = re.split(r'A resposta correta é:\s*', text)
pairs = []
for i in range(1, len(blocks)):
    ans = blocks[i].split('\nQuestão')[0].strip()
    prev_text = blocks[i-1]
    snippet_lines = prev_text.strip().split('\n')
    for line in snippet_lines:
        if len(line) > 50 and not line.startswith('Questão'):
            snippet = line[:50].strip()
            pairs.append((snippet, ans))
            break

with open('simulado_so_2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

changed = 0
for snippet, ans in pairs:
    s_clean = re.sub(r'\s+', '', snippet)
    ans_clean = re.sub(r'\s+', '', ans).lower()
    
    # find question
    for q in data:
        if q.get('fixa'):
            p_clean = re.sub(r'\s+', '', q.get('pergunta', ''))
            if s_clean in p_clean:
                # Find which option matches this answer
                correct_letter = None
                for i, opt in enumerate(q.get('opcoes', [])):
                    opt_clean = re.sub(r'\s+', '', opt).lower()
                    if ans_clean in opt_clean or opt_clean in ans_clean:
                        correct_letter = chr(97 + i)
                        break
                
                if correct_letter:
                    if q.get('gabarito') != correct_letter:
                        print(f"Updating ID {q['id']}: {q['gabarito']} -> {correct_letter}")
                        q['gabarito'] = correct_letter
                        changed += 1
                else:
                    print(f"Warning: Answer '{ans}' not found in options for ID {q['id']}")
                
                break

print(f"Total questions updated: {changed}")

with open('simulado_so_2.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

