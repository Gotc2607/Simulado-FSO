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
                # Find which option matches this answer exactly or contains it safely
                correct_letter = None
                
                # First try exact match (ignoring non-alphanumeric at start/end)
                def clean_opt(o):
                    # remove a., b., etc and trailing spaces/dots
                    o = re.sub(r'^[a-e]\.', '', o)
                    o = re.sub(r'[\.\s]+$', '', o).strip()
                    return o.lower()
                
                ans_compare = re.sub(r'[\.\s]+$', '', ans).strip().lower()

                for i, opt in enumerate(q.get('opcoes', [])):
                    opt_compare = clean_opt(opt)
                    
                    if opt_compare == ans_compare:
                        correct_letter = chr(97 + i)
                        break
                
                if not correct_letter:
                    # Try partial match but prefer the one that is closest in length
                    best_match = None
                    best_diff = 9999
                    for i, opt in enumerate(q.get('opcoes', [])):
                        opt_compare = clean_opt(opt)
                        if ans_compare in opt_compare or opt_compare in ans_compare:
                            diff = abs(len(ans_compare) - len(opt_compare))
                            if diff < best_diff:
                                best_diff = diff
                                best_match = chr(97 + i)
                    correct_letter = best_match

                if correct_letter:
                    if q.get('gabarito') != correct_letter:
                        print(f"Updating ID {q['id']}: {q['gabarito']} -> {correct_letter} (Answer text: '{ans}')")
                        q['gabarito'] = correct_letter
                        changed += 1
                else:
                    print(f"Warning: Answer '{ans}' not found in options for ID {q['id']}")
                
                break

print(f"Total questions updated: {changed}")

with open('simulado_so_2.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

