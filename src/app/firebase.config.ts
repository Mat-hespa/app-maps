import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDJHPPRPcf4uXA_2ekvaLCZPD_e65ZpAlU',
  authDomain: 'app-maps-6101a.firebaseapp.com',
  projectId: 'app-maps-6101a',
  storageBucket: 'app-maps-6101a.firebasestorage.app',
  messagingSenderId: '673731575878',
  appId: '1:673731575878:web:3f0fa2bf3b6b3860d10a47'
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
