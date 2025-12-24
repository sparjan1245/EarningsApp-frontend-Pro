import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, Res, HttpStatus, HttpException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { SetRoleDto } from './dto/set-role.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'admin-service' };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '25',
  ) {
    return this.adminService.getAllUsersPaginated(parseInt(page), parseInt(pageSize));
  }

  @Get('users/:email/login-activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async getLoginActivity(@Param('email') email: string) {
    return this.adminService.getLoginActivity(email);
  }

  @Post('users/:email/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async setRoleByEmail(
    @Param('email') email: string,
    @Body() body: { role: string },
  ) {
    return this.adminService.setRoleByEmail(email, body.role);
  }

  @Post('sync-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async syncUsers() {
    return this.adminService.syncUsersFromAuth();
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Delete('users/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async bulkDeleteUsers(@Body() body: { ids: string[] }) {
    return this.adminService.bulkDeleteUsers(body.ids);
  }

  @Post('users/:userId/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async blockUser(@Param('userId') userId: string) {
    return this.adminService.blockUser(userId);
  }

  @Post('users/:userId/unblock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async unblockUser(@Param('userId') userId: string) {
    return this.adminService.unblockUser(userId);
  }
}
