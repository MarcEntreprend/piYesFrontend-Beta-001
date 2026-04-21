
import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  User, 
  LayoutGrid, 
  QrCode,
  CreditCard,
  Home,
  Settings as SettingsIcon,
  Search,
  Calculator,
  Store
} from 'lucide-react';

export const COLORS = {
  purple: '#830AD1',
  purpleDark: '#6D08AF',
  purpleLight: '#9D3FE7',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#191919',
  textSecondary: '#767676'
};

export const QUICK_ACTIONS = [
  { id: 'transfer', label: 'Transférer', icon: <ArrowUpRight size={24} />, route: '/transfer' },
  { id: 'deposit', label: 'Dépôt', icon: <Plus size={24} />, route: '/deposit' },
  { id: 'qr_proximity', label: 'QR & Proximité', icon: <LayoutGrid size={24} />, route: '/keys' },
  { id: 'tools', label: 'Outils', icon: <Calculator size={24} />, route: '/tools' },
  { id: 'withdraw', label: 'Retrait', icon: <ArrowDownLeft size={24} />, route: '/withdraw' },
  { id: 'cards', label: 'Cartes', icon: <CreditCard size={24} />, route: '/cards' },
  { id: 'contacts', label: 'Contacts', icon: <User size={24} />, route: '/contacts' },
];

export const NAV_ITEMS = [
  { id: 'services', icon: <Store size={24} />, route: '/services', label: 'Marketplace' },
  { id: 'home', icon: <Home size={24} />, route: '/', label: 'Accueil' },
  { id: 'keys', icon: <LayoutGrid size={24} />, route: '/keys', label: 'Gestion' },
];
