// Custom Variables editor — pt-framework's ConfigForm section: free rows of
// VARIABLE_NAME/value in entry order, removable, plus New Variable. Extracted
// from Execute Test's [RUNTIME_CFG] so Settings → Runtime Defaults reuses the
// exact same component instead of duplicating the UI.

import { Plus, Trash2 } from 'lucide-react';

export interface CustomVar {
  key: string;
  value: string;
}

interface CustomVarsEditorProps {
  vars: CustomVar[];
  onChange: (next: CustomVar[]) => void;
  disabled?: boolean;
}

export const CustomVarsEditor = ({ vars, onChange, disabled }: CustomVarsEditorProps) => (
  <div className="pt-var-list flex flex-col gap-3">
    {vars.map((variable, index) => (
      <div key={index} className="pt-var-row flex gap-2 items-center">
        <input
          type="text"
          placeholder="VARIABLE_NAME"
          aria-label={`Variable ${index + 1} name`}
          value={variable.key}
          onChange={(event) => onChange(vars.map((v, j) => j === index ? { ...v, key: event.target.value } : v))}
          className="pt-input flex-1"
          disabled={disabled}
        />
        <input
          type="text"
          placeholder="value"
          aria-label={`Variable ${index + 1} value`}
          value={variable.value}
          onChange={(event) => onChange(vars.map((v, j) => j === index ? { ...v, value: event.target.value } : v))}
          className="pt-input flex-1 pt-amber"
          disabled={disabled}
        />
        <button
          type="button"
          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
          title="Remove variable"
          aria-label={`Remove variable ${index + 1}`}
          onClick={() => onChange(vars.filter((_, j) => j !== index))}
          disabled={disabled}
        >
          <Trash2 size={16} />
        </button>
      </div>
    ))}
    <button
      type="button"
      className="pt-ghost-btn w-full"
      onClick={() => onChange([...vars, { key: '', value: '' }])}
      disabled={disabled}
    >
      <Plus size={16} /> New Variable
    </button>
  </div>
);
