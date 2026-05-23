import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingState } from '../services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loadingState.isLoading"
         class="fixed inset-0 flex items-end justify-center"
         style="z-index: 9999; pointer-events: none;">
      <!-- Toast no topo -->
      <div class="mb-safe flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl mb-8"
           style="background: rgba(28,28,40,0.96); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); pointer-events: auto;">
        <!-- Spinner minimalista -->
        <div class="relative w-5 h-5 flex-shrink-0">
          <div class="absolute inset-0 rounded-full"
               style="border: 2px solid rgba(255,255,255,0.1);"></div>
          <div class="absolute inset-0 rounded-full animate-spin"
               style="border: 2px solid transparent; border-top-color: #e74c3c;"></div>
        </div>
        <span class="text-sm font-medium text-white">{{ loadingState.message || 'Carregando...' }}</span>
      </div>
    </div>
  `
})
export class LoadingComponent {
  @Input() loadingState: LoadingState = { isLoading: false };
}
