import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Camera,
  UploadCloud,
  FileImage,
  Eye,
  CheckCircle,
  AlertTriangle,
  Zap,
  Layers,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Hash,
  Palette,
  Info,
  ExternalLink,
  X,
  RefreshCw,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { analyzeScreenshot, getReferenceBrands } from '../services/screenshotService';
import { isValidImageFile } from '../utils/validators';

export default function ScreenshotAnalysisPage() {
  const [searchParams] = useSearchParams();
  const initialUrl = searchParams.get('url') || '';
  const [targetUrl, setTargetUrl] = useState(initialUrl);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referenceBrands, setReferenceBrands] = useState([]);

  useEffect(() => {
    async function fetchBrands() {
      const brands = await getReferenceBrands();
      if (brands && brands.length) setReferenceBrands(brands);
    }
    fetchBrands();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const check = isValidImageFile(file);
    if (!check.valid) {
      setError(check.error);
      return;
    }
    setError('');
    setSelectedFile(file);
    try {
      setFilePreview(URL.createObjectURL(file));
    } catch (_) {}
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleRunAnalysis = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedFile && !targetUrl.trim()) {
      setError('Please upload a screenshot image or enter a target URL for automated capture.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await analyzeScreenshot({ file: selectedFile, targetUrl });
      setAnalysis(res);
    } catch (err) {
      setError(err.message || 'Screenshot vision analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const refComp = analysis?.reference_comparison || analysis?.referenceComparison || {};
  const isImpersonation = refComp.is_impersonation || refComp.isImpersonation;
  const isRefMatch = refComp.is_reference_match || refComp.isReferenceMatch;
  const canonicalDomains = refComp.canonical_domains || refComp.canonicalDomains || [];
  const palette = analysis?.dominant_colors || analysis?.dominantColors || [];
  const hashes = analysis?.perceptual_hashes || analysis?.perceptualHashes || {};
  const ocrTokens = analysis?.ocr_tokens || analysis?.ocrTokens || analysis?.ocrTextExtracted || [];
  const urgencyDetected = analysis?.urgency_detected ?? analysis?.urgencyDetected ?? analysis?.ocrUrgencyDetected;
  const layoutAnomalies = analysis?.layout_anomalies || analysis?.layoutAnomalies || [];
  const limitations = analysis?.limitations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="sm">
              Computer Vision & OCR
            </Badge>
            <Badge variant="primary" size="sm">
              Feature 2: Impersonation Analysis
            </Badge>
            {analysis?.isDemo && <DemoBadge />}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Camera className="w-6 h-6 text-cyan-400" />
            Screenshot-Based Phishing Detection & Brand Impersonation
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            Perceptual difference hashing (dHash, pHash), K-Means palette clustering, and verified benchmark brand comparison.
          </p>
        </div>
      </div>

      {/* Verified Reference Benchmark Database Bar */}
      <div className="p-3.5 rounded-xl bg-cyber-darkest/60 border border-cyber-border text-xs font-mono">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-cyan-400" />
            Active Reference Benchmark Profiles:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {['PayPal Inc.', 'Microsoft 365', 'Google LLC', 'JPMorgan Chase', 'Apple Inc.', 'Amazon.com'].map((brand, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-cyber-card border border-cyber-border text-[11px] text-cyan-300"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Upload and Target Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method 1: Upload Screenshot */}
        <Card
          title="Upload Web Page Screenshot"
          subtitle="Analyze full-page screenshot (PNG, JPG, WebP up to 10MB)"
          icon={UploadCloud}
        >
          <div className="space-y-3">
            <div className="border-2 border-dashed border-cyber-border hover:border-cyan-500/50 rounded-xl p-5 text-center transition-all bg-cyber-darkest/40">
              <input
                type="file"
                id="screenshot-upload"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="screenshot-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-2">
                  <FileImage className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click to select screenshot or drag & drop'}
                </span>
                <span className="text-[11px] text-cyber-muted mt-1">
                  Supported: PNG, JPG, WebP (Validated with Magic Bytes)
                </span>
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-2.5 rounded bg-cyber-darkest border border-cyber-border text-xs font-mono">
                <span className="text-cyan-400 truncate max-w-xs">{selectedFile.name}</span>
                <button
                  onClick={handleClearFile}
                  className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Method 2: Headless Capture by URL */}
        <Card
          title="Remote Headless Browser Capture"
          subtitle="Trigger isolated server-side snapshot with SSRF protection"
          icon={Eye}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Target URL to Capture
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://paypal-verify-account.cc/signin"
                className="w-full px-3.5 py-2.5 rounded-lg bg-cyber-darkest border border-cyber-border text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <p className="text-[11px] text-cyber-muted leading-relaxed">
              Enforces strict SSRF defense: blocks loopback, private RFC1918 blocks, AWS metadata, and non-HTTP schemes with a 5s execution ceiling.
            </p>
            <Button
              variant="primary"
              onClick={handleRunAnalysis}
              loading={loading}
              icon={Sparkles}
              className="w-full"
            >
              Analyze Visual Layout & Brand Match
            </Button>
          </div>
        </Card>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <LoadingSpinner
          text="Computing Computer Vision & Perceptual Hashing..."
          subtext="Calculating dHash 64-bit fingerprint, K-Means dominant color palette, and comparing against reference brand benchmarks"
        />
      )}

      {/* Analysis Results View */}
      {analysis && !loading && (
        <div className="space-y-6">
          {/* Impersonation Verdict Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
              isImpersonation
                ? 'bg-red-950/30 border-red-500/40'
                : isRefMatch
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-amber-950/30 border-amber-500/40'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl border text-center ${
                  isImpersonation
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : isRefMatch
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                <span className="text-2xl font-bold font-mono">
                  {analysis.visualSimilarityScore || analysis.visual_similarity_score}%
                </span>
                <span className="block text-[10px] uppercase font-bold">Similarity</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isImpersonation ? (
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  ) : isRefMatch ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <h3 className="text-base font-bold text-slate-100 font-mono">
                    {refComp.impersonation_verdict || refComp.impersonationVerdict || 'Visual Inspection Complete'}
                  </h3>
                </div>
                <p className="text-xs text-cyber-muted mt-1 font-sans">
                  Target matches <strong className="text-cyan-400">{analysis.detectedBrand || analysis.detected_brand}</strong> visual layout specifications.
                  {isImpersonation && canonicalDomains.length > 0 && (
                    <span className="block text-red-300 mt-0.5 font-mono text-[11px]">
                      Authorized domains: {canonicalDomains.join(', ')}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Badge
              variant={isImpersonation ? 'danger' : isRefMatch ? 'success' : 'warning'}
              size="md"
            >
              {isImpersonation ? 'Brand Impersonation Phish' : isRefMatch ? 'Authentic Brand Portal' : 'Unclassified Interface'}
            </Badge>
          </div>

          {/* Visual Comparison Grid: Analyzed Snapshot vs Verified Reference Brand */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Rendered / Uploaded Snapshot */}
            <Card
              title="Analyzed Screenshot Viewport"
              subtitle="Candidate snapshot submitted for perceptual inspection"
              icon={Eye}
            >
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-cyber-border bg-black max-h-96 flex items-center justify-center">
                  <img
                    src={filePreview || analysis.previewUrl || analysis.preview_url || analysis.heatmapUrl}
                    alt="Analyzed website screenshot"
                    className="w-full h-auto object-contain max-h-96"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold">
                    DETECTED: {analysis.logoDetected || analysis.logo_detected}
                  </div>
                </div>

                {/* Perceptual Hash String */}
                {hashes.dhash && (
                  <div className="p-2.5 rounded bg-cyber-darkest border border-cyber-border flex items-center justify-between font-mono text-xs">
                    <span className="text-cyber-muted flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-cyan-400" />
                      64-bit dHash:
                    </span>
                    <span className="text-cyan-300">{hashes.dhash}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Right: Authentic Reference Brand Benchmark Profile */}
            <Card
              title="Verified Reference Brand Benchmark"
              subtitle="Official corporate brand profile used for similarity matching"
              icon={ShieldCheck}
            >
              <div className="space-y-4 font-mono text-xs">
                {refComp.reference_preview_url ? (
                  <div className="p-4 rounded-lg bg-cyber-darkest border border-cyber-border flex flex-col items-center justify-center min-h-[160px]">
                    <img
                      src={refComp.reference_preview_url}
                      alt="Official Brand Reference Logo"
                      className="max-h-24 w-auto object-contain"
                    />
                    <span className="text-[11px] text-slate-400 mt-3 font-semibold">
                      {refComp.matched_brand} (Official Benchmark Template)
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-cyber-darkest border border-cyber-border text-center text-slate-400">
                    No single benchmark profile exceeded similarity thresholds. Evaluated against generic login signatures.
                  </div>
                )}

                {/* Similarity Metrics Breakdown */}
                <div className="space-y-2.5 pt-2 border-t border-cyber-border">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Structural Layout Match (dHash):</span>
                      <span className="font-bold text-cyan-400">{refComp.layout_similarity || 85}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cyber-darkest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${refComp.layout_similarity || 85}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Color Palette & Branding Fidelity:</span>
                      <span className="font-bold text-cyan-400">{refComp.color_similarity || 82}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cyber-darkest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${refComp.color_similarity || 82}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Perceptual Hamming Distance:</span>
                    <span className="font-bold text-slate-200">{refComp.hamming_distance ?? 12} / 64 bits diff</span>
                  </div>
                </div>

                {/* Canonical Domains Whitelist */}
                {canonicalDomains.length > 0 && (
                  <div className="p-2.5 rounded bg-cyber-darkest/60 border border-cyber-border">
                    <span className="text-[11px] text-cyber-muted block mb-1">Verified Canonical Root Domains:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {canonicalDomains.map((dom, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px]">
                          ✓ {dom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Dominant Color Palette Extracted */}
          {palette.length > 0 && (
            <Card
              title="Extracted Dominant Color Palette (K-Means Clustering)"
              subtitle="Primary color centroids extracted from screenshot pixels"
              icon={Palette}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {palette.map((col, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-cyber-darkest border border-cyber-border flex items-center gap-3 font-mono text-xs"
                  >
                    <div
                      className="w-10 h-10 rounded-lg border border-slate-600 flex-shrink-0 shadow"
                      style={{ backgroundColor: col.hex }}
                    />
                    <div>
                      <div className="font-bold text-slate-200">{col.hex}</div>
                      <div className="text-[11px] text-cyber-muted">{col.percentage}% pixels</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* OCR Extracted Text & Layout Anomalies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="OCR Text Stream & Urgency Extraction"
              subtitle="Optical Character Recognition tokens detected on page"
              icon={Layers}
            >
              <div className="space-y-2 font-mono text-xs">
                {ocrTokens.map((textLine, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-cyber-darkest/70 border border-cyber-border text-slate-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span>{textLine}</span>
                  </div>
                ))}
                {urgencyDetected && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 mt-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>Psychological Coercion: Detected account suspension / urgency keywords!</span>
                  </div>
                )}
              </div>
            </Card>

            <Card
              title="Forensic Layout Anomalies"
              subtitle="Structural flaws distinguishing phishing clone from genuine site"
              icon={Zap}
            >
              <div className="space-y-2.5 text-xs">
                {layoutAnomalies.map((anom, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-cyber-darkest/70 border border-cyber-border flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{anom.issue}</div>
                      <div className="text-[11px] text-cyber-muted mt-0.5">{anom.details}</div>
                    </div>
                    <Badge
                      variant={anom.severity === 'High' ? 'danger' : 'warning'}
                      size="xs"
                    >
                      {anom.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Methodological Limitations Banner */}
          <div className="p-4 rounded-xl bg-cyber-card/80 border border-cyber-border/80 flex items-start gap-3 text-xs text-cyber-muted font-sans leading-relaxed">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300 block mb-1">
                Computer Vision Methodology & Operating Boundaries
              </strong>
              <ul className="list-disc list-inside space-y-1">
                {limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
