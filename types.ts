
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  children?: FileNode[];
  parentId?: string | null;
  fileData?: File; // Store the actual file object for downloading
  createdAt: number;
  aiInsight?: string;
}

export interface FileTreeState {
  nodes: FileNode[];
}
