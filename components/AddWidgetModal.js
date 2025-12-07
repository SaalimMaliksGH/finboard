'use client';
import { useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { extractFields } from '@/lib/dataExtractor';

export default function AddWidgetModal({ isOpen, onClose }) {
  const addWidget = useDashboardStore((state) => state.addWidget);
  
  const [widgetName, setWidgetName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [displayMode, setDisplayMode] = useState('card');
  const [apiStatus, setApiStatus] = useState(null);
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArraysOnly, setShowArraysOnly] = useState(false);
  
  // NEW: Cache the API response from the test
  const [cachedApiResponse, setCachedApiResponse] = useState(null);
  const [testedApiUrl, setTestedApiUrl] = useState(''); // Track which URL was tested

  // Get Env Variables
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://stock.indianapi.in';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

  if (!isOpen) return null;

  const testApiConnection = async () => {
    if (!apiUrl) {
      setApiStatus({ success: false, message: 'Please enter an API Endpoint' });
      return;
    }

    // Construct the Full URL
    let urlToFetch = apiUrl;
    if (apiUrl.startsWith('/')) {
        urlToFetch = `${BASE_URL}${apiUrl}`;
    }

    try {
      setApiStatus({ success: null, message: 'Testing connection...' });
      
      // Fetch with Headers
      const response = await fetch(urlToFetch, {
        headers: {
            'x-api-key': API_KEY 
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // CACHE THE RESPONSE
        setCachedApiResponse(data);
        setTestedApiUrl(urlToFetch);
        
        // Extract fields from the response using utility function
        const fields = extractFields(data);
        const formattedFields = fields.map(fieldPath => ({
          path: fieldPath,
          type: 'auto',
          value: fieldPath
        }));
        setAvailableFields(formattedFields);
        setApiStatus({ 
          success: true, 
          message: `API connection successful! ${formattedFields.length} fields found. Response cached.` 
        });
      } else {
        setCachedApiResponse(null);
        setTestedApiUrl('');
        setApiStatus({ success: false, message: `Failed: ${data.message || response.statusText}` });
      }
    } catch (error) {
      setCachedApiResponse(null);
      setTestedApiUrl('');
      setApiStatus({ success: false, message: `Error: ${error.message}` });
    }
  };

  const toggleFieldSelection = (fieldPath) => {
    setSelectedFields(prev => 
      prev.includes(fieldPath) 
        ? prev.filter(f => f !== fieldPath)
        : [...prev, fieldPath]
    );
  };

  const handleAddWidget = () => {
    if (!widgetName || !apiUrl || selectedFields.length === 0) {
      alert('Please fill in all required fields and select at least one field to display');
      return;
    }

    // Save the full URL so the widget component doesn't need to reconstruct it
    const finalUrl = apiUrl.startsWith('/') ? `${BASE_URL}${apiUrl}` : apiUrl;

    const newWidget = {
      type: displayMode,
      title: widgetName,
      apiUrl: finalUrl,
      refreshInterval: refreshInterval,
      fields: selectedFields,
      apiKey: API_KEY,
      // INCLUDE CACHED DATA if available and URL matches
      initialData: (cachedApiResponse && testedApiUrl === finalUrl) ? cachedApiResponse : null
    };

    addWidget(newWidget);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setWidgetName('');
    setApiUrl('');
    setRefreshInterval(30);
    setDisplayMode('card');
    setApiStatus(null);
    setAvailableFields([]);
    setSelectedFields([]);
    setSearchQuery('');
    setShowArraysOnly(false);
    // Clear cache when modal closes
    setCachedApiResponse(null);
    setTestedApiUrl('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredFields = availableFields.filter(field => {
    const matchesSearch = field.path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArrayFilter = !showArraysOnly || field.type === 'array';
    return matchesSearch && matchesArrayFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/20"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Add New Widget</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Widget Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Widget Name
            </label>
            <input
              type="text"
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              placeholder="e.g., TCS Live Price"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* API URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Endpoint
            </label>
            <div className="text-xs text-gray-500 mb-2">
               Base URL: <span className="font-mono text-emerald-500">{BASE_URL}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="/stock?symbol=TCS.NS"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={testApiConnection}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span>↻</span>
                Test
              </button>
            </div>
            {apiStatus && (
              <div className={`mt-2 p-3 rounded-lg text-sm flex items-center gap-2 ${
                apiStatus.success === null 
                  ? 'bg-blue-900/30 text-blue-300' 
                  : apiStatus.success 
                  ? 'bg-emerald-900/30 text-emerald-300' 
                  : 'bg-red-900/30 text-red-300'
              }`}>
                <span>{apiStatus.success ? '✓' : apiStatus.success === null ? '⟳' : '✗'}</span>
                {apiStatus.message}
              </div>
            )}
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              min="5"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Display Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDisplayMode('card')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  displayMode === 'card' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                <span>📊</span>
                Card
              </button>
              <button
                onClick={() => setDisplayMode('table')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  displayMode === 'table' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                <span>📋</span>
                Table
              </button>
              <button
                onClick={() => setDisplayMode('chart')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  displayMode === 'chart' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                <span>📈</span>
                Chart
              </button>
            </div>
          </div>

          {/* Search Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Fields
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for fields..."
              disabled={availableFields.length === 0}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Show Arrays Only Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showArraysOnly"
              checked={showArraysOnly}
              onChange={(e) => setShowArraysOnly(e.target.checked)}
              disabled={availableFields.length === 0}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="showArraysOnly" className="text-sm text-gray-300">
              Show arrays only (for table view)
            </label>
          </div>

          {/* Available Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Available Fields
            </label>
            <div className="bg-slate-800 border border-slate-700 rounded-lg max-h-48 overflow-y-auto">
              {availableFields.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {apiStatus?.success === true 
                    ? 'No fields found in API response' 
                    : 'Test API connection to see available fields'}
                </div>
              ) : (
                <>
                  {filteredFields.map((field, index) => (
                    <div
                      key={index}
                      className="p-3 border-b border-slate-700 last:border-b-0 hover:bg-slate-750 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-emerald-400 truncate">
                            {field.path}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {field.type} | {field.value}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFieldSelection(field.path)}
                          className={`flex-shrink-0 w-6 h-6 rounded transition-colors flex items-center justify-center text-white ${
                            selectedFields.includes(field.path) ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-emerald-600'
                          }`}
                        >
                          {selectedFields.includes(field.path) ? '−' : '+'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredFields.length === 0 && availableFields.length > 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No fields match your search
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Selected Fields */}
          {selectedFields.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selected Fields
              </label>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                {selectedFields.map((field, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 bg-emerald-900/30 text-emerald-300 px-3 py-1 rounded-full text-sm mr-2 mb-2"
                  >
                    <span className="font-mono">{field}</span>
                    <button
                      onClick={() => toggleFieldSelection(field)}
                      className="text-emerald-400 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 bg-slate-900 p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddWidget}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Widget
          </button>
        </div>
      </div>
    </div>
  );
}