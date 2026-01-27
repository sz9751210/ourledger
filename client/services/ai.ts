import { GoogleGenAI, Type } from "@google/genai";
import { Category, Expense, CurrencyCode } from "../types";

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Suggests a category ID based on the expense description.
 */
export const getCategorySuggestion = async (description: string, categories: Category[]): Promise<string | undefined> => {
  if (!description.trim()) return undefined;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Analyze the expense description: "${description}".
      Select the most appropriate category ID from the following list.
      Categories: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name })))}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoryId: { type: Type.STRING, description: "The ID of the matching category" }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result.categoryId;
  } catch (error) {
    console.error("Error getting category suggestion:", error);
    return undefined;
  }
};

/**
 * Parses a receipt image to extract expense details.
 */
export const parseReceiptImage = async (
  base64Image: string, 
  categories: Category[], 
  baseCurrency: string
): Promise<{
  amount?: number;
  currency?: CurrencyCode;
  date?: string;
  description?: string;
  categoryId?: string;
} | undefined> => {
  try {
    // Strip header if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    const prompt = `Analyze this receipt image. Extract the following:
    1. Total Amount (number only).
    2. Currency (Try to detect TWD, USD, JPY, EUR, KRW. Default to ${baseCurrency} if unclear).
    3. Date (YYYY-MM-DD format).
    4. Merchant Name (use as description).
    5. Best Category ID from this list: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name })))}.
    
    Return JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            categoryId: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as {
       amount?: number;
       currency?: CurrencyCode;
       date?: string;
       description?: string;
       categoryId?: string;
    };

  } catch (error) {
    console.error("Error parsing receipt:", error);
    return undefined;
  }
};

/**
 * Generates spending insights based on recent expenses.
 */
export const getSpendingInsights = async (expenses: Expense[], currency: string, categories: Category[], language: 'en' | 'zh'): Promise<string> => {
  if (expenses.length === 0) return "";

  const expenseSummary = expenses.map(e => {
    const catName = categories.find(c => c.id === e.categoryId)?.name || 'Unknown';
    return `${e.date.split('T')[0]}: ${e.description} (${e.currency} ${e.amount}) - ${catName}`;
  }).join('\n');

  try {
    const prompt = language === 'zh' 
      ? `作為一位財務顧問，請根據以下近期支出紀錄，提供 3 點簡短的財務分析或省錢建議 (使用繁體中文，語氣親切):
         預設幣別: ${currency}
         紀錄:
         ${expenseSummary}`
      : `As a financial advisor, analyze the following recent expense records and provide 3 short, helpful financial tips or observations (friendly tone):
         Base Currency: ${currency}
         Records:
         ${expenseSummary}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful personal finance assistant for a couple.",
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Error getting insights:", error);
    return "Could not generate insights at this time.";
  }
};