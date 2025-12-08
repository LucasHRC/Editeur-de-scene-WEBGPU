# WebGPU Scene Editor

Éditeur de scène 3D interactif utilisant WebGPU et le ray marching en temps réel.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvrir `http://localhost:5180` dans Chrome 113+ ou Edge 113+.

## Build

```bash
npm run build
```

Les fichiers de production sont générés dans `dist/`.

## Technologies

- React 18 + TypeScript
- Vite
- WebGPU / WGSL
- Ray marching

## Structure

```
src/
├── components/     Composants React
├── hooks/          Hooks personnalisés
├── webgpu/         Renderer WebGPU et shaders
└── types/          Définitions TypeScript
```

## Fonctionnalités

- Ajout et modification d'objets 3D (sphères, cubes)
- Contrôle de la caméra orbitale
- Sélection directe dans la scène 3D
- Export/Import de scènes JSON
- Mode sombre/clair
- Raccourcis clavier

## Licence

MIT
