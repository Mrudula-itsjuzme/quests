import { fileURLToPath } from 'node:url';
console.log("argv[1]:", process.argv[1]);
console.log("meta:", fileURLToPath(import.meta.url));
console.log("match:", process.argv[1] === fileURLToPath(import.meta.url));
