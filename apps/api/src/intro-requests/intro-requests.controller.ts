import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { IntroRequestsService } from './intro-requests.service';
import { CreateIntroRequestDto, RespondIntroRequestDto } from './dto/intro-request.dto';

/** PRD §10 — the v1 stand-in for messaging. */
@Controller('intro-requests')
@UseGuards(JwtAuthGuard)
export class IntroRequestsController {
  constructor(private readonly intros: IntroRequestsService) {}

  @Post()
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateIntroRequestDto) {
    return this.intros.create(user, dto.toUserId, dto.note);
  }

  /** Sent and received, in one call. */
  @Get()
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.intros.list(user);
  }

  @Patch(':id')
  respond(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondIntroRequestDto,
  ) {
    return this.intros.respond(user, id, dto.status);
  }
}
