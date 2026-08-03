import { Module } from '@nestjs/common';
import { CurrencyLedgerService } from './application/currency-ledger.service';
import { WalletService } from './application/wallet.service';
import { EconomyEventListener } from './application/economy-event-listener.service';

@Module({
  providers: [CurrencyLedgerService, WalletService, EconomyEventListener],
  exports: [CurrencyLedgerService, WalletService],
})
export class EconomyModule {}
