import re

with open("src/app/modules/performance/legacy-theme.css", "r") as f:
    content = f.read()

# Fix table
content = re.sub(
    r"table\.mock\s*\{\s*@apply w-full text-left border-collapse;\s*\}",
    "table.mock {\n    @apply w-full text-left text-sm border-collapse;\n  }",
    content
)

content = re.sub(
    r"table\.mock thead th\s*\{\s*@apply px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 sticky top-0;\s*\}",
    "table.mock thead th {\n    @apply px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 bg-blue-50/50 dark:bg-blue-900/10 sticky top-0;\n  }",
    content
)

content = re.sub(
    r"table\.mock tbody tr\s*\{\s*@apply hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0;\s*\}",
    "table.mock tbody tr {\n    @apply hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0;\n  }",
    content
)

# Fix Primary Button (if it exists)
content = re.sub(
    r"\.pt-primary-btn\s*\{\s*@apply[^}]+\}",
    ".pt-primary-btn {\n    @apply bg-blue-600 hover:bg-blue-700 text-white border-transparent px-3 py-1.5 rounded-md text-xs font-medium transition-colors;\n  }",
    content
)

with open("src/app/modules/performance/legacy-theme.css", "w") as f:
    f.write(content)
