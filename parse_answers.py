import re
import json

with open('full_user_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract answers using regex
matches = re.finditer(r'(?s)A resposta correta é:\s*(.*?)(?=\nQuestão \d+|$)', text)
answers = [m.group(1).strip() for m in matches]

with open('simulado_so_2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract snippets to map which question corresponds to which answer
snippets = [s.strip() for s in text.split('\n\n') if s.strip() and not s.startswith('Questão') and not s.startswith('Feedback') and not s.startswith('A resposta correta') and not s.startswith('Sua resposta') and not s.startswith('Incorreto') and not s.startswith('Correto') and not s.startswith('Atingiu') and not s.startswith('Marcar') and not s.startswith('Texto da') and not re.match(r'^[a-e]\.', s)]

# Wait, it's easier to pair snippets with answers
# The user text has the format:
# Snippet
# Questão ...
# ...
# A resposta correta é: \n\n Answer

# Let's split by "A resposta correta é:"
blocks = re.split(r'A resposta correta é:\s*', text)
pairs = []
for i in range(1, len(blocks)):
    ans = blocks[i].split('\nQuestão')[0].strip()
    # The snippet is in blocks[i-1]
    prev_text = blocks[i-1]
    # To find the snippet, we can look for the text before "Questão "
    m = re.search(r'(?s)(.*?)(?:Questão \d+ |Texto da questão)', prev_text.strip().split('\n\n')[-1])
    # The first line of the snippet usually:
    snippet_lines = prev_text.strip().split('\n')
    # Find the first line that is a question text
    for line in snippet_lines:
        if len(line) > 50 and not line.startswith('Questão'):
            snippet = line[:50].strip()
            pairs.append((snippet, ans))
            break

print(f"Extracted {len(pairs)} pairs.")
for i, p in enumerate(pairs):
    print(f"{i+1}: {p[1][:30]}...")

