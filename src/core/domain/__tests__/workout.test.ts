import { Workout, WorkoutFactory } from "../value-objects/Workout";

describe("Workout Strategy OOP", () => {
  it("factory retorna strategy correta", () => {
    expect(WorkoutFactory.getStrategy("CRESCENTE").constructor.name).toBe("CrescenteStrategy");
    expect(WorkoutFactory.getStrategy("PICO_CENTRAL").constructor.name).toBe("PicoCentralStrategy");
  });
  it("Workout encapsula profile", () => {
    const w = new Workout("MUSCULACAO_HEAVY");
    expect(w.type).toBe("MUSCULACAO_HEAVY");
    expect(w.profile.intensityCurve).toBe("CONSTANTE_ALTA");
  });
  it("CrescenteStrategy ordena por bpm", () => {
    const strat = WorkoutFactory.getStrategy("CRESCENTE");
    const sorted = strat.sort([{ estimatedBpm: 150, energyLevel: 3 }, { estimatedBpm: 120, energyLevel: 3 }]);
    expect(sorted[0].estimatedBpm).toBe(120);
  });
});
