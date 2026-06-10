/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Responsible {
  id: string;
  name: string;
  whatsapp: string;
  avatarUrl: string; // preinstalled or URL
}

export type ProductType = 
  | 'Cartinha'
  | 'Cartinha + Trufa'
  | 'Cartinha + Rosa'
  | 'Cartinha + Trufa + Rosa'
  | 'Cartinha + Buquê de Trufas'
  | 'Cartinha + 1 Bis'
  | 'Cartinha + Flor'
  | 'Cartinha + Flor + 2 Bis'
  | 'Buquê Pequeno (10 Bis)'
  | 'Buquê Médio (15 Bis)'
  | 'Buquê Grande (20 Bis)';

export const PRODUCTS: { type: ProductType; price: number; icon: string }[] = [
  { type: 'Cartinha', price: 2.00, icon: '❤️' },
  { type: 'Cartinha + 1 Bis', price: 3.00, icon: '🍫' },
  { type: 'Cartinha + Flor', price: 5.00, icon: '🌹' },
  { type: 'Cartinha + Flor + 2 Bis', price: 7.00, icon: '🌹🍫' },
  { type: 'Buquê Pequeno (10 Bis)', price: 12.00, icon: '💐' },
  { type: 'Buquê Médio (15 Bis)', price: 17.00, icon: '💐' },
  { type: 'Buquê Grande (20 Bis)', price: 22.00, icon: '💐' },
];

export interface AccessCode {
  code: string; // CE-XXXX-YYYY
  product: ProductType;
  createdAt: string;
  status: 'active' | 'used';
  price?: number; // Preço do buquê (ex: 12, 20, 32) ou outros produtos
  truffleCount?: number; // Quantidade de trufas (ex: 5, 10, 15)
}

export interface Letter {
  id: string;
  codeUsed?: string; // ID / Code used for safety auditing without link to payer
  recipient: string;
  recipientClass: string; // turma
  message: string;
  signature: string; // "Anônimo", "Seu admirador secreto", "❤️", "Apenas iniciais", "Nome completo"
  writingType: 'handwritten' | 'printed'; // "Escrita à mão" | "Impressa"
  isAnonymous: boolean;
  senderName?: string; // used if isAnonymous is false
  product: ProductType; // Saved to display product details on message view without attaching code
  createdAt: string;
  status: 'pending' | 'completed'; // "Pendente" | "Concluída"
  readAloud?: boolean; // Quer que a mensagem seja lida no pátio?
  ejaSpecification?: string; // Especificação do EJA (se aplicável)
  employeeRole?: string; // Cargo/função do funcionário (se aplicável)
  price?: number; // Preço do buquê (ex: 12, 20, 32) se aplicável
  truffleCount?: number; // Quantidade de trufas (ex: 5, 10, 15) se aplicável
}

export interface SalesStat {
  product: ProductType;
  count: number;
  revenue: number;
}
