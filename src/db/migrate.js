import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const _migratePkg = require('node-pg-migrate');
const migrate = _migratePkg.runner || _migratePkg;

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

dotenv.config( {path: path.join(_dirname, "../../.env")} );

const databaseUrl = `postgres://${process.env.DB_USER}:` +
                    `${process.env.DB_PASSWORD}@` +
                    `${process.env.DB_HOST}:` +
                    `${process.env.DB_PORT}/` +
                    `${process.env.DB_NAME}`; 
console.log('databaseUrl:', databaseUrl);

await migrate({
  databaseUrl,
  dir: path.join(_dirname, "../../migrations"),
  direction: "up",
  migrationsTable: "schema-migrations",
});