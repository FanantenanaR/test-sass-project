import { CreateCommentType, UpdateCommentType } from '../../../../shared/types.js';

/**
 * Validation métier pour les commentaires
 * ✅ Pattern séparé de la validation technique
 */

export interface CommentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valide les données d'un commentaire à créer
 * Règles :
 * - Le contenu ne doit pas être vide
 * - Après trim, le contenu ne doit pas être vide
 * - La taille maximale est de 2000 caractères
 */
export function validateCommentData(data: CreateCommentType): CommentValidationResult {
  const result: CommentValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Validation contenu obligatoire
  if (!data.content || data.content.trim().length === 0) {
    result.errors.push('Le contenu du commentaire est requis');
    result.valid = false;
  }

  // Validation longueur maximale
  if (data.content && data.content.length > 2000) {
    result.errors.push('Le commentaire ne peut pas dépasser 2000 caractères');
    result.valid = false;
  }

  // Validation user_id requis
  if (!data.user_id || data.user_id.trim().length === 0) {
    result.errors.push('L\'utilisateur est requis');
    result.valid = false;
  }

  // Avertissement pour contenu court
  if (data.content && data.content.trim().length < 10) {
    result.warnings.push('Le commentaire est très court');
  }

  return result;
}

/**
 * Valide les données d'un commentaire à mettre à jour
 * Mêmes règles que la création
 */
export function validateCommentUpdate(data: UpdateCommentType): CommentValidationResult {
  const result: CommentValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Validation contenu obligatoire
  if (!data.content || data.content.trim().length === 0) {
    result.errors.push('Le contenu du commentaire est requis');
    result.valid = false;
  }

  // Validation longueur maximale
  if (data.content && data.content.length > 2000) {
    result.errors.push('Le commentaire ne peut pas dépasser 2000 caractères');
    result.valid = false;
  }

  // Avertissement pour contenu court
  if (data.content && data.content.trim().length < 10) {
    result.warnings.push('Le commentaire est très court');
  }

  return result;
}

