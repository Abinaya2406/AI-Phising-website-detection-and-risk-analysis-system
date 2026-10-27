import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    nav: {
      home: 'Home & Scanner',
      scanResults: 'Scan Results',
      xai: 'Explainable AI',
      screenshot: 'Screenshot Analysis',
      riskDashboard: 'Risk Dashboard',
      assistant: 'AI Security Assistant',
      monitoring: 'Website Monitoring',
      alerts: 'Monitoring Alerts',
      history: 'Scan History',
      about: 'About & Awareness',
    },
    common: {
      scanUrl: 'Scan Website URL',
      scanning: 'Analyzing Target...',
      safe: 'Safe',
      suspicious: 'Suspicious',
      malicious: 'Malicious Phishing',
      demoMode: 'Demo Mode',
      backendOnline: 'Backend Online',
      backendOffline: 'Backend Offline',
      viewDetails: 'View Details',
      refresh: 'Refresh Data',
      copyUrl: 'Copy URL',
      copied: 'Copied!',
      language: 'Language',
    },
    hero: {
      badge: 'Next-Generation Threat Intelligence',
      title: 'AI-Powered Phishing Detection & Risk Analysis',
      subtitle: 'Defend your organization against zero-day brand impersonation, deceptive URLs, and stealth credential theft with explainable deep learning.',
      inputPlaceholder: 'Enter any website URL to inspect (e.g., https://secure-account-verify.com)...',
      scanButton: 'Analyze URL',
      recentThreats: 'Real-Time Threat Intel Feed',
    },
  },
  ta: {
    nav: {
      home: 'முகப்பு & ஸ்கேனர்',
      scanResults: 'முடிவுகள்',
      xai: 'விளக்கக்கூடிய AI (XAI)',
      screenshot: 'திரைப்பட பகுப்பாய்வு',
      riskDashboard: 'அபாய கட்டுப்பாட்டகம்',
      assistant: 'பாதுகாப்பு உதவியாளர்',
      monitoring: 'வலைத்தள கண்காணிப்பு',
      alerts: 'எச்சரிக்கைகள் & வரலாறு',
      history: 'ஸ்கேன் வரலாறு',
      about: 'விழிப்புணர்வு & அறிமுகம்',
    },
    common: {
      scanUrl: 'இணையதள URL பரிசோதி',
      scanning: 'ஆய்வு செய்யப்படுகிறது...',
      safe: 'பாதுகாப்பானது',
      suspicious: 'சந்தேகத்திற்குரியது',
      malicious: 'அபாயகரமான ஃபிஷிங்',
      demoMode: 'மாதிரி பயன்முறை (Demo)',
      backendOnline: 'சர்வர் ஆன்லைன்',
      backendOffline: 'சர்வர் ஆஃப்லைன்',
      viewDetails: 'விவரங்களை காண்க',
      refresh: 'புதுப்பி',
      copyUrl: 'URL நகலெடு',
      copied: 'நகலெடுக்கப்பட்டது!',
      language: 'மொழி',
    },
    hero: {
      badge: 'மேம்பட்ட AI இணைய அச்சுறுத்தல் பகுப்பாய்வு',
      title: 'AI-இயங்கும் ஃபிஷிங் வலைத்தள கண்டறிதல் மற்றும் அபாய பகுப்பாய்வு',
      subtitle: 'போலி நிறுவன வலைத்தளங்கள், மோசடி இணைப்புகள் மற்றும் கடவுச்சொல் திருட்டு முயற்சிகளை அதிநவீன AI மூலம் கண்டறியவும்.',
      inputPlaceholder: 'பரிசோதிக்க வேண்டிய URL முகவரியை உள்ளிடவும் (எ.கா. https://bank-login.com)...',
      scanButton: 'பரிசோதனை செய்க',
      recentThreats: 'நிகழ்நேர அச்சுறுத்தல் தகவல் ஓட்டம்',
    },
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('phishguard_lang') || 'en';
  });

  const toggleLanguage = (newLang) => {
    const selected = newLang || (lang === 'en' ? 'ta' : 'en');
    setLang(selected);
    localStorage.setItem('phishguard_lang', selected);
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

