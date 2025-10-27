import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, forkJoin } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { Scenario, ScenarioDifficulty } from '../models/scenario.model';
import { DeviceInput } from '../models/device.model';
import { API_ENDPOINTS, DEFAULT_USER_ID } from '../constants/api-endpoints';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScenarioService {
  private scenariosSubject = new BehaviorSubject<Scenario[]>([]);
  public scenarios$ = this.scenariosSubject.asObservable();

  private isBackendAvailable = false;

  constructor(private http: HttpClient) {
    this.checkBackendHealth();
    this.loadScenarios();
  }

  /**
   * Check if backend is available
   */
  private checkBackendHealth(): void {
    this.http.get<{message: string}>(API_ENDPOINTS.HEALTH)
      .pipe(
        catchError(() => of(null))
      )
      .subscribe(response => {
        this.isBackendAvailable = response !== null;
        if (this.isBackendAvailable) {
          console.log('Backend is available for scenarios');
        } else {
          console.log('Backend unavailable for scenarios, using localStorage');
        }
      });
  }

  /**
   * Get all scenarios
   */
  getScenarios(): Observable<Scenario[]> {
    if (this.isBackendAvailable) {
      // Use user-specific endpoint to get scenarios for the current user
      return this.http.get<{message: string, data: Scenario[]}>(API_ENDPOINTS.SCENARIOS.USER_SCENARIOS(DEFAULT_USER_ID))
        .pipe(
          map(response => response.data || []),
          tap(scenarios => this.scenariosSubject.next(scenarios)),
          catchError(error => {
            console.error('Error fetching scenarios from backend:', error);
            console.log('Falling back to localStorage');
            return this.getScenariosFromLocalStorage();
          })
        );
    } else {
      return this.getScenariosFromLocalStorage();
    }
  }

  /**
   * Get scenario by ID
   */
  getScenarioById(id: string): Observable<Scenario | null> {
    if (this.isBackendAvailable) {
      return this.http.get<{message: string, data: Scenario}>(API_ENDPOINTS.SCENARIOS.BY_ID(id))
        .pipe(
          map(response => response.data || null),
          catchError(error => {
            console.error('Error fetching scenario from backend:', error);
            console.log('Falling back to localStorage');
            return this.getScenarioFromLocalStorage(id);
          })
        );
    } else {
      return this.getScenarioFromLocalStorage(id);
    }
  }

  /**
   * Save scenario
   */
  saveScenario(scenario: Scenario): Observable<Scenario> {
    if (this.isBackendAvailable) {
      const isUpdate = !!scenario.id;
      
      if (isUpdate) {
        // Use PATCH for updates as per the backend API
        return this.http.patch<{message: string, data: Scenario}>(API_ENDPOINTS.SCENARIOS.UPDATE(scenario.id), {
          name: scenario.name,
          difficulty: scenario.difficulty,
          timeLimit: scenario.timeLimit,
          userId: DEFAULT_USER_ID
        }).pipe(
          map(response => response.data),
          tap(savedScenario => {
            const currentScenarios = this.scenariosSubject.value;
            const updatedScenarios = currentScenarios.map(s => s.id === savedScenario.id ? savedScenario : s);
            this.scenariosSubject.next(updatedScenarios);
          }),
          catchError(error => {
            console.error('Error updating scenario on backend:', error);
            console.log('Falling back to localStorage');
            return this.saveScenarioToLocalStorage(scenario);
          })
        );
      } else {
        // Use POST for creation with user-specific endpoint
        return this.http.post<{message: string, data: Scenario}>(API_ENDPOINTS.SCENARIOS.USER_CREATE(DEFAULT_USER_ID), {
          name: scenario.name,
          difficulty: scenario.difficulty,
          timeLimit: scenario.timeLimit
        }).pipe(
          map(response => response.data),
          tap(savedScenario => {
            const currentScenarios = this.scenariosSubject.value;
            this.scenariosSubject.next([...currentScenarios, savedScenario]);
          }),
          catchError(error => {
            console.error('Error creating scenario on backend:', error);
            console.log('Falling back to localStorage');
            return this.saveScenarioToLocalStorage(scenario);
          })
        );
      }
    } else {
      return this.saveScenarioToLocalStorage(scenario);
    }
  }

  /**
   * Update scenario
   */
  updateScenario(id: string, updates: Partial<Scenario>): Observable<Scenario> {
    if (this.isBackendAvailable) {
      return this.http.patch<{message: string, data: Scenario}>(API_ENDPOINTS.SCENARIOS.UPDATE(id), {
        ...updates,
        userId: DEFAULT_USER_ID
      }).pipe(
        map(response => response.data),
        tap(updatedScenario => {
          const currentScenarios = this.scenariosSubject.value;
          const updatedScenarios = currentScenarios.map(s => s.id === id ? updatedScenario : s);
          this.scenariosSubject.next(updatedScenarios);
        }),
        catchError(error => {
          console.error('Error updating scenario on backend:', error);
          console.log('Falling back to localStorage');
          return this.updateScenarioInLocalStorage(id, updates);
        })
      );
    } else {
      return this.updateScenarioInLocalStorage(id, updates);
    }
  }

  /**
   * Delete scenario
   */
  deleteScenario(id: string): Observable<void> {
    if (this.isBackendAvailable) {
      return this.http.delete<void>(API_ENDPOINTS.SCENARIOS.DELETE(id))
        .pipe(
          tap(() => {
            const currentScenarios = this.scenariosSubject.value;
            const filteredScenarios = currentScenarios.filter(s => s.id !== id);
            this.scenariosSubject.next(filteredScenarios);
          }),
          catchError(error => {
            console.error('Error deleting scenario from backend:', error);
            console.log('Falling back to localStorage');
            return this.deleteScenarioFromLocalStorage(id);
          })
        );
    } else {
      return this.deleteScenarioFromLocalStorage(id);
    }
  }

  /**
   * Check if backend is available
   */
  isBackendConnected(): boolean {
    return this.isBackendAvailable;
  }

  /**
   * Start scenario simulation
   */
  startSimulation(id: string, simulationParams: {
    Max_latency: number;
    Min_latency: number;
    error_probability: number;
  }): Observable<any> {
    if (this.isBackendAvailable) {
      return this.http.post<any>(API_ENDPOINTS.SCENARIOS.SIMULATE(id), {
        // start: true,
        ...simulationParams
      }).pipe(
        catchError(error => {
          console.error('Error starting simulation:', error);
          console.log('Simulation endpoint not available, using local simulation fallback');
          // Return a successful response for local simulation
          return of({
            success: true,
            message: 'Simulation started locally (backend endpoint unavailable)',
            simulationId: `local-${Date.now()}`,
            params: simulationParams
          });
        })
      );
    } else {
      console.log('Backend not available, using local simulation');
      return of({
        success: true,
        message: 'Simulation started locally (backend not available)',
        simulationId: `local-${Date.now()}`,
        params: simulationParams
      });
    }
  }

  /**
   * Stop scenario simulation
   */
  stopSimulation(id: string, simulationParams: {
    Max_latency: number;
    Min_latency: number;
    error_probability: number;
  }): Observable<any> {
    if (this.isBackendAvailable) {
      return this.http.post<any>(API_ENDPOINTS.SCENARIOS.SIMULATE(id), {
        start: false,
        ...simulationParams
      }).pipe(
        catchError(error => {
          console.error('Error stopping simulation:', error);
          console.log('Simulation endpoint not available, using local simulation fallback');
          // Return a successful response for local simulation
          return of({
            success: true,
            message: 'Simulation stopped locally (backend endpoint unavailable)',
            simulationId: `local-${Date.now()}`,
            params: simulationParams
          });
        })
      );
    } else {
      console.log('Backend not available, using local simulation');
      return of({
        success: true,
        message: 'Simulation stopped locally (backend not available)',
        simulationId: `local-${Date.now()}`,
        params: simulationParams
      });
    }
  }

  /**
   * Save scenario with devices (creates scenario first, then devices, then layout)
   */
  saveScenarioWithDevices(scenario: Scenario): Observable<Scenario> {
    if (this.isBackendAvailable) {
      // First create the scenario
      return this.saveScenario(scenario).pipe(
        switchMap(savedScenario => {
          // Then save devices if any exist
          if (scenario.devices && scenario.devices.length > 0) {
            const devicePromises = scenario.devices.map(device => 
              this.saveDeviceToScenario(savedScenario.id, device)
            );
            return forkJoin(devicePromises).pipe(
              switchMap(savedDevices => {
                // Filter out null results (failed saves)
                const validDevices = savedDevices.filter(device => device !== null);
                
                // Create layout data with device IDs and connections
                const layoutData = {
                  devices: validDevices.map(device => ({
                    id: device.id,
                    name: device.name,
                    type: device.type,
                    position: device.position || { x: 0, y: 0 },
                    pingRate: Math.max(1, device.parameters.pingRate),
                    latency: Math.max(1, device.parameters.latency),
                    trafficLoad: Math.max(0, device.parameters.trafficLoad),
                    connections: (device.connections || []).map((id: string) => parseInt(id.toString()))
                  }))
                };
                
                console.log('Saving layout data:', JSON.stringify(layoutData, null, 2));
                
                // Save the layout
                return this.saveNetworkLayout(savedScenario.id, layoutData).pipe(
                  map((layoutResponse) => {
                    console.log('Layout saved successfully:', layoutResponse);
                    return savedScenario;
                  }),
                  catchError(layoutError => {
                    console.error('Layout save failed, but scenario and devices were saved:', layoutError);
                    // Return the saved scenario even if layout save fails
                    return of(savedScenario);
                  })
                );
              })
            );
          }
          return of(savedScenario);
        })
      );
    } else {
      return this.saveScenarioToLocalStorage(scenario);
    }
  }

  /**
   * Save device to scenario
   */
  private saveDeviceToScenario(scenarioId: string, device: any): Observable<any> {
    const deviceData = {
      name: device.name,
      type: device.type,
      ipAddress: device.ipAddress,
      status: device.status,
      pingRate: device.parameters.pingRate,
      latency: device.parameters.latency,
      trafficLoad: device.parameters.trafficLoad,
      scenarioId: parseInt(scenarioId)
    };
    
    console.log('Creating device with data:', deviceData);
    
    return this.http.post<any>(API_ENDPOINTS.DEVICES.CREATE, deviceData).pipe(
      map(response => {
        console.log('Device created successfully:', response);
        return {
          id: response.data.id,
          name: response.data.name,
          type: response.data.type,
          position: device.position || { x: 0, y: 0 },
          parameters: {
            pingRate: response.data.pingRate,
            latency: response.data.latency,
            trafficLoad: response.data.trafficLoad
          },
          connections: device.connections || []
        };
      }),
      catchError(error => {
        console.error('Error saving device to scenario:', error);
        console.error('Device creation error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          body: error.error,
          url: error.url
        });
        return of(null);
      })
    );
  }

  /**
   * Save network layout to backend using the new full sync flow
   * This method supports both existing devices (numeric IDs) and new devices (string temp IDs)
   */
  saveLayout(scenarioId: number, devices: DeviceInput[]): Observable<any> {
    if (this.isBackendAvailable) {
      console.log('Saving layout using full sync flow:', API_ENDPOINTS.SCENARIOS.SAVE_LAYOUT(scenarioId.toString()));
      console.log('Device data:', JSON.stringify(devices, null, 2));
      
      return this.http.put<any>(API_ENDPOINTS.SCENARIOS.SAVE_LAYOUT(scenarioId.toString()), { devices })
        .pipe(
          tap(response => {
            console.log('Network layout saved successfully with full sync:', response);
            // Check if backend returned success message
            if (response && (response.status === 'success' || response.message)) {
              console.log('Backend confirmed successful save:', response.message);
            }
          }),
          catchError(error => {
            console.error('Error saving network layout with full sync:', error);
            console.error('Error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              body: error.error,
              url: error.url
            });
            
            // Check if it's actually an error or if the backend returned success
            if (error.status === 200 && error.error && error.error.status === 'success') {
              console.log('Backend returned success despite error status');
              return of(error.error);
            }
            
            return throwError(() => error);
          })
        );
    } else {
      console.log('Backend not available, saving to local storage');
      // For local storage, just save the layout data to the scenario
      return this.saveLayoutToLocalStorage(scenarioId.toString(), { devices });
    }
  }

  /**
   * Save network layout to backend (legacy method - kept for backward compatibility)
   */
  saveNetworkLayout(scenarioId: string, layout: any): Observable<any> {
    if (this.isBackendAvailable) {
      console.log('Saving layout to backend:', API_ENDPOINTS.SCENARIOS.SAVE_LAYOUT(scenarioId));
      console.log('Layout data:', JSON.stringify(layout, null, 2));
      
      return this.http.put<any>(API_ENDPOINTS.SCENARIOS.SAVE_LAYOUT(scenarioId), layout)
        .pipe(
          tap(response => {
            console.log('Network layout saved successfully:', response);
            // Check if backend returned success message
            if (response && (response.status === 'success' || response.message)) {
              console.log('Backend confirmed successful save:', response.message);
            }
          }),
          catchError(error => {
            console.error('Error saving network layout:', error);
            console.error('Error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              body: error.error,
              url: error.url
            });
            
            // Check if it's actually an error or if the backend returned success
            if (error.status === 200 && error.error && error.error.status === 'success') {
              console.log('Backend returned success despite error status');
              return of(error.error);
            }
            
            return throwError(() => error);
          })
        );
    } else {
      console.log('Backend not available, saving to local storage');
      // For local storage, just save the layout data to the scenario
      return this.saveLayoutToLocalStorage(scenarioId, layout);
    }
  }

  /**
   * Save layout to localStorage
   */
  private saveLayoutToLocalStorage(scenarioId: string, layout: any): Observable<any> {
    try {
      const savedScenarios = JSON.parse(localStorage.getItem('savedScenarios') || '[]');
      const scenarioIndex = savedScenarios.findIndex((s: Scenario) => s.id === scenarioId);
      
      if (scenarioIndex >= 0) {
        // Update the scenario with the layout data
        savedScenarios[scenarioIndex] = {
          ...savedScenarios[scenarioIndex],
          devices: layout.devices || savedScenarios[scenarioIndex].devices
        };
        localStorage.setItem('savedScenarios', JSON.stringify(savedScenarios));
        this.scenariosSubject.next(savedScenarios);
        return of({ success: true });
      } else {
        return throwError(() => new Error('Scenario not found for layout save'));
      }
    } catch (error) {
      console.error('Error saving layout to localStorage:', error);
      return throwError(() => new Error('Failed to save layout'));
    }
  }

  /**
   * Load scenarios from localStorage
   */
  private loadScenarios(): void {
    this.getScenarios().subscribe({
      next: (scenarios) => {
        this.scenariosSubject.next(scenarios);
      },
      error: (error) => {
        console.error('Error loading scenarios:', error);
        this.scenariosSubject.next([]);
      }
    });
  }

  /**
   * Get scenarios from localStorage
   */
  private getScenariosFromLocalStorage(): Observable<Scenario[]> {
    try {
      const savedScenarios = JSON.parse(localStorage.getItem('savedScenarios') || '[]');
      return of(savedScenarios);
    } catch (error) {
      console.error('Error parsing scenarios from localStorage:', error);
      return of([]);
    }
  }

  /**
   * Get scenario from localStorage by ID
   */
  private getScenarioFromLocalStorage(id: string): Observable<Scenario | null> {
    try {
      const savedScenarios = JSON.parse(localStorage.getItem('savedScenarios') || '[]');
      const scenario = savedScenarios.find((s: Scenario) => s.id === id);
      return of(scenario || null);
    } catch (error) {
      console.error('Error getting scenario from localStorage:', error);
      return of(null);
    }
  }

  /**
   * Save scenario to localStorage
   */
  private saveScenarioToLocalStorage(scenario: Scenario): Observable<Scenario> {
    try {
      const savedScenarios = JSON.parse(localStorage.getItem('savedScenarios') || '[]');
      const existingIndex = savedScenarios.findIndex((s: Scenario) => s.id === scenario.id);
      
      if (existingIndex >= 0) {
        savedScenarios[existingIndex] = scenario;
      } else {
        savedScenarios.push(scenario);
      }
      
      localStorage.setItem('savedScenarios', JSON.stringify(savedScenarios));
      this.scenariosSubject.next(savedScenarios);
      return of(scenario);
    } catch (error) {
      console.error('Error saving scenario to localStorage:', error);
      return throwError(() => new Error('Failed to save scenario'));
    }
  }

  /**
   * Update scenario in localStorage
   */
  private updateScenarioInLocalStorage(id: string, updates: Partial<Scenario>): Observable<Scenario> {
    try {
      const savedScenarios = JSON.parse(localStorage.getItem('savedScenarios') || '[]');
      const existingIndex = savedScenarios.findIndex((s: Scenario) => s.id === id);
      
      if (existingIndex >= 0) {
        savedScenarios[existingIndex] = { ...savedScenarios[existingIndex], ...updates };
        localStorage.setItem('savedScenarios', JSON.stringify(savedScenarios));
        this.scenariosSubject.next(savedScenarios);
        return of(savedScenarios[existingIndex]);
      } else {
        return throwError(() => new Error('Scenario not found'));
      }
    } catch (error) {
      console.error('Error updating scenario in localStorage:', error);
      return throwError(() => new Error('Failed to update scenario'));
    }
  }

  /**
   * Delete scenario from localStorage
   */
  private deleteScenarioFromLocalStorage(id: string): Observable<void> {
    try {
      const savedScenarios = JSON.parse(localStorage.getItem('savedScenarios') || '[]');
      const filteredScenarios = savedScenarios.filter((s: Scenario) => s.id !== id);
      localStorage.setItem('savedScenarios', JSON.stringify(filteredScenarios));
      this.scenariosSubject.next(filteredScenarios);
      return of(void 0);
    } catch (error) {
      console.error('Error deleting scenario from localStorage:', error);
      return throwError(() => new Error('Failed to delete scenario'));
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('HTTP Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
