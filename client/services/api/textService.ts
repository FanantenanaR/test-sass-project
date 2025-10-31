import { callSecuredFunction } from '@/services/local/authenticationService';
import { CreateTextType } from '../../../shared/types';

/**
 * Service de gestion des textes côté client
 * 🔧 VERSION DEMO - Service de test pour enregistrer et récupérer des textes
 */

// Type client avec dates en string (sérialisées depuis JSON)
export interface ClientTextType {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string; // ISO string depuis JSON
  updated_at: string; // ISO string depuis JSON
}

// Types spécifiques au client
export interface CreateTextRequest {
  title?: string;
  content: string;
}

export interface TextsResponse {
  texts: ClientTextType[];
}

export interface TextResponse {
  text: ClientTextType;
}

export interface DeleteTextResponse {
  deleted: boolean;
}

export class TextService {
  /**
   * Créer un nouveau texte
   * 🔧 VERSION DEMO - Utilise callSecuredFunction (version fantôme)
   */
  static async createText(
    workspaceId: string,
    data: CreateTextRequest
  ): Promise<ClientTextType> {
    try {
      // ✅ Utilisation du pattern callSecuredFunction
      const response = await callSecuredFunction<TextResponse>(
        'createText',
        workspaceId,
        data
      );
      
      // 🔧 VERSION DEMO - callSecuredFunction retourne un objet mocké
      // En production, ceci sera la vraie réponse Firebase
      return response.text || {
        id: `text-${Date.now()}`,
        workspace_id: workspaceId,
        title: data.title || 'Sans titre',
        content: data.content,
        created_by: 'demo-user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur création texte:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les textes d'un workspace
   * 🔧 VERSION DEMO - Fonction fantôme qui simule la récupération
   */
  static async getTexts(workspaceId: string): Promise<ClientTextType[]> {
    try {
      // ✅ Utilisation du pattern callSecuredFunction
      const response = await callSecuredFunction<TextsResponse>(
        'getTexts',
        workspaceId
      );
      
      // 🔧 VERSION DEMO - callSecuredFunction retourne un objet mocké
      // En production, ceci sera la vraie réponse Firebase
      if (response.texts && response.texts.length > 0) {
        return response.texts;
      }
      
      // Fallback avec textes simulés pour la démo
      const mockTexts: ClientTextType[] = [
        {
          id: 'text-1',
          workspace_id: workspaceId,
          title: 'Premier texte de démonstration',
          content: 'Ceci est un exemple de texte enregistré dans le système. Il sert à tester l\'architecture et les patterns de développement.',
          created_by: 'demo-user-123',
          created_at: new Date(Date.now() - 86400000).toISOString(), // Hier
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'text-2',
          workspace_id: workspaceId,
          title: 'Deuxième exemple',
          content: 'Un autre texte pour montrer la liste et les fonctionnalités CRUD de base.',
          created_by: 'demo-user-123',
          created_at: new Date(Date.now() - 3600000).toISOString(), // Il y a 1h
          updated_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'text-3',
          workspace_id: workspaceId,
          title: 'Test technique',
          content: 'Ce texte démontre l\'utilisation des services, hooks et composants selon les règles d\'architecture Agentova.',
          created_by: 'demo-user-123',
          created_at: new Date().toISOString(), // Maintenant
          updated_at: new Date().toISOString()
        }
      ];
      
      return mockTexts;
    } catch (error) {
      console.error('Erreur récupération textes:', error);
      throw error;
    }
  }

  /**
   * Supprimer un texte
   * 🔧 VERSION DEMO - Utilise callSecuredFunction (version fantôme)
   */
  static async deleteText(
    workspaceId: string,
    textId: string
  ): Promise<boolean> {
    try {
      // ✅ Utilisation du pattern callSecuredFunction
      const response = await callSecuredFunction<DeleteTextResponse>(
        'deleteText',
        workspaceId,
        { textId }
      );
      
      // 🔧 VERSION DEMO - callSecuredFunction retourne un objet mocké
      // En production, ceci sera la vraie réponse Firebase
      return response.deleted ?? true;
    } catch (error) {
      console.error('Erreur suppression texte:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un texte
   * 🔧 VERSION DEMO - Fonction fantôme qui simule la mise à jour
   */
  static async updateText(
    workspaceId: string,
    textId: string,
    data: Partial<CreateTextRequest>
  ): Promise<ClientTextType> {
    try {
      // ✅ Utilisation du pattern callSecuredFunction
      const response = await callSecuredFunction<TextResponse>(
        'updateText',
        workspaceId,
        { textId, ...data }
      );
      
      // 🔧 VERSION DEMO - callSecuredFunction retourne un objet mocké
      // En production, ceci sera la vraie réponse Firebase
      if (response.text) {
        return response.text;
      }
      
      // Fallback avec texte simulé pour la démo
      const mockUpdatedText: ClientTextType = {
        id: textId,
        workspace_id: workspaceId,
        title: data.title || 'Titre mis à jour',
        content: data.content || 'Contenu mis à jour',
        created_by: 'demo-user-123',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString() // Maintenant
      };
      
      return mockUpdatedText;
    } catch (error) {
      console.error('Erreur mise à jour texte:', error);
      throw error;
    }
  }
}
