"use client";

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, FileCode, FileText, Package, Folder, Braces, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  files: any[];
  onSelect: (file: any) => void;
}

export function FileTree({ files, onSelect }: FileTreeProps) {
  const tree = useMemo(() => {
    const root: any = { name: 'root', type: 'directory', children: {} };
    const sortedFiles = [...files].sort((a, b) => a.filePath.localeCompare(b.filePath));

    let commonRoot: string | null = null;
    if (sortedFiles.length > 0) {
      const firstPathParts = sortedFiles[0].filePath.split('/');
      if (firstPathParts.length > 1) {
        const potentialRoot = firstPathParts[0];
        const allHaveSameRoot = sortedFiles.every(f => f.filePath.startsWith(potentialRoot + '/'));
        if (allHaveSameRoot) commonRoot = potentialRoot;
      }
    }

    sortedFiles.forEach(file => {
      let filePath = file.filePath;
      if (commonRoot && filePath.startsWith(commonRoot + '/')) {
        filePath = filePath.substring(commonRoot.length + 1);
      }
      const parts = filePath.split('/').filter(Boolean);
      let current = root;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current.children[part] = { ...file, name: part, type: 'file' };
        } else {
          if (!current.children[part]) {
            current.children[part] = { name: part, type: 'directory', children: {} };
          }
          current = current.children[part];
        }
      });
    });
    return root;
  }, [files]);

  return (
    <div className="space-y-0.5">
      {Object.values(tree.children).length > 0 ? (
        Object.values(tree.children).map((node: any, idx) => (
          <TreeNode key={idx} node={node} onSelect={onSelect} level={0} />
        ))
      ) : (
        <p className="text-[10px] text-muted-foreground p-4 text-center">No files in directory.</p>
      )}
    </div>
  );
}

function TreeNode({ node, onSelect, level }: { node: any, onSelect: (f: any) => void, level: number }) {
  const [isOpen, setIsOpen] = useState(level === 0);

  const toggle = () => {
    if (node.type === 'directory') setIsOpen(!isOpen);
    else onSelect(node);
  };

  const getIcon = () => {
    if (node.type === 'directory') {
      return <Folder className={cn("w-3.5 h-3.5", isOpen ? "text-primary opacity-80" : "text-muted-foreground opacity-60")} />;
    }
    const name = node.name.toLowerCase();
    if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js') || name.endsWith('.jsx')) return <FileCode className="w-3.5 h-3.5 text-blue-500 opacity-80" />;
    if (name.endsWith('.json') || name.endsWith('.yaml') || name.endsWith('.yml') || name.endsWith('.toml')) return <Package className="w-3.5 h-3.5 text-amber-500 opacity-80" />;
    if (name.endsWith('.md') || name.endsWith('.txt')) return <FileText className="w-3.5 h-3.5 text-slate-400 opacity-80" />;
    return <File className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 group",
          node.type === 'file' && "text-slate-600 dark:text-slate-400 hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={toggle}
      >
        <span className="shrink-0">
          {getIcon()}
        </span>
        <span className={cn("truncate font-medium")}>
          {node.name}
        </span>
        {node.type === 'directory' && (
          <span className="ml-auto opacity-30 group-hover:opacity-100 transition-opacity">
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        )}
      </div>
      {node.type === 'directory' && isOpen && node.children && (
        <div className="border-l ml-[18px] pl-0">
          {Object.values(node.children).map((child: any, idx) => (
            <TreeNode key={idx} node={child} onSelect={onSelect} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}