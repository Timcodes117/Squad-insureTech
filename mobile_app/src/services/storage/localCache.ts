// TODO: optional non-sensitive cache (never store secrets here).

export const localCache = {
  get: async (_key: string): Promise<string | null> => null,
  set: async (_key: string, _value: string): Promise<void> => {
    return;
  },
};
