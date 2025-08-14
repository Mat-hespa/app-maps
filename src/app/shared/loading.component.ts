import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingState } from '../services/loading.service';

@Component({
  selector: 'app-loading',
  template: `
    <div *ngIf="loadingState.isLoading" 
         class="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center"
         style="z-index: 9999 !important;"
         [class.animate-fadeIn]="loadingState.isLoading">
      
      <!-- Loading Container -->
      <div class="bg-gray-800/90 backdrop-blur-md border border-red-500/20 rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center">
        
        <!-- Loading Animation -->
        <div class="relative mb-6">
          <!-- Outer rotating ring -->
          <div class="w-16 h-16 mx-auto relative">
            <div class="absolute inset-0 border-4 border-red-500/20 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div>
            
            <!-- Inner pulsing dot -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <!-- Floating dots around -->
          <div class="absolute -top-2 -right-2 w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
          <div class="absolute -bottom-2 -left-2 w-2 h-2 bg-red-400 rounded-full animate-bounce delay-75"></div>
          <div class="absolute top-1/2 -left-4 w-1 h-1 bg-red-300 rounded-full animate-pulse delay-150"></div>
          <div class="absolute top-1/2 -right-4 w-1 h-1 bg-red-300 rounded-full animate-pulse delay-300"></div>
        </div>

        <!-- Loading Text -->
        <div class="space-y-3">
          <h3 class="text-red-100 font-semibold text-lg">
            {{ getLoadingTitle() }}
          </h3>
          
          <p *ngIf="loadingState.message" 
             class="text-red-200/80 text-sm leading-relaxed">
            {{ loadingState.message }}
          </p>
          
          <!-- Loading dots animation -->
          <div class="flex justify-center gap-1 mt-4">
            <div class="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-75"></div>
            <div class="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-150"></div>
          </div>
        </div>

        <!-- Progress bar simulation -->
        <div class="mt-6 w-full bg-gray-700 rounded-full h-1 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }
    
    .animate-bounce {
      animation: bounce 1s infinite;
    }
    
    .delay-75 {
      animation-delay: 0.075s;
    }
    
    .delay-150 {
      animation-delay: 0.15s;
    }
    
    .delay-300 {
      animation-delay: 0.3s;
    }
  `],
  imports: [CommonModule],
  standalone: true
})
export class LoadingComponent {
  @Input() loadingState: LoadingState = { isLoading: false };

  getLoadingTitle(): string {
    switch (this.loadingState.type) {
      case 'places':
        return '🗺️ Carregando lugares...';
      case 'save':
        return '💾 Salvando...';
      case 'delete':
        return '🗑️ Removendo...';
      case 'update':
        return '✏️ Atualizando...';
      default:
        return '❤️ Carregando...';
    }
  }
}
