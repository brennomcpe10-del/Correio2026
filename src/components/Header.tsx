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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div 
            onClick={() => setView('home')} 
            className="flex items-center space-x-3 cursor-pointer group"
            id="header-logo-container"
          >
            <div className="relative">
              <span className="text-3xl leading-none block transform group-hover:scale-110 transition-transform">❤️</span>
              <Sparkles className="absolute -top-1.5 -right-1.5 h-4 w-4 text-amber-300 animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl italic font-semibold tracking-wide text-[#FDF2F2] group-hover:text-[#E53E3E] transition-colors">
                Correio Elegante
              </span>
              <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#FDF2F2]/60 uppercase font-semibold">
                Arraial Escolar 2026
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex space-x-1 sm:space-x-3" id="header-nav-menu">
            <button
              onClick={() => setView('home')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-xs tracking-wider uppercase font-semibold transition-all duration-200 flex items-center space-x-1 ${
                currentView === 'home'
                  ? 'bg-[#E53E3E] text-white shadow-lg shadow-[#E53E3E]/20'
                  : 'text-[#FDF2F2]/80 hover:bg-[#FDF2F2]/5 hover:text-white'
              }`}
            >
              <span>🏰</span>
              <span className="hidden sm:inline">Início</span>
            </button>

            <button
              id="btn-nav-send"
              onClick={() => setView('send')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-xs tracking-wider uppercase font-semibold transition-all duration-200 flex items-center space-x-1.5 ${
                currentView === 'send'
                  ? 'bg-[#E53E3E] text-white shadow-lg shadow-[#E53E3E]/20'
                  : 'text-[#FDF2F2]/80 hover:bg-[#FDF2F2]/5 hover:text-white'
              }`}
            >
              <Send className="h-3 w-3 text-[#E53E3E]" />
              <span>Enviar Carta</span>
            </button>

            <button
              id="btn-nav-admin"
              onClick={() => setView('admin')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-xs tracking-wider uppercase font-semibold transition-all duration-200 flex items-center space-x-1.5 ${
                currentView === 'admin'
                  ? 'bg-[#E53E3E] text-white shadow-lg shadow-[#E53E3E]/20'
                  : 'text-[#FDF2F2]/80 hover:bg-[#FDF2F2]/5 hover:text-white'
              }`}
            >
              <ShieldAlert className="h-3 w-3 text-amber-300" />
              <span>Painel Admin</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
