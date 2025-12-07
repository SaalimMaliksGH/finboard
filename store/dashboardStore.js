import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Start with empty widgets array
const initialWidgets = [];

export const useDashboardStore = create(
  persist(
    (set, get) => ({
      // State
      widgets: initialWidgets,

      // Actions
      addWidget: (newWidget) => {
        set((state) => ({
          widgets: [...state.widgets, { ...newWidget, id: Date.now().toString() }],
        }));
      },

      removeWidget: (id) => {
        set((state) => ({
          widgets: state.widgets.filter((widget) => widget.id !== id),
        }));
      },

      // Logic to move a widget in the array (for drag-and-drop)
      moveWidget: (dragId, hoverId) => {
        set((state) => {
          const widgets = [...state.widgets];
          const dragIndex = widgets.findIndex((w) => w.id === dragId);
          const hoverIndex = widgets.findIndex((w) => w.id === hoverId);

          if (dragIndex === -1 || hoverIndex === -1) return state;

          // Simple array swap for reordering
          const [draggedItem] = widgets.splice(dragIndex, 1);
          widgets.splice(hoverIndex, 0, draggedItem);

          return { widgets };
        });
      },

      // Action to update a specific widget's configuration
      updateWidgetConfig: (id, newConfig) => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, ...newConfig } : widget
          ),
        }));
      },
    }),
    {
      name: 'finboard-dashboard-storage', // key for local storage
    }
  )
);