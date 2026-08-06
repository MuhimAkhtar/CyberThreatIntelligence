import { AlertSeverity, CveSeverity } from '@prisma/client';

export function mapCveSeverityToAlertSeverity(cveSeverity: CveSeverity | string): AlertSeverity {
  const sev = (cveSeverity || '').toString().toUpperCase();
  switch (sev) {
    case 'CRITICAL':
      return AlertSeverity.CRITICAL;
    case 'HIGH':
      return AlertSeverity.HIGH;
    case 'MEDIUM':
      return AlertSeverity.MEDIUM;
    case 'LOW':
      return AlertSeverity.LOW;
    default:
      return AlertSeverity.LOW;
  }
}

export function mapConfidenceScoreToAlertSeverity(confidenceScore: number): AlertSeverity {
  if (confidenceScore >= 85) return AlertSeverity.CRITICAL;
  if (confidenceScore >= 70) return AlertSeverity.HIGH;
  if (confidenceScore >= 40) return AlertSeverity.MEDIUM;
  return AlertSeverity.LOW;
}
