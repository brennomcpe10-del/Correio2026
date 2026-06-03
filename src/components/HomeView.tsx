/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, HelpCircle, Phone, Info, Play, CheckCircle2, Award, ChevronDown } from 'lucide-react';
import { PRODUCTS, Responsible } from '../types';

interface HomeViewProps {
  onStartSend: () => void;
  responsibles: Responsible[];
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartSend, responsibles }) => {
  const [showFAQ, setShowFAQ] = useState(false);
  const [showResponsibles, setShowResponsibles] = useState(false);
  const [faqOpened, setFaqOpened] = useState<number | null>(null);

  // Stepper Tutorial Steps (1 to 7)
  const steps = [
    { title: 'Passo 1', desc: 'Entre em contato com um dos responsáveis.' },
    { title: 'Passo 2', desc: 'Realize o pagamento via PIX ou presencialmente.' },
    { title: 'Passo 3', desc: 'Receba seu código exclusivo.' },
    { title: 'Passo 4', desc: 'Clique em "Enviar Carta".' },
    { title: 'Passo 5', desc: 'Digite o código recebido.' },
    { title: 'Passo 6', desc: 'Preencha sua mensagem.' },
    { title: 'Passo 7', desc: 'Aguarde a entrega no dia do evento.' },
  ];

  const faqs = [
    {
      q: 'O serviço é realmente anônimo?',
      a: 'Sim, totalmente! O seu código de acesso serve única e exclusivamente para liberar o formulário de envio. Assim que a mensagem é gravada no sistema, o código é consumido e marcado como "utilizado", sem que haja qualquer vínculo armazenado entre a carta criada e o código digitado. Ninguém (nem mesmo o administrador) conseguirá saber quem enviou!'
    },
    {
      q: 'Como funciona a entrega das trufas e rosas?',
      a: 'No dia do Arraial da escola, nossa equipe de cobiçados "cupidos elegantes" percorrerá as salas de aula e dependências da escola realizando a entrega física das cartinhas personalizadas acompanhadas do chocolate ou da rosa selecionada.'
    },
    {
      q: 'Posso enviar para professores ou funcionários?',
      a: 'Claro que sim! O correio elegante é uma forma fantástica de demonstrar carinho, admiração ou amizade para qualquer pessoa do colégio, incluindo professores, diretores, merendeiras e amigos de outras turmas.'
    },
    {
      q: 'O que acontece se eu digitar o nome de alguém incorretamente?',
      a: 'Para facilitar a entrega, certifique-se de digitar o nome completo ou facilmente reconhecível e a respectiva Sala/Turma da pessoa. Em caso de dúvidas graves, nossos cupidos farão o possível para investigar e encontrar o destinatário!'
    },
    {
      q: 'Como realizo o pagamento via PIX?',
      a: 'Basta clicar no botão "Contatos dos Responsáveis" na página principal externa, falar diretamente com um de nossos atendentes credenciados no WhatsApp, e eles te fornecerão a chave PIX do projeto. Após enviar o comprovante, você receberá seu código de acesso em minutos!'
    }
  ];

  // Assistência de formatação de WhastApp link
  const getWhatsAppLink = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${name}! Gostaria de adquirir um código para o Correio Elegante do Arraial!`);
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const toggleFaq = (index: number) => {
    setFaqOpened(faqOpened === index ? null : index);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12" id="home-view-container">
      {/* Dynamic Festoon Banner (Sophisticated Dark) */}
      <div className="relative text-center p-8 sm:p-14 rounded-3xl bg-gradient-to-tr from-[#2d040a] via-[#1f0306] to-[#2d040a] border border-[#FDF2F2]/10 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
        {/* Floating background decorative vectors/glyphs */}
        <div className="absolute top-6 left-6 text-2xl opacity-15 select-none animate-pulse">❦</div>
        <div className="absolute top-10 right-10 text-3xl opacity-15 select-none animate-pulse delay-75">🌹</div>
        <div className="absolute bottom-10 left-12 text-3xl opacity-15 select-none animate-pulse delay-150">❦</div>
        <div className="absolute bottom-8 right-8 text-2xl opacity-15 select-none animate-pulse delay-200">🌹</div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E53E3E]/10 border border-[#E53E3E]/30 text-[#E53E3E] text-xs font-semibold uppercase tracking-widest mb-2 animate-pulse">
            <Heart className="h-3 w-3 fill-[#E53E3E] text-[#E53E3E]" /> Especial de Festa Junina
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl italic font-semibold text-[#FDF2F2] tracking-wide">
            Correio Elegante <span className="text-[#E53E3E] not-italic">do Arraial</span>
          </h1>
          <p className="font-sans text-xs sm:text-base text-[#FDF2F2]/70 max-w-lg mx-auto">
            O mistério do anonimato aliado à doçura do Arraial. Escolha seu presente e aqueça os corações mais cobiçados do colégio. 💖
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <button
              id="home-btn-send"
              onClick={onStartSend}
              className="px-8 py-4 rounded-xl text-white font-bold text-sm bg-[#E53E3E] hover:bg-[#9B1C31] active:scale-95 shadow-xl shadow-[#E53E3E]/10 transition-all cursor-pointer flex items-center justify-center gap-2 group tracking-wider uppercase"
            >
              <Heart className="h-4 w-4 fill-white text-white group-hover:scale-125 transition-transform" />
              <span>Enviar Carta Agora</span>
            </button>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowFAQ(true)}
                className="flex-1 sm:flex-none px-4 py-4 rounded-xl font-semibold text-xs uppercase tracking-wider text-[#FDF2F2] bg-[#FDF2F2]/5 hover:bg-[#FDF2F2]/10 border border-[#FDF2F2]/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="h-4 w-4 text-[#E53E3E]" />
                <span>Dúvidas</span>
              </button>
              <button
                onClick={() => setShowResponsibles(true)}
                className="flex-1 sm:flex-none px-4 py-4 rounded-xl font-semibold text-xs uppercase tracking-wider text-[#FDF2F2] bg-[#9B1C31] hover:bg-[#E53E3E] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#9B1C31]/10"
              >
                <Phone className="h-4 w-4" />
                <span>Responsáveis</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Preços e Vídeo (Sophisticated Dark) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Tabela de Preços */}
        <div className="md:col-span-3 bg-[#1f0306]/85 border border-[#FDF2F2]/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden" id="price-table-section">
          {/* Heart watermark */}
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none select-none text-[150px] text-[#E53E3E]">❤️</div>

          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-[#FDF2F2]/10">
            <Award className="h-5 w-5 text-[#E53E3E]" />
            <h2 className="font-serif text-xl sm:text-2xl italic text-[#FDF2F2]">Preços & Combos Especiais</h2>
          </div>

          <div className="space-y-3">
            {PRODUCTS.map((prod) => (
              <div 
                key={prod.type}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#FDF2F2]/5 bg-[#2d040a]/40 hover:bg-[#2d040a]/80 hover:border-[#E53E3E]/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{prod.icon}</span>
                  <span className="font-sans font-medium text-sm sm:text-base text-[#FDF2F2]/90">
                    {prod.type}
                  </span>
                </div>
                <div className="font-serif font-bold text-sm sm:text-base text-[#E53E3E] bg-[#1f0306] py-1.5 px-3 rounded-lg border border-[#E53E3E]/20">
                  {prod.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Tutorial Placeholder */}
        <div className="md:col-span-2 bg-[#1f0306]/85 border border-[#FDF2F2]/10 text-[#FDF2F2] rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,62,62,0.1),transparent_60%)]"></div>
          
          <div className="relative z-10 space-y-2">
            <h3 className="font-serif text-lg italic text-[#FDF2F2] flex items-center gap-2">
              <span>📺</span> Tutorial do Cupido
            </h3>
            <p className="text-xs text-[#FDF2F2]/60 leading-relaxed">
              Assista no vídeo explicativo quais são as melhores cantadas, as regras do arraial e como fazer um pedido romântico perfeito!
            </p>
          </div>

          {/* Interactive Play Video Board */}
          <div className="relative w-full aspect-video rounded-xl bg-black/60 border border-[#FDF2F2]/10 overflow-hidden flex flex-col items-center justify-center group my-4 shadow-inner">
            <div className="absolute inset-0 bg-cover bg-center brightness-40 contrast-125 filter blur-[1px] transition-all group-hover:scale-105" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=300')` }}></div>
            
            {/* Sealed wax cover icon overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-2 cursor-pointer">
              <div className="h-14 w-14 rounded-full bg-[#E53E3E] hover:bg-[#9B1C31] text-white flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-all outline-2 outline-offset-4 outline-[#E53E3E]/30">
                <Play className="h-5 w-5 fill-white ml-0.5 transition-transform" />
              </div>
              <span className="text-[9px] font-sans uppercase font-bold tracking-widest text-[#FDF2F2]/80 select-none bg-black/60 px-2.5 py-1 rounded-full">
                Play Tutorial
              </span>
            </div>
            
            <div className="absolute bottom-2 right-2 text-[8px] text-[#FDF2F2]/40 bg-black/50 px-1.5 py-0.5 rounded leading-none">
              Vídeo Demonstrativo
            </div>
          </div>

          <div className="text-[10px] text-[#FDF2F2]/40 border-t border-[#FDF2F2]/10 pt-3 flex items-center gap-1 text-center justify-center">
            <Info className="h-3 w-3 inline text-[#E53E3E]" />
            <span>Futuramente seu organizador poderá vincular uma gravação real aqui!</span>
          </div>
        </div>
      </div>

      {/* Stepper Tutorial Process */}
      <div className="rounded-2xl border border-[#FDF2F2]/10 bg-[#1f0306]/85 shadow-2xl p-6 sm:p-8" id="stepper-section">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-8 animate-fade-in">
          <h2 className="font-serif text-2xl sm:text-3xl italic text-[#FDF2F2]">Como enviar o seu correio?</h2>
          <p className="text-xs text-[#FDF2F2]/60">
            Siga esses passos fáceis para enviar um bilhete secreto regado a sentimentos.
          </p>
        </div>

        {/* Diagonal Line-by-Line Stepper Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((st, sIdx) => (
            <div 
              key={st.title}
              className="relative p-5 rounded-2xl bg-[#2d040a]/20 border border-[#FDF2F2]/5 hover:bg-[#2d040a]/50 hover:border-[#E53E3E]/20 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-widest text-[#FDF2F2] bg-[#E53E3E]/20 py-1 px-2.5 rounded-full border border-[#E53E3E]/20">
                  {st.title}
                </span>
                <span className="text-xl text-[#E53E3E]">
                  {sIdx === 0 && '📲'}
                  {sIdx === 1 && '💸'}
                  {sIdx === 2 && '🔑'}
                  {sIdx === 3 && '💌'}
                  {sIdx === 4 && '🔒'}
                  {sIdx === 5 && '✍️'}
                  {sIdx === 6 && '🚚'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#FDF2F2]/80 leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ MODAL */}
      {showFAQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all" id="faq-modal">
          <div className="bg-[#1f0306] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#FDF2F2]/10 max-h-[85vh] flex flex-col text-[#FDF2F2]">
            <div className="bg-gradient-to-r from-[#2d040a] to-[#1f0306] p-5 border-b border-[#FDF2F2]/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-[#E53E3E]" />
                <h3 className="font-serif italic font-bold text-lg sm:text-xl text-[#FDF2F2]">Dúvidas Frequentes (FAQ)</h3>
              </div>
              <button 
                onClick={() => setShowFAQ(false)}
                className="text-[#FDF2F2] bg-[#FDF2F2]/5 hover:bg-[#E53E3E] h-8 w-8 rounded-full flex items-center justify-center cursor-pointer text-sm font-semibold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              {faqs.map((faq, fIdx) => (
                <div key={fIdx} className="border-b border-[#FDF2F2]/5 pb-3">
                  <button 
                    onClick={() => toggleFaq(fIdx)}
                    className="w-full flex items-center justify-between text-left font-semibold text-sm sm:text-base text-[#FDF2F2]/90 hover:text-[#E53E3E] font-sans cursor-pointer focus:outline-none py-2 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-[#E53E3E] transition-transform duration-200 ${faqOpened === fIdx ? 'rotate-180' : ''}`} />
                  </button>
                  {faqOpened === fIdx && (
                    <p className="mt-2 text-xs sm:text-sm text-[#FDF2F2]/60 leading-relaxed pl-3 border-l-2 border-[#E53E3E]">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#2d040a]/40 border-t border-[#FDF2F2]/10 flex justify-end">
              <button
                onClick={() => setShowFAQ(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#E53E3E] hover:bg-[#9B1C31] transition-all cursor-pointer shadow-md"
              >
                Fechar Dúvidas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESPONSIBLES MODAL */}
      {showResponsibles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all" id="responsibles-modal">
          <div className="bg-[#1f0306] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#FDF2F2]/10 flex flex-col max-h-[85vh] text-[#FDF2F2]">
            <div className="bg-gradient-to-r from-[#2d040a] via-[#1f0306] to-[#2d040a] p-5 border-b border-[#FDF2F2]/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">❤️</span>
                <h3 className="font-serif italic font-bold text-lg sm:text-xl text-[#FDF2F2]">Fale com os Responsáveis</h3>
              </div>
              <button 
                onClick={() => setShowResponsibles(false)}
                className="text-[#FDF2F2] bg-[#FDF2F2]/5 hover:bg-[#E53E3E] h-8 w-8 rounded-full flex items-center justify-center cursor-pointer text-sm font-semibold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs sm:text-sm text-[#FDF2F2]/60 mb-2 leading-relaxed">
                Fale com um dos nossos responsáveis credenciados abaixo para enviar o comprovante de pagamento Pix, tirar suas dúvidas e receber seu código secreto de postagem!
              </p>

              {responsibles.length === 0 ? (
                <div className="text-center py-8 text-[#FDF2F2]/40 text-sm">
                  Nenhum responsável cadastrado no momento. Acesse o Painel Administrativo para cadastrar.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {responsibles.map((resp) => (
                    <div 
                      key={resp.id}
                      className="p-4 rounded-2xl bg-[#2d040a]/20 hover:bg-[#2d040a]/50 hover:border-[#E53E3E]/20 transition-all border border-[#FDF2F2]/5 flex items-center gap-3.5"
                    >
                      <img 
                        src={resp.avatarUrl} 
                        alt={resp.name}
                        className="h-12 w-12 rounded-full object-cover shadow-inner border-2 border-[#E53E3E]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-sans font-bold text-sm sm:text-base text-[#FDF2F2] leading-snug">{resp.name}</h4>
                        <p className="text-[10px] text-[#FDF2F2]/40 font-medium font-mono">{resp.whatsapp}</p>
                        
                        <a
                           href={getWhatsAppLink(resp.whatsapp, resp.name)}
                           target="_blank"
                           rel="noreferrer"
                           className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wide py-1 px-2.5 rounded-lg transition-colors gap-1 shadow-sm cursor-pointer"
                        >
                          <Phone className="h-3 w-3 fill-white" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-emerald-950/20 border-t border-emerald-900/30 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-medium font-sans flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Atendimento rápido e seguro!
              </span>
              <button
                onClick={() => setShowResponsibles(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#FDF2F2] bg-[#FDF2F2]/5 hover:bg-[#FDF2F2]/10 border border-[#FDF2F2]/10 transition-colors cursor-pointer"
              >
                Voltar ao Arraial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
