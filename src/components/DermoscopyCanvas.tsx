import React, { useEffect, useRef, useState } from 'react';
import { BenchmarkCase } from '../types';
import { Eye, Image as ImageIcon, Layers, Palette, RefreshCw, Scan, Upload, ZoomIn } from 'lucide-react';

export type Colormap = 'jet' | 'viridis' | 'inferno' | 'turbo' | 'medical_hot';

interface DermoscopyCanvasProps {
  currentCase: BenchmarkCase | null;
  customImage?: string;
  heatmapOpacity: number;
  showGradcam: boolean;
  colormap: Colormap;
  showContour: boolean;
  screeningStatus?: 'POSITIVE' | 'NEGATIVE' | 'STANDBY';
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop?: (file: File) => void;
  onRemoveCustomImage?: () => void;
  onHeatmapOpacityChange?: (val: number) => void;
  onColormapChange?: (map: Colormap) => void;
  onToggleGradcam?: (val: boolean) => void;
  onToggleContour?: (val: boolean) => void;
}

export const DermoscopyCanvas: React.FC<DermoscopyCanvasProps> = ({
  currentCase,
  customImage,
  heatmapOpacity,
  showGradcam,
  colormap,
  showContour,
  screeningStatus,
  onFileUpload,
  onFileDrop,
  onRemoveCustomImage,
  onHeatmapOpacityChange,
  onColormapChange,
  onToggleGradcam,
  onToggleContour,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; val: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Colormap color mapper helper
  const getColorForIntensity = (t: number, map: Colormap): [number, number, number, number] => {
    t = Math.max(0, Math.min(1, t));
    if (map === 'jet') {
      // Jet colormap (Blue -> Cyan -> Yellow -> Red)
      const r = Math.max(0, Math.min(1, 1.5 - Math.abs(t * 4 - 3)));
      const g = Math.max(0, Math.min(1, 1.5 - Math.abs(t * 4 - 2)));
      const b = Math.max(0, Math.min(1, 1.5 - Math.abs(t * 4 - 1)));
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(t * 220)];
    } else if (map === 'viridis') {
      // Viridis (Purple -> Teal -> Yellow)
      const r = Math.round((0.267 + 0.728 * t) * 255);
      const g = Math.round((0.004 + 0.903 * Math.pow(t, 0.8)) * 255);
      const b = Math.round((0.329 + (1 - t) * 0.4) * 255);
      return [r, g, b, Math.round(t * 220)];
    } else if (map === 'inferno') {
      // Inferno (Black -> Purple -> Orange -> Yellow)
      const r = Math.round(Math.min(1, t * 1.6) * 255);
      const g = Math.round(Math.pow(t, 2.2) * 255);
      const b = Math.round((t < 0.5 ? t * 0.8 : (1 - t) * 0.5) * 255);
      return [r, g, b, Math.round(t * 220)];
    } else if (map === 'turbo') {
      // Turbo
      const r = Math.round((0.18 + 0.82 * Math.sin(t * Math.PI)) * 255);
      const g = Math.round((0.2 + 0.8 * Math.sin(t * Math.PI * 0.9)) * 255);
      const b = Math.round((1 - t) * 220);
      return [r, g, b, Math.round(t * 220)];
    } else {
      // Medical Hot (Transparent -> Crimson -> Bright Orange)
      const r = Math.round(Math.min(1, t * 1.8) * 255);
      const g = Math.round(Math.max(0, (t - 0.4) * 1.6) * 255);
      const b = Math.round(Math.max(0, (t - 0.7) * 2) * 255);
      return [r, g, b, Math.round(t * 240)];
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Simulated Dermoscopy Background / Lesion Texture
    if (customImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        drawOverlays();
      };
      img.src = customImage;
      return;
    }

    // Procedural Dermoscopy Rendering
    // Background skin tone
    const skinGradient = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width / 1.5);
    skinGradient.addColorStop(0, '#f0d3c0');
    skinGradient.addColorStop(0.7, '#e4beaa');
    skinGradient.addColorStop(1, '#cba38e');
    ctx.fillStyle = skinGradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle dermoscopic immersion oil ring / vignette
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.42, width / 2, height / 2, width * 0.52);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(10,15,25,0.85)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    const lesionType = currentCase ? currentCase.groundTruthClass : 'MEL';

    // Draw specific lesion morphology
    ctx.save();
    if (lesionType === 'MEL') {
      // Asymmetric irregular dark pigment network with blue-white veil
      const lesionGrad = ctx.createRadialGradient(width * 0.46, height * 0.44, 20, width * 0.5, height * 0.5, 110);
      lesionGrad.addColorStop(0, '#1c100b');
      lesionGrad.addColorStop(0.4, '#3b1c10');
      lesionGrad.addColorStop(0.75, '#68361f');
      lesionGrad.addColorStop(1, 'rgba(120, 68, 38, 0)');

      ctx.fillStyle = lesionGrad;
      ctx.beginPath();
      // Irregular polygon border
      ctx.moveTo(width * 0.30, height * 0.35);
      ctx.bezierCurveTo(width * 0.35, height * 0.18, width * 0.65, height * 0.22, width * 0.72, height * 0.38);
      ctx.bezierCurveTo(width * 0.85, height * 0.52, width * 0.75, height * 0.75, width * 0.58, height * 0.78);
      ctx.bezierCurveTo(width * 0.40, height * 0.82, width * 0.22, height * 0.65, width * 0.30, height * 0.35);
      ctx.fill();

      // Blue-white veil patch
      const veilGrad = ctx.createRadialGradient(width * 0.45, height * 0.42, 5, width * 0.45, height * 0.42, 38);
      veilGrad.addColorStop(0, 'rgba(160, 195, 230, 0.75)');
      veilGrad.addColorStop(0.8, 'rgba(120, 160, 200, 0.3)');
      veilGrad.addColorStop(1, 'rgba(100, 140, 180, 0)');
      ctx.fillStyle = veilGrad;
      ctx.beginPath();
      ctx.arc(width * 0.45, height * 0.42, 35, 0, Math.PI * 2);
      ctx.fill();

      // Peripheral pseudopods & streaks
      ctx.strokeStyle = '#2b1208';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        const r1 = 70 + (i % 3) * 12;
        const r2 = r1 + 14 + (i % 2) * 8;
        const x1 = width / 2 + Math.cos(angle) * r1;
        const y1 = height / 2 + Math.sin(angle) * r1;
        const x2 = width / 2 + Math.cos(angle) * r2;
        const y2 = height / 2 + Math.sin(angle) * r2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    } else if (lesionType === 'NV') {
      // Symmetric uniform reticular pigment network
      const nevusGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, 85);
      nevusGrad.addColorStop(0, '#5a341e');
      nevusGrad.addColorStop(0.6, '#825232');
      nevusGrad.addColorStop(0.9, '#a6724e');
      nevusGrad.addColorStop(1, 'rgba(166, 114, 78, 0)');

      ctx.fillStyle = nevusGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, 80, 0, Math.PI * 2);
      ctx.fill();

      // Regular concentric network dots
      ctx.fillStyle = '#3a1f10';
      for (let r = 25; r < 75; r += 14) {
        const count = Math.floor(r * 0.7);
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const x = width / 2 + Math.cos(angle) * r;
          const y = height / 2 + Math.sin(angle) * r;
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (lesionType === 'BCC') {
      // Pearly nodule with arborizing telangiectatic vessels
      const bccGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, 90);
      bccGrad.addColorStop(0, '#e8c2ba');
      bccGrad.addColorStop(0.5, '#d6a096');
      bccGrad.addColorStop(1, 'rgba(214, 160, 150, 0)');
      ctx.fillStyle = bccGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, 85, 0, Math.PI * 2);
      ctx.fill();

      // Blue-gray nests
      ctx.fillStyle = '#4a5b6c';
      ctx.beginPath();
      ctx.arc(width * 0.42, height * 0.44, 14, 0, Math.PI * 2);
      ctx.arc(width * 0.58, height * 0.38, 11, 0, Math.PI * 2);
      ctx.arc(width * 0.52, height * 0.62, 16, 0, Math.PI * 2);
      ctx.fill();

      // Arborizing branching vessels (telangiectasias)
      ctx.strokeStyle = '#c41d1d';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(width * 0.32, height * 0.65);
      ctx.quadraticCurveTo(width * 0.45, height * 0.55, width * 0.55, height * 0.45);
      ctx.lineTo(width * 0.68, height * 0.38);
      ctx.stroke();

      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(width * 0.45, height * 0.55);
      ctx.lineTo(width * 0.48, height * 0.70);
      ctx.moveTo(width * 0.55, height * 0.45);
      ctx.lineTo(width * 0.60, height * 0.58);
      ctx.moveTo(width * 0.68, height * 0.38);
      ctx.lineTo(width * 0.74, height * 0.46);
      ctx.stroke();
    } else if (lesionType === 'AKIEC') {
      // Erythematous strawberry pattern with yellowish keratotic scaling
      const akGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, 85);
      akGrad.addColorStop(0, '#c75146');
      akGrad.addColorStop(0.6, '#d97d74');
      akGrad.addColorStop(1, 'rgba(217, 125, 116, 0)');
      ctx.fillStyle = akGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, 80, 0, Math.PI * 2);
      ctx.fill();

      // Yellow hyperkeratotic scale clods
      ctx.fillStyle = '#fff4bd';
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 55;
        ctx.beginPath();
        ctx.arc(width / 2 + Math.cos(angle) * dist, height / 2 + Math.sin(angle) * dist, 2.5 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (lesionType === 'DF') {
      // Central white scar-like patch with peripheral pigment halo
      const haloGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 30, width * 0.5, height * 0.5, 85);
      haloGrad.addColorStop(0, '#8c5a3c');
      haloGrad.addColorStop(0.7, '#b38264');
      haloGrad.addColorStop(1, 'rgba(179, 130, 100, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, 80, 0, Math.PI * 2);
      ctx.fill();

      // Central white patch
      const patchGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, 32);
      patchGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      patchGrad.addColorStop(0.8, 'rgba(240, 240, 245, 0.8)');
      patchGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = patchGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, 32, 0, Math.PI * 2);
      ctx.fill();
    } else if (lesionType === 'BKL') {
      // Seborrheic keratosis with milia cysts & crypts
      const bklGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, 85);
      bklGrad.addColorStop(0, '#4a2c18');
      bklGrad.addColorStop(0.7, '#6b452b');
      bklGrad.addColorStop(1, 'rgba(107, 69, 43, 0)');
      ctx.fillStyle = bklGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, 82, 0, Math.PI * 2);
      ctx.fill();

      // Milia-like round white clods
      ctx.fillStyle = '#ffffff';
      const cysts = [
        { x: 0.42, y: 0.45, r: 3.5 },
        { x: 0.56, y: 0.38, r: 4.0 },
        { x: 0.48, y: 0.58, r: 3.0 },
        { x: 0.62, y: 0.52, r: 3.8 },
      ];
      cysts.forEach(c => {
        ctx.beginPath();
        ctx.arc(width * c.x, height * c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();

    drawOverlays();

    function drawOverlays() {
      // 2. Draw Grad-CAM Heatmap Overlay
      if (showGradcam) {
        const gradCanvas = document.createElement('canvas');
        gradCanvas.width = width;
        gradCanvas.height = height;
        const gCtx = gradCanvas.getContext('2d');
        if (gCtx) {
          const hotspots = currentCase?.gradcamConfig.hotspots || [
            { x: 45, y: 45, r: 30, intensity: 0.95 },
            { x: 55, y: 55, r: 25, intensity: 0.80 }
          ];

          // Create intensity field
          const imgData = gCtx.createImageData(width, height);
          const data = imgData.data;

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              let intensity = 0;
              hotspots.forEach(h => {
                const hx = (h.x / 100) * width;
                const hy = (h.y / 100) * height;
                const hr = (h.r / 100) * width;
                const dist = Math.hypot(x - hx, y - hy);
                if (dist < hr * 1.6) {
                  const factor = Math.exp(-Math.pow(dist / hr, 2) * 1.8);
                  intensity += factor * h.intensity;
                }
              });
              intensity = Math.min(1.0, intensity);

              if (intensity > 0.04) {
                const [r, g, b, a] = getColorForIntensity(intensity, colormap);
                const idx = (y * width + x) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = a;
              }
            }
          }
          gCtx.putImageData(imgData, 0, 0);

          ctx.save();
          ctx.globalAlpha = heatmapOpacity / 100;
          ctx.drawImage(gradCanvas, 0, 0);
          ctx.restore();
        }
      }

      // 3. Draw Lesion Segmentation Contour Boundary
      if (showContour) {
        ctx.save();
        ctx.strokeStyle = '#06b6d4'; // Cyan-500
        ctx.lineWidth = 2.0;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, 82, 0, Math.PI * 2);
        ctx.stroke();

        // 10mm scale bar in bottom right
        ctx.setLineDash([]);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(width - 80, height - 20);
        ctx.lineTo(width - 20, height - 20);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Tinos", "Times New Roman", serif';
        ctx.fillText('10 mm', width - 65, height - 26);
        ctx.restore();
      }
    }
  }, [currentCase, customImage, heatmapOpacity, showGradcam, colormap, showContour]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = Math.round((x / rect.width) * 100);
    const normY = Math.round((y / rect.height) * 100);

    let val = 0.15;
    const hotspots = currentCase?.gradcamConfig.hotspots || [{ x: 45, y: 45, r: 30, intensity: 0.95 }];
    hotspots.forEach(h => {
      const dist = Math.hypot(normX - h.x, normY - h.y);
      if (dist < h.r) {
        val = Math.max(val, (1 - dist / h.r) * h.intensity);
      }
    });

    setHoverCoord({ x: normX, y: normY, val: Number(val.toFixed(2)) });
  };

  const hasImage = Boolean(customImage || currentCase);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onFileDrop) {
      onFileDrop(file);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas Viewport Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl overflow-hidden bg-slate-50 dark:bg-black border transition-all duration-300 shadow-sm dark:shadow-xl flex items-center justify-center group min-h-[360px] ${
          isDragOver
            ? 'border-cyan-500 ring-2 ring-cyan-500/50 dark:border-white dark:ring-white/50'
            : 'border-slate-200 dark:border-neutral-800'
        }`}
      >
        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-40 bg-white/95 dark:bg-black/90 backdrop-blur-sm border-2 border-dashed border-cyan-500 dark:border-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150 pointer-events-none">
            <Upload className="w-10 h-10 text-cyan-600 dark:text-white mb-2 animate-bounce" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">Drop Skin Lesion Photo</span>
            <span className="text-xs text-slate-600 dark:text-neutral-300 mt-1">Plot real-time classification onto the ISIC Long-Tail Graph</span>
          </div>
        )}

        {hasImage ? (
          <>
            <canvas
              ref={canvasRef}
              width={420}
              height={380}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverCoord(null)}
              className="w-full max-w-[420px] aspect-square object-contain cursor-crosshair transition-transform duration-200"
            />

            {/* Floating Attention Hover Tooltip */}
            {hoverCoord && (
              <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-lg bg-white/95 dark:bg-black/90 backdrop-blur-md border border-slate-200 dark:border-neutral-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 shadow-md pointer-events-none flex items-center gap-2">
                <Scan className="w-3.5 h-3.5 text-cyan-600 dark:text-white" />
                <span>Patch ({hoverCoord.x}%, {hoverCoord.y}%)</span>
                <span className="text-cyan-600 dark:text-white font-semibold">Attn: {hoverCoord.val}</span>
              </div>
            )}

            {/* Screening Status Overlay Badge */}
            {screeningStatus && screeningStatus !== 'STANDBY' && (
              <div className="absolute top-3 right-3 pointer-events-none">
                {screeningStatus === 'POSITIVE' ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-rose-600/95 text-white border border-rose-400/50 shadow-lg shadow-rose-950/60 flex items-center gap-1.5 tracking-wide animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    POSITIVE (+)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-emerald-600/95 text-white border border-emerald-400/50 shadow-lg shadow-emerald-950/60 flex items-center gap-1.5 tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    NEGATIVE (-)
                  </span>
                )}
              </div>
            )}

            {/* Dataset Source / Custom Image Badge Overlay */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-sm border border-slate-200 dark:border-neutral-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-sm">
              <span>
                {customImage
                  ? 'Uploaded Patient Lesion'
                  : `${currentCase?.isicId || 'ISIC-2024'} | ${currentCase?.datasetSource || 'Dermoscopy 512px'}`}
              </span>
              {customImage && onRemoveCustomImage && (
                <button
                  type="button"
                  onClick={onRemoveCustomImage}
                  className="pointer-events-auto px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/20 dark:hover:bg-rose-600 text-rose-700 hover:text-rose-900 dark:text-rose-300 dark:hover:text-white border border-rose-300 dark:border-rose-500/40 text-[9px] font-bold transition-colors cursor-pointer"
                  title="Remove uploaded image"
                >
                  Remove ×
                </button>
              )}
            </div>
          </>
        ) : (
          /* Empty Standby State / Interactive Dropzone - Clean light colors in light mode, pitch black in dark mode */
          <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center gap-4 bg-slate-50 dark:bg-black">
            <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 dark:bg-black dark:border-white/40 dark:text-white shadow-xs">
              <Upload className="w-8 h-8 animate-bounce dark:text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Patient Lesion Image</h3>
              <p className="text-xs text-slate-600 dark:text-neutral-300 max-w-xs mt-1 leading-relaxed">
                Upload a dermoscopy image (JPG, PNG) to extract visual features, fuse with clinical priors, and calculate cancer screening status.
              </p>
            </div>
            {onFileUpload && (
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:border-neutral-500 font-bold text-xs font-mono flex items-center gap-2 shadow-xs transition-all">
                <Upload className="w-4 h-4 text-cyan-600 dark:text-white" />
                <span>Browse Image to Test</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Grad-CAM & Visualization Controls Toolbar */}
      <div className="p-3 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-300 font-medium">
            <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Grad-CAM Visual Saliency</span>
          </div>
          <button
            type="button"
            onClick={() => onToggleGradcam && onToggleGradcam(!showGradcam)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
              showGradcam
                ? 'bg-cyan-50 dark:bg-black text-cyan-800 dark:text-white border border-cyan-300 dark:border-white shadow-xs dark:shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                : 'bg-slate-100 dark:bg-black text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {showGradcam ? 'Overlay: ON' : 'Overlay: OFF'}
          </button>
        </div>

        {/* Opacity Slider */}
        {showGradcam && (
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="text-[11px] font-mono w-16">Opacity: {heatmapOpacity}%</span>
            <input
              type="range"
              min={10}
              max={100}
              value={heatmapOpacity}
              onChange={(e) => onHeatmapOpacityChange && onHeatmapOpacityChange(Number(e.target.value))}
              className="flex-1 accent-cyan-600 dark:accent-white h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Colormap Selector & Contour Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Colormap:</span>
            <select
              value={colormap}
              onChange={(e) => onColormapChange && onColormapChange(e.target.value as Colormap)}
              className="bg-white dark:bg-black text-slate-800 dark:text-white text-[11px] font-mono rounded px-2 py-1 border border-slate-300 dark:border-neutral-800 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="jet">Jet (Rainbow)</option>
              <option value="viridis">Viridis</option>
              <option value="inferno">Inferno</option>
              <option value="turbo">Turbo</option>
              <option value="medical_hot">Medical Hot</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => onToggleContour && onToggleContour(!showContour)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              showContour
                ? 'bg-blue-50 dark:bg-black text-blue-700 dark:text-white border border-blue-300 dark:border-white shadow-xs dark:shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                : 'bg-slate-100 dark:bg-black text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Contour: {showContour ? 'ON' : 'OFF'}</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleContour && onToggleContour(true)}
            disabled={showContour}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer disabled:cursor-default disabled:opacity-50 bg-slate-100 dark:bg-black text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-800 hover:text-slate-900 dark:hover:text-white"
            title="Reset border contour to its default visible state"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Contour</span>
          </button>
        </div>
      </div>
    </div>
  );
};
