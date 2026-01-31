
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
        console.error("Erro ao carregar banco de dados local:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const totalSize = nodes.reduce((acc, node) => {
      if (node.type === 'file' && node.size) return acc + node.size;
      return acc;
    }, 0);
    setStorageUsed(totalSize);
  }, [nodes]);

  const addFiles = useCallback(async (newFiles: File[]) => {
    setIsSyncing(true);
    const newNodes: FileNode[] = [];
    
    for (const file of newFiles) {
      const id = crypto.randomUUID();
      const node: FileNode = {
        id,
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
      
      setNodes(prev => {
        const updated = prev.map(n => n.id === lastFile.id ? { ...n, aiInsight: insight } : n);
        const updatedNode = updated.find(n => n.id === lastFile.id);
        if (updatedNode) saveFileNode(updatedNode);
        return updated;
      });
      setIsAnalyzing(false);
    }
  }, []);

  const handleDelete = async (id: string) => {
    await deleteFileNode(id);
    setNodes(prev => prev.filter(n => n.id !== id));
  };

  const handleResetStorage = async () => {
    if (confirm("Tem certeza que deseja deletar TODOS os arquivos da sua nuvem?")) {
      await clearAllStorage();
      setNodes([]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storagePercentage = Math.min((storageUsed / STORAGE_LIMIT_BYTES) * 100, 100);

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden">
      {/* Sidebar - Agora limpa, sem a navegação central */}
      <aside className="w-72 border-r border-slate-800 bg-[#1e293b]/30 p-6 flex flex-col hidden md:flex">
        {/* Top: Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold block leading-tight tracking-tight">CloudFlow</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Enterprise Ultra Cloud</span>
          </div>
        </div>

        {/* Middle: Espaço vazio conforme solicitado */}
        <div className="flex-1"></div>

        {/* Bottom: Apenas informações de armazenamento e botão de reset */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 text-sm">
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <HardDrive className="w-4 h-4" />
                Uso do Disco
              </div>
              <span className="text-slate-500 font-bold">{storagePercentage.toFixed(4)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                style={{ width: `${storagePercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 font-medium">{formatSize(storageUsed)} de 2TB</p>
          </div>

          <button 
            onClick={handleResetStorage}
            className="w-full py-2.5 px-4 bg-slate-800/30 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Esvaziar Toda a Nuvem
          </button>

          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-[10px] text-blue-400/80 font-bold uppercase tracking-wider">
            <RefreshCcw className="w-3 h-3 animate-spin-slow" /> Plano Ilimitado Ativo
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#020617]">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-[#0f172a]/40 backdrop-blur-xl sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold">Arquivos da Nuvem</h1>
            <p className="text-xs text-slate-500">Sincronizado Localmente</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-medium">
              {isSyncing ? (
                <span className="text-amber-500 animate-pulse">Sincronizando...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <CloudCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 uppercase tracking-tighter">Status: Ativo</span>
                </div>
              )}
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold border border-slate-600 shadow-xl">
              CF
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          <section>
            <DropZone onFilesAdded={addFiles} />
          </section>

          <section className="bg-slate-900/40 rounded-3xl border border-slate-800/50 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/10">
              <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Seu Drive</span>
              </div>
              <span className="text-xs font-medium text-slate-500">{nodes.length} objetos salvos</span>
            </div>
            <div className="min-h-[500px]">
              {nodes.length > 0 ? (
                <FileTree nodes={nodes} onDelete={handleDelete} />
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                  <Cloud className="w-16 h-16 opacity-10 mb-6" />
                  <p className="text-lg font-medium text-slate-400">Sua nuvem está vazia</p>
                  <p className="text-sm opacity-60">Arraste seus arquivos para começar.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
