import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import dotenv from 'dotenv'
import cookieParser from "cookie-parser"
import { ValidationPipe, BadRequestException } from '@nestjs/common';


dotenv.config()
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  
  app.setGlobalPrefix("api")
	app.enableCors()
  app.use(cookieParser())

  

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    exceptionFactory: (errors: any) => {
      const messages = errors.map((err: any) =>
        Object.values(err.constraints || {}).join(', '),
      );
      return new BadRequestException({
        statusCode: 400,
        error: 'Invalid Payload',
        message: messages,
      });
    },
  }),
);

  
  
  
  await app.listen(process.env.PORT ?? 3000);

  
  
}
bootstrap();
