const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the actions footer from the main form area
const footerRegex = /\{\/\* Actions Footer \*\/\}\s*\{isUploaded && \([\s\S]*?\}\)\}\s*<\/div>\s*\{\/\* Side Panel \(33%\) \*\/\}/;
const footerMatch = content.match(footerRegex);
if (footerMatch) {
    let replaced = content.replace(footerMatch[0], '</div>\n\n          {/* Side Panel (33%) */}');
    
    // Now inject it in the side panel
    // Find Action Button (Desktop Side Panel)
    const sidePanelActionRegex = /\{\/\* Action Button \(Desktop Side Panel\) \*\/\}\s*\{\!isUploaded && \([\s\S]*?\}\)\}\s*<\/div>\s*<\/div>\s*<\/div>/;
    const sidePanelMatch = replaced.match(sidePanelActionRegex);
    if (sidePanelMatch) {
        let sidePanelActionNew = `{/* Action Button (Desktop Side Panel) */}
            {!isUploaded ? (
              <div className="pt-2">
                <Button variant="primary" icon={Sparkles} className="w-full py-2.5 pointer-events-none opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  Begin AI Analysis
                </Button>
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                <Button 
                  variant="primary" 
                  icon={Sparkles} 
                  className="w-full py-2.5 text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-50"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Begin AI Analysis'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => { setIsUploaded(false); setLocalText(''); }} 
                  className="w-full text-rose-600 dark:text-rose-400 hover:text-rose-300 hover:bg-rose-50 dark:bg-rose-500/10 border-transparent py-2.5"
                >
                  Clear Document
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>`;
        replaced = replaced.replace(sidePanelMatch[0], sidePanelActionNew);
        fs.writeFileSync(file, replaced);
        console.log("Button patched!");
    } else {
        console.log("Side panel action not found!");
    }
} else {
    console.log("Footer not found!");
}
