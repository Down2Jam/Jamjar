"use client";

import { Spacer } from "@heroui/react";
import Timers from "../timers";
import { Gamepad2, Star, Users } from "lucide-react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Card } from "@/framework/Card";

export default function SidebarStatsClient({
  users,
  games,
  ratings,
}: {
  users: number;
  games: number;
  ratings: number;
}) {
  const { siteTheme } = useTheme();
  return (
    <Card>
      <Timers />
      <Spacer />
      <div className="flex items-center gap-4 justify-center">
        <Users
          style={{
            color: siteTheme.colors["textFaded"],
          }}
          className="transition-all duration-500"
        />
        <p>Entrants</p>
        <p
          style={{
            color: siteTheme.colors["blue"],
          }}
        >
          {users}
        </p>
      </div>
      {games != 0 && (
        <>
          <Spacer />
          <div className="flex items-center gap-4 justify-center">
            <Gamepad2
              className="transition-all duration-500"
              style={{
                color: siteTheme.colors["textFaded"],
              }}
            />
            <p>Games</p>
            <p
              style={{
                color: siteTheme.colors["blue"],
              }}
            >
              {games}
            </p>
          </div>
        </>
      )}
      {ratings != 0 && (
        <>
          <Spacer />
          <div className="flex items-center gap-4 justify-center">
            <Star
              style={{
                color: siteTheme.colors["textFaded"],
              }}
              className="transition-all duration-500"
            />
            <p>Ratings</p>
            <p
              style={{
                color: siteTheme.colors["blue"],
              }}
            >
              {ratings}
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
