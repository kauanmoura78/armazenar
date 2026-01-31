
import React from 'react';
import { FileNode } from '../types';
import { FileText, Image as ImageIcon, Music, Video, MoreVertical, Download, Trash2, BrainCircuit } from 'lucide-react';

interface FileTreeProps {
  nodes: FileNode[];
  onDelete: (id: string) => void;
}

const getIcon = (mimeType?: string) => {
  if (!mimeType) return <FileText className="w-5 h-5 text-slate-400" />;
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-purple-400" />;
  if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-rose-400" />;
  return <FileText className="w-5 h-5 text-blue-400" />;
};

const formatSize = (bytes?: number) => {
  if (!bytes) return '--';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const FileTree: React.FC<FileTreeProps> = ({ nodes, onDelete }) => {
  const handleDownload = (node: FileNode) => {
    if (!node.fileData) return;
    const url = URL.createObjectURL(node.fileData);
    const a = document.createElement('a');
    a.href = url;
    a.download = node.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[#0f172a] z-10">
          <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800">
            <th className="px-6 py-4">Nome</th>
            <th className="px-6 py-4">IA Insight</th>
            <th className="px-6 py-4">Tamanho</th>
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {nodes.map((node) => (
            <tr key={node.id} className="group hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                    {getIcon(node.mimeType)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-200 truncate max-w-[200px]" title={node.name}>
                      {node.name}
                    </span>
                    <span className="text-xs text-slate-500">{node.mimeType || 'Arquivo binário'}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {node.aiInsight ? (
                  <div className="flex items-start gap-2 max-w-xs">
                    <BrainCircuit className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-slate-400 italic">"{node.aiInsight}"</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-600">--</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-slate-400">
                {formatSize(node.size)}
              </td>
              <td className="px-6 py-4 text-sm text-slate-400">
                {new Date(node.createdAt).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(node)}
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-blue-400 transition-colors"
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(node.id)}
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-rose-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
