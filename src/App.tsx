/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { SendLetterView } from './components/SendLetterView';
import { AdminView } from './components/AdminView';
import { getResponsibles, initLocalStorage, forceRecreateEmptyCollections } from './lib/storage';
import { Responsible } from './types';
import { Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [currentView, setView] = useState<'home' | 'send' | 'admin'>('home');
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);

  // Initialize and load dynamic responsibles
  useEffect(() => {
    const loadData = async () => {
      await initLocalStorage();
      await forceRecreateEmptyCollections();
      const res = await getResponsibles();
      setResponsibles(res);
    };
    loadData();
    
    // Whimsical background aesthetic: generate gentle floating hearts on mount
    const heartContainer = document.createElement('div');
    heartContainer.id = 'floating-hearts-layer';
    heartContainer.className = 'fixed inset-0 pointer-events-none overflow-hidden z-0';
    document.body.appendChild(heartContainer);

    const heartEmojis = ['❤️', '💖', '🍿', '🎈', '🌻', '🌹', '💌'];
    const createHeart = () => {
      const heartEl = document.createElement('div');
      heartEl.className = 'heart-bubble text-lg md:text-2xl opacity-0';
      heartEl.innerText = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
      
      // Random coordinates and animations
      const startX = Math.random() * 100; // view width %
      const duration = 6 + Math.random() * 10; // seconds
      const scale = 0.5 + Math.random() * 0.7;
      
      heartEl.style.left = `${startX}vw`;
      heartEl.style.animationDuration = `${duration}s`;
      heartEl.style.transform = `scale(${scale})`;
      
      heartContainer.appendChild(heartEl);
      
      // Delete after animation concludes
      setTimeout(() => {
        heartEl.remove();
      }, duration * 1000);
    };

    // Periodically spawn floating hearts
    const interval = setInterval(createHeart, 2500);
    // Instantiate a few initially
    for(let i=0; i<6; i++) {
      createHeart();
    }

    return () => {
      clearInterval(interval);
      heartContainer.remove();
    };
  }, []);

  // Sync state between components
  const refreshResponsiblesAndStats = async () => {
    const res = await getResponsibles();
    setResponsibles(res);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2d040a] via-[#1f0306] to-[#2d040a] font-sans antialiased text-[#FDF2F2] flex flex-col justify-between relative select-none">
      {/* Decorative Stationary Corner Ornaments */}
      <div className="fixed top-6 left-6 text-4xl opacity-20 pointer-events-none select-none z-0 text-[#E53E3E] hidden md:block font-[#font-serif] italic">❦</div>
      <div className="fixed top-6 right-6 text-4xl opacity-20 pointer-events-none select-none z-0 text-[#E53E3E] hidden md:block font-[#font-serif] italic">❦</div>
      <div className="fixed bottom-6 left-6 text-4xl opacity-20 pointer-events-none select-none z-0 text-[#E53E3E] hidden md:block font-[#font-serif] italic">❦</div>
      <div className="fixed bottom-6 right-6 text-4xl opacity-20 pointer-events-none select-none z-0 text-[#E53E3E] hidden md:block font-[#font-serif] italic">❦</div>

      <div>
        {/* Navigation Bar Header */}
        <Header currentView={currentView} setView={setView} />

        {/* Content Viewer viewport */}
        <main className="relative z-10">
          {currentView === 'home' && (
            <HomeView 
              onStartSend={() => setView('send')} 
              responsibles={responsibles} 
            />
          )}

          {currentView === 'send' && (
            <SendLetterView 
              onSuccessReturn={() => setView('home')} 
            />
          )}

          {currentView === 'admin' && (
            <AdminView 
              onRefreshData={refreshResponsiblesAndStats} 
              responsiblesList={responsibles}
            />
          )}
        </main>
      </div>

      {/* Elegant Arraial Footer */}
      <footer className="relative z-10 bg-[#1F0306] border-t border-[#FDF2F2]/10 py-6 text-center shadow-2xl">
        <p className="text-xs text-rose-200/40 font-sans tracking-wide">
          © {new Date().getFullYear()} Correio Elegante do Arraial • Desenvolvido com ❤️ para a Festa Junina Escolar.
        </p>
        <p className="text-[10px] text-pink-300/60 mt-1.5 uppercase font-semibold tracking-wider flex items-center justify-center gap-2">
          <span>🔒 Sistema 100% Anônimo</span>
          <span>•</span>
          <span>Selo de Redação do Cupido Real</span>
        </p>
      </footer>
    </div>
  );
}
