
import { Card, CardType, CardStatus } from '../shared/types';

class CardService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getCards(): Promise<Card[]> {
    await this.delay(600);
    const saved = localStorage.getItem('piyes_cards');
    if (saved) return JSON.parse(saved);

    const initial: Card[] = [
      {
        id: 'c1',
        type: CardType.PHYSICAL,
        brand: 'piyes',
        lastFour: '8829',
        expiryDate: '09/28',
        status: CardStatus.ACTIVE,
        color: '#830AD1',
        nameOnCard: 'USER TEST',
        cvv: '***',
        limit: 50000,
        isFrozen: false,
        settings: { onlinePayments: true, international: true, contactless: true }
      }
    ];
    return initial;
  }

  /**
   * Simule un tunnel sécurisé PCI-DSS pour récupérer les infos réelles
   */
  async getCardSensitiveData(cardId: string): Promise<{ pan: string; cvv: string }> {
    await this.delay(1500); // Latence plus longue pour simuler le déchiffrement serveur
    return {
      pan: `4000 1234 5678 ${Math.floor(1000 + Math.random() * 9000)}`,
      cvv: Math.floor(100 + Math.random() * 899).toString()
    };
  }

  async updateCardLimit(cardId: string, limit: number): Promise<boolean> {
    await this.delay(1000);
    console.log(`[API] Limit updated for ${cardId} to ${limit}`);
    return true;
  }

  async freezeCard(cardId: string, shouldFreeze: boolean): Promise<boolean> {
    await this.delay(800);
    const cards = await this.getCards();
    const updated = cards.map(c => c.id === cardId ? { ...c, isFrozen: shouldFreeze } : c);
    localStorage.setItem('piyes_cards', JSON.stringify(updated));
    return true;
  }

  async deleteCard(cardId: string): Promise<boolean> {
    await this.delay(800);
    const cards = await this.getCards();
    const filtered = cards.filter(c => c.id !== cardId);
    localStorage.setItem('piyes_cards', JSON.stringify(filtered));
    return true;
  }

  async createVirtualCard(name: string, isTemporary: boolean = false): Promise<Card> {
    await this.delay(2000);
    const now = new Date();
    const expiry = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${(now.getFullYear() % 100 + (isTemporary ? 0 : 5)).toString()}`;
    
    const newCard: Card = {
      id: 'c-v-' + Date.now(),
      type: CardType.VIRTUAL,
      brand: 'piyes',
      lastFour: Math.floor(1000 + Math.random() * 9000).toString(),
      expiryDate: expiry,
      status: CardStatus.ACTIVE,
      color: isTemporary ? '#1C1C1C' : '#830AD1',
      nameOnCard: name.toUpperCase(),
      cvv: '***',
      limit: 10000,
      isFrozen: false,
      settings: { onlinePayments: true, international: true, contactless: false }
    };

    const cards = await this.getCards();
    localStorage.setItem('piyes_cards', JSON.stringify([...cards, newCard]));
    return newCard;
  }
}

export const cardService = new CardService();
