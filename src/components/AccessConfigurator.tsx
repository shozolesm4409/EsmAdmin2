import React, { useState, useMemo } from 'react';
import { Settings2, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface AccessConfiguratorProps {
  value: string;
  onChange: (value: string) => void;
}

const MODULES = ['Dashboard', 'Reports', 'MarkSheet', 'PaymentSheet', 'Users', 'Profile', 'Settings'];

export function AccessConfigurator({ value, onChange }: AccessConfiguratorProps) {
  const [showConfig, setShowConfig] = useState(false);
  
  const currentModules = useMemo(() => {
    if (!value) return [];
    // Split by comma, ignoring commas inside single quotes
    return value.split(/,(?=(?:(?:[^']*'){2})*[^']*$)/).map(s => s.trim()).filter(Boolean);
  }, [value]);

  const getModuleState = (module: string) => {
    const found = currentModules.find(m => m.startsWith(module));
    if (!found) return { checked: false, subjects: '', isView: false };
    
    const match = found.match(/'([^']+)'/);
    const isView = found.includes("'View'");
    
    let subjects = '';
    if (match && match[1] !== 'View') {
      subjects = match[1];
    }
    
    return { checked: true, subjects, isView };
  };

  const handleModuleToggle = (module: string, checked: boolean, isView: boolean = false) => {
    let newList = [...currentModules];
    const index = newList.findIndex(m => m.startsWith(module));
    
    if (isView) {
      if (index !== -1) {
        const state = getModuleState(module);
        if (checked) {
          newList[index] = state.subjects ? `${module}'${state.subjects}''View'` : `${module}'View'`;
        } else {
          newList[index] = state.subjects ? `${module}'${state.subjects}'` : `${module}`;
        }
      } else if (checked) {
        newList.push(`${module}'View'`);
      }
    } else {
      if (checked) {
        if (index === -1) newList.push(module);
      } else {
        if (index !== -1) newList.splice(index, 1);
      }
    }
    
    onChange(newList.join(', '));
  };

  const handleSubjectChange = (module: string, subjects: string) => {
    let newList = [...currentModules];
    const index = newList.findIndex(m => m.startsWith(module));
    
    if (index !== -1) {
      const state = getModuleState(module);
      if (subjects) {
        newList[index] = `${module}'${subjects}'${state.isView ? "'View'" : ''}`;
      } else {
        newList[index] = `${module}${state.isView ? "'View'" : ''}`;
      }
      onChange(newList.join(', '));
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative group">
        <textarea 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y text-sm font-medium text-slate-700 transition-all shadow-inner"
          placeholder="e.g. Dashboard, MarkSheet'বাংলা, গণিত', PaymentSheet'বিজ্ঞান'"
        />
        <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manual Edit</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <button 
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className={cn(
            "flex items-center gap-2 text-sm font-bold transition-all px-4 py-2 rounded-xl cursor-pointer",
            showConfig ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
          )}
        >
          <Settings2 size={16} />
          {showConfig ? 'Hide Configurator' : 'Open Configurator'}
        </button>
        
        {showConfig && (
          <div className="flex items-center gap-2">
             <button 
               type="button" 
               onClick={() => onChange('Full')} 
               className="text-[11px] bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 transition-all cursor-pointer shadow-sm active:scale-95"
             >
               Full Access
             </button>
             <button 
               type="button" 
               onClick={() => onChange('')} 
               className="text-[11px] bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold hover:bg-rose-100 transition-all cursor-pointer active:scale-95 border border-rose-100"
             >
               Clear All
             </button>
          </div>
        )}
      </div>

      {showConfig && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-4 py-2.5">
            <div className="col-span-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Module</div>
            <div className="col-span-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access</div>
            <div className="col-span-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Specific Subjects</div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {MODULES.map(module => {
              const state = getModuleState(module);
              const canHaveSubjects = module === 'Dashboard' || module === 'MarkSheet' || module === 'PaymentSheet';
              
              return (
                <div key={module} className={cn(
                  "grid grid-cols-12 items-center px-4 py-3 transition-colors",
                  state.checked ? "bg-white" : "bg-slate-50/30"
                )}>
                  <div className="col-span-4 flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={state.checked}
                        onChange={(e) => handleModuleToggle(module, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm peer-checked:bg-blue-600 group-hover:after:scale-110"></div>
                      <span className={cn(
                        "ml-3 text-sm font-bold transition-all duration-200",
                        state.checked ? "text-slate-900 scale-105" : "text-slate-400"
                      )}>{module}</span>
                    </label>
                  </div>

                  <div className="col-span-3">
                    <button
                      type="button"
                      disabled={!state.checked}
                      onClick={() => handleModuleToggle(module, !state.isView, true)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-300 border shadow-sm cursor-pointer active:scale-95",
                        !state.checked ? "opacity-0 pointer-events-none" :
                        state.isView 
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:shadow-amber-100" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:shadow-emerald-100"
                      )}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse",
                        state.isView ? "bg-amber-500" : "bg-emerald-500"
                      )} />
                      {state.isView ? 'View Only' : 'Full Access'}
                    </button>
                  </div>

                  <div className="col-span-5">
                    {canHaveSubjects && state.checked && (
                      <div className="relative">
                        <input 
                          type="text"
                          value={state.subjects}
                          onChange={(e) => handleSubjectChange(module, e.target.value)}
                          placeholder="e.g. বাংলা, গণিত"
                          className="w-full text-[11px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                        />
                      </div>
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
