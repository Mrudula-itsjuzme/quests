/**
 * Branded string types so a PlayerId and a raw string (or a GuildId) can't
 * be silently swapped at a call site. Zero runtime cost — purely a
 * compile-time guard.
 */
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type PlayerId = Brand<string, 'PlayerId'>;
export type EntityId = Brand<string, 'EntityId'>;
export type ContentId = Brand<string, 'ContentId'>;

export const asPlayerId = (value: string): PlayerId => value as PlayerId;
export const asEntityId = (value: string): EntityId => value as EntityId;
export const asContentId = (value: string): ContentId => value as ContentId;
