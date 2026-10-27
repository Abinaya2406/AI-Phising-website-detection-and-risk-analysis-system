import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import ScanResultsPage from './pages/ScanResultsPage';
import XAIAnalysisPage from './pages/XAIAnalysisPage';
import ScreenshotAnalysisPage from './pages/ScreenshotAnalysisPage';
import AdaptiveRiskDashboard from './pages/AdaptiveRiskDashboard';
import SecurityAssistantPage from './pages/SecurityAssistantPage';
import WebsiteMonitoringPage from './pages/WebsiteMonitoringPage';
import MonitoringHistoryAlertsPage from './pages/MonitoringHistoryAlertsPage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import AboutAwarenessPage from './pages/AboutAwarenessPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppProvider>
          <Layout>
            <Routes>
              {/* Page 1: Home page with URL scanner */}
              <Route path="/" element={<HomePage />} />

              {/* Page 2: Scan results page */}
              <Route path="/results" element={<ScanResultsPage />} />

              {/* Page 3: Explainable AI analysis page */}
              <Route path="/xai" element={<XAIAnalysisPage />} />

              {/* Page 4: Screenshot analysis page */}
              <Route path="/screenshot" element={<ScreenshotAnalysisPage />} />

              {/* Page 5: Adaptive risk dashboard */}
              <Route path="/dashboard" element={<AdaptiveRiskDashboard />} />

              {/* Page 6: Tamil and English AI security assistant */}
              <Route path="/assistant" element={<SecurityAssistantPage />} />

              {/* Page 7: Website monitoring page */}
              <Route path="/monitoring" element={<WebsiteMonitoringPage />} />

              {/* Page 8: Monitoring history and alerts */}
              <Route path="/alerts" element={<MonitoringHistoryAlertsPage />} />

              {/* Page 9: Scan history page */}
              <Route path="/history" element={<ScanHistoryPage />} />

              {/* Page 10: About and security awareness page */}
              <Route path="/about" element={<AboutAwarenessPage />} />

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </AppProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

