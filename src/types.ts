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
  | 'Cartinha + Buquê de Trufas';

export const PRODUCTS: { type: ProductType; price: number; icon: string }[] = [
  { type: 'Cartinha', price: 2.00, icon: '❤️' },
  { type: 'Cartinha + Trufa', price: 3.00, icon: '🍫' },
  { type: 'Cartinha + Rosa', price: 5.00, icon: '🌹' },
  { type: 'Cartinha + Trufa + Rosa', price: 7.00, icon: '🌹🍫' },
  { type: 'Cartinha + Buquê de Trufas', price: 12.00, icon: '💐' },
];

export interface AccessCode {
  code: string; // CE-XXXX-YYYY
  product: ProductType;
  createdAt: string;
  status: 'active' | 'used';
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
}

export interface SalesStat {
  product: ProductType;
  count: number;
  revenue: number;
}
