import { Response } from '../../shared/responses';
import { MessageError } from '../../shared/types/errors';
import { WORKSPACE_ROLES, WorkspaceRole } from '../../../shared/types';

// ========================== ENUMS & TYPES ==========================

export enum WorkspaceTokenState {
  VALID = 'VALID',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INTERNAL_TOKEN_ERROR = 'INTERNAL_TOKEN_ERROR',
  WORKSPACE_NOT_ACCESSIBLE = 'WORKSPACE_NOT_ACCESSIBLE',
  WORKSPACE_TOKEN_NULL = 'WORKSPACE_TOKEN_NULL',
  ROLE_NOT_ALLOWED = 'ROLE_NOT_ALLOWED'
}

export const WORKSPACE_TOKEN_STATE: Record<WorkspaceTokenState, MessageError> = {
  [WorkspaceTokenState.VALID]: {
    code: WorkspaceTokenState.VALID,
    message: "Token valide"
  },
  [WorkspaceTokenState.INVALID_TOKEN]: {
    code: WorkspaceTokenState.INVALID_TOKEN,
    message: "Le token est invalide ou modifié"
  },
  [WorkspaceTokenState.INTERNAL_TOKEN_ERROR]: {
    code: WorkspaceTokenState.INTERNAL_TOKEN_ERROR,
    message: "Erreur interne lors de la vérification du token"
  },
  [WorkspaceTokenState.WORKSPACE_NOT_ACCESSIBLE]: {
    code: WorkspaceTokenState.WORKSPACE_NOT_ACCESSIBLE,
    message: "L'utilisateur n'a pas accès à ce workspace"
  },
  [WorkspaceTokenState.WORKSPACE_TOKEN_NULL]: {
    code: WorkspaceTokenState.WORKSPACE_TOKEN_NULL,
    message: "Aucun token n'a été envoyé"
  },
  [WorkspaceTokenState.ROLE_NOT_ALLOWED]: {
    code: WorkspaceTokenState.ROLE_NOT_ALLOWED,
    message: "L'utilisateur ne possède pas le rôle requis pour cette action"
  }
};

export interface WorkspaceToken {
  role: WorkspaceRole;
  token: string;
}

export type WorkspaceTokenMap = Record<string, WorkspaceToken>;

export interface WorkspaceTokenValidation {
  state: WorkspaceTokenState;
  workspace_id?: string;
  workspace_tokens?: WorkspaceTokenMap;
  role?: WorkspaceRole;
}

// ========================== DONNÉES STATIQUES (synchronisées avec PostgreSQL) ==========================

// ✅ Mapping tokens → UUIDs workspaces depuis la base de données
const MOCK_WORKSPACE_TOKENS: WorkspaceTokenMap = {
  // ✅ UUID du Workspace Demo depuis la base de données
  '550e8400-e29b-41d4-a716-446655440000': {
    role: WORKSPACE_ROLES.ADMIN,
    token: 'demo-token-workspace-123'
  },
  // ✅ UUID du Test Workspace depuis la base de données
  '550e8400-e29b-41d4-a716-446655440001': {
    role: WORKSPACE_ROLES.EDITOR,
    token: 'demo-token-workspace-456'
  }
};

// ✅ Mapping inverse : token → workspace UUID
const TOKEN_TO_WORKSPACE_MAP: Record<string, string> = {
  'demo-token-workspace-123': '550e8400-e29b-41d4-a716-446655440000',
  'demo-token-workspace-456': '550e8400-e29b-41d4-a716-446655440001'
};

// ========================== FONCTIONS FANTÔMES ==========================

/**
 * Vérifie un token workspace
 * 🔧 VERSION DEMO - Validation statique avec UUIDs de la BDD
 */
export async function verifyWorkspaceToken(
  workspaceToken: string | null,
  uid: string,
  requiredRole?: WorkspaceRole
): Promise<WorkspaceTokenValidation> {
  // 🔧 Validation statique : vérifier si le token correspond aux tokens mockés
  if (!workspaceToken) {
    return {
      state: WorkspaceTokenState.WORKSPACE_TOKEN_NULL,
      workspace_id: undefined,
      workspace_tokens: undefined,
      role: undefined
    };
  }

  // ✅ Trouver le workspace_id UUID correspondant au token
  const workspace_id = TOKEN_TO_WORKSPACE_MAP[workspaceToken];
  
  if (!workspace_id) {
    // Token non trouvé, mais on accepte quand même en mode démo (fallback)
    return {
      state: WorkspaceTokenState.VALID,
      workspace_id: '550e8400-e29b-41d4-a716-446655440000', // ✅ UUID du Workspace Demo par défaut
      workspace_tokens: MOCK_WORKSPACE_TOKENS,
      role: WORKSPACE_ROLES.ADMIN
    };
  }

  // ✅ Récupérer les données du token depuis MOCK_WORKSPACE_TOKENS
  const tokenData = MOCK_WORKSPACE_TOKENS[workspace_id];
  
  if (!tokenData) {
    // Workspace ID trouvé mais pas de données token (ne devrait pas arriver)
    return {
      state: WorkspaceTokenState.VALID,
      workspace_id: '550e8400-e29b-41d4-a716-446655440000',
      workspace_tokens: MOCK_WORKSPACE_TOKENS,
      role: WORKSPACE_ROLES.ADMIN
    };
  }

  // ✅ Vérifier le rôle requis (si spécifié)
  if (requiredRole) {
    const userRole = tokenData.role;
    if (!hasRequiredRole(userRole, requiredRole)) {
      return {
        state: WorkspaceTokenState.ROLE_NOT_ALLOWED,
        workspace_id: undefined,
        workspace_tokens: undefined,
        role: userRole
      };
    }
  }
  
  return {
    state: WorkspaceTokenState.VALID,
    workspace_id: workspace_id, // ✅ UUID depuis la BDD
    workspace_tokens: MOCK_WORKSPACE_TOKENS,
    role: tokenData.role
  };
}

/**
 * Valide le résultat de la vérification du token workspace
 * 🔧 VERSION DEMO - Retourne UUIDs de la BDD
 */
export function isValidWorkspaceToken(validation: WorkspaceTokenValidation): Response<{
  workspace_id: string;
  workspace_tokens: WorkspaceTokenMap;
  role: WorkspaceRole;
}> {
  // ✅ Retourner avec le workspace_id depuis la validation (UUID de la BDD)
  if (validation.state === WorkspaceTokenState.VALID && validation.workspace_id) {
    return {
      success: true,
      workspace_id: validation.workspace_id, // ✅ UUID depuis verifyWorkspaceToken
      workspace_tokens: validation.workspace_tokens || MOCK_WORKSPACE_TOKENS,
      role: validation.role || WORKSPACE_ROLES.ADMIN
    };
  }
  
  // Fallback si pas de workspace_id (ne devrait pas arriver en mode démo)
  return {
    success: true,
    workspace_id: '550e8400-e29b-41d4-a716-446655440000', // ✅ UUID du Workspace Demo par défaut
    workspace_tokens: MOCK_WORKSPACE_TOKENS,
    role: WORKSPACE_ROLES.ADMIN
  };
}

/**
 * Vérifie si l'utilisateur a le rôle requis
 * 🔧 VERSION DEMO - TOUJOURS TRUE
 */
export function hasRequiredRole(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  // 🔧 FONCTION VIDE - Toujours true
  return true;
}

/**
 * Génère des tokens workspace pour un utilisateur
 * 🔧 VERSION DEMO - TOUJOURS MÊME TOKENS
 */
export async function generateWorkspaceTokens(uid: string): Promise<WorkspaceTokenMap> {
  // 🔧 FONCTION VIDE - Toujours retourner les mêmes tokens
  return MOCK_WORKSPACE_TOKENS;
}

/**
 * Valide un token Firebase ID
 * 🔧 VERSION DEMO - TOUJOURS SUCCESS
 */
export async function validateIdToken(idToken: string): Promise<Response<{ user: string }>> {
  // 🔧 FONCTION VIDE - Toujours success
  return {
    success: true,
    user: 'demo-user-123'
  };
}

/**
 * Rafraîchit les tokens workspace pour un utilisateur
 * 🔧 VERSION DEMO - TOUJOURS MÊMES TOKENS
 */
export async function refreshWorkspaceToken(uid: string): Promise<WorkspaceTokenMap | null> {
  // 🔧 FONCTION VIDE - Toujours retourner les mêmes tokens
  return MOCK_WORKSPACE_TOKENS;
}

/**
 * Valide l'authentification d'une requête
 * 🔧 VERSION DEMO - TOUJOURS SUCCESS
 */
export function validateAuth(auth: any): Response<{ user: string }> {
  // 🔧 FONCTION VIDE - Toujours success
  return {
    success: true,
    user: 'demo-user-123'
  };
}