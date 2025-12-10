# Guide de déploiement GitHub Pages

## Configuration automatique (recommandé)

Le workflow GitHub Actions (`.github/workflows/deploy.yml`) déploie automatiquement sur GitHub Pages à chaque push sur `main`.

### Vérifications nécessaires

1. **Activer GitHub Pages dans les paramètres du repo** :
   - Aller dans Settings > Pages
   - Source : "GitHub Actions" (pas "Deploy from a branch")
   - Sauvegarder

2. **Vérifier les permissions** :
   - Settings > Actions > General
   - "Workflow permissions" : "Read and write permissions"
   - Cocher "Allow GitHub Actions to create and approve pull requests"

3. **Pousser le code** :
   ```bash
   git add .
   git commit -m "Update"
   git push origin main
   ```

4. **Vérifier le déploiement** :
   - Aller dans l'onglet "Actions" du repo
   - Vérifier que le workflow "Deploy to GitHub Pages" s'exécute
   - Attendre la fin (icône verte)
   - L'URL sera : `https://lucashrc.github.io/Editeur-de-scene-WEBGPU/`

## Déploiement manuel (si le workflow ne fonctionne pas)

1. **Build local** :
   ```bash
   npm run build
   ```

2. **Aller dans Settings > Pages** :
   - Source : "Deploy from a branch"
   - Branch : `gh-pages` (créer cette branche si nécessaire)
   - Folder : `/ (root)`

3. **Créer la branche gh-pages** :
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   cp -r dist/* .
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```

## Dépannage

- **404 sur GitHub Pages** : Vérifier que le base path dans `vite.config.ts` correspond au nom du repo
- **Assets non chargés** : Vérifier les chemins relatifs dans `dist/index.html`
- **Workflow échoue** : Vérifier les logs dans l'onglet Actions

