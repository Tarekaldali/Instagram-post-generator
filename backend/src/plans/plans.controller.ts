import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { SubscribePlanDto } from './dto/subscribe-plan.dto';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async getPlans() {
    return this.plansService.listPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  async getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.plansService.getCurrentSubscription(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  async subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: SubscribePlanDto,
  ) {
    return this.plansService.subscribe(user, input);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  async cancel(@CurrentUser() user: AuthenticatedUser) {
    return this.plansService.cancel(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  async createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateCheckoutSessionDto,
  ) {
    return this.plansService.createCheckoutSessionStub(user, input);
  }
}
