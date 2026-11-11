import { Controller, Post, Param, Req, UseGuards, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebhookApp } from './schema/client.schema';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Controller('v1/ingress')
export class IngressController {
  private rabbitClient: ClientProxy;

  constructor(
    @InjectModel(WebhookApp.name) private appModel: Model<WebhookApp>) {
    this.rabbitClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'waas_ingress_queue',
      },
    });
  }

  @Post(':appId')
  @HttpCode(HttpStatus.OK)
  async handleIncomingWebhook(
    @Param('appId') appId: string, 
    @Req() req: Request & { body: any }) {
    // 1. Verify app exists
    const app = await this.appModel.findById(appId);
    if (!app) {
      throw new NotFoundException('Application target not found');
    }

    const event = req.body;

    // 2. Push raw event to RabbitMQ for asynchronous processing & fan-out
    this.rabbitClient.emit('event.ingested', {
      appId,
      eventId: event.id || `evt_${Date.now()}`,
      eventType: event.event || event.type,
      payload: event,
    });

    return { status: 'accepted' };
  }
}
