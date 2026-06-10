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
import { Sparkles, Heart, X } from 'lucide-react';

export default function App() {
  const [currentView, setView] = useState<'home' | 'send' | 'admin'>('home');
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [showBanner, setShowBanner] = useState(false);

  // Initialize and load dynamic responsibles
  useEffect(() => {
    const loadData = async () => {
      await initLocalStorage();
      await forceRecreateEmptyCollections();
      const res = await getResponsibles();
      setResponsibles(res);
    };
    loadData();

    // Slide down notification banner gently after a short delay
    const bannerTimer = setTimeout(() => {
      setShowBanner(true);
    }, 600);
    
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
      clearTimeout(bannerTimer);
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

        {/* Global Transition Announcement Banner - Slides down like a toast notification */}
        <div 
          className="fixed left-1/2 z-50 w-full max-w-xl px-4 transition-all duration-700 ease-out" 
          style={{ 
            top: '1.25rem',
            transform: `translate(-50%, ${showBanner ? '0' : '-200%'})`,
            opacity: showBanner ? 1 : 0, 
            pointerEvents: showBanner ? 'auto' : 'none' 
          }}
          id="transition-warning-banner"
        >
          <div className="bg-[#1f0306]/95 border-2 border-[#E53E3E]/60 rounded-2xl p-4 flex items-start gap-3 shadow-2xl relative overflow-hidden backdrop-blur-md">
            {/* Elegant luxury indicator line on the left */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-yellow-500 via-[#E53E3E] to-pink-600"></div>
            
            <span className="text-xl sm:text-2xl pt-0.5 shrink-0 animate-pulse">⚠️</span>
            <div className="flex-grow pr-6">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-yellow-400 mb-1 tracking-wide uppercase">
                AVISO: Preços Repaginados!
              </h4>
              <p className="text-xs text-[#FDF2F2]/90 leading-relaxed font-sans font-medium">
                Informamos que todos os pedidos de trufas feitos até o dia 10 de junho serão entregues normalmente. A partir desta data, 10 de junho, todos os mimos serão substituídos por deliciosos Bis.
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-3 right-3 text-[#FDF2F2]/40 hover:text-[#FDF2F2]/90 hover:bg-[#FDF2F2]/10 p-1 rounded-full transition-all duration-200 cursor-pointer"
              title="Fechar aviso"
              id="close-warning-banner-btn"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

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
          © {new Date().getFullYear()} Correio Elegante do CECB • Desenvolvido com ❤️ para a Festa Junina Escolar.
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
