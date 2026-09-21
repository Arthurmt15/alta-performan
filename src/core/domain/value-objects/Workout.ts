import { WorkoutType, WORKOUT_PROFILES, WorkoutProfile } from "@/types/track";

/**
 * Value Object Workout - Strategy pattern para curva de intensidade
 * Polimorfismo: cada curva pode ter ordenação diferente
 */
export abstract class IntensityStrategy {
  abstract sort<T extends { estimatedBpm: number; energyLevel: number }>(items: T[]): T[];
}

export class CrescenteStrategy extends IntensityStrategy {
  sort<T extends { estimatedBpm: number; energyLevel: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.estimatedBpm - b.estimatedBpm);
  }
}
export class DecrescenteStrategy extends IntensityStrategy {
  sort<T extends { estimatedBpm: number; energyLevel: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => b.estimatedBpm - a.estimatedBpm);
  }
}
export class PicoCentralStrategy extends IntensityStrategy {
  sort<T extends { estimatedBpm: number; energyLevel: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => b.energyLevel - a.energyLevel);
  }
}
export class ConstanteAltaStrategy extends IntensityStrategy {
  sort<T extends { estimatedBpm: number; energyLevel: number }>(items: T[]): T[] {
    return [...items].filter((i) => i.energyLevel >= 4);
  }
}
export class ConstanteBaixaStrategy extends IntensityStrategy {
  sort<T extends { estimatedBpm: number; energyLevel: number }>(items: T[]): T[] {
    return [...items].filter((i) => i.energyLevel <= 2);
  }
}

export class WorkoutFactory {
  static getStrategy(curve: string): IntensityStrategy {
    switch (curve) {
      case "CRESCENTE": return new CrescenteStrategy();
      case "DECRESCENTE": return new DecrescenteStrategy();
      case "PICO_CENTRAL": return new PicoCentralStrategy();
      case "CONSTANTE_ALTA": return new ConstanteAltaStrategy();
      case "CONSTANTE_BAIXA": return new ConstanteBaixaStrategy();
      default: return new CrescenteStrategy();
    }
  }
}

export class Workout {
  private readonly _profile: WorkoutProfile;
  private readonly _strategy: IntensityStrategy;

  constructor(type: WorkoutType) {
    this._profile = WORKOUT_PROFILES[type];
    this._strategy = WorkoutFactory.getStrategy(this._profile.intensityCurve);
  }

  get profile() { return this._profile; }
  get strategy() { return this._strategy; }
  get type() { return this._profile.type; }
  get bpmRange() { return this._profile.bpmRange; }
}
