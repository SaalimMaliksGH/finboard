'use client';
import { useDashboardStore } from '@/store/dashboardStore';

const availableWidgets = [
  { type: 'card', title: 'Market Gainers Card', symbol: 'NIFTY' },
  { type: 'chart', title: 'Line Chart: Reliance', symbol: 'RELIANCE.NS', interval: 'Daily' },
  { type: 'table', title: 'New Watchlist Table' },
  { type: 'chart', title: 'Line Chart: Infosys', symbol: 'INFY.NS', interval: 'Weekly' },
];

export default function AddWidgetPanel() {
  const addWidget = useDashboardStore((state) => state.addWidget);

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg mb-6 border-l-4 border-emerald-500">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Widget</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {availableWidgets.map((widget, index) => (
          <button
            key={index}
            onClick={() => addWidget(widget)}
            className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors text-sm font-medium text-left shadow-sm"
          >
            + {widget.title}
          </button>
        ))}
      </div>
    </div>
  );
}