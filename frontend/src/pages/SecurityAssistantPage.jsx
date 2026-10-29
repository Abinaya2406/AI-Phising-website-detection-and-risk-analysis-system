import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Globe,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Lock,
  Cpu,
  Info,
  Activity,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { querySecurityAssistant, getAssistantPresets } from '../services/assistantService';
import { getScanDetails } from '../services/scanService';
import { getRiskMeta } from '../utils/formatters';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';

export default function SecurityAssistantPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang, toggleLanguage } = useLanguage();
  const { currentScan, scanHistory, setCurrentScan } = useApp();

  const scanIdFromUrl = searchParams.get('id') || searchParams.get('scanId');

  // Active scan binding
  const [selectedScan, setSelectedScan] = useState(() => {
    if (scanIdFromUrl) {
      const found = (scanHistory || []).find((s) => s.id === scanIdFromUrl);
      if (found) return found;
    }
    return currentScan || null;
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize or update selected scan if URL param changes
  useEffect(() => {
    let active = true;
    async function syncScan() {
      if (scanIdFromUrl) {
        const found = (scanHistory || []).find((s) => s.id === scanIdFromUrl);
        if (found) {
          setSelectedScan(found);
        } else {
          try {
            const fetched = await getScanDetails(scanIdFromUrl);
            if (active && fetched) {
              setSelectedScan(fetched);
            }
          } catch (e) {
            console.warn('Could not load scan by ID:', scanIdFromUrl);
          }
        }
      }
    }
    syncScan();
    return () => {
      active = false;
    };
  }, [scanIdFromUrl, scanHistory]);

  // Initial welcome message based on language and scan state
  useEffect(() => {
    const welcomeText = getWelcomeMessage(lang, selectedScan);
    setMessages([
      {
        id: 'msg-init',
        sender: 'bot',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: 'system',
      },
    ]);
  }, [lang, selectedScan?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSelectScan = (scanId) => {
    if (!scanId) {
      setSelectedScan(null);
      setSearchParams({});
      return;
    }
    const target = (scanHistory || []).find((s) => s.id === scanId);
    if (target) {
      setSelectedScan(target);
      setCurrentScan(target);
      setSearchParams({ id: target.id });
    }
  };

  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await querySecurityAssistant(
        textToSend,
        lang,
        selectedScan?.id,
        selectedScan,
        messages.slice(-6).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }))
      );

      const botMsg = {
        id: `msg-${Date.now()}-b`,
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidence_used: response.evidence_used || [],
        precautions: response.precautions || [],
        uncertainty_note: response.uncertainty_note,
        is_credential_warning: response.is_credential_warning,
        engine: response.engine || 'assistant',
        isDemo: response.isDemo,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'bot',
          text:
            lang === 'ta'
              ? 'பாதுகாப்பு AI சேவையில் தற்காலிக சிக்கல் ஏற்பட்டுள்ளது. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
              : 'Security assistant service encountered an unexpected error. Please verify backend connectivity or try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: getWelcomeMessage(lang, selectedScan),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: 'system',
      },
    ]);
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dynamic Suggestion Chips
  const suggestions = getSuggestions(lang, selectedScan);

  const selectedScore =
    selectedScan?.adaptive_risk?.adaptive_risk_score ??
    selectedScan?.risk_score ??
    selectedScan?.riskScore ??
    0;
  const riskMeta = getRiskMeta(selectedScore);
  const categoryLabel = selectedScan?.adaptive_risk?.risk_category?.label || riskMeta.label;
  const badgeVariant =
    riskMeta.key === 'critical' || riskMeta.key === 'high'
      ? 'danger'
      : riskMeta.key === 'medium'
      ? 'warning'
      : 'safe';

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-125px)]">
      {/* Top Header Bar */}
      <div className="p-4 rounded-2xl bg-cyber-card border border-cyber-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2">
                PhishGuard AI Security Assistant
              </h1>
              <Badge variant="cyan" size="xs">
                {lang === 'ta' ? 'தமிழ் AI' : 'English NLP'}
              </Badge>
              <DemoBadge />
            </div>
            <p className="text-xs text-cyber-muted">
              {lang === 'ta'
                ? 'வலைத்தள ஸ்கேன் முடிவுகள், ஆபத்து காரணிகள் மற்றும் அவசர பாதுகாப்பு வழிகாட்டி'
                : 'Bilingual conversational advisor for completed website scans, risk factor triage, and incident response'}
            </p>
          </div>
        </div>

        {/* Right Header Actions: Language Switch & Clear */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Dual Language Selector Toggle */}
          <div className="flex items-center rounded-lg bg-cyber-darkest border border-cyber-border p-1">
            <button
              type="button"
              onClick={() => toggleLanguage('en')}
              className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                lang === 'en'
                  ? 'bg-cyan-500 text-black shadow-cyan-glow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => toggleLanguage('ta')}
              className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                lang === 'ta'
                  ? 'bg-cyan-500 text-black shadow-cyan-glow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              தமிழ்
            </button>
          </div>

          <Button variant="ghost" size="sm" icon={Trash2} onClick={handleClear}>
            {lang === 'ta' ? 'அழி' : 'Clear'}
          </Button>
        </div>
      </div>

      {/* Scan Context Selector & Active Intelligence Banner */}
      <div className="p-3.5 rounded-2xl bg-cyber-card/90 border border-cyber-border flex-shrink-0 space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-cyber-muted font-mono flex items-center gap-1.5 whitespace-nowrap">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              {lang === 'ta' ? 'ஆய்வு சூழல் (Scan Context):' : 'Scan Context:'}
            </span>

            {/* Scan Selection Dropdown */}
            <select
              value={selectedScan?.id || ''}
              onChange={(e) => handleSelectScan(e.target.value)}
              className="flex-1 md:w-80 px-3 py-1.5 rounded-lg bg-cyber-darkest border border-cyber-border text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="">
                {lang === 'ta'
                  ? '🛡️ பொதுவான இணைய பாதுகாப்பு வழிகாட்டி (எந்த ஸ்கேனும் இல்லை)'
                  : '🛡️ General Threat Intelligence (No Specific Scan)'}
              </option>
              {(scanHistory || []).map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.domain}] - Risk: {s.adaptive_risk?.adaptive_risk_score ?? s.risk_score ?? 0}/100 (
                  {s.target_brand || s.targetBrand || 'Generic'})
                </option>
              ))}
            </select>
          </div>

          {selectedScan && (
            <div className="flex items-center gap-2 self-end md:self-auto text-xs">
              <button
                type="button"
                onClick={() => handleSelectScan('')}
                className="text-xs text-slate-400 hover:text-cyan-400 underline font-mono"
              >
                {lang === 'ta' ? 'சூழலை நீக்கு' : 'Clear Scan Context'}
              </button>
              <span className="text-cyber-border">|</span>
              <button
                type="button"
                onClick={() => navigate(`/scan?id=${selectedScan.id}`)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
              >
                <ExternalLink className="w-3 h-3" />
                {lang === 'ta' ? 'முழு அறிக்கை' : 'Full Scan Report'}
              </button>
            </div>
          )}
        </div>

        {/* Selected Scan Intelligence Card */}
        {selectedScan && (
          <div className="p-3 rounded-xl bg-cyber-darkest/90 border border-cyber-border/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5 min-w-0">
              <Badge variant={badgeVariant} size="sm">
                {categoryLabel} ({selectedScore}/100)
              </Badge>
              <div className="truncate font-semibold text-slate-100 flex items-center gap-1.5">
                <span>{selectedScan.domain || selectedScan.url}</span>
              </div>
              {(selectedScan.target_brand || selectedScan.targetBrand) &&
                selectedScan.target_brand !== 'Unspecified' && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] text-blue-300">
                    Target: {selectedScan.target_brand || selectedScan.targetBrand}
                  </span>
                )}
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-400" />
                {selectedScan.ssl_status?.is_free_ca || selectedScan.sslStatus?.isFreeCA
                  ? 'Free CA'
                  : 'Enterprise CA'}
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                {selectedScan.heuristic_features?.has_password_field ? 'Credential Form' : 'Clean DOM'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages Display Area */}
      <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-cyber-darkest/90 border border-cyber-border space-y-4 shadow-inner">
        {messages.map((m) => {
          const isBot = m.sender === 'bot';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div
                  className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                    m.is_credential_warning
                      ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                      : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                  }`}
                >
                  {m.is_credential_warning ? (
                    <AlertOctagon className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed transition-all shadow-md ${
                  isBot
                    ? m.is_credential_warning
                      ? 'bg-red-950/30 border border-red-500/50 text-slate-100'
                      : 'bg-cyber-card border border-cyber-border text-slate-200'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-glow'
                }`}
              >
                {/* Security Guardrail Warning Tag */}
                {m.is_credential_warning && (
                  <div className="mb-3 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 font-bold flex items-center gap-2 text-xs font-mono">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    {lang === 'ta'
                      ? 'பாதுகாப்பு விதிய மீறல்: கடவுச்சொல் பாதுகாப்பு எச்சரிக்கை'
                      : 'SECURITY GUARDRAIL INTERCEPTED: Sensitive Credentials Detected'}
                  </div>
                )}

                {/* Formatted Markdown Content */}
                <div className="space-y-2 font-sans">
                  {renderFormattedText(m.text)}
                </div>

                {/* Evidence Used Badges */}
                {m.evidence_used && m.evidence_used.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-cyber-border/70">
                    <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 mb-1.5">
                      <Shield className="w-3 h-3" />
                      {lang === 'ta' ? 'பயன்படுத்தப்பட்ட ஆய்வு சான்றுகள்:' : 'Observed Scan Evidence:'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.evidence_used.map((ev, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Precautions Checklist */}
                {m.precautions && m.precautions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-cyber-border/70">
                    <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lang === 'ta' ? 'பரிந்துரைக்கப்பட்ட பாதுகாப்பு நடவடிக்கைகள்:' : 'Actionable Defensive Precautions:'}
                    </div>
                    <ul className="space-y-1">
                      {m.precautions.map((prec, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{prec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Uncertainty Note */}
                {m.uncertainty_note && (
                  <div className="mt-3 p-2 rounded-lg bg-cyber-darkest border border-cyber-border/80 flex items-start gap-2 text-[11px] text-yellow-300/90 font-mono">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-yellow-400" />
                    <span>{m.uncertainty_note}</span>
                  </div>
                )}

                {/* Footer Meta: Timestamp, Engine, Copy Button */}
                <div
                  className={`mt-3 pt-2 flex items-center justify-between text-[10px] font-mono border-t ${
                    isBot ? 'border-cyber-border/50 text-slate-500' : 'border-white/20 text-cyan-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{m.timestamp}</span>
                    {m.engine && (
                      <span className="px-1.5 py-0.2 rounded bg-cyber-darkest text-slate-400 border border-cyber-border">
                        {m.engine === 'security_guardrail'
                          ? 'Guardrail'
                          : m.engine === 'rule_based_evidence_engine'
                          ? 'Forensic Rule Engine'
                          : m.engine === 'gemini'
                          ? 'Gemini AI'
                          : m.engine === 'openai'
                          ? 'OpenAI'
                          : 'Assistant'}
                      </span>
                    )}
                    {m.isDemo && <span className="text-yellow-400/80">[DEMO]</span>}
                  </div>

                  {isBot && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(m.id, m.text)}
                      className="p-1 hover:text-cyan-400 text-slate-400 transition-colors flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {!isBot && (
                <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-cyan-300 flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs text-cyber-muted font-mono">
                {lang === 'ta'
                  ? 'PhishGuard AI ஆய்வு ஆதாரங்களை ஆராய்ந்து பதிலளிக்கிறது...'
                  : 'PhishGuard AI formulating forensic threat guidance...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Inquiries Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0 scrollbar-thin">
        <span className="text-[11px] text-cyber-muted flex items-center gap-1 font-mono flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          {lang === 'ta' ? 'விரைவு வினாக்கள்:' : 'Prompts:'}
        </span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(s)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full bg-cyber-card border border-cyber-border hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-300 transition-all whitespace-nowrap flex-shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 flex-shrink-0"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={
              selectedScan
                ? lang === 'ta'
                  ? ` '${selectedScan.domain}' பற்றி கேட்கவும் (எ.கா. ஏன் ஆபத்தானது, அதிகாரப்பூர்வ தளம் எது)...`
                  : `Ask about '${selectedScan.domain}' (e.g. why dangerous, official site, entered password)...`
                : lang === 'ta'
                ? 'சைபர் பாதுகாப்பு, SSL அல்லது ஃபிஷிங் குறித்து தமிழில் கேளுங்கள்...'
                : 'Ask security question or incident guidance in English or தமிழ்...'
            }
            className="w-full px-4 py-3 rounded-xl bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:shadow-cyan-glow text-slate-100 text-xs sm:text-sm focus:outline-none placeholder-slate-500 font-sans"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          icon={Send}
          disabled={!input.trim()}
        >
          {lang === 'ta' ? 'அனுப்பு' : 'Send'}
        </Button>
      </form>
    </div>
  );
}

/**
 * Generates initial greeting message based on context.
 */
function getWelcomeMessage(lang, scan) {
  if (scan && scan.domain) {
    const score = scan.adaptive_risk?.adaptive_risk_score ?? scan.risk_score ?? 0;
    if (lang === 'ta') {
      return `வணக்கம்! PhishGuard AI பாதுகாப்பு உதவியாளருக்கு வரவேற்கிறோம்.\n\n**ஆய்வு செய்யப்பட்டுள்ள தளம்**: \`${scan.domain}\` (இடர் மதிப்பீடு: **${score}/100**).\n\nநீங்கள் இந்த ஸ்கேன் பற்றி பின்வரும் கேள்விகளை கேட்கலாம்:\n- *இந்த இணையதளம் ஏன் ஆபத்தானது?*\n- *இடர் மதிப்பீடு ஏன் அதிகரித்தது?*\n- *அதிகாரப்பூர்வ இணையதளத்தை எவ்வாறு கண்டறிவது?*\n- *எனது கடவுச்சொல்லை உள்ளிட்டிருந்தால் நான் என்ன செய்ய வேண்டும்?*`;
    }
    return `Hello! I am your PhishGuard AI Security Advisor.\n\n**Active Scan Context Loaded**: \`${scan.domain}\` (Threat Risk Score: **${score}/100**).\n\nAsk me about this scan or choose a prompt below:\n- *Why is this website dangerous?*\n- *Why did the risk score increase?*\n- *How can I identify the official website?*\n- *What should I do if I entered my password?*`;
  }

  if (lang === 'ta') {
    return `வணக்கம்! நான் PhishGuard AI பாதுகாப்பு உதவியாளர். ஃபிஷிங் அச்சுறுத்தல்கள், போலி இணைய முகவரிகள், மற்றும் அவசர பாதுகாப்பு வழிகாட்டல் குறித்து என்னிடம் தமிழில் அல்லது ஆங்கிலத்தில் கேட்கலாம்.`;
  }
  return `Hello! I am PhishGuard AI Security Assistant. Ask me anything about phishing indicators, SSL misconceptions, brand impersonation, or emergency credential response in English or தமிழ்.`;
}

/**
 * Returns dynamic prompt suggestions.
 */
function getSuggestions(lang, scan) {
  if (scan && scan.domain) {
    if (lang === 'ta') {
      return [
        'இந்த இணையதளம் ஏன் ஆபத்தானது?',
        'இடர் மதிப்பீடு ஏன் அதிகரித்தது?',
        'அதிகாரப்பூர்வ இணையதளத்தை எவ்வாறு கண்டறிவது?',
        'எனது கடவுச்சொல்லை உள்ளிட்டிருந்தால் நான் என்ன செய்ய வேண்டும்?',
        'நான் என்ன முன்னெச்சரிக்கை நடவடிக்கைகளை எடுக்க வேண்டும்?',
      ];
    }
    return [
      'Why is this website dangerous?',
      'Why did the risk score increase?',
      'How can I identify the official website?',
      'What should I do if I entered my password?',
      'What precautions should I take on this site?',
    ];
  }

  if (lang === 'ta') {
    return [
      'ஃபிஷிங் (Phishing) இணையதளங்களை எவ்வாறு அடையாளம் காண்பது?',
      'SSL சான்றிதழ் (https) இருந்தால் மட்டுமே அந்த தளம் பாதுகாப்பானதா?',
      'என் வங்கி கடவுச்சொல்லை போலி தளத்தில் கொடுத்துவிட்டால் என்ன செய்வது?',
      'ஜீரோ-டே (Zero-Day) ஃபிஷிங்கை AI எவ்வாறு கண்டறிகிறது?',
    ];
  }
  return [
    'How does PhishGuard AI detect zero-day phishing websites?',
    'Why is an SSL certificate not enough to prove a website is safe?',
    'What are the key indicators of a brand impersonation attack?',
    'I accidentally clicked a suspicious link. What immediate steps should I take?',
  ];
}

/**
 * Lightweight markdown-like text renderer for paragraphs, headings, bullet points, and code.
 */
function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Heading 3
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-sm font-bold text-slate-100 mt-2 mb-1 flex items-center gap-1.5">
          {parseInlineFormatting(line.replace('### ', ''))}
        </h3>
      );
    }
    // Blockquote
    if (line.startsWith('> ')) {
      return (
        <div key={idx} className="my-1.5 p-2 rounded-lg bg-cyber-darkest/80 border-l-2 border-cyan-400 text-xs text-cyber-muted font-mono">
          {parseInlineFormatting(line.replace('> ', ''))}
        </div>
      );
    }
    // Bullet item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 ml-2 my-0.5">
          <span className="text-cyan-400 font-bold">•</span>
          <span>{parseInlineFormatting(line.slice(2))}</span>
        </div>
      );
    }
    // Numbered list item
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+\.)\s(.*)/);
      if (match) {
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 ml-2 my-0.5">
            <span className="text-cyan-400 font-bold font-mono">{match[1]}</span>
            <span>{parseInlineFormatting(match[2])}</span>
          </div>
        );
      }
    }
    // Empty line
    if (!line.trim()) {
      return <div key={idx} className="h-1" />;
    }
    // Standard paragraph line
    return (
      <p key={idx} className="text-xs sm:text-sm text-slate-200">
        {parseInlineFormatting(line)}
      </p>
    );
  });
}

/**
 * Parse bold (**text**) and code (`text`) inline.
 */
function parseInlineFormatting(str) {
  if (!str) return '';
  const parts = [];
  let remaining = str;
  let key = 0;

  // Split tokens by bold or backticks
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-cyber-darkest text-cyan-300 border border-cyber-border font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts.length > 0 ? parts : str;
}
