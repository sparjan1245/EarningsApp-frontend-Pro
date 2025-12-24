import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { BlockUserDto } from './dto/block-user.dto';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  // Topics
  @Post('topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async createTopic(@Request() req, @Body() dto: CreateTopicDto) {
    console.log('createTopic controller - req.user:', JSON.stringify(req.user, null, 2));
    return this.chatService.createTopic(req.user.userId, dto, req.user.email);
  }

  @Get('topics')
  async getAllTopics(@Request() req) {
    // Public endpoint - no auth required to view topics
    return this.chatService.getAllTopics();
  }

  @Get('topics/:id')
  async getTopicById(@Param('id') id: string) {
    // Public endpoint - no auth required to view topic details
    return this.chatService.getTopicById(id);
  }

  @Put('topics/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async updateTopic(@Request() req, @Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.chatService.updateTopic(req.user.userId, id, dto);
  }

  @Delete('topics/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async deleteTopic(@Request() req, @Param('id') id: string) {
    return this.chatService.deleteTopic(req.user.userId, id);
  }

  // Messages
  @Post('messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    try {
      // When called via HTTP API (fallback), skip broadcast to avoid duplicates
      // The WebSocket gateway handles broadcasting, so HTTP should only save
      return await this.chatService.sendMessage(
        req.user.userId,
        dto,
        req.user.email,
        req.user.role,
        req.user.username || req.user.email?.split('@')[0], // Use email prefix if username not available
        true // skipBroadcast = true for HTTP API calls
      );
    } catch (error: any) {
      // Re-throw NestJS exceptions as-is
      if (error?.status || error?.statusCode) {
        throw error;
      }
      // Wrap unexpected errors
      console.error('Unexpected error in sendMessage controller:', error);
      throw new BadRequestException(error?.message || 'Failed to send message');
    }
  }

  @Get('messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Request() req,
    @Query('topicId') topicId?: string,
    @Query('chatId') chatId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      topicId,
      chatId,
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }

  // User Blocking
  @Post('block')
  @UseGuards(JwtAuthGuard)
  async blockUser(@Request() req, @Body() dto: BlockUserDto) {
    return this.chatService.blockUser(req.user.userId, dto);
  }

  @Delete('block/:blockedId')
  @UseGuards(JwtAuthGuard)
  async unblockUser(@Request() req, @Param('blockedId') blockedId: string) {
    return this.chatService.unblockUser(req.user.userId, blockedId);
  }

  @Get('blocked')
  @UseGuards(JwtAuthGuard)
  async getBlockedUsers(@Request() req) {
    return this.chatService.getBlockedUsers(req.user.userId);
  }

  // Chats
  @Post('chats/one-to-one/:userId')
  @UseGuards(JwtAuthGuard)
  async createOneToOneChat(@Request() req, @Param('userId') userId: string) {
    return this.chatService.createOneToOneChat(req.user.userId, userId);
  }

  @Get('chats')
  @UseGuards(JwtAuthGuard)
  async getUserChats(@Request() req) {
    return this.chatService.getUserChats(req.user.userId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async getUsersForChat(@Request() req) {
    return this.chatService.getUsersForChat(req.user.userId);
  }

  @Get('users/online')
  @UseGuards(JwtAuthGuard)
  async getOnlineUsers(@Request() req) {
    return this.chatService.getOnlineUsers();
  }

  // Admin functions
  @Put('users/:userId/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async suspendUser(@Request() req, @Param('userId') userId: string) {
    return this.chatService.suspendUser(req.user.userId, userId);
  }

  @Put('users/:userId/unsuspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async unsuspendUser(@Request() req, @Param('userId') userId: string) {
    return this.chatService.unsuspendUser(req.user.userId, userId);
  }
}

