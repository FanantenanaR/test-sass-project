'use client';

import React from 'react';
import { AIEmployee } from '@/data/ai-employees';
import { ModuleId } from '@/data/ai-employees';

/**
 * Props standardisées pour tous les modules
 * 
 * Interface commune que tous les modules doivent respecter
 */
export interface ModuleComponentProps {
  employee: AIEmployee;
  onModuleChange?: (moduleId: ModuleId) => void;
}

/**
 * Interface que tous les modules doivent implémenter
 * 
 * Chaque module doit :
 * - Avoir un moduleId statique (propriété du composant)
 * - Recevoir employee et onModuleChange comme props
 * - Retourner un composant React fonctionnel
 * 
 * Pattern conforme aux règles du projet :
 * - Props typées avec interface explicite
 * - Interface standardisée pour tous les modules
 */
export interface ModuleComponent extends React.FC<ModuleComponentProps> {
  moduleId: ModuleId;
}

/**
 * Helper pour créer un module conforme aux standards du projet
 * 
 * @param component - Le composant React du module
 * @param moduleId - L'ID du module (ModuleId enum)
 * @returns ModuleComponent configuré avec moduleId
 * 
 * Usage :
 * ```typescript
 * const MyModule = createModule(MyModuleComponent, ModuleId.MY_MODULE);
 * ```
 */
export function createModule(
  component: React.FC<ModuleComponentProps>,
  moduleId: ModuleId
): ModuleComponent {
  const ModuleComponent = component as ModuleComponent;
  ModuleComponent.moduleId = moduleId;
  return ModuleComponent;
}

