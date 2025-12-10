# WebGPU Scene Editor

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://lucashrc.github.io/Editeur-de-scene-WEBGPU/)

![Demo](gif-readme/Demo.gif)

Editeur de scenes 3D temps reel base sur WebGPU et ray marching.
Manipulation de spheres et boites directement dans la scene, export/import JSON.

---

## Fonctionnalites

<table>
<tr>
<td width="50%">

**Selection des objets 3D**

![Selection](gif-readme/selection-des-models-3D.gif)

</td>
<td width="50%">

**Deplacement via controles**

![Deplacement](gif-readme/Déplacement-dynamique-sur-controles-&-scene.gif)

</td>
</tr>
<tr>
<td width="50%">

**Camera orbitale**

![Camera](gif-readme/déplacement-angle-a-camera-dynamique-scene-curseurs.gif)

</td>
<td width="50%">

**Duplication et focus**

![Commandes](gif-readme/commandes%20rapides%20dupliquer%20et%20focus%20camera%20avec%20zoom%20dezoom.gif)

</td>
</tr>
<tr>
<td width="50%">

**Renommage des objets**

![Renommage](gif-readme/renommge%20des%20models%203D.gif)

</td>
<td width="50%">

**Theme sombre / clair**

![Theme](gif-readme/mode-sombre-clair.gif)

</td>
</tr>
<tr>
<td width="50%">

**Export de la scene**

![Export](gif-readme/download%20du%20code.gif)

</td>
<td width="50%">

**Import d'une scene**

![Import](gif-readme/upload%20d'un%20code.gif)

</td>
</tr>
</table>

---

## Stack technique

- WebGPU + WGSL (ray marching)
- React 18 + TypeScript
- Vite

---

## Installation

```bash
npm install
```

## Developpement

```bash
npm run dev
# http://localhost:5180
```

## Build

```bash
npm run build
```

---

## Raccourcis

| Touche | Action |
| --- | --- |
| `Delete` | Supprimer l'objet |
| `D` | Dupliquer |
| `F` | Focus camera |
| `Esc` | Deselectionner |
| `Space` | Pause / Play |
| Molette | Zoom |
| Drag viewport | Orbite camera |

---

## Licence

MIT
