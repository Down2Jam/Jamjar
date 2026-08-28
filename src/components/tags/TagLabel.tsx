import type { IconType } from "react-icons";
import {
  GiCargoCrate,
  GiCharacter,
  GiChecklist,
  GiDividedSquare,
  GiGamepad,
  GiJesterHat,
  GiMegaphone,
  GiMeeple,
  GiMeepleGroup,
  GiMeshBall,
  GiMusicalNotes,
  GiNotebook,
  GiPalette,
  GiPencilBrush,
  GiPencilRuler,
  GiPhotoCamera,
  GiProcessor,
  GiRadioTower,
  GiSparkles,
  GiTombstone,
  GiVote,
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

const LOCAL_TAG_ICONS: Record<string, string> = {
  d2jam: "/images/tags/d2jam.png",
};

function TagIcon({ tag }: { tag: string }) {
  const normalizedTag = tag.toLowerCase().replace(/[\s_-]+/g, "");
  const gameIcon = GAME_ICONS[normalizedTag];
  const localIcon = LOCAL_TAG_ICONS[normalizedTag];
  const icon = TAG_ICONS[normalizedTag];

  if (gameIcon) {
    const GameIcon = gameIcon.icon;

    return (
      <GameIcon
        aria-hidden="true"
        className="h-4 w-4 shrink-0"
        color={gameIcon.color}
      />
    );
  }

  if (localIcon) {
    return (
      <img
        src={localIcon}
        alt=""
        aria-hidden="true"
        className="h-4 w-4 shrink-0 object-contain"
      />
    );
  }

  if (!icon) return null;

  const filename = icon.includes(".") ? icon : `${icon}.png`;

  return (
    <img
      src={`/images/tag-icons/${filename}`}
      alt=""
      aria-hidden="true"
      className="h-4 w-4 shrink-0 object-contain"
    />
  );
}

export default function TagLabel({
  name,
  label,
  iconOnly = false,
}: {
  name: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const normalizedTag = name.toLowerCase().replace(/[\s_-]+/g, "");
  const hasIcon = Boolean(
    GAME_ICONS[normalizedTag] ||
      LOCAL_TAG_ICONS[normalizedTag] ||
      TAG_ICONS[normalizedTag],
  );

  if (iconOnly) {
    return (
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
        aria-label={name}
      >
        {hasIcon ? (
          <TagIcon tag={name} />
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
      <TagIcon tag={name} />
      <span>{label ?? name}</span>
    </span>
  );
}
