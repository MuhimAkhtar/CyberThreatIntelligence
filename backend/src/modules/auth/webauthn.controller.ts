import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebAuthnService } from './webauthn.service';

@ApiTags('WebAuthn FIDO2 Security')
@Controller('auth/webauthn')
export class WebAuthnController {
  constructor(private readonly webAuthnService: WebAuthnService) {}

  @Post('generate-options')
  @ApiOperation({ summary: 'Generate FIDO2 WebAuthn Hardware Key Options' })
  @ApiResponse({ status: 200, description: 'FIDO2 WebAuthn Challenge Options' })
  generateOptions(@Body() body: { email: string }) {
    return this.webAuthnService.generateRegistrationOptions(body.email || 'user.admin@nctip.gov');
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify FIDO2 Hardware Key Signature' })
  @ApiResponse({ status: 200, description: 'FIDO2 Signature Verification Status' })
  verifyResponse(@Body() body: { email: string; clientDataJSON: string; attestationObject: string }) {
    return this.webAuthnService.verifyRegistrationResponse(
      body.email || 'user.admin@nctip.gov',
      body.clientDataJSON || '',
      body.attestationObject || ''
    );
  }
}
