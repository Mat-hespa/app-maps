// filepath: c:\Users\User\Documents\map-app\src\app\map\map.ts
import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';

interface Place {
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

  // Dados iniciais (alguns já visitados para exemplo)
  places: Place[] = [
    {
      name: 'Natal',
      description: 'Praias incríveis e clima tropical.',
      image: 'assets/praia.jpg',
      coordinates: [-5.7945, -35.211],
      status: 'visited',
      visitDate: '2023-12-15',
      visitDescription: 'Viagem incrível! As praias eram maravilhosas.'
    },
    {
      name: 'Gramado',
      description: 'Cidade charmosa na serra gaúcha.',
      image: 'assets/praia.jpg',
      coordinates: [-29.3747, -50.8764],
      status: 'planned',
      plannedDate: '2024-07-20'
    },
    {
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
    this.loadPlacesFromStorage();
    this.initializeMap();
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
      this.places = [...this.places, ...newPlaces];
    }
  }

  initializeMap(): void {
    this.map = L.map('map').setView([-14.235, -51.9253], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.updateMapMarkers();
  }

  updateMapMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    this.places.forEach((place) => {
      // Cores diferentes para visitados e planejados
      const iconColor = place.status === 'visited' ? '🔴' : '🔵';
      
      const marker = L.marker(place.coordinates)
        .addTo(this.map)
        .bindPopup(
          `<div style="text-align: center;">
            <b>${place.name}</b><br>
            <span style="color: ${place.status === 'visited' ? '#ef4444' : '#3b82f6'};">
              ${place.status === 'visited' ? '✅ Visitado' : '📋 Planejado'}
            </span><br>
            ${place.visitDescription || place.description}<br>
            <img src="${place.image}" alt="${place.name}" style="width:120px;border-radius:8px;margin-top:8px;">
          </div>`
        );
      this.markers.push(marker);
    });

    // Traçado apenas para lugares visitados
    const visitedCoordinates = this.visitedPlaces.map(p => p.coordinates);
    if (visitedCoordinates.length > 1) {
      L.polyline(visitedCoordinates, {
        color: '#ef4444',
        weight: 3,
        opacity: 0.7,
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
    this.map.setView(place.coordinates, 10, { animate: true });
    this.markers[placeIndex].openPopup();
  }

  focusPlannedPlace(index: number) {
    const place = this.plannedPlaces[index];
    const placeIndex = this.places.findIndex(p => p === place);
    this.map.setView(place.coordinates, 10, { animate: true });
    this.markers[placeIndex].openPopup();
  }

  markAsVisited(place: Place, event: Event) {
    event.stopPropagation(); // Previne o click do card
    
    // Aqui você pode abrir um modal para adicionar detalhes da visita
    // Por simplicidade, vou usar prompt (em produção, use um modal)
    const visitDescription = prompt('Como foi a viagem? Conte os detalhes:', place.description);
    
    if (visitDescription !== null) {
      place.status = 'visited';
      place.visitDate = new Date().toISOString();
      place.visitDescription = visitDescription || place.description;
      delete place.plannedDate;
      
      // Salva no localStorage
      this.savePlacesToStorage();
      
      // Atualiza o mapa
      this.updateMapMarkers();
    }
  }

  savePlacesToStorage(): void {
    const placesToSave = this.places.filter(place => 
      !['Natal', 'Gramado', 'São José dos Campos'].includes(place.name)
    );
    localStorage.setItem('places', JSON.stringify(placesToSave));
  }

  navigateToAddPlace() {
    this.router.navigate(['/add-place']);
  }
}