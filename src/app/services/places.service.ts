import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase.config';

export interface Place {
  _id?: string;       // Firestore document ID
  id?: string;        // ID legado (compatibilidade)
  name: string;
  description: string;
  image?: string;
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
  private readonly COLLECTION = 'places';
  private placesSubject = new BehaviorSubject<Place[]>([]);
  public places$ = this.placesSubject.asObservable();

  constructor() {
    this.loadPlaces();
  }

  private docToPlace(docSnap: any): Place {
    const data = docSnap.data();
    return {
      ...data,
      _id: docSnap.id,
      coordinates: data.coordinates as [number, number]
    };
  }

  getPlaces(): Observable<Place[]> {
    const q = query(collection(db, this.COLLECTION), orderBy('createdAt', 'desc'));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(d => this.docToPlace(d))),
      tap(places => this.placesSubject.next(places))
    );
  }

  loadPlaces(): void {
    this.getPlaces().subscribe({
      next: (places) => console.log('Lugares carregados:', places.length),
      error: (error) => console.error('Erro ao carregar lugares:', error)
    });
  }

  getPlaceById(id: string): Observable<Place> {
    return from(getDoc(doc(db, this.COLLECTION, id))).pipe(
      map(docSnap => {
        if (!docSnap.exists()) throw new Error('Lugar não encontrado');
        return this.docToPlace(docSnap);
      })
    );
  }

  getPlacesByStatus(status: 'planned' | 'visited'): Observable<Place[]> {
    const q = query(collection(db, this.COLLECTION), where('status', '==', status));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(d => this.docToPlace(d)))
    );
  }

  createPlace(place: Omit<Place, '_id' | 'createdAt' | 'updatedAt'>): Observable<Place> {
    const now = new Date().toISOString();
    const newPlace = {
      ...place,
      id: place.id || 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      createdAt: now,
      updatedAt: now
    };

    return from(addDoc(collection(db, this.COLLECTION), newPlace)).pipe(
      map(docRef => {
        const created: Place = { ...newPlace, _id: docRef.id };
        const current = this.placesSubject.value;
        this.placesSubject.next([created, ...current]);
        return created;
      })
    );
  }

  updatePlace(id: string, updates: Partial<Place>): Observable<Place> {
    const updatedData = { ...updates, updatedAt: new Date().toISOString() };
    const docRef = doc(db, this.COLLECTION, id);

    return from(updateDoc(docRef, updatedData)).pipe(
      map(() => {
        const current = this.placesSubject.value;
        const index = current.findIndex(p => p._id === id || p.id === id);
        if (index !== -1) {
          const updated = { ...current[index], ...updatedData };
          current[index] = updated;
          this.placesSubject.next([...current]);
          return updated;
        }
        throw new Error('Lugar não encontrado localmente');
      })
    );
  }

  deletePlace(id: string): Observable<void> {
    return from(deleteDoc(doc(db, this.COLLECTION, id))).pipe(
      tap(() => {
        const current = this.placesSubject.value;
        this.placesSubject.next(current.filter(p => p._id !== id && p.id !== id));
      }),
      map(() => void 0)
    );
  }

  markAsVisited(id: string, visitDescription: string): Observable<Place> {
    const today = new Date();
    const visitDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return this.updatePlace(id, {
      status: 'visited',
      visitDate,
      visitDescription,
      plannedDate: undefined
    });
  }

  markAsPlanned(id: string): Observable<Place> {
    const today = new Date();
    const plannedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return this.updatePlace(id, {
      status: 'planned',
      plannedDate,
      visitDate: undefined,
      visitDescription: undefined
    });
  }

  updateDescription(id: string, description: string, isVisited: boolean = false): Observable<Place> {
    const updates = isVisited ? { visitDescription: description } : { description };
    return this.updatePlace(id, updates);
  }

  get visitedPlaces(): Place[] {
    return this.placesSubject.value.filter(p => p.status === 'visited');
  }

  get plannedPlaces(): Place[] {
    return this.placesSubject.value.filter(p => p.status === 'planned');
  }

  getStats() {
    const places = this.placesSubject.value;
    return {
      total: places.length,
      visited: this.visitedPlaces.length,
      planned: this.plannedPlaces.length,
      percentage: places.length > 0 ? Math.round((this.visitedPlaces.length / places.length) * 100) : 0
    };
  }
}
