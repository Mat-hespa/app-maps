import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';

export interface Place {
  _id?: string; // MongoDB ID
  id?: string; // ID local (para compatibilidade)
  name: string;
  description: string;
  image: string;
  coordinates: [number, number];
  status: 'planned' | 'visited';
  plannedDate?: string;
  visitDate?: string;
  visitDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private readonly API_URL = 'https://maps-backend-4hfs.onrender.com/api'; // Corrigido para incluir /api
  
  // Subject para manter o estado dos lugares em tempo real
  private placesSubject = new BehaviorSubject<Place[]>([]);
  public places$ = this.placesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadPlaces();
  }

  // Buscar lugar por ID
  getPlaceById(id: string): Observable<Place> {
    return this.http.get<{success: boolean, data: Place}>(`${this.API_URL}/places/${id}`).pipe(
      map(response => response.data)
    );
  }

  // Buscar lugares por status
  getPlacesByStatus(status: 'planned' | 'visited'): Observable<Place[]> {
    return this.http.get<{success: boolean, data: Place[]}>(`${this.API_URL}/places/status/${status}`).pipe(
      map(response => response.data || [])
    );
  }

  // Buscar lugares próximos
  getNearbyPlaces(lat: number, lng: number, distance?: number): Observable<Place[]> {
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString());
    
    if (distance) {
      params = params.set('distance', distance.toString());
    }
    
    return this.http.get<{success: boolean, data: Place[]}>(`${this.API_URL}/places/nearby`, { params }).pipe(
      map(response => response.data || [])
    );
  }

  // Obter estatísticas do servidor
  getServerStats(): Observable<any> {
    return this.http.get<{success: boolean, data: any}>(`${this.API_URL}/places/stats`).pipe(
      map(response => response.data)
    );
  }

  // Buscar todos os lugares
  getPlaces(): Observable<Place[]> {
    return this.http.get<{success: boolean, data: Place[]}>(`${this.API_URL}/places`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.placesSubject.next(response.data);
        }
      }),
      map(response => response.data || [])
    );
  }

  // Recarregar lugares do servidor
  loadPlaces(): void {
    this.getPlaces().subscribe({
      next: (places) => {
        console.log('Lugares carregados:', places);
      },
      error: (error) => {
        console.error('Erro ao carregar lugares:', error);
        // Em caso de erro, usar dados padrão ou localStorage como fallback
        this.loadFromLocalStorageFallback();
      }
    });
  }

  // Fallback para localStorage em caso de erro na API
  private loadFromLocalStorageFallback(): void {
    const savedPlaces = localStorage.getItem('places');
    if (savedPlaces) {
      try {
        const places = JSON.parse(savedPlaces);
        this.placesSubject.next(places);
        console.log('Usando dados do localStorage como fallback');
      } catch (error) {
        console.error('Erro ao ler localStorage:', error);
        this.placesSubject.next([]);
      }
    } else {
      this.placesSubject.next([]);
    }
  }

  // Criar novo lugar
  createPlace(place: Omit<Place, '_id' | 'createdAt' | 'updatedAt'>): Observable<Place> {
    return this.http.post<{success: boolean, data: Place}>(`${this.API_URL}/places`, place).pipe(
      tap(response => {
        if (response.success && response.data) {
          const currentPlaces = this.placesSubject.value;
          this.placesSubject.next([...currentPlaces, response.data]);
        }
      }),
      map(response => response.data)
    );
  }

  // Atualizar lugar existente
  updatePlace(id: string, updates: Partial<Place>): Observable<Place> {
    return this.http.put<{success: boolean, data: Place}>(`${this.API_URL}/places/${id}`, updates).pipe(
      tap(response => {
        if (response.success && response.data) {
          const currentPlaces = this.placesSubject.value;
          const index = currentPlaces.findIndex(p => p._id === id || p.id === id);
          if (index !== -1) {
            currentPlaces[index] = response.data;
            this.placesSubject.next([...currentPlaces]);
          }
        }
      }),
      map(response => response.data)
    );
  }

  // Deletar lugar
  deletePlace(id: string): Observable<void> {
    return this.http.delete<{success: boolean, message: string}>(`${this.API_URL}/places/${id}`).pipe(
      tap(response => {
        if (response.success) {
          const currentPlaces = this.placesSubject.value;
          const filteredPlaces = currentPlaces.filter(p => p._id !== id && p.id !== id);
          this.placesSubject.next(filteredPlaces);
        }
      }),
      map(() => void 0)
    );
  }

  // Marcar como visitado - usando rota PATCH específica
  markAsVisited(id: string, visitDescription: string): Observable<Place> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const visitDate = `${year}-${month}-${day}`;

    const data = {
      visitDate,
      visitDescription
    };

    return this.http.patch<{success: boolean, data: Place}>(`${this.API_URL}/places/${id}/visit`, data).pipe(
      tap(response => {
        if (response.success && response.data) {
          const currentPlaces = this.placesSubject.value;
          const index = currentPlaces.findIndex(p => p._id === id || p.id === id);
          if (index !== -1) {
            currentPlaces[index] = response.data;
            this.placesSubject.next([...currentPlaces]);
          }
        }
      }),
      map(response => response.data)
    );
  }

  // Marcar como planejado - usando rota PATCH específica
  markAsPlanned(id: string): Observable<Place> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const plannedDate = `${year}-${month}-${day}`;

    const data = {
      plannedDate
    };

    return this.http.patch<{success: boolean, data: Place}>(`${this.API_URL}/places/${id}/plan`, data).pipe(
      tap(response => {
        if (response.success && response.data) {
          const currentPlaces = this.placesSubject.value;
          const index = currentPlaces.findIndex(p => p._id === id || p.id === id);
          if (index !== -1) {
            currentPlaces[index] = response.data;
            this.placesSubject.next([...currentPlaces]);
          }
        }
      }),
      map(response => response.data)
    );
  }

  // Editar descrição
  updateDescription(id: string, description: string, isVisited: boolean = false): Observable<Place> {
    const updates = isVisited 
      ? { visitDescription: description }
      : { description };

    return this.updatePlace(id, updates);
  }

  // Getter para lugares visitados
  get visitedPlaces(): Place[] {
    return this.placesSubject.value.filter(place => place.status === 'visited');
  }

  // Getter para lugares planejados
  get plannedPlaces(): Place[] {
    return this.placesSubject.value.filter(place => place.status === 'planned');
  }

  // Estatísticas locais (mantido para compatibilidade)
  getStats() {
    const places = this.placesSubject.value;
    return {
      total: places.length,
      visited: this.visitedPlaces.length,
      planned: this.plannedPlaces.length,
      percentage: places.length > 0 ? Math.round((this.visitedPlaces.length / places.length) * 100) : 0
    };
  }

  // Usar estatísticas do servidor quando possível
  getStatsFromServer(): Observable<any> {
    return this.getServerStats().pipe(
      // Em caso de erro, usar estatísticas locais como fallback
      map(serverStats => serverStats),
      // Se der erro, usar stats locais
      tap({
        error: () => {
          console.log('Usando estatísticas locais como fallback');
        }
      })
    );
  }

  // Método para sincronizar dados do localStorage com o servidor (útil para migração)
  syncLocalStorageToServer(): Observable<Place[]> {
    const savedPlaces = localStorage.getItem('places');
    if (savedPlaces) {
      try {
        const places: Place[] = JSON.parse(savedPlaces);
        
        // Enviar cada lugar para o servidor
        const createPromises = places.map(place => {
          const { id, ...placeData } = place; // Remove o ID local
          return this.createPlace(placeData).toPromise();
        });

        return new Observable(observer => {
          Promise.all(createPromises)
            .then(createdPlaces => {
              // Limpar localStorage após sincronização bem-sucedida
              localStorage.removeItem('places');
              observer.next(createdPlaces.filter(Boolean) as Place[]);
              observer.complete();
            })
            .catch(error => {
              observer.error(error);
            });
        });
      } catch (error) {
        console.error('Erro ao sincronizar localStorage:', error);
      }
    }

    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }
}
