/**
 * Formate une heure en « 14:32 » dans un fuseau horaire donné.
 * @param {Date} date
 * @param {string} timeZone Par exemple « Europe/Paris ».
 * @returns {string}
 */
export function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone }).format(date);
}
