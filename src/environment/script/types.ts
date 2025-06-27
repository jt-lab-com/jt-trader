export interface StrategyItem {
  id: string;
  name: string;
  type: StrategyItemType;
  mode?: 'runtime' | 'tester';
  path?: string;
  version?: string;
}

export type StrategyItemType = 'local' | 'bundle' | 'app';
