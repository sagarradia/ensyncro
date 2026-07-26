import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { DealsService } from './deals.service';
import { AddCommentDto, AddTaskDto, ChangeStageDto, ToggleTaskDto } from './dto/deals.dto';

/**
 * Deal Management (PRD v2 §5). Founders and investors see their own deals;
 * admins see all. Per-deal access is enforced in the service — the role guard
 * only limits the endpoints to the three roles that can hold deals.
 */
@Controller('deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FOUNDER, Role.INVESTOR, Role.ADMIN)
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Get()
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.deals.list(user);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AccessTokenPayload) {
    return this.deals.get(id, user);
  }

  @Patch(':id/stage')
  changeStage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ChangeStageDto,
  ) {
    return this.deals.changeStage(id, user, dto.stage);
  }

  @Post(':id/comments')
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: AddCommentDto,
  ) {
    return this.deals.addComment(id, user, dto.body);
  }

  @Post(':id/tasks')
  addTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: AddTaskDto,
  ) {
    return this.deals.addTask(id, user, dto.title);
  }

  @Patch(':id/tasks/:taskId')
  toggleTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ToggleTaskDto,
  ) {
    return this.deals.toggleTask(id, user, taskId, dto.done);
  }
}
