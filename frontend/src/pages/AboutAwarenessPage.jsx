import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Cpu,
  Layers,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Globe,
  Sparkles,
  Award,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function AboutAwarenessPage() {
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'vectors' | 'quiz'

  // Interactive Awareness Quiz State
  const quizQuestions = [
    {
      id: 1,
      question: 'Which of the following URLs is a classic Typosquatting impersonation of PayPal?',
      options: [
        'https://www.paypal.com/signin',
        'https://paypa1-security-verify.com',
        'https://developer.paypal.com/docs',
        'https://help.paypal.com/contact',
      ],
      correctIndex: 1,
      explanation:
        'Notice the numeral "1" replacing the letter "l" in "paypa1". Attackers exploit subtle visual character resemblances to mislead victims.',
    },
    {
      id: 2,
      question: 'Does having a padlock icon (HTTPS) guarantee that a website is legitimate?',
      options: [
        'Yes, HTTPS is only granted to officially verified corporations.',
        'Yes, malicious actors cannot obtain SSL certificates.',
        'No, over 80% of phishing sites today use free automated SSL certificates.',
        'Yes, provided the browser does not display a red warning cross.',
      ],
      correctIndex: 2,
      explanation:
        'HTTPS only encrypts communication in transit. Anyone can obtain a free SSL certificate from Automated CAs like Let\'s Encrypt in under 2 minutes.',
    },
    {
      id: 3,
      question: 'What is an "Adversary-in-the-Middle" (AitM) phishing attack?',
      options: [
        'A physical theft of an employee laptop.',
        'A proxy server that intercepts both credentials AND real-time session cookies / 2FA tokens.',
        'Sending spam emails containing malware attachments.',
        'A Distributed Denial of Service (DDoS) attack.',
      ],
      correctIndex: 1,
      explanation:
        'AitM reverse proxies (e.g., Evilginx) forward requests between the victim and the legitimate service in real time, capturing session cookies and bypassing standard SMS/TOTP 2FA.',
    },
  ];

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleSelectOption = (qId, optionIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    quizQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) score += 1;
    });
    return score;
  };

  const attackVectors = [
    {
      title: 'Homograph & Punycode Attacks',
      desc: 'Exploiting Cyrillic or Greek alphabets identical to Latin glyphs (e.g. Cyrillic "а" instead of Latin "a") mapped into xn-- punycode.',
      example: 'https://xn--pple-43d.com -> apple.com',
      severity: 'Critical',
    },
    {
      title: 'Subdomain Prefix Deception',
      desc: 'Embedding genuine brand trademarks into excessive left-side subdomains while the right-side domain belongs to an attacker.',
      example: 'https://paypal.com.account-update.ru/login',
      severity: 'High',
    },
    {
      title: 'Credential Harvesting Forms',
      desc: 'Replicating Single Sign-On (SSO) login boxes with JavaScript event listeners that forward input strokes to offshore drop servers.',
      example: 'input[type="password"] -> POST to external IP',
      severity: 'Critical',
    },
    {
      title: 'Zero-Day Fast-Flux Domains',
      desc: 'Freshly registered domains registered within 24-48 hours that stay live only long enough to conduct targeted spear-phishing.',
      example: 'Registered < 48 hours ago on dynamic bulletproof hosting',
      severity: 'High',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Badge variant="cyan" size="sm" className="mb-1">
            Cyber Threat Education
          </Badge>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            About PhishGuard AI & Security Awareness
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            System architectural overview, attack vector catalog, and interactive employee training quiz.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-cyber-darkest border border-cyber-border p-1 text-xs font-mono">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'about'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            System Overview
          </button>
          <button
            onClick={() => setActiveTab('vectors')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'vectors'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Attack Vectors
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'quiz'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Security Quiz
          </button>
        </div>
      </div>

      {/* Tab 1: System Overview */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              title="Multi-Layered AI Stack"
              subtitle="Beyond static blocklists"
              icon={Cpu}
            >
              <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                PhishGuard AI synthesizes three independent intelligence layers:
              </p>
              <ul className="space-y-2 text-xs text-cyber-muted font-mono">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Lexical String & Entropy NLP</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Deep Siamese Vision (CNN)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Explainable SHAP & LIME</span>
                </li>
              </ul>
            </Card>

            <Card
              title="Bilingual Intelligence"
              subtitle="English & தமிழ் Defense"
              icon={Globe}
            >
              <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                Equipped with native Tamil and English conversational security advisors to bridge language barriers in incident response across diverse organizational teams.
              </p>
              <div className="p-2.5 rounded bg-cyber-darkest border border-cyber-border text-[11px] text-cyan-300 font-mono">
                தமிழ் மொழியில் நேரடி இணைய பாதுகாப்பு விழிப்புணர்வு வழிகாட்டி.
              </div>
            </Card>

            <Card
              title="Continuous Watchdog"
              subtitle="24/7 Asset Monitoring"
              icon={ShieldCheck}
            >
              <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                Continuous polling of corporate domains to alert Security Operations Centers (SOC) against lookalike domain registrations, unauthorized DOM defacement, and expiring certificates.
              </p>
              <div className="text-xs text-emerald-400 font-mono font-semibold">
                ✓ Automated Alert Dispatch
              </div>
            </Card>
          </div>

          {/* Technical Specifications */}
          <Card
            title="Backend Integration Blueprint"
            subtitle="Configurable endpoints prepared for separate backend implementations"
            icon={Layers}
          >
            <div className="space-y-3 font-mono text-xs">
              <p className="text-slate-300 font-sans">
                The frontend communicates seamlessly with any RESTful backend via <code className="text-cyan-400 bg-cyber-darkest px-1.5 py-0.5 rounded">VITE_API_BASE_URL</code>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded bg-cyber-darkest border border-cyber-border">
                  <div className="font-bold text-cyan-300 mb-1">POST /api/scan/url</div>
                  <div className="text-cyber-muted">Analyzes URL and returns risk score + heuristics</div>
                </div>
                <div className="p-3 rounded bg-cyber-darkest border border-cyber-border">
                  <div className="font-bold text-cyan-300 mb-1">GET /api/xai/explain/:id</div>
                  <div className="text-cyber-muted">Supplies SHAP and LIME feature contributions</div>
                </div>
                <div className="p-3 rounded bg-cyber-darkest border border-cyber-border">
                  <div className="font-bold text-cyan-300 mb-1">POST /api/screenshot/analyze</div>
                  <div className="text-cyber-muted">Performs Siamese vision and OCR text extraction</div>
                </div>
                <div className="p-3 rounded bg-cyber-darkest border border-cyber-border">
                  <div className="font-bold text-cyan-300 mb-1">POST /api/assistant/chat</div>
                  <div className="text-cyber-muted">Handles bilingual conversational guidance queries</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Attack Vectors */}
      {activeTab === 'vectors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attackVectors.map((v, i) => (
            <Card
              key={i}
              title={v.title}
              badge={
                <Badge variant={v.severity === 'Critical' ? 'danger' : 'warning'} size="xs">
                  {v.severity}
                </Badge>
              }
              icon={AlertTriangle}
            >
              <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">{v.desc}</p>
              <div className="p-2.5 rounded bg-cyber-darkest border border-cyber-border font-mono text-xs">
                <span className="text-slate-400 block text-[10px] mb-1">Typical Signature:</span>
                <span className="text-red-400 break-all">{v.example}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 3: Security Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <Card
            title="Phishing Threat Defense Quiz"
            subtitle="Test and evaluate your awareness of modern cyber attack techniques"
            icon={Award}
            action={
              showResults && (
                <div className="text-xs font-mono font-bold text-cyan-400">
                  Score: {calculateScore()} / {quizQuestions.length}
                </div>
              )
            }
          >
            <div className="space-y-6">
              {quizQuestions.map((q, qIndex) => {
                const userSelected = selectedAnswers[q.id];
                const isAnswered = userSelected !== undefined;
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-cyber-darkest/70 border border-cyber-border space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                        Q{qIndex + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-200">{q.question}</h3>
                    </div>

                    <div className="space-y-2 pt-1 font-mono text-xs">
                      {q.options.map((opt, optIndex) => {
                        let btnStyle = 'border-cyber-border bg-cyber-card text-slate-300 hover:border-cyan-500/40';

                        if (showResults) {
                          if (optIndex === q.correctIndex) {
                            btnStyle = 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-bold';
                          } else if (userSelected === optIndex) {
                            btnStyle = 'border-red-500/60 bg-red-500/20 text-red-300';
                          }
                        } else if (userSelected === optIndex) {
                          btnStyle = 'border-cyan-400 bg-cyan-500/20 text-cyan-200 font-bold';
                        }

                        return (
                          <button
                            key={optIndex}
                            type="button"
                            onClick={() => !showResults && handleSelectOption(q.id, optIndex)}
                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {showResults && optIndex === q.correctIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            )}
                            {showResults && userSelected === optIndex && optIndex !== q.correctIndex && (
                              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {showResults && (
                      <div className="p-3 rounded-lg bg-cyber-card border border-cyan-500/20 text-xs text-cyber-muted font-sans mt-2">
                        <strong className="text-cyan-400 block mb-0.5 font-mono">Explanation:</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-2">
                {!showResults ? (
                  <Button
                    variant="primary"
                    onClick={() => setShowResults(true)}
                    disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                  >
                    Submit Answers
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedAnswers({});
                      setShowResults(false);
                    }}
                  >
                    Retry Quiz
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

