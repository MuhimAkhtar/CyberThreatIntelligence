import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SigmaCompilerService, SigmaRule } from './sigma-compiler.service';

@ApiTags('Sigma Rule Compiler Engine')
@Controller('sigma')
@UseGuards(JwtAuthGuard)
export class SigmaController {
  constructor(private readonly sigmaService: SigmaCompilerService) {}

  @Get('rules')
  @ApiOperation({ summary: 'List Preloaded Community Sigma Detection Rules' })
  @ApiResponse({ status: 200, description: 'Preloaded Sigma Detection Rules' })
  getRules() {
    return this.sigmaService.getPreloadedSigmaRules();
  }

  @Post('compile')
  @ApiOperation({ summary: 'Compile Sigma Rule YAML into Elasticsearch DSL Query' })
  @ApiResponse({ status: 200, description: 'Compiled Elasticsearch DSL Query Output' })
  compileRule(@Body() body: { rule: SigmaRule }) {
    const ruleToCompile = body.rule || this.sigmaService.getPreloadedSigmaRules()[0];
    return this.sigmaService.compileSigmaRule(ruleToCompile);
  }
}
