import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GameEventName } from './game-events';

/**
 * The only channel through which engines communicate. An engine never
 * imports another engine's application service to trigger a side effect —
 * it calls `record` (inside its own transaction) and/or `emit`, and the
 * interested engine subscribes via @OnEvent.
 *
 * `record` writes a durable outbox row (survives a process crash, can be
 * relayed to BullMQ for cross-process fan-out). `emit` is the in-process
 * fast path for handlers that just need the event this tick (e.g. building
 * an API response). Most call sites do both: record inside the transaction,
 * emit right after it commits.
 */
@Injectable()
export class GameEventBus {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  async record(
    tx: Prisma.TransactionClient,
    type: GameEventName,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await tx.gameEventLog.create({ data: { type, payload: payload as Prisma.InputJsonValue } });
  }

  emit(type: GameEventName, payload: Record<string, unknown>): void {
    this.emitter.emit(type, payload);
  }
}
