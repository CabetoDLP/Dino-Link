// types/gameTypes.ts
export interface Dino {
  x: number;
  y: number;
  width: number;
  height: number;
  isJumping: boolean;
  isBending: boolean;
  jumpHeight: number;
  fastFalling: boolean;
  isDead: boolean;
  wantsToCrouch: boolean;
  color: string;
}

export interface Obstacle {
  type: 'cactus' | 'pterodactyl';
  x: number;
  y: number;
  width: number;
  height: number;
  img?: HTMLImageElement;
  frameIndex?: number;
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface GameState {
  frame: number;
  score: number;
  speed: number;
  isGameOver: boolean;
  showHitboxes: boolean;
  currentGradientIndex: number;
  isGradientTransitioning: boolean;
  transitionStartTime: number;
  nextObstacleTime: number;
  dinos: Dino[];
  obstacles: Obstacle[];
  clouds: Cloud[];
  imagesLoaded: boolean;
  imagesToLoad: number;
  imagesLoadedCount: number;
}

export type GameAction =
  | { type: 'UPDATE_FRAME' }
  | { type: 'INCREMENT_SCORE' }
  | { type: 'UPDATE_SPEED'; payload: number }
  | { type: 'GAME_OVER' }
  | { type: 'TOGGLE_HITBOXES' }
  | { type: 'CHANGE_GRADIENT'; payload: number }
  | { type: 'START_GRADIENT_TRANSITION'; payload: { from: number; to: number } }
  | { type: 'END_GRADIENT_TRANSITION' }
  | { type: 'ADD_OBSTACLE'; payload: Obstacle }
  | { type: 'REMOVE_OBSTACLE'; payload: number }
  | { type: 'ADD_CLOUD'; payload: Cloud }
  | { type: 'REMOVE_CLOUD'; payload: number }
  | { type: 'UPDATE_DINO'; payload: { index: number; updates: Partial<Dino> } }
  | { type: 'IMAGE_LOADED' }
  | { type: 'RESET_GAME' };