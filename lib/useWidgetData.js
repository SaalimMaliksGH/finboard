/**
 * Custom hook for fetching and managing widget data
 * Handles caching, error states, loading states, and abort controllers
 */

import { useState, useEffect, useRef, useMemo } from 'react';

/**
 * @param {Object} config - Configuration object
 * @param {string} config.apiUrl - API endpoint URL
 * @param {string} config.apiKey - API authentication key
 * @param {any} config.initialData - Cached data from modal test
 * @param {Function} config.processData - Function to process raw API response
 * @param {Array} config.processDeps - Dependencies for processData function
 * @returns {Object} - { data, loading, error, lastUpdated, refetch }
 */
export const useWidgetData = ({ 
  apiUrl, 
  apiKey, 
  initialData, 
  processData,
  processDeps = []
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const hasFetchedOnce = useRef(false);
  const abortControllerRef = useRef(null);

  // Memoize API key to prevent re-renders
  const FINAL_API_KEY = useMemo(() => {
    return apiKey || process.env.NEXT_PUBLIC_API_KEY || process.env.NEXT_PUBLIC_INDIAN_STOCK_API_KEY || '';
  }, [apiKey]);

  /**
   * Fetch data from API
   */
  const fetchData = async () => {
    if (!apiUrl) {
      setError('No API URL provided');
      setLoading(false);
      return;
    }

    // Abort any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setLoading(true);
      setError(null);

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Setup headers
      const headers = {};
      if (FINAL_API_KEY) {
        headers['x-api-key'] = FINAL_API_KEY;
      }

      // Fetch from API
      const response = await fetch(apiUrl, {
        headers,
        signal: abortControllerRef.current.signal
      });

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate Limit Exceeded");
        if (response.status === 401 || response.status === 403) throw new Error("Invalid API key or unauthorized");
        throw new Error(`API Error: ${response.status}`);
      }

      // Parse response
      const rawData = await response.json();

      // Process data if processor function provided
      const processedData = processData ? processData(rawData) : rawData;

      // Update state
      setData(processedData);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
      hasFetchedOnce.current = true;
    } catch (err) {
      // Ignore aborted requests
      if (err.name === 'AbortError') return;
      
      console.error("Widget data fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Process initial cached data or fetch from API
   */
  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedOnce.current) return;

    // Try to use cached data first
    if (initialData) {
      try {
        const processedData = processData ? processData(initialData) : initialData;
        setData(processedData);
        setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
        setLoading(false);
        hasFetchedOnce.current = true;
      } catch (err) {
        console.error("Error processing cached data:", err);
        setError(err.message);
        setLoading(false);
      }
    } else if (apiUrl) {
      // No cached data, fetch from API
      fetchData();
    }

    // Cleanup: abort ongoing requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, apiUrl, ...processDeps]);

  /**
   * Manual refetch function
   */
  const refetch = () => {
    setError(null);
    fetchData();
  };

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch
  };
};
