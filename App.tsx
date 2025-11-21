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
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background Abstract Art */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] mix-blend-screen animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-600 rounded-full blur-[120px] mix-blend-screen"></div>
            </div>

            <div className="z-10 max-w-md w-full space-y-12">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold serif tracking-tighter text-white">
                  Analog<span className="text-gray-500">Duo</span>
                </h1>
                <p className="text-gray-400 text-lg font-light leading-relaxed">
                  Dos estéticas legendarias. <br/>
                  <span className="text-yellow-500 font-medium">Kodak Gold 80</span> para la calidez.<br/>
                  <span className="text-teal-500 font-medium">Fuji Pro 400H</span> para la nitidez.
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full px-4">
                <Button 
                  onClick={() => setView(AppView.CAMERA)}
                  className="w-full h-14 text-lg shadow-xl"
                  icon={<Camera className="w-6 h-6" />}
                >
                  Cámara
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('hidden-file-input')?.click()}
                  className="w-full h-14 text-lg"
                  icon={<ImagePlus className="w-6 h-6" />}
                >
                  Galería
                </Button>
              </div>
              
              <p className="text-[10px] text-gray-600 uppercase tracking-widest pt-12 pb-safe">Versión 2.0 Mobile</p>
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