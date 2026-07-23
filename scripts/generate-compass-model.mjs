import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((value) => {
        this.result = value;
        this.onloadend?.({ target: this });
      });
    }
  };
}

const bronze = new THREE.MeshStandardMaterial({ color: 0x8b6735, metalness: 0.88, roughness: 0.38 });
const bronzeDark = new THREE.MeshStandardMaterial({ color: 0x3d2b18, metalness: 0.76, roughness: 0.5 });
const gold = new THREE.MeshStandardMaterial({ color: 0xd7a84c, metalness: 0.94, roughness: 0.24, emissive: 0x261705, emissiveIntensity: 0.32 });
const obsidian = new THREE.MeshStandardMaterial({ color: 0x0b1111, metalness: 0.42, roughness: 0.3 });
const moss = new THREE.MeshStandardMaterial({ color: 0x59704d, metalness: 0.38, roughness: 0.48, emissive: 0x12200f, emissiveIntensity: 0.28 });
const root = new THREE.Group();
root.name = 'QuestCompass';

function add(mesh, name) {
  mesh.name = name;
  root.add(mesh);
  return mesh;
}

add(new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.22, 0.18, 96), bronzeDark), 'Backplate').rotation.x = Math.PI / 2;
add(new THREE.Mesh(new THREE.CylinderGeometry(1.86, 1.86, 0.22, 96), obsidian), 'ObsidianFace').rotation.x = Math.PI / 2;
add(new THREE.Mesh(new THREE.TorusGeometry(2.28, 0.17, 20, 128), bronze), 'OuterRing');
add(new THREE.Mesh(new THREE.TorusGeometry(1.93, 0.055, 12, 128), gold), 'InnerGoldRing');
add(new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.075, 14, 96), bronze), 'TrackingRing');
add(new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.09, 14, 64), gold), 'CoreRing');

const needle = new THREE.Group();
needle.name = 'Needle';
const north = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.48, 4), gold);
north.rotation.z = Math.PI;
north.position.set(0, 0.72, 0.18);
const south = new THREE.Mesh(new THREE.ConeGeometry(0.13, 1.05, 4), bronze);
south.position.set(0, -0.5, 0.16);
needle.add(north, south);
root.add(needle);
const core = add(new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 1), gold), 'LivingCore');
core.position.z = 0.28;

const colors = [moss, bronze, gold, moss];
const labels = ['MindRune', 'BodyRune', 'DiscoveryRune', 'GuildRune'];
for (let index = 0; index < 4; index += 1) {
  const angle = index * Math.PI / 2;
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), colors[index]);
  marker.position.set(Math.sin(angle) * 1.7, Math.cos(angle) * 1.7, 0.18);
  marker.rotation.z = angle;
  add(marker, labels[index]);
}

for (let index = 0; index < 24; index += 1) {
  const angle = (index / 24) * Math.PI * 2;
  const major = index % 6 === 0;
  const tick = new THREE.Mesh(new THREE.BoxGeometry(major ? 0.055 : 0.025, major ? 0.22 : 0.13, 0.04), major ? gold : bronze);
  tick.position.set(Math.sin(angle) * 2.01, Math.cos(angle) * 2.01, 0.14);
  tick.rotation.z = -angle;
  add(tick, `Tick${index + 1}`);
}

const scene = new THREE.Scene();
scene.add(root);
const exporter = new GLTFExporter();
const output = await new Promise((resolveOutput, reject) => {
  exporter.parse(scene, resolveOutput, reject, { binary: true, onlyVisible: true, trs: false });
});
const path = resolve('public/assets/quest-compass.glb');
await mkdir(dirname(path), { recursive: true });
await writeFile(path, Buffer.from(output));
console.log(`Wrote ${path}`);
