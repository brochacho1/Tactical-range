export const GAME_CONFIG = {
  MAX_AMMO: 17,
  RELOAD_TIME: 1500, // ms
  FIRE_RATE: 150, // slightly faster fire rate for 17 rounds
  RECOIL_AMOUNT: 12, // slightly less recoil for better control
  RECOIL_RECOVERY: 0.12,
  TARGET_SPAWN_RATE: 1200, // faster spawn rate
  TARGET_LIFETIME: 8000, // targets stay for 8 seconds
  MAX_TARGETS: 15, // allow significantly more targets on screen
  GUNSHOT_URL: 'https://raw.githubusercontent.com/brochacho1/mything/main/SingleGunshot%20MP3',
  RELOAD_URL: 'https://raw.githubusercontent.com/brochacho1/mything2/main/A_pistol_reload_%231-1775658431290.mp3',
  RIFLE_URL: 'https://raw.githubusercontent.com/brochacho1/mything3/main/A_LOUD_POP_type_guns_%232-1775660217761.mp3',
  RIFLE_RELOAD_URL: 'https://raw.githubusercontent.com/brochacho1/mything4/main/A_rifle_mag_going_ou_%232-1775660839285.mp3',
  SCORE_TO_MONEY_RATE: 0.1, // 10 score = 1 money
};

export const DIFFICULTIES = {
  EASY: {
    id: 'easy' as const,
    name: 'Easy',
    spawnRate: 2000,
    maxTargets: 8,
    penalty: 0,
    priceMultiplier: 1,
    hitScore: 500,
  },
  MEDIUM: {
    id: 'medium' as const,
    name: 'Medium',
    spawnRate: 1200,
    maxTargets: 15,
    penalty: 0,
    priceMultiplier: 2,
    hitScore: 250,
  },
  HARD: {
    id: 'hard' as const,
    name: 'Hard',
    spawnRate: 800,
    maxTargets: 20,
    penalty: 100,
    priceMultiplier: 3,
    hitScore: 100,
  },
  IMPOSSIBLE: {
    id: 'impossible' as const,
    name: 'Impossible',
    spawnRate: 400,
    maxTargets: 30,
    penalty: 200,
    priceMultiplier: 4,
    hitScore: 50,
  }
};

export const GUNS = {
  PISTOL: {
    id: 'pistol',
    name: 'Pistol',
    maxAmmo: 17,
    fireRate: 150,
    recoilAmount: 12,
    recoilRecovery: 0.12,
    reloadTime: 1500,
    gunshotUrl: 'https://raw.githubusercontent.com/brochacho1/mything/main/SingleGunshot%20MP3',
    reloadUrl: 'https://raw.githubusercontent.com/brochacho1/mything2/main/A_pistol_reload_%231-1775658431290.mp3',
    price: 0,
  },
  RIFLE: {
    id: 'rifle',
    name: 'Rifle',
    maxAmmo: 30,
    fireRate: 80,
    recoilAmount: 8,
    recoilRecovery: 0.15,
    reloadTime: 2000,
    gunshotUrl: 'https://raw.githubusercontent.com/brochacho1/mything3/main/A_LOUD_POP_type_guns_%232-1775660217761.mp3',
    reloadUrl: 'https://raw.githubusercontent.com/brochacho1/mything4/main/A_rifle_mag_going_ou_%232-1775660839285.mp3',
    price: 5000,
  },
  LMG: {
    id: 'lmg',
    name: 'LMG',
    maxAmmo: 100,
    fireRate: 100,
    recoilAmount: 15,
    recoilRecovery: 0.1,
    reloadTime: 4000,
    gunshotUrl: 'https://raw.githubusercontent.com/brochacho1/mything5/main/A_LMG_single_gunshot_%231-1775663439295.mp3',
    reloadUrl: 'https://raw.githubusercontent.com/brochacho1/mything5/main/A_slightly_long_LMG__%231-1775663505392.mp3',
    price: 12500,
  }
};
