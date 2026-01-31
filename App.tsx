
import React, { useState, useCallback, useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { FileTree } from './components/FileTree';
import { FileNode } from './types';
import { analyzeFile } from './services/geminiService';
import { getAllFileNodes, saveFileNode, deleteFileNode, clearAllStorage } from './services/storage';
import { Layout, HardDrive, Database, Shield, Zap, Cloud, CloudCheck, Trash2, RefreshCcw } from 'lucide-react';

// Aumentando a capacidade para 2 Terabytes
const STORAGE_LIMIT_GB = 2048;
const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_GB * 1024 * 1024 * 1024;

const App: React.FC = () => {
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Carregar arquivos salvos ao iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedNodes = await getAllFileNodes();
        setNodes(savedNodes);
      } catch (error) {
        console.error("Erro ao carregar banco de dados local:", error);
      }
    };
    loadData();
  }, []);

  // Calcular armazenamento total
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

    // Análise de IA em background para o arquivo mais recente
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
    if (confirm("Tem certeza que deseja deletar TODOS os arquivos da sua nuvem local? Esta ação não pode ser desfeita.")) {
      await clearAllStorage();
      setNodes([]);
      alert("Armazenamento limpo com sucesso!");
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
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-800 bg-[#1e293b]/30 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold block leading-tight tracking-tight">CloudFlow</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Enterprise Ultra Cloud</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-500/10">
            <Database className="w-5 h-5" />
            Nuvem Principal
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <Shield className="w-5 h-5" />
            Cofre Seguro
          </button>
          <button 
            onClick={handleResetStorage}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20"
          >
            <Trash2 className="w-5 h-5" />
            Limpar Nuvem
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <HardDrive className="w-4 h-4" />
              Armazenamento
            </div>
            <span className="text-slate-500 font-medium">{storagePercentage.toFixed(4)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 font-medium">{formatSize(storageUsed)} de {STORAGE_LIMIT_GB >= 1024 ? (STORAGE_LIMIT_GB/1024).toFixed(0) + 'TB' : STORAGE_LIMIT_GB + 'GB'} utilizados</p>
          <button className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2">
            <RefreshCcw className="w-3 h-3" /> Plano Ilimitado Ativo
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#020617]">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-[#0f172a]/40 backdrop-blur-xl sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold">Arquivos da Nuvem</h1>
            <p className="text-xs text-slate-500">Sincronizado em tempo real (Capacidade Ultra: {STORAGE_LIMIT_GB / 1024}TB)</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-medium">
              {isSyncing ? (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-amber-500">Sincronizando...</span>
                </>
              ) : (
                <>
                  <CloudCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 uppercase tracking-tighter">Nuvem Atualizada</span>
                </>
              )}
            </div>
            <div className="h-8 w-[1px] bg-slate-800"></div>
            <div className="flex items-center gap-3">
              {isAnalyzing && (
                <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
                  <span className="text-[10px] text-blue-400 font-bold uppercase">IA Ativa</span>
                </div>
              )}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold border border-slate-600 shadow-xl">
                CF
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
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
              <div className="flex gap-4 items-center">
                <span className="text-xs font-medium text-slate-500">{nodes.length} objetos salvos na nuvem</span>
              </div>
            </div>
            <div className="min-h-[500px]">
              {nodes.length > 0 ? (
                <FileTree nodes={nodes} onDelete={handleDelete} />
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                  <div className="p-6 bg-slate-800/20 rounded-full mb-6">
                    <Cloud className="w-16 h-16 opacity-10" />
                  </div>
                  <p className="text-lg font-medium text-slate-400">Sua nuvem está vazia</p>
                  <p className="text-sm opacity-60">Arraste seus arquivos ou pastas inteiras para começar a salvar.</p>
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
