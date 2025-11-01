import { Pool } from 'pg';
import { getPool } from '../config.js';
import { CommentType, CreateCommentType, UpdateCommentType, User, CommentSortOrder, COMMENTS_PER_PAGE } from '../../../shared/types.js';

/**
 * Repository pour la gestion des commentaires
 * ✅ Pattern singleton + Pool PostgreSQL + Isolation workspace
 */

export interface CommentWithUser extends CommentType {
  user: User;
}

export interface CommentsPageResult {
  comments: CommentWithUser[];
  hasMore: boolean;
  total: number;
}

export class CommentRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPool(); // ✅ Pool PostgreSQL
  }

  /**
   * Récupère les commentaires d'un workspace avec pagination et tri
   * ✅ Isolation workspace obligatoire
   */
  async getByWorkspace(
    workspaceId: string,
    options: {
      limit?: number;
      offset?: number;
      sortOrder?: CommentSortOrder;
    } = {}
  ): Promise<CommentsPageResult> {
    const limit = options.limit ?? COMMENTS_PER_PAGE;
    const offset = options.offset ?? 0;
    const sortOrder = options.sortOrder ?? CommentSortOrder.NEWEST;
    
    const orderDirection = sortOrder === CommentSortOrder.NEWEST ? 'DESC' : 'ASC';

    // ✅ Requête avec jointure pour récupérer les infos utilisateur
    const commentsResult = await this.pool.query<{
      id: string;
      workspace_id: string;
      user_id: string;
      content: string;
      created_at: Date;
      updated_at: Date;
      user_name: string;
      user_profile_photo_url: string | null;
    }>(
      `SELECT 
        c.id, 
        c.workspace_id, 
        c.user_id, 
        c.content, 
        c.created_at, 
        c.updated_at,
        u.name as user_name,
        u.profile_photo_url as user_profile_photo_url
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.workspace_id = $1 
       ORDER BY c.created_at ${orderDirection}
       LIMIT $2 OFFSET $3`,
      [workspaceId, limit, offset]
    );

    // ✅ Compter le total pour savoir s'il y a plus de résultats
    const countResult = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM comments WHERE workspace_id = $1',
      [workspaceId]
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const hasMore = offset + limit < total;

    // ✅ Transformation des résultats avec structure User
    const comments: CommentWithUser[] = commentsResult.rows.map(row => ({
      id: row.id,
      workspace_id: row.workspace_id,
      user_id: row.user_id,
      user: {
        id: row.user_id,
        name: row.user_name,
        profilePhotoUrl: row.user_profile_photo_url
      },
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return {
      comments,
      hasMore,
      total
    };
  }

  /**
   * Récupère un commentaire par ID avec isolation workspace
   * ✅ TOUJOURS récupérer avec workspace pour sécurité
   */
  async getById(id: string, workspaceId: string): Promise<CommentWithUser | null> {
    const result = await this.pool.query<{
      id: string;
      workspace_id: string;
      user_id: string;
      content: string;
      created_at: Date;
      updated_at: Date;
      user_name: string;
      user_profile_photo_url: string | null;
    }>(
      `SELECT 
        c.id, 
        c.workspace_id, 
        c.user_id, 
        c.content, 
        c.created_at, 
        c.updated_at,
        u.name as user_name,
        u.profile_photo_url as user_profile_photo_url
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.id = $1 AND c.workspace_id = $2`,
      [id, workspaceId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      workspace_id: row.workspace_id,
      user_id: row.user_id,
      user: {
        id: row.user_id,
        name: row.user_name,
        profilePhotoUrl: row.user_profile_photo_url
      },
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Crée un nouveau commentaire
   * ✅ Isolation workspace obligatoire
   */
  async create(workspaceId: string, data: CreateCommentType): Promise<CommentWithUser> {
    // ✅ Récupérer les infos utilisateur pour la réponse
    const userResult = await this.pool.query<{
      id: string;
      name: string;
      profile_photo_url: string | null;
    }>(
      'SELECT id, name, profile_photo_url FROM users WHERE id = $1',
      [data.user_id]
    );

    if (userResult.rows.length === 0) {
      throw new Error(`User ${data.user_id} not found`);
    }

    const user = userResult.rows[0];

    // ✅ Créer le commentaire
    const result = await this.pool.query<{
      id: string;
      workspace_id: string;
      user_id: string;
      content: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO comments (workspace_id, user_id, content, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, workspace_id, user_id, content, created_at, updated_at`,
      [workspaceId, data.user_id, data.content]
    );

    const comment = result.rows[0];

    return {
      ...comment,
      user: {
        id: user.id,
        name: user.name,
        profilePhotoUrl: user.profile_photo_url
      }
    };
  }

  /**
   * Met à jour un commentaire
   * ✅ Isolation workspace obligatoire
   */
  async update(
    id: string,
    workspaceId: string,
    data: UpdateCommentType
  ): Promise<CommentWithUser | null> {
    // ✅ Mise à jour du commentaire
    const updateResult = await this.pool.query<{
      id: string;
      workspace_id: string;
      user_id: string;
      content: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `UPDATE comments 
       SET content = $1, updated_at = NOW()
       WHERE id = $2 AND workspace_id = $3
       RETURNING id, workspace_id, user_id, content, created_at, updated_at`,
      [data.content, id, workspaceId]
    );

    if (updateResult.rows.length === 0) {
      return null;
    }

    const comment = updateResult.rows[0];

    // ✅ Récupérer les infos utilisateur
    const userResult = await this.pool.query<{
      id: string;
      name: string;
      profile_photo_url: string | null;
    }>(
      'SELECT id, name, profile_photo_url FROM users WHERE id = $1',
      [comment.user_id]
    );

    if (userResult.rows.length === 0) {
      throw new Error(`User ${comment.user_id} not found`);
    }

    const user = userResult.rows[0];

    return {
      ...comment,
      user: {
        id: user.id,
        name: user.name,
        profilePhotoUrl: user.profile_photo_url
      }
    };
  }

  /**
   * Supprime un commentaire
   * ✅ Isolation workspace obligatoire
   */
  async delete(id: string, workspaceId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM comments WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Compte le nombre de commentaires d'un workspace
   */
  async count(workspaceId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM comments WHERE workspace_id = $1',
      [workspaceId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

// ✅ Singleton avec lazy initialization
let commentRepo: CommentRepository | undefined;

export function getCommentRepository(): CommentRepository {
  if (!commentRepo) {
    commentRepo = new CommentRepository();
  }
  return commentRepo;
}

