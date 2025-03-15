import {
  Book,
  Calendar,
  CircleHelp,
  Code,
  FileCode,
  Flame,
  Gamepad,
  Gamepad2,
  Hammer,
  Headphones,
  Map,
  MicVocal,
  Music,
  Paintbrush,
  Palette,
  Trophy,
  Users,
} from "lucide-react";

export function getIcon(icon: string = "event", size: number = 24) {
  switch (icon) {
    case "book":
      return <Book size={size} />;
    case "calendar":
      return <Calendar size={size} />;
    case "code":
      return <Code size={size} />;
    case "filecode":
      return <FileCode size={size} />;
    case "flame":
      return <Flame size={size} />;
    case "gamepad":
      return <Gamepad size={size} />;
    case "gamepad2":
      return <Gamepad2 size={size} />;
    case "hammer":
      return <Hammer size={size} />;
    case "headphones":
      return <Headphones size={size} />;
    case "map":
      return <Map size={size} />;
    case "micvocal":
      return <MicVocal size={size} />;
    case "music":
      return <Music size={size} />;
    case "paintbrush":
      return <Paintbrush size={size} />;
    case "palette":
      return <Palette size={size} />;
    case "trophy":
      return <Trophy size={size} />;
    case "users":
      return <Users size={size} />;
    default:
      return <CircleHelp size={size} />;
  }
}
