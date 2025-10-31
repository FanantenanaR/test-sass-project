'use client';

import React from 'react';
import { createModule, ModuleComponentProps } from './core/BaseModule';
import { ModuleId } from '@/data/ai-employees';
import { RiSendPlaneFill, RiMessage3Line } from 'react-icons/ri';

/**
 * Module Chat IA
 * 🔧 VERSION DEMO - Interface de chat simplifiée pour le test
 * 
 * Ce module permet de communiquer avec un agent IA via une interface de chat
 * Pattern conforme aux règles du projet :
 * - Props typées avec ModuleComponentProps
 * - Utilisation de createModule pour enregistrement
 */
const ChatModuleComponent: React.FC<ModuleComponentProps> = ({ employee, onModuleChange }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header du chat */}
      <div 
        className="bg-white border-b border-gray-200 p-4 flex items-center gap-4 shadow-sm"
        style={{ borderTop: `4px solid ${employee.hexColor}` }}
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md"
          style={{ backgroundColor: employee.hexColor }}
        >
          {employee.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 truncate">{employee.name}</h2>
          <p className="text-sm text-gray-500 truncate">{employee.role}</p>
        </div>
      </div>

      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-3xl mx-auto w-full">
          {/* Message de bienvenue */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: employee.hexColor }}
              >
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-gray-700 font-medium">
                  👋 Bonjour ! Je suis {employee.name}, votre {employee.role}.
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  🔧 VERSION DEMO - Interface de chat en cours de développement
                </p>
              </div>
            </div>
          </div>

          {/* Message informatif */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-4">
            <div className="flex items-start gap-3">
              <RiMessage3Line className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-600 text-sm">
                  Cette interface vous permettra de converser avec {employee.name} via l'IA.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Les fonctionnalités de chat complet seront disponibles prochainement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de saisie (non fonctionnelle en DEMO) */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Tapez votre message à ${employee.name}...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled
            />
            <button
              disabled
              className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center gap-2 hover:bg-gray-300 transition-colors"
            >
              <RiSendPlaneFill className="w-5 h-5" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            🔧 Fonctionnalité de chat en développement - Prochainement disponible
          </p>
        </div>
      </div>
    </div>
  );
};

// ✅ Créer le module avec createModule helper selon les règles du projet
const ChatModule = createModule(ChatModuleComponent, ModuleId.CHAT);

export default ChatModule;

