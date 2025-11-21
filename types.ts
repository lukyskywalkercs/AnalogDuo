export enum FilterType {
  NONE = 'NONE',
  KODAK_GOLD = 'KODAK_GOLD',
  FUJI_PRO_400H = 'FUJI_PRO_400H',
}

export interface AnalysisResult {
  suggestedFilter: FilterType;
  reasoning: string;
  caption: string;
}

export enum AppView {
  LANDING = 'LANDING',
  CAMERA = 'CAMERA',
  EDITOR = 'EDITOR',
}