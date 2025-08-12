"use client";

import React, { forwardRef } from "react";
import type { LucideProps, LucideIcon } from "lucide-react";
import {
  ALargeSmall,
  Ban,
  Banana,
  Book,
  Bug,
  Calendar,
  CircleDotDashed,
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
  Infinity,
  Lightbulb,
  Map,
  Maximize2,
  MicVocal,
  Minimize2,
  Moon,
  Music,
  Paintbrush,
  Palette,
  Pause,
  Pill,
  Play,
  Rat,
  RefreshCwOff,
  Repeat,
  Shell,
  SkipBack,
  SkipForward,
  Slice,
  SquareDashed,
  Star,
  Syringe,
  Trophy,
  User,
  Users,
  Volume2,
  Waves,
} from "lucide-react";
import { useTheme } from "@/providers/SiteThemeProvider";

const iconMap = {
  alargesmall: ALargeSmall,
  ban: Ban,
  banana: Banana,
  book: Book,
  bug: Bug,
  calendar: Calendar,
  circledotdashed: CircleDotDashed,
  circlehelp: CircleHelp,
  cloudy: Cloudy,
  code: Code,
  droplet: Droplet,
  fan: Fan,
  filecode: FileCode,
  flame: Flame,
  gamepad: Gamepad,
  gamepad2: Gamepad2,
  hammer: Hammer,
  headphones: Headphones,
  infinity: Infinity,
  lightbulb: Lightbulb,
  map: Map,
  maximize2: Maximize2,
  micvocal: MicVocal,
  minimize2: Minimize2,
  moon: Moon,
  music: Music,
  paintbrush: Paintbrush,
  palette: Palette,
  pause: Pause,
  pill: Pill,
  play: Play,
  rat: Rat,
  refreshcwoff: RefreshCwOff,
  repeat: Repeat,
  shell: Shell,
  skipback: SkipBack,
  skipforward: SkipForward,
  slice: Slice,
  star: Star,
  squaredashed: SquareDashed,
  syringe: Syringe,
  trophy: Trophy,
  user: User,
  users: Users,
  volume2: Volume2,
  waves: Waves,
} as const satisfies Record<string, LucideIcon>;

type IconName = keyof typeof iconMap;
type Color = "text" | "textFaded";

export interface IconProps extends Omit<LucideProps, "color" | "size"> {
  name?: IconName;
  size?: number;
  color?: Color;
}

const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name = "circlehelp", size = 24, color = "text", ...rest },
  ref
) {
  const { colors } = useTheme();

  const IconComponent: LucideIcon = iconMap[name];

  return (
    <IconComponent ref={ref} size={size} color={colors[color]} {...rest} />
  );
});

export default Icon;
