'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { processChartData } from '@/lib/dataExtractor';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

export default function StockChartWidget({ 
  id,
  title, 
  apiUrl, 
  refreshInterval = 300, 
  fields = [], 
  apiKey,
  initialData,
  onDelete,
  onRefresh
}) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const hasFetchedOnce = useRef(false);
  const abortControllerRef = useRef(null);
  
  const FINAL_API_KEY = useMemo(() => apiKey || process.env.NEXT_PUBLIC_INDIAN_STOCK_API_KEY || '', [apiKey]);

  const fetchData = async (isManual = false) => {
    if (!apiUrl) return;

    // Abort any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setLoading(true);
      setError(null);

      abortControllerRef.current = new AbortController();

      const headers = {};
      if (FINAL_API_KEY) headers['x-api-key'] = FINAL_API_KEY;

      const response = await fetch(apiUrl, { 
        headers,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
         if (response.status === 429) throw new Error("Rate Limit Exceeded");
         throw new Error(`API Error: ${response.status}`);
      }

      const rawData = await response.json();
      const processedData = processChartData(rawData, fields, title);
      
      setChartData(processedData);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
      hasFetchedOnce.current = true;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Chart Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data only once on mount, or use cached initialData
  useEffect(() => {
    // If we already fetched, don't fetch again
    if (hasFetchedOnce.current) return;

    if (initialData) {
      try {
        const processedData = processChartData(initialData, fields, title);
        setChartData(processedData);
        setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
        setLoading(false);
        hasFetchedOnce.current = true;
      } catch (err) {
        console.error("Error processing cached data:", err);
        setError(err.message);
        setLoading(false);
      }
    } else if (apiUrl) {
      fetchData(false);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, apiUrl]); // Run when initialData or apiUrl changes, but guard with hasFetchedOnce

  const handleManualRefresh = () => {
    setError(null);
    fetchData(true);
    if (onRefresh) onRefresh();
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#10b981',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#64748b', maxTicksLimit: 6, font: { size: 10 } }
      },
      y: {
        grid: { color: '#334155', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 10 } },
        border: { display: false }
      },
    },
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    }
  };

  return (
    <div className={`h-full w-full flex flex-col bg-slate-900 text-white rounded-lg shadow-lg border transition-all ${error ? 'border-red-500/50' : 'border-slate-700 hover:border-emerald-500/50'}`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-700 h-14 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-6 h-6 flex-shrink-0 bg-slate-800 rounded flex items-center justify-center text-emerald-400 text-xs">📈</div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate text-sm" title={title}>{title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleManualRefresh} disabled={loading} className={`w-7 h-7 rounded hover:bg-slate-700 flex items-center justify-center transition-colors ${loading ? 'animate-spin text-emerald-500' : 'text-gray-400 hover:text-white'}`}>↻</button>
          <button onClick={() => onDelete && onDelete(id)} className="w-7 h-7 rounded hover:bg-red-900/50 flex items-center justify-center transition-colors text-gray-400 hover:text-red-400">🗑</button>
        </div>
      </div>
      
      <div className="flex-1 p-2 min-h-0 relative">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 text-center">
            <div className="text-2xl mb-2">⚠</div>
            <div className="text-xs break-words w-full">{error}</div>
            <button onClick={handleManualRefresh} className="mt-3 text-xs bg-red-800 hover:bg-red-700 px-3 py-1 rounded-full text-white">Retry</button>
          </div>
        ) : loading && !chartData ? (
           <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
             <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-xs">Loading Chart...</span>
           </div>
        ) : chartData ? (
           <div className="h-full w-full">
             <Line data={chartData} options={options} />
           </div>
        ) : (
           <div className="flex items-center justify-center h-full text-gray-500 text-xs">No Data</div>
        )}
      </div>
      
      {!error && lastUpdated && (
        <div className="px-4 py-1 border-t border-slate-700 bg-slate-800/30 rounded-b-lg flex justify-between items-center h-8 flex-shrink-0">
          <span className="text-[10px] text-gray-500 font-mono">CHART DATA</span>
          <span className="text-[10px] text-gray-500 font-mono">{lastUpdated}</span>
        </div>
      )}
    </div>
  );
}