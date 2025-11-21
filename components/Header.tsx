import React from 'react';
import { Camera, Aperture } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <Aperture className="w-6 h-6 text-white" />
          <span className="text-xl font-bold tracking-wider text-white serif">Analog Duo</span>
        </div>
      </div>
    </header>
  );
};