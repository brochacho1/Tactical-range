export interface Target {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  direction: number;
  health: number;
  maxHealth: number;
  type: 'static' | 'moving';
  spawnedAt: number;
}

export interface Gun {
  id: string;
  name: string;
  maxAmmo: number;
  fireRate: number;
  recoilAmount: number;
  recoilRecovery: number;
  reloadTime: number;
  gunshotUrl: string;
  reloadUrl: string;
  price: number;
}

export type DifficultyId = 'easy' | 'medium' | 'hard' | 'impossible';

export interface Difficulty {
  id: DifficultyId;
  name: string;
  spawnRate: number;
  maxTargets: number;
  penalty: number;
  priceMultiplier: number;
  hitScore: number;
}

export interface GameState {
  score: number;
  money: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  isGameOver: boolean;
  targets: Target[];
  lastShotTime: number;
  recoil: number;
  currentGun: Gun;
  ownedGuns: string[];
  difficulty: Difficulty;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
