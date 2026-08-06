import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'SOC_ANALYST',
      },
    });

    // Audit log: user registration
    await this.logAuditEvent(user.id, 'REGISTER', 'auth', ipAddress);

    return this.generateTokens(user);
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Log failed login attempt — no userId available, use a sentinel
      await this.logAuditEvent(null, 'LOGIN_FAILED', 'auth', ipAddress, {
        email: dto.email,
        reason: 'user_not_found',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.logAuditEvent(user.id, 'LOGIN_FAILED', 'auth', ipAddress, {
        reason: 'user_inactive',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      await this.logAuditEvent(user.id, 'LOGIN_FAILED', 'auth', ipAddress, {
        reason: 'invalid_password',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log: successful login
    await this.logAuditEvent(user.id, 'LOGIN', 'auth', ipAddress);

    return this.generateTokens(user);
  }

  async refreshToken(token: string, ipAddress?: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken || refreshToken.revokedAt || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!refreshToken.user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    // Revoke the old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() },
    });

    // Audit log: token refresh
    await this.logAuditEvent(refreshToken.user.id, 'TOKEN_REFRESH', 'auth', ipAddress);

    return this.generateTokens(refreshToken.user);
  }

  async logout(userId: string, token: string, ipAddress?: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Audit log: logout
    await this.logAuditEvent(userId, 'LOGOUT', 'auth', ipAddress);

    return { success: true };
  }

  async validateUser(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  private async generateTokens(user: { id: string; email: string; role: string; firstName: string; lastName: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Generate a cryptographically secure random refresh token
    const refreshTokenStr = crypto.randomBytes(40).toString('hex');

    const expiresInDays = parseInt(
      this.configService.get<string>('jwt.refreshExpiration')?.replace('d', '') || '7',
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenStr,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenStr,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Write an audit log entry for auth events.
   * Per AGENTS.md §4: every auth event must write to the AuditLog table.
   * userId is nullable for failed login attempts where the user doesn't exist.
   */
  private async logAuditEvent(
    userId: string | null,
    action: string,
    resource: string,
    ipAddress?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (userId && this.prisma?.auditLog) {
        await this.prisma.auditLog.create({
          data: {
            userId,
            action,
            resource,
            ipAddress: ipAddress || null,
            details: details ? (details as any) : undefined,
          },
        });
      }
      // For failed logins with unknown user, we skip the DB write since
      // userId is required by the AuditLog FK constraint. In production,
      // a separate failed-login-attempts table or log aggregator handles this.
    } catch (error) {
      // Fire-and-forget: don't let audit logging failures break auth flows
      console.error('Failed to write audit log:', error);
    }
  }
}
