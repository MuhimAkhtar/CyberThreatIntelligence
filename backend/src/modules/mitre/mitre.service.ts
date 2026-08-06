import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TechniqueQueryDto } from './dto/technique-query.dto';
import { MapTechniqueDto } from './dto/map-technique.dto';

const TACTICS = {
  'TA0043': 'Reconnaissance',
  'TA0042': 'Resource Development',
  'TA0001': 'Initial Access',
  'TA0002': 'Execution',
  'TA0003': 'Persistence',
  'TA0004': 'Privilege Escalation',
  'TA0005': 'Defense Evasion',
  'TA0006': 'Credential Access',
  'TA0007': 'Discovery',
  'TA0008': 'Lateral Movement',
  'TA0009': 'Collection',
  'TA0011': 'Command and Control',
  'TA0010': 'Exfiltration',
  'TA0040': 'Impact',
};

const TECHNIQUES = [
  // Reconnaissance
  { id: 'T1595', name: 'Active Scanning', tacticId: 'TA0043', description: 'Adversaries may execute active scans to gather information that can be used during targeting.', url: 'https://attack.mitre.org/techniques/T1595' },
  { id: 'T1592', name: 'Gather Victim Host Information', tacticId: 'TA0043', description: 'Adversaries may gather information about the victim host.', url: 'https://attack.mitre.org/techniques/T1592' },
  { id: 'T1589', name: 'Gather Victim Identity Information', tacticId: 'TA0043', description: 'Adversaries may gather information about victim identities.', url: 'https://attack.mitre.org/techniques/T1589' },
  { id: 'T1590', name: 'Gather Victim Network Information', tacticId: 'TA0043', description: 'Adversaries may gather information about the victim network.', url: 'https://attack.mitre.org/techniques/T1590' },
  // Resource Development
  { id: 'T1583', name: 'Acquire Infrastructure', tacticId: 'TA0042', description: 'Adversaries may buy, lease, or rent infrastructure.', url: 'https://attack.mitre.org/techniques/T1583' },
  { id: 'T1586', name: 'Compromise Accounts', tacticId: 'TA0042', description: 'Adversaries may compromise accounts that can be used to aid their operations.', url: 'https://attack.mitre.org/techniques/T1586' },
  { id: 'T1584', name: 'Compromise Infrastructure', tacticId: 'TA0042', description: 'Adversaries may compromise third-party infrastructure.', url: 'https://attack.mitre.org/techniques/T1584' },
  { id: 'T1587', name: 'Develop Capabilities', tacticId: 'TA0042', description: 'Adversaries may build capabilities.', url: 'https://attack.mitre.org/techniques/T1587' },
  // Initial Access
  { id: 'T1189', name: 'Drive-by Compromise', tacticId: 'TA0001', description: 'Adversaries may gain access by drive-by compromise.', url: 'https://attack.mitre.org/techniques/T1189' },
  { id: 'T1190', name: 'Exploit Public-Facing Application', tacticId: 'TA0001', description: 'Adversaries may exploit a weakness in an Internet-facing host.', url: 'https://attack.mitre.org/techniques/T1190' },
  { id: 'T1566', name: 'Phishing', tacticId: 'TA0001', description: 'Adversaries may send phishing messages to gain access to victim systems.', url: 'https://attack.mitre.org/techniques/T1566' },
  { id: 'T1078', name: 'Valid Accounts', tacticId: 'TA0001', description: 'Adversaries may obtain and abuse credentials of existing accounts.', url: 'https://attack.mitre.org/techniques/T1078' },
  // Execution
  { id: 'T1059', name: 'Command and Scripting Interpreter', tacticId: 'TA0002', description: 'Adversaries may abuse command and script interpreters to execute commands.', url: 'https://attack.mitre.org/techniques/T1059' },
  { id: 'T1203', name: 'Exploitation for Client Execution', tacticId: 'TA0002', description: 'Adversaries may exploit software vulnerabilities in client applications.', url: 'https://attack.mitre.org/techniques/T1203' },
  { id: 'T1053', name: 'Scheduled Task/Job', tacticId: 'TA0002', description: 'Adversaries may abuse task scheduling functionality.', url: 'https://attack.mitre.org/techniques/T1053' },
  { id: 'T1047', name: 'Windows Management Instrumentation', tacticId: 'TA0002', description: 'Adversaries may abuse WMI to execute malicious commands.', url: 'https://attack.mitre.org/techniques/T1047' },
  // Persistence
  { id: 'T1098', name: 'Account Manipulation', tacticId: 'TA0003', description: 'Adversaries may manipulate accounts to maintain access.', url: 'https://attack.mitre.org/techniques/T1098' },
  { id: 'T1547', name: 'Boot or Logon Autostart Execution', tacticId: 'TA0003', description: 'Adversaries may configure software to execute automatically on system boot.', url: 'https://attack.mitre.org/techniques/T1547' },
  { id: 'T1543', name: 'Create or Modify System Process', tacticId: 'TA0003', description: 'Adversaries may create or modify system-level processes.', url: 'https://attack.mitre.org/techniques/T1543' },
  { id: 'T1136', name: 'Create Account', tacticId: 'TA0003', description: 'Adversaries may create an account to maintain access.', url: 'https://attack.mitre.org/techniques/T1136' },
  // Privilege Escalation
  { id: 'T1548', name: 'Abuse Elevation Control Mechanism', tacticId: 'TA0004', description: 'Adversaries may bypass mechanisms designed to control elevate privileges.', url: 'https://attack.mitre.org/techniques/T1548' },
  { id: 'T1134', name: 'Access Token Manipulation', tacticId: 'TA0004', description: 'Adversaries may manipulate access tokens to operate under a different user.', url: 'https://attack.mitre.org/techniques/T1134' },
  { id: 'T1547.001', name: 'Registry Run Keys / Startup Folder', tacticId: 'TA0004', description: 'Adversaries may achieve persistence by adding a program to a startup folder or registry.', url: 'https://attack.mitre.org/techniques/T1547/001' },
  { id: 'T1543.001', name: 'Launch Agent', tacticId: 'TA0004', description: 'Adversaries may create or modify launch agents to execute malicious payloads.', url: 'https://attack.mitre.org/techniques/T1543/001' },
  // Defense Evasion
  { id: 'T1140', name: 'Deobfuscate/Decode Files or Information', tacticId: 'TA0005', description: 'Adversaries may use obfuscation to hide artifacts.', url: 'https://attack.mitre.org/techniques/T1140' },
  { id: 'T1070', name: 'Indicator Removal', tacticId: 'TA0005', description: 'Adversaries may delete or modify artifacts generated within systems.', url: 'https://attack.mitre.org/techniques/T1070' },
  { id: 'T1036', name: 'Masquerading', tacticId: 'TA0005', description: 'Adversaries may attempt to manipulate features of their artifacts to make them appear legitimate.', url: 'https://attack.mitre.org/techniques/T1036' },
  { id: 'T1027', name: 'Obfuscated Files or Information', tacticId: 'TA0005', description: 'Adversaries may attempt to make an executable or file difficult to discover or analyze.', url: 'https://attack.mitre.org/techniques/T1027' },
  // Credential Access
  { id: 'T1110', name: 'Brute Force', tacticId: 'TA0006', description: 'Adversaries may use brute force techniques to attempt access to accounts.', url: 'https://attack.mitre.org/techniques/T1110' },
  { id: 'T1003', name: 'OS Credential Dumping', tacticId: 'TA0006', description: 'Adversaries may attempt to dump credentials to obtain account login and credential material.', url: 'https://attack.mitre.org/techniques/T1003' },
  { id: 'T1555', name: 'Credentials from Password Stores', tacticId: 'TA0006', description: 'Adversaries may search for common password storage locations.', url: 'https://attack.mitre.org/techniques/T1555' },
  { id: 'T1040', name: 'Network Sniffing', tacticId: 'TA0006', description: 'Adversaries may sniff network traffic to capture information about an environment.', url: 'https://attack.mitre.org/techniques/T1040' },
  // Discovery
  { id: 'T1087', name: 'Account Discovery', tacticId: 'TA0007', description: 'Adversaries may attempt to get a listing of local system or domain accounts.', url: 'https://attack.mitre.org/techniques/T1087' },
  { id: 'T1083', name: 'File and Directory Discovery', tacticId: 'TA0007', description: 'Adversaries may enumerate files and directories.', url: 'https://attack.mitre.org/techniques/T1083' },
  { id: 'T1046', name: 'Network Service Discovery', tacticId: 'TA0007', description: 'Adversaries may attempt to get a listing of services listening on remote hosts.', url: 'https://attack.mitre.org/techniques/T1046' },
  { id: 'T1082', name: 'System Information Discovery', tacticId: 'TA0007', description: 'Adversaries may attempt to get detailed information about the operating system.', url: 'https://attack.mitre.org/techniques/T1082' },
  // Lateral Movement
  { id: 'T1210', name: 'Exploitation of Remote Services', tacticId: 'TA0008', description: 'Adversaries may exploit remote services to gain unauthorized access.', url: 'https://attack.mitre.org/techniques/T1210' },
  { id: 'T1534', name: 'Internal Spearphishing', tacticId: 'TA0008', description: 'Adversaries may use internal spearphishing to gain access to other users.', url: 'https://attack.mitre.org/techniques/T1534' },
  { id: 'T1570', name: 'Lateral Tool Transfer', tacticId: 'TA0008', description: 'Adversaries may transfer tools or other files between systems.', url: 'https://attack.mitre.org/techniques/T1570' },
  { id: 'T1021', name: 'Remote Services', tacticId: 'TA0008', description: 'Adversaries may use valid accounts to log into a service.', url: 'https://attack.mitre.org/techniques/T1021' },
  // Collection
  { id: 'T1560', name: 'Archive Collected Data', tacticId: 'TA0009', description: 'Adversaries may compress and/or encrypt data collected.', url: 'https://attack.mitre.org/techniques/T1560' },
  { id: 'T1119', name: 'Automated Collection', tacticId: 'TA0009', description: 'Adversaries may automate data collection.', url: 'https://attack.mitre.org/techniques/T1119' },
  { id: 'T1005', name: 'Data from Local System', tacticId: 'TA0009', description: 'Adversaries may search local system sources to find data of interest.', url: 'https://attack.mitre.org/techniques/T1005' },
  { id: 'T1039', name: 'Data from Network Shared Drive', tacticId: 'TA0009', description: 'Adversaries may search network shares on computers.', url: 'https://attack.mitre.org/techniques/T1039' },
  // Command and Control
  { id: 'T1071', name: 'Application Layer Protocol', tacticId: 'TA0011', description: 'Adversaries may communicate using application layer protocols to avoid detection.', url: 'https://attack.mitre.org/techniques/T1071' },
  { id: 'T1090', name: 'Connection Proxy', tacticId: 'TA0011', description: 'Adversaries may use a connection proxy to direct network traffic.', url: 'https://attack.mitre.org/techniques/T1090' },
  { id: 'T1132', name: 'Data Encoding', tacticId: 'TA0011', description: 'Adversaries may encode data to make the content of command and control traffic more difficult to detect.', url: 'https://attack.mitre.org/techniques/T1132' },
  { id: 'T1008', name: 'Fallback Channels', tacticId: 'TA0011', description: 'Adversaries may use fallback channels if the primary channel is compromised.', url: 'https://attack.mitre.org/techniques/T1008' },
  // Exfiltration
  { id: 'T1020', name: 'Automated Exfiltration', tacticId: 'TA0010', description: 'Adversaries may exfiltrate data through the use of automated processing.', url: 'https://attack.mitre.org/techniques/T1020' },
  { id: 'T1041', name: 'Exfiltration Over C2 Channel', tacticId: 'TA0010', description: 'Adversaries may steal data by exfiltrating it over an existing C2 channel.', url: 'https://attack.mitre.org/techniques/T1041' },
  { id: 'T1048', name: 'Exfiltration Over Alternative Protocol', tacticId: 'TA0010', description: 'Adversaries may steal data by exfiltrating it over a different protocol than the C2 channel.', url: 'https://attack.mitre.org/techniques/T1048' },
  { id: 'T1052', name: 'Exfiltration Over Physical Medium', tacticId: 'TA0010', description: 'Adversaries may steal data by exfiltrating it over a physical medium.', url: 'https://attack.mitre.org/techniques/T1052' },
  // Impact
  { id: 'T1531', name: 'Account Access Removal', tacticId: 'TA0040', description: 'Adversaries may interrupt availability of system and network resources by inhibiting access to accounts.', url: 'https://attack.mitre.org/techniques/T1531' },
  { id: 'T1485', name: 'Data Destruction', tacticId: 'TA0040', description: 'Adversaries may destroy data and files on specific systems.', url: 'https://attack.mitre.org/techniques/T1485' },
  { id: 'T1486', name: 'Data Encrypted for Impact', tacticId: 'TA0040', description: 'Adversaries may encrypt data on target systems to interrupt availability.', url: 'https://attack.mitre.org/techniques/T1486' },
  { id: 'T1490', name: 'Inhibit System Recovery', tacticId: 'TA0040', description: 'Adversaries may delete or remove built-in data and turn off services designed to aid in system recovery.', url: 'https://attack.mitre.org/techniques/T1490' }
];

@Injectable()
export class MitreService {
  private readonly logger = new Logger(MitreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedTechniques() {
    this.logger.log('Seeding MITRE ATT&CK techniques...');
    let seeded = 0;
    for (const tech of TECHNIQUES) {
      const tacticName = TACTICS[tech.tacticId as keyof typeof TACTICS] || 'Unknown';
      await this.prisma.mitreAttackTechnique.upsert({
        where: { id: tech.id },
        update: {
          name: tech.name,
          tacticId: tech.tacticId,
          tacticName,
          description: tech.description,
          url: tech.url,
        },
        create: {
          id: tech.id,
          name: tech.name,
          tacticId: tech.tacticId,
          tacticName,
          description: tech.description,
          url: tech.url,
        },
      });
      seeded++;
    }
    this.logger.log(`Seeded ${seeded} techniques.`);
    return { seeded };
  }

  async searchTechniques(query: TechniqueQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.tacticId) {
      where.tacticId = query.tacticId;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.mitreAttackTechnique.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.mitreAttackTechnique.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTechnique(id: string) {
    const technique = await this.prisma.mitreAttackTechnique.findUnique({
      where: { id },
      include: {
        _count: {
          select: { alertTechniques: true },
        },
      },
    });

    if (!technique) {
      throw new NotFoundException(`Technique ${id} not found`);
    }

    return technique;
  }

  async getAlertTechniques(alertId: string) {
    return this.prisma.alertTechnique.findMany({
      where: { alertId },
      include: {
        technique: true,
      },
    });
  }

  async mapAlertToTechnique(alertId: string, dto: MapTechniqueDto) {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    const technique = await this.prisma.mitreAttackTechnique.findUnique({ where: { id: dto.techniqueId } });
    if (!technique) {
      throw new NotFoundException(`Technique ${dto.techniqueId} not found`);
    }

    return this.prisma.alertTechnique.upsert({
      where: {
        alertId_techniqueId: {
          alertId,
          techniqueId: dto.techniqueId,
        },
      },
      update: {
        confidence: dto.confidence ?? 50,
      },
      create: {
        alertId,
        techniqueId: dto.techniqueId,
        confidence: dto.confidence ?? 50,
      },
    });
  }

  async unmapAlertTechnique(alertId: string, techniqueId: string) {
    const existing = await this.prisma.alertTechnique.findUnique({
      where: {
        alertId_techniqueId: {
          alertId,
          techniqueId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`AlertTechnique mapping not found`);
    }

    await this.prisma.alertTechnique.delete({
      where: {
        alertId_techniqueId: {
          alertId,
          techniqueId,
        },
      },
    });

    return { success: true };
  }

  async getCoverageHeatmap() {
    const techniques = await this.prisma.mitreAttackTechnique.findMany({
      include: {
        alertTechniques: {
          select: {
            alertId: true,
          }
        }
      }
    });

    const tacticMap = new Map<string, { tacticId: string, tacticName: string, techniqueCount: number, alertCount: number, alertIds: Set<string> }>();

    for (const [tacticId, tacticName] of Object.entries(TACTICS)) {
      tacticMap.set(tacticId, {
        tacticId,
        tacticName,
        techniqueCount: 0,
        alertCount: 0,
        alertIds: new Set<string>()
      });
    }

    for (const tech of techniques) {
      const tacticData = tacticMap.get(tech.tacticId);
      if (tacticData) {
        tacticData.techniqueCount++;
        for (const at of tech.alertTechniques) {
          tacticData.alertIds.add(at.alertId);
        }
      } else {
         if (!tacticMap.has(tech.tacticId)) {
            tacticMap.set(tech.tacticId, {
                tacticId: tech.tacticId,
                tacticName: tech.tacticId,
                techniqueCount: 0,
                alertCount: 0,
                alertIds: new Set<string>()
            });
         }
         const tData = tacticMap.get(tech.tacticId)!;
         tData.techniqueCount++;
         for (const at of tech.alertTechniques) {
             tData.alertIds.add(at.alertId);
         }
      }
    }

    const coverage = Array.from(tacticMap.values()).map(data => {
      return {
        tacticId: data.tacticId,
        tacticName: data.tacticName,
        techniqueCount: data.techniqueCount,
        alertCount: data.alertIds.size,
      };
    });

    const zeroCoverageTactics = coverage.filter(c => c.alertCount === 0);

    return {
      coverage,
      zeroCoverageTactics
    };
  }
}
