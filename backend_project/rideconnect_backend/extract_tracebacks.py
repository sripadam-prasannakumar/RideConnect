import re

def extract_tracebacks(log_file, num_matches=5):
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Tracebacks usually start with "Traceback (most recent call last):"
    matches = list(re.finditer(r'Traceback \(most recent call last\):', content))
    
    print(f"Found {len(matches)} tracebacks.")
    
    for i, match in enumerate(matches[-num_matches:]):
        start = match.start()
        # Find the next 2000 chars or until next traceback
        end = matches[matches.index(match)+1].start() if matches.index(match)+1 < len(matches) else start + 3000
        print(f"\n--- Traceback {len(matches) - num_matches + i + 1} ---")
        print(content[start:end])

if __name__ == "__main__":
    import sys
    log_file = "server_debug.log"
    if len(sys.argv) > 1:
        log_file = sys.argv[1]
    extract_tracebacks(log_file)
