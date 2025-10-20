import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Scenario, ScenarioDifficulty } from '../../models/scenario.model';
import { DeviceListComponent } from '../device-list/device-list.component';

@Component({
  selector: 'app-scenario-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DeviceListComponent],
  templateUrl: './scenario-editor.component.html',
  styleUrl: './scenario-editor.component.css'
})
export class ScenarioEditorComponent {
  scenario: Scenario = {
    id: '',
    name: '',
    difficulty: 'Beginner',
    timeLimit: 15,
    devices: [],
    connections: []
  };

  difficultyOptions: ScenarioDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  saveScenario(): void {
    const jsonData = JSON.stringify(this.scenario, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.scenario.name || 'scenario'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
