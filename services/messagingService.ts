
import { Conversation, Message, Ad } from '../shared/types';

class MessagingService {
  private conversations: Conversation[] = [
    {
      id: 'conv1',
      adId: 'ad1',
      adTitle: 'iPhone 15 Pro Max',
      adPrice: 185000,
      adImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100&h=100&fit=crop',
      role: 'seller',
      counterparty: { id: 'u2', name: 'Alice Silva', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', isVerified: true },
      messages: [
        { id: 'm1', senderId: 'u2', text: "Bonjour, le prix est-il négociable ?", timestamp: '14:22' },
        { id: 'm2', senderId: 'u1', text: "Bonjour Alice, un peu oui. Quelle serait votre offre ?", timestamp: '14:25' }
      ],
      lastMessage: 'Bonjour, le prix est-il négociable ?',
      lastTime: '14:25',
      unreadCount: 2
    },
    {
      id: 'conv2',
      adId: 'ad2',
      adTitle: 'Honda Fit 2018',
      adPrice: 1350000,
      adImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=100&h=100&fit=crop',
      role: 'buyer',
      counterparty: { id: 's2', name: 'Marie Pierre', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie' },
      messages: [
        { id: 'm3', senderId: 'u1', text: "L'annonce est-elle toujours disponible ?", timestamp: 'Hier' },
        { id: 'm4', senderId: 's2', text: "D'accord, on se voit demain pour le test.", timestamp: 'Hier' }
      ],
      lastMessage: "D'accord, on se voit demain pour le test.",
      lastTime: 'Hier',
      unreadCount: 0
    },
    {
      id: 'conv3',
      adId: 'my_ad_1',
      adTitle: 'Lot de 4 chaises',
      adPrice: 2000,
      adImage: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=100&h=100&fit=crop',
      role: 'seller',
      counterparty: { id: 'u3', name: 'Marc Pierre', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marc' },
      messages: [
        { id: 'm5', senderId: 'u3', text: "Je suis intéressé par vos chaises à 2000 G", timestamp: '10:05' }
      ],
      lastMessage: "Je suis intéressé par vos chaises à 2000 G",
      lastTime: '10:05',
      unreadCount: 1
    }
  ];

  private myAds: Ad[] = [
    {
      id: 'my_ad_1',
      title: 'Lot de 4 chaises en bois',
      description: 'Chaises robustes, très bon état.',
      price: 2000,
      location: 'Pétion-Ville',
      category: 'Maison',
      images: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop'],
      rating: 5,
      date: '12 Mars 2025',
      seller: { id: 'u1', name: 'Moi', avatar: '', acceptsPiyes: true },
      views: 45,
      messages: 1
    },
    {
      id: 'my_ad_2',
      title: 'MacBook Pro M2',
      description: '16GB RAM, 512GB SSD. Comme neuf.',
      price: 150000,
      location: 'Pétion-Ville',
      category: 'Informatique',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop'],
      rating: 5,
      date: '15 Mars 2025',
      seller: { id: 'u1', name: 'Moi', avatar: '', acceptsPiyes: true },
      views: 120,
      messages: 0
    }
  ];

  async getConversations(): Promise<Conversation[]> {
    return [...this.conversations];
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    return this.conversations.find(c => c.id === id);
  }

  async getMyAds(): Promise<Ad[]> {
    return [...this.myAds];
  }

  async getConversationsForAd(adId: string): Promise<Conversation[]> {
    return this.conversations.filter(c => c.adId === adId);
  }

  async sendMessage(convId: string, text: string, senderId: string): Promise<Message> {
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      senderId,
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    const conv = this.conversations.find(c => c.id === convId);
    if (conv) {
      conv.messages.push(newMessage);
      conv.lastMessage = text;
      conv.lastTime = newMessage.timestamp;
    }

    return newMessage;
  }
}

export const messagingService = new MessagingService();
