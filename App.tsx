
import React, { useState, useCallback, useEffect } from 'react';
import { DropZone } from './components/DropZone.tsx';
import { FileTree } from './components/FileTree.tsx';
import { FileNode } from './types.ts';
import { analyzeFile } from './services/geminiService.ts';
import { getAllFileNodes, saveFileNode, deleteFileNode, clearAllStorage } from './services/storage.ts';
import { Layout, HardDrive, Cloud, CloudCheck, Trash2, RefreshCcw } from 'lucide-react';

const STORAGE_LIMIT_GB = 2048;
const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_GB * 1024 * 1024 * 1024;

const App: React.FC = () => {
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedNodes = await getAllFileNodes();
        setNodes(savedNodes || []);
      } catch (error) {
        console.error("Erro storage:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const totalSize = nodes.reduce((acc, node) => (node.type === 'file' && node.size ? acc + node.size : acc), 0);
    setStorageUsed(totalSize);
  }, [nodes]);

  const addFiles = useCallback(async (newFiles: File[]) => {
    setIsSyncing(true);
    const newNodes: FileNode[] = [];
    
    for (const file of newFiles) {
      const node: FileNode = {
        id: crypto.randomUUID(),
        name: file.name,
        type: 'file',
        size: file.size,
        mimeType: file.type,
        fileData: file,
        createdAt: Date.now(),
        parentId: null,
      };
      await saveFileNode(node);
      newNodes.push(node);
    }

    setNodes(prev => [...prev, ...newNodes]);
    setIsSyncing(false);

    if (newNodes.length > 0) {
      setIsAnalyzing(true);
      const lastFile = newNodes[newNodes.length - 1];
      const insight = await analyzeFile(lastFile.name, lastFile.mimeType || 'unknown', lastFile.size || 0);
      setNodes(prev => prev.map(n => n.id === lastFile.id ? { ...n, aiInsight: insight } : n));
      setIsAnalyzing(false);
    }
  }, []);

  const handleDelete = async (id: string) => {
    await deleteFileNode(id);
    setNodes(prev => prev.filter(n => n.id !== id));
  };

  const handleResetStorage = async () => {
    if (confirm("Deseja realmente apagar todos os arquivos da nuvem?")) {
      await clearAllStorage();
      setNodes([]);
    }
  };

  const storagePercentage = Math.min((storageUsed / STORAGE_LIMIT_BYTES) * 100, 100);

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden">
      {/* Sidebar - Design Limpo conforme imagem */}
      <aside className="w-72 border-r border-slate-800 bg-[#1e293b]/30 p-6 flex flex-col hidden md:flex">
        {/* Top: Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold block leading-tight">CloudFlow</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Enterprise Ultra</span>
          </div>
        </div>

        {/* Middle: Totalmente vazio */}
        <div className="flex-1"></div>

        {/* Bottom: Armazenamento e Reset */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 text-sm font-medium">
              <span className="text-slate-400 flex items-center gap-2"><HardDrive className="w-4 h-4" /> Disco</span>
              <span className="text-slate-500">{storagePercentage.toFixed(4)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                style={{ width: `${storagePercentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Capacidade: 2TB Ativos</p>
          </div>

          <button 
            onClick={handleResetStorage}
            className="w-full py-2.5 bg-slate-800/40 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/20 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Esvaziar Nuvem
          </button>

          <div className="flex items-center justify-center gap-2 py-2 bg-blue-500/5 border border-blue-500/10 rounded-lg text-[9px] text-blue-400/70 font-bold uppercase tracking-widest">
            <RefreshCcw className="w-3 h-3 animate-spin-slow" /> Sincronização Ativa
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#020617]">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-[#0f172a]/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Meus Arquivos</h1>
            <div className="h-4 w-[1px] bg-slate-800"></div>
            <p className="text-xs text-slate-500">2TB Disponíveis</p>
          </div>
          <div className="flex items-center gap-4">
             {isSyncing ? (
                <span className="text-[10px] text-amber-500 font-bold uppercase animate-pulse">Enviando...</span>
              ) : (
                <div className="flex items-center gap-2 text-emerald-500">
                  <CloudCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Online</span>
                </div>
              )}
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold">CF</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <DropZone onFilesAdded={addFiles} />
          
          <div className="bg-slate-900/30 rounded-3xl border border-slate-800/50 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800/50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-500" /> Diretório Principal
              </span>
              <span className="text-[10px] text-slate-600 font-bold">{nodes.length} ITENS</span>
            </div>
            <div className="min-h-[400px]">
              {nodes.length > 0 ? (
                <FileTree nodes={nodes} onDelete={handleDelete} />
              ) : (
                <div className="flex flex-col items-center justify-center py-24 opacity-20">
                  <Cloud className="w-12 h-12 mb-4" />
                  <p className="text-sm font-medium">Nenhum arquivo encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
