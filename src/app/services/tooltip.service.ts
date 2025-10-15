import { Injectable, ElementRef } from '@angular/core';

export interface TooltipPosition {
  x: number;
  y: number;
  adjusted: boolean;
}

export interface TooltipConfig {
  content: string;
  position: { x: number; y: number };
  maxWidth?: number;
  offset?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TooltipService {

  /**
   * Calculate optimal tooltip position with viewport bounds checking
   */
  calculateTooltipPosition(
    mousePosition: { x: number; y: number },
    tooltipElement: HTMLElement,
    offset: number = 10
  ): TooltipPosition {
    const viewport = this.getViewportDimensions();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    
    let x = mousePosition.x + offset;
    let y = mousePosition.y - offset;
    let adjusted = false;

    // Check horizontal overflow
    if (x + tooltipRect.width > viewport.width) {
      x = mousePosition.x - tooltipRect.width - offset;
      adjusted = true;
    }

    // Check vertical overflow
    if (y - tooltipRect.height < 0) {
      y = mousePosition.y + tooltipRect.height + offset;
      adjusted = true;
    }

    // Ensure tooltip stays within viewport bounds
    x = Math.max(0, Math.min(x, viewport.width - tooltipRect.width));
    y = Math.max(0, Math.min(y, viewport.height - tooltipRect.height));

    return { x, y, adjusted };
  }

  /**
   * Get viewport dimensions
   */
  private getViewportDimensions(): { width: number; height: number } {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }

  /**
   * Create accessible tooltip element
   */
  createAccessibleTooltip(content: string, targetElement: HTMLElement): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.className = 'accessible-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-live', 'polite');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.textContent = content;
    
    // Add to DOM temporarily to measure
    document.body.appendChild(tooltip);
    
    return tooltip;
  }

  /**
   * Remove tooltip element
   */
  removeTooltip(tooltip: HTMLElement): void {
    if (tooltip && tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
  }

  /**
   * Show tooltip with proper positioning
   */
  showTooltip(
    content: string,
    mousePosition: { x: number; y: number },
    container?: ElementRef<HTMLElement>
  ): HTMLElement {
    const tooltip = this.createAccessibleTooltip(content, container?.nativeElement || document.body);
    
    // Position tooltip
    const position = this.calculateTooltipPosition(mousePosition, tooltip);
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${position.x}px`;
    tooltip.style.top = `${position.y}px`;
    tooltip.style.zIndex = '1000';
    tooltip.setAttribute('aria-hidden', 'false');

    return tooltip;
  }

  /**
   * Hide tooltip
   */
  hideTooltip(tooltip: HTMLElement): void {
    if (tooltip) {
      tooltip.setAttribute('aria-hidden', 'true');
      this.removeTooltip(tooltip);
    }
  }
}
