// TODO: remove if unused; useful for skeleton delays during development.

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
