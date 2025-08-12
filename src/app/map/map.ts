import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';

interface Place {
  id: string;
  name: string;
  description: string;
  image: string;
  coordinates: L.LatLngTuple;
  status: 'planned' | 'visited';
  plannedDate?: string;
  visitDate?: string;
  visitDescription?: string;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.html',
  styleUrls: ['./map.scss'],
  imports: [CommonModule],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Map implements OnInit {
  map!: L.Map;
  popup = L.popup();
  markers: L.Marker[] = [];
  activeMenuId: string | null = null;

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

  // Dados iniciais (alguns já visitados para exemplo)
  places: Place[] = [
    {
      id: 'natal-1',
      name: 'Natal',
      description: 'Praias incríveis e clima tropical.',
      image: 'assets/praia.jpg',
      coordinates: [-5.7945, -35.211],
      status: 'visited',
      visitDate: '2023-12-15',
      visitDescription: 'Viagem incrível! As praias eram maravilhosas.'
    },
    {
      id: 'gramado-1',
      name: 'Gramado',
      description: 'Cidade charmosa na serra gaúcha.',
      image: 'assets/praia.jpg',
      coordinates: [-29.3747, -50.8764],
      status: 'planned',
      plannedDate: '2024-07-20'
    },
    {
      id: 'sjc-1',
      name: 'São José dos Campos',
      description: 'Polo tecnológico do Vale do Paraíba.',
      image: 'assets/praia.jpg',
      coordinates: [-23.1896, -45.8841],
      status: 'planned',
      plannedDate: '2024-09-10'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Garantir que a página comece sempre no topo
    this.scrollToTop();
    
    this.loadPlacesFromStorage();
    this.initializeMap();
  }

  // Método para garantir scroll para o topo
  private scrollToTop(): void {
    // Múltiplas abordagens para garantir compatibilidade
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

  loadPlacesFromStorage(): void {
    const savedPlaces = localStorage.getItem('places');
    if (savedPlaces) {
      const newPlaces = JSON.parse(savedPlaces);
      
      // Garantir que cada lugar tenha um ID único
      newPlaces.forEach((place: Place) => {
        if (!place.id) {
          place.id = 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
      });
      
      this.places = [...this.places, ...newPlaces];
    }
    
    // Verificar se há IDs duplicados e corrigir
    this.ensureUniqueIds();
  }

  private ensureUniqueIds(): void {
    const usedIds = new Set<string>();
    
    this.places.forEach(place => {
      if (usedIds.has(place.id)) {
        // Gerar novo ID único se houver duplicata
        place.id = 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      }
      usedIds.add(place.id);
    });
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

  focusPlace(index: number) {
    const place = this.visitedPlaces[index];
    const placeIndex = this.places.findIndex(p => p === place);
    this.map.setView(place.coordinates, 12, { animate: true });

    // Pequeno delay para garantir que o zoom termine antes de abrir o popup
    setTimeout(() => {
      this.markers[placeIndex].openPopup();
    }, 300);
  }

  focusPlaceByObject(place: Place) {
    const placeIndex = this.places.findIndex(p => p === place);
    this.map.setView(place.coordinates, 12, { animate: true });

    // Pequeno delay para garantir que o zoom termine antes de abrir o popup
    setTimeout(() => {
      this.markers[placeIndex].openPopup();
    }, 300);
  }

  focusPlannedPlace(index: number) {
    const place = this.plannedPlaces[index];
    const placeIndex = this.places.findIndex(p => p === place);
    this.map.setView(place.coordinates, 12, { animate: true });

    // Pequeno delay para garantir que o zoom termine antes de abrir o popup
    setTimeout(() => {
      this.markers[placeIndex].openPopup();
    }, 300);
  }

  focusPlannedPlaceByObject(place: Place) {
    const placeIndex = this.places.findIndex(p => p === place);
    this.map.setView(place.coordinates, 12, { animate: true });

    // Pequeno delay para garantir que o zoom termine antes de abrir o popup
    setTimeout(() => {
      this.markers[placeIndex].openPopup();
    }, 300);
  }

  markAsVisited(place: Place, event: Event) {
    event.stopPropagation();

    const visitDescription = prompt(
      `Como foi sua visita a ${place.name}?\n\nConte os detalhes, experiências e impressões:`,
      place.description
    );

    if (visitDescription !== null && visitDescription.trim() !== '') {
      place.status = 'visited';
      
      // Usar data local sem conversão de timezone
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      place.visitDate = `${year}-${month}-${day}`;
      
      place.visitDescription = visitDescription;
      delete place.plannedDate;

      this.savePlacesToStorage();
      this.updateMapMarkers();

      alert(`${place.name} foi marcado como visitado! 🎉`);
    }
  }

  markAsPlanned(place: Place, event: Event) {
    event.stopPropagation();

    const confirmChange = confirm(`Deseja mover "${place.name}" de volta para lugares planejados?`);

    if (confirmChange) {
      place.status = 'planned';
      
      // Usar data local sem conversão de timezone
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      place.plannedDate = `${year}-${month}-${day}`;
      
      delete place.visitDate;
      delete place.visitDescription;

      this.savePlacesToStorage();
      this.updateMapMarkers();
    }
  }

  editVisitDescription(place: Place, event: Event) {
    event.stopPropagation();

    const newDescription = prompt(
      `Editar descrição da visita a ${place.name}:`,
      place.visitDescription || place.description
    );

    if (newDescription !== null && newDescription.trim() !== '') {
      place.visitDescription = newDescription;
      this.savePlacesToStorage();
      this.updateMapMarkers();
    }
  }

  editPlannedDescription(place: Place, event: Event) {
    event.stopPropagation();

    const newDescription = prompt(
      `Editar descrição do plano para ${place.name}:`,
      place.description
    );

    if (newDescription !== null && newDescription.trim() !== '') {
      place.description = newDescription;
      this.savePlacesToStorage();
      this.updateMapMarkers();
    }
  }

  deletePlace(place: Place, event: Event) {
    event.stopPropagation();

    const confirmDelete = confirm(`Tem certeza que deseja remover "${place.name}" da sua lista?`);

    if (confirmDelete) {
      this.places = this.places.filter(p => p !== place);
      this.savePlacesToStorage();
      this.updateMapMarkers();
    }
  }

  savePlacesToStorage(): void {
    const placesToSave = this.places.filter(place =>
      !['Natal', 'Gramado', 'São José dos Campos'].includes(place.name)
    );
    localStorage.setItem('places', JSON.stringify(placesToSave));
  }

  getStats() {
    return {
      total: this.places.length,
      visited: this.visitedPlaces.length,
      planned: this.plannedPlaces.length,
      percentage: this.places.length > 0 ? Math.round((this.visitedPlaces.length / this.places.length) * 100) : 0
    };
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
  togglePlaceMenu(placeId: string, event: Event) {
    event.stopPropagation();
    
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
    return place.id;
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