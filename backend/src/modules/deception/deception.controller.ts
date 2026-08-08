import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HoneypotListenerService } from './honeypot-listener.service';

@ApiTags('Deception Mesh & Honeypots')
@Controller('deception')
export class DeceptionController {
  constructor(private readonly deceptionService: HoneypotListenerService) {}

  @Get('honeypot-logs')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Live Honeypot Perimeter Trap Captures' })
  @ApiResponse({ status: 200, description: 'Honeypot Trap Logs' })
  getHoneypotLogs() {
    return this.deceptionService.getHoneypotLogs();
  }

  @Get('canary-tokens')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Active Canary Tokens' })
  @ApiResponse({ status: 200, description: 'Canary Tokens' })
  getCanaryTokens() {
    return this.deceptionService.getCanaryTokens();
  }

  @Post('canary-tokens')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate New Canary Token' })
  @ApiResponse({ status: 201, description: 'Generated Canary Token' })
  createCanaryToken(@Body() body: { tokenType: any; targetAsset: string }) {
    return this.deceptionService.createCanaryToken(
      body.tokenType || 'CANARY_URL',
      body.targetAsset || 'NCTIP Production Core Subnet'
    );
  }
}
