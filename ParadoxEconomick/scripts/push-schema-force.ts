// Script to push schema to database with force option
import { exec } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function pushSchemaForce() {
  console.log('Pushing schema to database (force mode)...');
  
  return new Promise<void>((resolve, reject) => {
    // Execute the drizzle-kit push command with force flag
    exec('npx drizzle-kit push:pg --force', { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error pushing schema:', error);
        console.error(stderr);
        reject(error);
        return;
      }
      
      console.log(stdout);
      console.log('Schema pushed successfully!');
      resolve();
    });
  });
}

// Execute the function
pushSchemaForce()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to push schema:', error);
    process.exit(1);
  });