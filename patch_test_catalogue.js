const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const testCatalogueRegex = /const TestCataloguePage = \(\{ setActiveRoute, testCases = \[\], setTestCases \}: \{ setActiveRoute: \(route: string\) => void, testCases\?: any\[\], setTestCases\?: \(tests: any\[\]\) => void \}\) => \{([\s\S]*?)const QaseIntegrationPage/m;

const match = testCatalogueRegex.exec(content);
if (match) {
    const replacement = `function TriCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate) && !checked
  }, [indeterminate, checked])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label}
      style={{
        width: '16px', height: '16px', cursor: 'pointer',
        accentColor: '#6366f1' // indigo-500
      }}
    />
  )
}

const TestCataloguePage = ({ setActiveRoute, testCases = [], setTestCases }: { setActiveRoute: (route: string) => void, testCases?: any[], setTestCases?: (tests: any[]) => void }) => {
  const [expandedTc, setExpandedTc] = useState<string | null>(null);
  const [editingTc, setEditingTc] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(testCases.map((r: any) => r.id)));

  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'completed' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'completed' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'current' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'pending' }
  ];

  const handleSaveTestCase = (updatedTc: any) => {
    if (!setTestCases) return;
    const newCases = testCases.map(tc => tc.tcId === updatedTc.tcId ? updatedTc : tc);
    setTestCases(newCases);
  };

  const handleDeleteTestCase = (tcToDelete: any) => {
    if (!setTestCases) return;
    const newCases = testCases.filter(tc => tc.tcId !== tcToDelete.tcId);
    setTestCases(newCases);
  };

  const toggleSuite = (cases: any[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const c of cases) {
        if (checked) next.add(c.id)
        else next.delete(c.id)
      }
      return next
    })
  }

  const handleDeleteSelected = () => {
    if (!setTestCases) return;
    const count = selectedIds.size
    setTestCases(testCases.filter((t) => !selectedIds.has(t.id)))
    setExpandedTc((prev) => (prev && selectedIds.has(prev) ? null : prev))
    setSelectedIds(new Set())
  }

  const groupedTcs = testCases.reduce(
    (acc: any, tc: any) => {
      const s = tc.suite || 'General';
      if (!acc[s]) acc[s] = []
      acc[s].push(tc)
      return acc
    },
    {} as Record<string, any[]>
  )

  const selectedCount = selectedIds.size

  return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20">
        
        {/* Header & Pipeline Workflow */}
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Test Catalogue Review</h2>
          
          <div className="flex items-center w-full relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-100 dark:bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                  <div className={\`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    \${step.status === 'current' 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'}\`}
                  >
                    {step.status === 'completed' ? <Check size={18} /> : <step.icon size={18} />}
                  </div>
                  <span className={\`text-xs font-medium \${step.status === 'current' ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}\`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm mb-2">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Library size={16} className="text-indigo-500" />
               </div>
               <span className="text-sm text-zinc-600 dark:text-zinc-400">Generated <strong className="text-zinc-800 dark:text-zinc-200">{testCases.length}</strong> test cases grouped by capability.</span>
            </div>
            {selectedCount > 0 && (
              <div className="flex items-center gap-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{selectedCount} selected</span>
                <button
                  onClick={handleDeleteSelected}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-500 flex items-center gap-1 font-medium"
                >
                  <Trash2 size={14} /> Delete Selected
                </button>
              </div>
            )}
        </div>

        {/* Test Catalogue Content */}
        <div className="flex flex-col gap-6">
          {Object.entries(groupedTcs).map(([suite, cases]: [string, any[]]) => {
            const suiteSelected = cases.every((c) => selectedIds.has(c.id))
            const suiteIndeterminate = cases.some((c) => selectedIds.has(c.id)) && !suiteSelected

            return (
              <div key={suite} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
                  <TriCheckbox
                    checked={suiteSelected}
                    indeterminate={suiteIndeterminate}
                    onChange={(checked) => toggleSuite(cases, checked)}
                    label={\`Select all in \${suite}\`}
                  />
                  <div className="flex flex-1 items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium text-sm">
                    <Database size={16} className="text-indigo-500" /> {suite}
                  </div>
                  <span className="text-xs text-zinc-500">{cases.length} cases</span>
                </div>
                
                <div className="flex flex-col">
                  {cases.map((tc) => {
                    const isExpanded = expandedTc === tc.id;
                    return (
                      <React.Fragment key={tc.id}>
                        <div className="flex items-start gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 spring-transition group">
                          <div className="mt-1">
                            <TriCheckbox
                              checked={selectedIds.has(tc.id)}
                              onChange={(checked) => {
                                const next = new Set(selectedIds);
                                if (checked) next.add(tc.id);
                                else next.delete(tc.id);
                                setSelectedIds(next);
                              }}
                              label={tc.tcId}
                            />
                          </div>
                          <div className="flex-1 cursor-pointer" onClick={() => setExpandedTc(isExpanded ? null : tc.id)}>
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded">{tc.tcId}</code>
                              <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200">{tc.title}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={tc.priority === 'Critical' || tc.priority === 'P0' ? 'danger' : tc.priority === 'High' || tc.priority === 'P1' ? 'warning' : 'default'}>
                                {tc.priority || 'Medium'}
                              </Badge>
                              <Badge variant={tc.behavior === 'Positive' ? 'success' : 'warning'}>
                                {tc.behavior || 'Positive'}
                              </Badge>
                            </div>
                          </div>
                          <button 
                              onClick={(e) => { e.stopPropagation(); setEditingTc(tc); }}
                              className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <Edit3 size={14} />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800 p-5">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
                                  <div>
                                      <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pre-condition</h4>
                                      <p className="text-zinc-700 dark:text-zinc-300 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg leading-relaxed">
                                          {tc.precondition || 'No pre-condition specified'}
                                      </p>
                                      
                                      <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-6">Post-condition</h4>
                                      <p className="text-zinc-700 dark:text-zinc-300 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg leading-relaxed">
                                          {tc.postcondition || 'No post-condition specified'}
                                      </p>
                                  </div>
                                  <div>
                                      <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Test Steps</h4>
                                      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
                                          <table className="w-full text-xs">
                                              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                                                  <tr>
                                                      <th className="px-3 py-2.5 text-left font-medium text-zinc-600 dark:text-zinc-400 w-8">#</th>
                                                      <th className="px-3 py-2.5 text-left font-medium text-zinc-600 dark:text-zinc-400">Action</th>
                                                      <th className="px-3 py-2.5 text-left font-medium text-zinc-600 dark:text-zinc-400">Expected Result</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                                  {tc.steps?.map((step: any, sIdx: number) => (
                                                      <tr key={sIdx}>
                                                          <td className="px-3 py-2.5 text-zinc-400 font-mono text-[10px]">{sIdx + 1}</td>
                                                          <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300 leading-relaxed">{step.action}</td>
                                                          <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300 leading-relaxed">{step.expectedResult}</td>
                                                      </tr>
                                                  ))}
                                                  {(!tc.steps || tc.steps.length === 0) && (
                                                      <tr>
                                                          <td colSpan={3} className="px-3 py-4 text-center text-zinc-500 italic">No steps defined</td>
                                                      </tr>
                                                  )}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                              </div>
                          </div>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            )
          })}
          
          {testCases.length === 0 && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 p-12 text-center">
              <div className="flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
                <Library size={32} className="mb-3 opacity-20" />
                <p>No test cases generated.</p>
                <p className="text-xs mt-1 opacity-70">Please go back and analyze a PRD first.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-zinc-200 dark:border-zinc-800/80 mt-auto shrink-0">
            <Button 
                variant="secondary" 
                icon={ArrowLeft} 
                onClick={() => setActiveRoute('coverage-audit')}
                className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
                Back
            </Button>
            <Button 
                variant="primary" 
                icon={Link2} 
                onClick={() => setActiveRoute('qase-integration')}
                className="px-6 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            >
                Continue to Sync
            </Button>
        </div>
      </div>
      
      {editingTc && (
        <EditTestCaseModal
          tc={editingTc}
          onClose={() => setEditingTc(null)}
          onSave={handleSaveTestCase}
          onDelete={handleDeleteTestCase}
        />
      )}
    </div>
  );
};

const QaseIntegrationPage`;

    content = content.replace(match[0], replacement);
    fs.writeFileSync(file, content);
    console.log("Replaced TestCataloguePage!");
} else {
    console.log("Regex not matched!");
}
