import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  chatId?: string;

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

