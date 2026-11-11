import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class WebhookDelivery extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'WebhookSubscription', required: true })
  subscriptionId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  eventId!: string; // Original third-party event ID

  @Prop({ required: true })
  eventType!: string;

  @Prop({ type: Object, required: true })
  payload!: Record<string, any>;

  @Prop({ enum: ['PENDING', 'SUCCESS', 'FAILED', 'DEAD_LETTER'], default: 'PENDING' })
  status!: string;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ type: [Object], default: [] })
  history!: Array<{
    attempt: number;
    timestamp: Date;
    statusCode?: number;
    responseBody?: string;
    error?: string;
  }>;
}
export const WebhookDeliverySchema = SchemaFactory.createForClass(WebhookDelivery);
