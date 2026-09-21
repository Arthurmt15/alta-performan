import { GroqPlaylistResponseSchema, GROQ_JSON_SCHEMA } from "@/types/groq";
import { EXAMPLE_RESPONSE } from "@/services/groq/example";

describe("Groq JSON Schema", () => {
  it("valida EXAMPLE_RESPONSE", () => {
    const parsed = GroqPlaylistResponseSchema.parse(EXAMPLE_RESPONSE);
    expect(parsed.playlistName).toBe("Corrida Cardio - Ascensão Progressiva");
    expect(parsed.orderedQueue.length).toBe(7);
  });

  it("rejeita payload sem orderedQueue mínimo", () => {
    expect(() => GroqPlaylistResponseSchema.parse({ ...EXAMPLE_RESPONSE, orderedQueue: [] })).toThrow();
  });

  it("GROQ_JSON_SCHEMA strict true", () => {
    expect(GROQ_JSON_SCHEMA.json_schema.strict).toBe(true);
    expect(GROQ_JSON_SCHEMA.type).toBe("json_schema");
  });

  it("rejeita energyLevel fora de 1-5", () => {
    const bad = { ...EXAMPLE_RESPONSE, orderedQueue: [{ id: "a1", position: 1, reason: "x", energyLevel: 6, estimatedBpm: 120 }] };
    expect(() => GroqPlaylistResponseSchema.parse(bad)).toThrow();
  });
});
