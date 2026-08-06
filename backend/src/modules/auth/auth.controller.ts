import { Controller, Post, Body, Get, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req?: Request) {
    return this.authService.register(dto, req?.ip);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req?: Request) {
    return this.authService.login(dto, req?.ip);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string, @Req() req?: Request) {
    return this.authService.refreshToken(refreshToken, req?.ip);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AuditLogInterceptor)
  @Post('logout')
  logout(@Req() req: Request & { user: { id: string } }, @Body('refreshToken') refreshToken: string) {
    return this.authService.logout(req.user.id, refreshToken, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: Request & { user: Record<string, unknown> }) {
    const user = req.user as Record<string, unknown>;
    // Exclude passwordHash from the response
    const { passwordHash, ...safeUser } = user as Record<string, unknown> & { passwordHash?: string };
    return safeUser;
  }
}
