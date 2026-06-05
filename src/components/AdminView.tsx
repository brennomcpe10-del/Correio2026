/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, LogIn, BarChart3, QrCode, MailOpen, Users2, Copy, Check, 
  Plus, Trash2, Search, Filter, CheckCircle2, ShieldAlert, Undo2, TrendingUp, AlertTriangle,
  Upload, X, Camera, Unlock
} from 'lucide-react';
import { 
  getStats, getAccessCodes, generateCode, getLetters, updateLetterStatus, 
  getResponsibles, addResponsible, deleteResponsible,
  getAllowedAdmins, addAllowedAdmin, removeAllowedAdmin, checkIsAllowedAdmin
} from '../lib/storage';
import { ProductType, PRODUCTS, AccessCode, Letter, Responsible } from '../types';

interface AdminViewProps {
  onRefreshData: () => void;
  responsiblesList: Responsible[];
}

interface ResponsibleAvatarProps {
  src?: string;
  alt: string;
  className?: string;
}

const ResponsibleAvatar: React.FC<ResponsibleAvatarProps> = ({ src, alt, className }) => {
  const [error, setError] = useState(false);

  // Fallback rendering
  const renderFallback = () => {
    return (
      <div 
        className={`bg-zinc-800 text-[#FDF2F2]/40 flex items-center justify-center shrink-0 ${className} select-none`}
        title={alt}
      >
        <span className="text-xs font-semibold">👤</span>
      </div>
    );
  };

  if (error || !src) {
    return renderFallback();
  }

  const getSafeSrc = (url: string): string => {
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('data:image/')) {
      return trimmed;
    }
    if (trimmed.length > 50) {
      return `data:image/jpeg;base64,${trimmed}`;
    }
    return trimmed;
  };

  return (
    <img
      src={getSafeSrc(src)}
      alt={alt}
      className={className}
      onError={() => {
        console.warn(`Failed to load avatar for ${alt}`);
        setError(true);
      }}
      referrerPolicy="no-referrer"
    />
  );
};

export const AdminView: React.FC<AdminViewProps> = ({ onRefreshData, responsiblesList }) => {
  // Authentication
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });
  const [authError, setAuthError] = useState('');

  // Allowed Admins list
  const [allowedAdmins, setAllowedAdmins] = useState<string[]>([]);
  const [newAllowedEmail, setNewAllowedEmail] = useState('');

  // Tab: 'dashboard' | 'letters' | 'responsibles' | 'allowedAdmins'
  const [adminTab, setAdminTab] = useState<'dashboard' | 'letters' | 'responsibles' | 'allowedAdmins'>('dashboard');

  // Stats & States retrieved from DB
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    completed: number;
    productSummary: { product: ProductType; count: number; revenue: number }[];
  }>({
    total: 0,
    pending: 0,
    completed: 0,
    productSummary: [],
  });
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);

  // Batch/Buffer system for new letters
  const [releasedLetterIds, setReleasedLetterIds] = useState<string[]>([]);
  const [bufferedLetters, setBufferedLetters] = useState<{ letter: Letter; addedAt: number }[]>([]);
  const [timeTick, setTimeTick] = useState(0);

  // Code Gen fields
  const [selectedGeneratorOption, setSelectedGeneratorOption] = useState<string>('Cartinha');
  const [justGeneratedCode, setJustGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Responsible fields
  const [newRespName, setNewRespName] = useState('');
  const [newRespWhatsApp, setNewRespWhatsApp] = useState('');
  const [newRespAvatarUrl, setNewRespAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 150;
          canvas.height = 150;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          // Center crop to a 150x150 square for perfect circular avatars
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;

          ctx.drawImage(img, sx, sy, size, size, 0, 0, 150, 150);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = (err) => {
          reject(err);
        };
      };
      reader.onerror = (err) => {
        reject(err);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    try {
      setIsUploading(true);
      const compressedBase64 = await resizeImage(file);
      setNewRespAvatarUrl(compressedBase64);
    } catch (err: any) {
      console.error("Erro ao converter e comprimir imagem:", err);
      alert("Houve um problema ao carregar a imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };
  
  // Custom alerts or confirm dialogs
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [letterToComplete, setLetterToComplete] = useState<string | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releasePassword, setReleasePassword] = useState('');
  const [releaseError, setReleaseError] = useState('');

  // Search & Filters for Letters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [letterStatusTab, setLetterStatusTab] = useState<'pending' | 'completed'>('pending');

  // Fetch initial data
  useEffect(() => {
    refreshAllData();
  }, [responsiblesList]);

  const refreshAllData = async () => {
    try {
      const [newStats, newCodes, newLetters, newAdmins] = await Promise.all([
        getStats(),
        getAccessCodes(),
        getLetters(),
        getAllowedAdmins()
      ]);
      if (newStats) setStats(newStats);
      if (newCodes) setCodes(newCodes);
      if (newLetters) setLetters(newLetters);
      if (newAdmins) setAllowedAdmins(newAdmins);
      onRefreshData(); // Propagate to home view
    } catch (err) {
      console.error("Error refreshing data: ", err);
    }
  };

  // Synchronize new letters with the batch/buffer logic
  useEffect(() => {
    if (letters.length === 0) return;

    // 1. Load released IDs
    const savedReleased = localStorage.getItem('correio_released_ids');
    let currentReleased = savedReleased ? JSON.parse(savedReleased) as string[] : null;

    // 2. Load buffered letters
    const savedBuffered = localStorage.getItem('correio_buffered_letters');
    let currentBuffered = savedBuffered ? JSON.parse(savedBuffered) as { letter: Letter; addedAt: number }[] : [];

    // 3. First time opening the admin view?
    if (currentReleased === null) {
      // Treat all currently existing documents as pre-existing and release them immediately
      const allIds = letters.map(l => l.id);
      localStorage.setItem('correio_released_ids', JSON.stringify(allIds));
      setReleasedLetterIds(allIds);
      setBufferedLetters([]);
      localStorage.setItem('correio_buffered_letters', JSON.stringify([]));
      return;
    }

    // 4. Find new arrivals that are not released and not buffered
    const newArrivals = letters.filter(letter => 
      !currentReleased!.includes(letter.id) && 
      !currentBuffered.some(b => b.letter.id === letter.id)
    );

    let updatedBuffered = [...currentBuffered];
    if (newArrivals.length > 0) {
      newArrivals.forEach(letter => {
        updatedBuffered.push({
          letter,
          addedAt: Date.now()
        });
      });
      localStorage.setItem('correio_buffered_letters', JSON.stringify(updatedBuffered));
    }

    // 5. Evaluate Release Conditions
    let finalReleased = [...currentReleased!];
    let finalBuffered = [...updatedBuffered];

    const oldestAddedAt = finalBuffered.length > 0 ? finalBuffered[0].addedAt : null;
    const isBufferFull = finalBuffered.length >= 4;
    const isTimeReached = oldestAddedAt ? (Date.now() - oldestAddedAt >= 20 * 60 * 1000) : false;

    if (isBufferFull || isTimeReached) {
      const idsToRelease = finalBuffered.map(b => b.letter.id);
      finalReleased = [...finalReleased, ...idsToRelease];
      finalBuffered = [];
      
      localStorage.setItem('correio_released_ids', JSON.stringify(finalReleased));
      localStorage.setItem('correio_buffered_letters', JSON.stringify([]));
    }

    setReleasedLetterIds(finalReleased);
    setBufferedLetters(finalBuffered);
  }, [letters]);

  // Periodic ticking for countdown and background release checks
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check 20-minute limit dynamically every tick
  useEffect(() => {
    if (bufferedLetters.length === 0) return;
    const oldest = bufferedLetters[0];
    const elapsed = Date.now() - oldest.addedAt;
    if (elapsed >= 20 * 60 * 1000) {
      const idsToRelease = bufferedLetters.map(b => b.letter.id);
      const savedReleased = localStorage.getItem('correio_released_ids');
      const currentReleased = savedReleased ? JSON.parse(savedReleased) as string[] : [];
      const finalReleased = [...currentReleased, ...idsToRelease];
      
      localStorage.setItem('correio_released_ids', JSON.stringify(finalReleased));
      localStorage.setItem('correio_buffered_letters', JSON.stringify([]));
      
      setReleasedLetterIds(finalReleased);
      setBufferedLetters([]);
    }
  }, [bufferedLetters, timeTick]);

  const handleForceRelease = () => {
    setShowReleaseModal(true);
    setReleasePassword('');
    setReleaseError('');
  };

  const handleConfirmRelease = () => {
    if (releasePassword.trim() !== '4002') {
      setReleaseError('Senha incorreta! Tente novamente.');
      return;
    }

    if (bufferedLetters.length > 0) {
      const idsToRelease = bufferedLetters.map(b => b.letter.id);
      const savedReleased = localStorage.getItem('correio_released_ids');
      const currentReleased = savedReleased ? JSON.parse(savedReleased) as string[] : [];
      const finalReleased = [...currentReleased, ...idsToRelease];
      
      localStorage.setItem('correio_released_ids', JSON.stringify(finalReleased));
      localStorage.setItem('correio_buffered_letters', JSON.stringify([]));
      
      setReleasedLetterIds(finalReleased);
      setBufferedLetters([]);
    }

    setShowReleaseModal(false);
    setReleasePassword('');
    setReleaseError('');
  };

  const getFormattedTimeRemaining = () => {
    if (bufferedLetters.length === 0) return '00:00';
    const firstAdded = bufferedLetters[0].addedAt;
    const elapsed = Date.now() - firstAdded;
    const remaining = Math.max(0, 20 * 60 * 1000 - elapsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    const emailLower = adminEmail.toLowerCase().trim();
    if (!emailLower) {
      setAuthError('Por favor, digite o e-mail do administrador.');
      return;
    }
    
    if (password.trim() !== 'arraial2026') {
      setAuthError('Acesso negado: Senha incorreta!');
      return;
    }

    try {
      const isAllowed = await checkIsAllowedAdmin(emailLower);
      if (isAllowed) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_email', emailLower);
      } else {
        setAuthError('Acesso negado: e-mail não autorizado');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Erro ao validar e-mail no banco de dados.');
    }
  };

  // Generate a code
  const handleGenerateCode = async () => {
    let productType: ProductType = 'Cartinha';
    let price: number | undefined = undefined;
    let truffleCount: number | undefined = undefined;

    if (selectedGeneratorOption === 'bouquet_pequeno') {
      productType = 'Cartinha + Buquê de Trufas';
      price = 12;
      truffleCount = 5;
    } else if (selectedGeneratorOption === 'bouquet_medio') {
      productType = 'Cartinha + Buquê de Trufas';
      price = 20;
      truffleCount = 10;
    } else if (selectedGeneratorOption === 'bouquet_grande') {
      productType = 'Cartinha + Buquê de Trufas';
      price = 32;
      truffleCount = 15;
    } else {
      productType = selectedGeneratorOption as ProductType;
      const prodConfig = PRODUCTS.find(p => p.type === productType);
      if (prodConfig) {
        price = prodConfig.price;
        if (productType === 'Cartinha + Trufa' || productType === 'Cartinha + Trufa + Rosa') {
          truffleCount = 1;
        }
      }
    }
    
    const code = await generateCode(productType, price, truffleCount);
    setJustGeneratedCode(code);
    await refreshAllData();
  };

  // Copy with clipboard
  const handleCopyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(codeStr);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Set letter to complete (confirm dialog first)
  const triggerCompleteConfirmation = (id: string) => {
    setLetterToComplete(id);
    setShowConfirmModal(true);
  };

  const confirmCompleteLetter = async () => {
    if (letterToComplete) {
      await updateLetterStatus(letterToComplete, 'completed');
      setShowConfirmModal(false);
      setLetterToComplete(null);
      await refreshAllData();
    }
  };

  const handleUndoComplete = async (id: string) => {
    await updateLetterStatus(id, 'pending');
    await refreshAllData();
  };

  // Creat a responsible
  const handleAddResp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRespName.trim()) return;
    if (!newRespWhatsApp.trim()) return;

    await addResponsible(newRespName, newRespWhatsApp, newRespAvatarUrl);
    setNewRespName('');
    setNewRespWhatsApp('');
    setNewRespAvatarUrl('');
    await refreshAllData();
  };

  // Delete a responsible
  const handleDeleteResp = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este responsável? Ele não aparecerá mais para os alunos.')) {
      await deleteResponsible(id);
      await refreshAllData();
    }
  };

  // Filter letters dynamically
  const filteredLetters = letters.filter(letter => {
    // Only display letters that have been released in the current system context
    const isReleased = releasedLetterIds.includes(letter.id);
    if (!isReleased) return false;

    const matchesSearch = letter.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          letter.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter ? letter.recipientClass.toLowerCase().includes(classFilter.toLowerCase()) : true;
    const matchesProduct = productFilter ? letter.product === productFilter : true;
    const matchesStatus = letter.status === letterStatusTab;

    return matchesSearch && matchesClass && matchesProduct && matchesStatus;
  });

  // Unique Classes list for dropdown filtering assistance
  const uniqueRecipientClasses = Array.from(new Set(letters.map(l => l.recipientClass))).filter(Boolean);

  // Authentication Lock Page
  if (!isAuthenticated) {
    return (
      <div className="py-12 px-4 sm:px-6 max-w-md mx-auto" id="admin-login-screen">
        <div className="bg-[#1f0306] rounded-3xl border border-[#FDF2F2]/10 shadow-2xl overflow-hidden text-[#FDF2F2]">
          <div className="bg-gradient-to-r from-[#2d040a] to-[#1f0306] p-6 text-center border-b border-[#FDF2F2]/10">
            <div className="mx-auto h-12 w-12 bg-[#E53E3E]/10 border border-[#E53E3E]/30 rounded-full flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-[#E53E3E]" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold italic">Acesso Administrativo</h2>
            <p className="text-xs text-[#FDF2F2]/60 mt-1">Insira a credencial do projeto Correio Elegante</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-4 bg-gradient-to-tr from-[#1f0306] to-[#2d040a]/40">
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">E-mail do Administrador *</label>
              <input
                id="admin-email-input"
                type="email"
                placeholder="Ex: seu-email@escola.com.br"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-[#FDF2F2]/10 focus:border-[#E53E3E] focus:ring-0 text-sm text-white bg-[#1f0306] outline-none font-sans"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">Senha do Administrador *</label>
              <input
                id="admin-password-input"
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-[#FDF2F2]/10 focus:border-[#E53E3E] focus:ring-0 text-sm text-white bg-[#1f0306] outline-none"
                required
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-200 bg-rose-950/40 p-3 rounded-lg border border-[#E53E3E]/20 flex items-start gap-1">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#E53E3E]" />
                <span>{authError}</span>
              </p>
            )}

            <button
              id="btn-admin-login-submit"
              type="submit"
              className="w-full py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider bg-[#E53E3E] hover:bg-[#9B1C31] active:scale-98 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogIn className="h-4 w-4" />
              <span>Entrar no Painel</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate stats values
  const totalRevenue = stats.productSummary.reduce((acc, curr) => acc + curr.revenue, 0);

  const getGeneratorOptionLabel = (option: string) => {
    switch (option) {
      case 'bouquet_pequeno': return 'Buquê Pequeno (R$ 12)';
      case 'bouquet_medio': return 'Buquê Médio (R$ 20)';
      case 'bouquet_grande': return 'Buquê Grande (R$ 32)';
      default: return option;
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 text-[#FDF2F2]" id="admin-dashboard-container">
      
      {/* Admin Nav Toolbar Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#1f0306]/85 border border-[#FDF2F2]/10 shadow-2xl">
        <div className="flex items-center justify-between gap-4 w-full md:w-auto">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#E53E3E] bg-[#E53E3E]/15 px-2.5 py-1 rounded-full border border-[#E53E3E]/20 tracking-wider">Painel Geral</span>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold italic text-[#FDF2F2] mt-1.5 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#E53E3E]" /> Arraial Correio Elegante Admins
            </h2>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('admin_authenticated');
              localStorage.removeItem('admin_email');
              setIsAuthenticated(false);
            }}
            className="px-3 py-1.5 rounded-lg border border-[#E53E3E]/30 bg-[#2d040a] hover:bg-rose-950/40 text-xs text-[#FDF2F2]/90 font-bold transition-all cursor-pointer flex items-center gap-1.5 h-10 shrink-0"
            title="Sair do Painel"
          >
            <span>Sair</span>
          </button>
        </div>

        {/* Tab links */}
        <div className="flex bg-[#2d040a]/40 p-1 rounded-xl border border-[#FDF2F2]/10 w-full md:w-auto">
          <button
            onClick={() => setAdminTab('dashboard')}
            className={`flex-1 md:flex-none px-2 sm:px-4 py-2.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${adminTab === 'dashboard' ? 'bg-[#E53E3E] text-white shadow-md' : 'text-[#FDF2F2]/70 hover:bg-[#2d040a]/60 hover:text-white'}`}
            style={{ minHeight: '44px' }}
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Painel & Códigos</span>
            <span className="inline sm:hidden">Painel</span>
          </button>
          
          <button
            id="tab-btn-letters"
            onClick={() => setAdminTab('letters')}
            className={`flex-1 md:flex-none px-2 sm:px-4 py-2.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${adminTab === 'letters' ? 'bg-[#E53E3E] text-white shadow-md' : 'text-[#FDF2F2]/70 hover:bg-[#2d040a]/60 hover:text-white'}`}
            style={{ minHeight: '44px' }}
          >
            <MailOpen className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Cartas Recebidas</span>
            <span className="inline sm:hidden">Cartas</span>
            {stats.pending > 0 && (
              <span className="bg-[#E53E3E] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce shrink-0">
                {stats.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminTab('responsibles')}
            className={`flex-1 md:flex-none px-2 sm:px-4 py-2.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${adminTab === 'responsibles' ? 'bg-[#E53E3E] text-white shadow-md' : 'text-[#FDF2F2]/70 hover:bg-[#2d040a]/60 hover:text-white'}`}
            style={{ minHeight: '44px' }}
          >
            <Users2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Responsáveis</span>
            <span className="inline sm:hidden">Equipe</span>
          </button>

          <button
            id="tab-btn-allowed-admins"
            onClick={() => setAdminTab('allowedAdmins')}
            className={`flex-1 md:flex-none px-2 sm:px-4 py-2.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${adminTab === 'allowedAdmins' ? 'bg-[#E53E3E] text-white shadow-md' : 'text-[#FDF2F2]/70 hover:bg-[#2d040a]/60 hover:text-white'}`}
            style={{ minHeight: '44px' }}
          >
            <Lock className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Gerenciar Administradores</span>
            <span className="inline sm:hidden">Admins</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: DASHBOARD & CODES ================= */}
      {adminTab === 'dashboard' && (
        <div className="space-y-6" id="dashboard-tab-subview">
          
          {/* Main stats counters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-5 shadow-2xl flex items-center gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-orange-950/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-lg sm:text-xl font-bold">📝</div>
              <div>
                <span className="block text-[10px] text-[#FDF2F2]/40 font-semibold uppercase tracking-wider">Total Recebidas</span>
                <span className="font-serif text-lg sm:text-2xl font-bold text-[#FDF2F2]">{stats.total}</span>
              </div>
            </div>

            <div className="bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-5 shadow-2xl flex items-center gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#E53E3E]/10 border border-[#E53E3E]/30 text-[#E53E3E] flex items-center justify-center text-lg sm:text-xl font-bold">⏳</div>
              <div>
                <span className="block text-[10px] text-[#FDF2F2]/40 font-semibold uppercase tracking-wider">Pendente</span>
                <span className="font-serif text-lg sm:text-2xl font-bold text-[#E53E3E]">{stats.pending}</span>
              </div>
            </div>

            <div className="bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-5 shadow-2xl flex items-center gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg sm:text-xl font-bold">✅</div>
              <div>
                <span className="block text-[10px] text-[#FDF2F2]/40 font-semibold uppercase tracking-wider">Entregues</span>
                <span className="font-serif text-lg sm:text-2xl font-bold text-emerald-400">{stats.completed}</span>
              </div>
            </div>

            <div className="bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-5 shadow-2xl flex items-center gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-950/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-lg sm:text-xl font-bold">💰</div>
              <div>
                <span className="block text-[10px] text-[#FDF2F2]/40 font-semibold uppercase tracking-wider">Balanço de Caixa</span>
                <span className="font-serif text-lg sm:text-xl font-bold text-amber-405">
                  {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sales table distribution */}
            <div className="lg:col-span-1 bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg italic text-[#FDF2F2] mb-4 flex items-center gap-2 border-b border-[#FDF2F2]/10 pb-2">
                  <TrendingUp className="h-4 w-4 text-[#E53E3E]" /> Arrecadação por Combo
                </h3>
                
                <div className="space-y-4">
                  {stats.productSummary.map(ps => {
                    const icon = PRODUCTS.find(p => p.type === ps.product)?.icon || '❤️';
                    return (
                      <div key={ps.product} className="flex justify-between items-center text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{icon}</span>
                          <span className="font-sans font-medium text-[#FDF2F2]/95 truncate max-w-[130px] sm:max-w-none">{ps.product}</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-[#FDF2F2]/90">{ps.count} vendidos</span>
                          <span className="text-[10px] text-[#FDF2F2]/50 font-mono">
                            {ps.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-[#FDF2F2]/10 text-[10px] tracking-wide text-[#FDF2F2]/45 italic">
                * As estatísticas contam códigos marcados como utilizados e mensagens criadas sem duplicidades.
              </div>
            </div>

            {/* Selected Bouquet Code Generator Panel */}
            <div className="lg:col-span-2 bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-6 shadow-2xl space-y-6" id="code-generator-section">
              <div>
                <h3 className="font-serif font-bold text-lg italic text-[#FDF2F2] mb-1 flex items-center gap-1.5">
                  <QrCode className="h-5 w-5 text-[#E53E3E]" /> Gerador de Código de Venda
                </h3>
                <p className="text-xs text-[#FDF2F2]/60 leading-relaxed">
                  Selecione o combo ou tipo de buquê vendido e gere o código correspondente para o comprador.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end bg-[#2d040a]/20 p-4 rounded-2xl border border-[#FDF2F2]/5">
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">Item vendido:</span>
                  <select
                    id="combo-select-generator"
                    value={selectedGeneratorOption}
                    onChange={(e) => setSelectedGeneratorOption(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#FDF2F2]/10 text-xs sm:text-sm text-white outline-none bg-[#1f0306]"
                  >
                    <option value="Cartinha" className="text-white bg-[#1f0306]">❤️ Cartinha - R$ 2,00</option>
                    <option value="Cartinha + Trufa" className="text-white bg-[#1f0306]">🍫 Cartinha + Trufa - R$ 3,00</option>
                    <option value="Cartinha + Rosa" className="text-white bg-[#1f0306]">🌹 Cartinha + Rosa - R$ 5,00</option>
                    <option value="Cartinha + Trufa + Rosa" className="text-white bg-[#1f0306]">🌹🍫 Cartinha + Trufa + Rosa - R$ 7,00</option>
                    <option value="bouquet_pequeno" className="text-white bg-[#1f0306]">💐 Buquê Pequeno (5 trufas) - R$ 12,00</option>
                    <option value="bouquet_medio" className="text-white bg-[#1f0306]">💐 Buquê Médio (10 trufas) - R$ 20,00</option>
                    <option value="bouquet_grande" className="text-white bg-[#1f0306]">💐 Buquê Grande (15 trufas) - R$ 32,00</option>
                  </select>
                </div>

                <button
                  id="btn-admin-generate-code"
                  onClick={handleGenerateCode}
                  className="px-5 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider bg-[#E53E3E] hover:bg-[#9B1C31] transition-all shadow-md cursor-pointer h-[42px]"
                >
                  Confirmar e Gerar Código 🔑
                </button>
              </div>

              {/* Just generated code card block */}
              {justGeneratedCode && (
                <div className="p-4 rounded-2xl bg-[#E53E3E]/10 border border-[#E53E3E]/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in text-[#FDF2F2]" id="copied-notification-block">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <span className="block text-[8px] font-bold text-[#E53E3E] uppercase tracking-widest leading-none">
                        Código Gerado: [{getGeneratorOptionLabel(selectedGeneratorOption)}]
                      </span>
                      <span className="font-mono font-black text-base sm:text-lg text-white tracking-wider font-extrabold">{justGeneratedCode}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCopyCode(justGeneratedCode)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    {copiedCode === justGeneratedCode ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Created Codes logs Scroll bar */}
              <div className="space-y-3 pt-2">
                <h4 className="font-sans font-bold text-xs text-[#FDF2F2]/80 uppercase tracking-wider">Códigos Gerados Recentemente ({codes.length})</h4>
                <div className="max-h-[220px] overflow-y-auto border border-[#FDF2F2]/10 rounded-xl divide-y divide-[#FDF2F2]/5 custom-scrollbar">
                  {codes.length === 0 ? (
                    <div className="text-center py-8 text-[#FDF2F2]/45 text-xs font-medium">Nenhum código gerado ainda.</div>
                  ) : (
                    codes.map(c => (
                      <div key={c.code} className="p-3 flex items-center justify-between text-xs hover:bg-[#2d040a]/30 transition-colors">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-[#FDF2F2] text-sm tracking-wide bg-[#2d040a] px-2.5 py-1 rounded border border-[#FDF2F2]/10">{c.code}</span>
                          <span className="block font-sans font-medium text-[#FDF2F2]/60 max-w-[153px] sm:max-w-none truncate">
                            {c.product === 'Cartinha + Buquê de Trufas'
                              ? c.price === 20 || c.truffleCount === 10
                                ? '💐 Buquê Médio (10 trufas) - R$ 20,00'
                                : c.price === 32 || c.truffleCount === 15
                                ? '💐 Buquê Grande (15 trufas) - R$ 32,00'
                                : '💐 Buquê Pequeno (5 trufas) - R$ 12,00'
                              : c.product}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${c.status === 'active' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' : 'bg-[#2d040a] text-[#FDF2F2]/40'}`}>
                            {c.status === 'active' ? 'Ativo (Livre)' : 'Utilizado'}
                          </span>
                          <button
                            onClick={() => handleCopyCode(c.code)}
                            className="p-1.5 text-[#FDF2F2]/40 hover:text-[#E53E3E] transition-colors hover:bg-[#FDF2F2]/5 rounded cursor-pointer"
                            title="Copiar Código"
                          >
                            {copiedCode === c.code ? <Check className="h-4 w-4 text-green-405 font-bold" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: LETTERS MANAGER PANEL ================= */}
      {adminTab === 'letters' && (
        <div className="bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-6 shadow-2xl space-y-6" id="letters-tab-subview text-[#FDF2F2]">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FDF2F2]/10 pb-4">
            <div>
              <h3 className="font-serif font-bold text-xl italic text-[#FDF2F2]">Controle de Cartinhas</h3>
              <p className="text-xs text-[#FDF2F2]/60 mt-0.5">Pesquise, filtre e marque cartinhas escritas ou impressas.</p>
            </div>

            {/* inbox switches pending/concluded */}
            <div className="flex bg-[#2d040a]/40 p-1.5 rounded-xl border border-[#FDF2F2]/10 items-center gap-2">
              {bufferedLetters.length > 0 && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
              <button
                id="tab-btn-pending-letters"
                onClick={() => setLetterStatusTab('pending')}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${letterStatusTab === 'pending' ? 'bg-[#E53E3E] text-white shadow-xs' : 'text-[#FDF2F2]/70 hover:bg-[#2d040a]/60 hover:text-white'}`}
              >
                📥 Pendentes ({letters.filter(l => l.status === 'pending' && releasedLetterIds.includes(l.id)).length})
              </button>
              
              <button
                onClick={() => setLetterStatusTab('completed')}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${letterStatusTab === 'completed' ? 'bg-[#E53E3E] text-white shadow-xs' : 'text-[#FDF2F2]/70 hover:bg-[#2d040a]/60 hover:text-white'}`}
              >
                📦 Concluídas ({letters.filter(l => l.status === 'completed' && releasedLetterIds.includes(l.id)).length})
              </button>
            </div>
          </div>

          {/* Fila de Espera (Buffer) Details Box */}
          {bufferedLetters.length > 0 && (
            <div className="bg-[#E53E3E]/10 border border-[#E53E3E]/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-pulse">⏳</span>
                <div>
                  <h4 className="text-sm font-bold text-rose-300">Fila de Espera Ativa ({bufferedLetters.length}/4)</h4>
                  <p className="text-xs text-[#FDF2F2]/70 mt-0.5 max-w-xl">
                    Novas cartas ficam retidas na fila. Elas aparecerão automaticamente juntas assim que o lote atingir 4 cartas ou após 20 minutos do primeiro recebimento.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-[#1f0306] px-3.5 py-1.5 rounded-lg border border-[#FDF2F2]/10 text-xs font-mono text-[#FDF2F2]/95" style={{ minWidth: '150px' }}>
                  ⏳ Autoliberação: <strong className="text-rose-450 font-bold">{getFormattedTimeRemaining()}</strong>
                </div>
                <button
                  onClick={handleForceRelease}
                  className="px-4 py-2 rounded-lg bg-[#E53E3E] hover:bg-[#c53030] text-white text-xs font-bold uppercase transition-all duration-200 shadow-sm whitespace-nowrap cursor-pointer flex items-center justify-center"
                  style={{ minHeight: '44px' }}
                >
                  🚀 Forçar Liberação do Lote
                </button>
              </div>
            </div>
          )}

          {/* Filters tools grids */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#2d040a]/20 p-4 rounded-xl border border-[#FDF2F2]/5">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#FDF2F2]/40">
                <Search className="h-4 w-4" />
              </span>
              <input
                id="search-letters-input"
                type="text"
                placeholder="Pesquisar por nome ou mensagem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#FDF2F2]/15 focus:border-[#E53E3E] bg-[#1f0306] text-xs text-white outline-none focus:ring-0 shadow-inner"
              />
            </div>

            {/* Class Filter dropdown selection */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#FDF2F2]/40">
                <Filter className="h-4 w-4" />
              </span>
              <select
                id="filter-class-dropdown"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#FDF2F2]/15 focus:border-[#E53E3E] bg-[#1f0306] text-xs text-[#FDF2F2] outline-none"
              >
                <option value="">Filtrar por Turma/Sala (Todas)</option>
                {uniqueRecipientClasses.map(cl => (
                  <option key={cl} value={cl}>{cl}</option>
                ))}
              </select>
            </div>

            {/* Product combo dropdown */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#FDF2F2]/40">
                <Filter className="h-4 w-4" />
              </span>
              <select
                id="filter-product-dropdown"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#FDF2F2]/15 focus:border-[#E53E3E] bg-[#1f0306] text-xs text-[#FDF2F2] outline-none"
              >
                <option value="">Filtrar por Combo (Todos)</option>
                {PRODUCTS.map(p => (
                  <option key={p.type} value={p.type}>{p.type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards display list of Letters */}
          {filteredLetters.length === 0 ? (
            <div className="text-center py-12 text-[#FDF2F2]/40 text-sm font-semibold">
              Nenhuma cartinha correspondente encontrada neste filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredLetters.map(letter => {
                  const icon = PRODUCTS.find(p => p.type === letter.product)?.icon || '❤️';
                  return (
                    <motion.div 
                      key={letter.id}
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -20 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                        mass: 0.8
                      }}
                      className="p-5 rounded-2xl bg-[#2d040a]/20 border border-[#FDF2F2]/10 hover:border-[#E53E3E]/20 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 border-b border-[#FDF2F2]/10 pb-2">
                          <div>
                            <span className="text-[10px] font-bold text-[#FDF2F2]/40 uppercase tracking-wider block">Destinatário:</span>
                            <h4 className="font-sans font-bold text-[#FDF2F2] hover:text-[#E53E3E] text-sm sm:text-base leading-none">{letter.recipient}</h4>
                            <span className="text-[10px] font-sans font-semibold text-[#FDF2F2]/80 bg-[#E53E3E]/10 px-1.5 py-0.5 rounded inline-block mt-2 border border-[#E53E3E]/20">
                              👤 {letter.recipientClass === 'EJA' && letter.ejaSpecification
                                ? `EJA (${letter.ejaSpecification})`
                                : letter.recipientClass === 'Professores/Funcionários' && letter.employeeRole
                                ? `Professores/Funcionários (${letter.employeeRole})`
                                : letter.recipientClass}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="inline-block text-[10px] uppercase tracking-wider font-bold font-mono bg-[#E53E3E]/15 text-[#E53E3E] px-2 py-1 rounded-lg border border-[#E53E3E]/30 shadow-3xs">
                              {icon} {letter.product === 'Cartinha + Buquê de Trufas'
                                ? letter.price === 20 || letter.truffleCount === 10
                                  ? 'Buquê Médio (10 trufas)'
                                  : letter.price === 32 || letter.truffleCount === 15
                                  ? 'Buquê Grande (15 trufas)'
                                  : 'Buquê Pequeno (5 trufas)'
                                : letter.product}
                            </span>
                          </div>
                        </div>

                        <div className="bg-[#1f0306]/60 border border-[#f3ecd9]/5 p-3.5 rounded-lg min-h-[70px]">
                          <p className={`text-xs sm:text-sm text-[#FDF2F2]/90 leading-relaxed whitespace-pre-wrap ${letter.writingType === 'handwritten' ? 'font-handwritten text-lg' : 'font-mono'}`}>
                            {letter.message}
                          </p>
                        </div>

                        <div className="flex justify-between items-center text-[10px] sm:text-xs text-[#FDF2F2]/50 pt-1">
                          <span>Assinado: <strong className="text-[#FDF2F2]/80 font-sans">{letter.signature}</strong></span>
                          <span className="bg-[#E53E3E]/10 text-[#E53E3E] px-1.5 py-0.5 rounded font-bold uppercase text-[9px] border border-[#E53E3E]/20">
                            {letter.writingType === 'handwritten' ? '✍️ Escrita' : '🖨️ Impressa'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#FDF2F2]/5 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[10px] text-[#FDF2F2]/30 font-medium font-mono shrink-0">Postada em: {new Date(letter.createdAt).toLocaleDateString('pt-BR')}</span>
                        
                        {letter.status === 'pending' ? (
                          <button
                            id={`btn-complete-letter-${letter.id}`}
                            onClick={() => triggerCompleteConfirmation(letter.id)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-1 cursor-pointer font-sans"
                            style={{ minHeight: '44px' }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span>Escrever Carta</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUndoComplete(letter.id)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-[#FDF2F2]/80 hover:bg-[#FDF2F2]/10 border border-[#FDF2F2]/10 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all text-center flex items-center justify-center gap-1 cursor-pointer font-sans"
                            style={{ minHeight: '44px' }}
                          >
                            <Undo2 className="h-3.5 w-3.5 shrink-0" />
                            <span>Desfazer</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* INLINE CONFIRMATION MODAL */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all" id="confirm-modal-box">
              <div className="bg-[#1f0306] rounded-2xl w-full max-w-sm p-6 overflow-hidden shadow-2xl border border-[#FDF2F2]/10 text-center space-y-4">
                <div className="h-12 w-12 bg-amber-950/20 border border-[#E53E3E]/30 text-[#E53E3E] rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h4 className="font-serif font-bold text-lg text-[#FDF2F2]/90">Confirmar Conclusão</h4>
                <p className="text-xs sm:text-sm text-[#FDF2F2]/60 leading-relaxed">
                  Tem certeza de que esta carta já foi escrita à mão ou impressa e está pronta para o cupido entregar?
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setLetterToComplete(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#FDF2F2]/80 bg-[#2d040a] hover:bg-[#2d040a]/80 transition-colors border border-[#FDF2F2]/10 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirm-complete-yes"
                    onClick={confirmCompleteLetter}
                    className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Sim, Escrita!
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASSWORD RELEASE MODAL */}
          {showReleaseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all" id="release-modal-box">
              <div className="bg-[#1f0306] rounded-2xl w-full max-w-sm p-6 overflow-hidden shadow-2xl border border-[#FDF2F2]/10 text-center space-y-4">
                <div className="h-12 w-12 bg-[#E53E3E]/10 border border-[#E53E3E]/35 text-[#E53E3E] rounded-full flex items-center justify-center mx-auto">
                  <Unlock className="h-6 w-6" />
                </div>
                <h4 className="font-serif font-bold text-lg text-[#FDF2F2]/90">Liberação de Lote</h4>
                <p className="text-xs sm:text-sm text-[#FDF2F2]/60 leading-relaxed">
                  Digite a senha de liberação para disponibilizar as cartas da fila imediatamente.
                </p>
                
                <div className="space-y-1 text-left">
                  <input
                    type="password"
                    placeholder="Senha de Liberação"
                    value={releasePassword}
                    onChange={(e) => {
                      setReleasePassword(e.target.value);
                      setReleaseError('');
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#FDF2F2]/10 text-center text-sm text-white outline-none bg-[#1f0306] tracking-widest font-mono placeholder:tracking-normal"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirmRelease();
                      }
                    }}
                  />
                  {releaseError && (
                    <p className="text-[10px] text-[#E53E3E] text-center font-bold tracking-wide animate-pulse mt-1">{releaseError}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowReleaseModal(false);
                      setReleasePassword('');
                      setReleaseError('');
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#FDF2F2]/80 bg-[#2d040a] hover:bg-[#2d040a]/80 transition-colors border border-[#FDF2F2]/10 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmRelease}
                    className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs bg-[#E53E3E] hover:bg-[#c53030] transition-colors cursor-pointer"
                  >
                    Liberar Lote
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= VIEW 3: RESPONSIVES MANAGEMENT CRM ================= */}
      {adminTab === 'responsibles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="responsibles-tab-subview">
          
          {/* Add responsible Form details */}
          <div className="bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-6 shadow-2xl h-fit space-y-4">
            <div>
              <h3 className="font-serif font-bold text-lg italic text-[#FDF2F2]">Novo Responsável</h3>
              <p className="text-xs text-[#FDF2F2]/50 mt-0.5">Cadastre um novo vendedor do correio elegante.</p>
            </div>

            <form onSubmit={handleAddResp} className="space-y-4">
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">Nome do Responsável *</label>
                <input
                  id="resp-add-name-input"
                  type="text"
                  placeholder="Ex: Pedro Henrique (Grêmio)"
                  value={newRespName}
                  onChange={(e) => setNewRespName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#FDF2F2]/10 focus:border-[#E53E3E] text-xs text-white bg-[#1f0306]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">Celular / WhatsApp *</label>
                <input
                  id="resp-add-whatsapp-input"
                  type="text"
                  placeholder="Ex: +5511999990000"
                  value={newRespWhatsApp}
                  onChange={(e) => setNewRespWhatsApp(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#FDF2F2]/10 focus:border-[#E53E3E] text-xs text-white bg-[#1f0306]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">Foto do Responsável (Opcional)</label>
                <input
                  ref={fileInputRef}
                  id="resp-add-avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {isUploading ? (
                  <div className="border border-[#FDF2F2]/10 p-4 rounded-xl flex flex-col items-center justify-center gap-2 bg-[#2d040a]/20 animate-pulse">
                    <div className="h-5 w-5 border-2 border-t-transparent border-[#E53E3E] rounded-full animate-spin"></div>
                    <span className="text-[10px] text-[#FDF2F2]/40 uppercase tracking-widest font-bold">Processando imagem...</span>
                  </div>
                ) : newRespAvatarUrl ? (
                  <div className="flex items-center gap-4 p-3 rounded-xl border border-[#FDF2F2]/10 bg-[#2d040a]/40 animate-fade-in">
                    <ResponsibleAvatar
                      src={newRespAvatarUrl}
                      alt="Prévia do Responsável"
                      className="h-16 w-16 rounded-full object-cover border-2 border-[#E53E3E] shadow-md shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#FDF2F2]/40">Foto Selecionada</p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewRespAvatarUrl('');
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-xs font-bold text-[#E53E3E] hover:text-[#9B1C31] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-[#FDF2F2]/10 hover:border-[#E53E3E]/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#2d040a]/25 hover:bg-[#2d040a]/40 transition-all text-center"
                  >
                    <div className="h-10 w-10 rounded-full bg-[#E53E3E]/10 flex items-center justify-center text-[#E53E3E]">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#FDF2F2]">Escolher Imagem</p>
                      <p className="text-[10px] text-[#FDF2F2]/40">Clique para selecionar foto local</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                id="btn-resp-add-submit"
                type="submit"
                className="w-full py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider bg-[#E53E3E] hover:bg-[#9B1C31] transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 font-sans"
              >
                <Plus className="h-4 w-4" />
                <span>Salvar Responsável</span>
              </button>
            </form>
          </div>

          {/* Current responsibles listing */}
          <div className="lg:col-span-2 bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in text-[#FDF2F2]">
            <div>
              <h3 className="font-serif font-bold text-lg italic text-[#FDF2F2]">Equipe de Vendas e Cobrança</h3>
              <p className="text-xs text-[#FDF2F2]/50 mt-0.5">Lembre-se: os alunos usarão estes contatos na homepage para pagar via Pix.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {responsiblesList.map(resp => (
                <div 
                  key={resp.id}
                  className="p-4 rounded-xl border border-[#FDF2F2]/5 bg-[#2d040a]/20 flex items-center justify-between hover:border-[#E53E3E]/20 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <ResponsibleAvatar 
                      src={resp.avatarUrl} 
                      alt={resp.name} 
                      className="h-10 w-10 rounded-full object-cover border border-[#E53E3E]/60 shadow-md" 
                    />
                    <div>
                      <h4 className="font-sans font-bold text-sm text-[#FDF2F2] leading-tight">{resp.name}</h4>
                      <p className="text-[10px] text-[#FDF2F2]/40 font-mono font-medium mt-0.5">{resp.whatsapp}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteResp(resp.id)}
                    className="p-2 rounded-xl hover:bg-[#E53E3E]/10 hover:text-[#E53E3E] text-[#FDF2F2]/30 transition-colors cursor-pointer"
                    title="Remover Atendente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ================= VIEW 4: ALLOWED ADMINS PANEL ================= */}
      {adminTab === 'allowedAdmins' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="allowed-admins-tab-subview">
          
          {/* Add Allowed Admin Form */}
          <div className="bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-6 shadow-2xl h-fit space-y-4">
            <div>
              <h3 className="font-serif font-bold text-lg italic text-[#FDF2F2]">Adicionar Administrador</h3>
              <p className="text-xs text-[#FDF2F2]/50 mt-0.5">Cadastre um e-mail para ter acesso administrativo autorizado.</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const email = newAllowedEmail.trim().toLowerCase();
              if (!email) return;
              await addAllowedAdmin(email);
              setNewAllowedEmail('');
              await refreshAllData();
            }} className="space-y-4">
              <div className="space-y-1.5 animate-fade-in animate-duration-300">
                <label className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">E-mail Permitido *</label>
                <input
                  id="admin-add-email-input"
                  type="email"
                  placeholder="Ex: brennomcpe10@gmail.com"
                  value={newAllowedEmail}
                  onChange={(e) => setNewAllowedEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#FDF2F2]/10 focus:border-[#E53E3E] text-xs text-white bg-[#1f0306] outline-none"
                  required
                />
              </div>

              <button
                id="btn-admin-add-submit"
                type="submit"
                className="w-full py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider bg-[#E53E3E] hover:bg-[#9B1C31] transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 font-sans"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar E-mail Permitido</span>
              </button>
            </form>
          </div>

          {/* Allowed Admins listing */}
          <div className="lg:col-span-2 bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in text-[#FDF2F2]">
            <div>
              <h3 className="font-serif font-bold text-lg italic text-[#FDF2F2]">Administradores Autorizados</h3>
              <p className="text-xs text-[#FDF2F2]/50 mt-0.5">Apenas estes e-mails associados à senha "arraial2026" podem se autenticar.</p>
            </div>

            <div className="space-y-2">
              {allowedAdmins.length === 0 ? (
                <p className="text-sm text-[#FDF2F2]/40 italic py-4">Nenhum e-mail cadastrado ainda.</p>
              ) : (
                allowedAdmins.map(email => (
                  <div 
                    key={email}
                    className="p-4 rounded-xl border border-[#FDF2F2]/5 bg-[#2d040a]/20 flex items-center justify-between hover:border-[#E53E3E]/20 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#E53E3E]/10 border border-[#E53E3E]/30 flex items-center justify-center text-xs font-mono font-bold text-[#E53E3E]">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-sm text-[#FDF2F2] leading-tight break-all">{email}</h4>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (confirm(`Remover autorização para ${email}?`)) {
                          await removeAllowedAdmin(email);
                          await refreshAllData();
                        }
                      }}
                      className="p-2 rounded-xl hover:bg-[#E53E3E]/10 hover:text-[#E53E3E] text-[#FDF2F2]/30 transition-colors cursor-pointer"
                      title="Remover Administrador"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
