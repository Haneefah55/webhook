
import { Controller, Post, Body, Get, Param, HttpStatus, HttpCode, UnauthorizedException, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid'
import { WebhookApp } from '../schema/client.schema';
import { CreateAppDto } from '../dtos/create-app.dto';
import { JwtAuthGuard } from '../guards/auth.guard'


@Controller('v1/apps')
export class AppsController {
  constructor(
    @InjectModel(WebhookApp.name) private appModel: Model<WebhookApp>,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createApp(@Req() req: any, 
                  @Body() createAppDto: CreateAppDto) {

    const userId = req.user.sub
    
    if (!userId) {
      throw new UnauthorizedException('User context missing from token');
    }
    
    const appExist = await this.appModel.findOne({ name: createAppDto.name })

    if(appExist){
      return {
        success: false,
        message: 'Webhook application already exist',
 
      }
    }
    const newApp = await this.appModel.create({
      name: createAppDto.name,
      ownerId: userId,
      apiKey: nanoid(12)
    });

    return {
      success: true,
      message: 'Webhook application created successfully',
      data: {
        appId: newApp._id,
        name: newApp.name,
        apiKey: newApp.apiKey,
        createdAt: (newApp as any).createdAt,
      },
    };
  }

  @Get()
  async listApps() {
    const apps = await this.appModel.find().exec();
    return {
      success: true,
      count: apps.length,
      data: apps,
    };
  }
}
