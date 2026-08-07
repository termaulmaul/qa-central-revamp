import re

with open("src/app/modules/performance/tabs/ExecuteTestTab.tsx", "r") as f:
    content = f.read()

# Replace pt-term wrapper with empty fragment or standard layout
content = content.replace('<div className="pt-term">', '<div className="flex flex-col gap-6">')
content = content.replace('<header className="pt-term-head">', '<div className="panel"><div className="ph"><h3>Execute Performance Test</h3></div><div className="panel-body flex flex-col gap-2">')
content = content.replace('<h1 className="pt-term-title">PERF_TEST_MANAGER.EXE</h1>', '<h2 className="text-xl font-bold">Configure and Execute Test</h2>')
content = content.replace('<p className="pt-term-sub">CONFIGURE AND EXECUTE K6 LOAD TESTS ACROSS INFRASTRUCTURE.</p>', '<p className="text-zinc-500">Run load tests manually and track execution status.</p></div></div>')
content = content.replace('</header>', '')

content = content.replace('<div className="pt-term-bar">', '<div className="panel"><div className="panel-body flex items-center gap-4">')
content = content.replace('<span className="pt-lbl">[PROJECT]</span>', '<span className="text-sm font-semibold text-zinc-500 uppercase">Project</span>')

content = content.replace('<section className="pt-term-block">', '<div className="panel">')
content = content.replace('</section>', '</div>')
content = content.replace('<section className="pt-term-block pt-runtime-block">', '<div className="panel">')

content = content.replace('<div className="pt-block-head">', '<div className="ph"><h3>')
content = content.replace('<span className="pt-lbl">[TARGET_NODE]</span>', 'Target Node')
content = content.replace('<span className="pt-lbl">[TARGET_SCRIPT]</span>', 'Target Script')
content = content.replace('<span className="pt-lbl">[RUNTIME_CFG]</span>', 'Runtime Configuration')
content = content.replace('<span className="pt-lbl">[COMMAND_PREVIEW]</span>', 'Command Preview')
content = content.replace('</div>\n        <div className="pt-node-grid">', '</h3></div>\n        <div className="panel-body grid grid-cols-1 md:grid-cols-3 gap-4">')
content = content.replace('</div>\n        <div className="pt-script-row">', '</h3></div>\n        <div className="panel-body flex flex-col gap-4">')
content = content.replace('</div>\n        <div className="pt-cfg-grid">', '</h3></div>\n        <div className="panel-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">')
content = content.replace('</div>\n        <pre className="pt-cmd">', '</h3></div>\n        <div className="panel-body">\n          <pre className="bg-zinc-950 p-4 rounded-lg font-mono text-sm text-green-400 overflow-x-auto">')

content = content.replace('<div className="pt-term-actions">', '<div className="flex items-center justify-end gap-4 mt-2">')
content = content.replace('<button className="pt-term-btn"', '<button className="pt-ghost-btn"')
content = content.replace('<button className="pt-term-btn pt-run-btn"', '<button className="pt-primary-btn"')

# Node cards
content = content.replace('className={`pt-node-card${target === \'Onprem\' ? \' active\' : \'\'}`}', 'className={`flex flex-col p-4 border rounded-xl transition-colors text-left ${target === \'Onprem\' ? \'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800\' : \'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700\'}`}')
content = content.replace('className={`pt-node-card${target === \'Oncloud\' ? \' active\' : \'\'}`}', 'className={`flex flex-col p-4 border rounded-xl transition-colors text-left ${target === \'Oncloud\' ? \'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800\' : \'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700\'}`}')
content = content.replace('<div className="pt-node-card pt-node-info">', '<div className="flex flex-col p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">')

# labels
content = content.replace('<span className="pt-field-lbl">', '<span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">')
content = content.replace('<label className="pt-field">', '<label className="block">')

with open("src/app/modules/performance/tabs/ExecuteTestTab.tsx", "w") as f:
    f.write(content)
