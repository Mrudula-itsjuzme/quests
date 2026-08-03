import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../identity/guards/auth.guard';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import { AuthContext } from '../../identity/auth-context';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { QuestAssignmentService } from '../application/quest-assignment.service';
import { QuestLifecycleService } from '../application/quest-lifecycle.service';
import { QuestSubmissionService } from '../application/quest-submission.service';
import { QuestContentAdapter } from '../infrastructure/quest-content.adapter';
import { ProgressDto, SubmissionDto } from './dto';

@UseGuards(AuthGuard)
@Controller('quests')
export class QuestController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly content: QuestContentAdapter,
    private readonly assignments: QuestAssignmentService,
    private readonly lifecycle: QuestLifecycleService,
    private readonly submissions: QuestSubmissionService,
  ) {}

  @Get('definitions')
  definitions(@Query('cadence') cadence?: string, @Query('category') category?: string) {
    return this.content.listDefinitions({ cadence, category });
  }

  @Get('active')
  async active(@CurrentUser() user: AuthContext) {
    await this.lifecycle.expireOverdue(user.userId);
    const assignments = await this.prisma.questAssignment.findMany({
      where: { userId: user.userId, status: { in: ['active', 'assigned', 'pending_verification', 'rejected'] } },
      orderBy: { assignedAt: 'desc' },
    });
    return this.withDefinitions(assignments);
  }

  @Get('history')
  async history(@CurrentUser() user: AuthContext) {
    const assignments = await this.prisma.questAssignment.findMany({
      where: { userId: user.userId, status: { in: ['completed', 'expired', 'abandoned'] } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return this.withDefinitions(assignments);
  }

  @Post('generate-daily')
  generateDaily(@CurrentUser() user: AuthContext) {
    return this.assignments.generateDaily(user.userId, user.timezone);
  }

  @Post('generate-weekly')
  generateWeekly(@CurrentUser() user: AuthContext) {
    return this.assignments.generateWeekly(user.userId, user.timezone);
  }

  @Post('generate-monthly')
  generateMonthly(@CurrentUser() user: AuthContext) {
    return this.assignments.generateMonthly(user.userId, user.timezone);
  }

  @Post(':assignmentId/progress')
  async progress(
    @CurrentUser() user: AuthContext,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() body: ProgressDto,
  ) {
    await this.lifecycle.requireActive(user.userId, assignmentId);
    return this.lifecycle.recordProgress(assignmentId, body.value);
  }

  @Post(':assignmentId/submissions')
  submit(
    @CurrentUser() user: AuthContext,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() body: SubmissionDto,
  ) {
    return this.submissions.submit(user.userId, assignmentId, body);
  }

  private async withDefinitions<T extends { definitionId: string }>(assignments: T[]) {
    const definitionIds = [...new Set(assignments.map((a) => a.definitionId))];
    const definitions = await Promise.all(definitionIds.map((id) => this.content.getById(id)));
    const byId = new Map(definitions.filter(Boolean).map((d) => [d!.id, d!]));
    return assignments.map((assignment) => ({ ...assignment, definition: byId.get(assignment.definitionId) ?? null }));
  }
}
