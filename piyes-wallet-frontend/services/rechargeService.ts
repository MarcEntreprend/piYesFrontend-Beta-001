
import { http } from './httpClient';

export interface MobileOperator {
  id: string;
  name: string;
  logoUrl?: string;
  color: string;
  prefix: string[];
}

export interface RechargeRequest {
  phoneNumber: string;
  amount: number;
  operatorId: string;
  accountId: string;
}

class RechargeService {
  private operators: MobileOperator[] = [
    { 
      id: 'digicel', 
      name: 'Digicel', 
      color: '#E10600', 
      prefix: ['34', '36', '37', '38', '39', '44', '46', '47', '48', '49'],
      logoUrl: 'https://sandbox.moncashbutton.digicelgroup.com/Moncash-business/resources/assets/images/MonCash.png' // Using MonCash logo as proxy for Digicel if needed, or just color
    },
    { 
      id: 'natcom', 
      name: 'Natcom', 
      color: '#FF6B00', 
      prefix: ['31', '32', '33', '35', '40', '41', '42', '43'],
      logoUrl: 'https://natcom.com.ht/natcom_logo.png' // Placeholder
    }
  ];

  private predefinedAmounts = [25, 50, 100, 250, 500];

  getOperators() {
    return this.operators;
  }

  getPredefinedAmounts() {
    return this.predefinedAmounts;
  }

  detectOperator(phoneNumber: string): MobileOperator | null {
    // Clean phone number (remove +509, spaces, etc.)
    const clean = phoneNumber.replace(/\D/g, '');
    let number = clean;
    
    // Handle country code
    if (clean.startsWith('509')) {
      number = clean.substring(3);
    } else if (clean.startsWith('0')) {
      // Some users might enter a leading zero by mistake or habit
      number = clean.substring(1);
    }
    
    if (number.length < 2) return null;
    
    const prefix2 = number.substring(0, 2);
    const prefix3 = number.substring(0, 3);
    
    const detected = this.operators.find(op => 
      op.prefix.includes(prefix2) || op.prefix.includes(prefix3)
    ) || null;

    console.log(`[RECHARGE] Detecting operator for ${phoneNumber} (clean: ${number}). Detected: ${detected?.name || 'None'}`);
    return detected;
  }

  async performRecharge(request: RechargeRequest) {
    // PROD: return http.post('/recharge', request);
    // For now, we'll use apiService to simulate the backend call
    return request;
  }
}

export const rechargeService = new RechargeService();
