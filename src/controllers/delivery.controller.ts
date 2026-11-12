
import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  NotFoundException, 
  HttpStatus, 
  HttpCode 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WebhookDelivery } from '../schema/delivery.schema';

@Controller('v1/deliveries')
export class DeliveriesController {
  constructor(
    @InjectModel(WebhookDelivery.name) private deliveryModel: Model<WebhookDelivery>,
  ) {}

  
  @Get(':id')
  async getDeliveryDetails(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid delivery ID format');
    }

    const delivery = await this.deliveryModel.findById(id).exec();

    if (!delivery) {
      throw new NotFoundException(`Delivery record with ID ${id} not found`);
    }

    return {
      success: true,
      data: {
        id: delivery._id,
        subscriptionId: delivery.subscriptionId,
        eventId: delivery.eventId,
        eventType: delivery.eventType,
        status: delivery.status,
        attempts: delivery.attempts,
        history: delivery.history, // Contains timestamps, status codes, response bodies, and errors
        createdAt: (delivery as any).createdAt,
        updatedAt: (delivery as any).updatedAt,
      },
    };
  }

   
  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  async retryDelivery(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid delivery ID format');
    }

    const delivery = await this.deliveryModel.findById(id).exec();

    if (!delivery) {
      throw new NotFoundException(`Delivery record with ID ${id} not found`);
    }

    delivery.status = 'PENDING';
    delivery.attempts = 0;


    delivery.history.push({
      attempt: 0,
      timestamp: new Date(),
      error: 'Manually triggered retry. Re-queued for immediate dispatch.',
    });

    await delivery.save();

    // TODO: Push back to RabbitMQ queue/dispatcher service
    // e.g., await this.dispatcherService.enqueueDelivery(delivery);

    return {
      success: true,
      message: 'Delivery re-queued successfully for immediate dispatch',
      data: {
        id: delivery._id,
        status: delivery.status,
        attempts: delivery.attempts,
      },
    };
  }
}
