import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.listUsers();
  }

  @Get('plans')
  async getPlans() {
    return this.adminService.listPlans();
  }

  @Get('generations')
  async getGenerations() {
    return this.adminService.listGenerations();
  }
}
