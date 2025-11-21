import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Button } from './Button';
import { RefreshCw, Image as ImageIcon, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
       <Button 
          variant="ghost" 
          className="absolute top-safe left-4 z-20 text-white/80"
          onClick={onCancel}
        >
          <X className="w-8 h-8" />
        </Button>

      {/* Viewfinder Container */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: facingMode,
            aspectRatio: 3/4, 
          }}
          className="absolute w-full h-full object-cover"
        />
      </div>

      {/* Controls Area - Bottom Safe */}
      <div className="bg-black/90 backdrop-blur pt-6 pb-10 px-8 flex items-center justify-around z-10 safe-pb">
        <button 
          onClick={() => document.getElementById('hidden-file-input')?.click()}
          className="p-4 rounded-full bg-gray-800/60 text-white active:bg-gray-700 transition-colors"
        >
          <ImageIcon className="w-6 h-6" />
        </button>

        {/* Shutter Button */}
        <button 
          onClick={capture}
          className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center transition-transform active:scale-90"
        >
          <div className="w-16 h-16 bg-white rounded-full shadow-lg"></div>
        </button>

        <button 
          onClick={toggleCamera}
          className="p-4 rounded-full bg-gray-800/60 text-white active:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};