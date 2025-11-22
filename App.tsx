import React, { useState, ChangeEvent } from 'react';
import { Header } from './components/Header';
import { CameraCapture } from './components/CameraCapture';
import { ImageEditor } from './components/ImageEditor';
import { Button } from './components/Button';
import { AppView } from './types';
import { Camera, ImagePlus } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setView(AppView.EDITOR);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = (src: string) => {
    setImageSrc(src);
    setView(AppView.EDITOR);
  };

  const resetApp = () => {
    setImageSrc(null);
    setView(AppView.LANDING);
  };

  return (
    // h-[100dvh] es crucial para móviles: ignora la barra de URL del navegador
    <div className="h-[100dvh] w-screen bg-black text-gray-100 flex flex-col font-sans overflow-hidden touch-none">
      {/* Hidden File Input for Global Usage */}
      <input
        type="file"
        id="hidden-file-input"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {view === AppView.LANDING && (
        <>
          <Header />
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden animate-fade-in">
            {/* Background Abstract Art */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
              <div className="absolute top-1/4 -left-10 w-72 h-72 bg-orange-600 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
              <div className="absolute bottom-1/4 -right-10 w-80 h-80 bg-teal-700 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{animationDelay: '2s'}}></div>
            </div>

            <div className="z-10 max-w-md w-full space-y-12">
              <div className="space-y-4">
                <h1 className="text-6xl font-bold serif tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-300 to-gray-400">
                  Analog<span className="text-gray-600 font-serif italic">Duo</span>
                </h1>
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto"></div>
                <p className="text-gray-400 text-lg font-light leading-relaxed tracking-wide">
                  La simplicidad de lo analógico.<br/>
                  <span className="text-yellow-500/90 font-medium">Kodak Gold</span> & <span className="text-teal-400/90 font-medium">Fuji Pro</span>
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full px-4 pt-8">
                <Button 
                  onClick={() => setView(AppView.CAMERA)}
                  className="w-full h-14 text-lg shadow-2xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md"
                  icon={<Camera className="w-6 h-6" />}
                >
                  Cámara
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => document.getElementById('hidden-file-input')?.click()}
                  className="w-full h-14 text-lg text-gray-400 hover:text-white transition-colors"
                  icon={<ImagePlus className="w-6 h-6" />}
                >
                  Abrir Galería
                </Button>
              </div>
              
              <div className="absolute bottom-safe w-full left-0 flex justify-center pb-8 opacity-50">
                 <p className="text-[10px] uppercase tracking-[0.3em]">Estudio de Color v2.0</p>
              </div>
            </div>
          </main>
        </>
      )}

      {view === AppView.CAMERA && (
        <CameraCapture 
          onCapture={handleCapture}
          onCancel={() => setView(AppView.LANDING)}
        />
      )}

      {view === AppView.EDITOR && imageSrc && (
        <ImageEditor 
          imageSrc={imageSrc}
          onBack={resetApp}
        />
      )}
    </div>
  );
};

export default App;