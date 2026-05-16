/** Map MongoDB `_id` or API `id` to a stable string (lean() often omits virtual `id`). */
export function normalizeMongoId(doc: { id?: string | null; _id?: string | { toString(): string } | null }): string {
  if (doc.id && String(doc.id).length > 0) {
    return String(doc.id);
  }
  if (doc._id != null) {
    return typeof doc._id === 'string' ? doc._id : doc._id.toString();
  }
  return '';
}
