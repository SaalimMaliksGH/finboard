'use client';
import { useState, useEffect, useRef, useMemo } from 'react';

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
  const [data, setData] = useState(initialData || null); // Use cached data if available
  const [loading, setLoading] = useState(!initialData); // Don't show loading if we have cached data
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(initialData ? new Date().toLocaleTimeString('en-US', { hour12: false }) : null);
  const [retryCount, setRetryCount] = useState(0);

  // Use useMemo to prevent recreating the key on every render
  const FINAL_API_KEY = useMemo(() => {
    return apiKey || process.env.NEXT_PUBLIC_API_KEY || '';
  }, [apiKey]);

  // Use a ref to prevent state updates on unmounted components
  const isMounted = useRef(true);
  const hasFetchedOnce = useRef(!!initialData); // Track if we've already fetched
  const maxRetries = 3;

  useEffect(() => {
    isMounted.current = true;
    setRetryCount(0); // Reset retry count when effect reruns
    
    // Setup AbortController to cancel old requests if dependencies change
    const controller = new AbortController();
    const signal = controller.signal;

    // Define fetch logic INSIDE useEffect to avoid dependency loops
    const fetchData = async () => {
      if (!apiUrl) {
        setError('No API URL provided');
        setLoading(false);
        return;
      }

      // Skip initial fetch if we already have cached data
      if (hasFetchedOnce.current && initialData) {
        hasFetchedOnce.current = false; 
        return;
      }

      // Stop if max retries exceeded
      if (retryCount >= maxRetries) {
        setError('Max retries reached. Please refresh manually.');
        setLoading(false);
        return;
      }

      try {
        // Only show loading spinner if we don't have data yet
        if (!data) setLoading(true);
        
        const headers = {};
        if (FINAL_API_KEY) {
          headers['x-api-key'] = FINAL_API_KEY;
        }

        const response = await fetch(apiUrl, { 
            headers,
            signal // Pass the signal to fetch
        });

        if (!response.ok) {
           // Handle specific HTTP errors
           if (response.status === 429) {
             throw new Error("Rate limit exceeded. Try again later.");
           }
           if (response.status === 401 || response.status === 403) {
             throw new Error("Invalid API key or unauthorized.");
           }
           throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();

        // Only update state if component is still mounted
        if (isMounted.current) {
          setData(result);
          setError(null);
          setRetryCount(0); // Reset on success
          setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
          setLoading(false);
          hasFetchedOnce.current = true;
        }
      } catch (err) {
        if (err.name === 'AbortError') {
            console.log('Fetch aborted for widget:', title);
        } else if (isMounted.current) {
            console.error(`Widget "${title}" Fetch Error:`, err.message);
            setError(err.message);
            setRetryCount(prev => prev + 1);
            setLoading(false);
        }
      }
    };

    // Initial call - skip if we have cached data
    if (!initialData) {
      fetchData();
    }

    // Setup Interval - only if we haven't exceeded retries
    let intervalId = null;
    if (refreshInterval && refreshInterval > 0 && retryCount < maxRetries) {
      intervalId = setInterval(fetchData, refreshInterval * 1000);
    }

    // Cleanup
    return () => {
      isMounted.current = false;
      controller.abort(); // Cancel any in-flight request
      if (intervalId) clearInterval(intervalId);
    };
    
    // DEPENDENCIES: Only apiUrl and FINAL_API_KEY
    // DO NOT include refreshInterval to prevent constant re-renders
  }, [apiUrl, FINAL_API_KEY, title, retryCount]); 

  // Manual Refresh Handler
  const handleManualRefresh = () => {
    setRetryCount(0); // Reset retry count
    setLoading(true);
    setError(null);
    
    const fetchOneOff = async () => {
        try {
            const headers = FINAL_API_KEY ? { 'x-api-key': FINAL_API_KEY } : {};
            const res = await fetch(apiUrl, { headers });
            
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const json = await res.json();
            
            if (isMounted.current) {
              setData(json);
              setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
              setError(null);
            }
        } catch(e) { 
          if (isMounted.current) {
            setError(e.message);
          }
        } finally {
          if (isMounted.current) {
            setLoading(false);
          }
        }
    };
    fetchOneOff();
    
    if (onRefresh) onRefresh();
  };

  // Helper to safely access nested properties
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
        {loading && !data && (
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
        
        {!loading && !error && !data && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No data available
          </div>
        )}
        
        {data && (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const value = getFieldValue(data, field);
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