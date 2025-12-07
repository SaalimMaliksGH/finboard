/**
 * Custom hook for pagination logic
 * Handles page state, calculations, and navigation
 */

import { useState, useMemo } from 'react';

/**
 * @param {Array} data - The array of data to paginate
 * @param {Number} itemsPerPage - Number of items per page (default: 7)
 * @returns {Object} - Pagination state and controls
 */
export const usePagination = (data = [], itemsPerPage = 7) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination values
  const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data?.slice(startIndex, endIndex) || [];

  // Navigation handlers
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToPage = (pageNumber) => {
    const page = Math.max(1, Math.min(pageNumber, totalPages));
    setCurrentPage(page);
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  // Pagination info
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return {
    // Data
    paginatedData,
    
    // Current state
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    itemsPerPage,
    totalItems: data?.length || 0,
    
    // Navigation functions
    goToNextPage,
    goToPrevPage,
    goToPage,
    resetPage,
    
    // Boolean flags
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage
  };
};

/**
 * Extract unique headers from array of objects
 * @param {Array} data - Array of objects
 * @returns {Array} - Array of unique header keys
 */
export const extractTableHeaders = (data = []) => {
  if (!data || data.length === 0) return [];
  
  const headerSet = new Set();
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => headerSet.add(key));
    }
  });
  
  return Array.from(headerSet);
};
