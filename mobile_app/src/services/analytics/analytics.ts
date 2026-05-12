// TODO: wire analytics provider (privacy policy gated).

export const analytics = {
  track: (_event: string, _props?: Record<string, unknown>): void => {
    return;
  },
};
