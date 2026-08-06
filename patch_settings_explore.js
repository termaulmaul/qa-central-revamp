const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const exploreReplacement = `const handleExploreCapabilities = async () => {
    if (!qaseState.token || !qaseState.selectedProjectCode) {
      alert("Please ensure token and project are set.");
      return;
    }
    updateQaseState({ status: 'syncing' });
    try {
      const api = new QaseAPI(qaseState.token);
      const capabilities = await api.checkCapabilities(qaseState.selectedProjectCode);
      updateQaseState({
        status: 'connected',
        capabilities,
        lastSyncAt: new Date().toISOString()
      });
    } catch (err: any) {
      updateQaseState({
        status: 'error',
        error: err.message || "Failed to check capabilities"
      });
    }
  };

  const handleTestQase`;

code = code.replace("const handleTestQase", exploreReplacement);

const exploreButtonReplacement = `<Button variant="ghost" className="text-xs py-1 px-3 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-300 hover:bg-blue-50 dark:bg-blue-500/10" disabled={qaseState.status === 'testing' || qaseState.status === 'syncing' || !qaseState.selectedProjectCode} onClick={handleExploreCapabilities}>Explore</Button>`;

code = code.replace(/<Button variant="ghost" className="text-xs py-1 px-3 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-300 hover:bg-blue-50 dark:bg-blue-500\/10" disabled=\{qaseState.status === 'testing' \|\| qaseState.status === 'syncing'\} onClick=\{async \(\) => \{[\s\S]*?\}\}>Explore<\/Button>/, exploreButtonReplacement);

fs.writeFileSync(file, code);
console.log("Updated page.tsx explore functionality successfully.");
