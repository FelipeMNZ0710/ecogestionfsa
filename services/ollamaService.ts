import { systemInstruction } from '../data/botPrompt';

const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'llama3'; // Asegúrate de tener este modelo con 'ollama run llama3'

export async function* getOllamaResponseStream(query: string): AsyncGenerator<string, void, unknown> {
    try {
        const response = await fetch(OLLAMA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: query,
                system: systemInstruction,
                stream: true,
            }),
        });

        if (!response.body) {
            throw new Error("La respuesta del stream de Ollama está vacía.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Guarda cualquier fragmento parcial para la siguiente iteración

            for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.response) {
                        yield parsed.response;
                    }
                    if (parsed.done) {
                        return;
                    }
                } catch (error) {
                    console.error("Error al parsear una línea del stream de Ollama:", error, "Línea:", line);
                }
            }
        }
    } catch (error) {
        console.error("Error al contactar la API de Ollama:", error);
        throw new Error("No se pudo conectar con Ollama. ¿Está funcionando en tu máquina? Ejecuta 'ollama run llama3' en tu terminal.");
    }
}
