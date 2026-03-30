import re
from collections import Counter

content = open('ride/views.py', 'r').read()
classes = re.findall(r'^class (\w+)', content, re.MULTILINE)
duplicates = [name for name, count in Counter(classes).items() if count > 1]

if duplicates:
    print(f"DUPLICATE CLASSES FOUND: {duplicates}")
else:
    print("No duplicate classes found.")

with open('ride/views.py', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if 'class ' in line and line.lstrip().startswith('class '):
            print(f"{i+1}: {line.strip()}")
