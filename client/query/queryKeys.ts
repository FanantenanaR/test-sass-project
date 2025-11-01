export const QUERY_KEYS_STRINGS = {
  WORKSPACES: 'workspaces',
  WORKSPACE: 'workspace',
  SESSIONS: 'sessions',
  MESSAGES: 'messages',
  TEXTS: 'texts',
  COMMENTS: 'comments'
}

export const queryKeys = {
  workspace: {
    all: [QUERY_KEYS_STRINGS.WORKSPACES] as const,
    detail: (id: string) => [QUERY_KEYS_STRINGS.WORKSPACE, id] as const,
    sessions: (id: string, appName: string) => [QUERY_KEYS_STRINGS.WORKSPACE, id, QUERY_KEYS_STRINGS.SESSIONS, appName] as const
  },
  session: {
    detail: (id: string) => [QUERY_KEYS_STRINGS.SESSIONS, id] as const,
    messages: (id: string) => [QUERY_KEYS_STRINGS.SESSIONS, id, QUERY_KEYS_STRINGS.MESSAGES] as const
  },
  texts: {
    all: (workspaceId: string) => [QUERY_KEYS_STRINGS.TEXTS, workspaceId] as const,
    detail: (id: string) => [QUERY_KEYS_STRINGS.TEXTS, id] as const
  },
  comments: {
    all: (workspaceId: string, sortOrder?: string) => 
      [QUERY_KEYS_STRINGS.COMMENTS, workspaceId, sortOrder || 'newest'] as const,
    detail: (id: string) => [QUERY_KEYS_STRINGS.COMMENTS, id] as const
  }
}; 