import fs from 'fs/promises';
import { config } from './config.js';
import { createApp } from './app.js';

async function ensureDirs() {
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.mkdir(config.encryptedDir, { recursive: true });
  await fs.mkdir(config.keysDir, { recursive: true });
  await fs.mkdir(config.tempDir, { recursive: true });
}

await ensureDirs();
const app = createApp();
app.listen(config.port, () => {
  console.log(`ARY Digital Library API on http://localhost:${config.port}`);
  console.log(`CORS origin: ${config.clientOrigin}`);
});
