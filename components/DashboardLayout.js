'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { useState } from 'react';
import WidgetWrapper from './WidgetWrapper';
import StockChartWidget from './widgets/StockChartWidget';
import StockTableWidget from './widgets/StockTableWidget';
import FinanceCardWidget from './widgets/FinanceCardWidget';
import AddWidgetModal from './AddWidgetModal';

// A map to render the correct component based on the widget type in the state
const WIDGET_MAP = {
  chart: StockChartWidget,
  table: StockTableWidget,
  card: FinanceCardWidget,
};

export default function DashboardLayout() {
  const widgets = useDashboardStore((state) => state.widgets);
  const removeWidget = useDashboardStore((state) => state.removeWidget);
  const moveWidget = useDashboardStore((state) => state.moveWidget);
  const updateWidgetConfig = useDashboardStore((state) => state.updateWidgetConfig);
  
  const [editingWidget, setEditingWidget] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (widgetId) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      setEditingWidget(widget);
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = (widgetId) => {
    if (confirm('Are you sure you want to delete this widget?')) {
      removeWidget(widgetId);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {widgets.map((widget, index) => {
          const WidgetComponent = WIDGET_MAP[widget.type];
          
          // Determine grid span based on widget type
          const colSpan = widget.type === 'chart' || widget.type === 'table' ? 'lg:col-span-2' : 'lg:col-span-1';
          const height = widget.type === 'chart' ? 'h-96' : 'min-h-[280px]';

          return (
            <WidgetWrapper 
              key={widget.id} 
              id={widget.id} 
              index={index} 
              className={`${colSpan} ${height}`}
              onMove={moveWidget}
            >
              {/* Pass all properties of the widget object as props to the component */}
              <WidgetComponent 
                {...widget} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </WidgetWrapper>
          );
        })}
      </div>
      
      {/* Edit Modal */}
      {isEditModalOpen && editingWidget && (
        <AddWidgetModal 
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingWidget(null);
          }}
          editMode={true}
          widgetToEdit={editingWidget}
          onUpdate={(updatedWidget) => {
            updateWidgetConfig(editingWidget.id, updatedWidget);
            setIsEditModalOpen(false);
            setEditingWidget(null);
          }}
        />
      )}
    </>
  );
}