import { Device } from './device.model';
import { Connection } from './connection.model';

export interface Scenario {
  name: string;
  difficulty: ScenarioDifficulty;
  timeLimit: number; // in minutes
  devices: Device[];
  connections: Connection[];
}

export type ScenarioDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
