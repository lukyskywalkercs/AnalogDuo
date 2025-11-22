import React, { useEffect, useRef, useState } from 'react';
import { FilterType, AnalysisResult } from '../types';
import { applyFilterToCanvas } from '../utils/filters';
import { analyzeImageStyle } from '../services/geminiService';
import { Save, ArrowLeft, Wand2, Loader2 } from 'lucide-react';

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

  // Load image
  useEffect(() => {
    imgRef.current.src = imageSrc;
    imgRef.current.onload = () => {
      setImageLoaded(true);
      draw();
    };
  }, [imageSrc]);

  // Draw on filter change
  useEffect(() => {
    if (imageLoaded) {
      requestAnimationFrame(() => draw());
    }
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
    link.download = `analog-duo-${Date.now()}.jpg`;
    link.href = canvasRef.current?.toDataURL('image/jpeg', 0.9) || '';
    link.click();
  };

  return (
    <div className="flex flex-col h-full w-full bg-black text-white animate-fade-in">
      {/* Top Bar */}
      <div className="h-16 flex items-center px-4 z-10 bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 w-full">
        <button 
          onClick={onBack} 
          className="p-3 bg-black/30 backdrop-blur-md rounded-full active:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Canvas Area - Flex 1 to take all available space */}
      {/* Fondo muy oscuro para resaltar el marco blanco de la Polaroid */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#121212] w-full p-4">
        <canvas 
          ref={canvasRef} 
          className="max-w-full max-h-full object-contain shadow-2xl"
        />
        
        {/* AI Suggestion Toast */}
        {analysis && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 animate-fade-in text-center w-[85%] z-20 shadow-2xl">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">IA Sugiere: {analysis.suggestedFilter === FilterType.KODAK_GOLD ? 'Kodak Gold' : 'Fuji Pro'}</span>
                <p className="text-sm text-gray-200 italic font-serif">"{analysis.caption}"</p>
             </div>
          </div>
        )}
      </div>

      {/* Controls - Fixed height bottom area */}
      <div className="bg-[#0a0a0a] px-4 py-6 pb-safe border-t border-white/10 shrink-0 relative z-30">
        
        {/* Magic Button Floating */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
             <button 
                onClick={handleAnalysis} 
                disabled={isAnalysing}
                className="flex items-center justify-center w-12 h-12 bg-gray-900/90 backdrop-blur-lg text-purple-400 rounded-full shadow-lg shadow-purple-900/20 active:scale-95 transition-all border border-purple-500/30"
            >
                {isAnalysing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Wand2 className="w-5 h-5" />}
            </button>
        </div>

        <div className="flex items-center justify-between max-w-sm mx-auto gap-2 mt-2">
          
          {/* Filter 1: Kodak Gold 80 */}
          <button 
            onClick={() => setSelectedFilter(FilterType.KODAK_GOLD)}
            className={`flex-1 flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200 ${selectedFilter === FilterType.KODAK_GOLD ? 'bg-white/5' : 'active:bg-white/5'}`}
          >
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${selectedFilter === FilterType.KODAK_GOLD ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700'}`}>
              <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full"></div>
            </div>
            <span className={`text-[10px] font-bold tracking-wider uppercase ${selectedFilter === FilterType.KODAK_GOLD ? 'text-yellow-500' : 'text-gray-500'}`}>Kodak Gold</span>
          </button>

          {/* Filter 2: Fuji Pro 400H */}
          <button 
            onClick={() => setSelectedFilter(FilterType.FUJI_PRO_400H)}
            className={`flex-1 flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200 ${selectedFilter === FilterType.FUJI_PRO_400H ? 'bg-white/5' : 'active:bg-white/5'}`}
          >
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${selectedFilter === FilterType.FUJI_PRO_400H ? 'border-teal-400 bg-teal-900/20' : 'border-gray-700'}`}>
              <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-cyan-600 rounded-full"></div>
            </div>
            <span className={`text-[10px] font-bold tracking-wider uppercase ${selectedFilter === FilterType.FUJI_PRO_400H ? 'text-teal-400' : 'text-gray-500'}`}>Fuji Pro</span>
          </button>

          <div className="w-px h-10 bg-gray-800 mx-1"></div>

          {/* Save Button */}
          <button 
            onClick={handleDownload}
            className="flex-1 flex flex-col items-center gap-2 p-2 active:scale-95 transition-transform"
          >
             <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                <Save className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-bold tracking-wider uppercase text-white">Guardar</span>
          </button>

        </div>
      </div>
    </div>
  );
};