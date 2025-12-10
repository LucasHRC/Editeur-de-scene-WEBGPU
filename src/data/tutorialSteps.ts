export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // Selector CSS pour highlight
  action?: () => void; // Action automatique à exécuter
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showHighlight?: boolean;
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue dans Scene Editor',
    content: 'Découvrez comment créer et éditer des scènes 3D en temps réel avec WebGPU. Ce tutoriel vous guidera à travers toutes les fonctionnalités, y compris le gizmo 3D, le menu contextuel et les nouveaux contrôles de caméra.',
    position: 'center',
    showHighlight: false,
  },
  {
    id: 'sidebar',
    title: 'Ajouter des objets',
    content: 'Utilisez les boutons "+ Sphere" et "+ Box" dans la barre latérale pour ajouter des objets à votre scène. Vous pouvez ajouter jusqu\'à 8 objets de chaque type.',
    target: '.sidebar-actions',
    position: 'right',
    showHighlight: true,
  },
  {
    id: 'viewport-select',
    title: 'Sélectionner un objet',
    content: 'Cliquez directement sur un objet 3D dans le viewport pour le sélectionner. La caméra pivote automatiquement autour de l\'objet sélectionné. Un contour doré indique l\'objet actif.',
    target: '.viewport-canvas',
    position: 'left',
    showHighlight: true,
  },
  {
    id: 'gizmo',
    title: 'Gizmo de déplacement (X/Y/Z)',
    content: 'Quand un objet est sélectionné, un gizmo 3D apparaît avec 3 axes colorés : Rouge (X), Vert (Y), Bleu (Z). Glissez un axe pour déplacer l\'objet. Un indicateur en bas à droite montre l\'axe survolé. Maintenez Shift pour un déplacement précis.',
    target: '.viewport-canvas',
    position: 'left',
    showHighlight: true,
  },
  {
    id: 'context-menu-viewport',
    title: 'Menu clic droit (3D)',
    content: 'Faites un clic droit sur un objet 3D dans le viewport pour accéder au menu contextuel : "Remettre à l\'origine" (reset position à 0,0,0), "Focus caméra" (zoom sur l\'objet), "Désélectionner".',
    target: '.viewport-canvas',
    position: 'left',
    showHighlight: true,
  },
  {
    id: 'camera-controls',
    title: 'Contrôles de la caméra',
    content: 'Glissez pour faire tourner la caméra autour de l\'objet sélectionné (ou de l\'origine si rien n\'est sélectionné). Utilisez la molette pour zoomer. La caméra suit toujours l\'objet actif comme point de pivot.',
    target: '.viewport-canvas',
    position: 'top',
    showHighlight: true,
  },
  {
    id: 'inspector',
    title: 'Inspecteur (Object/Scene)',
    content: 'L\'inspecteur s\'ouvre automatiquement à la sélection. L\'onglet "Object" permet de modifier position, taille et couleur. L\'onglet "Scene" ajuste le FOV, la distance et les angles de la caméra.',
    target: '.inspector',
    position: 'left',
    showHighlight: true,
  },
  {
    id: 'inspector-tabs',
    title: 'Onglets de l\'inspecteur',
    content: '4 onglets disponibles : "Object" (propriétés objet), "Scene" (caméra), "⌨️" (raccourcis clavier), "Code" (édition JSON). Cliquez sur un onglet pour changer de vue.',
    target: '.inspector-tabs',
    position: 'left',
    showHighlight: true,
  },
  {
    id: 'code-tab',
    title: 'Onglet Code (JSON)',
    content: 'L\'onglet "Code" affiche la scène au format JSON. Vous pouvez modifier directement le code et cliquer sur "Appliquer les modifications" pour mettre à jour la scène. Pratique pour des ajustements précis ou le backup.',
    target: '.inspector-tabs',
    position: 'left',
    showHighlight: true,
  },
  {
    id: 'inspector-toggle',
    title: 'Afficher/Masquer l\'inspecteur',
    content: 'Utilisez le bouton fléché sur le bord de l\'inspecteur pour le masquer ou l\'afficher. Quand masqué, un bouton apparaît à droite de l\'écran pour le réouvrir. L\'inspecteur s\'ouvre automatiquement à la sélection.',
    target: '.inspector',
    position: 'left',
    showHighlight: true,
  },
  {
    id: 'rename',
    title: 'Renommer un objet',
    content: 'Double-cliquez sur le nom d\'un objet dans la sidebar pour le renommer. Appuyez sur Entrée pour valider ou Échap pour annuler.',
    target: '.list-item-name',
    position: 'right',
    showHighlight: true,
  },
  {
    id: 'sidebar-context',
    title: 'Menu contextuel (sidebar)',
    content: 'Faites un clic droit sur un objet dans la sidebar pour accéder aux actions : renommer, dupliquer, masquer, supprimer, etc.',
    target: '.list-item',
    position: 'right',
    showHighlight: true,
  },
  {
    id: 'visibility',
    title: 'Gérer la visibilité',
    content: 'Cliquez sur l\'icône œil à côté de chaque objet dans la sidebar pour le masquer ou l\'afficher. Les objets masqués restent dans la scène mais ne sont pas rendus.',
    target: '.list-item-visibility',
    position: 'right',
    showHighlight: true,
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Raccourcis clavier',
    content: 'Delete/Backspace (supprimer), D (dupliquer), F (focus caméra), Escape (désélectionner), Space (pause/play), Shift+Drag (précision gizmo). Consultez l\'onglet ⌨️ pour la liste complète.',
    target: '.inspector-tabs',
    position: 'left',
    showHighlight: true,
  },
  {
    id: 'topbar-actions',
    title: 'Actions de la barre supérieure',
    content: 'Pause/Play (animation), Export/Import (scène JSON), Screenshot (capture PNG), Reset Camera, toggle Dark/Light mode, et le bouton "?" pour relancer ce tutoriel.',
    target: '.topbar-right',
    position: 'bottom',
    showHighlight: true,
  },
  {
    id: 'final',
    title: 'Prêt à créer !',
    content: 'Vous connaissez maintenant toutes les fonctionnalités de Scene Editor : gizmo 3D, menu clic droit, pivot caméra sur objet, onglet code JSON, et plus encore. Explorez et créez vos scènes !',
    position: 'center',
    showHighlight: false,
  },
];
