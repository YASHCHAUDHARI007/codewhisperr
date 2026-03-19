"use client";

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FileCode, FileText, Settings, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode } from '@/app/lib/mock-codebase';

interface FileTreeProps {
  node: FileNode;
  onSelect: (node: FileNode) => void;
  level?: number;
}

export function FileTree({ node, onSelect, level = 0 }: FileTreeProps) {
  const [isOpen, setIsOpen] = useState(level === 0);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'directory') {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  const getIcon = () => {
    if (node.type === 'directory') {
      return isOpen ? (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      );
    }
    
    if (node.name.endsWith('.ts') || node.name.endsWith('.tsx') || node.name.endsWith('.js')) {
      return <FileCode className="w-4 h-4 text-primary" />;
    }
    if (node.name.endsWith('.json')) {
      return <Package className="w-4 h-4 text-accent" />;
    }
    if (node.name.endsWith('.md')) {
      return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
          "hover:bg-white/5",
          level === 0 && "font-semibold text-white mb-1"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={toggle}
      >
        <span className="shrink-0">{getIcon()}</span>
        <span className={cn("truncate", node.type === 'directory' ? "text-sidebar-foreground" : "text-muted-foreground group-hover:text-white")}>
          {node.name}
        </span>
      </div>
      
      {node.type === 'directory' && isOpen && node.children && (
        <div className="mt-0.5">
          {node.children.map((child, idx) => (
            <FileTree key={idx} node={child} onSelect={onSelect} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}