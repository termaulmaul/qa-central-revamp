const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /) : \(\n      \{\(errorToast \|\| successToast\) && \(/,
  ') : (\n      <>\n      {(errorToast || successToast) && ('
);

content = content.replace(
  /<\/div>\n      \)\}<\/div>\n  \)\n\}\n\nexport default function Dashboard/,
  '</div>\n      </>\n      )}</div>\n  )\n}\n\nexport default function Dashboard'
);

fs.writeFileSync(file, content);
console.log("Fixed syntax");
