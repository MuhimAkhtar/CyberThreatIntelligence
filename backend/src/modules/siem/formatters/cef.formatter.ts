import { Injectable } from '@nestjs/common';

@Injectable()
export class CefFormatter {
  formatAlert(alert: any): string {
    const alertId = alert.id || 'unknown';
    const title = alert.title || 'Unknown Alert';
    const description = alert.description || 'No description provided';
    const sourceId = alert.sourceId || 'unknown';
    const sourceType = alert.sourceType || 'unknown';
    let severityNumber = 1;

    switch (alert.severity) {
      case 'CRITICAL':
        severityNumber = 10;
        break;
      case 'HIGH':
        severityNumber = 7;
        break;
      case 'MEDIUM':
        severityNumber = 4;
        break;
      case 'LOW':
      default:
        severityNumber = 1;
        break;
    }

    return `CEF:0|CTP|CyberThreatPlatform|1.0|${alertId}|${title}|${severityNumber}|msg=${description} cs1=${sourceId} cs1Label=SourceID cat=${sourceType}`;
  }

  formatBatch(alerts: any[]): string[] {
    return alerts.map(alert => this.formatAlert(alert));
  }
}
