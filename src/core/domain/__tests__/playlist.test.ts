import { Track } from "../entities/Track";
import { Playlist } from "../entities/Playlist";

const mkTrack = (id: string, dur = 180) =>
  new Track({ id, filepath: `file://${id}.mp3`, title: id, artist: "A", album: "", duration: dur, extension: "mp3", dateAdded: Date.now() });

describe("Playlist OOP", () => {
  it("addTrack ordena e calcula duração", () => {
    const pl = new Playlist("p1", "Teste", "CORRIDA_CARDIO", "CRESCENTE");
    pl.addTrack(mkTrack("t2", 200), 2);
    pl.addTrack(mkTrack("t1", 100), 1);
    expect(pl.tracks[0].track.id).toBe("t1");
    expect(pl.getTotalDuration()).toBe(300);
  });
  it("rejeita duplicata", () => {
    const pl = new Playlist("p1", "Teste", "CORRIDA_CARDIO", "CRESCENTE");
    const t = mkTrack("t1");
    pl.addTrack(t, 1);
    expect(() => pl.addTrack(t, 2)).toThrow();
  });
  it("fromGroqResponse cria playlist", () => {
    const tracks = [mkTrack("a1"), mkTrack("a2")];
    const resp: any = {
      workoutType: "CORRIDA_CARDIO",
      playlistName: "Cardio",
      curve: "CRESCENTE",
      orderedQueue: [
        { id: "a1", position: 1, reason: "ok", energyLevel: 3, estimatedBpm: 120 },
        { id: "a2", position: 2, reason: "ok", energyLevel: 4, estimatedBpm: 130 },
      ],
    };
    const pl = Playlist.fromGroqResponse(resp, tracks);
    expect(pl.tracks.length).toBe(2);
  });
});
