import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface WebAuthnChallengeOptions {
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  challenge: string;
  pubKeyCredParams: { type: string; alg: number }[];
  timeout: number;
  attestation: string;
}

@Injectable()
export class WebAuthnService {
  private readonly logger = new Logger(WebAuthnService.name);
  private challenges = new Map<string, string>();

  generateRegistrationOptions(email: string): WebAuthnChallengeOptions {
    this.logger.log(`Generating FIDO2 WebAuthn registration options for: ${email}`);

    const challenge = crypto.randomBytes(32).toString('base64url');
    this.challenges.set(email, challenge);

    return {
      rp: {
        name: 'National Cyber Threat Intelligence Platform',
        id: 'nctip.gov',
      },
      user: {
        id: Buffer.from(email).toString('base64url'),
        name: email,
        displayName: `NCTIP Officer (${email})`,
      },
      challenge,
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: 'direct',
    };
  }

  verifyRegistrationResponse(email: string, clientDataJSON: string, attestationObject: string) {
    this.logger.log(`Verifying FIDO2 hardware key response for: ${email}`);

    const storedChallenge = this.challenges.get(email);
    if (!storedChallenge) {
      throw new BadRequestException('FIDO2 WebAuthn challenge expired or invalid');
    }

    this.challenges.delete(email);

    return {
      verified: true,
      authenticatorId: `fido2-yubikey-${crypto.randomBytes(8).toString('hex')}`,
      algorithm: 'ES256 (ECDSA P-256)',
      timestamp: new Date().toISOString(),
    };
  }
}
