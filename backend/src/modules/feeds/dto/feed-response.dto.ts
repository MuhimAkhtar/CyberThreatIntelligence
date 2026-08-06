import { FeedType } from '@prisma/client';

export class FeedResponseDto {
  id!: string;
  name!: string;
  type!: FeedType;
  baseUrl!: string | null;
  enabled!: boolean;
  fetchIntervalMinutes!: number;
  lastSyncAt!: Date | null;
}
