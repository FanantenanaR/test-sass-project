import { callSecuredFunction } from '@/services/local/authenticationService';
import { CommentType, CreateCommentType, UpdateCommentType, CommentSortOrder, COMMENTS_PER_PAGE } from '@/../shared/types';

/**
 * Service de gestion des commentaires côté client
 * ✅ Pattern service statique avec workspaceId premier paramètre
 */

export interface CommentsResponse {
  comments: CommentType[];
  hasMore: boolean;
  total: number;
}

export interface CommentResponse {
  comment: CommentType;
}

export class CommentService {
  /**
   * Créer un nouveau commentaire
   */
  static async createComment(
    workspaceId: string,
    data: CreateCommentType
  ): Promise<CommentType> {
    // ✅ React Query gère automatiquement les erreurs
    const result = await callSecuredFunction<CommentResponse>(
      'createComment',
      workspaceId,
      { content: data.content }
    );
    return result.comment;
  }

  /**
   * Récupérer les commentaires d'un workspace avec pagination et tri
   */
  static async getComments(
    workspaceId: string,
    options: {
      limit?: number;
      offset?: number;
      sortOrder?: CommentSortOrder;
    } = {}
  ): Promise<CommentsResponse> {
    // ✅ React Query gère automatiquement les erreurs
    const result = await callSecuredFunction<CommentsResponse>(
      'getComments',
      workspaceId,
      {
        limit: options.limit ?? COMMENTS_PER_PAGE,
        offset: options.offset ?? 0,
        sortOrder: options.sortOrder ?? CommentSortOrder.NEWEST
      }
    );
    return result;
  }

  /**
   * Mettre à jour un commentaire
   */
  static async updateComment(
    workspaceId: string,
    commentId: string,
    data: UpdateCommentType
  ): Promise<CommentType> {
    // ✅ React Query gère automatiquement les erreurs
    const result = await callSecuredFunction<CommentResponse>(
      'updateComment',
      workspaceId,
      {
        commentId,
        content: data.content
      }
    );
    return result.comment;
  }

  /**
   * Supprimer un commentaire
   */
  static async deleteComment(
    workspaceId: string,
    commentId: string
  ): Promise<boolean> {
    // ✅ React Query gère automatiquement les erreurs
    const result = await callSecuredFunction<{ deleted: boolean }>(
      'deleteComment',
      workspaceId,
      { commentId }
    );
    return result.deleted;
  }
}

