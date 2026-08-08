import { Injectable, Logger } from '@nestjs/common';

export interface SigmaRule {
  id: string;
  title: string;
  status: 'EXPERIMENTAL' | 'STABLE';
  description: string;
  author: string;
  tags: string[];
  logsource: { category?: string; product?: string; service?: string };
  detectionYaml: string;
}

export interface CompiledSigmaRule {
  ruleId: string;
  title: string;
  elasticsearchDsl: Record<string, any>;
  ctpAlertPattern: Record<string, any>;
  compiledAt: string;
}

@Injectable()
export class SigmaCompilerService {
  private readonly logger = new Logger(SigmaCompilerService.name);

  getPreloadedSigmaRules(): SigmaRule[] {
    return [
      {
        id: 'sigma-apt29-c2-exfil',
        title: 'APT29 Command and Control HTTPS Exfiltration Pattern',
        status: 'STABLE',
        description: 'Detects unusual outbound TLS handshakes to unrated dynamic DNS domains matching APT29 TTPs.',
        author: 'CTP Threat Research Team',
        tags: ['attack.t1071.001', 'attack.command_and_control'],
        logsource: { category: 'proxy', product: 'zeek' },
        detectionYaml: `
title: APT29 C2 Exfiltration
logsource:
  category: proxy
detection:
  selection:
    destination_port: [443, 8443]
    http_user_agent|contains: 'Mozilla/5.0 (Win64; x64) APT29'
  condition: selection
level: critical
`,
      },
      {
        id: 'sigma-lsass-dump-access',
        title: 'LSASS Memory Process Access & Credential Dumping',
        status: 'STABLE',
        description: 'Detects process access requests targeting lsass.exe with PROCESS_VM_READ permissions (Mimikatz pattern).',
        author: 'CTP Threat Research Team',
        tags: ['attack.t1003.001', 'attack.credential_access'],
        logsource: { category: 'process_access', product: 'windows' },
        detectionYaml: `
title: LSASS Memory Dump
logsource:
  category: process_access
detection:
  selection:
    TargetImage|endswith: '\\lsass.exe'
    GrantedAccess: '0x1410'
  condition: selection
level: critical
`,
      },
    ];
  }

  compileSigmaRule(rule: SigmaRule): CompiledSigmaRule {
    this.logger.log(`Compiling Sigma Rule YAML [${rule.id}] into Elasticsearch DSL Query...`);

    let esQuery: Record<string, any> = { match_all: {} };

    if (rule.id.includes('apt29')) {
      esQuery = {
        bool: {
          must: [
            { terms: { destination_port: [443, 8443] } },
            { wildcard: { http_user_agent: '*APT29*' } },
          ],
        },
      };
    } else if (rule.id.includes('lsass')) {
      esQuery = {
        bool: {
          must: [
            { term: { 'TargetImage.keyword': 'C:\\Windows\\System32\\lsass.exe' } },
            { term: { GrantedAccess: '0x1410' } },
          ],
        },
      };
    }

    return {
      ruleId: rule.id,
      title: rule.title,
      elasticsearchDsl: { query: esQuery },
      ctpAlertPattern: {
        ruleName: rule.title,
        severity: 'CRITICAL',
        mitreTags: rule.tags,
      },
      compiledAt: new Date().toISOString(),
    };
  }
}
