import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Map} from './map/map';
import { AddPlace } from './add-place/add-place';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'mapa', component: Map },
    { path: 'add-place', component: AddPlace },
];
