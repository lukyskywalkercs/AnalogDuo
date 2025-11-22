import React, { useEffect, useRef, useState } from 'react';
import { FilterType, AnalysisResult } from '../types';
import { applyFilterToCanvas } from '../utils/filters';
import { analyzeImageStyle } from '../services/geminiService';
import { Save, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

interface ImageEditorProps {
  imageSrc: string;
  onBack: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(FilterType.NONE);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    imgRef.current.src = imageSrc;
    imgRef.current.onload = () => {
      setImageLoaded(true);
      draw();
    };
  }, [imageSrc]);

  useEffect(() => {
    if (imageLoaded) requestAnimationFrame(() => draw());
  }, [selectedFilter, imageLoaded]);

  const draw = () => {
    if (canvasRef.current && imgRef.current) {
      applyFilterToCanvas(canvasRef.current, imgRef.current, selectedFilter);
    }
  };

  const handleAnalysis = async () => {
    if (isAnalysing) return;
    setIsAnalysing(true);
    const result = await analyzeImageStyle(imageSrc);
    setAnalysis(result);
    setSelectedFilter(result.suggestedFilter);
    setIsAnalysing(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `analog-${Date.now()}.png`;
    link.href = canvasRef.current?.toDataURL('image/png') || '';
    link.click();
  };

  return (
    <div className="flex flex-col h-full w-full bg-black text-white animate-fade-in">
      {/* Top Nav */}
      <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <button 
          onClick={onBack} 
          className="pointer-events-auto p-3 bg-white/10 backdrop-blur-md rounded-full active:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        
        <button 
            onClick={handleAnalysis} 
            disabled={isAnalysing}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
        >
            {isAnalysing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-purple-300" />}
            <span className="text-xs font-medium tracking-widest uppercase">Auto-Cine</span>
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative flex items-center justify-center bg-[#151515] overflow-hidden p-6">
        <canvas 
          ref={canvasRef} 
          className="max-w-full max-h-[85vh] object-contain shadow-2xl shadow-black"
        />
        
        {/* Caption Toast */}
        {analysis && (
          <div className="absolute top-24 bg-black/70 backdrop-blur px-6 py-3 rounded-lg border-l-2 border-purple-500 animate-fade-in max-w-[80%]">
             <p className="text-sm font-serif italic text-gray-200">"{analysis.caption}"</p>
          </div>
        )}
      </div>

      {/* Bottom Controls (Film Canister Style) */}
      <div className="bg-[#050505] pt-6 pb-safe px-6 border-t border-white/5 z-30">
        <div className="flex justify-center items-end gap-3 max-w-md mx-auto h-24">
          
          {/* KODAK BOX */}
          <button 
            onClick={() => setSelectedFilter(FilterType.KODAK_GOLD)}
            className={`relative group flex-1 h-20 rounded-sm transition-all duration-300 ${selectedFilter === FilterType.KODAK_GOLD ? '-translate-y-2 scale-105' : 'opacity-70 hover:opacity-100'}`}
          >
            <div className={`absolute inset-0 bg-kodak rounded-sm border-2 border-b-4 border-black flex flex-col items-center justify-center ${selectedFilter === FilterType.KODAK_GOLD ? 'shadow-[0_0_15px_rgba(255,197,0,0.4)]' : ''}`}>
               <span className="text-kodakRed font-bold text-lg tracking-tighter leading-none">KODAK</span>
               <span className="text-black text-[9px] font-bold tracking-widest uppercase mt-1">Gold 80</span>
            </div>
          </button>

          {/* FUJI BOX */}
          <button 
            onClick={() => setSelectedFilter(FilterType.FUJI_PRO_400H)}
            className={`relative group flex-1 h-20 rounded-sm transition-all duration-300 ${selectedFilter === FilterType.FUJI_PRO_400H ? '-translate-y-2 scale-105' : 'opacity-70 hover:opacity-100'}`}
          >
             <div className={`absolute inset-0 bg-fuji rounded-sm border-2 border-b-4 border-black flex flex-col items-center justify-center ${selectedFilter === FilterType.FUJI_PRO_400H ? 'shadow-[0_0_15px_rgba(0,208,156,0.4)]' : ''}`}>
               <span className="text-black font-bold text-lg tracking-tighter leading-none">FUJIFILM</span>
               <span className="text-black text-[9px] font-bold tracking-widest uppercase mt-1">Pro 400H</span>
            </div>
          </button>

           {/* SAVE */}
           <button 
            onClick={handleDownload}
            className="flex-none w-16 h-16 bg-white rounded-full flex items-center justify-center active:scale-90 transition-transform mb-2 ml-2"
          >
             <Save className="w-6 h-6 text-black" />
          </button>

        </div>
      </div>
    </div>
  );
};