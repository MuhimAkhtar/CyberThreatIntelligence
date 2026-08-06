import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');

  // OpenAPI / Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('National Cyber Threat Intelligence Platform API')
    .setDescription('Enterprise CTI REST API providing threat feed ingestion, IOC analysis, vulnerability management, digital forensics, SIEM connectors, SOAR playbooks, and Kimi 3 AI incident reporting.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and Token Management')
    .addTag('Feeds', 'Threat Intelligence Feed Sources & Ingestion')
    .addTag('IOCs', 'Indicators of Compromise Query & Correlation')
    .addTag('CVEs', 'National Vulnerability Database Integration')
    .addTag('Alerts', 'Real-time Threat Detection Alerts')
    .addTag('Cases', 'SOC Investigation Case Management')
    .addTag('Forensics', 'Digital Forensics & Chain of Custody')
    .addTag('SIEM', 'Splunk HEC & Wazuh SIEM Connectors')
    .addTag('Playbooks', 'Automated SOAR Execution Engine')
    .addTag('MITRE', 'MITRE ATT&CK Matrix & Technique Mapping')
    .addTag('Reporting', 'AI Threat Intelligence Incident Summaries')
    .addTag('Notifications', 'Brevo SMTP Transactional Alerting')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Interactive OpenAPI Swagger Docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
