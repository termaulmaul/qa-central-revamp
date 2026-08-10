import type { PostgrestError } from "@supabase/supabase-js";

export class RepositoryError extends Error {
  constructor(op: string, cause: PostgrestError) {
    super(`${op} failed: ${cause.message}`);
    this.name = "RepositoryError";
  }
}

export function unwrap<T>(op: string, result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) throw new RepositoryError(op, result.error);
  return result.data as T;
}
