import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Scenario, ScenarioDifficulty } from '../../models/scenario.model';
import { ScenarioService } from '../../services/scenario.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-scenario-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './scenario-list.component.html',
  styleUrl: './scenario-list.component.css'
})
export class ScenarioListComponent implements OnInit, OnDestroy {
  savedScenarios: Scenario[] = [];
  isLoading = false;
  private scenariosSubscription?: Subscription;

  constructor(private scenarioService: ScenarioService) {}

  ngOnInit(): void {
    this.loadSavedScenarios();
  }

  ngOnDestroy(): void {
    if (this.scenariosSubscription) {
      this.scenariosSubscription.unsubscribe();
    }
  }

  loadSavedScenarios(): void {
    this.isLoading = true;
    
    this.scenariosSubscription = this.scenarioService.getScenarios().subscribe({
      next: (scenarios) => {
        this.savedScenarios = scenarios;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading saved scenarios:', error);
        this.savedScenarios = [];
        this.isLoading = false;
      }
    });
  }

  loadScenario(scenario: Scenario): void {
    // Navigate to scenario editor with the selected scenario
    const scenarioData = encodeURIComponent(JSON.stringify(scenario));
    window.location.href = `/scenario-editor?scenario=${scenarioData}`;
  }

  deleteScenario(scenario: Scenario): void {
    if (confirm(`Are you sure you want to delete "${scenario.name}"? This action cannot be undone.`)) {
      this.scenarioService.deleteScenario(scenario.id).subscribe({
        next: () => {
          // The scenarios list will be updated automatically via the subscription
          console.log('Scenario deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting scenario:', error);
          alert('Error deleting scenario. Please try again.');
        }
      });
    }
  }

  loadScenarioFromFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const scenarioData = JSON.parse(e.target?.result as string);
          this.loadScenario(scenarioData);
        } catch (error) {
          alert('Error loading scenario file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }


  getDifficultyColor(difficulty: ScenarioDifficulty): string {
    switch (difficulty) {
      case 'Beginner':
        return '#4caf50';
      case 'Intermediate':
        return '#ff9800';
      case 'Advanced':
        return '#f44336';
      default:
        return '#6c757d';
    }
  }

  getDifficultyIcon(difficulty: ScenarioDifficulty): string {
    switch (difficulty) {
      case 'Beginner':
        return '🟢';
      case 'Intermediate':
        return '🟡';
      case 'Advanced':
        return '🔴';
      default:
        return '⚪';
    }
  }

  clearAllScenarios(): void {
    if (confirm('Are you sure you want to delete all saved scenarios? This action cannot be undone.')) {
      // Delete each scenario individually
      this.savedScenarios.forEach(scenario => {
        this.scenarioService.deleteScenario(scenario.id).subscribe({
          error: (error) => {
            console.error(`Error deleting scenario ${scenario.name}:`, error);
          }
        });
      });
    }
  }
}
