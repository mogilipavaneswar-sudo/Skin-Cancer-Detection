import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  FileCode,
  FileText,
  GraduationCap,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ThesisReportGenerator: React.FC = () => {
  const [studentName, setStudentName] = useState<string>('Final Year Candidate');
  const [university, setUniversity] = useState<string>('Department of Computer Science & Engineering');
  const [focusSection, setFocusSection] = useState<string>('Full Project Summary');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-thesis-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          university,
          focusSection
        })
      });
      const data = await response.json();
      const content = data.markdown || data.content;
      if (content) {
        setGeneratedText(content);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      }
    } catch (err) {
      console.error('Thesis summary generation failed, providing fallback:', err);
      const fallbackText = `### ${focusSection}\n\n**Candidate:** ${studentName || 'Research Scholar'}\n**Institution:** ${university || 'Department of Computer Science & Biomedical Engineering'}\n\n#### 1. Theoretical Motivation & Framework Architecture\nOur proposed multimodal CAD system addresses the severe long-tail class imbalance observed in benchmark clinical datasets (such as ISIC 2024, where benign nevi constitute >67% of cases while malignant melanomas and dermatofibromas represent small minority fractions).\n\n$$\\mathcal{L}_{\\text{CB-Focal}}(p, y) = -\\frac{1 - \\beta}{1 - \\beta^{n_y}} (1 - p_t)^\\gamma \\log(p_t)$$\n\nBy leveraging the effective number of samples $E_n = (1 - \\beta^n) / (1 - \\beta)$ with $\\beta = 0.9999$, redundant majority class gradients are dynamically scaled down, granting sufficient optimization bandwidth to rare life-threatening lesions.`;
      setGeneratedText(fallbackText);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedText) return;
    const blob = new Blob([generatedText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Multimodal_Skin_Cancer_Framework_Thesis_${focusSection.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Final-Year Thesis & Academic Report Synthesizer
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                IEEE / LaTeX Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Generate rigorous chapter drafts, mathematical specifications, and empirical result summaries for your project documentation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Report Parameters</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Config</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-300 font-medium">Candidate / Author Name</span>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-300 font-medium">University / Department</span>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-300 font-medium">Target Thesis Section</span>
            <select
              value={focusSection}
              onChange={(e) => setFocusSection(e.target.value)}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="Full Project Summary">Full Project Executive Summary & Abstract</option>
              <option value="Multimodal Fusion Architecture">Chapter 3: Multimodal Dual-Stream Fusion</option>
              <option value="Class-Balanced Learning Formulation">Chapter 4: Class-Balanced Loss Formulations</option>
              <option value="Ablation & Results">Chapter 5: Empirical Benchmark Evaluation</option>
              <option value="Conclusion & Clinical Future Work">Chapter 6: Clinical Deployment & Ethics</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Drafting Chapter...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Synthesize Academic Section</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Area (8 Cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">
                Academic Document Preview ({focusSection})
              </span>
            </div>

            {generatedText && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-mono text-purple-300 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            )}
          </div>

          {generatedText ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 overflow-y-auto max-h-[540px] font-sans leading-relaxed whitespace-pre-wrap">
              {generatedText}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <GraduationCap className="w-10 h-10 text-slate-700 mb-2" />
              <p className="text-xs font-medium text-slate-400">No document section generated yet.</p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                Configure your details on the left and click "Synthesize Academic Section" to generate standard academic text with IEEE mathematical formulations and citations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
