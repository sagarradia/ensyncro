import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { DocumentsController } from './documents.controller';
import { FounderDocumentsService } from './founder-documents.service';
import { PdfService } from './pdf.service';

/**
 * Document generation. PdfService is the reusable core (PRD v2 §14.3) — any
 * future feature that needs a branded PDF depends on it, not on pdfkit directly.
 * FounderDocumentsService reuses ProfilesModule's FounderProfileService for all
 * data access and gating.
 */
@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [DocumentsController],
  providers: [PdfService, FounderDocumentsService],
  exports: [PdfService],
})
export class DocumentsModule {}
