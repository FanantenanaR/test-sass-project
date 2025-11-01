import { httpsCallable } from 'firebase/functions';
import { functions } from '@/services/api/firebase/config';

// ========================== SERVICE URLS ==========================

export const SERVICE_URL = {
  FIREBASE: 'http://localhost:5001/demo-project/us-central1',
  FASTAPI: 'http://127.0.0.1:8080',
  APP: 'http://localhost:3000'
};

// ========================== TYPES ==========================

export interface WorkspaceToken {
  role: string;
  token: string;
}

export type WorkspaceTokenMap = Record<string, WorkspaceToken>;

// ========================== DONNÉES STATIQUES (synchronisées avec PostgreSQL) ==========================

const MOCK_WORKSPACE_TOKENS: WorkspaceTokenMap = {
  // ✅ UUID du Workspace Demo depuis la base de données
  '550e8400-e29b-41d4-a716-446655440000': {
    role: 'admin',
    token: 'demo-token-workspace-123'
  },
  // ✅ UUID du Test Workspace depuis la base de données
  '550e8400-e29b-41d4-a716-446655440001': {
    role: 'editor',
    token: 'demo-token-workspace-456'
  }
};

// ========================== FIREWALL ANTI-SPAM ==========================

interface FirewallEntry {
  count: number;
  resetTime: number;
}

const requestFirewall = new Map<string, FirewallEntry>();
const MAX_REQUESTS_PER_ENDPOINT = 10;
const FIREWALL_RESET_TIME = 10000; // 10 secondes

function checkFirewall(functionName: string): boolean {
  const now = Date.now();
  const entry = requestFirewall.get(functionName);

  if (!entry || now > entry.resetTime) {
    // Nouvelle fenêtre ou fenêtre expirée
    requestFirewall.set(functionName, {
      count: 1,
      resetTime: now + FIREWALL_RESET_TIME
    });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_ENDPOINT) {
    return false; // Trop de requêtes
  }

  entry.count++;
  return true;
}

// ========================== FONCTIONS UTILITAIRES ==========================

/**
 * Récupère le token d'authentification Firebase
 * 🔧 VERSION DEMO - Token statique
 */
export async function getIdToken(): Promise<string> {
  // 🔧 FONCTION VIDE - Toujours même token
  return 'demo-token-123456789';
}

/**
 * Stocke les tokens workspace
 * 🔧 VERSION DEMO - Simule le stockage (localStorage en production)
 */
export function storeTokens(tokens: WorkspaceTokenMap): void {
  // 🔧 Mode démo : on pourrait stocker dans localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('workspace_tokens', JSON.stringify(tokens));
  }
  console.log('🔧 [DEMO] Tokens workspace stockés:', Object.keys(tokens));
}

/**
 * Récupère les tokens workspace stockés
 * 🔧 VERSION DEMO - Retourne tokens statiques ou depuis localStorage
 */
export function getStoredTokens(): WorkspaceTokenMap {
  // 🔧 Essayer de récupérer depuis localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('workspace_tokens');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback vers tokens statiques
      }
    }
  }
  // Fallback vers tokens statiques
  return MOCK_WORKSPACE_TOKENS;
}

/**
 * Appelle une fonction Firebase sécurisée
 * ✅ Pattern complet avec firewall + tokens + gestion erreurs
 */
export async function callSecuredFunction<T>(
  functionName: string,
  workspaceId: string,
  data?: any
): Promise<T> {
  // 1️⃣ Firewall check (anti-spam)
  if (!checkFirewall(functionName)) {
    throw new Error(`🚨 PAREFEU: Trop de requêtes pour ${functionName}`);
  }

  // 2️⃣ Token workspace
  const workspace_tokens = getStoredTokens();
  const workspaceToken = workspace_tokens[workspaceId]?.token || null;

  // 3️⃣ Appel Firebase avec token
  const result = await callFirebaseFunction<T & { workspace_tokens?: WorkspaceTokenMap }>(
    functionName,
    { ...data, workspaceToken: workspaceToken || 'demo-token-workspace-123' }
  );

  // 4️⃣ Mise à jour tokens si reçus
  if (result.workspace_tokens) {
    storeTokens(result.workspace_tokens);
  }

  return result;
}

/**
 * Appelle une fonction Firebase avec SSE
 * 🔧 VERSION DEMO - SIMULATION SIMPLE
 */
export async function callSecuredSSEFunction(
  functionName: string,
  workspaceId: string,
  data?: any
): Promise<Response> {
  // 🔧 FONCTION VIDE - Simuler un appel SSE simple
  return await fetch(`${SERVICE_URL.FASTAPI}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      ...data
    })
  });
}

/**
 * Appelle une fonction Firebase onCall
 * ✅ Appel réel vers les émulateurs Firebase
 */
async function callFirebaseFunction<T>(
  functionName: string,
  data: any
): Promise<T> {
  try {
    // ✅ Utiliser httpsCallable de Firebase SDK
    const callableFunction = httpsCallable(functions, functionName);
    
    // ✅ Appel avec les données
    const result = await callableFunction(data);
    
    // ✅ Extraire les données de la réponse Firebase
    // Firebase Functions retourne { data: { success: true, ... } }
    const responseData = result.data as T;
    
    return responseData;
  } catch (error: any) {
    console.error(`❌ Erreur appel Firebase ${functionName}:`, error);
    
    // Gestion des erreurs Firebase
    if (error.code === 'functions/unavailable') {
      throw new Error('Service Firebase indisponible. Vérifiez que les émulateurs sont démarrés.');
    }
    
    if (error.code === 'functions/deadline-exceeded') {
      throw new Error('Timeout: La fonction a pris trop de temps à répondre.');
    }
    
    // Re-throw avec message utilisateur si disponible
    if (error.details) {
      throw new Error(error.details);
    }
    
    throw error;
  }
}

/**
 * Déconnecte l'utilisateur
 * 🔧 VERSION DEMO - Nettoie les tokens
 */
export async function logoutUser(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('workspace_tokens');
  }
  console.log('🔧 [DEMO] Utilisateur déconnecté');
}

/**
 * Nettoie tout le cache de l'application
 * 🔧 VERSION DEMO - Nettoie localStorage
 */
export function clearAllCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('workspace_tokens');
    // Nettoyer autres caches si nécessaire
  }
  console.log('🔧 [DEMO] Cache nettoyé');
}