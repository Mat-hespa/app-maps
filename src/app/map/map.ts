import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import * as L from 'leaflet';


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
  currentPlaceIndex = 0;

  greenIcon = new L.Icon({
    iconUrl: 'leaf-green.png',
    shadowUrl: 'leaf-shadow.png',
    iconSize: [38, 95],
    shadowSize: [50, 64],
    iconAnchor: [22, 94],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -76],
  });

  redIcon = new L.Icon({
    iconUrl: 'leaf-red.png',
    shadowUrl: 'leaf-shadow.png',
    iconSize: [38, 95],
    shadowSize: [50, 64],
    iconAnchor: [22, 94],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -76],
  });

  orangeIcon = new L.Icon({
    iconUrl: 'leaf-orange.png',
    shadowUrl: 'leaf-shadow.png',
    iconSize: [38, 95],
    shadowSize: [50, 64],
    iconAnchor: [22, 94],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -76],
  });

  places = [
    {
      name: 'Natal',
      description: 'Praias incríveis e clima tropical.',
      image: 'assets/praia.jpg',
      coordinates: [-5.7945, -35.211] as L.LatLngTuple,
    },
    {
      name: 'Gramado',
      description: 'Cidade charmosa na serra gaúcha.',
      image: 'assets/praia.jpg',
      coordinates: [-29.3747, -50.8764] as L.LatLngTuple,
    },
    {
      name: 'São José dos Campos',
      description: 'Polo tecnológico do Vale do Paraíba.',
      image: 'assets/praia.jpg',
      coordinates: [-23.1896, -45.8841] as L.LatLngTuple,
    },
    {
      name: 'Minas Gerais',
      description: 'Terra de montanhas e culinária famosa.',
      image: 'assets/praia.jpg',
      coordinates: [-18.5122, -44.555] as L.LatLngTuple,
    },
  ];

  ngOnInit(): void {
    this.initializeMap();
    this.map.on('click', this.onMapClick.bind(this));
  }

  initializeMap(): void {
    this.map = L.map('map').setView([-14.235, -51.9253], 5); // Centraliza no Brasil
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    // Adiciona marcadores e salva referência
    this.places.forEach((place, idx) => {
      const marker = L.marker(place.coordinates)
        .addTo(this.map)
        .bindPopup(
          `<b>${place.name}</b><br>${place.description}<br><img src="${place.image}" alt="${place.name}" style="width:120px;border-radius:8px;margin-top:8px;">`
        );
      this.markers.push(marker);
    });

    // Traçado entre os lugares
    const polyline = L.polyline(
      this.places.map((p) => p.coordinates),
      {
        color: 'blue',
        weight: 4,
        opacity: 0.7,
      }
    ).addTo(this.map);

    this.map.fitBounds(polyline.getBounds());
  }

  focusPlace(index: number) {
    const place = this.places[index];
    this.map.setView(place.coordinates, 10, { animate: true });
    this.markers[index].openPopup();
  }

  onMapClick(e: L.LeafletMouseEvent) {
    this.popup
      .setLatLng(e.latlng)
      .setContent('Você clicou no mapa em ' + e.latlng.toString())
      .openOn(this.map);
  }

  showPrevPlace() {
    if (this.currentPlaceIndex > 0) {
      this.currentPlaceIndex--;
      this.focusPlace(this.currentPlaceIndex);
    }
  }

  showNextPlace() {
    if (this.currentPlaceIndex < this.places.length - 1) {
      this.currentPlaceIndex++;
      this.focusPlace(this.currentPlaceIndex);
    }
  }
}