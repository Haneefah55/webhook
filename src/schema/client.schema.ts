import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WebhookApp extends Document {
  @Prop({ required: true, unique: true })
  name!: string; // e.g., "My SaaS Customer Inc"
  
  @Prop({ required: true })
  ownerId!: string; 
  
  @Prop({ required: true, unique: true })
  apiKey!: string; 
}
export const WebhookAppSchema = SchemaFactory.createForClass(WebhookApp);
