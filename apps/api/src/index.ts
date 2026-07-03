import { env } from './env.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`api listening on http://localhost:${env.port}`);
});
