import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { PrismaService } from '../../prisma/prisma.service';

const mockAuthService = {
  register: jest.fn().mockResolvedValue({ accessToken: 'test' }),
  login: jest.fn().mockResolvedValue({ accessToken: 'test' }),
  refreshToken: jest.fn().mockResolvedValue({ accessToken: 'test' }),
  logout: jest.fn().mockResolvedValue({ success: true }),
};

const mockPrismaService = {};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideInterceptor(AuditLogInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should call register on authService', async () => {
    const dto = { email: 'a@a.com', password: 'p', firstName: 'f', lastName: 'l' };
    const res = await controller.register(dto);
    expect(mockAuthService.register).toHaveBeenCalledWith(dto, undefined);
    expect(res.accessToken).toBe('test');
  });

  it('should call login on authService', async () => {
    const dto = { email: 'a@a.com', password: 'p' };
    await controller.login(dto);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto, undefined);
  });
});
