import { searchTrack } from "../theaudiodb";

// Mock fetch global
global.fetch = jest.fn();

describe("TheAudioDB", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna null para artista Desconhecido (sem chamada)", async () => {
    const r = await searchTrack("Desconhecido", "Track");
    expect(r).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("parseia resposta track corretamente", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        track: [
          {
            strArtist: "Kendrick Lamar",
            strTrack: "HUMBLE.",
            strAlbum: "DAMN.",
            strGenre: "Hip-Hop",
            strMood: "Energetic",
            strTrackThumb: "https://thumb.jpg",
            intYearReleased: "2017",
          },
        ],
      }),
    });
    const r = await searchTrack("Kendrick Lamar", "HUMBLE.");
    expect(r?.genre).toBe("Hip-Hop");
    expect(r?.thumb).toBe("https://thumb.jpg");
  });
});
