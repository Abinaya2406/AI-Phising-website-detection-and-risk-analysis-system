import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDemoMode, setDemoMode as persistDemoMode, getApiBaseUrl, apiRequest } from '../services/api';
import { getScanHistory } from '../services/scanService';
import { API_ENDPOINTS } from '../utils/constants';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentScan, setCurrentScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(getDemoMode);
  const [backendHealth, setBackendHealth] = useState('checking'); // 'checking' | 'connected' | 'disconnected'
  const [isLoading, setIsLoading] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    let isMounted = true;
    async function checkBackend() {
      try {
        await apiRequest(API_ENDPOINTS.HEALTH, { timeout: 3000 });
        if (isMounted) setBackendHealth('connected');
      } catch (err) {
        if (isMounted) setBackendHealth('disconnected');
      }
    }
    checkBackend();
    return () => { isMounted = false; };
  }, []);

  // Load initial scan history
  useEffect(() => {
    async function fetchHistory() {
      try {
        const history = await getScanHistory();
        setScanHistory(history);
        if (history.length > 0 && !currentScan) {
          setCurrentScan(history[0]);
        }
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
    fetchHistory();
  }, []);

  const toggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    persistDemoMode(nextVal);
  };

  return (
    <AppContext.Provider
      value={{
        currentScan,
        setCurrentScan,
        scanHistory,
        setScanHistory,
        isDemoMode,
        toggleDemoMode,
        backendHealth,
        apiBaseUrl: getApiBaseUrl(),
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

