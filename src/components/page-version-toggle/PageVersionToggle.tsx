"use client";

import { Hstack, Text, getNeutralBorderColor } from "bioloom-ui";
import { PageVersion } from "@/types/GameType";
import { useTheme } from "@/providers/useSiteTheme";

export default function PageVersionToggle({
  value,
  onChange,
  disabled = false,
  borderColor,
}: {
  value: PageVersion;
  onChange: (value: PageVersion) => void;
  disabled?: boolean;
  borderColor?: string;
}) {
  const { colors } = useTheme();

  const options: Array<{ value: PageVersion; label: string }> = [
    { value: "JAM", label: "Jam Page" },
    { value: "POST_JAM", label: "Post-Jam Page" },
  ];

  return (
    <Hstack
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: borderColor ?? getNeutralBorderColor(colors) }}
      gap={0}
    >
      {options.map((option, index) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className="cursor-pointer px-3 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: active ? colors["blue"] : colors["mantle"],
              borderLeft:
                index === 0 ? undefined : `1px solid ${borderColor ?? getNeutralBorderColor(colors)}`,
            }}
          >
            <Text
              size="sm"
              weight={active ? "semibold" : undefined}
              color={active ? "textLight" : "text"}
            >
              {option.label}
            </Text>
          </button>
        );
      })}
    </Hstack>
  );
}
