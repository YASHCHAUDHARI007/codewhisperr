
"use client";

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, FileCode, FileText, Package, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  files: any[];
  onSelect: (file: any) => void;
}

export function FileTree({ files, onSelect }: FileTreeProps) {
  // Reconstruct tree from flat files
  const tree = useMemo(() => {
    const root: any = { name: 'root', type: 'directory', children: {} };
    
    // Sort files by path length and alphabetical order to ensure folders are processed correctly
    const sortedFiles = [...files].sort((a, b) => a.filePath.localeCompare(b.filePath));

    sortedFiles.forEach(file => {
      // Filter out empty parts and leading slashes
      const parts = file.filePath.split('/').filter(Boolean);
      
      // If the path comes from a GitHub zip, it might have a root folder like owner-repo-sha/
      // We skip the very first part if there's more than one, to keep the tree clean
      // Actually, it's safer to keep it or handle it at ingestion. 
      // For now, let's just make sure we handle the nesting.

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
    <div className="space-y-1">
      {Object.values(tree.children).length > 0 ? (
        Object.values(tree.children).map((node: any, idx) => (
          <TreeNode key={idx} node={node} onSelect={onSelect} level={0} />
        ))
      ) : (
        <p className="text-xs text-muted-foreground p-4 text-center">No files found.</p>
      )}
    </div>
  );
}

function TreeNode({ node, onSelect, level }: { node: any, onSelect: (f: any) => void, level: number }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  const getIcon = () => {
    if (node.type === 'directory') {
      return <Folder className={cn("w-4 h-4", isOpen ? "text-primary/70" : "text-muted-foreground/50")} />;
    }
    const name = node.name.toLowerCase();
    if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js') || name.endsWith('.jsx')) {
      return <FileCode className="w-4 h-4 text-primary" />;
    }
    if (name.endsWith('.json')) {
      return <Package className="w-4 h-4 text-accent" />;
    }
    if (name.endsWith('.md')) {
      return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors hover:bg-white/5",
          node.type === 'file' && "group"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={toggle}
      >
        <span className="shrink-0">
          {getIcon()}
        </span>
        <span className={cn("truncate", node.type === 'directory' ? "text-sidebar-foreground font-medium" : "text-muted-foreground group-hover:text-white")}>
          {node.name}
        </span>
        {node.type === 'directory' && (
          <span className="ml-auto">
            {isOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground/30" /> : <ChevronRight className="w-3 h-3 text-muted-foreground/30" />}
          </span>
        )}
      </div>
      {node.type === 'directory' && isOpen && node.children && (
        <div className="mt-1">
          {Object.values(node.children).map((child: any, idx) => (
            <TreeNode key={idx} node={child} onSelect={onSelect} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
