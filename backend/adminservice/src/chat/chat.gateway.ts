import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import * as jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth?.token || 
                    client.handshake.query?.token as string;

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
      }

      const payload = jwt.verify(token, jwtSecret) as any;
      client.userId = payload.sub || payload.id;
      client.username = payload.username || payload.email;

      // Join user's personal room
      await client.join(`user:${client.userId}`);

      // Store online user in Redis
      await this.redis.setex(`online:${client.userId}`, 300, JSON.stringify({
        userId: client.userId,
        username: client.username,
        connectedAt: new Date().toISOString(),
      }));

      console.log(`[Gateway] ✅ User ${client.username} (${client.userId}) connected - Socket ID: ${client.id}`);
      console.log(`[Gateway] User joined personal room: user:${client.userId}`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Remove online user from Redis
      await this.redis.del(`online:${client.userId}`);
    }
    console.log(`User ${client.username} (${client.userId}) disconnected`);
  }

  @SubscribeMessage('join-topic')
  async handleJoinTopic(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { topicId: string },
  ) {
    if (!client.userId) {
      console.error('[Gateway] Join topic failed: Unauthorized');
      return { error: 'Unauthorized' };
    }

    const room = `topic:${data.topicId}`;
    await client.join(room);
    
    const roomSize = this.server?.sockets?.adapter?.rooms?.get(room)?.size || 0;
    console.log(`[Gateway] ✅ User ${client.username} (${client.userId}) joined room: ${room}`);
    console.log(`[Gateway] Room ${room} now has ${roomSize} clients`);
    console.log(`[Gateway] Socket ID: ${client.id}`);
    
    // Notify others in the topic
    client.to(room).emit('user-joined', {
      userId: client.userId,
      username: client.username,
      topicId: data.topicId,
    });

    return { success: true, topicId: data.topicId, roomSize };
  }

  @SubscribeMessage('leave-topic')
  async handleLeaveTopic(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { topicId: string },
  ) {
    const room = `topic:${data.topicId}`;
    client.leave(room);
    
    // Notify others in the topic
    client.to(room).emit('user-left', {
      userId: client.userId,
      username: client.username,
      topicId: data.topicId,
    });
    
    return { success: true };
  }

  @SubscribeMessage('join-chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      console.error('[Gateway] Join chat failed: Unauthorized');
      return { error: 'Unauthorized' };
    }

    const room = `chat:${data.chatId}`;
    await client.join(room);
    
    const roomSize = this.server?.sockets?.adapter?.rooms?.get(room)?.size || 0;
    console.log(`[Gateway] ✅ User ${client.username} (${client.userId}) joined room: ${room}`);
    console.log(`[Gateway] Room ${room} now has ${roomSize} clients`);
    console.log(`[Gateway] Socket ID: ${client.id}`);
    
    // Notify others in the chat
    client.to(room).emit('user-joined-chat', {
      userId: client.userId,
      username: client.username,
      chatId: data.chatId,
    });
    
    return { success: true, chatId: data.chatId, roomSize };
  }

  @SubscribeMessage('leave-chat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const room = `chat:${data.chatId}`;
    client.leave(room);
    
    // Notify others in the chat
    client.to(room).emit('user-left-chat', {
      userId: client.userId,
      username: client.username,
      chatId: data.chatId,
    });
    
    return { success: true };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      // Save message to database (skip broadcast as we'll handle it here)
      const message = await this.chatService.sendMessage(client.userId, data, undefined, undefined, undefined, true);

      // Determine room to broadcast to
      let room: string;
      if (data.topicId) {
        room = `topic:${data.topicId}`;
      } else if (data.chatId) {
        room = `chat:${data.chatId}`;
      } else {
        return { error: 'Invalid message data' };
      }

      // Check if server is available (adapter should always exist if server exists)
      if (!this.server) {
        console.error('[Gateway] ❌ WebSocket server not available');
        // Still return success since message was saved, just can't broadcast
        return { success: true, message, warning: 'Message saved but broadcast failed' };
      }

      // Broadcast message to all clients in the room
      // Use optional chaining to safely access adapter
      const adapter = this.server.sockets?.adapter;
      const roomSize = adapter?.rooms?.get(room)?.size || 0;
      console.log(`[Gateway] 📤 Broadcasting message to room ${room} (${roomSize} clients)`);
      console.log(`[Gateway] Message details:`, { 
        id: message.id, 
        userId: message.userId, 
        content: message.content.substring(0, 50),
        room,
        roomSize,
      });
      
      // Get all sockets in the room for logging
      const roomSockets = adapter?.rooms?.get(room);
      if (roomSockets) {
        console.log(`[Gateway] Room ${room} contains sockets:`, Array.from(roomSockets));
      }
      
      // Only broadcast if adapter is available
      if (adapter) {
        // Emit to all in room (including sender)
        this.server.in(room).emit('new-message', message);
        
        // Also emit to sender's personal room as fallback
        this.server.to(`user:${client.userId}`).emit('new-message', message);
      } else {
        console.warn('[Gateway] ⚠️ Adapter not available, skipping broadcast (message still saved)');
      }
      
      console.log(`[Gateway] ✅ Message broadcasted to room ${room} (${roomSize} clients should receive it)`);

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { topicId?: string; chatId?: string; isTyping: boolean },
  ) {
    if (!client.userId) {
      return;
    }

    let room: string;
    if (data.topicId) {
      room = `topic:${data.topicId}`;
    } else if (data.chatId) {
      room = `chat:${data.chatId}`;
    } else {
      return;
    }

    // Broadcast typing indicator to others in the room
    client.to(room).emit('user-typing', {
      userId: client.userId,
      username: client.username,
      isTyping: data.isTyping,
    });
  }
}

