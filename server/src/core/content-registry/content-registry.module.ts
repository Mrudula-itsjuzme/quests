import { Global, Module } from '@nestjs/common';
import { ContentRegistryService } from './content-registry.service';

@Global()
@Module({
  providers: [ContentRegistryService],
  exports: [ContentRegistryService],
})
export class ContentRegistryModule {}
