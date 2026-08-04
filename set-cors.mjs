// Configura CORS en el bucket de R2 — correr UNA VEZ con `node set-cors.mjs` después de
// cargar las 4 variables R2_* en .env.local. Sin esto, la subida presignada desde el
// navegador (materiales, entregas) falla por CORS aunque las credenciales sean correctas:
// el PUT sale del origen de la app hacia el endpoint de R2, que es un origen distinto.
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const command = new PutBucketCorsCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        // Sincronizado el 2026-08-04 con la config real del bucket (Cloudflare
        // Dashboard → R2 → el bucket → Settings → CORS Policy — la fuente de verdad,
        // ya que el token de este entorno no tiene permiso para leerla ni escribirla:
        // GetBucketCorsCommand da AccessDenied). Sin esto no correr este script a
        // ciegas: pisaría orígenes reales (como localhost:5000) que no estaban acá.
        // eliaspacione.com (y su www) sumados en esta misma sincronización: sin ellos,
        // el PUT presignado directo al bucket desde el dominio propio fallaba con
        // "NetworkError" en el navegador — CORS lo bloquea antes de que la request
        // salga, así que el error que se ve no menciona CORS para nada.
        AllowedOrigins: [
          'http://localhost:3000',
          'http://localhost:5000',
          'https://psi-platform-ten.vercel.app',
          'https://eliaspacione.com',
          'https://www.eliaspacione.com',
        ],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      },
    ],
  },
});

s3.send(command).then(() => console.log('CORS OK')).catch(console.error);
