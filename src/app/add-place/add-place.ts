import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';

@Component({
  selector: 'app-add-place',
  templateUrl: './add-place.html',
  styleUrls: ['./add-place.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class AddPlace implements OnInit {
  map!: L.Map;
  currentMarker?: L.Marker;

  newPlace = {
    name: '',
    description: '',
    image: 'assets/praia.jpg',
    coordinates: [-14.235, -51.9253] as [number, number],
    status: 'planned' as 'planned',
    plannedDate: ''
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Define data padrão para um mês à frente
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    this.newPlace.plannedDate = nextMonth.toISOString().split('T')[0];

    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  initializeMap(): void {
    this.map = L.map('addPlaceMap').setView([-14.235, -51.9253], 5);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e);
    });
  }

  onMapClick(e: L.LeafletMouseEvent): void {
    const { lat, lng } = e.latlng;
    
    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup('📋 Lugar planejado!')
      .openPopup();

    this.newPlace.coordinates = [lat, lng];
    
    // Scroll suave para o mapa para mostrar que foi clicado
    this.scrollToMap();
  }

  onSubmit(): void {
    if (this.newPlace.name.trim() && this.newPlace.description.trim()) {
      const places = JSON.parse(localStorage.getItem('places') || '[]');
      places.push(this.newPlace);
      localStorage.setItem('places', JSON.stringify(places));

      this.router.navigate(['/map']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/map']);
  }

  searchLocation(): void {
    if (this.newPlace.name.trim()) {
      const searchTerm = this.newPlace.name.toLowerCase();
      
      const knownPlaces: { [key: string]: [number, number] } = {
        'são paulo': [-23.5505, -46.6333],
        'rio de janeiro': [-22.9068, -43.1729],
        'salvador': [-12.9714, -38.5014],
        'brasília': [-15.7942, -47.8822],
        'fortaleza': [-3.7327, -38.5270],
        'recife': [-8.0476, -34.8770],
        'natal': [-5.7945, -35.211],
        'gramado': [-29.3747, -50.8764],
      };

      const coords = Object.entries(knownPlaces).find(([city]) => 
        searchTerm.includes(city) || city.includes(searchTerm)
      )?.[1];

      if (coords) {
        this.newPlace.coordinates = coords;
        this.map.setView(coords, 10);
        
        if (this.currentMarker) {
          this.map.removeLayer(this.currentMarker);
        }

        this.currentMarker = L.marker(coords)
          .addTo(this.map)
          .bindPopup(`📋 ${this.newPlace.name} (planejado)`)
          .openPopup();

        // Scroll para o mapa após busca também
        this.scrollToMap();
      }
    }
  }

  // Função para fazer scroll suave até o mapa
  private scrollToMap(): void {
    const mapElement = document.getElementById('addPlaceMap');
    if (mapElement) {
      // Scroll suave até o mapa com um offset para mostrar o título
      const mapContainer = mapElement.closest('.bg-gray-800\\/50');
      if (mapContainer) {
        mapContainer.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }
  }
}