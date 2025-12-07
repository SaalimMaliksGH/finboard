'use client';
import { processCardData } from '@/lib/dataExtractor';
import { useWidgetData } from '@/lib/useWidgetData';

export default function FinanceCardWidget({ 
  id,
  title, 
  apiUrl, 
  refreshInterval = 30, 
  fields = [],
  apiKey,
  initialData,
  onEdit,
  onDelete,
  onRefresh 
}) {
  // Use custom hook for data fetching
  const { data: rawData, loading, error, lastUpdated, refetch } = useWidgetData({
    apiUrl,
    apiKey,
    initialData,
    processData: (fetchedData) => processCardData(fetchedData, fields),
    processDeps: [fields]
  });

  const handleManualRefresh = () => {
    refetch();
    if (onRefresh) onRefresh();
  };

  // Helper to safely access nested properties (for display purposes)
  const getFieldValue = (obj, path) => {
    if (!obj || !path) return undefined;
    // Remove "data." prefix if accidentally included by user
    const cleanPath = path.replace(/^data\./, '');
    
    // Try accessing directly first (in case data is flat)
    if (obj[cleanPath] !== undefined) return obj[cleanPath];

    // Then try splitting by dots
    return cleanPath.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return String(value);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white rounded-lg shadow-lg border border-slate-700 transition-all hover:border-emerald-500/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 flex-shrink-0 bg-slate-800 rounded flex items-center justify-center text-emerald-400">
            📊
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate" title={title}>{title}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span>{refreshInterval}s updates</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className={`w-8 h-8 rounded hover:bg-slate-700 flex items-center justify-center transition-colors text-gray-400 hover:text-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh"
          >
            ↻
          </button>
          <button
            onClick={() => onDelete && onDelete(id)}
            className="w-8 h-8 rounded hover:bg-red-900/50 flex items-center justify-center transition-colors text-gray-400 hover:text-red-400"
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto scrollbar-thin scrollbar-thumb-slate-700">
        {loading && !rawData && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Connecting to API...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full text-red-400 text-sm p-4 text-center bg-red-900/10 rounded border border-red-900/30">
            <div>
                <div className="font-bold mb-1">⚠ Error</div>
                {error}
            </div>
          </div>
        )}
        
        {!loading && !error && !rawData && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No data available
          </div>
        )}
        
        {rawData && (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const value = getFieldValue(rawData, field);
              // Pretty print field name
              const label = field.split('.').pop().toUpperCase();
              
              return (
                <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className="text-[10px] text-emerald-400 font-mono mb-1 tracking-wider opacity-80">{label}</div>
                  <div className="text-xl font-bold text-white break-all leading-tight">
                    {formatValue(value)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {lastUpdated && (
        <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/30 rounded-b-lg flex justify-between items-center">
          <span className="text-[10px] text-gray-500 font-mono">LIVE DATA</span>
          <span className="text-[10px] text-gray-500 font-mono">{lastUpdated}</span>
        </div>
      )}
    </div>
  );
}