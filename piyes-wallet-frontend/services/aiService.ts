// services/aiService.ts

export interface ParsedTransaction {
  type: "transfer" | "request" | "error";
  amount: number | null;
  contact: string | null;
  rephrased: string;
}

class AIService {
  private apiKey: string;
  private baseUrl = "https://api.deepseek.com/v1";

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

    if (!this.apiKey) {
      console.warn(
        "VITE_DEEPSEEK_API_KEY is missing. AI features will be disabled.",
      );
    }
  }

  private readonly KNOWLEDGE_BASE = `
  DOCUMENTS DE RÉFÉRENCE PIYÈS:

  ### Transférer
  Envoyez de l'argent à vos contacts piYès en quelques secondes.
  Le flow est simple : sélectionnez un destinataire, entrez le montant, confirmez avec votre code PIN. Une fois validé, le transfert est instantané.

  ### International
  Effectuez des transferts d'argent vers l'étranger en toute sécurité.
  Choisissez le pays, entrez les coordonnées du bénéficiaire, le montant à envoyer, puis confirmez. Le taux de change est affiché avant validation.

  ### Dépôt
  Ajoutez de l'argent à votre compte piYès depuis un point de dépôt ou via une carte.
  Sélectionnez le mode de dépôt, entrez le montant, suivez les instructions, puis confirmez avec votre PIN. Une notification vous informe dès que les fonds sont disponibles.

  ### Recevoir
  Générez un lien ou un QR code pour recevoir de l'argent facilement.
  Partagez-le avec vos proches ou clients. Dès qu'ils effectuent le paiement, vous recevez une confirmation instantanée.

  ### Retrait
  Retirez de l'argent de votre compte piYès vers un point de retrait ou un compte bancaire.
  Choisissez le montant, le mode de retrait, confirmez avec votre PIN. Une fois validé, suivez les instructions pour récupérer vos fonds.

  ### Cartes
  Gérez vos cartes piYès (virtuelles ou physiques).
  Consultez vos soldes, bloquez/débloquez une carte, ou demandez une nouvelle carte. Toutes les actions sensibles sont protégées par votre code PIN.

  ### QR & Proximité
  Payez ou recevez de l'argent en scannant un QR code ou via détection de proximité.
  Idéal pour les paiements rapides en boutique ou entre amis. Sécurisé, instantané, sans contact.
  `;

  async parseMessage(message: string): Promise<ParsedTransaction> {
    if (!this.apiKey) {
      return {
        type: "error",
        amount: null,
        contact: null,
        rephrased: "Erreur : Clé API DeepSeek manquante",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are a technical banking assistant for "piYès".
Your task is to extract transaction data and REPHRASE it in a strictly neutral and standardized technical format.

PHRASING RULES:
- Use ONLY this structure: "[Action] [Amount] G. [Link Word] [Contact]"
- NO polite words (No "Veuillez", "Merci", "S'il vous plaît").
- Action must be "Envoyer" or "Demander".
- Amount must include "G."
- Link word: "à" or "de" or "au".

Return ONLY valid JSON with this exact structure:
{
  "type": "transfer" | "request" | "error",
  "amount": number | null,
  "contact": string | null,
  "rephrased": string
}

If amount is missing, set type to "error" and rephrased to "Erreur : Montant manquant".`,
            },
            {
              role: "user",
              content: `Analyze this banking request message: "${message}"`,
            },
          ],
          temperature: 0.1,
          max_tokens: 150,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("DeepSeek API error:", response.status, errorData);

        if (response.status === 402) {
          return {
            type: "error",
            amount: null,
            contact: null,
            rephrased: "Erreur : Crédits DeepSeek épuisés",
          };
        }

        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No response from DeepSeek");
      }

      const parsed = JSON.parse(content);

      // Validation basique
      if (!parsed.type || !parsed.rephrased) {
        throw new Error("Invalid response format");
      }

      return parsed;
    } catch (error) {
      console.error("DeepSeek Parsing error:", error);
      return {
        type: "error",
        amount: null,
        contact: null,
        rephrased: "Erreur technique de lecture.",
      };
    }
  }

  async getSupportResponse(
    query: string,
    context: string,
    lang: string,
  ): Promise<string> {
    if (!this.apiKey) {
      return "Service d'assistance IA temporairement indisponible (clé API manquante).";
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are the piYès Intelligent Support Assistant.
Here is the app documentation:
${this.KNOWLEDGE_BASE}

USER CONTEXT: The user is currently on the "${context}" page.
LANGUAGE: Reply in ${lang} (French, Haitian Creole, or English depending on user request).

GUIDELINES:
- Be helpful, clear, and professional.
- Use the documentation to provide accurate steps.
- If the question is outside the scope of the app, politely redirect to general support.
- Keep answers concise but complete (max 300 tokens).
- Use Markdown for bolding key terms.`,
            },
            {
              role: "user",
              content: query,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          return "Le service d'assistance IA est temporairement indisponible (crédits épuisés). Veuillez réessayer plus tard.";
        }
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      return (
        data.choices?.[0]?.message?.content ||
        "Désolé, je ne peux pas répondre pour le moment."
      );
    } catch (error) {
      console.error("DeepSeek Support error:", error);
      return "Une erreur technique s'est produite lors de la génération de la réponse.";
    }
  }
}

export const aiService = new AIService();
