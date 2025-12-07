'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { processTableData } from '@/lib/dataExtractor';

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);

  const hasFetchedOnce = useRef(false);
  const abortControllerRef = useRef(null);
  const ROWS_PER_PAGE = 7;

  const FINAL_API_KEY = useMemo(() => apiKey || process.env.NEXT_PUBLIC_API_KEY || '', [apiKey]);

  const loadData = async () => {
    if (!apiUrl) {
      setError('No API URL provided');
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setLoading(true);
      setError(null);

      abortControllerRef.current = new AbortController();
      
      const headers = {};
      if (FINAL_API_KEY) {
        headers['x-api-key'] = FINAL_API_KEY;
      }
      
      const response = await fetch(apiUrl, { 
        headers,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate Limit Exceeded");
        throw new Error(`API Error: ${response.status}`);
      }

      const fetchedData = await response.json();
      const tableData = processTableData(fetchedData, fields);
      
      setData(tableData);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
      setLoading(false);
      hasFetchedOnce.current = true;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Table fetch error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedOnce.current) return;

    if (initialData) {
      try {
        const tableData = processTableData(initialData, fields);
        setData(tableData);
        setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
        setLoading(false);
        hasFetchedOnce.current = true;
      } catch (err) {
        console.error("Error processing cached data:", err);
        setError(err.message);
        setLoading(false);
      }
    } else if (apiUrl) {
      loadData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, apiUrl]);

  const handleManualRefresh = () => {
    setError(null);
    loadData();
    if (onRefresh) onRefresh();
  };

  // Pagination logic
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Get all unique keys from all data items to create headers
  const allHeaders = useMemo(() => {
    if (!data || data.length === 0) return [];
    const headerSet = new Set();
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => headerSet.add(key));
      }
    });
    return Array.from(headerSet);
  }, [data]);

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
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-2 py-1 text-xs rounded ${
                currentPage === 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              ← Prev
            </button>
            <span className="text-[10px] text-gray-500 font-mono">
              Page {currentPage} of {totalPages} ({data.length} rows)
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 text-xs rounded ${
                currentPage === totalPages
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