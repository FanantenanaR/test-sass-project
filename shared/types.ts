// ========================== CONSTANTES ET ENUMS PARTAGÉS ==============================

export const WORKSPACE_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor'
} as const;

export type WorkspaceRole = typeof WORKSPACE_ROLES[keyof typeof WORKSPACE_ROLES];

export const ROLE_PRIORITY: Record<WorkspaceRole, number> = {
  [WORKSPACE_ROLES.ADMIN]: 0,   // le plus fort
  [WORKSPACE_ROLES.EDITOR]: 1   // moins fort
};

// ========================== TYPES ESSENTIELS POUR LE TEST ==============================

export interface TextType {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTextType {
  title: string;
  content: string;
  created_by: string;
}

// ========================== TYPES MESSAGES (pour le chat) ==============================

export interface MessageFileInline {
  inline_data: {
    display_name?: string;
    mime_type: string;
    data: string;
  };
}

export type MessageFile = MessageFileInline;

export interface MessageText {
  text: string;
}

// ========================== TYPES WORKSPACE ==============================

export interface Workspace {
  id: string;
  name: string;
  color: string;
  hexColor: string;
}

// ========================== TYPES SESSION (pour le chat) ==============================

export interface Session {
  id: string;
  workspace_id: string;
  app_name: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  session_id: string;
  author: 'user' | 'agent';
  text: string;
  timestamp: Date;
  partial?: boolean;
  isError?: boolean;
}

// ========================== TYPES EMPLOYEE (pour les agents IA) ==============================

export interface Employee {
  id: string;
  name: string;
  hexColor: string;
  description: string;
}

// ========================== TYPES USER ==============================

export interface User {
  id: string;
  name: string;
  profilePhotoUrl?: string | null;
}

// ========================== TYPES COMMENT ==============================

export interface CommentType {
  id: string;
  workspace_id: string;
  user_id: string;
  user: User;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCommentType {
  content: string;
  user_id: string;
}

export interface UpdateCommentType {
  content: string;
}

// Enum pour le tri des commentaires
export enum CommentSortOrder {
  NEWEST = 'newest',
  OLDEST = 'oldest'
}

// Constante pour la pagination
export const COMMENTS_PER_PAGE = 20;