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

const pushSuccessRegex = /await api\.bulkCreateTestCases\(finalProjectCode, finalCasesToPush\)[\s\S]*?showToast\(\`Successfully pushed \$\{testCases\.length\} test cases to Qase!\`, 'success'\)/;
content = content.replace(pushSuccessRegex, `await api.bulkCreateTestCases(finalProjectCode, finalCasesToPush)\n      setIsSuccess(true)`);

const renderRegex = /return \([\s\S]*?className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto relative">/;
content = content.replace(renderRegex, `return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto relative">
      {isSuccess ? (
        <div className="max-w-[1200px] mx-auto w-full p-8 flex flex-col gap-8 pb-20">
          <div>
            <div className="flex items-center w-full relative mb-8 max-w-5xl mx-auto">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-200 dark:bg-zinc-800 z-0"></div>
              <div className="w-full flex justify-between relative z-10">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                    <div className={\`w-8 h-8 rounded-full flex items-center justify-center spring-transition
                      \${step.status === 'current' 
                        ? 'bg-white border border-blue-500 text-blue-500' // completed step (it's step 4)
                        : 'bg-white border border-green-500 text-green-500'}\`}
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
          <div className="flex flex-col items-center justify-center mt-12">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-3xl p-16 max-w-2xl text-center shadow-sm">
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
                    icon={ArrowLeft} 
                    onClick={() => setActiveRoute('dashboard')}
                    className="px-6 py-2.5 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                    Back to Dashboard
                </Button>
                <Button 
                    variant="primary" 
                    onClick={() => setActiveRoute('dashboard')}
                    className="px-10 py-2.5 bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                    Finish
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (`);

const endDivRegex = /<\/div>\s*<\/div>\s*\)\s*\}\s*export default function Dashboard/;
content = content.replace(endDivRegex, `</div>\n      )}</div>\n  )\n}\n\nexport default function Dashboard`);

fs.writeFileSync(file, content);
console.log("Success state patched");
