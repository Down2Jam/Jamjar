import type { IconType } from "react-icons";
import {
  GiCargoCrate,
  GiBattleGear,
  GiBanjo,
  GiCampfire,
  GiCardRandom,
  GiCharacter,
  GiChemicalDrop,
  GiChessKnight,
  GiChecklist,
  GiClick,
  GiConsoleController,
  GiCrownedSkull,
  GiCrystalBall,
  GiCycle,
  GiCrossedSwords,
  GiCrosshair,
  GiDeadHead,
  GiDiceTwentyFacesTwenty,
  GiDramaMasks,
  GiDrum,
  GiFist,
  GiFilmSpool,
  GiCube,
  GiDividedSquare,
  GiFlatPlatform,
  GiGamepad,
  GiGears,
  GiGhost,
  GiGuitar,
  GiGuitarBassHead,
  GiHamburgerMenu,
  GiHeadphones,
  GiHeavenGate,
  GiHearts,
  GiHourglass,
  GiImpLaugh,
  GiJesterHat,
  GiLaurelCrown,
  GiLightningTrio,
  GiLoveSong,
  GiMagnifyingGlass,
  GiMaze,
  GiMegaphone,
  GiMeeple,
  GiMeepleGroup,
  GiMultipleTargets,
  GiMeditation,
  GiMeshBall,
  GiMicrophone,
  GiMoon,
  GiMusicalNotes,
  GiNightSleep,
  GiNotebook,
  GiPalette,
  GiPencilBrush,
  GiPencilRuler,
  GiPathDistance,
  GiPistolGun,
  GiPlatform,
  GiProgression,
  GiPhotoCamera,
  GiProcessor,
  GiPunchBlast,
  GiPuzzle,
  GiRaceCar,
  GiRadioTower,
  GiRetroController,
  GiSandCastle,
  GiSaxophone,
  GiScrollQuill,
  GiSportMedal,
  GiSparkles,
  GiSun,
  GiTearTracks,
  GiTombstone,
  GiTreasureMap,
  GiTrophyCup,
  GiViolin,
  GiVillage,
  GiVote,
  GiWindSlap,
  GiWorld,
  GiAlarmClock,
  GiElectric,
} from "react-icons/gi";

const TAG_ICONS: Record<string, string> = {
  "3dsmax": "3dsmax.svg",
  abletonlive: "abletonlive.svg",
  affinitydesigner: "affinitydesigner",
  appstore: "appstore",
  ardour: "ardour",
  aseprite: "aseprite",
  audacity: "audacity",
  bevy: "bevy",
  beepbox: "beepbox",
  bitsy: "bitsy",
  bitwigstudio: "bitwigstudio",
  blender: "blender",
  blockbench: "blockbench",
  boscaceoil: "boscaceoil",
  cakewalk: "cakewalk.svg",
  clickteam: "clickteam",
  clipstudiopaint: "clipstudiopaint",
  cocoscreator: "cocoscreator",
  construct3: "construct3",
  cryengine: "cryengine",
  cubase: "cubase.svg",
  defold: "defold",
  epicgamesstore: "epicgamesstore",
  famistudio: "famistudio",
  flickgame: "flickgame",
  flaxengine: "flaxengine",
  flstudio: "flstudio",
  furnacetracker: "furnacetracker",
  gamemaker: "gamemaker",
  gamejolt: "gamejolt",
  garageband: "garageband",
  gbstudio: "gbstudio",
  gdevelop: "gdevelop",
  geng: "geng.svg",
  gimp: "gimp.svg",
  gog: "gog.svg",
  godot: "godot.svg",
  godotengine: "godot.svg",
  googleplay: "googleplay",
  haxe: "haxe",
  haxeflixel: "haxeflixel",
  humblebundle: "humblebundle",
  illustrator: "illustrator.svg",
  inkscape: "inkscape.svg",
  itch: "itch",
  krita: "krita",
  libgdx: "libgdx.svg",
  libresprite: "libresprite",
  lmms: "lmms",
  logicpro: "logicpro",
  love2d: "love2d",
  magicavoxel: "magicavoxel",
  maya: "maya.svg",
  microsoftstore: "microsoftstore",
  monogame: "monogame",
  musescore: "musescore",
  newgrounds: "newgrounds",
  nintendoeshop: "nintendoeshop",
  o3de: "o3de",
  openmpt: "openmpt",
  open3dengine: "o3de",
  phaser: "phaser",
  photoshop: "photoshop",
  pico8: "pico8",
  pixelorama: "pixelorama",
  playcanvas: "playcanvas",
  playstationstore: "playstationstore",
  procreate: "procreate",
  protools: "protools.svg",
  puzzlescript: "puzzlescript",
  pygame: "pygame",
  raylib: "raylib",
  reason: "reason",
  reaper: "reaper",
  renpy: "renpy",
  renoise: "renoise",
  rpgmaker: "rpgmaker",
  rust: "rust.svg",
  scratch: "scratch",
  solar2d: "solar2d",
  steam: "steam",
  stencyl: "stencyl",
  studioone: "studioone",
  substancepainter: "substancepainter.svg",
  sunvox: "sunvox",
  stride: "stride",
  tic80: "tic80",
  twine: "twine",
  tyranobuilder: "tyranobuilder",
  unity: "unity",
  unreal: "unrealengine.svg",
  unrealengine: "unrealengine.svg",
  xboxstore: "xboxstore",
  zbrush: "zbrush.svg",
};

type GameIconDefinition = {
  icon: IconType;
  color: string;
};

const GAME_ICONS: Record<string, GameIconDefinition> = {
  "2d": { icon: GiFlatPlatform, color: "#38bdf8" },
  "3d": { icon: GiCube, color: "#a78bfa" },
  action: { icon: GiCrossedSwords, color: "#ef4444" },
  adventure: { icon: GiTreasureMap, color: "#d97706" },
  ambient: { icon: GiWindSlap, color: "#a78bfa" },
  battle: { icon: GiCrossedSwords, color: "#ef4444" },
  battleroyale: { icon: GiMultipleTargets, color: "#f97316" },
  beatemup: { icon: GiPunchBlast, color: "#dc2626" },
  boss: { icon: GiCrownedSkull, color: "#dc2626" },
  bulletheaven: { icon: GiHeavenGate, color: "#eab308" },
  bullethell: { icon: GiCrosshair, color: "#f43f5e" },
  cardgame: { icon: GiCardRandom, color: "#8b5cf6" },
  chiptune: { icon: GiConsoleController, color: "#22c55e" },
  classical: { icon: GiViolin, color: "#f59e0b" },
  orchestral: { icon: GiViolin, color: "#f59e0b" },
  hiphop: { icon: GiMicrophone, color: "#f97316" },
  horror: { icon: GiGhost, color: "#c084fc" },
  fighting: { icon: GiFist, color: "#ef4444" },
  idle: { icon: GiHourglass, color: "#a3a3a3" },
  incremental: { icon: GiProgression, color: "#22c55e" },
  jazz: { icon: GiSaxophone, color: "#eab308" },
  mmo: { icon: GiWorld, color: "#3b82f6" },
  multiplayer: { icon: GiMeepleGroup, color: "#06b6d4" },
  mystery: { icon: GiMagnifyingGlass, color: "#8b5cf6" },
  platformer: { icon: GiPlatform, color: "#06b6d4" },
  pointandclick: { icon: GiClick, color: "#0ea5e9" },
  puzzle: { icon: GiPuzzle, color: "#14b8a6" },
  racing: { icon: GiRaceCar, color: "#ef4444" },
  retro: { icon: GiRetroController, color: "#f59e0b" },
  rhythm: { icon: GiDrum, color: "#ec4899" },
  roguelike: { icon: GiMaze, color: "#a855f7" },
  roguelite: { icon: GiMaze, color: "#c084fc" },
  rock: { icon: GiGuitar, color: "#dc2626" },
  rpg: { icon: GiDiceTwentyFacesTwenty, color: "#8b5cf6" },
  rts: { icon: GiBattleGear, color: "#f97316" },
  sandbox: { icon: GiSandCastle, color: "#eab308" },
  shooter: { icon: GiPistolGun, color: "#f43f5e" },
  simulation: { icon: GiGears, color: "#64748b" },
  sports: { icon: GiSportMedal, color: "#22c55e" },
  strategy: { icon: GiChessKnight, color: "#64748b" },
  survival: { icon: GiCampfire, color: "#ea580c" },
  tbs: { icon: GiCycle, color: "#0ea5e9" },
  textbased: { icon: GiScrollQuill, color: "#d97706" },
  visualnovel: { icon: GiDramaMasks, color: "#ec4899" },
  calm: { icon: GiMeditation, color: "#38bdf8" },
  credits: { icon: GiScrollQuill, color: "#eab308" },
  cute: { icon: GiHearts, color: "#f472b6" },
  cutscene: { icon: GiFilmSpool, color: "#a78bfa" },
  relaxing: { icon: GiMeditation, color: "#38bdf8" },
  dark: { icon: GiMoon, color: "#818cf8" },
  dreamy: { icon: GiNightSleep, color: "#c084fc" },
  electronic: { icon: GiElectric, color: "#06b6d4" },
  energetic: { icon: GiLightningTrio, color: "#f97316" },
  experimental: { icon: GiChemicalDrop, color: "#84cc16" },
  exploration: { icon: GiPathDistance, color: "#22c55e" },
  folk: { icon: GiBanjo, color: "#d97706" },
  gameover: { icon: GiDeadHead, color: "#ef4444" },
  happy: { icon: GiSun, color: "#facc15" },
  lofi: { icon: GiHeadphones, color: "#8b5cf6" },
  metal: { icon: GiGuitarBassHead, color: "#9ca3af" },
  menu: { icon: GiHamburgerMenu, color: "#3b82f6" },
  mischevious: { icon: GiImpLaugh, color: "#f97316" },
  mysterious: { icon: GiCrystalBall, color: "#8b5cf6" },
  pop: { icon: GiLoveSong, color: "#ec4899" },
  sad: { icon: GiTearTracks, color: "#60a5fa" },
  tense: { icon: GiAlarmClock, color: "#ef4444" },
  town: { icon: GiVillage, color: "#d97706" },
  triumphant: { icon: GiLaurelCrown, color: "#eab308" },
  victory: { icon: GiTrophyCup, color: "#facc15" },
  uplifting: { icon: GiSun, color: "#facc15" },
  siteannouncement: { icon: GiMegaphone, color: "#f97316" },
  sitechangelog: { icon: GiChecklist, color: "#3b82f6" },
  imin: { icon: GiMeeple, color: "#22c55e" },
  introduction: { icon: GiCharacter, color: "#0ea5e9" },
  memes: { icon: GiJesterHat, color: "#ec4899" },
  postmortem: { icon: GiTombstone, color: "#8b5cf6" },
  stream: { icon: GiRadioTower, color: "#ef4444" },
  teamup: { icon: GiMeepleGroup, color: "#06b6d4" },
  themevote: { icon: GiVote, color: "#a855f7" },
  devlog: { icon: GiNotebook, color: "#0ea5e9" },
  gameassets: { icon: GiCargoCrate, color: "#d97706" },
  gamedesign: { icon: GiPencilRuler, color: "#f59e0b" },
  gamedev: { icon: GiGamepad, color: "#16a34a" },
  screenshotsaturday: { icon: GiPhotoCamera, color: "#d946ef" },
  art: { icon: GiPalette, color: "#ec4899" },
  digitalart: { icon: GiPencilBrush, color: "#0891b2" },
  glsl: { icon: GiProcessor, color: "#7c3aed" },
  lowpoly: { icon: GiMeshBall, color: "#2563eb" },
  pixelart: { icon: GiDividedSquare, color: "#ca8a04" },
  shaders: { icon: GiSparkles, color: "#ea580c" },
  music: { icon: GiMusicalNotes, color: "#9333ea" },
};

type TagIconFallback = "game" | "music" | "mood" | "use-case";

const FALLBACK_GAME_ICONS: Record<TagIconFallback, GameIconDefinition> = {
  game: { icon: GiGamepad, color: "#16a34a" },
  music: { icon: GiMusicalNotes, color: "#9333ea" },
  mood: { icon: GiSparkles, color: "#ea580c" },
  "use-case": { icon: GiChecklist, color: "#3b82f6" },
};

const LOCAL_TAG_ICONS: Record<string, string> = {
  d2jam: "/images/tags/d2jam.png",
};

function TagIcon({
  tag,
  fallback,
  size = 16,
}: {
  tag: string;
  fallback?: TagIconFallback;
  size?: number;
}) {
  const normalizedTag = tag.toLowerCase().replace(/[\s_-]+/g, "");
  const gameIcon = GAME_ICONS[normalizedTag];
  const fallbackIcon = fallback
    ? FALLBACK_GAME_ICONS[fallback]
    : undefined;
  const localIcon = LOCAL_TAG_ICONS[normalizedTag];
  const icon = TAG_ICONS[normalizedTag];

  if (gameIcon) {
    const GameIcon = gameIcon.icon;

    return (
      <GameIcon
        aria-hidden="true"
        className="shrink-0"
        color={gameIcon.color}
        size={size}
      />
    );
  }

  if (localIcon) {
    return (
      <img
        src={localIcon}
        alt=""
        aria-hidden="true"
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  if (!icon) {
    if (!fallbackIcon) return null;

    const FallbackIcon = fallbackIcon.icon;
    return (
      <FallbackIcon
        aria-hidden="true"
        className="shrink-0"
        color={fallbackIcon.color}
        size={size}
      />
    );
  }

  const filename = icon.includes(".") ? icon : `${icon}.png`;

  return (
    <img
      src={`/images/tag-icons/${filename}`}
      alt=""
      aria-hidden="true"
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

export default function TagLabel({
  name,
  label,
  iconOnly = false,
  fallback,
  size = 16,
}: {
  name: string;
  label?: string;
  iconOnly?: boolean;
  fallback?: TagIconFallback;
  size?: number;
}) {
  const normalizedTag = name.toLowerCase().replace(/[\s_-]+/g, "");
  const hasIcon = Boolean(
    GAME_ICONS[normalizedTag] ||
      LOCAL_TAG_ICONS[normalizedTag] ||
      TAG_ICONS[normalizedTag] ||
      fallback,
  );

  if (iconOnly) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
        aria-label={name}
      >
        {hasIcon ? (
          <TagIcon tag={name} fallback={fallback} size={size} />
        ) : (
          <span className="text-[10px] font-semibold uppercase leading-none">
            {name.slice(0, 1)}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <TagIcon tag={name} fallback={fallback} size={size} />
      <span>{label ?? name}</span>
    </span>
  );
}
