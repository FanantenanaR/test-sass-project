import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { TextService, ClientTextType, CreateTextRequest } from '@/services/api/textService';
import { queryKeys } from '@/query/queryKeys';

/**
 * Hook pour la gestion des textes
 * 🔧 VERSION DEMO - Hook suivant les patterns du projet
 */
export function useTexts() {
  // ✅ Context workspace obligatoire
  const { currentWorkspaceId } = useWorkspaceContext();
  const queryClient = useQueryClient();

  // ✅ React Query avec clés standardisées
  const textsQuery = useQuery({
    queryKey: queryKeys.texts.all(currentWorkspaceId),
    queryFn: () => TextService.getTexts(currentWorkspaceId),
    staleTime: 0,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData
  });

  // ✅ Mutation création avec gestion cache
  const createMutation = useMutation({
    mutationFn: (data: CreateTextRequest) => 
      TextService.createText(currentWorkspaceId, data),
    onSuccess: (newText) => {
      // Ajouter le nouveau texte au cache
      queryClient.setQueryData<ClientTextType[]>(
        queryKeys.texts.all(currentWorkspaceId),
        (old) => old ? [newText, ...old] : [newText]
      );
    }
  });

  // ✅ Mutation suppression avec gestion cache
  const deleteMutation = useMutation({
    mutationFn: (textId: string) => 
      TextService.deleteText(currentWorkspaceId, textId),
    onSuccess: (_, textId) => {
      // Supprimer le texte du cache
      queryClient.setQueryData<ClientTextType[]>(
        queryKeys.texts.all(currentWorkspaceId),
        (old) => old ? old.filter(text => text.id !== textId) : []
      );
    }
  });

  // ✅ Mutation mise à jour avec gestion cache
  const updateMutation = useMutation({
    mutationFn: ({ textId, data }: { textId: string; data: Partial<CreateTextRequest> }) =>
      TextService.updateText(currentWorkspaceId, textId, data),
    onSuccess: (updatedText) => {
      // Mettre à jour le texte dans le cache
      queryClient.setQueryData<ClientTextType[]>(
        queryKeys.texts.all(currentWorkspaceId),
        (old) => old ? old.map(text => 
          text.id === updatedText.id ? updatedText : text
        ) : [updatedText]
      );
    }
  });

  // ✅ Fonctions utilitaires avec useCallback
  const createText = useCallback((data: CreateTextRequest) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const deleteText = useCallback((textId: string) => {
    deleteMutation.mutate(textId);
  }, [deleteMutation]);

  const updateText = useCallback((textId: string, data: Partial<CreateTextRequest>) => {
    updateMutation.mutate({ textId, data });
  }, [updateMutation]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.texts.all(currentWorkspaceId)
    });
  }, [currentWorkspaceId, queryClient]);

  // ✅ Return organisé par catégorie
  return {
    // Data
    texts: textsQuery.data || [],
    // Loading states
    isLoading: textsQuery.isLoading,
    isRefetching: textsQuery.isRefetching,
    isError: textsQuery.isError,
    error: textsQuery.error,
    // Actions
    createText,
    updateText,
    deleteText,
    // Action states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    // Utils
    refresh
  };
}

