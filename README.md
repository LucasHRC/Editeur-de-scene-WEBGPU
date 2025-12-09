# WebGPU Scene Editor

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://lucashrc.github.io/Editeur-de-scene-WEBGPU/)

![Aperçu de l’éditeur](Demo.gif)

Éditeur de scène 3D en ray marching avec WebGPU : création et modification d’objets (sphères, cubes), sélection directe dans le viewport, UI d’inspection en temps réel et export/import de scènes JSON.

## Fonctionnalités clés
- Scène paramétrable via arrays de primitives (jusqu’à 8 sphères et 8 cubes)
- Contrôles d’objet : position, rayon/taille, couleur, visibilité, duplication, suppression
- Sélection directe dans le viewport (raycast aligné sur le shader) et mise en évidence
- UI d’inspection dynamique : sélection d’objet, ajout d’objets, auto-scroll vers le bloc actif
- Caméra orbitale complète (rotation, zoom, FOV), focus sur objet
- Export/Import JSON, tutoriel interactif, raccourcis clavier
- Mode sombre/clair et gizmo 3D dans le shader pour la sélection

## Stack technique
- WebGPU + WGSL (ray marching temps réel)
- React 18, TypeScript
- Vite (développement et build)
- CSS custom pour l’UI (thème clair/sombre)

## Démarrage rapide
Prérequis : Node.js 18+, navigateur WebGPU (Chrome/Edge 113+).  
Installation :
```bash
npm install
```
Développement (Vite) :
```bash
npm run dev
# http://localhost:5180
```
Serveur statique (alternative) :
```bash
python -m http.server
# http://localhost:8000
```
Build production :
```bash
npm run build
# artefacts dans dist/
```

## Déploiement
- Workflow GitHub Pages déjà configuré : `.github/workflows/deploy.yml`
- Base Vite adaptée (`base: './'`) pour un déploiement statique
- Démo publique : lien en haut de page

## Structure du projet
```
src/
├── components/      UI (viewport, inspector, sidebar, topbar)
├── hooks/           useScene, useWebGPU
├── webgpu/          renderer, buffers, shaders WGSL
└── types/           définitions TypeScript
```

## Points remarquables
- Raycast JS calé sur le shader pour la cohérence viewport/shader
- UI réactive alignée sur la structure de scène et les bornes (MAX_SPHERES/BOXES)
- Mise en avant de la sélection et tutoriel embarqué pour l’onboarding

## Licence
MIT
