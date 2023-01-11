import { createServer } from 'vite'
import {default as path} from 'path'
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);


const server = await createServer({
    // any valid user config options, plus `mode` and `configFile`
    configFile: false,
    root: path.resolve(__dirname, 'test-context'),
    server: {
      port: 10880,
    },
})

await server.listen();

server.printUrls()