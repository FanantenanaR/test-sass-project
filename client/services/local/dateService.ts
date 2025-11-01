/**
 * Service centralisé pour la gestion des dates
 * ✅ TOUJOURS utiliser DateService au lieu de formater les dates directement
 */

export class DateService {
  /**
   * Formate une date pour l'affichage dans le chat/sessions
   * @param date - Date à formater
   * @returns Date formatée (ex: "15/01/2024 à 14:30")
   */
  static formatChatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formate une date pour l'affichage dans l'historique des sessions
   * @param date - Date à formater
   * @returns Date formatée (ex: "15 janvier 2024 à 14:30")
   */
  static formatSessionDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formattedDate = dateObj.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${formattedDate} à ${formattedTime}`;
  }

  /**
   * Formate une date relative (ex: "Il y a 5 minutes", "Il y a 2 heures")
   * @param date - Date à formater
   * @returns Date relative formatée
   */
  static formatTimeSince(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Il y a moins d\'une minute';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }

    // Au-delà d'une semaine, utiliser formatSessionDate
    return this.formatSessionDate(dateObj);
  }

  /**
   * Convertit une heure GMT en heure locale
   * @param gmtTime - Heure en GMT
   * @returns Date en heure locale
   */
  static convertGMTToLocal(gmtTime: string | Date): Date {
    const dateObj = typeof gmtTime === 'string' ? new Date(gmtTime) : gmtTime;
    // Les dates JavaScript sont déjà en heure locale, cette fonction est pour la cohérence
    return dateObj;
  }

  /**
   * Convertit une heure locale en GMT
   * @param localTime - Heure locale
   * @returns Date en GMT
   */
  static convertLocalToGMT(localTime: Date | string): Date {
    const dateObj = typeof localTime === 'string' ? new Date(localTime) : localTime;
    // Retourne une nouvelle Date avec les mêmes valeurs mais interprétées comme UTC
    return new Date(dateObj.toISOString());
  }

  /**
   * Normalise une date à minuit GMT pour la stabilité du cache React Query
   * @param date - Date à normaliser
   * @returns Date normalisée à minuit GMT (00:00:00.000Z)
   */
  static normalizeToMidnightGMT(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth();
    const day = dateObj.getUTCDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
}

