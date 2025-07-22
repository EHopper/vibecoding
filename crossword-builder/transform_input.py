import json

# Read xword.json
with open('xword.json', 'r', encoding='utf-8') as f:
    xword = json.load(f)

# Extract clues
clues = xword.get('clues', {})
across = clues.get('across', [])
down = clues.get('down', [])

# Write to input.json in the expected format
output = {
    'across': across,
    'down': down
}

with open('input.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=4) 