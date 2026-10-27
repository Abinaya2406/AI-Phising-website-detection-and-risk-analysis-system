import React, { useState } from 'react';
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
  ArrowRight,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { analyzeScreenshot } from '../services/screenshotService';
import { isValidImageFile } from '../utils/validators';

export default function ScreenshotAnalysisPage() {
  const [searchParams] = useSearchParams();
  const initialUrl = searchParams.get('url') || '';
  const [targetUrl, setTargetUrl] = useState(initialUrl);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  };

  const handleRunAnalysis = async (e) => {
    e.preventDefault();
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
      setError(err.message || 'Screenshot analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="sm">
              Computer Vision & OCR
            </Badge>
            <DemoBadge />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Camera className="w-6 h-6 text-cyan-400" />
            Screenshot & Brand Impersonation Vision Analysis
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            Siamese CNN neural layout matching, brand logo detection, and OCR urgency extraction.
          </p>
        </div>
      </div>

      {/* Upload and Target Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method 1: Upload Screenshot */}
        <Card
          title="Upload Web Page Screenshot"
          subtitle="Analyze an existing full-page screenshot (PNG, JPG, WebP up to 10MB)"
          icon={UploadCloud}
        >
          <div className="border-2 border-dashed border-cyber-border hover:border-cyan-500/50 rounded-xl p-6 text-center transition-all bg-cyber-darkest/40">
            <input
              type="file"
              id="screenshot-upload"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="screenshot-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-3">
                <FileImage className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-200">
                {selectedFile ? selectedFile.name : 'Click to select screenshot or drag & drop'}
              </span>
              <span className="text-[11px] text-cyber-muted mt-1">
                Supported formats: PNG, JPEG, WebP
              </span>
            </label>
          </div>
        </Card>

        {/* Method 2: Headless Capture by URL */}
        <Card
          title="Remote Headless Browser Capture"
          subtitle="Trigger server-side automated Chromium snapshot"
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
                placeholder="https://example-phish-domain.com/login"
                className="w-full px-3.5 py-2.5 rounded-lg bg-cyber-darkest border border-cyber-border text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <p className="text-[11px] text-cyber-muted leading-relaxed">
              PhishGuard launches an isolated sandboxed headless browser to render the DOM and take a pixel-accurate viewport screenshot.
            </p>
            <Button
              variant="primary"
              onClick={handleRunAnalysis}
              loading={loading}
              icon={Sparkles}
              className="w-full"
            >
              Analyze Visual Layout
            </Button>
          </div>
        </Card>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono">
          {error}
        </div>
      )}

      {loading && (
        <LoadingSpinner
          text="Running Neural Visual Inspection..."
          subtext="Computing perceptual layout hash and running OCR text extraction"
        />
      )}

      {/* Analysis Results View */}
      {analysis && !loading && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center">
                <span className="text-2xl font-bold font-mono">{analysis.visualSimilarityScore}%</span>
                <span className="block text-[10px] uppercase font-bold">Similarity</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Visual Impersonation Detected
                </h3>
                <p className="text-xs text-cyber-muted mt-0.5">
                  Page visually mimics <strong className="text-cyan-400">{analysis.targetBrand}</strong> with near-identical login architecture.
                </p>
              </div>
            </div>
            <Badge variant="danger" size="md">
              High Visual Risk Match
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Heatmap / Preview */}
            <Card
              title="Rendered Screenshot & Layout Heatmap"
              subtitle="Attacker viewport snapshot captured by automated scanner"
              icon={Eye}
            >
              <div className="relative rounded-lg overflow-hidden border border-cyber-border bg-black max-h-96 flex items-center justify-center">
                <img
                  src={analysis.previewUrl || analysis.heatmapUrl}
                  alt="Scanned website snapshot"
                  className="w-full h-auto object-cover max-h-96"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-red-500/50 text-[10px] font-mono text-red-400 font-bold">
                  LOGO MATCH: {analysis.logoDetected}
                </div>
              </div>
            </Card>

            {/* OCR Extracted Text & Layout Anomalies */}
            <div className="space-y-6">
              <Card
                title="OCR Text Stream & Urgency Extraction"
                subtitle="Optical Character Recognition tokens detected on page"
                icon={Layers}
              >
                <div className="space-y-2 font-mono text-xs">
                  {analysis.ocrTextExtracted.map((textLine, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-cyber-darkest/70 border border-cyber-border text-slate-300 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                      <span>{textLine}</span>
                    </div>
                  ))}
                  {analysis.ocrUrgencyDetected && (
                    <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      Psychological Coercion: Detected account suspension urgency keywords!
                    </div>
                  )}
                </div>
              </Card>

              <Card
                title="Structural Layout Flaws"
                subtitle="Imperfections distinguishing phishing clone from genuine site"
                icon={Zap}
              >
                <div className="space-y-2 text-xs">
                  {analysis.layoutAnomalies.map((anom, idx) => (
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
          </div>
        </div>
      )}
    </div>
  );
}

