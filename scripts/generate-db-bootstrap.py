"""Compile checked-in SQL migrations for authenticated first-login recovery."""
import json
import sqlite3
from pathlib import Path
root = Path(__file__).resolve().parent.parent
migrations = []
for source in sorted((root / 'migrations').glob('*.sql')):
    statements, buffer = [], ''
    for char in source.read_text():
        buffer += char
        if char == ';' and sqlite3.complete_statement(buffer):
            statement = buffer.strip()
            if not statement.upper().startswith('PRAGMA FOREIGN_KEYS'):
                statements.append(statement)
            buffer = ''
    if buffer.strip():
        raise ValueError(f'Incomplete SQL: {source.name}')
    migrations.append({'name': source.name, 'statements': statements})
(root / 'worker/migrations.generated.js').write_text('// Generated from migrations/*.sql by scripts/generate-db-bootstrap.py. Do not edit.\nexport const migrations = ' + json.dumps(migrations, ensure_ascii=False, indent=2) + ';\n')
