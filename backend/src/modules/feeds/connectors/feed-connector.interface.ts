export interface RawIndicator {
  type: string;
  value: string;
  category?: string;
  comment?: string;
  tags?: string[];
  confidence?: number;
  timestamp?: string;
  rawData?: Record<string, unknown>;
}

export interface FeedConnector {
  fetchIndicators(since?: Date): Promise<RawIndicator[]>;
}
