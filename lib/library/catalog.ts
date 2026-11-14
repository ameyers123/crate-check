/**
 * The demo catalog: 43 widely-known dance records.
 *
 * `bpm`, `genre`, `vibe`, `function`, `danceability` and `vocal` are carried
 * verbatim from a real audio-analysis pass over a 3,000-track library — they
 * are measured and derived, not invented.
 *
 * `key`, `familiarity`, `vocalDetail`, `intro` and `outro` are assigned here.
 * Key especially: the analysis pass didn't extract key, so the Camelot values
 * below are **illustrative** — chosen to give the harmonic-mixing views a
 * realistic spread, not transcribed from the records. The UI says so.
 */

import type { Familiarity, IntroType, OutroType, VocalDetail } from "./types";

export interface CatalogRow {
  artist: string;
  title: string;
  /** Measured. */
  bpm: number;
  /** Derived by the real analysis pass. */
  genre: string[];
  vibe: string[];
  function: string[];
  danceability: number;
  vocal: "voice" | "instrumental";
  /** Assigned below — illustrative. */
  key: string;
  familiarity: Familiarity;
  vocalDetail: VocalDetail;
  intro: IntroType;
  outro: OutroType;
}

export const CATALOG: CatalogRow[] = [
  // ---- Opening / warm-up material ----
  { artist: "Polo & Pan", title: "Feel Good (Original Mix)", bpm: 96.2, genre: ["Tropical / Sunset House"], vibe: ["Relaxed"], function: ["Instrumental", "Warm-up"], danceability: 0.885, vocal: "instrumental", key: "9B", familiarity: "known", vocalDetail: "none", intro: "beatless", outro: "fade" },
  { artist: "Disclosure ft. Lorde", title: "Magnets (Radio Edit)", bpm: 92.0, genre: ["Tropical / Sunset House", "Pop / Open Format"], vibe: ["Relaxed"], function: ["Vocal", "Warm-up"], danceability: 0.989, vocal: "voice", key: "4A", familiarity: "anthem", vocalDetail: "female", intro: "short", outro: "fade" },
  { artist: "KAYTRANADA/SiR", title: "Go DJ (feat. SiR)", bpm: 104.0, genre: ["Hip-Hop / Rap"], vibe: ["Relaxed"], function: ["Vocal"], danceability: 0.999, vocal: "voice", key: "11A", familiarity: "known", vocalDetail: "male", intro: "short", outro: "fade" },
  { artist: "Polo & Pan", title: "Magic", bpm: 110.7, genre: ["Deep House", "Tropical / Sunset House"], vibe: ["Relaxed", "Emotional"], function: ["Instrumental", "Warm-up"], danceability: 0.976, vocal: "instrumental", key: "10B", familiarity: "known", vocalDetail: "none", intro: "beatless", outro: "clean" },
  { artist: "JUNGLE.", title: "Keep Moving", bpm: 111.5, genre: ["Disco / Nu-Disco"], vibe: ["Relaxed", "Happy", "Groovy"], function: ["Vocal", "Warm-up"], danceability: 0.94, vocal: "voice", key: "7B", familiarity: "anthem", vocalDetail: "male", intro: "short", outro: "fade" },
  { artist: "SG Lewis", title: "Chemicals", bpm: 114.0, genre: ["Disco / Nu-Disco"], vibe: ["Relaxed"], function: ["Vocal", "Warm-up"], danceability: 0.998, vocal: "voice", key: "8B", familiarity: "known", vocalDetail: "male", intro: "short", outro: "clean" },
  { artist: "Jungle/Channel Tres", title: "I've Been In Love", bpm: 115.0, genre: ["Disco / Nu-Disco"], vibe: ["Relaxed", "Happy"], function: ["Vocal", "Warm-up"], danceability: 0.941, vocal: "voice", key: "9B", familiarity: "known", vocalDetail: "male", intro: "short", outro: "fade" },
  { artist: "Rufus Du Sol", title: "Underwater (Club Version)", bpm: 118.0, genre: ["Deep House", "Melodic House & Techno"], vibe: ["Relaxed", "Hypnotic"], function: ["Instrumental", "Warm-up", "Afterhours"], danceability: 0.998, vocal: "instrumental", key: "6A", familiarity: "known", vocalDetail: "none", intro: "long mixable", outro: "clean" },
  { artist: "CAMELPHAT", title: "Waiting (feat. Eli & Fur)", bpm: 119.9, genre: ["Deep House", "Melodic House & Techno"], vibe: ["Relaxed", "Hypnotic"], function: ["Instrumental", "Warm-up", "Afterhours"], danceability: 0.986, vocal: "instrumental", key: "7A", familiarity: "known", vocalDetail: "female", intro: "long mixable", outro: "clean" },
  { artist: "CamelPhat & Elderbrook", title: "Cola (Original Mix)", bpm: 122.0, genre: ["Deep House", "Tech House"], vibe: [], function: ["Instrumental", "Warm-up"], danceability: 0.995, vocal: "instrumental", key: "8A", familiarity: "anthem", vocalDetail: "male", intro: "long mixable", outro: "clean" },
  { artist: "Carlita/SG Lewis", title: "The Moment", bpm: 123.0, genre: ["Deep House", "Melodic House & Techno"], vibe: ["Relaxed"], function: ["Instrumental", "Warm-up"], danceability: 0.999, vocal: "instrumental", key: "9A", familiarity: "deep cut", vocalDetail: "none", intro: "long mixable", outro: "clean" },
  { artist: "Masšh/Adam Port/Keinemusik", title: "All I Got", bpm: 121.0, genre: ["Deep House", "Melodic House & Techno", "Tropical / Sunset House"], vibe: ["Relaxed"], function: ["Instrumental", "Warm-up"], danceability: 0.999, vocal: "instrumental", key: "5A", familiarity: "known", vocalDetail: "none", intro: "long mixable", outro: "clean" },

  // ---- After-hours / hypnotic ----
  { artist: "Justice/Tame Impala/Rampa/Keinemusik", title: "Neverender - Rampa Remix", bpm: 120.0, genre: ["Deep House", "Melodic House & Techno"], vibe: ["Relaxed", "Hypnotic"], function: ["Instrumental", "Afterhours"], danceability: 0.998, vocal: "instrumental", key: "6A", familiarity: "known", vocalDetail: "male", intro: "long mixable", outro: "clean" },
  { artist: "&ME/Keinemusik", title: "L.I.F.E", bpm: 120.0, genre: ["Deep House", "Tech House", "Melodic House & Techno"], vibe: ["Relaxed", "Hypnotic"], function: ["Instrumental", "Warm-up", "Afterhours"], danceability: 1.0, vocal: "instrumental", key: "5A", familiarity: "known", vocalDetail: "none", intro: "long mixable", outro: "clean" },
  { artist: "&ME/Black Coffee/Keinemusik", title: "The Rapture Pt.III", bpm: 120.0, genre: ["Deep House", "Tech House", "Melodic House & Techno"], vibe: ["Relaxed", "Hypnotic"], function: ["Instrumental", "Warm-up", "Afterhours"], danceability: 0.996, vocal: "instrumental", key: "4A", familiarity: "anthem", vocalDetail: "none", intro: "long mixable", outro: "clean" },
  { artist: "Disclosure", title: "Ce n'est pas (Axel Boman Remix)", bpm: 122.0, genre: ["Deep House", "Tech House", "Melodic House & Techno"], vibe: ["Relaxed", "Hypnotic"], function: ["Instrumental", "Warm-up", "Afterhours"], danceability: 0.991, vocal: "instrumental", key: "3A", familiarity: "deep cut", vocalDetail: "none", intro: "long mixable", outro: "clean" },
  { artist: "Au/Ra & CamelPhat", title: "Panic Room (Camelphat Remix)", bpm: 123.0, genre: ["Melodic House & Techno"], vibe: ["Relaxed", "Hypnotic"], function: ["Instrumental", "Afterhours"], danceability: 0.998, vocal: "instrumental", key: "2A", familiarity: "known", vocalDetail: "female", intro: "long mixable", outro: "clean" },
  { artist: "Christian James", title: "Helio 2.0", bpm: 121.0, genre: ["Deep House", "Tech House"], vibe: ["Hypnotic"], function: ["Instrumental", "Afterhours"], danceability: 0.986, vocal: "instrumental", key: "3A", familiarity: "deep cut", vocalDetail: "none", intro: "long mixable", outro: "clean" },
  { artist: "Bob Moses, ZHU, Solomun", title: "Desire (Solomun Remix)", bpm: 120.0, genre: ["Techno", "Melodic House & Techno"], vibe: ["Hypnotic"], function: ["Instrumental"], danceability: 0.991, vocal: "instrumental", key: "11A", familiarity: "known", vocalDetail: "male", intro: "long mixable", outro: "clean" },

  // ---- Driving ----
  { artist: "Fisher", title: "Freaks (Extended Mix)", bpm: 124.0, genre: ["House", "Bass House"], vibe: [], function: ["Instrumental", "Driving"], danceability: 0.998, vocal: "instrumental", key: "8A", familiarity: "anthem", vocalDetail: "spoken", intro: "long mixable", outro: "clean" },
  { artist: "Maceo Plex", title: "Cinemax", bpm: 124.0, genre: ["Melodic House & Techno"], vibe: [], function: ["Instrumental", "Driving"], danceability: 0.984, vocal: "instrumental", key: "7A", familiarity: "known", vocalDetail: "none", intro: "long mixable", outro: "clean" },
  { artist: "Kerri Chandler/Dreamer G", title: "Hurry Up - Kerri's Again Mix", bpm: 124.0, genre: ["Deep House"], vibe: [], function: ["Instrumental", "Driving"], danceability: 1.0, vocal: "instrumental", key: "9A", familiarity: "deep cut", vocalDetail: "none", intro: "long mixable", outro: "clean" },
  { artist: "Barry Can't Swim, SBTRKT", title: "Different - SBTRKT Sirens Remix", bpm: 128.0, genre: ["House"], vibe: [], function: ["Vocal", "Driving"], danceability: 0.984, vocal: "voice", key: "10A", familiarity: "deep cut", vocalDetail: "chopped", intro: "long mixable", outro: "clean" },
  { artist: "Kaskade, Skrillex", title: "Lick It", bpm: 128.5, genre: ["House"], vibe: ["Aggressive", "Dark"], function: ["Instrumental", "Driving"], danceability: 0.969, vocal: "instrumental", key: "11A", familiarity: "known", vocalDetail: "spoken", intro: "short", outro: "clean" },
  { artist: "Barry Can't Swim", title: "Still Riding", bpm: 133.0, genre: ["Techno"], vibe: ["Hypnotic"], function: ["Vocal", "Driving"], danceability: 0.999, vocal: "voice", key: "12A", familiarity: "known", vocalDetail: "chopped", intro: "long mixable", outro: "clean" },

  // ---- Peak ----
  { artist: "Fisher", title: "You Little Beauty (Extended Mix)", bpm: 124.0, genre: ["Deep House"], vibe: ["Party"], function: ["Instrumental", "Peak", "Driving"], danceability: 1.0, vocal: "instrumental", key: "8A", familiarity: "anthem", vocalDetail: "chopped", intro: "long mixable", outro: "clean" },
  { artist: "Chris Lake & Green Velvet", title: "Deceiver (Extended Mix)", bpm: 124.0, genre: ["Bass House"], vibe: ["Party"], function: ["Vocal", "Peak", "Driving"], danceability: 1.0, vocal: "voice", key: "9A", familiarity: "anthem", vocalDetail: "spoken", intro: "long mixable", outro: "clean" },
  { artist: "Chris Lake", title: "Stay With Me (Extended Mix)", bpm: 124.0, genre: ["House", "Bass House"], vibe: ["Party"], function: ["Vocal", "Peak", "Driving"], danceability: 1.0, vocal: "voice", key: "7A", familiarity: "known", vocalDetail: "female", intro: "long mixable", outro: "clean" },
  { artist: "Elderbrook/Claude VonStroke", title: "Capricorn - Claude VonStroke Remix", bpm: 124.0, genre: ["Tech House"], vibe: ["Party", "Hypnotic"], function: ["Instrumental", "Peak", "Driving"], danceability: 0.999, vocal: "instrumental", key: "8A", familiarity: "known", vocalDetail: "none", intro: "long mixable", outro: "clean" },
  { artist: "Chris Lake & Lee Foss", title: "Lies, Deception, And Fantasy", bpm: 124.0, genre: ["House"], vibe: ["Party"], function: ["Vocal", "Peak", "Driving"], danceability: 1.0, vocal: "voice", key: "6A", familiarity: "known", vocalDetail: "female", intro: "long mixable", outro: "clean" },
  { artist: "Notre Dame", title: "Haunted Nights", bpm: 124.0, genre: ["Tech House", "Melodic House & Techno"], vibe: ["Party"], function: ["Vocal", "Peak", "Driving"], danceability: 0.999, vocal: "voice", key: "10A", familiarity: "deep cut", vocalDetail: "chopped", intro: "long mixable", outro: "clean" },
  { artist: "Chris Lake & Destructo", title: "Y.O.D.O. (Original Mix)", bpm: 123.6, genre: ["House", "Techno"], vibe: ["Party"], function: ["Instrumental", "Peak"], danceability: 1.0, vocal: "instrumental", key: "5A", familiarity: "known", vocalDetail: "spoken", intro: "long mixable", outro: "clean" },
  { artist: "Chris Lake", title: "I Want You (Original Mix)", bpm: 123.6, genre: ["House", "Bass House"], vibe: ["Party"], function: ["Vocal", "Peak"], danceability: 1.0, vocal: "voice", key: "4A", familiarity: "known", vocalDetail: "female", intro: "long mixable", outro: "clean" },
  { artist: "Dom Dolla, Mary J Blige", title: "Pump the Brakes / Family Affair (Mashup)", bpm: 123.6, genre: ["House", "Bass House"], vibe: ["Party"], function: ["Vocal", "Peak"], danceability: 1.0, vocal: "voice", key: "3A", familiarity: "anthem", vocalDetail: "female", intro: "short", outro: "clean" },
  { artist: "Chris Lake/Aatig", title: "In The Yuma (feat. Aatig)", bpm: 123.8, genre: ["House", "Bass House"], vibe: ["Party", "Hypnotic"], function: ["Vocal", "Peak"], danceability: 0.999, vocal: "voice", key: "9A", familiarity: "known", vocalDetail: "male", intro: "long mixable", outro: "clean" },
  { artist: "Tinlicker", title: "All That I Lost", bpm: 123.7, genre: ["Melodic House & Techno"], vibe: ["Party", "Relaxed", "Hypnotic"], function: ["Instrumental", "Peak"], danceability: 0.999, vocal: "instrumental", key: "2A", familiarity: "deep cut", vocalDetail: "female", intro: "long mixable", outro: "clean" },
  { artist: "CamelPhat/Ali Love", title: "Compute", bpm: 122.1, genre: ["Melodic House & Techno"], vibe: ["Party"], function: ["Instrumental", "Peak"], danceability: 0.999, vocal: "instrumental", key: "1A", familiarity: "known", vocalDetail: "male", intro: "long mixable", outro: "clean" },
  { artist: "Kaz James", title: "Flip Club", bpm: 123.0, genre: ["Melodic House & Techno"], vibe: ["Party"], function: ["Instrumental", "Peak"], danceability: 1.0, vocal: "instrumental", key: "12A", familiarity: "deep cut", vocalDetail: "none", intro: "long mixable", outro: "clean" },
  { artist: "Chris Lake & Solardo", title: "Free Your Body (Extended Mix)", bpm: 125.0, genre: ["Tech House", "Techno"], vibe: ["Party"], function: ["Instrumental", "Peak", "Driving"], danceability: 1.0, vocal: "instrumental", key: "10A", familiarity: "known", vocalDetail: "spoken", intro: "long mixable", outro: "clean" },
  { artist: "Chris Lake ft. Dances With White Girls", title: "Operator (Extended Mix)", bpm: 125.0, genre: ["House"], vibe: ["Party"], function: ["Vocal", "Peak", "Driving"], danceability: 0.999, vocal: "voice", key: "11A", familiarity: "known", vocalDetail: "female", intro: "long mixable", outro: "clean" },
  { artist: "Chris Lake, Riva Starr, lau.ra", title: "Beat Freak (Extended Mix)", bpm: 126.0, genre: ["Bass House"], vibe: ["Party", "Aggressive"], function: ["Vocal", "Peak", "Driving"], danceability: 1.0, vocal: "voice", key: "12A", familiarity: "known", vocalDetail: "female", intro: "long mixable", outro: "clean" },
  { artist: "Peggy Gou", title: "Find The Way", bpm: 131.0, genre: ["House"], vibe: ["Party", "Happy"], function: ["Vocal", "Peak", "Driving"], danceability: 1.0, vocal: "voice", key: "1A", familiarity: "anthem", vocalDetail: "female", intro: "short", outro: "clean" },
  { artist: "Fred again../Anderson .Paak/CHIKA", title: "places to be", bpm: 87.0, genre: ["Bass House", "Drum & Bass"], vibe: ["Party"], function: ["Vocal", "Peak"], danceability: 0.999, vocal: "voice", key: "2A", familiarity: "anthem", vocalDetail: "male", intro: "short", outro: "fade" },
];
