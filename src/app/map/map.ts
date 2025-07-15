import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.html',
  styleUrls: ['./map.scss'],
  imports: [CommonModule],
  standalone: true,
})
export class Map implements OnInit {
  map!: L.Map;
  popup = L.popup();

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
  
    // Coordenadas dos lugares
    const natal = [-5.7945, -35.211]; // Natal
    const gramado = [-29.3747, -50.8764]; // Gramado
    const saoJoseDosCampos = [-23.1896, -45.8841]; // São José dos Campos
    const minasGerais = [-18.5122, -44.555]; // Minas Gerais
  
    // Adiciona marcadores para os lugares
    L.marker(natal as L.LatLngTuple).addTo(this.map).bindPopup('Natal');
    L.marker(gramado as L.LatLngTuple).addTo(this.map).bindPopup('Gramado');
    L.marker(saoJoseDosCampos as L.LatLngTuple).addTo(this.map).bindPopup('São José dos Campos');
    L.marker(minasGerais as L.LatLngTuple).addTo(this.map).bindPopup('Minas Gerais');
  
    // Traçado entre os lugares
    const polyline = L.polyline(
      [natal as L.LatLngTuple, gramado as L.LatLngTuple, saoJoseDosCampos as L.LatLngTuple, minasGerais as L.LatLngTuple],
      {
        color: 'blue',
        weight: 4,
        opacity: 0.7,
      }
    ).addTo(this.map);
  
    // Ajusta o zoom para caber o traçado
    this.map.fitBounds(polyline.getBounds());
  }
  
  onMapClick(e: L.LeafletMouseEvent) {
    this.popup
      .setLatLng(e.latlng)
      .setContent('You clicked the map at ' + e.latlng.toString())
      .openOn(this.map);
  }
}