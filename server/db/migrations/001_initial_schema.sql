-- ========================== CRÉATION UTILISATEUR ET BASE ==========================

-- Créer l'utilisateur (à exécuter en tant que superuser PostgreSQL)
-- CREATE USER test WITH PASSWORD 'test';

-- Créer la base de données
-- CREATE DATABASE agentova OWNER test;

-- Se connecter à la base agentova et exécuter le reste :

-- ========================== EXTENSIONS ==========================

-- Extension UUID pour générer des IDs automatiques
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================== TABLE WORSPACES ==========================

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  owner_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);

-- ========================== TABLE USERS ==========================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  profile_photo_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insérer utilisateur demo
INSERT INTO users (id, name, profile_photo_url) 
VALUES ('demo-user-123', 'Utilisateur Demo', NULL)
ON CONFLICT (id) DO NOTHING;

-- ========================== TABLE TEXTS ==========================

CREATE TABLE IF NOT EXISTS texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_texts_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_texts_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_texts_workspace ON texts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_texts_created_at ON texts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_texts_created_by ON texts(created_by);

-- ========================== TABLE COMMENTS ==========================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL CHECK (LENGTH(TRIM(content)) > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_comments_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_comments_workspace ON comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- ========================== DONNÉES DE DÉMONSTRATION ==========================

-- Insérer workspace demo
INSERT INTO workspaces (id, name, color, owner_id) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Workspace Demo', '#3B82F6', 'demo-user-123')
ON CONFLICT DO NOTHING;

-- Insérer workspace demo 2
INSERT INTO workspaces (id, name, color, owner_id) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Test Workspace', '#10B981', 'demo-user-123')
ON CONFLICT DO NOTHING;
