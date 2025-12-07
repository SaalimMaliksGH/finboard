// Must be a Client Component to use react-dnd hooks
'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// We wrap the DndProvider in a separate file because the parent layout.js is a Server Component
export default function DndProviderWrapper({ children }) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}