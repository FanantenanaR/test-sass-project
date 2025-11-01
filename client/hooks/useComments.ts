import { useCallback, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { CommentService, CommentsResponse } from '@/services/api/commentService';
import { queryKeys } from '@/query/queryKeys';
import { CommentType, CreateCommentType, UpdateCommentType, CommentSortOrder, COMMENTS_PER_PAGE } from '../../shared/types';

/**
 * Hook pour la gestion des commentaires
 * ✅ Pattern React Query avec infinite scroll et tri
 */
export function useComments() {
  // ✅ Context workspace obligatoire
  const { currentWorkspaceId } = useWorkspaceContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // ✅ État pour le tri
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>(CommentSortOrder.NEWEST);

  // ✅ Infinite Query pour pagination avec "voir plus"
  const commentsQuery = useInfiniteQuery<CommentsResponse>({
    queryKey: queryKeys.comments.all(currentWorkspaceId, sortOrder),
    queryFn: ({ pageParam = 0 }) => 
      CommentService.getComments(currentWorkspaceId, {
        limit: COMMENTS_PER_PAGE,
        offset: pageParam as number,
        sortOrder
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length * COMMENTS_PER_PAGE;
      }
      return undefined;
    },
    staleTime: 0,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData
  });

  // ✅ Flatten des pages pour obtenir la liste complète
  const comments = commentsQuery.data?.pages.flatMap(page => page.comments) || [];
  const total = commentsQuery.data?.pages[0]?.total || 0;
  const hasMore = commentsQuery.hasNextPage;
  // ✅ Mutation création avec gestion cache
  const createMutation = useMutation({
    mutationFn: (data: CreateCommentType) => 
      CommentService.createComment(currentWorkspaceId, data),
    onSuccess: (newComment) => {
      // Invalider la query pour recharger les commentaires
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.all(currentWorkspaceId, sortOrder)
      });
    }
  });

  // ✅ Mutation mise à jour avec gestion cache
  const updateMutation = useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentType }) =>
      CommentService.updateComment(currentWorkspaceId, commentId, data),
    onSuccess: () => {
      // Invalider la query pour recharger les commentaires
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.all(currentWorkspaceId, sortOrder)
      });
    }
  });

  // ✅ Mutation suppression avec gestion cache
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => 
      CommentService.deleteComment(currentWorkspaceId, commentId),
    onSuccess: () => {
      // Invalider la query pour recharger les commentaires
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.all(currentWorkspaceId, sortOrder)
      });
    }
  });

  // ✅ Fonctions utilitaires avec useCallback
  const createComment = useCallback((data: CreateCommentType) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const updateComment = useCallback((commentId: string, data: UpdateCommentType) => {
    updateMutation.mutate({ commentId, data });
  }, [updateMutation]);

  const deleteComment = useCallback((commentId: string) => {
    deleteMutation.mutate(commentId);
  }, [deleteMutation]);

  const loadMore = useCallback(async () => {
    if (hasMore && !commentsQuery.isFetchingNextPage) {
      await commentsQuery.fetchNextPage();
    }
  }, [hasMore, commentsQuery]);

  const changeSortOrder = useCallback((newSortOrder: CommentSortOrder) => {
    setSortOrder(newSortOrder);
    // Invalider les queries pour forcer le rechargement avec le nouveau tri
    queryClient.invalidateQueries({
      queryKey: queryKeys.comments.all(currentWorkspaceId)
    });
  }, [currentWorkspaceId, queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.comments.all(currentWorkspaceId, sortOrder)
    });
  }, [currentWorkspaceId, sortOrder, queryClient]);

  // ✅ Vérifier si l'utilisateur peut modifier/supprimer un commentaire
  const canEditComment = useCallback((comment: CommentType) => {
    return user?.uid === comment.user_id;
  }, [user]);

  // ✅ Return organisé par catégorie
  return {
    // Data
    comments,
    total,
    // Loading states
    isLoading: commentsQuery.isLoading,
    isRefetching: commentsQuery.isRefetching,
    isFetchingNextPage: commentsQuery.isFetchingNextPage,
    isError: commentsQuery.isError,
    error: commentsQuery.error,
    // Pagination
    hasMore,
    loadMore,
    // Tri
    sortOrder,
    changeSortOrder,
    // Actions
    createComment,
    updateComment,
    deleteComment,
    // Action states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    // Utils
    refresh,
    canEditComment
  };
}

