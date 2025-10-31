// ✅ Exports des services existants
export * from './services/textService';

// ✅ Exports explicites des utilitaires authWorkspace (priorité)
export {
  // Types et enums
  WorkspaceTokenState,
  WORKSPACE_TOKEN_STATE,
  WorkspaceToken,
  WorkspaceTokenMap,
  WorkspaceTokenValidation,
  // Fonctions
  verifyWorkspaceToken,
  isValidWorkspaceToken,
  hasRequiredRole,
  generateWorkspaceTokens,
  validateIdToken,
  refreshWorkspaceToken,
  validateAuth
} from './utils/authWorkspace';

// ✅ Exports explicites des utilitaires validation (non conflictuels seulement)
export {
  validateRequiredFields,
  validateOptionalHexColor,
  validateEmail,
  validatePhone
} from './utils/validation';

