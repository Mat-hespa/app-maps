import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { PlacesService, Place } from '../services/places.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.html',
  styleUrls: ['./map.scss'],
  imports: [CommonModule],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Map implements OnInit, OnDestroy {
  map!: L.Map;
  popup = L.popup();
  markers: L.Marker[] = [];
  activeMenuId: string | null = null;
  
  // Subscription para gerenciar observables
  private placesSubscription?: Subscription;
  
  // Array local para os lugares (será atualizado via subscription)
  places: Place[] = [];

  // Ícones personalizados
  private redIcon = L.divIcon({
    html: `<div style="
      background-color: #ef4444;
      width: 25px;
      height: 25px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    className: 'custom-marker',
    iconSize: [25, 25],
    iconAnchor: [12, 25]
  });

  private blueIcon = L.divIcon({
    html: `<div style="
      background-color: #3b82f6;
      width: 25px;
      height: 25px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    className: 'custom-marker',
    iconSize: [25, 25],
    iconAnchor: [12, 25]
  });

  constructor(
    private router: Router,
    private placesService: PlacesService
  ) {}

  ngOnInit(): void {
    // Garantir que a página comece sempre no topo
    this.scrollToTop();
    
    // Inscrever-se para receber atualizações dos lugares
    this.placesSubscription = this.placesService.places$.subscribe(places => {
      this.places = places;
      if (this.map) {
        this.updateMapMarkers();
      }
    });
    
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.placesSubscription) {
      this.placesSubscription.unsubscribe();
    }
  }

  // Método para garantir scroll para o topo
  private scrollToTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  // Getter para lugares visitados
  get visitedPlaces(): Place[] {
    return this.places.filter(place => place.status === 'visited');
  }

  // Getter para lugares planejados
  get plannedPlaces(): Place[] {
    return this.places.filter(place => place.status === 'planned');
  }

  initializeMap(): void {
    this.map = L.map('map').setView([-14.235, -51.9253], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    // Força o recálculo do tamanho do mapa
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);

    this.updateMapMarkers();
  }

  updateMapMarkers(): void {
    if (!this.map) return;

    // Remove marcadores existentes
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    this.places.forEach((place) => {
      // Seleciona o ícone baseado no status
      const icon = place.status === 'visited' ? this.redIcon : this.blueIcon;

      // Emoji para o popup
      const statusEmoji = place.status === 'visited' ? '✅' : '📋';
      const statusText = place.status === 'visited' ? 'Visitado' : 'Planejado';
      const statusColor = place.status === 'visited' ? '#10b981' : '#3b82f6';

      const marker = L.marker(place.coordinates, { icon })
        .addTo(this.map)
        .bindPopup(
          `<div style="text-align: center; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: bold;">${place.name}</h3>
            <div style="color: ${statusColor}; font-weight: 600; margin-bottom: 8px;">
              ${statusEmoji} ${statusText}
            </div>
            <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
              ${place.visitDescription || place.description}
            </p>
            ${place.visitDate ?
              `<div style="color: #10b981; font-size: 12px; margin-top: 8px;">
                Visitado em ${this.formatDate(place.visitDate)}
              </div>` :
              `<div style="color: #3b82f6; font-size: 12px; margin-top: 8px;">
                Planejado para ${this.formatDate(place.plannedDate!)}
              </div>`
            }
            <img src="${place.image}" alt="${place.name}"
                 style="width: 120px; height: 80px; object-fit: cover; border-radius: 8px; margin-top: 8px; border: 2px solid #e5e7eb;">
          </div>`
        );

      this.markers.push(marker);
    });

    // Traçado apenas para lugares visitados (linha vermelha)
    const visitedCoordinates = this.visitedPlaces.map(p => p.coordinates);
    if (visitedCoordinates.length > 1) {
      L.polyline(visitedCoordinates, {
        color: '#ef4444',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(this.map);
    }

    // Traçado pontilhado para lugares planejados (linha azul)
    const plannedCoordinates = this.plannedPlaces.map(p => p.coordinates);
    if (plannedCoordinates.length > 1) {
      L.polyline(plannedCoordinates, {
        color: '#3b82f6',
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 10'
      }).addTo(this.map);
    }

    // Ajusta o zoom para mostrar todos os lugares
    if (this.places.length > 0) {
      const group = new L.FeatureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  focusPlaceByObject(place: Place) {
    const placeIndex = this.places.findIndex(p => (p._id || p.id) === (place._id || place.id));
    this.map.setView(place.coordinates, 12, { animate: true });

    // Pequeno delay para garantir que o zoom termine antes de abrir o popup
    setTimeout(() => {
      if (placeIndex !== -1) {
        this.markers[placeIndex].openPopup();
      }
    }, 300);
  }

  focusPlannedPlaceByObject(place: Place) {
    this.focusPlaceByObject(place);
  }

  markAsVisited(place: Place, event: Event) {
    event.stopPropagation();

    const visitDescription = prompt(
      `Como foi sua visita a ${place.name}?\n\nConte os detalhes, experiências e impressões:`,
      place.description
    );

    if (visitDescription !== null && visitDescription.trim() !== '') {
      const placeId = place._id || place.id!;
      
      this.placesService.markAsVisited(placeId, visitDescription).subscribe({
        next: () => {
          alert(`${place.name} foi marcado como visitado! 🎉`);
        },
        error: (error) => {
          console.error('Erro ao marcar como visitado:', error);
          alert('Erro ao salvar. Tente novamente.');
        }
      });
    }
  }

  markAsPlanned(place: Place, event: Event) {
    event.stopPropagation();

    const confirmChange = confirm(`Deseja mover "${place.name}" de volta para lugares planejados?`);

    if (confirmChange) {
      const placeId = place._id || place.id!;
      
      this.placesService.markAsPlanned(placeId).subscribe({
        next: () => {
          // Sucesso - o observable já atualizará a lista
        },
        error: (error) => {
          console.error('Erro ao marcar como planejado:', error);
          alert('Erro ao salvar. Tente novamente.');
        }
      });
    }
  }

  editVisitDescription(place: Place, event: Event) {
    event.stopPropagation();

    const newDescription = prompt(
      `Editar descrição da visita a ${place.name}:`,
      place.visitDescription || place.description
    );

    if (newDescription !== null && newDescription.trim() !== '') {
      const placeId = place._id || place.id!;
      
      this.placesService.updateDescription(placeId, newDescription, true).subscribe({
        next: () => {
          // Sucesso - o observable já atualizará a lista
        },
        error: (error) => {
          console.error('Erro ao editar descrição:', error);
          alert('Erro ao salvar. Tente novamente.');
        }
      });
    }
  }

  editPlannedDescription(place: Place, event: Event) {
    event.stopPropagation();

    const newDescription = prompt(
      `Editar descrição do plano para ${place.name}:`,
      place.description
    );

    if (newDescription !== null && newDescription.trim() !== '') {
      const placeId = place._id || place.id!;
      
      this.placesService.updateDescription(placeId, newDescription, false).subscribe({
        next: () => {
          // Sucesso - o observable já atualizará a lista
        },
        error: (error) => {
          console.error('Erro ao editar descrição:', error);
          alert('Erro ao salvar. Tente novamente.');
        }
      });
    }
  }

  deletePlace(place: Place, event: Event) {
    event.stopPropagation();

    const confirmDelete = confirm(`Tem certeza que deseja remover "${place.name}" da sua lista?`);

    if (confirmDelete) {
      const placeId = place._id || place.id!;
      
      this.placesService.deletePlace(placeId).subscribe({
        next: () => {
          // Sucesso - o observable já atualizará a lista
        },
        error: (error) => {
          console.error('Erro ao deletar lugar:', error);
          alert('Erro ao deletar. Tente novamente.');
        }
      });
    }
  }

  getStats() {
    return this.placesService.getStats();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    // Parse manual para evitar problemas de timezone
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Mês é zero-indexado
      const day = parseInt(parts[2]);
      
      // Criar data local sem conversão de timezone
      const date = new Date(year, month, day);
      return date.toLocaleDateString('pt-BR');
    }
    
    return dateString; // Fallback
  }

  navigateToAddPlace() {
    this.router.navigate(['/add-place']);
  }

  // Métodos para o menu dropdown mobile
  togglePlaceMenu(placeId: string | undefined, event: Event) {
    event.stopPropagation();
    
    if (!placeId) return;
    
    // Sempre fecha outros menus primeiro, depois abre o clicado (se não estava aberto)
    const wasOpen = this.activeMenuId === placeId;
    this.activeMenuId = null;
    if (!wasOpen) {
      this.activeMenuId = placeId;
    }
  }

  closeMenu() {
    this.activeMenuId = null;
  }

  trackByPlace(index: number, place: Place): string {
    return place._id || place.id || index.toString();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Fechar menu quando clicar fora dos dropdowns
    const target = event.target as HTMLElement;
    
    // Não fechar se clicar no botão de menu ou dentro do dropdown
    if (!target.closest('button[title="Opções"]') && 
        !target.closest('.absolute.top-12')) {
      this.activeMenuId = null;
    }
  }
}