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
    content: 'Découvrez comment créer et éditer des scènes 3D en temps réel avec WebGPU. Ce tutoriel vous guidera à travers toutes les fonctionnalités.',
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
    title: 'Sélectionner dans la scène',
    content: 'Cliquez directement sur un objet 3D dans le viewport pour le sélectionner. Le curseur change en pointeur quand vous survolez un objet cliquable.',
    target: '.viewport-canvas',
    position: 'left',
    showHighlight: true,
  },
  {
    id: 'inspector',
    title: 'Éditer les propriétés',
    content: 'L\'inspecteur s\'ouvre automatiquement quand vous sélectionnez un objet. L\'onglet "Object" vous permet de modifier la position (X, Y, Z), la taille/rayon, et la couleur en temps réel. Vous pouvez rabattre l\'inspecteur avec le bouton en haut à droite, et le rouvrir avec le bouton au bord droit de la fenêtre.',
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
    id: 'context-menu',
    title: 'Menu contextuel',
    content: 'Faites un clic droit sur un objet dans la sidebar pour accéder à un menu avec toutes les actions : renommer, dupliquer, masquer, supprimer, etc.',
    target: '.list-item',
    position: 'right',
    showHighlight: true,
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Raccourcis clavier',
    content: 'Utilisez les raccourcis : Delete/Backspace (supprimer), D (dupliquer), F (focus caméra), Escape (désélectionner), Space (pause/play). Consultez l\'onglet ⌨️ dans l\'inspecteur pour la liste complète.',
    target: '.inspector-tabs',
    position: 'left',
    showHighlight: true,
  },
  {
    id: 'topbar-actions',
    title: 'Actions de la barre supérieure',
    content: 'La barre supérieure contient : Pause/Play (animation), Export/Import (scène JSON), Screenshot (capture PNG), Reset Camera, et le toggle Dark/Light mode.',
    target: '.topbar-right',
    position: 'bottom',
    showHighlight: true,
  },
  {
    id: 'camera-controls',
    title: 'Contrôles de la caméra',
    content: 'Dans le viewport : glissez pour faire tourner la caméra, utilisez la molette pour zoomer/dézoomer. L\'onglet "Scene" dans l\'inspecteur permet d\'ajuster le FOV, la distance et les angles.',
    target: '.viewport-canvas',
    position: 'top',
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
    id: 'final',
    title: 'Prêt à créer !',
    content: 'Vous connaissez maintenant toutes les fonctionnalités de Scene Editor. N\'hésitez pas à explorer et expérimenter. Vous pouvez relancer ce tutoriel depuis le bouton d\'aide dans la barre supérieure.',
    position: 'center',
    showHighlight: false,
  },
];
