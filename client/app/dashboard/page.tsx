'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AI_EMPLOYEES } from '@/data/ai-employees';
import { useTexts } from '@/hooks/useTexts';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { RiAddLine, RiDeleteBinLine, RiEditLine } from 'react-icons/ri';
import { CommentSortOrder, CommentType } from '../../../shared/types';
import { ClientTextType } from '@/services/api/textService';
import { DateService } from '@/services/local/dateService';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { texts, createText, deleteText, isLoading, isCreating, isDeleting } = useTexts();
  const {
    comments,
    total,
    isLoading: isLoadingComments,
    isRefetching: isRefetchingComments,
    isCreating: isCreatingComment,
    isUpdating: isUpdatingComment,
    isDeleting: isDeletingComment,
    hasMore,
    loadMore,
    sortOrder,
    changeSortOrder,
    createComment,
    updateComment,
    deleteComment,
    canEditComment
  } = useComments();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  
  // ✅ État pour les commentaires optimistes (affichage immédiat avec opacité réduite)
  const [optimisticComments, setOptimisticComments] = useState<CommentType[]>([]);
  
  // ✅ État pour les textes optimistes (création)
  const [optimisticTexts, setOptimisticTexts] = useState<ClientTextType[]>([]);
  
  // ✅ États pour les suppressions optimistes (textes et commentaires)
  const [deletingTextIds, setDeletingTextIds] = useState<Set<string>>(new Set());
  const [deletingCommentIds, setDeletingCommentIds] = useState<Set<string>>(new Set());
  
  // ✅ États pour les modifications optimistes (commentaires)
  const [updatingComments, setUpdatingComments] = useState<Map<string, CommentType>>(new Map());

  // ✅ Supprimer automatiquement les commentaires optimistes quand le vrai commentaire arrive
  useEffect(() => {
    // ✅ Vérifier uniquement quand les commentaires changent (pas quand optimisticComments change)
    setOptimisticComments(prev => {
      if (prev.length === 0) {
        return prev; // Pas de commentaires optimistes à vérifier
      }
      
      // ✅ Filtrer les commentaires optimistes : garder seulement ceux qui ne sont PAS dans comments
      const filtered = prev.filter(optimistic => {
        // ✅ Vérifier si un commentaire réel correspond exactement au commentaire optimiste
        const matchingComment = comments.find(c => {
          // Matching précis : même contenu ET même utilisateur
          const contentMatches = c.content.trim() === optimistic.content.trim();
          const userMatches = c.user_id === optimistic.user_id;
          
          // ✅ Si les deux correspondent, c'est le même commentaire (optimiste → réel)
          return contentMatches && userMatches;
        });
        
        // ✅ Garder seulement les optimistes qui n'ont PAS de correspondance réelle
        // Si matchingComment existe, on supprime l'optimiste (return false)
        // Si pas de matchingComment, on garde l'optimiste (return true)
        return !matchingComment;
      });
      
      // ✅ Retourner le tableau filtré (même si vide)
      return filtered;
    });
  }, [comments]); // ✅ Dépendance uniquement sur comments (se déclenche quand comments change)

  // ✅ Supprimer automatiquement les textes optimistes quand le vrai texte arrive
  useEffect(() => {
    setOptimisticTexts(prev => {
      if (prev.length === 0) {
        return prev;
      }
      
      // ✅ Filtrer les textes optimistes : garder seulement ceux qui ne sont PAS dans texts
      const filtered = prev.filter(optimistic => {
        // ✅ Vérifier si un texte réel correspond exactement au texte optimiste
        const matchingText = texts.find(t => {
          // Matching précis : même contenu ET même titre (si présent)
          const contentMatches = t.content.trim() === optimistic.content.trim();
          const titleMatches = (t.title || '').trim() === (optimistic.title || '').trim();
          
          return contentMatches && titleMatches;
        });
        
        return !matchingText;
      });
      
      return filtered;
    });
  }, [texts]); // ✅ Dépendance uniquement sur texts

  // ✅ Nettoyer les commentaires en cours de modification quand le vrai commentaire arrive
  useEffect(() => {
    setUpdatingComments(prev => {
      const next = new Map(prev);
      let hasChanges = false;
      
      // ✅ Vérifier chaque commentaire en cours de modification
      prev.forEach((optimisticComment, commentId) => {
        const realComment = comments.find(c => c.id === commentId);
        if (realComment) {
          // ✅ Si le contenu correspond, la modification est terminée
          if (realComment.content.trim() === optimisticComment.content.trim()) {
            next.delete(commentId);
            hasChanges = true;
          }
        }
      });
      
      return hasChanges ? next : prev;
    });
  }, [comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.content.trim()) {
      const trimmedTitle = formData.title.trim() || '';
      const trimmedContent = formData.content.trim();
      
      // ✅ Créer un texte optimiste avec ID temporaire
      const optimisticId = `optimistic-text-${Date.now()}`;
      const optimisticText: ClientTextType = {
        id: optimisticId,
        workspace_id: '', // Sera rempli par le backend
        title: trimmedTitle,
        content: trimmedContent,
        created_by: user?.uid || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // ✅ Ajouter le texte optimiste à l'état
      setOptimisticTexts(prev => [optimisticText, ...prev]);
      
      // ✅ Créer le texte réel
      createText({
        title: trimmedTitle || undefined,
        content: trimmedContent
      });
      
      setFormData({ title: '', content: '' });
      setShowForm(false);
    }
  };

  const handleDelete = (textId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce texte ?')) {
      // ✅ Marquer comme en cours de suppression (opacité réduite)
      setDeletingTextIds(prev => new Set([...prev, textId]));
      
      // ✅ Supprimer le texte réel
      deleteText(textId);
      
      // ✅ Retirer du set après un délai (le backend va supprimer de texts automatiquement)
      setTimeout(() => {
        setDeletingTextIds(prev => {
          const next = new Set(prev);
          next.delete(textId);
          return next;
        });
      }, 1000);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = commentContent.trim();
    if (trimmedContent && user) {
      // ✅ Créer un commentaire optimiste avec ID temporaire
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticComment: CommentType = {
        id: optimisticId,
        workspace_id: '', // Sera rempli par le backend
        user_id: user.uid,
        user: {
          id: user.uid,
          name: user.displayName || 'Vous',
          profilePhotoUrl: null
        },
        content: trimmedContent,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // ✅ Ajouter le commentaire optimiste à l'état
      setOptimisticComments(prev => [optimisticComment, ...prev]);
      
      // ✅ Créer le commentaire réel
      createComment({
        content: trimmedContent,
        user_id: user.uid
      });
      
      setCommentContent('');
      setShowCommentForm(false);
    }
  };

  const handleEditComment = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  const handleSaveEdit = (commentId: string) => {
    const trimmedContent = editCommentContent.trim();
    if (trimmedContent) {
      // ✅ Trouver le commentaire original pour créer une version optimiste
      const originalComment = comments.find(c => c.id === commentId);
      if (originalComment) {
        const optimisticComment: CommentType = {
          ...originalComment,
          content: trimmedContent,
          updated_at: new Date()
        };
        
        // ✅ Ajouter à la map des commentaires en cours de modification
        setUpdatingComments(prev => new Map(prev).set(commentId, optimisticComment));
      }
      
      // ✅ Mettre à jour le commentaire réel
      updateComment(commentId, { content: trimmedContent });
      
      setEditingCommentId(null);
      setEditCommentContent('');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      // ✅ Marquer comme en cours de suppression (opacité réduite)
      setDeletingCommentIds(prev => new Set([...prev, commentId]));
      
      // ✅ Supprimer le commentaire réel
      deleteComment(commentId);
      
      // ✅ Retirer du set après un délai (le backend va supprimer de comments automatiquement)
      setTimeout(() => {
        setDeletingCommentIds(prev => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard - Test Technique
          </h1>
          <p className="text-gray-600">
            Gestion des textes avec architecture du projet (Services + Hooks + Composants)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section Agents IA */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Agents IA Disponibles
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {AI_EMPLOYEES.map((employee) => (
                <div 
                  key={employee.name} 
                  className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity p-4 rounded-lg border border-gray-200 hover:border-gray-300"
                  onClick={() => router.push(`/dashboard/employees/${employee.id}/chat`)}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold mb-2"
                    style={{ backgroundColor: employee.hexColor }}
                  >
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center">
                    {employee.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section Gestion des Textes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Gestion des Textes
              </h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={isCreating}
              >
                <RiAddLine className="w-4 h-4" />
                Nouveau texte
              </button>
            </div>

            {/* Formulaire de création */}
            {showForm && (
              <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Titre du texte..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Contenu du texte..."
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!formData.content.trim() || isCreating}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Création...' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {/* Liste des textes */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Chargement des textes...</p>
                </div>
              ) : (
                <>
                  {/* ✅ Afficher les textes optimistes (création) */}
                  {optimisticTexts.map((optimisticText) => (
                    <div
                      key={optimisticText.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors opacity-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">
                          {optimisticText.title || 'Sans titre'}
                          <span className="ml-2 text-xs text-gray-400 italic">(en cours de création...)</span>
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{optimisticText.content}</p>
                    </div>
                  ))}
                  
                  {/* ✅ Afficher les textes réels */}
                  {(texts.length === 0 && optimisticTexts.length === 0) ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Aucun texte enregistré.</p>
                      <p className="text-sm">Créez votre premier texte pour commencer !</p>
                    </div>
                  ) : (
                    texts.map((text) => {
                      // ✅ Vérifier si le texte est en cours de suppression
                      const isDeleting = deletingTextIds.has(text.id);
                      
                      return (
                        <div
                          key={text.id}
                          className={`border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors ${
                            isDeleting ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-900">
                              {text.title || 'Sans titre'}
                              {isDeleting && (
                                <span className="ml-2 text-xs text-gray-400 italic">(suppression...)</span>
                              )}
                            </h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(text.id)}
                                disabled={deletingTextIds.has(text.id) || isDeleting}
                                className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                                title="Supprimer"
                              >
                                <RiDeleteBinLine className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{text.content}</p>
                          <p className="text-xs text-gray-400">
                            Créé le {DateService.formatSessionDate(text.created_at)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Section Commentaires - Section horizontale complète */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Commentaires {total > 0 && `(${total})`}
                {/* ✅ Loading lors du changement de tri */}
                {isRefetchingComments && (
                  <span className="ml-2 inline-block">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </span>
                )}
              </h2>
              <div className="flex gap-2">
                <select
                  value={sortOrder}
                  onChange={(e) => changeSortOrder(e.target.value as CommentSortOrder)}
                  disabled={isRefetchingComments}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={CommentSortOrder.NEWEST}>Plus récents</option>
                  <option value={CommentSortOrder.OLDEST}>Plus anciens</option>
                </select>
                <button
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isCreatingComment}
                >
                  <RiAddLine className="w-4 h-4" />
                  Commenter
                </button>
              </div>
            </div>

            {/* Formulaire de création de commentaire */}
            {showCommentForm && (
              <form onSubmit={handleCommentSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre commentaire *
                  </label>
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Écrivez votre commentaire..."
                    maxLength={2000}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {commentContent.length}/2000 caractères
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!commentContent.trim() || isCreatingComment}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingComment ? 'Publication...' : 'Publier'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCommentForm(false);
                      setCommentContent('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {/* Liste des commentaires */}
            <div className="space-y-4">
              {isLoadingComments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Chargement des commentaires...</p>
                </div>
              ) : (
                <>
                  {/* ✅ Afficher les commentaires optimistes (déjà filtrés par useEffect) */}
                  {optimisticComments.map((optimisticComment) => {
                    return (
                      <div
                        key={optimisticComment.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors opacity-50"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-shrink-0">
                            {optimisticComment.user.profilePhotoUrl ? (
                              <img
                                src={optimisticComment.user.profilePhotoUrl}
                                alt={optimisticComment.user.name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                {optimisticComment.user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              {optimisticComment.user.name}
                            </p>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap break-words">
                              {optimisticComment.content}
                            </p>
                            <p className="text-xs text-gray-400 mt-2 italic">
                              Publication en cours...
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* ✅ Afficher les commentaires réels */}
                  {comments.length === 0 && optimisticComments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Aucun commentaire.</p>
                      <p className="text-sm">Soyez le premier à commenter !</p>
                    </div>
                  ) : (
                    comments.map((comment) => {
                      // ✅ Vérifier si le commentaire est en cours de modification ou suppression
                      const isUpdating = updatingComments.has(comment.id);
                      const isDeleting = deletingCommentIds.has(comment.id);
                      
                      // ✅ Utiliser la version optimiste si en cours de modification
                      const displayComment = isUpdating ? updatingComments.get(comment.id)! : comment;
                      
                      return (
                      <div
                        key={comment.id}
                        className={`border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors ${
                          isDeleting ? 'opacity-50' : ''
                        }`}
                      >
                      {editingCommentId === comment.id ? (
                        // Mode édition
                        <div>
                          <textarea
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            rows={3}
                            maxLength={2000}
                          />
                          <p className="text-xs text-gray-500 mb-2">
                            {editCommentContent.length}/2000 caractères
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={!editCommentContent.trim() || isUpdatingComment}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                              {isUpdatingComment ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Mode affichage
                        <>
                          <div className="flex items-start gap-3 mb-2">
                            <div className="flex-shrink-0">
                              {displayComment.user.profilePhotoUrl ? (
                                <img
                                  src={displayComment.user.profilePhotoUrl}
                                  alt={displayComment.user.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                  {displayComment.user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm">
                                {displayComment.user.name}
                                {isUpdating && (
                                  <span className="ml-2 text-xs text-gray-400 italic">(modification...)</span>
                                )}
                                {isDeleting && (
                                  <span className="ml-2 text-xs text-gray-400 italic">(suppression...)</span>
                                )}
                              </p>
                              <p className="text-gray-600 text-sm whitespace-pre-wrap break-words">
                                {displayComment.content}
                              </p>
                            </div>
                            {canEditComment(comment) && !isDeleting && (
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  disabled={isUpdatingComment || isDeletingComment || isUpdating || isDeleting}
                                  className="text-blue-600 hover:text-blue-800 p-1 disabled:opacity-50"
                                  title="Modifier"
                                >
                                  <RiEditLine className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={isDeletingComment || isUpdatingComment || isDeleting}
                                  className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                                  title="Supprimer"
                                >
                                  <RiDeleteBinLine className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                            <span>
                              {displayComment.created_at === displayComment.updated_at ? (
                                <>Créé le {DateService.formatSessionDate(displayComment.created_at)}</>
                              ) : (
                                <>Modifié le {DateService.formatSessionDate(displayComment.updated_at)}</>
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                      );
                    })
                  )}
                  
                  {/* Bouton "Voir plus" pour infinite scroll */}
                  {hasMore && (
                    <div className="text-center pt-4">
                      <button
                        onClick={loadMore}
                        disabled={isLoadingComments}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
                      >
                        {isLoadingComments ? 'Chargement...' : 'Voir plus'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 