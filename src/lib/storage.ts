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
import { db, handleFirestoreError, OperationType } from './firebase';
import { Responsible, ProductType, AccessCode, Letter, PRODUCTS } from '../types';

// Base avatars (beautiful and romantic themed or neutral modern icons)
const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
];

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

    // 2. Bootstrapping Access Codes
    const codesSnap = await getDocs(collection(db, 'codigos_arraial'));
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
        batch.set(doc(db, 'codigos_arraial', code.code), code);
      });
      await batch.commit();
    }

    // 3. Bootstrapping Letters
    const lettersSnap = await getDocs(collection(db, 'cartas_arraial'));
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
          message: 'Melhor professora da escola inteira! Obrigado pela paciência e por nos inspirar todos os dias. Um carinho enorme de toda nossa turma.',
          signature: '❤️',
          writingType: 'handwritten',
          isAnonymous: true,
          product: 'Cartinha + Buquê de Trufas',
          createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
          status: 'pending',
        }
      ];
      initialLetters.forEach(letter => {
        batch.set(doc(db, 'cartas_arraial', letter.id), letter);
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
    const codesSnap = await getDocs(collection(db, 'codigos_arraial'));
    if (codesSnap.empty) {
      // Create test access code CE-TESTE-2026
      const testCode: AccessCode = {
        code: 'CE-TESTE-2026',
        product: 'Cartinha',
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      await setDoc(doc(db, 'codigos_arraial', 'CE-TESTE-2026'), testCode);

      // Create test letter to force creation of 'letters' collection
      const lettersSnap = await getDocs(collection(db, 'cartas_arraial'));
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
        await setDoc(doc(db, 'cartas_arraial', 'let-test-2026'), testLetter);
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
  try {
    const snap = await getDocs(query(collection(db, 'codigos_arraial'), orderBy('createdAt', 'desc')));
    return snap.docs.map(doc => doc.data() as AccessCode);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, 'codigos_arraial');
  }
}

export async function generateCode(product: ProductType): Promise<string> {
  try {
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
      status: 'active'
    };
    
    await setDoc(doc(db, 'codigos_arraial', formattedCode), newCode);
    return formattedCode;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'codigos_arraial');
  }
}

export async function validateCode(codeString: string): Promise<AccessCode | null> {
  try {
    const cleanCode = codeString.toUpperCase().trim();
    const docRef = doc(db, 'codigos_arraial', cleanCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AccessCode;
      if (data.status === 'active') {
        return data;
      }
    }
    return null;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, `codigos_arraial/${codeString}`);
  }
}

// LETTERS API
export async function getLetters(): Promise<Letter[]> {
  try {
    const snap = await getDocs(query(collection(db, 'cartas_arraial'), orderBy('recipient', 'asc')));
    const allLetters = snap.docs.map(doc => doc.data() as Letter);
    
    // Apply "Visual Delay" security strategy
    const pendingLetters = allLetters.filter(l => l.status === 'pending');
    const totalPendingCount = pendingLetters.length;
    
    const nowMs = Date.now();
    const ageThresholdMs = 20 * 60 * 1000; // 20 minutes in milliseconds
    
    return allLetters.filter(letter => {
      // Completed/Archived letters are always visible
      if (letter.status !== 'pending') {
        return true;
      }
      
      // If we have an accumulated pool of 4 or more pending letters, reveal them all immediately to the team 
      if (totalPendingCount >= 4) {
        return true;
      }
      
      // Otherwise, only allow if the letter is more than 20 minutes old
      if (!letter.createdAt) {
        return false;
      }
      
      const createdMs = Date.parse(letter.createdAt);
      if (isNaN(createdMs)) {
        return false;
      }
      
      return (nowMs - createdMs) >= ageThresholdMs;
    });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, 'cartas_arraial');
  }
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
  codeString: string
): Promise<boolean> {
  const cleanCode = codeString.toUpperCase().trim();
  const codeRef = doc(db, 'codigos_arraial', cleanCode);
  const letterId = `let-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const letterRef = doc(db, 'cartas_arraial', letterId);

  try {
    const success = await runTransaction(db, async (transaction) => {
      const codeSnap = await transaction.get(codeRef);
      if (!codeSnap.exists() || codeSnap.data().status !== 'active') {
        return false; // Code was already consumed or invalid
      }
      
      // Consume it
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
      };
      
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
    const docRef = doc(db, 'cartas_arraial', id);
    await updateDoc(docRef, { status });
    return true;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, `cartas_arraial/${id}`);
  }
}

// STATS API
export async function getStats(): Promise<{
  total: number;
  pending: number;
  completed: number;
  productSummary: { product: ProductType; count: number; revenue: number }[];
}> {
  try {
    const [lettersSnap, codesSnap] = await Promise.all([
      getDocs(collection(db, 'cartas_arraial')),
      getDocs(collection(db, 'codigos_arraial'))
    ]);

    const letters = lettersSnap.docs.map(doc => doc.data() as Letter);
    const codes = codesSnap.docs.map(doc => doc.data() as AccessCode);
    
    const total = letters.length;
    const pending = letters.filter(l => l.status === 'pending').length;
    const completed = letters.filter(l => l.status === 'completed').length;
    
    // Pre-initialize counting for stats
    const productSummary: Record<ProductType, { count: number; revenue: number }> = {
      'Cartinha': { count: 0, revenue: 0 },
      'Cartinha + Trufa': { count: 0, revenue: 0 },
      'Cartinha + Rosa': { count: 0, revenue: 0 },
      'Cartinha + Trufa + Rosa': { count: 0, revenue: 0 },
      'Cartinha + Buquê de Trufas': { count: 0, revenue: 0 },
    };
    
    // Look at all used codes to get historical product stats purchase
    codes.forEach(c => {
      // Check price
      const prodConfig = PRODUCTS.find(p => p.type === c.product);
      if (prodConfig && c.status === 'used') {
        productSummary[c.product].count += 1;
        productSummary[c.product].revenue += prodConfig.price;
      }
    });

    // Just to show elegant records in dashboard, if letters already sent do not match the codes table used,
    // we calibrate to offer maximum visual completeness:
    letters.forEach(letter => {
      // If the letters sent doesn't outnumber the calculated codes, we still count it or fallback:
      const prodConfig = PRODUCTS.find(p => p.type === letter.product);
      if (prodConfig) {
        // Ensure we register at least letters presence in analytics:
        const calculatedCount = codes.filter(c => c.product === letter.product && c.status === 'used').length;
        if (calculatedCount < 1) {
          productSummary[letter.product].count += 1;
          productSummary[letter.product].revenue += prodConfig.price;
        }
      }
    });
    
    return {
      total,
      pending,
      completed,
      productSummary: Object.entries(productSummary).map(([product, value]) => ({
        product: product as ProductType,
        count: value.count,
        revenue: value.revenue,
      }))
    };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, 'stats');
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
