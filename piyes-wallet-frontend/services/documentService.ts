
import { TaxDocument } from '../shared/types';

class DocumentService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getTaxDocuments(year: number): Promise<TaxDocument[]> {
    await this.delay(1000);
    return [
      {
        id: 'tax-1',
        year,
        type: 'annual_statement',
        issueDate: `15/01/${year + 1}`,
        fileSize: '1.2 MB',
        downloadUrl: '#'
      },
      {
        id: 'tax-2',
        year,
        type: 'tax_withholding',
        issueDate: `20/01/${year + 1}`,
        fileSize: '450 KB',
        downloadUrl: '#'
      }
    ];
  }

  /**
   * Simule la génération d'un PDF côté serveur
   */
  async getStatement(month: number, year: number): Promise<{ success: boolean; blobUrl: string }> {
    await this.delay(2500);
    return { 
      success: true, 
      blobUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' 
    };
  }

  async downloadReceipt(transactionId: string): Promise<boolean> {
    await this.delay(1200);
    console.log(`[API] PDF Receipt generated for TX ${transactionId}`);
    return true;
  }
}

export const documentService = new DocumentService();
