import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { PlaceData, PLACES_DATABASE, normalizeText } from '../shared/places';
import { PlacesService, Place } from '../services/places.service';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-add-place',
  templateUrl: './add-place.html',
  styleUrls: ['./add-place.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class AddPlace implements OnInit {
  map!: L.Map;
  currentMarker?: L.Marker;

  // Ícone personalizado (mesmo usado no map.ts)
  private customIcon = L.divIcon({
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

  // Dados do formulário
  newPlace: Place = {
    id: '',
    name: '',
    description: '',
    coordinates: [-14.235, -51.9253], // centro do Brasil
    status: 'planned',
    plannedDate: ''
  };

  // Autocomplete
  showSuggestions = false;
  filteredPlaces: PlaceData[] = [];
  searchQuery = '';

  constructor(
    private router: Router,
    private placesService: PlacesService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    // Garantir que a página comece sempre no topo
    this.scrollToTop();
    this.initializeMap();
    this.setDefaultDate();
  }

  // Método para garantir scroll para o topo
  private scrollToTop(): void {
    // Múltiplas abordagens para garantir compatibilidade
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  // Inicializar mapa
  initializeMap(): void {
    this.map = L.map('addPlaceMap').setView([-14.235, -51.9253], 5);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    // Força o recálculo do tamanho do mapa
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);

    // Event listener para cliques no mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e);
    });
  }

  // Busca de lugares com autocomplete
  onSearchChange(): void {
    this.searchQuery = this.newPlace.name;

    if (this.searchQuery.length >= 2) {
      const normalizedQuery = normalizeText(this.searchQuery);

      this.filteredPlaces = PLACES_DATABASE
        .filter(place => {
          const normalizedName = normalizeText(place.name);
          const normalizedCountry = normalizeText(place.country);
          const normalizedState = place.state ? normalizeText(place.state) : '';

          return normalizedName.includes(normalizedQuery) ||
                 normalizedCountry.includes(normalizedQuery) ||
                 normalizedState.includes(normalizedQuery);
        })
        .slice(0, 10); // Limitar a 10 resultados

      this.showSuggestions = this.filteredPlaces.length > 0;
    } else {
      this.showSuggestions = false;
      this.filteredPlaces = [];
    }
  }

  // Selecionar lugar do autocomplete
  selectPlace(place: PlaceData): void {
    this.newPlace.name = place.name;
    this.newPlace.coordinates = [place.coordinates[0], place.coordinates[1]];
    this.searchQuery = place.name;
    this.showSuggestions = false;
    this.filteredPlaces = [];

    // Atualizar mapa
    this.updateMapLocation(place.coordinates[0], place.coordinates[1]);

    // Auto-completar descrição baseada na categoria
    if (!this.newPlace.description) {
      this.generateDescriptionSuggestion(place);
    }

    // Rolar até o mapa quando selecionar do autocomplete
    this.scrollToMap();
  }

  // Gerar sugestão de descrição baseada na categoria
  generateDescriptionSuggestion(place: PlaceData): void {
    const suggestions = {
      'beach': `Explorar as praias de ${place.name}. Relaxar, curtir o sol e aproveitar as águas cristalinas.`,
      'mountain': `Conhecer as montanhas de ${place.name}. Fazer trilhas, apreciar a natureza e o ar puro.`,
      'historic': `Descobrir a história de ${place.name}. Visitar monumentos, museus e locais históricos.`,
      'cultural': `Vivenciar a cultura de ${place.name}. Conhecer a arte local, gastronomia e tradições.`,
      'nature': `Explorar a natureza de ${place.name}. Fazer ecoturismo e conectar-se com o meio ambiente.`,
      'city': `Conhecer ${place.name}. Explorar a cidade, pontos turísticos e experiências urbanas.`
    };

    this.newPlace.description = suggestions[place.category] || `Conhecer e explorar ${place.name}.`;
  }

  // Buscar localização (pesquisa externa)
  searchLocation(): void {
    if (this.newPlace.name.trim()) {
      // Sempre rolar para o mapa quando clicar na lupa
      this.scrollToMap();

      // Buscar primeiro no banco de dados local usando busca sem acento
      const normalizedSearchName = normalizeText(this.newPlace.name);
      const localPlace = PLACES_DATABASE.find(place =>
        normalizeText(place.name) === normalizedSearchName
      );

      if (localPlace) {
        this.selectPlace(localPlace);
        return;
      }

      // Se não encontrar localmente, usar Nominatim API
      const query = encodeURIComponent(this.newPlace.name);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            this.newPlace.coordinates = [lat, lon];
            this.updateMapLocation(lat, lon);
          } else {
            alert('Local não encontrado. Tente clicar no mapa ou usar outro nome.');
          }
        })
        .catch(error => {
          console.error('Erro na busca:', error);
          alert('Erro ao buscar local. Tente clicar no mapa.');
        });
    }
  }

  // Rolar página até o mapa
  scrollToMap(): void {
    setTimeout(() => {
      const mapElement = document.getElementById('addPlaceMap');
      if (mapElement) {
        mapElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  }

  // Ocultar sugestões quando clicar fora
  hideSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  // Atualizar localização no mapa
  updateMapLocation(lat: number, lon: number): void {
    // Remover marcador anterior
    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    // Adicionar novo marcador com o ícone personalizado
    this.currentMarker = L.marker([lat, lon], { icon: this.customIcon }).addTo(this.map);

    // Centralizar mapa na nova localização
    this.map.setView([lat, lon], 10);
  }

  // Clique no mapa
  onMapClick(e: L.LeafletMouseEvent): void {
    const { lat, lng } = e.latlng;
    this.newPlace.coordinates = [lat, lng];
    this.updateMapLocation(lat, lng);

    // Buscar nome do local clicado (reverse geocoding)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          const locationName = this.extractLocationName(data);
          if (!this.newPlace.name || this.newPlace.name.trim() === '') {
            this.newPlace.name = locationName;
            this.searchQuery = locationName;
          }
        }
      })
      .catch(error => console.error('Erro no reverse geocoding:', error));
  }

  // Extrair nome relevante da localização
  extractLocationName(data: any): string {
    // Priorizar cidade, depois estado/região, depois país
    return data.address?.city ||
           data.address?.town ||
           data.address?.village ||
           data.address?.state ||
           data.address?.country ||
           'Local Selecionado';
  }

  // Definir data padrão
  setDefaultDate(): void {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias no futuro

    // Usar getFullYear, getMonth, getDate para evitar problemas de timezone
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');

    this.newPlace.plannedDate = `${year}-${month}-${day}`;
  }

  // Submeter formulário
  onSubmit(): void {
    if (this.newPlace.name.trim() && this.newPlace.description.trim()) {
      // Remover o ID local já que o MongoDB irá gerar seu próprio _id
      const placeToCreate = {
        name: this.newPlace.name,
        description: this.newPlace.description,
        coordinates: this.newPlace.coordinates,
        status: this.newPlace.status as 'planned' | 'visited',
        plannedDate: this.newPlace.plannedDate
      };

      this.placesService.createPlace(placeToCreate).subscribe({
        next: (response) => {
          console.log('Lugar criado com sucesso:', response);
          // Voltar para a página principal
          this.router.navigate(['/mapa']);
        },
        error: (error) => {
          console.error('Erro ao criar lugar:', error);
          alert('Erro ao salvar o lugar. Tente novamente.');
        }
      });
    }
  }

  // Cancelar e voltar
  onCancel(): void {
    this.router.navigate(['/mapa']);
  }

  // Getter para categoria formatada
  getCategoryIcon(category: string): string {
    const icons = {
      'beach': '🏖️',
      'mountain': '🏔️',
      'historic': '🏛️',
      'cultural': '🎭',
      'nature': '🌿',
      'city': '🏙️'
    };
    return icons[category as keyof typeof icons] || '📍';
  }

  // Getter para categoria formatada
  getCategoryName(category: string): string {
    const names = {
      'beach': 'Praia',
      'mountain': 'Montanha',
      'historic': 'Histórico',
      'cultural': 'Cultural',
      'nature': 'Natureza',
      'city': 'Cidade'
    };
    return names[category as keyof typeof names] || category;
  }
}