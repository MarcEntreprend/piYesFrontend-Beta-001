// shared/money.ts

/**
 * Convertit un montant en centimes (entier) en chaîne d'affichage.
 * Exemple: 8451467 → "84 514,67"
 */
export function displayMoney(cents: number): string {
    if (cents === undefined || cents === null) return "0,00";
    const amount = cents / 100;
    // Formater avec virgule décimale et espace insécable comme séparateur millier
    return amount.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
    });
}

/**
 * Convertit une saisie utilisateur (ex: "84 514,67" ou "84514,67" ou "84514.67") en centimes.
 * Retourne un entier.
 */
export function parseMoneyInputToCents(input: string): number {
    if (!input) return 0;
    // Nettoyer : supprimer les espaces, remplacer éventuelle virgule par un point
    let cleaned = input.replace(/\s/g, "").replace(",", ".");
    // Si après nettoyage c'est vide, retour 0
    if (!cleaned) return 0;
    const number = parseFloat(cleaned);
    if (isNaN(number)) return 0;
    // Arrondir pour éviter les erreurs flottantes (ex: 84.51467 * 100)
    return Math.round(number * 100);
}