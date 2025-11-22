import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-center pointer-events-none">
      <div className="text-xl font-serif font-bold tracking-wide">AD.</div>
    </header>
  );
};