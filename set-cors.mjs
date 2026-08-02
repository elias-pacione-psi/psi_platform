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
        // Agregar acá el dominio real de producción (Vercel y/o dominio propio) antes
        // del primer deploy — si no, la subida funciona en local pero falla en prod.
        AllowedOrigins: [
          'http://localhost:3000',
          'https://psi-platform-git-main-psi12.vercel.app',
          'https://psi-platform-ten.vercel.app',
        ],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      },
    ],
  },
});

s3.send(command).then(() => console.log('CORS OK')).catch(console.error);
