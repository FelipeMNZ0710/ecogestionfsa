const cache = new Map<string, string>();

export const getFromCache = (key: string): string | undefined => {
    return cache.get(key.toLowerCase().trim());
};

export const setInCache = (key: string, value: string): void => {
    cache.set(key.toLowerCase().trim(), value);
};
