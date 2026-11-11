import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';

import { IngressController } from './ingress.controller';
import { WaaSDispatcherService } from './dispatcher.service';
import { WebhookApp, WebhookAppSchema } from './schema/client.schema';
import { WebhookSubscription, WebhookSubscriptionSchema } from './schema/sub.schema';
import { WebhookDelivery, WebhookDeliverySchema } from './schema/delivery.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

  
    HttpModule,

    //safely load MONGODB_URI via ConfigService
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection: any) => {
          connection.on('connected', () => {
            console.log('✅ MongoDB connected');
          });

          connection.on('error', (error: any) => {
            console.error('❌ MongoDB connection error:', error);
          });

          connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
          });

          return connection;
        },
      }),
      inject: [ConfigService],
    }),

    // Mongoose Schemas
    MongooseModule.forFeature([{ name: WebhookApp.name, schema: WebhookAppSchema }]),
    MongooseModule.forFeature([{ name: WebhookSubscription.name, schema: WebhookSubscriptionSchema }]),
    MongooseModule.forFeature([{ name: WebhookDelivery.name, schema: WebhookDeliverySchema }]),
  ],
  controllers: [IngressController],
  providers: [WaaSDispatcherService],
})
export class AppModule {}
