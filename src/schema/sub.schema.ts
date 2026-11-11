import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class WebhookSubscription extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'WebhookApp', required: true })
  appId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  url!: string; // The client's endpoint URL to receive webhooks

  @Prop({ type: [String], required: true })
  eventTypes!: string[]; // e.g., ['paystack.charge.success', 'resend.email.sent']

  @Prop({ required: true })
  secret!: string; // Secret used to sign outgoing payloads to this client
}
export const WebhookSubscriptionSchema = SchemaFactory.createForClass(WebhookSubscription);
