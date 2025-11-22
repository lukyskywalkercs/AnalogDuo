import React, { useState, ChangeEvent } from 'react';
import { Header } from './components/Header';
import { CameraCapture } from './components/CameraCapture';
import { ImageEditor } from './components/ImageEditor';
import { Button } from './components/Button';
import { AppView } from './types';
import { Camera, Scan } from 'lucide-react';

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

  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden relative">
      <input type="file" id="file-input" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {view === AppView.LANDING && (
        <>
          <Header />
          <main className="h-full flex flex-col items-center justify-center p-8 animate-fade-in z-10 relative">
            
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-7xl font-serif italic tracking-tighter text-white">
                Analog
                <span className="block text-4xl not-italic font-sans font-light tracking-[0.3em] mt-2 opacity-80">DUO</span>
              </h1>
              <p className="text-sm text-gray-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                Emulación química. <br/>
                <span className="text-kodak">Kodak Gold</span> vs <span className="text-fuji">Fuji Pro</span>
              </p>
            </div>

            <div className="flex flex-col w-full max-w-xs gap-4">
              <Button 
                onClick={() => setView(AppView.CAMERA)}
                className="bg-white text-black hover:bg-gray-200 h-14 font-serif italic text-xl"
                icon={<Camera className="w-5 h-5 mr-2"/>}
              >
                Capturar
              </Button>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('file-input')?.click()}
                className="h-14 border-white/20 hover:bg-white/5 font-sans tracking-widest text-xs uppercase"
                icon={<Scan className="w-4 h-4 mr-2"/>}
              >
                Cargar Carrete
              </Button>
            </div>
            
            <div className="absolute bottom-8 text-[10px] text-gray-600 uppercase tracking-[0.5em]">
              Tokyo • Rochester
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
          onBack={() => {
            setImageSrc(null);
            setView(AppView.LANDING);
          }}
        />
      )}
    </div>
  );
};

export default App;