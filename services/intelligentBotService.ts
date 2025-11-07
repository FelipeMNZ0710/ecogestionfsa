import { getGeminiResponseStream } from './geminiService';
import { getFallbackResponseStream } from './fallbackService';
import { getOllamaResponseStream } from './ollamaService';

/**
 * Implements a 3-tier fallback system to ensure bot reliability and performance.
 *
 * This version is enhanced to handle both exceptions AND empty streams from AI services.
 *
 * 1.  **Primary (Gemini):** Tries to get a response from the Gemini API. If the stream is empty or an error occurs, it moves to the next tier.
 * 2.  **Secondary (Ollama):** If Gemini fails, it falls back to the local Ollama instance. If this also fails or returns an empty stream, it moves to the final tier.
 * 3.  **Tertiary (Static Fallback):** As a last resort, it uses a basic, local, keyword-based response system. This guarantees the bot always provides a helpful answer.
 *
 * @param query The user's input string.
 * @returns An async generator that yields the bot's response in chunks.
 */
export async function* getBotResponseStream(query: string): AsyncGenerator<string, void, unknown> {
    let hasYielded = false;

    // --- TIER 1: Try Gemini API (Fastest & Best Quality) ---
    try {
        const geminiStream = getGeminiResponseStream(query);
        for await (const chunk of geminiStream) {
            yield chunk;
            hasYielded = true;
        }
        // If we yielded at least one chunk, we are done.
        if (hasYielded) {
            return;
        }
        // If we are here, Gemini stream was empty but did not throw. Log and fall through.
        console.warn("--- Fallback Nivel 1 ---");
        console.warn("La API de Gemini devolvió un stream vacío. Intentando con Ollama.");

    } catch (geminiError) {
        console.warn("--- Fallback Nivel 1 ---");
        console.warn("La API de Gemini falló. Intentando con Ollama como opción secundaria.");
        console.warn("Error original de Gemini:", geminiError);
    }

    // --- TIER 2: Try Ollama (Local & Intelligent) ---
    hasYielded = false; // Reset for the next tier
    try {
        const ollamaStream = getOllamaResponseStream(query);
        for await (const chunk of ollamaStream) {
            yield chunk;
            hasYielded = true;
        }
        if (hasYielded) {
            return;
        }
        // If we are here, Ollama stream was empty but did not throw. Log and fall through.
        console.error("--- Fallback Nivel 2 ---");
        console.error("Ollama también devolvió un stream vacío. Usando fallback estático.");
    } catch (ollamaError) {
        console.error("--- Fallback Nivel 2 ---");
        console.error("Ollama también falló. Usando el servicio de fallback estático como último recurso.");
        console.error("Error original de Ollama:", ollamaError);
    }

    // --- TIER 3: Static Fallback (Guaranteed to work) ---
    console.log("--- Fallback Nivel 3 --- Usando el servicio de fallback estático.");
    yield* getFallbackResponseStream(query);
}