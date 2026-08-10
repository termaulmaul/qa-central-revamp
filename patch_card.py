import sys
from pathlib import Path
target = Path(sys.argv[1])
s = target.read_text()
s = s.replace("import { ReactNode } from 'react';", "import type { CSSProperties, ReactNode } from 'react';")
s = s.replace("style?: React.CSSProperties;", "style?: CSSProperties;")
target.write_text(s)
print("done")
