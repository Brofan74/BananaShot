export enum Tool {
  Brush = 'BRUSH',
  Filters = 'FILTERS',
  Voice = 'VOICE',
  Enhance = 'ENHANCE',
  Frame = 'FRAME',
}

export interface Filter {
  name: string;
  prompt: string;
  isPro: boolean;
}