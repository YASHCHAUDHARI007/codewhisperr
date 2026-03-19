export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  children?: FileNode[];
}

export const MOCK_CODEBASE: FileNode = {
  name: 'codewhisper-demo',
  type: 'directory',
  path: '/',
  children: [
    {
      name: 'src',
      type: 'directory',
      path: '/src',
      children: [
        {
          name: 'auth',
          type: 'directory',
          path: '/src/auth',
          children: [
            {
              name: 'provider.ts',
              type: 'file',
              path: '/src/auth/provider.ts',
              content: `import { createContext } from 'react';\n\nexport const AuthContext = createContext({ user: null, loading: true });\n\nexport const AuthProvider = ({ children }) => {\n  // Implementation of auth logic\n  return <AuthContext.Provider value={{ user: null }}>{children}</AuthContext.Provider>;\n};`
            }
          ]
        },
        {
          name: 'utils.ts',
          type: 'file',
          path: '/src/utils.ts',
          content: `export const formatCode = (code: string) => {\n  return code.trim();\n};\n\nexport const analyzeRisk = (metrics: any) => {\n  return metrics.complexity > 10 ? 'High' : 'Low';\n};`
        },
        {
          name: 'main.tsx',
          type: 'file',
          path: '/src/main.tsx',
          content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`
        }
      ]
    },
    {
      name: 'package.json',
      type: 'file',
      path: '/package.json',
      content: `{\n  "name": "codewhisper-demo",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "lucide-react": "^0.284.0"\n  }\n}`
    },
    {
      name: 'README.md',
      type: 'file',
      path: '/README.md',
      content: `# CodeWhisper Demo\n\nThis is a sample project to demonstrate AI analysis capabilities.`
    }
  ]
};

export const flattenCodebase = (node: FileNode, result: Record<string, string> = {}) => {
  if (node.type === 'file' && node.content) {
    result[node.path] = node.content;
  }
  if (node.children) {
    node.children.forEach(child => flattenCodebase(child, result));
  }
  return result;
};