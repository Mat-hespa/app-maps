import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  type?: 'default' | 'places' | 'save' | 'delete' | 'update';
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({ isLoading: false });
  public loading$ = this.loadingSubject.asObservable();

  // Contador para múltiplas operações simultâneas
  private loadingCount = 0;

  show(message?: string, type: LoadingState['type'] = 'default'): void {
    this.loadingCount++;
    this.loadingSubject.next({
      isLoading: true,
      message,
      type
    });
  }

  hide(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    
    if (this.loadingCount === 0) {
      this.loadingSubject.next({ isLoading: false });
    }
  }

  // Método para forçar hide (useful para error handling)
  forceHide(): void {
    this.loadingCount = 0;
    this.loadingSubject.next({ isLoading: false });
  }

  // Getter para o estado atual
  get isLoading(): boolean {
    return this.loadingSubject.value.isLoading;
  }

  // Método para executar uma operação com loading automático
  async withLoading<T>(
    operation: () => Promise<T>,
    message?: string,
    type: LoadingState['type'] = 'default'
  ): Promise<T> {
    try {
      this.show(message, type);
      const result = await operation();
      return result;
    } finally {
      this.hide();
    }
  }
}
