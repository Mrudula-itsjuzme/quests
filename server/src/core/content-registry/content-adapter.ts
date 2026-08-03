import { ZodType } from 'zod';
import { ContentRegistryService } from './content-registry.service';

/**
 * Base class each engine extends to get a strongly-typed view over its own
 * content type. The registry stores `payload` as opaque JSON; the adapter is
 * the one place that knows how to validate and shape it into a domain
 * object. `schemaVersion` lets an engine evolve its content shape over time
 * — old rows stay valid under the version they were written with rather
 * than requiring a hard cutover migration.
 *
 * The schema's *output* type is `T`; its accepted input type is left open
 * (`any`) so schemas using `.default()`/`.optional()` — where input and
 * output legitimately differ — satisfy this without fighting Zod's
 * ZodType<Output, Def, Input> variance.
 */
export abstract class ContentAdapter<T> {
  protected abstract readonly contentType: string;
  protected abstract readonly schema: ZodType<T, any, any>;

  constructor(protected readonly registry: ContentRegistryService) {}

  protected toDomain(row: { id: string; payload: unknown }): T & { id: string } {
    const parsed = this.schema.parse(row.payload);
    return { ...parsed, id: row.id };
  }

  async listActive(activeAt?: Date): Promise<Array<T & { id: string }>> {
    const rows = await this.registry.list({ type: this.contentType, activeAt });
    return rows.map((row) => this.toDomain(row));
  }

  async getById(id: string): Promise<(T & { id: string }) | null> {
    const row = await this.registry.getById(id);
    if (!row || row.type !== this.contentType) return null;
    return this.toDomain(row);
  }
}
