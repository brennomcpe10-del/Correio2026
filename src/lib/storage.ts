/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy, 
  runTransaction, 
  writeBatch 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Responsible, ProductType, AccessCode, Letter, PRODUCTS } from '../types';

// Base avatars (beautiful and romantic themed or neutral modern icons)
const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
];

let lettersCollectionToUse: string | null = null;
let codesCollectionToUse: string | null = null;

export async function getLettersCollection(): Promise<string> {
  if (lettersCollectionToUse) {
    return lettersCollectionToUse;
  }
  
  const candidates = ['cartas_arraial', 'letters', 'messages'];
  console.log("[Firebase Debug] Scanning collections for existing letters data:", candidates);
  
  for (const col of candidates) {
    try {
      const testSnap = await getDocs(collection(db, col));
      console.log(`[Firebase Debug] Collection '${col}' has ${testSnap.size} documents.`);
      if (testSnap.size > 0) {
        console.log(`[Firebase Debug] Found ${testSnap.size} documents in collection '${col}'. Setting it as the active letters collection!`);
        lettersCollectionToUse = col;
        return col;
      }
    } catch (err: any) {
      console.warn(`[Firebase Debug] Failed scanning collection '${col}':`, err.message || err);
    }
  }
  
  // Default fallback
  lettersCollectionToUse = 'cartas_arraial';
  console.log(`[Firebase Debug] No candidate collection had existing letters. Defaulting letters collection to '${lettersCollectionToUse}'.`);
  return lettersCollectionToUse;
}

export async function getCodesCollection(): Promise<string> {
  if (codesCollectionToUse) {
    return codesCollectionToUse;
  }
  
  const candidates = ['codigos_arraial', 'access_codes', 'codes', 'vendas'];
  console.log("[Firebase Debug] Scanning collections for existing sales/codes data:", candidates);
  
  for (const col of candidates) {
    try {
      const testSnap = await getDocs(collection(db, col));
      console.log(`[Firebase Debug] Collection '${col}' has ${testSnap.size} documents.`);
      if (testSnap.size > 0) {
        console.log(`[Firebase Debug] Found ${testSnap.size} documents in collection '${col}'. Setting it as the active codes collection!`);
        codesCollectionToUse = col;
        return col;
      }
    } catch (err: any) {
      console.warn(`[Firebase Debug] Failed scanning collection '${col}':`, err.message || err);
    }
  }
  
  // Default fallback
  codesCollectionToUse = 'codigos_arraial';
  console.log(`[Firebase Debug] No candidate collection had existing codes. Defaulting codes collection to '${codesCollectionToUse}'.`);
  return codesCollectionToUse;
}

// Seed initial data to Firestore if they are empty
export async function initLocalStorage() {
  try {
    // 1. Bootstrapping Responsibles
    const respSnap = await getDocs(collection(db, 'responsibles'));
    if (respSnap.empty) {
      const batch = writeBatch(db);
      const initialResponsibles: Responsible[] = [
        {
          id: 'resp-1',
          name: 'Ana Beatriz (Grêmio)',
          whatsapp: '+5511999998888',
          avatarUrl: MOCK_AVATARS[0],
        },
        {
          id: 'resp-2',
          name: 'Lucas Pinho (Voluntário)',
          whatsapp: '+5511988887777',
          avatarUrl: MOCK_AVATARS[1],
        },
        {
          id: 'resp-3',
          name: 'Clara Schmidt (Direção)',
          whatsapp: '+5511977776666',
          avatarUrl: MOCK_AVATARS[2],
        }
      ];
      initialResponsibles.forEach(resp => {
        batch.set(doc(db, 'responsibles', resp.id), resp);
      });
      await batch.commit();
    }

    const activeLettersCol = await getLettersCollection();
    const activeCodesCol = await getCodesCollection();

    // 2. Bootstrapping Access Codes (only if the detected active collection is empty)
    const codesSnap = await getDocs(collection(db, activeCodesCol));
    if (codesSnap.empty) {
      const batch = writeBatch(db);
      const initialCodes: AccessCode[] = [
        { code: 'CE-AMOR-E202', product: 'Cartinha + Trufa + Rosa', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), status: 'active' },
        { code: 'CE-FEST-A103', product: 'Cartinha + Rosa', createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), status: 'active' },
        { code: 'CE-DOCE-C505', product: 'Cartinha + Buquê de Trufas', createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), status: 'active' },
        { code: 'CE-CORA-Z999', product: 'Cartinha', createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), status: 'active' },
        { code: 'CE-ROME-U432', product: 'Cartinha + Trufa', createdAt: new Date().toISOString(), status: 'active' },
        { code: 'CE-USED-9999', product: 'Cartinha + Buquê de Trufas', createdAt: new Date(Date.now() - 86400000).toISOString(), status: 'used' },
        { code: 'CE-USED-8888', product: 'Cartinha', createdAt: new Date(Date.now() - 86400000).toISOString(), status: 'used' },
      ];
      initialCodes.forEach(code => {
        batch.set(doc(db, activeCodesCol, code.code), code);
      });
      await batch.commit();
    }

    // 3. Bootstrapping Letters (only if the detected active collection is empty)
    const lettersSnap = await getDocs(collection(db, activeLettersCol));
    if (lettersSnap.empty) {
      const batch = writeBatch(db);
      const initialLetters: Letter[] = [
        {
          id: 'let-1',
          recipient: 'Mariana Azevedo',
          recipientClass: '3º Ano EM A',
          message: 'Você alegra meus dias todas as vezes que passa pelo corredor. Seu sorriso e carisma são fantásticos! Espero que goste desta rosa vermelha.',
          signature: 'Seu admirador secreto',
          writingType: 'handwritten',
          isAnonymous: true,
          product: 'Cartinha + Rosa',
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          status: 'pending',
        },
        {
          id: 'let-2',
          recipient: 'Enzo Rodrigues',
          recipientClass: '1º Ano EM B',
          message: 'Feliz Arraial! Você é um amigo maravilhoso. Que sua trufa seja doce igual a nossa amizade. Tamo junto bro!',
          signature: 'Nome completo',
          isAnonymous: false,
          senderName: 'Gabriel Santos',
          writingType: 'printed',
          product: 'Cartinha + Trufa',
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          status: 'pending',
        },
        {
          id: 'let-3',
          recipient: 'Professora Sandra (Química)',
          recipientClass: 'Sala dos Professores',
          message: 'Melhor professora do colégio inteiro! Obrigado pela paciência e por nos inspirar todos os dias. Um carinho enorme de toda nossa turma.',
          signature: '❤️',
          writingType: 'handwritten',
          isAnonymous: true,
          product: 'Cartinha + Buquê de Trufas',
          createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
          status: 'pending',
        }
      ];
      initialLetters.forEach(letter => {
        batch.set(doc(db, activeLettersCol, letter.id), letter);
      });
      await batch.commit();
    }

    // 4. Bootstrapping Allowed Admins
    const adminsSnap = await getDocs(collection(db, 'allowedAdmins'));
    if (adminsSnap.empty) {
      const batch = writeBatch(db);
      const defaultAdmins = ['brennomcpe10@gmail.com', 'admin@escola.com.br'];
      defaultAdmins.forEach(email => {
        batch.set(doc(db, 'allowedAdmins', email.toLowerCase().trim()), { email: email.toLowerCase().trim(), createdAt: new Date().toISOString() });
      });
      await batch.commit();
    }
  } catch (error: any) {
    console.warn("Aviso no Firebase (initLocalStorage): ", error.message || error);
    // Do not throw to prevent crashing initialization if rules aren't deployed yet
  }
}

export async function forceRecreateEmptyCollections(): Promise<void> {
  try {
    const activeCodesCol = await getCodesCollection();
    const activeLettersCol = await getLettersCollection();
    
    const codesSnap = await getDocs(collection(db, activeCodesCol));
    if (codesSnap.empty) {
      // Create test access code CE-TESTE-2026
      const testCode: AccessCode = {
        code: 'CE-TESTE-2026',
        product: 'Cartinha',
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      await setDoc(doc(db, activeCodesCol, 'CE-TESTE-2026'), testCode);

      // Create test letter to force creation of active letters collection
      const lettersSnap = await getDocs(collection(db, activeLettersCol));
      if (lettersSnap.empty) {
        const testLetter: Letter = {
          id: 'let-test-2026',
          recipient: 'Cupido de Teste',
          recipientClass: '1°A',
          message: 'Esta é uma carta inicial de teste para forçar a criação da coleção no Firebase após limpeza.',
          signature: 'Anônimo',
          writingType: 'printed',
          isAnonymous: true,
          product: 'Cartinha',
          createdAt: new Date().toISOString(),
          status: 'pending'
        };
        await setDoc(doc(db, activeLettersCol, 'let-test-2026'), testLetter);
      }
    }
  } catch (error: any) {
    console.warn("Could not force-recreate collections: ", error);
  }
}

// RESPONSIBLES API
export async function getResponsibles(): Promise<Responsible[]> {
  try {
    const snap = await getDocs(collection(db, 'responsibles'));
    if (snap.empty) {
      return [
        { id: 'resp-1', name: 'Ana Beatriz (Grêmio)', whatsapp: '+5511999998888', avatarUrl: MOCK_AVATARS[0] },
        { id: 'resp-2', name: 'Lucas Pinho (Voluntário)', whatsapp: '+5511988887777', avatarUrl: MOCK_AVATARS[1] },
        { id: 'resp-3', name: 'Clara Schmidt (Direção)', whatsapp: '+5511977776666', avatarUrl: MOCK_AVATARS[2] }
      ];
    }
    return snap.docs.map(doc => doc.data() as Responsible);
  } catch (error: any) {
    console.warn("Could not load responsibles from Firestore. Using static fallback: ", error.message || error);
    return [
      { id: 'resp-1', name: 'Ana Beatriz (Grêmio)', whatsapp: '+5511999998888', avatarUrl: MOCK_AVATARS[0] },
      { id: 'resp-2', name: 'Lucas Pinho (Voluntário)', whatsapp: '+5511988887777', avatarUrl: MOCK_AVATARS[1] },
      { id: 'resp-3', name: 'Clara Schmidt (Direção)', whatsapp: '+5511977776666', avatarUrl: MOCK_AVATARS[2] }
    ];
  }
}

export async function addResponsible(name: string, whatsapp: string, avatarUrl?: string): Promise<Responsible> {
  try {
    const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    const id = `resp-${Date.now()}`;
    const newResp: Responsible = {
      id,
      name,
      whatsapp: whatsapp.trim(),
      avatarUrl: (avatarUrl && avatarUrl.trim()) ? avatarUrl.trim() : defaultAvatar,
    };
    await setDoc(doc(db, 'responsibles', id), newResp);
    return newResp;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'responsibles');
  }
}

export async function deleteResponsible(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'responsibles', id));
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, `responsibles/${id}`);
  }
}

// ACCESS CODES API
export async function getAccessCodes(): Promise<AccessCode[]> {
  const candidates = ['codigos_arraial', 'access_codes', 'codes', 'vendas'];
  const allCodesMap = new Map<string, AccessCode>();

  for (const col of candidates) {
    try {
      console.log(`[Firebase Debug] Fetching codes from candidate collection: '${col}'...`);
      const snap = await getDocs(collection(db, col));
      console.log(`[Firebase Debug] Fetched ${snap.size} codes from candidates '${col}'.`);
      
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const codeKey = (data.code || docSnap.id).toUpperCase().trim();
        
        const mappedCode: AccessCode = {
          code: data.code || docSnap.id,
          product: data.product || 'Cartinha',
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || 'used',
          price: data.price !== undefined ? data.price : undefined,
          truffleCount: data.truffleCount !== undefined ? data.truffleCount : (data.bisCount !== undefined ? data.bisCount : undefined)
        };

        if (!allCodesMap.has(codeKey)) {
          allCodesMap.set(codeKey, mappedCode);
        } else {
          const existing = allCodesMap.get(codeKey)!;
          if (mappedCode.status === 'used' && existing.status === 'active') {
            allCodesMap.set(codeKey, mappedCode);
          } else if (new Date(mappedCode.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
            allCodesMap.set(codeKey, mappedCode);
          }
        }
      });
    } catch (err: any) {
      console.warn(`[Firebase Debug] Ignored scan warning on codes candidate '${col}':`, err.message || err);
    }
  }

  const codes = Array.from(allCodesMap.values());
  codes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return codes;
}

export async function generateCode(
  product: ProductType,
  price?: number,
  truffleCount?: number
): Promise<string> {
  try {
    const activeCol = await getCodesCollection();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing letters like O/I/0/1
    const genChunk = (len: number) => {
      let res = '';
      for (let i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    };
    
    const formattedCode = `CE-${genChunk(4)}-${genChunk(4)}`;
    
    const newCode: AccessCode = {
      code: formattedCode,
      product,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    
    if (price !== undefined) {
      newCode.price = price;
    }
    if (truffleCount !== undefined) {
      newCode.truffleCount = truffleCount;
    }
    
    await setDoc(doc(db, activeCol, formattedCode), newCode);
    return formattedCode;
  } catch (error: any) {
    const activeCol = await getCodesCollection();
    handleFirestoreError(error, OperationType.WRITE, activeCol);
  }
}

export async function validateCode(codeString: string): Promise<AccessCode | null> {
  try {
    const cleanCode = codeString.toUpperCase().trim();
    const candidates = ['codigos_arraial', 'access_codes', 'codes', 'vendas'];
    
    for (const col of candidates) {
      try {
        const docRef = doc(db, col, cleanCode);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const mappedCode: AccessCode = {
            code: data.code || snap.id,
            product: data.product || 'Cartinha',
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || 'used',
            price: data.price !== undefined ? data.price : undefined,
            truffleCount: data.truffleCount !== undefined ? data.truffleCount : (data.bisCount !== undefined ? data.bisCount : undefined)
          };
          if (mappedCode.status === 'active') {
            console.log(`[Firebase Debug] Code '${cleanCode}' successfully validated inside candidate collection '${col}'.`);
            return mappedCode;
          }
        }
      } catch (err: any) {
        console.warn(`[Firebase Debug] Validation scan ignored error on candidate '${col}':`, err.message || err);
      }
    }
    return null;
  } catch (error: any) {
    const activeCol = await getCodesCollection();
    handleFirestoreError(error, OperationType.GET, `${activeCol}/${codeString}`);
  }
}

// LETTERS API
export function determinePrice(product: string, truffleCount?: number, docPrice?: any): number {
  if (docPrice !== undefined && docPrice !== null && !isNaN(Number(docPrice))) {
    return Number(docPrice);
  }

  const prod = String(product).trim();

  // Exact matching from the user's list
  if (prod === 'Cartinha') return 2;
  if (prod === 'Cartinha + Trufa') return 3;
  if (prod === 'Cartinha + Rosa') return 5;
  if (prod === 'Cartinha + Trufa + Rosa') return 7;
  
  if (prod === 'Cartinha + Buquê de Trufas' || (prod.includes('Buquê') && prod.includes('trufa'))) {
    if (truffleCount === 10 || docPrice === 20) return 20;
    if (truffleCount === 15 || docPrice === 32) return 32;
    return 12; // Buquê Pequeno (5 trufas)
  }
  
  // also support literal old names directly if stored that way
  if (prod.includes('Buquê Pequeno (5 trufas)') || prod.includes('Buquê Pequeno (5 Trufas)')) return 12;
  if (prod.includes('Buquê Médio (10 trufas)') || prod.includes('Buquê Médio (10 Trufas)')) return 20;
  if (prod.includes('Buquê Grande (15 trufas)') || prod.includes('Buquê Grande (15 Trufas)')) return 32;

  if (prod === 'Cartinha + 1 Bis') return 3;
  if (prod === 'Cartinha + Flor') return 5;
  if (prod === 'Cartinha + Flor + 2 Bis') return 7;
  if (prod === 'Buquê Pequeno (10 Bis)') return 12;
  if (prod === 'Buquê Médio (15 Bis)') return 17;
  if (prod === 'Buquê Grande (20 Bis)') return 22;

  // Fallback nos PRODUCTS atuais
  const foundInProducts = PRODUCTS.find(p => p.type === prod);
  if (foundInProducts) {
    return foundInProducts.price;
  }

  return 2; // Default
}

export async function getLetters(): Promise<Letter[]> {
  const candidates = ['cartas_arraial', 'letters', 'messages'];
  const allLettersMap = new Map<string, Letter>();

  console.log(`[Firebase Debug - getLetters] INITIATING FETCH from letters candidates:`, candidates);

  for (const col of candidates) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`[Firebase Debug - getLetters] Candidate '${col}' returned ${snap.size} documents.`);
      
      snap.docs.forEach((docSnap, idx) => {
        const data = docSnap.data();
        const truffleCountVal = data.truffleCount !== undefined ? data.truffleCount : (data.bisCount !== undefined ? data.bisCount : undefined);
        const resolvedPrice = determinePrice(data.product || 'Cartinha', truffleCountVal, data.price);

        const mappedLetter: Letter = {
          id: docSnap.id,
          codeUsed: data.codeUsed || data.code || '',
          recipient: data.recipient || data.recipientName || data.destinatario || 'Sem destinatário',
          recipientClass: data.recipientClass || data.turma || 'Sem turma',
          message: data.message || data.mensagem || data.conteudo || '',
          signature: data.signature || data.assinatura || 'Anônimo',
          writingType: data.writingType || 'printed',
          isAnonymous: data.isAnonymous !== undefined ? data.isAnonymous : true,
          product: data.product || 'Cartinha',
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || 'pending',
          readAloud: data.readAloud || false,
          ejaSpecification: data.ejaSpecification || '',
          employeeRole: data.employeeRole || '',
          price: resolvedPrice,
          truffleCount: truffleCountVal,
          itemDescription: data.itemDescription || data.productDescription || data.produto || data.item || undefined
        };

        if (!allLettersMap.has(mappedLetter.id)) {
          allLettersMap.set(mappedLetter.id, mappedLetter);
        } else {
          const existing = allLettersMap.get(mappedLetter.id)!;
          if (mappedLetter.status === 'completed' && existing.status === 'pending') {
            allLettersMap.set(mappedLetter.id, mappedLetter);
          } else if (new Date(mappedLetter.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
            allLettersMap.set(mappedLetter.id, mappedLetter);
          }
        }
      });
    } catch (err: any) {
      console.warn(`[Firebase Debug] Ignored scan warning on letters candidate '${col}':`, err.message || err);
    }
  }

  const allLetters = Array.from(allLettersMap.values());
  allLetters.sort((a, b) => {
    const recA = (a.recipient || '').toLowerCase().trim();
    const recB = (b.recipient || '').toLowerCase().trim();
    return recA.localeCompare(recB);
  });

  return allLetters;
}

// Submit a letter - guarantees anonymity by completely decoupling code consume from insert!
export async function submitLetter(
  recipient: string,
  recipientClass: string,
  message: string,
  signature: string,
  writingType: 'handwritten' | 'printed',
  isAnonymous: boolean,
  senderName: string,
  productType: ProductType,
  codeString: string,
  readAloud?: boolean,
  ejaSpecification?: string,
  employeeRole?: string
): Promise<boolean> {
  const cleanCode = codeString.toUpperCase().trim();
  const activeLettersCol = await getLettersCollection();
  
  // Find which candidate collection contains this active code
  const codeCandidates = ['codigos_arraial', 'access_codes', 'codes', 'vendas'];
  let detectedCodeCol = 'codigos_arraial';
  
  for (const col of codeCandidates) {
    try {
      const snap = await getDoc(doc(db, col, cleanCode));
      if (snap.exists() && snap.data()?.status === 'active') {
        detectedCodeCol = col;
        break;
      }
    } catch {
      // ignore, seek next
    }
  }

  const codeRef = doc(db, detectedCodeCol, cleanCode);
  const letterId = `let-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const letterRef = doc(db, activeLettersCol, letterId);

  try {
    const success = await runTransaction(db, async (transaction) => {
      const codeSnap = await transaction.get(codeRef);
      if (!codeSnap.exists() || codeSnap.data().status !== 'active') {
        return false; // Code was already consumed or invalid
      }
      
      // Consume it
      const codeData = codeSnap.data();
      transaction.update(codeRef, { status: 'used' });
      
      // Insert Letter
      const newLetter: Letter = {
        id: letterId,
        codeUsed: cleanCode,
        recipient,
        recipientClass,
        message,
        signature,
        writingType,
        isAnonymous,
        product: productType,
        createdAt: new Date().toISOString(),
        status: 'pending',
        readAloud: !!readAloud,
        ejaSpecification: ejaSpecification || '',
        employeeRole: employeeRole || '',
      };
      
      if (codeData.price !== undefined) {
        newLetter.price = codeData.price;
      }
      if (codeData.truffleCount !== undefined) {
        newLetter.truffleCount = codeData.truffleCount;
      } else if (codeData.bisCount !== undefined) {
        newLetter.truffleCount = codeData.bisCount;
      }
      
      transaction.set(letterRef, newLetter);
      return true;
    });

    return success;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'submission');
  }
}

export async function updateLetterStatus(id: string, status: 'pending' | 'completed'): Promise<boolean> {
  try {
    const activeLettersCol = await getLettersCollection();
    const candidates = ['cartas_arraial', 'letters', 'messages'];
    let detectedLettersCol = activeLettersCol;
    
    for (const col of candidates) {
      try {
        const snap = await getDoc(doc(db, col, id));
        if (snap.exists()) {
          detectedLettersCol = col;
          break;
        }
      } catch {
        // ignore
      }
    }
    
    const docRef = doc(db, detectedLettersCol, id);
    await updateDoc(docRef, { status });
    return true;
  } catch (error: any) {
    const activeLettersCol = await getLettersCollection();
    handleFirestoreError(error, OperationType.UPDATE, `${activeLettersCol}/${id}`);
  }
}

// STATS API
export function getLetterPrice(letter: Letter): number {
  if (!letter) return 0;
  return determinePrice(letter.product, letter.truffleCount, letter.price);
}

export function calculateTotal(letters: Letter[]): number {
  if (!letters) return 0;
  return letters.reduce((sum, letter) => sum + (Number(letter.price) || 0), 0);
}

export async function getStats(): Promise<{
  total: number;
  pending: number;
  completed: number;
  productSummary: { product: ProductType; count: number; revenue: number }[];
}> {
  try {
    console.log(`[Firebase Debug] getStats: Aggregating stats from ALL loaded candidates...`);
    
    const [letters, codes] = await Promise.all([
      getLetters(),
      getAccessCodes()
    ]);
    
    const total = letters.length;
    const pending = letters.filter(l => l.status === 'pending').length;
    const completed = letters.filter(l => l.status === 'completed').length;
    
    // We want to count actual purchases from letters/codes to populate productSummary.
    const productSummary: Record<string, { count: number; revenue: number }> = {};
    
    // Initialise all productTypes (including current PRODUCTS and old ones)
    const allProdTypes: string[] = [
      'Cartinha', 
      'Cartinha + Trufa', 
      'Cartinha + Rosa', 
      'Cartinha + Trufa + Rosa', 
      'Cartinha + Buquê de Trufas', 
      'Cartinha + 1 Bis', 
      'Cartinha + Flor', 
      'Cartinha + Flor + 2 Bis', 
      'Buquê Pequeno (10 Bis)', 
      'Buquê Médio (15 Bis)', 
      'Buquê Grande (20 Bis)'
    ];

    allProdTypes.forEach(p => {
      productSummary[p] = { count: 0, revenue: 0 };
    });

    letters.forEach(letter => {
      const prod = letter.product || 'Cartinha';
      if (!productSummary[prod]) {
        productSummary[prod] = { count: 0, revenue: 0 };
      }
      productSummary[prod].count += 1;
      productSummary[prod].revenue += getLetterPrice(letter);
    });
    
    // Convert to target signature format
    const formattedSummary = Object.entries(productSummary)
      .filter(([_, val]) => val.count > 0) // filter empty products to keep display compact
      .map(([product, value]) => ({
        product: product as ProductType,
        count: value.count,
        revenue: value.revenue,
      }));
    
    return {
      total,
      pending,
      completed,
      productSummary: formattedSummary
    };
  } catch (error: any) {
    const activeLettersCol = await getLettersCollection();
    handleFirestoreError(error, OperationType.GET, activeLettersCol);
    // fallback empty state
    return {
      total: 0,
      pending: 0,
      completed: 0,
      productSummary: []
    };
  }
}

// ALLOWED ADMINS API
export async function getAllowedAdmins(): Promise<string[]> {
  try {
    const snap = await getDocs(collection(db, 'allowedAdmins'));
    return snap.docs.map(doc => doc.id);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, 'allowedAdmins');
    return [];
  }
}

export async function addAllowedAdmin(email: string): Promise<void> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return;
    await setDoc(doc(db, 'allowedAdmins', cleanEmail), { email: cleanEmail, createdAt: new Date().toISOString() });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'allowedAdmins');
  }
}

export async function removeAllowedAdmin(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  try {
    await deleteDoc(doc(db, 'allowedAdmins', cleanEmail));
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, `allowedAdmins/${cleanEmail}`);
  }
}

export async function checkIsAllowedAdmin(email: string): Promise<boolean> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return false;
    const docRef = doc(db, 'allowedAdmins', cleanEmail);
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, `allowedAdmins/${email}`);
    return false;
  }
}
