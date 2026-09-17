import { fileURLToPath } from 'node:url';
console.log("process.argv[1]:", process.argv[1]);
console.log("import.meta.url:", import.meta.url);
console.log("fileURLToPath:", fileURLToPath(import.meta.url));
console.log("match:", process.argv[1] === fileURLToPath(import.meta.url));
