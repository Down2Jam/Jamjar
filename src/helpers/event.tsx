import {
  Calendar,
  Code,
  FileCode,
  Gamepad2,
  Palette,
  Trophy,
} from "lucide-react";

export function getIcon(icon: string = "event") {
  switch (icon) {
    case "gamedev":
      return <Code size={16} />;
    case "art":
      return <Palette size={16} />;
    case "webdev":
      return <FileCode size={16} />;
    case "tournament":
      return <Trophy size={16} />;
    case "games":
      return <Gamepad2 size={16} />;
    default:
      return <Calendar size={16} />;
  }
}
