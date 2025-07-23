// components/ThemeDropdown.tsx
"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Button,
} from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

interface ThemeOption {
  name: string;
  filename: string;
}

export default function ThemeDropdown() {
  const { currentTheme, allThemes, setThemeByKey } = useTheme();
  const [themes, setThemes] = useState<ThemeOption[]>([]);

  const handleChange = async (filename: string) => {
    setThemeByKey(filename);
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button endContent={<ChevronDown size={16} />} variant="bordered">
          {currentTheme.name}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Theme selection">
        {allThemes.map((t) => (
          <DropdownItem key={t.name} onClick={() => handleChange(t.name)}>
            {t.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
