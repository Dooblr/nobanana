import create from 'zustand';
import { Vector3 } from 'three';

type Projectile = {
  id: number;
  position: Vector3;
  direction: Vector3;
  createdAt: number;
};

type Enemy = {
  id: number;
  position: Vector3;
  health: number;
  lastHitTime?: number;
};

type GameState = {
  projectiles: Projectile[];
  enemies: Enemy[];
  addProjectile: (projectile: Projectile) => void;
  removeProjectile: (id: number) => void;
  addEnemy: (enemy: Enemy) => void;
  updateEnemy: (id: number, lastHitTime: number) => void;
};

const useStore = create<GameState>((set) => ({
  projectiles: [],
  enemies: [],
  addProjectile: (projectile) => set((state) => ({
    projectiles: [...state.projectiles, projectile],
  })),
  removeProjectile: (id) => set((state) => ({
    projectiles: state.projectiles.filter((p) => p.id !== id),
  })),
  addEnemy: (enemy) => set((state) => ({
    enemies: [...state.enemies, enemy],
  })),
  updateEnemy: (id, lastHitTime) => set((state) => ({
    enemies: state.enemies.map((e) => 
      e.id === id ? { ...e, lastHitTime } : e
    ),
  })),
}));

export default useStore; 