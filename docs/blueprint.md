# **App Name**: CodeWhisper

## Core Features:

- Codebase Ingestion: Allows users to upload project ZIP files or provide GitHub repository URLs for analysis.
- File Explorer UI: An interactive file tree explorer displayed on the left panel for easy navigation of the codebase.
- AI Project Overview: Generates a high-level summary of the project's purpose, identifies its tech stack, and outlines its architecture as a tool to provide rapid understanding.
- AI File/Module Explanation: Provides detailed, simple explanations for individual files or modules when selected in the file tree, acting as a tool for deeper comprehension.
- Interactive AI Chat: An 'Ask AI' chat interface allowing users to query specific details about the codebase (e.g., 'Where is the authentication logic?' or 'Explain this function'), functioning as a conversational query tool.
- Code Processing Backend: The FastAPI backend handles the extraction, parsing, efficient chunking, and secure transmission of code to AI models for analysis.

## Style Guidelines:

- The application employs a sophisticated dark theme, fitting for a professional developer tool focused on code analysis. The primary color, representing clarity and technology, is a balanced blue: '#5299E0'. This hue was chosen to stand out effectively against a dark background without being overly assertive. The background color is a deep, desaturated blue '#1E222B', visually belonging to the same family as the primary color for harmony, yet dark enough to reduce eye strain during extended use. The accent color, a vibrant cyan '#19DCDC', was chosen as an analogous contrast to highlight interactive elements and important information, ensuring visibility and user engagement while maintaining the overall cool, analytical aesthetic.
- For headlines, 'Space Grotesk' (sans-serif) provides a modern, tech-savvy feel, suitable for conveying a futuristic and analytical tone. The body text uses 'Inter' (sans-serif), chosen for its exceptional readability and neutral aesthetic, ensuring code explanations and summaries are easy to digest. 'Source Code Pro' (monospace) is designated for displaying code snippets within the UI, offering excellent legibility for technical content.
- Icons should be modern, clean, and minimalistic. A set of clear line icons is preferred for navigation and feature representation, consistent with the tool's professional and analytical nature.
- A classic dashboard layout will be used, featuring a responsive, resizable file tree on the left sidebar and dynamic analysis panels on the right. Content areas will feature ample padding and logical grouping to enhance readability and organization.
- Subtle and efficient animations will be used for state changes, panel expansions, and content loading. Emphasis will be on smooth transitions that provide visual feedback without impeding user workflow, ensuring a fast and responsive feel.