import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminGrpcController } from './admin.grpc.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [PrismaModule, ScheduleModule, HttpModule, StockModule],  
  controllers: [AdminController, AdminGrpcController],
  providers: [AdminService],
})
export class AdminModule {}
