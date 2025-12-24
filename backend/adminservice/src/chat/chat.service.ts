import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { ChatGateway } from './chat.gateway';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  
  // Helper method to check if role is admin (case-insensitive)
  private isAdminRole(role?: string): boolean {
    if (!role) return false;
    const normalizedRole = role.toUpperCase();
    return normalizedRole === 'ADMIN' || normalizedRole === 'SUPERADMIN' || normalizedRole === 'SUPER_ADMIN';
  }

  // Helper method to check if role is super admin (case-insensitive)
  private isSuperAdminRole(role?: string): boolean {
    if (!role) return false;
    const normalizedRole = role.toUpperCase();
    return normalizedRole === 'SUPERADMIN' || normalizedRole === 'SUPER_ADMIN';
  }

  // Helper method to auto-create user from JWT payload
  private async ensureUserExists(userId: string, userEmail?: string, userRole?: string, username?: string): Promise<void> {
    try {
      // Map role from JWT to admin-service role
      const mapRole = (role?: string): 'USER' | 'ADMIN' | 'BLOCKED' | 'SUPERADMIN' => {
        if (!role) return 'USER';
        const roleMap: { [key: string]: 'USER' | 'ADMIN' | 'BLOCKED' | 'SUPERADMIN' } = {
          'USER': 'USER',
          'ADMIN': 'ADMIN',
          'SUPERADMIN': 'SUPERADMIN',
          'SUPER_ADMIN': 'SUPERADMIN' // Handle both formats
        };
        return roleMap[role.toUpperCase()] || 'USER';
      };

      // Try to create or update user using JWT payload data
      if (userEmail) {
        await this.prisma.user.upsert({
          where: { email: userEmail },
          update: {
            id: userId, // Update ID if it changed
            username: username || userEmail.split('@')[0], // Use email prefix if no username
            role: mapRole(userRole),
            updatedAt: new Date(),
          },
          create: {
            id: userId,
            email: userEmail,
            username: username || userEmail.split('@')[0],
            role: mapRole(userRole),
            password: '', // placeholder, since we don't store passwords in admin-service
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Auto-created/updated user ${userEmail} from JWT payload`);
      } else {
        // If no email, try to create with just ID (less ideal but better than failing)
        try {
          await this.prisma.user.create({
            data: {
              id: userId,
              email: `${userId}@temp.local`, // Temporary email
              username: `user_${userId.substring(0, 8)}`,
              role: mapRole(userRole),
              password: '',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          this.logger.log(`Auto-created user ${userId} with temporary email`);
        } catch (error: any) {
          // If create fails (e.g., ID already exists), try to update
          if (error?.code === 'P2002') {
            this.logger.warn(`User ${userId} already exists but couldn't be found by ID`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to auto-create user ${userId}:`, error);
      // Don't throw - let the calling method decide what to do
    }
  }

  // Topic Management
  async createTopic(userId: string, dto: CreateTopicDto, userEmail?: string) {
    // ADMIN and SUPER_ADMIN can create topics (role is checked by RolesGuard in controller)
    console.log('createTopic - userId from token:', userId, 'email:', userEmail);
    
    // Try to find user by ID first
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    // If not found by ID, try to find by email (in case user IDs don't match between services)
    if (!user && userEmail) {
      console.log('User not found by ID, trying to find by email:', userEmail);
      user = await this.prisma.user.findUnique({ where: { email: userEmail } });
      if (user) {
        console.log('Found user by email, using user ID:', user.id);
        userId = user.id; // Update userId to match the found user
      }
    }
    
    if (!user) {
      console.error('createTopic - User not found in database. userId:', userId, 'email:', userEmail);
      throw new ForbiddenException(
        `User not found in admin service database. Please sync your account by calling POST /api/admin/sync-users (Admin only) or contact an administrator.`
      );
    }
    console.log('createTopic - Found user:', { id: user.id, email: user.email, role: user.role });
    
    // Double-check role (ADMIN or SUPER_ADMIN/SUPERADMIN can create topics)
    if (!this.isAdminRole(user.role)) {
      throw new ForbiddenException('Only admins can create topics');
    }

    const topic = await this.prisma.topic.create({
      data: {
        title: dto.title,
        description: dto.description,
        createdBy: userId,
      },
    });

    // Create a chat for this topic
    const chat = await this.prisma.chat.create({
      data: {
        type: 'GROUP',
        topicId: topic.id,
      },
    });

    // Add creator as first member
    await this.prisma.chatMember.create({
      data: {
        chatId: chat.id,
        userId: userId,
      },
    });

    // Return topic with all relations for frontend
    return this.prisma.topic.findUnique({
      where: { id: topic.id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        chat: {
          include: {
            _count: {
              select: {
                members: true,
                messages: true,
              },
            },
          },
        },
      },
    });
  }

  async getAllTopics() {
    return this.prisma.topic.findMany({
      where: { isActive: true },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        chat: {
          include: {
            _count: {
              select: {
                members: true,
                messages: true,
              },
            },
            members: {
              where: { isActive: true },
              select: {
                id: true,
                userId: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTopic(userId: string, topicId: string, dto: UpdateTopicDto) {
    // Only SUPERADMIN can update topics
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !this.isSuperAdminRole(user.role)) {
      throw new ForbiddenException('Only super admins can update topics');
    }

    const topic = await this.prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return this.prisma.topic.update({
      where: { id: topicId },
      data: {
        title: dto.title ?? topic.title,
        description: dto.description ?? topic.description,
        updatedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        chat: {
          include: {
            _count: {
              select: {
                members: true,
                messages: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteTopic(userId: string, topicId: string) {
    // Only SUPERADMIN can delete topics
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !this.isSuperAdminRole(user.role)) {
      throw new ForbiddenException('Only super admins can delete topics');
    }

    const topic = await this.prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Soft delete - mark as inactive
    await this.prisma.topic.update({
      where: { id: topicId },
      data: { isActive: false },
    });

    return { message: 'Topic deleted successfully' };
  }

  async getTopicById(topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return topic;
  }

  // Message Management
  async sendMessage(userId: string, dto: SendMessageDto, userEmail?: string, userRole?: string, username?: string, skipBroadcast: boolean = false) {
    // Check if user exists
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    // If not found by ID, try by email
    if (!user && userEmail) {
      user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    }
    
    // If still not found, auto-create from JWT payload
    if (!user) {
      this.logger.log(`User ${userId} not found, auto-creating from JWT payload...`);
      await this.ensureUserExists(userId, userEmail, userRole, username);
      
      // Try to find again after auto-create
      user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user && userEmail) {
        user = await this.prisma.user.findUnique({ where: { email: userEmail } });
      }
      
      // If still not found after auto-create attempt, throw error
      if (!user) {
        throw new ForbiddenException('User not found and could not be auto-created. Please contact an administrator.');
      }
    }
    
    if (user.suspended) {
      throw new ForbiddenException('Your account is suspended');
    }

    if (dto.topicId) {
      // Group chat message
      const topic = await this.prisma.topic.findUnique({
        where: { id: dto.topicId },
        include: { chat: true },
      });

      if (!topic) {
        throw new NotFoundException('Topic not found');
      }

      if (!topic.chat) {
        throw new BadRequestException('Chat not found for this topic');
      }

      // Check if user is a member
      const member = await this.prisma.chatMember.findUnique({
        where: {
          chatId_userId: {
            chatId: topic.chat.id,
            userId: userId,
          },
        },
      });

      if (!member || !member.isActive) {
        // Auto-join user to topic chat
        try {
          await this.prisma.chatMember.upsert({
            where: {
              chatId_userId: {
                chatId: topic.chat.id,
                userId: userId,
              },
            },
            update: {
              isActive: true,
              leftAt: null,
            },
            create: {
              chatId: topic.chat.id,
              userId: userId,
            },
          });
        } catch (error: any) {
          console.error('Failed to add user to chat:', error);
          // Check if it's a foreign key constraint error
          if (error?.code === 'P2003' || error?.message?.includes('Foreign key constraint')) {
            throw new BadRequestException('Your user account is not synced in the admin service. Please contact an administrator to sync your account.');
          }
          throw new BadRequestException('Failed to join chat. Please ensure your account is synced in the admin service.');
        }
      }

      let message;
      try {
        message = await this.prisma.message.create({
          data: {
            chatId: topic.chat.id,
            topicId: dto.topicId,
            userId: userId,
            content: dto.content,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        });
      } catch (error: any) {
        console.error('Failed to create message:', error);
        // Check if it's a foreign key constraint error
        if (error?.code === 'P2003' || error?.message?.includes('Foreign key constraint')) {
          throw new BadRequestException('Your user account is not synced in the admin service. Please contact an administrator to sync your account.');
        }
        throw new BadRequestException('Failed to send message. Please try again.');
      }

      // Update chat last message time
      await this.prisma.chat.update({
        where: { id: topic.chat.id },
        data: { lastMessageAt: new Date() },
      });

      // Emit message via socket for real-time updates
      // Note: Broadcasting is handled by the WebSocket gateway to avoid duplicates
      // Only broadcast here if called directly (not via gateway)
      const room = `topic:${dto.topicId}`;
      if (!skipBroadcast && this.chatGateway?.server?.sockets?.adapter) {
        const roomSize = this.chatGateway.server.sockets.adapter.rooms?.get(room)?.size || 0;
        console.log(`[Service] 📤 Broadcasting message to room ${room} (${roomSize} clients)`);
        console.log(`[Service] Message details:`, { 
          id: message.id, 
          userId: message.userId, 
          content: message.content.substring(0, 50),
          room,
          roomSize,
        });
        
        // Get all sockets in the room for logging
        const roomSockets = this.chatGateway.server.sockets.adapter.rooms?.get(room);
        if (roomSockets) {
          console.log(`[Service] Room ${room} contains sockets:`, Array.from(roomSockets));
        }
        
        // Broadcast to all clients in the room (including sender)
        // Use .in() which is equivalent to .to() but more explicit
        this.chatGateway.server.in(room).emit('new-message', message);
        
        // Also emit to sender's personal room as fallback (if they're not in the main room)
        // This ensures the sender always receives their message
        this.chatGateway.server.to(`user:${userId}`).emit('new-message', message);
        
        console.log(`[Service] ✅ Message broadcasted to room ${room} (${roomSize} clients should receive it)`);
      } else {
        console.error('[Service] ❌ ChatGateway server not available for broadcasting');
      }

      return message;
    } else if (dto.chatId) {
      // One-to-one or existing chat
      const chat = await this.prisma.chat.findUnique({
        where: { id: dto.chatId },
      });

      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      // Check if user is a member
      const member = await this.prisma.chatMember.findUnique({
        where: {
          chatId_userId: {
            chatId: dto.chatId,
            userId: userId,
          },
        },
      });

      if (!member || !member.isActive) {
        throw new ForbiddenException('You are not a member of this chat');
      }

      const message = await this.prisma.message.create({
        data: {
          chatId: dto.chatId,
          userId: userId,
          content: dto.content,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // Update chat last message time
      await this.prisma.chat.update({
        where: { id: dto.chatId },
        data: { lastMessageAt: new Date() },
      });

      // Emit message via socket for real-time updates
      // Note: Broadcasting is handled by the WebSocket gateway to avoid duplicates
      // Only broadcast here if called directly (not via gateway)
      const room = `chat:${dto.chatId}`;
      if (!skipBroadcast && this.chatGateway?.server?.sockets?.adapter) {
        const roomSize = this.chatGateway.server.sockets.adapter.rooms?.get(room)?.size || 0;
        console.log(`[Service] 📤 Broadcasting message to room ${room} (${roomSize} clients)`);
        console.log(`[Service] Message details:`, { 
          id: message.id, 
          userId: message.userId, 
          content: message.content.substring(0, 50),
          room,
          roomSize,
        });
        
        // Get all sockets in the room for logging
        const roomSockets = this.chatGateway.server.sockets.adapter.rooms?.get(room);
        if (roomSockets) {
          console.log(`[Service] Room ${room} contains sockets:`, Array.from(roomSockets));
        }
        
        // Broadcast to all clients in the room (including sender)
        // Use .in() which is equivalent to .to() but more explicit
        this.chatGateway.server.in(room).emit('new-message', message);
        
        // Also emit to sender's personal room as fallback (if they're not in the main room)
        // This ensures the sender always receives their message
        this.chatGateway.server.to(`user:${userId}`).emit('new-message', message);
        
        console.log(`[Service] ✅ Message broadcasted to room ${room} (${roomSize} clients should receive it)`);
      } else {
        console.error('[Service] ❌ ChatGateway server not available for broadcasting');
      }

      return message;
    } else {
      throw new BadRequestException('Either topicId or chatId must be provided');
    }
  }

  async getMessages(topicId?: string, chatId?: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (topicId) {
      where.topicId = topicId;
    } else if (chatId) {
      where.chatId = chatId;
    } else {
      throw new BadRequestException('Either topicId or chatId must be provided');
    }

    where.deleted = false;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.message.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        pageSize: limit, // Alias for frontend compatibility
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // User Blocking
  async blockUser(blockerId: string, dto: BlockUserDto) {
    if (blockerId === dto.blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Check if already blocked
    const existing = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: dto.blockedId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already blocked');
    }

    return this.prisma.userBlock.create({
      data: {
        blockerId,
        blockedId: dto.blockedId,
        reason: dto.reason,
      },
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
  }

  async getBlockedUsers(userId: string) {
    return this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  // Check if user is blocked
  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
    return !!block;
  }

  // Create one-to-one chat
  async createOneToOneChat(userId1: string, userId2: string) {
    // Check if chat already exists
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        type: 'ONE_TO_ONE',
        members: {
          every: {
            userId: {
              in: [userId1, userId2],
            },
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (existingChat && existingChat.members.length === 2) {
      return existingChat;
    }

    // Check if users are blocked
    const isBlocked1 = await this.isUserBlocked(userId1, userId2);
    const isBlocked2 = await this.isUserBlocked(userId2, userId1);

    if (isBlocked1 || isBlocked2) {
      throw new ForbiddenException('Cannot create chat with blocked user');
    }

    const chat = await this.prisma.chat.create({
      data: {
        type: 'ONE_TO_ONE',
        members: {
          create: [
            { userId: userId1 },
            { userId: userId2 },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return chat;
  }

  // Get user chats
  async getUserChats(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId: userId,
            isActive: true,
          },
        },
      },
      include: {
        topic: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        members: {
          where: {
            userId: { not: userId },
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  // Get all users for chatting (excluding current user and blocked users)
  async getUsersForChat(userId: string) {
    // Get blocked user IDs (both ways)
    const blockedByMe = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    const blockedMe = await this.prisma.userBlock.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    });
    
    const blockedIds = [
      ...blockedByMe.map(b => b.blockedId),
      ...blockedMe.map(b => b.blockerId),
      userId, // Exclude current user
    ];

    // Get all users excluding blocked ones and current user
    const users = await this.prisma.user.findMany({
      where: {
        id: { notIn: blockedIds },
        suspended: false, // Exclude suspended users
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { username: 'asc' },
    });

    // Check existing chats with each user
    const usersWithChatStatus = await Promise.all(
      users.map(async (user) => {
        const existingChat = await this.prisma.chat.findFirst({
          where: {
            type: 'ONE_TO_ONE',
            members: {
              every: {
                userId: { in: [userId, user.id] },
              },
            },
          },
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        return {
          ...user,
          existingChatId: existingChat?.id || null,
          hasExistingChat: !!existingChat,
        };
      })
    );

    return usersWithChatStatus;
  }

  // Get online users
  async getOnlineUsers(): Promise<string[]> {
    try {
      const keys = await this.redis.keys('online:*');
      return keys.map(key => key.replace('online:', ''));
    } catch (error) {
      this.logger.error('Error getting online users:', error);
      return [];
    }
  }

  // Suspend user (admin only)
  async suspendUser(adminId: string, userId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new ForbiddenException('Admin not found');
    }
    
    // Check if admin or super admin (role is checked by RolesGuard in controller)
    if (!this.isAdminRole(admin.role)) {
      throw new ForbiddenException('Only admins can suspend users');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { suspended: true },
    });
  }

  // Unsuspend user (admin only)
  async unsuspendUser(adminId: string, userId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new ForbiddenException('Admin not found');
    }
    
    // Check if admin or super admin (role is checked by RolesGuard in controller)
    if (!this.isAdminRole(admin.role)) {
      throw new ForbiddenException('Only admins can unsuspend users');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { suspended: false },
    });
  }
}

