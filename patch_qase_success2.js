const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `const QaseIntegrationPage = ({ setActiveRoute, testCases = [] }: { setActiveRoute: (route: string) => void, testCases?: any[] }) => {
  const { token = '' } = useQaseState()
  const setToken = (newToken: string) => updateQaseState({ token: newToken })
  const [testing, setTesting] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [projects, setProjects] = useState<QaseProject[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectCode, setNewProjectCode] = useState('')
  const [creatingProjectLoader, setCreatingProjectLoader] = useState(false)
  const [suites, setSuites] = useState<QaseSuite[]>([])
  const [selectedSuite, setSelectedSuite] = useState('')
  const [loadingSuites, setLoadingSuites] = useState(false)
  const [isCreatingSuite, setIsCreatingSuite] = useState(false)
  const [newSuiteTitle, setNewSuiteTitle] = useState('')
  const [creatingSuiteLoader, setCreatingSuiteLoader] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false) // Added success state`;

content = content.replace(
  /const QaseIntegrationPage = \(\{ setActiveRoute, testCases = \[\] \}: \{ setActiveRoute: \(route: string\) => void, testCases\?: any\[\] \}\) => \{([\s\S]*?)const \[successToast, setSuccessToast\] = useState<string \| null>\(null\)/,
  replacement
);

const pushSuccessRegex = /await api\.bulkCreateTestCases\(finalProjectCode, finalCasesToPush\)\n      showToast\(\`Successfully pushed \$\{testCases\.length\} test cases to Qase!\`, 'success'\)/;
content = content.replace(pushSuccessRegex, `await api.bulkCreateTestCases(finalProjectCode, finalCasesToPush)\n      setIsSuccess(true)`);

// Find the return block start
const renderStart = content.indexOf(`  return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto relative">`);

// Replace the return block entirely. It ends with: `    </div>\n  );\n};\n\nexport default function Dashboard`
// We will replace from renderStart to the end of QaseIntegrationPage.
const targetEnd = content.indexOf('export default function Dashboard');
const beforeRender = content.substring(0, renderStart);
const dashboardComponent = content.substring(targetEnd);

const newRender = `  return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto relative">
      {(errorToast || successToast) && (
        <div className={\`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-lg text-sm z-[200] text-white \${errorToast ? 'bg-red-500' : 'bg-emerald-500'}\`}>
            {errorToast || successToast}
        </div>
      )}
      
      {isSuccess ? (
        <div className="max-w-[1200px] mx-auto w-full p-8 flex flex-col gap-8 pb-20">
          <div>
            <div className="flex items-center w-full relative mb-8 max-w-5xl mx-auto">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-200 dark:bg-zinc-800 z-0"></div>
              <div className="w-full flex justify-between relative z-10">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                    <div className={\`w-12 h-12 rounded-full flex items-center justify-center spring-transition
                      \${step.status === 'current' 
                        ? 'bg-white border border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-white border border-zinc-200 text-zinc-400'}\`}
                    >
                      {step.status === 'current' ? <Link2 size={16} /> : <step.icon size={16} />}
                    </div>
                    <span className={\`text-xs \${step.status === 'current' ? 'text-zinc-800 dark:text-zinc-200 font-medium' : 'text-zinc-500'}\`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center mt-12">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border-none rounded-3xl p-16 max-w-2xl text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 bg-white dark:bg-emerald-800 rounded-full flex items-center justify-center border-2 border-emerald-500 text-emerald-500 dark:text-white">
                  <Check size={24} strokeWidth={3} />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Successfully Synced to Qase</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed text-sm px-8">
                {testCases.length} test cases have been successfully synced to the Qase project repository. You can now view and execute them directly on the Qase platform.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button 
                    variant="secondary" 
                    onClick={() => setActiveRoute('dashboard')}
                    className="px-6 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border-none text-zinc-700 dark:text-zinc-300"
                >
                    &larr; Back to Dashboard
                </Button>
                <Button 
                    variant="primary" 
                    onClick={() => setActiveRoute('dashboard')}
                    className="px-10 py-2 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm"
                >
                    Finish
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div className="max-w-[1200px] mx-auto w-full p-8 flex flex-col gap-8 pb-20">
        {/* Header & Pipeline Workflow */}
        <div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-500">Qase Integration</h2>
              <p className="text-sm text-zinc-900 dark:text-zinc-100 mt-1">Push {testCases.length} test cases to Qase or download as JSON</p>
            </div>
            <Button 
                variant="secondary" 
                icon={ArrowLeft} 
                onClick={() => setActiveRoute('test-catalogue')}
                className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 border border-zinc-200 dark:border-zinc-800"
            >
                Back
            </Button>
          </div>
          
          <div className="flex items-center w-full relative mb-8 max-w-5xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-200 dark:bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                  <div className={\`w-8 h-8 rounded-full flex items-center justify-center spring-transition
                    \${step.status === 'current' 
                      ? 'bg-blue-600 text-white' 
                      : step.status === 'completed' || step.status === 'pending'
                        ? 'bg-white border border-green-500 text-green-500'
                        : 'bg-white border border-zinc-300 text-zinc-400'}\`}
                  >
                    {step.status === 'current' ? <Link2 size={14} /> : <Check size={14} />}
                  </div>
                  <span className={\`text-xs \${step.status === 'current' ? 'text-blue-600 font-medium' : 'text-green-500'}\`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Qase Connection & Settings */}
            <div className={\`rounded-xl border \${tokenValid ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/50' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'} p-6 relative overflow-hidden flex flex-col justify-between\`}>
                {!tokenValid ? (
                    <div className="flex flex-col h-full justify-center space-y-4">
                        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium pb-2 border-b border-zinc-100 dark:border-zinc-800">
                            <Network size={18} /> Qase Authentication
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Qase API Token</label>
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Enter your Qase API token"
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            <p className="text-xs text-zinc-500">Get your token from Qase Settings &rarr; API Tokens</p>
                        </div>
                        <Button 
                            variant="primary" 
                            onClick={handleTestConnection} 
                            disabled={testing}
                            className="w-full mt-4 justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                        >
                            {testing ? <><Loader size={16} className="animate-spin mr-2" /> Testing Connection...</> : 'Test Connection'}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-medium">
                                <Check size={18} /> Connected to Qase
                            </div>
                            <Button 
                                variant="primary" 
                                onClick={handlePushToQase}
                                disabled={pushing || (!selectedProject && !isCreatingProject)}
                                className="bg-orange-300 hover:bg-orange-400 text-orange-900 border-none shadow-sm px-6 py-2"
                            >
                                {pushing ? <><Loader size={16} className="animate-spin mr-2" /> Pushing...</> : 'Push to Qase'}
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">
                                    Project
                                    {!isCreatingProject && (
                                        <button onClick={() => setIsCreatingProject(true)} className="text-blue-600 hover:text-blue-700 text-xs flex items-center">
                                            <Plus size={12} className="mr-0.5" /> New Project
                                        </button>
                                    )}
                                </label>
                                
                                {isCreatingProject ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newProjectTitle}
                                            onChange={(e) => setNewProjectTitle(e.target.value)}
                                            placeholder="Name"
                                            className="w-full px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                        />
                                        <input
                                            type="text"
                                            value={newProjectCode}
                                            onChange={(e) => setNewProjectCode(e.target.value.toUpperCase())}
                                            placeholder="CODE"
                                            maxLength={10}
                                            className="w-20 px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                                        />
                                        <button onClick={() => setIsCreatingProject(false)} className="text-zinc-400 hover:text-zinc-600">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-zinc-800"
                                    >
                                        <option value="">Choose project...</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.code}>{p.title} ({p.code})</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">
                                    Target Suite
                                    {!isCreatingSuite && selectedProject && (
                                        <button onClick={() => setIsCreatingSuite(true)} className="text-blue-600 hover:text-blue-700 text-xs flex items-center">
                                            <Plus size={12} className="mr-0.5" /> New Suite
                                        </button>
                                    )}
                                </label>
                                
                                {isCreatingSuite ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSuiteTitle}
                                            onChange={(e) => setNewSuiteTitle(e.target.value)}
                                            placeholder="Suite Name"
                                            className="w-full px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                        />
                                        <button onClick={() => setIsCreatingSuite(false)} className="text-zinc-400 hover:text-zinc-600">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedSuite}
                                        onChange={(e) => setSelectedSuite(e.target.value)}
                                        disabled={!selectedProject || loadingSuites}
                                        className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-zinc-800 disabled:opacity-50"
                                    >
                                        <option value="">Root (No Suite)</option>
                                        {suites.map((s) => (
                                            <option key={s.id} value={s.id}>{s.parent_id ? '\u00A0\u00A0\u2514 ' : ''}{s.title}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: JSON Preview & Actions */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        <Code2 size={16} className="text-zinc-400" /> JSON Payload Preview
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCopy} className="p-1.5 rounded text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Copy JSON">
                            <Copy size={14} />
                        </button>
                        <button onClick={handleDownload} className="p-1.5 rounded text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Download JSON">
                            <Download size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 p-4 overflow-auto font-mono text-[11px] text-zinc-600 dark:text-zinc-400 max-h-[300px]">
                    <pre>{JSON.stringify(casesToPush, null, 2)}</pre>
                </div>
            </div>
        </div>
      </div>
      )}
    </div>
  );
};

`;

fs.writeFileSync(file, beforeRender + newRender + dashboardComponent);
console.log("Success state patched");
