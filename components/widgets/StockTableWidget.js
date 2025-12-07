'use client';
import { useMemo } from 'react';
import { processTableData } from '@/lib/dataExtractor';
import { useWidgetData } from '@/lib/useWidgetData';
import { usePagination, extractTableHeaders } from '@/lib/usePagination';

export default function StockTableWidget({ 
  id,
  title, 
  apiUrl, 
  refreshInterval = 30, 
  fields = [], 
  apiKey,
  initialData,
  onDelete,
  onRefresh 
}) {
  // Use custom hook for data fetching
  const { data, loading, error, lastUpdated, refetch } = useWidgetData({
    apiUrl,
    apiKey,
    initialData,
    processData: (fetchedData) => processTableData(fetchedData, fields),
    processDeps: [fields]
  });

  // Use custom hook for pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage
  } = usePagination(data, 7);

  const handleManualRefresh = () => {
    refetch();
    if (onRefresh) onRefresh();
  };

  // Extract all unique headers from data
  const allHeaders = useMemo(() => extractTableHeaders(data), [data]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-900 text-white rounded-lg shadow-lg border border-slate-700 hover:border-emerald-500/50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 h-14 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-6 h-6 flex-shrink-0 bg-slate-800 rounded flex items-center justify-center text-emerald-400 text-xs">📊</div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate text-sm" title={title}>{title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleManualRefresh} 
            disabled={loading} 
            className={`w-7 h-7 rounded hover:bg-slate-700 flex items-center justify-center transition-colors ${loading ? 'animate-spin text-emerald-500' : 'text-gray-400 hover:text-white'}`}
          >
            ↻
          </button>
          <button 
            onClick={() => onDelete && onDelete(id)} 
            className="w-7 h-7 rounded hover:bg-red-900/50 flex items-center justify-center transition-colors text-gray-400 hover:text-red-400"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 text-center">
            <div className="text-2xl mb-2">⚠</div>
            <div className="text-xs break-words w-full">{error}</div>
            <button 
              onClick={handleManualRefresh} 
              className="mt-3 text-xs bg-red-800 hover:bg-red-700 px-3 py-1 rounded-full text-white"
            >
              Retry
            </button>
          </div>
        ) : loading && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Loading Table...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs">No Data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-800 sticky top-0">
                <tr>
                  {allHeaders.map((header, idx) => (
                    <th 
                      key={idx} 
                      className="px-3 py-2 text-left font-semibold text-emerald-400 uppercase tracking-wider border-b border-slate-700"
                    >
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {paginatedData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-800/50 transition-colors">
                    {allHeaders.map((header, colIdx) => (
                      <td key={colIdx} className="px-3 py-2 text-gray-300 whitespace-nowrap">
                        {row[header] !== undefined && row[header] !== null
                          ? typeof row[header] === 'object'
                            ? JSON.stringify(row[header])
                            : String(row[header])
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer with Pagination */}
      {!error && data.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/30 rounded-b-lg flex justify-between items-center h-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={!hasPrevPage}
              className={`px-2 py-1 text-xs rounded ${
                !hasPrevPage
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              ← Prev
            </button>
            <span className="text-[10px] text-gray-500 font-mono">
              Page {currentPage} of {totalPages} ({data?.length || 0} rows)
            </span>
            <button
              onClick={goToNextPage}
              disabled={!hasNextPage}
              className={`px-2 py-1 text-xs rounded ${
                !hasNextPage
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Next →
            </button>
          </div>
          {lastUpdated && (
            <span className="text-[10px] text-gray-500 font-mono">{lastUpdated}</span>
          )}
        </div>
      )}
    </div>
  );
}