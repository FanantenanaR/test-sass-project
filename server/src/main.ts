import dotenv from 'dotenv';

// Charger .env.local uniquement en développement
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.local' });
}

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from "firebase-functions/v2";

const app = initializeApp();
export const dbFirestore = getFirestore(app);
export const auth = getAuth(app); 

// ========================== CONFIGURATION ENVIRONNEMENT ==========================

const isDevelopment = process.env.NODE_ENV === 'development';

// ✅ Distinction dev/prod obligatoire
if (isDevelopment) {
  // 🔧 Mode DÉVELOPPEMENT - Émulateurs Firebase
  setGlobalOptions({
    region: "us-central1", // ✅ us-central1 obligatoire pour émulateurs
    concurrency: 1,
  });
} else {
  // 🔧 Mode PRODUCTION
  setGlobalOptions({
    region: "europe-west1", // ✅ europe-west1 pour production EU
    concurrency: 10,
    memory: '512MiB'
  });
}

// ========================== SECRETS FIREBASE ==========================

// ✅ Secrets définis (utilisés uniquement en production)
// En développement, les émulateurs ne les utilisent pas
export const serverToken = defineSecret('SERVER_API_AGENT_TOKEN');
export const jwtWorkspaceSecret = defineSecret('JWT_WORKSPACE_SECRET');
export const databaseUrlProd = defineSecret('DATABASE_URL_PROD');

// ========================== SERVICE URLS ==========================

export const SERVICE_URL = isDevelopment
  ? {
      // 🔧 URLs DÉVELOPPEMENT
      FIREBASE: 'http://localhost:5001/demo-project/us-central1',
      FASTAPI: 'http://127.0.0.1:8080',
      APP: 'http://localhost:3000',
    }
  : {
      // 🔧 URLs PRODUCTION
      FIREBASE: 'https://europe-west1-demo-project.cloudfunctions.net',
      FASTAPI: 'https://api.demo-project.com',
      APP: 'https://app.demo-project.com',
    };

