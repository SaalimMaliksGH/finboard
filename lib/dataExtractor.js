/**
 * Utility functions for extracting and processing data from API responses
 */

/**
 * Get a value from an object using a dot-notation path
 * @param {Object} obj - The object to extract from
 * @param {String} path - The dot-notation path (e.g., "data.values" or "datasets")
 * @returns {any} The value at the path, or undefined if not found
 */
export const getFieldValue = (obj, path) => {
  if (!obj || !path) return undefined;
  
  // Remove 'data.' prefix if present
  const cleanPath = path.replace(/^data\./, '');
  
  // Check if the value exists directly
  if (obj[cleanPath] !== undefined) return obj[cleanPath];
  
  // Otherwise traverse the path
  return cleanPath.split('.').reduce(
    (acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, 
    obj
  );
};

/**
 * Extract all fields from an object recursively up to a maximum depth
 * @param {Object} obj - The object to extract fields from
 * @param {String} prefix - The current path prefix
 * @param {Number} depth - Current depth level
 * @param {Number} maxDepth - Maximum depth to traverse
 * @returns {Array} Array of field paths
 */
export const extractFields = (obj, prefix = '', depth = 0, maxDepth = 10) => {
  if (depth > maxDepth || obj === null || obj === undefined) return [];
  
  const fields = [];
  
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      const firstItem = obj[0];
      if (typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
        // Extract fields from first array item
        const subFields = extractFields(firstItem, prefix, depth + 1, maxDepth);
        fields.push(...subFields);
      } else {
        // Array of primitives or nested arrays
        fields.push(prefix);
      }
    } else {
      fields.push(prefix);
    }
  } else if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        fields.push(newPrefix);
        // Also extract fields from array items
        if (value.length > 0 && typeof value[0] === 'object' && !Array.isArray(value[0])) {
          const subFields = extractFields(value[0], newPrefix, depth + 1, maxDepth);
          fields.push(...subFields);
        }
      } else if (typeof value === 'object' && value !== null) {
        const subFields = extractFields(value, newPrefix, depth + 1, maxDepth);
        fields.push(...subFields);
      } else {
        fields.push(newPrefix);
      }
    }
  }
  
  return fields;
};

/**
 * Process chart data from API response
 * @param {Object} rawData - The raw API response
 * @param {Array} fields - Selected fields from user
 * @param {String} title - Chart title
 * @returns {Object} Chart.js compatible data object
 */
export const processChartData = (rawData, fields, title) => {
  console.log('Processing chart data:', { rawData, fields, targetPath: fields[0] });
  
  const targetPath = fields[0] || ''; 
  let targetData = getFieldValue(rawData, targetPath);
  
  console.log('Target data after getFieldValue:', targetData);

  // If targetData is an array of objects with 'values' property, extract the values from first item
  if (Array.isArray(targetData) && targetData.length > 0) {
    const firstItem = targetData[0];
    if (typeof firstItem === 'object' && !Array.isArray(firstItem)) {
      if (firstItem.values && Array.isArray(firstItem.values)) {
        console.log('Extracting values from first item');
        targetData = firstItem.values;
      } else if (firstItem.data && Array.isArray(firstItem.data)) {
        console.log('Extracting data from first item');
        targetData = firstItem.data;
      }
    }
  }

  console.log('Final target data:', targetData);

  if (!Array.isArray(targetData)) {
    throw new Error("Could not find chart data. Check field selection.");
  }

  let labels = [];
  let dataPoints = [];

  // Check if data is in [date, value] format
  if (targetData.length > 0 && Array.isArray(targetData[0])) {
    labels = targetData.map(item => item[0]); 
    dataPoints = targetData.map(item => parseFloat(item[1]));
  } else {
    // Fallback for simple array of numbers
    labels = targetData.map((_, i) => `Pt ${i + 1}`);
    dataPoints = targetData.map(val => parseFloat(val));
  }

  console.log('Chart processed:', { labels, dataPoints });

  // Limit to last 50 points for performance
  if (labels.length > 50) {
    labels = labels.slice(-50);
    dataPoints = dataPoints.slice(-50);
  }

  return {
    labels,
    datasets: [
      {
        label: title || 'Price',
        data: dataPoints,
        borderColor: '#10b981', 
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.4,
      },
    ],
  };
};

/**
 * Process table data from API response
 * @param {Object} fetchedData - The raw API response
 * @param {Array} fields - Selected fields from user
 * @returns {Array} Array of objects for table rows
 */
export const processTableData = (fetchedData, fields) => {
  console.log('Processing table data:', { fetchedData, fields });
  
  // Find the array in the response based on selected fields
  let tableData = [];
  
  // Try each field to find an array
  for (const field of fields) {
    const value = getFieldValue(fetchedData, field);
    if (Array.isArray(value)) {
      tableData = value;
      console.log('Found array data at field:', field, tableData);
      break;
    }
  }

  if (!Array.isArray(tableData) || tableData.length === 0) {
    console.log('No array data found, returning empty');
    return [];
  }

  return tableData;
};

/**
 * Process card widget data from API response
 * @param {Object} rawData - The raw API response
 * @param {Array} selectedFields - Array of selected field paths
 * @returns {Object} Object with field names as keys and values
 */
export const processCardData = (rawData, selectedFields) => {
  const cardData = {};
  
  selectedFields.forEach(fieldPath => {
    const value = getFieldValue(rawData, fieldPath);
    const fieldName = fieldPath.split('.').pop(); // Get last part of path as display name
    cardData[fieldName] = value;
  });
  
  return cardData;
};
