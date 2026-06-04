/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, ShieldAlert, Navigation, Sparkles, Send } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'send' | 'admin';
  setView: (view: 'home' | 'send' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#1e0306]/90 backdrop-blur-md border-b border-[#FDF2F2]/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div 
            onClick={() => setView('home')} 
            className="flex items-center space-x-1.5 sm:space-x-3 cursor-pointer group shrink-0"
            id="header-logo-container"
          >
            <div className="relative shrink-0">
              <span className="text-2xl sm:text-3xl leading-none block transform group-hover:scale-110 transition-transform">❤️</span>
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-300 animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-sm sm:text-lg italic font-semibold tracking-wide text-[#FDF2F2] group-hover:text-[#E53E3E] transition-colors leading-tight">
                Correio Elegante
              </span>
              <span className="text-[7.5px] sm:text-[9px] font-sans tracking-[0.1em] sm:tracking-[0.2em] text-[#FDF2F2]/60 uppercase font-semibold leading-none mt-0.5">
                Arraial CECB 2026
              </span>
            </div>
          </div>

          {/* Desktop & Mobile Navigation */}
          <nav className="flex space-x-1 sm:space-x-3 items-center shrink-0" id="header-nav-menu">
            <button
              onClick={() => setView('home')}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs tracking-wider uppercase font-bold transition-all duration-200 flex items-center space-x-1 ${
                currentView === 'home'
                  ? 'bg-[#E53E3E] text-white shadow-lg shadow-[#E53E3E]/20'
                  : 'text-[#FDF2F2]/80 hover:bg-[#FDF2F2]/5 hover:text-white'
              }`}
              style={{ minHeight: '38px', minWidth: '40px' }}
            >
              <span>🏰</span>
              <span className="hidden sm:inline">Início</span>
            </button>

            <button
              id="btn-nav-send"
              onClick={() => setView('send')}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs tracking-wider uppercase font-bold transition-all duration-200 flex items-center space-x-1 ${
                currentView === 'send'
                  ? 'bg-[#E53E3E] text-white shadow-lg shadow-[#E53E3E]/20'
                  : 'text-[#FDF2F2]/80 hover:bg-[#FDF2F2]/5 hover:text-white'
              }`}
              style={{ minHeight: '38px' }}
            >
              <Send className="h-3 w-3 text-[#E53E3E] group-hover:scale-110 shrink-0" />
              <span className="hidden sm:inline">Enviar Carta</span>
              <span className="inline sm:hidden">Enviar</span>
            </button>

            <button
              id="btn-nav-admin"
              onClick={() => setView('admin')}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs tracking-wider uppercase font-bold transition-all duration-200 flex items-center space-x-1 ${
                currentView === 'admin'
                  ? 'bg-[#E53E3E] text-white shadow-lg shadow-[#E53E3E]/20'
                  : 'text-[#FDF2F2]/80 hover:bg-[#FDF2F2]/5 hover:text-white'
              }`}
              style={{ minHeight: '38px' }}
            >
              <ShieldAlert className="h-3 w-3 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Painel Admin</span>
              <span className="inline sm:hidden">Admin</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
