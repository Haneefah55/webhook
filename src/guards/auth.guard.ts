
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken'; // Or use @nestjs/jwt JwtService

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 1. Extract the token from cookies (requires cookie-parser middleware)
    // Assuming your cookie name is 'access_token' or 'jwt'
    const token = request.cookies?.access_token || request.cookies?.jwt;

    if (!token) {
      throw new UnauthorizedException('Missing authentication cookie');
    }

    try {
      // 2. Verify the JWT token
      const jwtSecret = process.env.JWT_SECRET! || 'super_secret_jwt_key';
      const payload = jwt.verify(token, jwtSecret);

      // 3. Attach user/payload to request object so controllers can access it
      request.user = payload;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token cookie');
    }
  }
}
