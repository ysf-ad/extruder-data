import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import dotenv from 'dotenv';

dotenv.config();

// const serviceAccount = {
//     "type": "service_account",
//     "project_id": "extruder-data",
//     "private_key_id": "45d36ff30e56640d6a302a3220bde026101c3958",
//     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCvHlAibAOzFanB\nJuUhzcR80CwHWEEsZf1yyR9xsxGGujGXZBlyqmXV9Yytk1YFHWWfka9wFC8gsKeZ\nLuurhWVHBSB6Aoo5QTD8TQzppXntnnoEjw0rnoeAQUsjl9fZbKdpo7SfsnqpgPrP\nIw2ykwrRoi3McDRiKtBrKyWZI+/LNwHfi0j3Q2GdziNGTN+XhMABA00xSCRblE+f\nrnbIaGJzuevFftCP//yzvBcUEpJYuLPVgcUoPS2eV1gEsL46DXoSJc3cYWo2+F6T\nSpTyrQpkBvXEfxskQTa46tORBr75KFXfJuOHVbUKEmFbNHltNvTniBi1hYVGfTvE\nW+s3qqc7AgMBAAECggEAAIBUoleJ63z6JoDl0NwkEJ1m/jtWNQ5bDdO4+8Sg9Y6k\nUBGa8f2+TZHIZ1ZFnADSuVw9YFpqph7BO6VQcyEdcXJQLdQuZqPSALxdhM7c5+KE\nzgFTWp2V2XN7c2XesYxnyYsTgSjKPcj6BmdMT6k2QRx6L6oUkBj0zfAMSXqY4g17\ncHRqP57hFRSPUosisT7CurAsBBxRxzqE6h5ggfIrPbbtPetZ08IRH/0KoouZkTU5\nJlucU4A75W+SfjGQpND6gpOmHUrFX8zU9aUkf49EO+OUYBFihn44bGegPa/UwvLk\n0hldurUa8fjievWxko4ztwaVUDYFkktw4mzcH/ZCSQKBgQDfcdLYVDmswTvrsLFF\nd/ulFijKHQF6TCook9NfQqWkyJVMVARcsjnq0hwsa/Q+9srMrVy6Uq4GMMcBjyMr\n6k0zkGbVzIct8wqtfJpd5PllECF9CCE+EkrfRaMU0po5Y/KlsgKFfLwpFCmVbHOr\nWRGHoYs1QHDAwL6Srdn0/CU62QKBgQDIof0AXtnHA+nlyOiFmh+Z/+x5t1nP6k8h\n+XehHlnz3yBx54fMPCUss8Gcb0a208wpljYitJ6p6E9nC7hPd0zY6Citc0yPcVw5\n+Mel4dFfmCnp+SFDr+F7+qoCsGSDOdK2ZfvFrxy7XQXN+e9fLEMUDOEroRR9a58a\nUGtzMJ6eMwKBgAjux/sWAuhBIWAexDd+wHStGhxaZIC7IsRUhJK+W1jnG/DdOv9p\nsJ8On0m3VyBdRWZBV/+q5oIg2RPa4REUYNm64CGT96OCn96nqJQwXzgHGQ+ij5Gn\nsY6Tfh2K/ddlg4HUR/2GKw+JWtA6cbVb7jN55dLPLLLIAdZjVN9SZTqhAoGAU926\nx2Pevt048Y+4+tgBK7uaGwr0pP+50mbYheYNDe8QPezdjBb8JyKA5SZytcv1BNFA\nkeNUi4uLXXS9t6IT4nuxPUf8Ed3+AlGnCwVJIx+VLbOxHv0vUUbnuDYJ3fzWwt4A\nj5LyfLOW0JIQaIU1CPWVTkqIKSFKoZJKSB1jwJcCgYAhdnww1EaoILEY8u8qRPgU\ndYFf0/b5TnsybcA5yVWFhtvE/10Xtj6W4/JqZSkumixXMmYcbF+9/I1PT9Xz0w6n\nYy9lX1dK33vd5W8q4R8QDxJsa82ezSj0gcHZeVw9YtUryQkerj5RXD+5wod9yZz+\nwnty41MTRzwsyhzIhP8N7w==\n-----END PRIVATE KEY-----\n",
//     "client_email": "firebase-adminsdk-5zlc3@extruder-data.iam.gserviceaccount.com",
//     "client_id": "106580567749543776776",
//     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//     "token_uri": "https://oauth2.googleapis.com/token",
//     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-5zlc3%40extruder-data.iam.gserviceaccount.com",
//     "universe_domain": "googleapis.com"
//   } as any;

const serviceAccount: any = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  }
  return getStorage();
}

export const storage = getFirebaseAdmin();