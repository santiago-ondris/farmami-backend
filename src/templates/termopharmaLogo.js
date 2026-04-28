import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, '../assets/termopharma-logo.jpeg');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');

export function getTermopharmaLogoDataUri() {
  return `data:image/jpeg;base64,${logoBase64}`;
}
