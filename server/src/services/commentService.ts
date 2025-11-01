import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { validateAuth, verifyWorkspaceToken, isValidWorkspaceToken } from '../utils/authWorkspace.js';
import { validateRequiredFields, isSuccess, handleError } from '../utils/validation.js';
import { createResponseWithTokens } from '../../shared/responses.js';
import { getCommentRepository } from '../../db/repositories/index.js';
import { WORKSPACE_ROLES } from '../../../shared/types.js';
import { validateCommentData, validateCommentUpdate } from '../utils/validation/commentValidation.js';
import { CommentSortOrder, COMMENTS_PER_PAGE } from '../../../shared/types.js';
import { databaseUrlProd, jwtWorkspaceSecret } from '../main.js';

/**
 * Service de gestion des commentaires
 * ✅ Pattern validation cascade (auth → params → workspace → métier → repository)
 */

/**
 * Créer un nouveau commentaire
 */
export const createComment = onCall({
  secrets: process.env.NODE_ENV === 'development' 
    ? [] 
    : [databaseUrlProd, jwtWorkspaceSecret],
  memory: '512MiB',
  timeoutSeconds: 60
}, async (request) => {
  try {
    // ✅ 1. Validation auth OBLIGATOIRE
    const authResponse = validateAuth(request.auth);
    if (!isSuccess(authResponse)) return authResponse;
    const uid = authResponse.user;

    // ✅ 2. Extraction et validation params
    const { workspaceToken, content } = request.data;
    const validationResponse = validateRequiredFields(request.data, [
      'workspaceToken', 'content'
    ]);
    if (!isSuccess(validationResponse)) return validationResponse;

    // ✅ 3. Validation workspace + rôles
    const tokenValidation = await verifyWorkspaceToken(
      workspaceToken, 
      uid, 
      WORKSPACE_ROLES.EDITOR // Rôle requis pour créer des commentaires
    );
    const validationResult = isValidWorkspaceToken(tokenValidation);
    if (!isSuccess(validationResult)) return validationResult;
    const { workspace_id, workspace_tokens } = validationResult;
    const response = createResponseWithTokens(workspace_tokens);

    // ✅ 4. Validation métier spécifique
    const trimmedContent = content.trim();
    const commentValidation = validateCommentData({
      content: trimmedContent,
      user_id: uid
    });
    if (!commentValidation.valid) {
      return response.error({
        code: 'INVALID_INPUT',
        message: commentValidation.errors.join(', '),
        details: { errors: commentValidation.errors, warnings: commentValidation.warnings }
      });
    }

    // ✅ 5. Logique métier via repository
    const commentData = {
      content: trimmedContent,
      user_id: uid
    };
    
    const newComment = await getCommentRepository().create(workspace_id, commentData);

    // ✅ 6. Logging succès
    logger.info(`Commentaire créé avec succès pour workspace ${workspace_id} par ${uid}`);

    // ✅ 7. Réponse standardisée
    return response.success({ comment: newComment });
    
  } catch (error) {
    logger.error(`Erreur dans createComment:`, error);
    return handleError(error);
  }
});

/**
 * Récupérer les commentaires d'un workspace avec pagination et tri
 */
export const getComments = onCall({
  secrets: process.env.NODE_ENV === 'development' 
    ? [] 
    : [databaseUrlProd, jwtWorkspaceSecret],
  memory: '512MiB',
  timeoutSeconds: 60
}, async (request) => {
  try {
    // ✅ 1. Validation auth OBLIGATOIRE
    const authResponse = validateAuth(request.auth);
    if (!isSuccess(authResponse)) return authResponse;
    const uid = authResponse.user;

    // ✅ 2. Extraction et validation params
    const { workspaceToken, limit, offset, sortOrder } = request.data;
    const validationResponse = validateRequiredFields(request.data, [
      'workspaceToken'
    ]);
    if (!isSuccess(validationResponse)) return validationResponse;

    // ✅ 3. Validation workspace + rôles
    const tokenValidation = await verifyWorkspaceToken(
      workspaceToken, 
      uid, 
      WORKSPACE_ROLES.EDITOR // Rôle requis pour lire les commentaires
    );
    const validationResult = isValidWorkspaceToken(tokenValidation);
    if (!isSuccess(validationResult)) return validationResult;
    const { workspace_id, workspace_tokens } = validationResult;
    const response = createResponseWithTokens(workspace_tokens);

    // ✅ 4. Validation des paramètres de pagination
    const pageLimit = limit && limit > 0 && limit <= 100 ? limit : COMMENTS_PER_PAGE;
    const pageOffset = offset && offset >= 0 ? offset : 0;
    const validSortOrder = sortOrder === CommentSortOrder.OLDEST 
      ? CommentSortOrder.OLDEST 
      : CommentSortOrder.NEWEST;

    // ✅ 5. Logique métier via repository
    const result = await getCommentRepository().getByWorkspace(workspace_id, {
      limit: pageLimit,
      offset: pageOffset,
      sortOrder: validSortOrder
    });

    // ✅ 6. Logging succès
    logger.info(`Commentaires récupérés pour workspace ${workspace_id} par ${uid}`);

    // ✅ 7. Réponse standardisée
    return response.success({ 
      comments: result.comments,
      hasMore: result.hasMore,
      total: result.total
    });
    
  } catch (error) {
    logger.error(`Erreur dans getComments:`, error);
    return handleError(error);
  }
});

/**
 * Mettre à jour un commentaire
 */
export const updateComment = onCall({
  secrets: process.env.NODE_ENV === 'development' 
    ? [] 
    : [databaseUrlProd, jwtWorkspaceSecret],
  memory: '512MiB',
  timeoutSeconds: 60
}, async (request) => {
  try {
    // ✅ 1. Validation auth OBLIGATOIRE
    const authResponse = validateAuth(request.auth);
    if (!isSuccess(authResponse)) return authResponse;
    const uid = authResponse.user;

    // ✅ 2. Extraction et validation params
    const { workspaceToken, commentId, content } = request.data;
    const validationResponse = validateRequiredFields(request.data, [
      'workspaceToken', 'commentId', 'content'
    ]);
    if (!isSuccess(validationResponse)) return validationResponse;

    // ✅ 3. Validation workspace + rôles
    const tokenValidation = await verifyWorkspaceToken(
      workspaceToken, 
      uid, 
      WORKSPACE_ROLES.EDITOR // Rôle requis pour modifier des commentaires
    );
    const validationResult = isValidWorkspaceToken(tokenValidation);
    if (!isSuccess(validationResult)) return validationResult;
    const { workspace_id, workspace_tokens } = validationResult;
    const response = createResponseWithTokens(workspace_tokens);

    // ✅ 4. Validation métier spécifique
    const trimmedContent = content.trim();
    const commentValidation = validateCommentUpdate({
      content: trimmedContent
    });
    if (!commentValidation.valid) {
      return response.error({
        code: 'INVALID_INPUT',
        message: commentValidation.errors.join(', '),
        details: { errors: commentValidation.errors, warnings: commentValidation.warnings }
      });
    }

    // ✅ 5. Vérifier que le commentaire existe et appartient à l'utilisateur
    const existingComment = await getCommentRepository().getById(commentId, workspace_id);
    if (!existingComment) {
      return response.error({
        code: 'NOT_FOUND',
        message: 'Commentaire non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du commentaire
    if (existingComment.user_id !== uid) {
      return response.error({
        code: 'UNAUTHORIZED',
        message: 'Vous ne pouvez modifier que vos propres commentaires'
      });
    }

    // ✅ 6. Logique métier via repository
    const updatedComment = await getCommentRepository().update(commentId, workspace_id, {
      content: trimmedContent
    });

    if (!updatedComment) {
      return response.error({
        code: 'NOT_FOUND',
        message: 'Commentaire non trouvé'
      });
    }

    // ✅ 7. Logging succès
    logger.info(`Commentaire ${commentId} mis à jour pour workspace ${workspace_id} par ${uid}`);

    // ✅ 8. Réponse standardisée
    return response.success({ comment: updatedComment });
    
  } catch (error) {
    logger.error(`Erreur dans updateComment:`, error);
    return handleError(error);
  }
});

/**
 * Supprimer un commentaire
 */
export const deleteComment = onCall({
  secrets: process.env.NODE_ENV === 'development' 
    ? [] 
    : [databaseUrlProd, jwtWorkspaceSecret],
  memory: '512MiB',
  timeoutSeconds: 60
}, async (request) => {
  try {
    // ✅ 1. Validation auth OBLIGATOIRE
    const authResponse = validateAuth(request.auth);
    if (!isSuccess(authResponse)) return authResponse;
    const uid = authResponse.user;

    // ✅ 2. Extraction et validation params
    const { workspaceToken, commentId } = request.data;
    const validationResponse = validateRequiredFields(request.data, [
      'workspaceToken', 'commentId'
    ]);
    if (!isSuccess(validationResponse)) return validationResponse;

    // ✅ 3. Validation workspace + rôles
    const tokenValidation = await verifyWorkspaceToken(
      workspaceToken, 
      uid, 
      WORKSPACE_ROLES.EDITOR // Rôle requis pour supprimer des commentaires
    );
    const validationResult = isValidWorkspaceToken(tokenValidation);
    if (!isSuccess(validationResult)) return validationResult;
    const { workspace_id, workspace_tokens } = validationResult;
    const response = createResponseWithTokens(workspace_tokens);

    // ✅ 4. Vérifier que le commentaire existe et appartient à l'utilisateur
    const existingComment = await getCommentRepository().getById(commentId, workspace_id);
    if (!existingComment) {
      return response.error({
        code: 'NOT_FOUND',
        message: 'Commentaire non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du commentaire (ou ADMIN)
    if (existingComment.user_id !== uid) {
      return response.error({
        code: 'UNAUTHORIZED',
        message: 'Vous ne pouvez supprimer que vos propres commentaires'
      });
    }

    // ✅ 5. Logique métier via repository
    const deleted = await getCommentRepository().delete(commentId, workspace_id);
    
    if (!deleted) {
      return response.error({
        code: 'NOT_FOUND',
        message: 'Commentaire non trouvé'
      });
    }

    // ✅ 6. Logging succès
    logger.info(`Commentaire ${commentId} supprimé pour workspace ${workspace_id} par ${uid}`);

    // ✅ 7. Réponse standardisée
    return response.success({ deleted: true });
    
  } catch (error) {
    logger.error(`Erreur dans deleteComment:`, error);
    return handleError(error);
  }
});

