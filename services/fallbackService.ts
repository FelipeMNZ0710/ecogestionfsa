import { faqData } from '../data/faqData';

// Simple keyword-based scoring to find the best match.
const getScore = (query: string, keywords: string[]): number => {
    const queryWords = query.toLowerCase().split(/\s+/);
    return keywords.reduce((score, keyword) => {
        if (queryWords.includes(keyword.toLowerCase())) {
            return score + 1;
        }
        return score;
    }, 0);
};

export async function* getFallbackResponseStream(query: string): AsyncGenerator<string, void, unknown> {
    let bestMatch = { score: 0, answer: faqData.default };
    
    faqData.qa_pairs.forEach(pair => {
        const score = getScore(query, pair.keywords);
        if (score > bestMatch.score) {
            bestMatch = { score, answer: pair.answer };
        }
    });

    // If score is very low, it's likely an irrelevant question.
    if (bestMatch.score < 2 && query.split(/\s+/).length > 3) {
        yield faqData.off_topic;
        return;
    }

    yield bestMatch.answer;
}