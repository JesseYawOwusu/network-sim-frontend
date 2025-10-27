import { Device } from './device.model';
import { Connection } from './connection.model';

export interface Scenario {
  id: string;
  name: string;
  difficulty: ScenarioDifficulty;
  timeLimit: number; // in minutes
  passingScore: number; // percentage
  description: string;
  devices: Device[];
  connections: Connection[];
}

export type ScenarioDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
