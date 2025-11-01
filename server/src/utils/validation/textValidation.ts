/**
 * Validation métier spécifique pour les textes
 * ✅ Pattern obligatoire : Validation métier séparée du service
 */

import { CreateTextType, TextType } from '../../../../shared/types';
import { ERRORS, withDetails } from '../../../shared/types/errors.js';
import { MessageError } from '../../../shared/types/errors.js';

export interface TextValidationResult {
  valid: boolean;
  error?: MessageError;
}

/**
 * Valide les données d'un nouveau texte
 */
export function validateTextData(data: CreateTextType): TextValidationResult {
  // Validation contenu obligatoire
  if (!data.content || data.content.trim().length === 0) {
    return {
      valid: false,
      error: withDetails(ERRORS.INVALID_INPUT, {
        message: 'Le contenu est requis',
        field: 'content'
      })
    };
  }

  // Validation longueur contenu
  if (data.content.length > 1000) {
    return {
      valid: false,
      error: withDetails(ERRORS.INVALID_INPUT, {
        message: 'Le contenu ne peut pas dépasser 1000 caractères',
        field: 'content',
        maxLength: 1000
      })
    };
  }

  return { valid: true };
}

/**
 * Valide une mise à jour de texte
 */
export function validateTextUpdate(
  existingText: TextType,
  updateData: Partial<CreateTextType>
): TextValidationResult {
  // Ne pas permettre de changer le workspace
  if (updateData.content !== undefined && updateData.content.length > 1000) {
    return {
      valid: false,
      error: withDetails(ERRORS.INVALID_INPUT, {
        message: 'Le contenu ne peut pas dépasser 1000 caractères',
        field: 'content',
        maxLength: 1000
      })
    };
  }

  return { valid: true };
}

