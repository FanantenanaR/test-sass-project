import { TextRepository } from './textRepository.js';

// Singleton instance - déclaré comme undefined pour éviter l'initialisation au build
let textRepo: TextRepository | undefined;

// Getter with lazy initialization
export function getTextRepository(): TextRepository {
  if (!textRepo) {
    textRepo = new TextRepository();
  }
  return textRepo;
}

// Cleanup function for testing purposes
export function clearRepositories(): void {
  textRepo = undefined;
} 



