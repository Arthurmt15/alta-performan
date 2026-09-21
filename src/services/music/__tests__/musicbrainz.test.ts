global.fetch = jest.fn();

import { searchRecording } from "../musicbrainz";

describe("MusicBrainz", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna null se sem resultados", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ recordings: [] }),
    });
    const r = await searchRecording("Inexistente", "Nobody");
    expect(r).toBeNull();
  });

  it("parseia recording com tags", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        recordings: [
          {
            id: "mbid-123",
            title: "HUMBLE.",
            "artist-credit": [{ name: "Kendrick Lamar" }],
            releases: [{ title: "DAMN." }],
            "first-release-date": "2017-04-14",
            tags: [{ name: "hip hop" }, { name: "trap" }],
            score: 100,
          },
        ],
      }),
    });
    const r = await searchRecording("HUMBLE.", "Kendrick Lamar");
    expect(r?.mbid).toBe("mbid-123");
    expect(r?.year).toBe("2017");
    expect(r?.tags).toContain("hip hop");
  });
});
