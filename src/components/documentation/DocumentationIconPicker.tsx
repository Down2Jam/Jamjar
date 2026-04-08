"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Hstack, Icon, Input, Popover, Text, type IconName } from "bioloom-ui";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const ICON_NAMES: IconName[] = [
  "alargesmall",
  "apple",
  "arrowleft",
  "arrowright",
  "arrowupright",
  "award",
  "ban",
  "banana",
  "bell",
  "book",
  "bookcopy",
  "broadcast",
  "bug",
  "calendar",
  "calendar1",
  "calendararrowdown",
  "calendarcog",
  "calendardays",
  "calendarfold",
  "calendarplus",
  "calendarrange",
  "check",
  "chevrondown",
  "chevronleft",
  "chevronright",
  "chevronup",
  "chevronsdown",
  "chevronsleft",
  "chevronsright",
  "circlealert",
  "circledotdashed",
  "circlehelp",
  "circlestar",
  "clipboard",
  "clock",
  "clock1",
  "clock2",
  "clock3",
  "clock4",
  "clockarrowup",
  "clockarrowdown",
  "cloudy",
  "code",
  "code2",
  "cog",
  "dice3",
  "download",
  "droplet",
  "ellipsis",
  "eraser",
  "externalLink",
  "eye",
  "fan",
  "filecode",
  "fileplus2",
  "flame",
  "gamepad",
  "gamepad2",
  "globe",
  "grid2x2",
  "hammer",
  "headphones",
  "headset",
  "heart",
  "home",
  "hourglass",
  "images",
  "inbox",
  "infinity",
  "info",
  "keyboard",
  "landplot",
  "layers",
  "lightbulb",
  "linechart",
  "link",
  "login",
  "logout",
  "map",
  "maximize2",
  "menu",
  "messagecircle",
  "messagessquare",
  "monitor",
  "mouse",
  "move3d",
  "micvocal",
  "minimize2",
  "minus",
  "moon",
  "morehorizontal",
  "moveupright",
  "music",
  "newspaper",
  "paintbrush",
  "palette",
  "pause",
  "pencil",
  "pill",
  "play",
  "plus",
  "rabbit",
  "rat",
  "refreshcwoff",
  "repeat",
  "reply",
  "rotateccw",
  "rss",
  "save",
  "scale",
  "search",
  "send",
  "settings",
  "settings2",
  "shell",
  "shield",
  "shieldalert",
  "shieldx",
  "skipback",
  "skipforward",
  "slice",
  "smileplus",
  "smartphone",
  "sparkles",
  "sprout",
  "squaredashed",
  "squarepen",
  "star",
  "staroff",
  "swords",
  "syringe",
  "tags",
  "terminal",
  "thumbsup",
  "touchpad",
  "trainfront",
  "trash",
  "trash2",
  "treedeciduous",
  "trophy",
  "turtle",
  "upload",
  "user",
  "userplus",
  "userx",
  "users",
  "users2",
  "volume2",
  "vote",
  "waves",
  "x",
  "zoomout",
  "sibluesky",
  "sidiscord",
  "siforgejo",
  "sigithub",
  "siinstagram",
  "sitwitch",
  "siyoutube",
  "silinux",
  "sihtml5",
  "custommacos",
];

function normalizeIconName(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export default function DocumentationIconPicker({
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selectedIcon = (value || "book") as IconName;

  useEffect(() => {
    if (!open) return;

    const handleDown = (event: MouseEvent) => {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDown, true);
    return () => {
      document.removeEventListener("mousedown", handleDown, true);
    };
  }, [open]);

  const filteredIcons = useMemo(() => {
    const normalizedQuery = normalizeIconName(query);

    if (!normalizedQuery) {
      return ICON_NAMES;
    }

    return [...ICON_NAMES]
      .filter((iconName) => normalizeIconName(iconName).includes(normalizedQuery))
      .sort((a, b) => {
        const aStarts = normalizeIconName(a).startsWith(normalizedQuery) ? 1 : 0;
        const bStarts = normalizeIconName(b).startsWith(normalizedQuery) ? 1 : 0;

        if (aStarts !== bStarts) {
          return bStarts - aStarts;
        }

        return a.localeCompare(b);
      });
  }, [query]);

  return (
    <div ref={pickerRef} className="relative">
      <Button
        variant="ghost"
        onClick={() => setOpen((current) => !current)}
        leftSlot={<Icon name={selectedIcon} size={18} />}
        rightSlot={<Icon name="chevrondown" size={16} color="textFaded" />}
      >
        Pick Icon
      </Button>
      <Popover
        shown={open}
        anchorToScreen={false}
        position="bottom-left"
        padding={8}
      >
        <Card className="w-[min(26rem,calc(100vw-2rem))] p-3">
          <div className="flex flex-col gap-3">
            <Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search icons"
              size="sm"
            />
            <Hstack justify="between">
              <Text size="xs" color="textFaded">
                {filteredIcons.length} icons
              </Text>
              <Hstack>
                <Icon name={selectedIcon} size={16} color="blue" />
                <Text size="xs" color="blue">
                  {selectedIcon}
                </Text>
              </Hstack>
            </Hstack>
            {filteredIcons.length === 0 ? (
              <Text size="sm" color="textFaded">
                No icons found.
              </Text>
            ) : (
              <div className="grid max-h-80 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-7">
                {filteredIcons.map((iconName) => {
                  const isSelected = iconName === selectedIcon;

                  return (
                    <button
                      key={iconName}
                      type="button"
                      title={iconName}
                      className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                        isSelected
                          ? "border-[rgba(76,94,255,0.35)] bg-[rgba(76,94,255,0.14)]"
                          : "border-transparent bg-transparent hover:bg-white/5"
                      }`}
                      onClick={() => {
                        onChange(iconName);
                        setOpen(false);
                      }}
                    >
                      <Icon
                        name={iconName}
                        size={18}
                        color={isSelected ? "blue" : "text"}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </Popover>
    </div>
  );
}
