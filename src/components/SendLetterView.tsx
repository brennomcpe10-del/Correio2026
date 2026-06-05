/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Mail, ArrowRight, ArrowLeft, RefreshCw, Eye, Send, CheckCircle2, Heart, Sparkles, AlertCircle } from 'lucide-react';
import { validateCode, submitLetter } from '../lib/storage';
import { ProductType, PRODUCTS } from '../types';

interface SendLetterViewProps {
  onSuccessReturn: () => void;
}

export const SendLetterView: React.FC<SendLetterViewProps> = ({ onSuccessReturn }) => {
  // Steps: 'validate' | 'form' | 'preview' | 'success'
  const [step, setStep] = useState<'validate' | 'form' | 'preview' | 'success'>('validate');
  
  // Validation variables
  const [codeInputValue, setCodeInputValue] = useState('');
  const [validationError, setValidationError] = useState('');
  const [validatedCode, setValidatedCode] = useState('');
  const [validatedProduct, setValidatedProduct] = useState<ProductType>('Cartinha');

  // Form fields
  const [recipient, setRecipient] = useState('');
  const [recipientClass, setRecipientClass] = useState('');
  const [message, setMessage] = useState('');
  
  // Signature preset buttons
  const [sigPreset, setSigPreset] = useState<'Anônimo' | 'Seu admirador secreto' | '❤️' | 'Apenas iniciais' | 'Nome completo' | 'Personalizado'>('Anônimo');
  const [sigText, setSigText] = useState('');
  
  const [writingType, setWritingType] = useState<'handwritten' | 'printed'>('handwritten');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [senderName, setSenderName] = useState('');
  const [readAloud, setReadAloud] = useState<boolean>(false);
  
  const [formError, setFormError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle code validation
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    
    if (!codeInputValue.trim()) {
      setValidationError('Por favor, digite um código de acesso.');
      return;
    }

    setIsValidating(true);
    try {
      const matched = await validateCode(codeInputValue);
      if (!matched) {
        setValidationError('Ops! Este código não foi encontrado, é inválido ou já foi utilizado. Fale com um responsável se precisar de ajuda!');
        return;
      }

      // Success validate
      setValidatedCode(matched.code);
      setValidatedProduct(matched.product);
      setStep('form');
    } catch (err) {
      setValidationError('Erro de conexão ao acessar a base. Tente novamente.');
    } finally {
      setIsValidating(false);
    }
  };

  // Pre-calculate signature string to show in letter
  const getSignatureDisplay = () => {
    if (!isAnonymous && senderName.trim()) {
      return senderName.trim();
    }
    
    switch (sigPreset) {
      case 'Anônimo':
        return 'Anônimo';
      case 'Seu admirador secreto':
        return 'Seu admirador secreto 🌹';
      case '❤️':
        return 'Com amor, ❤️';
      case 'Apenas iniciais':
        return sigText ? `Iniciais: ${sigText}` : 'Iniciais';
      case 'Nome completo':
        return !isAnonymous ? (senderName || 'Nome Completo') : 'Nome Completo (Marque "Desativar Anonimato" para ver)';
      case 'Personalizado':
        return sigText ? sigText : 'Seu bilhete secreto';
      default:
        return 'Anônimo';
    }
  };

  // Form submit -> Transition to Preview
  const handleGoToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!recipient.trim()) {
      setFormError('Escolha o nome de quem receberá a carta.');
      return;
    }
    if (!recipientClass.trim()) {
      setFormError('Por favor digite qual é a turma/ano do destinatário.');
      return;
    }
    if (!message.trim()) {
      setFormError('Escreva uma linda mensagem para alegrar o dia de alguém!');
      return;
    }
    if (!isAnonymous && !senderName.trim()) {
      setFormError('Você desativou o anonimato. Por favor, escreva o seu nome.');
      return;
    }

    setStep('preview');
  };

  // Perform actual decoupled submission to guarantee anonymity!
  const handleFinalSubmit = async () => {
    const finalSignature = getSignatureDisplay();
    setIsSubmitting(true);
    
    try {
      const success = await submitLetter(
        recipient,
        recipientClass,
        message,
        finalSignature,
        writingType,
        isAnonymous,
        senderName,
        validatedProduct,
        validatedCode,
        readAloud
      );

      if (success) {
        setStep('success');
      } else {
        setValidationError('Infelizmente esse código já foi utilizado ou expirou. Tente novamente!');
        // Reset
        setStep('validate');
        setCodeInputValue('');
      }
    } catch (err) {
      setFormError('Ocorreu um erro de rede enviando sua cartinha. Ligue à rede e tente de novo!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeProductConfig = PRODUCTS.find(p => p.type === validatedProduct);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-[#FDF2F2]" id="send-letter-flow-container">
      
      {/* Decoupled Navigation Header for easy Back */}
      <div className="flex items-center justify-between mb-6">
        {step !== 'success' && (
          <button
            onClick={() => {
              if (step === 'form') {
                setStep('validate');
              } else if (step === 'preview') {
                setStep('form');
              } else {
                onSuccessReturn();
              }
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#FDF2F2]/80 hover:text-[#E53E3E] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
        )}
        <div className="text-right">
          <span className="text-[10px] font-sans font-bold tracking-widest text-[#E53E3E] uppercase bg-[#E53E3E]/10 px-3 py-1 rounded-full border border-[#E53E3E]/20">
            {step === 'validate' && 'Fase 1: Autorização'}
            {step === 'form' && 'Fase 2: Escrever'}
            {step === 'preview' && 'Fase 3: Selagem'}
            {step === 'success' && 'Fase 4: Enviado'}
          </span>
        </div>
      </div>

      {/* ================= STEP 1: VALIDATE CODE ================= */}
      {step === 'validate' && (
        <div className="bg-[#1f0306]/85 rounded-3xl border border-[#FDF2F2]/10 shadow-2xl p-6 sm:p-10 text-center space-y-6" id="code-validation-card">
          <div className="mx-auto h-16 w-16 bg-[#E53E3E]/10 rounded-full flex items-center justify-center border border-[#E53E3E]/30 shadow-sm animate-pulse">
            <KeyRound className="h-7 w-7 text-[#E53E3E]" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl italic text-[#FDF2F2]">Validação de Código do Arraial</h2>
            <p className="text-xs text-[#FDF2F2]/60 leading-relaxed">
              Digite abaixo o código exclusivo fornecido pelo responsável de vendas para liberar o seu formulário oficial de correio elegante.
            </p>
          </div>

          <form onSubmit={handleValidate} className="max-w-md mx-auto space-y-4">
            <div className="relative">
              <input
                id="code-input"
                type="text"
                placeholder="Exemplo: CE-X7A9-K2P4"
                value={codeInputValue}
                onChange={(e) => setCodeInputValue(e.target.value)}
                className="w-full text-center tracking-widest font-mono font-bold text-lg p-4 rounded-2xl border border-[#FDF2F2]/10 bg-[#2d040a]/40 text-white focus:border-[#E53E3E] focus:ring-0 placeholder:text-[#FDF2F2]/20 placeholder:font-sans uppercase outline-none shadow-inner transition-all"
              />
              <Sparkles className="absolute right-4 top-4.5 h-5 w-5 text-[#E53E3E]/60 animate-spin-slow pointer-events-none" />
            </div>

            {validationError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-[#E53E3E]/20 text-xs text-rose-200 flex items-start gap-2 text-left animate-fade-in" id="validation-error-alert">
                <AlertCircle className="h-5 w-5 shrink-0 text-[#E53E3E] mt-0.5" />
                <span className="leading-snug">{validationError}</span>
              </div>
            )}

            <button
              id="btn-validate-code"
              type="submit"
              disabled={isValidating}
              className="w-full py-4 rounded-xl text-white font-bold bg-[#E53E3E] hover:bg-[#9B1C31] active:scale-98 transition-all shadow-lg shadow-[#E53E3E]/10 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 tracking-wider uppercase text-xs"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Validando Código...</span>
                </>
              ) : (
                <>
                  <span>Validar Código Secreto</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#FDF2F2]/10 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-[#FDF2F2]/40">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Anonimato Absoluto Garantido
            </span>
            <span className="hidden sm:inline">•</span>
            <span>O código serve apenas como passe de autorização.</span>
          </div>


        </div>
      )}

      {/* ================= STEP 2: FORM SHEET ================= */}
      {step === 'form' && (
        <div className="bg-[#1f0306]/85 rounded-3xl border border-[#FDF2F2]/10 shadow-2xl overflow-hidden" id="letter-form-container">
          
          {/* Header indicating validated purchase info */}
          <div className="bg-gradient-to-r from-[#2d040a] to-[#1f0306] border-b border-[#FDF2F2]/10 p-5 sm:px-8 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#E53E3E]/10 border border-[#E53E3E]/20 flex items-center justify-center text-xl shadow-inner animate-pulse">
                {activeProductConfig?.icon || '💌'}
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#E53E3E] uppercase tracking-widest block">Código Liberado: <span className="font-mono text-white/95">{validatedCode}</span></span>
                <span className="font-sans font-bold text-sm sm:text-base text-[#FDF2F2]">{validatedProduct}</span>
              </div>
            </div>
            <div className="bg-[#E53E3E]/10 text-[#E53E3E] font-bold font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg border border-[#E53E3E]/20 flex items-center gap-1 self-start sm:self-auto">
              <ShieldCheck className="h-3.5 w-3.5" /> Decoupled/Anônimo Seguro
            </div>
          </div>

          <form onSubmit={handleGoToPreview} className="p-6 sm:p-8 space-y-6">
            
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-[#E53E3E]/20 text-xs text-rose-200 flex items-start gap-2" id="form-error-alert">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#E53E3E]" />
                <span>{formError}</span>
              </div>
            )}

            {/* Recipient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">NOME DO DESTINATÁRIO (Quem vai receber) *</label>
                <input
                  id="recipient-input"
                  type="text"
                  placeholder="EX: Júlia Maria"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[#FDF2F2]/10 focus:border-[#E53E3E] focus:ring-0 text-sm text-white bg-[#2d040a]/40 shadow-inner outline-none placeholder:text-[#FDF2F2]/25"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">TURMA/SALA *</label>
                <select
                  id="recipient-class-input"
                  value={recipientClass}
                  onChange={(e) => setRecipientClass(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[#FDF2F2]/10 focus:border-[#E53E3E] focus:ring-0 text-sm text-white bg-[#2d040a]/72 shadow-inner outline-none font-sans"
                  required
                >
                  <option value="" disabled className="text-gray-400 bg-[#1f0306]">Selecione a Turma/Sala</option>
                  <option value="1°A" className="text-white bg-[#1f0306]">1°A</option>
                  <option value="1°B" className="text-white bg-[#1f0306]">1°B</option>
                  <option value="2°A EPT" className="text-white bg-[#1f0306]">2°A EPT</option>
                  <option value="2°A" className="text-white bg-[#1f0306]">2°A</option>
                  <option value="2°B" className="text-white bg-[#1f0306]">2°B</option>
                  <option value="3°A" className="text-white bg-[#1f0306]">3°A</option>
                  <option value="3°B" className="text-white bg-[#1f0306]">3°B</option>
                  <option value="3°C" className="text-white bg-[#1f0306]">3°C</option>
                  <option value="3°D" className="text-white bg-[#1f0306]">3°D</option>
                </select>
              </div>
            </div>

            {/* Core Message area */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">Mensagem *</label>
              <textarea
                id="message-input"
                rows={4}
                maxLength={400}
                placeholder="Declare seu amor, amizade ou escreva uma cantada inesquecível de São João..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-[#FDF2F2]/10 focus:border-[#E53E3E] focus:ring-0 text-sm text-white bg-[#2d040a]/40 shadow-inner resize-none outline-none placeholder:text-[#FDF2F2]/25"
                required
              />
              <span className="block text-[10px] text-right text-[#FDF2F2]/40 font-mono">
                {message.length}/400 caracteres
              </span>
            </div>

            {/* Seções de Customização - Organizadas em blocos elegantes e espaçosos */}
            <div className="space-y-8 pt-4 border-t border-[#FDF2F2]/10" id="letter-customizations-stack">
              
              {/* Bloco 1: Anonimato */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#2d040a]/25 border border-[#FDF2F2]/10 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-[#FDF2F2]/10 pb-3">
                  <span className="text-sm font-bold text-[#E53E3E]">01.</span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#FDF2F2]">Deseja manter o anonimato?</h3>
                </div>
                <p className="text-xs text-[#FDF2F2]/50">
                  Escolha se deseja enviar este recado em segredo absoluto ou revelando o seu nome real de remetente.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#FDF2F2]/10 hover:bg-[#2d040a]/40 transition-all cursor-pointer text-xs font-bold text-[#FDF2F2]/90 flex-1">
                    <input
                      type="radio"
                      name="anonymity"
                      checked={isAnonymous === true}
                      onChange={() => {
                        setIsAnonymous(true);
                        setSigPreset('Anônimo');
                      }}
                      className="accent-[#E53E3E] h-4 w-4 shrink-0"
                    />
                    <span>Sim (Não quero identificar meu nome)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#FDF2F2]/10 hover:bg-[#2d040a]/40 transition-all cursor-pointer text-xs font-bold text-[#FDF2F2]/90 flex-1">
                    <input
                      type="radio"
                      name="anonymity"
                      checked={isAnonymous === false}
                      onChange={() => {
                        setIsAnonymous(false);
                        setSigPreset('Nome completo');
                      }}
                      className="accent-[#E53E3E] h-4 w-4 shrink-0"
                    />
                    <span>Não (Eu quero identificar meu nome no bilhete)</span>
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="space-y-2 pt-2 animate-fade-in max-w-md">
                    <label className="block text-xs font-bold text-[#E53E3E] uppercase tracking-wider">Identidade do Remetente *</label>
                    <input
                      id="sender-name-input"
                      type="text"
                      placeholder="Qual é o seu nome completo?"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#FDF2F2]/10 focus:border-[#E53E3E] text-xs text-white bg-[#1f0306] placeholder:text-[#FDF2F2]/20 outline-none"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Bloco 2: Tipo de Redação */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#2d040a]/25 border border-[#FDF2F2]/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#FDF2F2]/10 pb-3">
                  <span className="text-sm font-bold text-[#E53E3E]">02.</span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#FDF2F2]">Como deseja sua mensagem no papel?</h3>
                </div>
                <p className="text-xs text-[#FDF2F2]/50">
                  Os nossos cupidos vão preparar o papel físico baseado na sua preferência de escrita.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#FDF2F2]/10 hover:bg-[#2d040a]/40 transition-all cursor-pointer text-xs font-bold text-[#FDF2F2]/90 flex-1">
                    <input
                      type="radio"
                      name="writingType"
                      checked={writingType === 'handwritten'}
                      onChange={() => setWritingType('handwritten')}
                      className="accent-[#E53E3E] h-4 w-4 shrink-0"
                    />
                    <span>✍️ Escrita à Mão (Cursive Tradicional)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#FDF2F2]/10 hover:bg-[#2d040a]/40 transition-all cursor-pointer text-xs font-bold text-[#FDF2F2]/90 flex-1">
                    <input
                      type="radio"
                      name="writingType"
                      checked={writingType === 'printed'}
                      onChange={() => setWritingType('printed')}
                      className="accent-[#E53E3E] h-4 w-4 shrink-0"
                    />
                    <span>🖨️ Impressa (Tipografia Clássica)</span>
                  </label>
                </div>
              </div>

              {/* Bloco 3: Assinatura */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#2d040a]/25 border border-[#FDF2F2]/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#FDF2F2]/10 pb-3">
                  <span className="text-sm font-bold text-[#E53E3E]">03.</span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#FDF2F2]">Como prefere assinar no bilhete?</h3>
                </div>
                <p className="text-xs text-[#FDF2F2]/50">
                  Selecione o formato exato da assinatura que constará na mensagem impressa e entregue.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {isAnonymous ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setSigPreset('Anônimo')}
                        className={`p-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${sigPreset === 'Anônimo' ? 'bg-[#E53E3E] text-white border-[#E53E3E] shadow-md shadow-[#E53E3E]/15' : 'bg-[#1f0306]/70 hover:bg-[#2d040a]/60 text-[#FDF2F2]/80 border-[#FDF2F2]/10'}`}
                        style={{ minHeight: '44px' }}
                      >
                        Não especificar meu nome
                      </button>
                      <button
                        type="button"
                        onClick={() => setSigPreset('Seu admirador secreto')}
                        className={`p-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${sigPreset === 'Seu admirador secreto' ? 'bg-[#E53E3E] text-white border-[#E53E3E] shadow-md shadow-[#E53E3E]/15' : 'bg-[#1f0306]/70 hover:bg-[#2d040a]/60 text-[#FDF2F2]/80 border-[#FDF2F2]/10'}`}
                        style={{ minHeight: '44px' }}
                      >
                        Seu Admirador Secreto
                      </button>
                      <button
                        type="button"
                        onClick={() => setSigPreset('❤️')}
                        className={`p-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${sigPreset === '❤️' ? 'bg-[#E53E3E] text-white border-[#E53E3E] shadow-md shadow-[#E53E3E]/15' : 'bg-[#1f0306]/70 hover:bg-[#2d040a]/60 text-[#FDF2F2]/80 border-[#FDF2F2]/10'}`}
                        style={{ minHeight: '44px' }}
                      >
                        Com Amor, Coração (❤️)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSigPreset('Apenas iniciais');
                          setSigText('');
                        }}
                        className={`p-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${sigPreset === 'Apenas iniciais' ? 'bg-[#E53E3E] text-white border-[#E53E3E] shadow-md shadow-[#E53E3E]/15' : 'bg-[#1f0306]/70 hover:bg-[#2d040a]/60 text-[#FDF2F2]/80 border-[#FDF2F2]/10'}`}
                        style={{ minHeight: '44px' }}
                      >
                        Usar Apenas Iniciais
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSigPreset('Personalizado');
                          setSigText('');
                        }}
                        className={`p-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${sigPreset === 'Personalizado' ? 'bg-[#E53E3E] text-white border-[#E53E3E] shadow-md shadow-[#E53E3E]/15' : 'bg-[#1f0306]/70 hover:bg-[#2d040a]/60 text-[#FDF2F2]/80 border-[#FDF2F2]/10'}`}
                        style={{ minHeight: '44px' }}
                      >
                        Assinatura Personalizada
                      </button>
                    </>
                  ) : (
                    <div className="col-span-full p-4 rounded-xl text-xs font-bold bg-[#E53E3E]/10 text-[#E53E3E] border border-[#E53E3E]/20 text-center">
                      Assinando como Revelado: <span className="underline">{senderName || '(Preencha o campo de nome)'}</span> ✅
                    </div>
                  )}
                </div>

                {isAnonymous && (sigPreset === 'Apenas iniciais' || sigPreset === 'Personalizado') && (
                  <div className="pt-2 animate-fade-in max-w-sm">
                    <label className="block text-[11px] font-bold text-[#E53E3E] uppercase tracking-wider mb-1.5">
                      {sigPreset === 'Apenas iniciais' ? 'Digite suas Iniciais (Max 4 letras)' : 'Escreva sua assinatura'}
                    </label>
                    <input
                      type="text"
                      maxLength={sigPreset === 'Apenas iniciais' ? 4 : 50}
                      placeholder={sigPreset === 'Apenas iniciais' ? 'Ex: L.E.' : 'Ex: Seu eterno parceiro de quadrilha'}
                      value={sigText}
                      onChange={(e) => setSigText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#FDF2F2]/10 focus:border-[#E53E3E] text-xs text-white bg-[#1f0306] outline-none"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Pergunta sobre Leitura no Pátio */}
              <div className="pt-6 border-t border-[#FDF2F2]/10 space-y-3 animate-fade-in" id="read-aloud-section">
                <label className="block text-xs font-semibold tracking-wider text-[#FDF2F2]/80 uppercase">
                  Som d'Alta Voz (Pátio da Escola)
                </label>
                <div 
                  onClick={() => setReadAloud(prev => !prev)}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all select-none ${readAloud ? 'bg-[#E53E3E]/10 border-[#E53E3E]/40 shadow-sm' : 'bg-[#2d040a]/25 border-[#FDF2F2]/10 hover:border-[#E53E3E]/30'}`}
                >
                  <input
                    type="checkbox"
                    checked={readAloud}
                    onChange={(e) => {
                      e.stopPropagation();
                      setReadAloud(e.target.checked);
                    }}
                    className="mt-0.5 h-4.5 w-4.5 text-[#E53E3E] bg-[#1f0306] border-[#FDF2F2]/10 rounded focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#FDF2F2]">
                      Você quer que a sua mensagem seja lida lá na frente (no pátio)?
                    </p>
                    <p className="text-[10px] text-[#FDF2F2]/60 leading-relaxed">
                      Marque sim se preferir que seu destinatário seja chamado ao microfone do pátio para ouvir a cartinha! Caso contrário, a entrega será feita de forma totalmente discreta e privada pelos cupidos.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-[#FDF2F2]/10 flex justify-end w-full">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider bg-[#E53E3E] hover:bg-[#9B1C31] active:scale-95 transition-all shadow-lg hover:shadow-[#E53E3E]/10 cursor-pointer flex items-center justify-center gap-1.5 group font-sans"
                style={{ minHeight: '44px' }}
              >
                <span>Selo e Pré-visualizar Carta</span>
                <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= STEP 3: PREVIEW CARD ================= */}
      {step === 'preview' && (
        <div className="space-y-8" id="letter-preview-screen">
          <div className="text-center max-w-md mx-auto space-y-1">
            <h2 className="font-serif text-2xl italic font-bold text-[#FDF2F2]">Pré-visualização da Sua Cartinha</h2>
            <p className="text-xs text-[#FDF2F2]/60">
              Revise como o seu recado elegante ficará impresso ou transcrito pelos nossos cupidos dedicados!
            </p>
          </div>

          {/* Letter Realistic container paper card frame template */}
          <div className="bg-linear-to-b from-[#fbf8f0] to-[#f6f2e4] p-6 sm:p-10 rounded-2xl shadow-2xl border border-[#ecd5a9] relative overflow-hidden text-gray-800 space-y-8 select-none max-w-2xl mx-auto">
            {/* Heart seal emblem decorations inside document */}
            <div className="absolute top-4 right-4 text-3xl opacity-20">✍️</div>
            <div className="absolute bottom-4 left-4 text-4xl opacity-10">🌹</div>

            {/* Letter Header */}
            <div className="flex justify-between items-start border-b border-[#ebd29c] pb-4 font-serif text-xs italic text-[#be123c] font-semibold tracking-wide">
              <span>💌 Correio Elegante do CECB</span>
              <span className="font-sans font-bold not-italic bg-[#E53E3E]/10 text-[#E53E3E] py-0.5 px-2 rounded text-[9px] uppercase border border-[#E53E3E]/20">
                {writingType === 'handwritten' ? 'Cursive Escrita' : 'Impressa'}
              </span>
            </div>

            {/* Letter To / Class */}
            <div className="space-y-2">
              <div className="flex gap-1.5 items-end">
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-amber-950/70">Para:</span>
                <span className="font-serif text-base sm:text-lg font-bold text-[#2d040a] underline decoration-[#ebd29c] decoration-2 underline-offset-4 pl-1">
                  {recipient}
                </span>
              </div>
              <div className="flex gap-1.5 items-end">
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-amber-950/70 font-semibold">TURMA/SALA:</span>
                <span className="font-sans text-xs sm:text-sm font-semibold text-gray-700 pl-1">
                  {recipientClass}
                </span>
              </div>
            </div>

            {/* Letter Core Message (With font condition handwritten/printed) */}
            <div className="min-h-[120px] py-4">
              <p className={`text-base sm:text-xl text-gray-805 leading-relaxed whitespace-pre-wrap ${writingType === 'handwritten' ? 'font-handwritten text-2xl antialiased' : 'font-mono text-sm tracking-wide'}`}>
                {message}
              </p>
            </div>

            {/* Letter Signature */}
            <div className="flex flex-col items-end border-t border-[#ebd29c]/50 pt-4 space-y-1">
              <span className="font-sans text-[10px] uppercase font-semibold text-amber-950/50">Assinado:</span>
              <span className={`font-serif font-bold text-sm text-[#9b1c31] pl-2 pr-1 py-1 rounded-sm ${writingType === 'handwritten' ? 'font-handwritten text-2xl italic antialiased text-[#E53E3E]' : 'font-mono text-sm'}`}>
                {getSignatureDisplay()}
              </span>
            </div>

            {/* Custom Attached Gifts badge frame */}
            <div className="bg-[#f0ead8] p-3 rounded-xl border border-[#dec999] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-xl">{activeProductConfig?.icon || '❤️'}</span>
                <div>
                  <span className="block font-bold text-[#be123c] uppercase text-[9px]">Guloseima incluída</span>
                  <span className="font-sans font-semibold text-gray-700 text-xs">{validatedProduct}</span>
                </div>
              </div>
              <span className="text-[10px] text-green-800 font-bold bg-green-100 rounded-full py-1 px-2.5 border border-green-200">
                Pago via Pix / Dinheiro
              </span>
            </div>

            {/* Wax seal realistic visual stamp - Positioned elegantly in the top margin away from text content */}
            <div className="absolute right-6 top-16 hidden sm:flex flex-col items-center rotate-12 opacity-85 select-none pointer-events-none z-10">
              <div className="h-12 w-12 bg-[#E53E3E] rounded-full flex items-center justify-center text-white text-base font-bold shadow-md border border-[#9b1c31]/30 shadow-inner">
                ❤
              </div>
              <span className="text-[6.5px] font-mono text-rose-950 font-bold tracking-widest mt-0.5">SELO DO CUPIDO</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 w-full">
            <button
              onClick={() => setStep('form')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#FDF2F2]/10 text-[#FDF2F2] font-semibold text-xs uppercase bg-[#FDF2F2]/5 hover:bg-[#FDF2F2]/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              style={{ minHeight: '44px' }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Editar Carta</span>
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-55 font-sans"
              style={{ minHeight: '44px' }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Enviar Carta ao Cupido</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: SUCCESS ================= */}
      {step === 'success' && (
        <div className="bg-[#1f0306]/85 rounded-3xl border border-[#FDF2F2]/10 shadow-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6" id="send-success-card">
          <div className="mx-auto h-20 w-20 bg-emerald-900/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20 animate-bounce">
            <CheckCircle2 className="h-10 w-10 fill-emerald-950/20 mt-1" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl italic font-bold text-[#FDF2F2]">Carta Postada com Sucesso! 🎉</h2>
            <p className="text-sm text-[#FDF2F2]/90 leading-relaxed max-w-lg mx-auto">
              Sua mensagem foi guardada com sucesso na mochila do cupido! O código que você utilizou já foi validado e desativado para garantir o seu anonimato total. Agora é só esperar o Cupido fazer a mágica dele no dia do evento!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#2d040a]/30 border border-[#FDF2F2]/10 text-xs text-left leading-relaxed text-[#FDF2F2]/80 space-y-3 shadow-inner">
            <div className="font-bold text-[#E53E3E] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Selo de Anonimato Total Ativo</span>
            </div>
            <p>
              Sua mensagem foi salva no banco de dados de maneira completamente desacoplada. O código de acesso serve apenas para liberar o envio e foi permanentemente desativado, sem manter qualquer relação com a carta criada.
            </p>
          </div>

          <button
            onClick={() => {
              // Reset state variables
              setRecipient('');
              setRecipientClass('');
              setMessage('');
              setSenderName('');
              setIsAnonymous(true);
              setSigPreset('Anônimo');
              setCodeInputValue('');
              setStep('validate');
              onSuccessReturn();
            }}
            className="w-full py-4 rounded-xl text-white font-bold bg-[#E53E3E] hover:bg-[#9B1C31] transition-all cursor-pointer shadow-md text-xs uppercase tracking-wider"
          >
            Voltar para a Página Principal
          </button>
        </div>
      )}

    </div>
  );
};
