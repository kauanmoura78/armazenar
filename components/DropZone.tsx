
import React, { useState, useRef, useCallback } from 'react';
import { Upload, FolderPlus, FilePlus } from 'lucide-react';

interface DropZoneProps {
  onFilesAdded: (files: File[], folderPath?: string) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items);
    const files: File[] = [];

    // Helper to recursively read directory entries using FileSystem API
    const readEntry = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => (entry as FileSystemFileEntry).file(resolve));
        files.push(file);
      } else if (entry.isDirectory) {
        const dirReader = (entry as FileSystemDirectoryEntry).createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => dirReader.readEntries(resolve));
        for (const childEntry of entries) {
          await readEntry(childEntry);
        }
      }
    };

    for (const item of items) {
      // Fixed: Cast item to any to bypass the "unknown" type error and access webkitGetAsEntry.
      // webkitGetAsEntry is widely supported in modern browsers for directory/file drop handling.
      const entry = (item as any).webkitGetAsEntry() as FileSystemEntry | null;
      if (entry) {
        await readEntry(entry);
      }
    }

    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesAdded(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${
        isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
      }`}
    >
      <div className={`p-4 rounded-full mb-4 transition-transform duration-300 ${isDragging ? 'bg-blue-500 scale-110' : 'bg-slate-800'}`}>
        <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-slate-400'}`} />
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-medium mb-2">Arraste arquivos ou pastas aqui</h3>
        <p className="text-slate-500 text-sm mb-6">Suporta múltiplos arquivos e estruturas de pastas complexas</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
        >
          <FilePlus className="w-4 h-4 text-blue-400" />
          Selecionar Arquivos
        </button>
        <button
          onClick={() => folderInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
        >
          <FolderPlus className="w-4 h-4 text-amber-400" />
          Selecionar Pastas
        </button>
      </div>

      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        multiple
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        webkitdirectory="true"
        multiple
      />
    </div>
  );
};
