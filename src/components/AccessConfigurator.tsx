import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';

interface AccessConfiguratorProps {
  value: string;
  onChange: (value: string) => void;
}

const MODULES = ['Dashboard', 'Reports', 'MarkSheet', 'PaymentSheet', 'Users', 'Profile', 'Settings'];

export function AccessConfigurator({ value, onChange }: AccessConfiguratorProps) {
  const [showConfig, setShowConfig] = useState(false);
  
  const parseModules = (val: string) => {
    if (!val) return [];
    // Split by comma, ignoring commas inside single quotes
    return val.split(/,(?=(?:(?:[^']*'){2})*[^']*$)/).map(s => s.trim()).filter(Boolean);
  };

  const handleModuleToggle = (module: string, checked: boolean, isView: boolean = false) => {
    let currentModules = parseModules(value);
    
    if (checked) {
      let moduleString = module;
      if (isView) {
        moduleString = `${module}'View'`;
      }
      if (!currentModules.some(m => m.startsWith(module))) {
        currentModules.push(moduleString);
      } else {
        // Update if already exists to add/remove View
        const index = currentModules.findIndex(m => m.startsWith(module));
        currentModules[index] = moduleString;
      }
    } else {
      currentModules = currentModules.filter(m => !m.startsWith(module));
    }
    
    onChange(currentModules.join(', '));
  };

  const handleSubjectChange = (module: string, subjects: string) => {
    let currentModules = parseModules(value);
    const index = currentModules.findIndex(m => m.startsWith(module));
    
    if (index !== -1) {
      const isView = currentModules[index].includes("'View'");
      if (subjects) {
        currentModules[index] = `${module}'${subjects}'${isView ? "'View'" : ''}`;
      } else {
        currentModules[index] = `${module}${isView ? "'View'" : ''}`;
      }
      onChange(currentModules.join(', '));
    }
  };

  const getModuleState = (module: string) => {
    const currentModules = parseModules(value);
    const found = currentModules.find(m => m.startsWith(module));
    if (!found) return { checked: false, subjects: '', isView: false };
    
    const match = found.match(/'([^']+)'/);
    const isView = found.includes("'View'");
    return { checked: true, subjects: match && match[1] !== 'View' ? match[1] : '', isView };
  };

  return (
    <div className="space-y-2">
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y text-sm"
        placeholder="e.g. Dashboard, MarkSheet'বাংলা, গণিত', PaymentSheet'বিজ্ঞান'"
      />
      
      <button 
        type="button"
        onClick={() => setShowConfig(!showConfig)}
        className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors cursor-pointer"
      >
        <Settings2 size={16} />
        {showConfig ? 'Hide Configurator' : 'Open Configurator'}
      </button>

      {showConfig && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200">
             <button type="button" onClick={() => onChange('Full')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200 transition-colors cursor-pointer">Set Full Access</button>
             <button type="button" onClick={() => onChange('')} className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-300 transition-colors cursor-pointer">Clear All</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {MODULES.map(module => {
              const state = getModuleState(module);
              const hasSubjects = module === 'MarkSheet' || module === 'PaymentSheet';
              
              return (
                <div key={module} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group w-32">
                      <input 
                        type="checkbox" 
                        checked={state.checked}
                        onChange={(e) => handleModuleToggle(module, e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{module}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={state.isView}
                        onChange={(e) => handleModuleToggle(module, e.target.checked, true)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm text-slate-600">View</span>
                    </label>
                    {hasSubjects && (
                      <input 
                        type="text"
                        value={state.subjects}
                        onChange={(e) => handleSubjectChange(module, e.target.value)}
                        placeholder="Subjects (e.g. বাংলা, গণিত)"
                        className="text-sm px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
