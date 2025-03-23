import {
  ALargeSmall,
  Ban,
  Banana,
  Book,
  Bug,
  Calendar,
  CircleHelp,
  Cloudy,
  Code,
  Droplet,
  Fan,
  FileCode,
  Flame,
  Gamepad,
  Gamepad2,
  Hammer,
  Headphones,
  Lightbulb,
  Map,
  MicVocal,
  Moon,
  Music,
  Paintbrush,
  Palette,
  Pill,
  Rat,
  Shell,
  Slice,
  SquareDashed,
  Syringe,
  Trophy,
  User,
  Users,
  Volume2,
  Waves,
} from "lucide-react";

export function getIcon(icon: string = "event", size: number = 24) {
  switch (icon) {
    case "alargesmall":
      return <ALargeSmall size={size} />;
    case "ban":
      return <Ban size={size} />;
    case "banana":
      return <Banana size={size} />;
    case "book":
      return <Book size={size} />;
    case "bug":
      return <Bug size={size} />;
    case "calendar":
      return <Calendar size={size} />;
    case "circledotdashed":
      return <Calendar size={size} />;
    case "cloudy":
      return <Cloudy size={size} />;
    case "code":
      return <Code size={size} />;
    case "droplet":
      return <Droplet size={size} />;
    case "fan":
      return <Fan size={size} />;
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
    case "lightbulb":
      return <Lightbulb size={size} />;
    case "map":
      return <Map size={size} />;
    case "micvocal":
      return <MicVocal size={size} />;
    case "moon":
      return <Moon size={size} />;
    case "music":
      return <Music size={size} />;
    case "paintbrush":
      return <Paintbrush size={size} />;
    case "palette":
      return <Palette size={size} />;
    case "pill":
      return <Pill size={size} />;
    case "rat":
      return <Rat size={size} />;
    case "shell":
      return <Shell size={size} />;
    case "slice":
      return <Slice size={size} />;
    case "squaredashed":
      return <SquareDashed size={size} />;
    case "syringe":
      return <Syringe size={size} />;
    case "trophy":
      return <Trophy size={size} />;
    case "user":
      return <User size={size} />;
    case "users":
      return <Users size={size} />;
    case "volume2":
      return <Volume2 size={size} />;
    case "waves":
      return <Waves size={size} />;
    default:
      return <CircleHelp size={size} />;
  }
}
