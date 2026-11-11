import { Injectable, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebhookSubscription } from './schema/sub.schema';
import { WebhookDelivery } from './schema/delivery.schema';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import { Types } from 'mongoose';


@Injectable()
export class WaaSDispatcherService {
  private readonly logger = new Logger(WaaSDispatcherService.name);

  constructor(
    @InjectModel(WebhookSubscription.name) private subModel: Model<WebhookSubscription>,
    @InjectModel(WebhookDelivery.name) private deliveryModel: Model<WebhookDelivery>,
    private readonly httpService: HttpService,
  ) {}

  @EventPattern('event.ingested')
  async handleIngestedEvent(
    @Payload() data: { appId: string; eventId: string; eventType: string; payload: any }, 
    @Ctx() context: any) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    const { appId, eventId, eventType, payload } = data;

    //Find all client subscriptions matching this app and event type
  
const subscriptions = await this.subModel.find({
  appId: new Types.ObjectId(appId) as any,
  eventTypes: { $in: [eventType, '*'] },
});

for (const sub of subscriptions) {
  // Cast sub explicitly or use sub.toObject()._id if TypeScript complains about _id
  const subId = (sub as any)._id; 

  const deliveryRecord = await this.deliveryModel.create({
    subscriptionId: subId,
    eventId,
    eventType,
    payload,
    status: 'PENDING',
    attempts: 0,
  });

  await this.dispatchToClient(sub, deliveryRecord);
}

    // 2. Fan-out: Create a delivery 

    channel.ack(originalMessage);
  }

  private async dispatchToClient(subscription: any, delivery: any) {
    const rawPayload = JSON.stringify(delivery.payload);
    const signature = crypto.createHmac('sha256', subscription.secret).update(rawPayload).digest('hex');
    const attemptNumber = delivery.attempts + 1;

    try {
      const response = await firstValueFrom(
        this.httpService.post(subscription.url, delivery.payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-WaaS-Signature': `sha256=${signature}`,
            'X-WaaS-Event': delivery.eventType,
            'X-WaaS-Delivery-Id': delivery._id.toString(),
          },
          timeout: 5000,
        }),
      );

      // Success
      await this.deliveryModel.findByIdAndUpdate(delivery._id, {
        status: 'SUCCESS',
        attempts: attemptNumber,
        $push: {
          history: { attempt: attemptNumber, timestamp: new Date(), statusCode: response.status, responseBody: JSON.stringify(response.data).slice(0, 300) },
        },
      });
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.message;

      delivery.attempts = attemptNumber;
      delivery.history.push({ attempt: attemptNumber, timestamp: new Date(), statusCode, error: errorMessage });

      if (attemptNumber >= 5) {
        delivery.status = 'DEAD_LETTER';
        await delivery.save();
        this.logger.warn(`Delivery ${delivery._id} moved to DLQ after max retries.`);
        return;
      }

      delivery.status = 'FAILED';
      await delivery.save();
      
      // Exponential backoff logic would trigger a delayed retry here via Redis/RabbitMQ TTL
      this.logger.error(`Delivery ${delivery._id} failed (Attempt ${attemptNumber}). Scheduled for backoff retry.`);
    }
  }
}
