import { Injectable, inject } from '@angular/core';
import { DeviceService } from './device.service';
import { DemoDataService } from './demo-data.service';
import { environment } from '../../environments/environment';

/**
 * Service responsible for initializing application data
 * Separates data seeding logic from presentation components
 */
@Injectable({
  providedIn: 'root'
})
export class DataInitializationService {
  private deviceService = inject(DeviceService);
  private demoDataService = inject(DemoDataService);
  private initialized = false;

  /**
   * Initialize application data based on environment configuration
   */
  async initializeApplicationData(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize demo data through the dedicated service
      if (environment.demoData?.enabled) {
        await this.demoDataService.initializeDemoData(environment.demoData);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize application data:', error);
      throw error;
    }
  }

  /**
   * Reset application data (useful for testing or reloading scenarios)
   */
  async resetApplicationData(): Promise<void> {
    try {
      if (environment.demoData?.enabled) {
        await this.demoDataService.resetDemoData(environment.demoData);
      }
      
      this.initialized = false;
    } catch (error) {
      console.error('Failed to reset application data:', error);
      throw error;
    }
  }

  /**
   * Check if data has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
