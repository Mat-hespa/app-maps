import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Incrementar contador de requisições ativas
    this.activeRequests++;
    
    // Determinar o tipo de loading baseado na URL e método
    const loadingType = this.getLoadingType(req);
    const loadingMessage = this.getLoadingMessage(req);
    
    // Mostrar loading apenas se for a primeira requisição
    if (this.activeRequests === 1) {
      this.loadingService.show(loadingMessage, loadingType);
    }

    return next.handle(req).pipe(
      finalize(() => {
        // Decrementar contador de requisições ativas
        this.activeRequests--;
        
        // Esconder loading apenas quando todas as requisições terminarem
        if (this.activeRequests === 0) {
          this.loadingService.hide();
        }
      })
    );
  }

  private getLoadingType(req: HttpRequest<any>): 'default' | 'places' | 'save' | 'delete' | 'update' {
    const url = req.url.toLowerCase();
    const method = req.method.toLowerCase();

    // Operações específicas de lugares
    if (url.includes('/places')) {
      if (method === 'get') {
        return 'places';
      } else if (method === 'post') {
        return 'save';
      } else if (method === 'delete') {
        return 'delete';
      } else if (method === 'put' || method === 'patch') {
        return 'update';
      }
    }

    return 'default';
  }

  private getLoadingMessage(req: HttpRequest<any>): string {
    const url = req.url.toLowerCase();
    const method = req.method.toLowerCase();

    if (url.includes('/places')) {
      if (method === 'get') {
        if (url.includes('/stats')) {
          return 'Carregando estatísticas...';
        } else if (url.includes('/nearby')) {
          return 'Buscando lugares próximos...';
        } else if (url.includes('/status/')) {
          return 'Filtrando lugares...';
        }
        return 'Carregando seus lugares especiais...';
      } else if (method === 'post') {
        return 'Adicionando novo lugar ao mapa...';
      } else if (method === 'delete') {
        return 'Removendo lugar do mapa...';
      } else if (method === 'put' || method === 'patch') {
        if (url.includes('/visit')) {
          return 'Marcando como visitado...';
        } else if (url.includes('/plan')) {
          return 'Movendo para planejados...';
        }
        return 'Atualizando informações...';
      }
    }

    // Geocoding APIs
    if (url.includes('nominatim')) {
      if (url.includes('reverse')) {
        return 'Identificando localização...';
      }
      return 'Buscando localização...';
    }

    return 'Processando...';
  }
}
