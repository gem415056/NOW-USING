import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScriptCatalog } from './components/ScriptCatalog';
import { ScriptViewerModal } from './components/ScriptViewerModal';
import { LoreInjectorStudio } from './components/LoreInjectorStudio';
import { ResponseRefinerStudio } from './components/ResponseRefinerStudio';
import { ThreeInOneStudio } from './components/ThreeInOneStudio';
import { NineInOneStudio } from './components/NineInOneStudio';
import { ScriptItem } from './types';
import { FALLBACK_SCRIPTS } from './data/defaultData';

export function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'lore' | 'refiner' | '3in1' | '9in1'>('catalog');
  const [scripts, setScripts] = useState<ScriptItem[]>(FALLBACK_SCRIPTS);
  const [selectedScript, setSelectedScript] = useState<ScriptItem | null>(null);

  useEffect(() => {
    fetch('/api/scripts')
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data: ScriptItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setScripts(data);
        }
      })
      .catch(() => {
        // Fallback already set
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        scriptCount={scripts.length} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'catalog' && (
          <ScriptCatalog
            scripts={scripts}
            onSelectScript={(script) => setSelectedScript(script)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'lore' && <LoreInjectorStudio />}

        {activeTab === 'refiner' && <ResponseRefinerStudio />}

        {activeTab === '3in1' && <ThreeInOneStudio />}

        {activeTab === '9in1' && <NineInOneStudio />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          Crack & PASTELchat Script Suite • Dev Server Port 3000 • Powered by Node.js & Vite
        </p>
      </footer>

      {selectedScript && (
        <ScriptViewerModal
          script={selectedScript}
          onClose={() => setSelectedScript(null)}
        />
      )}
    </div>
  );
}

export default App;
