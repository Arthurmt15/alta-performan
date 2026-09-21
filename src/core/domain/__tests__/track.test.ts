import { Track } from "../entities/Track";

const meta = {
  id: "1",
  filepath: "file://a.mp3",
  title: "HUMBLE.",
  artist: "Kendrick",
  album: "DAMN.",
  duration: 177,
  genre: "Hip-Hop",
  extension: "mp3" as const,
  dateAdded: Date.now(),
};

describe("Track OOP", () => {
  it("encapsula e expõe getters", () => {
    const t = new Track(meta);
    expect(t.id).toBe("1");
    expect(t.getDisplayName()).toBe("Kendrick - HUMBLE.");
  });
  it("formata duração", () => {
    const t = new Track({ ...meta, duration: 125 });
    expect(t.getDurationFormatted()).toBe("2:05");
  });
  it("enrich atualiza gênero", () => {
    const t = new Track(meta);
    t.enrich({ genre: "Trap", thumb: "url" });
    expect(t.genre).toBe("Trap");
    expect(t.thumb).toBe("url");
  });
  it("toGroqPayload limita tamanhos", () => {
    const t = new Track({ ...meta, title: "a".repeat(100) });
    expect(t.toGroqPayload().title.length).toBe(60);
  });
});
