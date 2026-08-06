const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove max-w-[200px] truncate
code = code.replace(
  'Badge variant="brand" className="font-mono bg-blue-500/5 text-blue-300 border-blue-200 dark:border-blue-500/20 max-w-[200px] truncate"',
  'Badge variant="brand" className="font-mono bg-blue-500/5 text-blue-300 border-blue-200 dark:border-blue-500/20"'
);

// 2. Change send button to stop button during generation
code = code.replace(
  '<button onClick={handleSend} disabled={llmState.isGenerating || (!prompt.trim() && !attachment)} className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white p-2 rounded-lg spring-transition shadow-md">',
  `{llmState.isGenerating ? (
                <button onClick={abortLLMChat} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg spring-transition shadow-md">
                  <Square size={14} className="fill-current" />
                </button>
              ) : (
                <button onClick={handleSend} disabled={!prompt.trim() && !attachment} className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white p-2 rounded-lg spring-transition shadow-md">`
);

code = code.replace(
  '{llmState.isGenerating ? <Loader size={14} className="animate-spin" /> : <Send size={14} className="ml-0.5" />}',
  '<Send size={14} className="ml-0.5" />'
);
code = code.replace('</button>\n            </div>', '</button>\n              )}\n            </div>');

// 3. Drag and drop file upload
const onDragHandlers = `
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
        const text = await PDFParser.extractText(file);
        setAttachment({ name: file.name, content: text });
      } else {
        const text = await file.text();
        setAttachment({ name: file.name, content: text });
      }
    } catch (err) {
      alert("Failed to read file.");
    }
  };
`;
code = code.replace('const handleFileUpload = async', onDragHandlers + '\n  const handleFileUpload = async');

code = code.replace(
  '<div className="relative border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 focus-within:bg-white dark:bg-zinc-950 spring-transition shadow-sm">',
  '<div \n            onDragOver={handleDragOver}\n            onDrop={handleDrop}\n            className="relative border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 focus-within:bg-white dark:bg-zinc-950 spring-transition shadow-sm">'
);

// 4. Also import Square if missing
if (!code.includes('Square,')) {
  code = code.replace('Send,', 'Send, Square,');
}

fs.writeFileSync(file, code);
console.log("Patched page.tsx left pane successfully.");
