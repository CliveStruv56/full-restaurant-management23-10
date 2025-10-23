import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { DailySpecial, Product } from '../types';

export const useDailySpecial = (products: Product[]) => {
    const [dailySpecial, setDailySpecial] = useState<DailySpecial | null>(null);
    const [isSpecialLoading, setIsSpecialLoading] = useState(true);

    useEffect(() => {
        if (products.length === 0) {
            setIsSpecialLoading(false);
            setDailySpecial(null);
            return;
        };

        const generateSpecial = async () => {
            setIsSpecialLoading(true);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                // FIX: Changed p.category to p.categoryId and 'Drink' to 'drink' to match category ID format.
                const drinks = products.filter(p => p.categoryId.includes('drink')).map(p => p.name);
                // FIX: Changed p.category to p.categoryId and 'Pastries' to 'pastries' to match category ID format.
                const pastries = products.filter(p => p.categoryId.includes('pastries')).map(p => p.name);

                if (drinks.length === 0 || pastries.length === 0) {
                     throw new Error("Not enough product variety to generate a special.");
                }

                const prompt = `From the following lists, select one drink and one pastry to feature as a "Daily Special" pairing.
                Drinks: ${drinks.join(', ')}
                Pastries: ${pastries.join(', ')}

                Then, write a short, creative, and enticing description for this pairing (no more than 20 words).
                
                Return ONLY a JSON object with the keys "drinkName", "pastryName", and "description".`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                drinkName: { type: Type.STRING },
                                pastryName: { type: Type.STRING },
                                description: { type: Type.STRING },
                            },
                            required: ["drinkName", "pastryName", "description"]
                        }
                    }
                });
                
                const resultText = response.text.trim();
                const result = JSON.parse(resultText);

                const drink = products.find(p => p.name === result.drinkName);
                const pastry = products.find(p => p.name === result.pastryName);

                if (drink && pastry) {
                    setDailySpecial({ drink, pastry, description: result.description });
                } else {
                    throw new Error("Could not find matching drink or pastry from Gemini response");
                }
            } catch (error) {
                console.error("Error generating daily special:", error);
                // Fallback to a default special on error, but only if we have enough products
                if (products.length >= 2) {
                    // FIX: Changed p.category to p.categoryId and 'Drink' to 'drink' to match category ID format.
                    const fallbackDrink = products.find(p => p.categoryId.includes('drink')) || products[0];
                    // FIX: Changed p.category to p.categoryId and 'Pastries' to 'pastries' to match category ID format.
                    const fallbackPastry = products.find(p => p.categoryId.includes('pastries') && p.id !== fallbackDrink.id) || products.find(p => p.id !== fallbackDrink.id) || products[1];
                     if(fallbackDrink && fallbackPastry) {
                        setDailySpecial({
                            drink: fallbackDrink,
                            pastry: fallbackPastry,
                            description: `A classic pairing of ${fallbackDrink.name} and a delicious ${fallbackPastry.name}.`
                        });
                     } else {
                        setDailySpecial(null);
                     }
                } else {
                    // Not enough products for a special, don't show one.
                    setDailySpecial(null);
                }
            } finally {
                setIsSpecialLoading(false);
            }
        };

        generateSpecial();
    }, [products]);

    return { dailySpecial, isSpecialLoading };
};