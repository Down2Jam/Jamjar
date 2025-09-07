"use client";

import { useEffect, useState } from "react";
import { FeaturedStreamerType } from "@/types/FeaturedStreamerType";
import { Image } from "@heroui/react";
import NextImage from "next/image";
import { getStreamers } from "@/requests/streamer";
import { Eye, Play } from "lucide-react";
import { useTheme } from "@/providers/SiteThemeProvider";
import Tooltip from "@/framework/Tooltip";
import { Button } from "@/framework/Button";
import { Chip } from "@/framework/Chip";

export default function SidebarStreams() {
  const [streamers, setStreamers] = useState<FeaturedStreamerType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // State to track the currently displayed streamer
  const { colors, siteTheme } = useTheme();

  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        const response = await getStreamers();
        if (!response.ok) {
          throw new Error("Failed to fetch featured streamers");
        }

        const data: FeaturedStreamerType[] = (await response.json()).data;
        setStreamers(data);
      } catch (error) {
        console.error("Error fetching featured streamers:", error);
      }
    };

    fetchStreamers();
  }, []);

  // Function to handle moving to the previous streamer

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? streamers.length - 1 : prevIndex - 1
    );
  };

  const handlePrevPage = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex <= 2 ? streamers.length - 1 : prevIndex - (prevIndex % 3) - 1
    );
  };

  const handleNextPage = () => {
    setCurrentIndex((prevIndex) =>
      3 + 3 * Math.floor(prevIndex / 3.0) >= streamers.length
        ? 0
        : prevIndex + 3 - (prevIndex % 3)
    );
  };

  // Function to handle moving to the next streamer
  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === streamers.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (streamers.length === 0) {
    return <div>Loading featured streamers...</div>;
  }

  const currentStreamer = streamers[currentIndex]; // Get the currently displayed streamer

  return (
    <a href={`https://twitch.tv/${currentStreamer.userName}`} target="_blank">
      <div className="transition-color duration-250 w-[480px] min-w-[480px] max-w-[480px] hover:cursor-pointer h-[320px]">
        <div className="absolute z-0">
          <Image
            as={NextImage}
            src={currentStreamer.thumbnailUrl}
            width={480}
            height={270}
            alt={`${currentStreamer.userName}'s thumbnail`}
            className="brightness-75 rounded-2xl"
          />
        </div>

        {siteTheme.type === "Dark" && (
          <div
            style={{
              backgroundImage: `radial-gradient(transparent 40%, color-mix(in srgb, ${colors["crust"]} 50%, transparent) 100%)`,
            }}
            className="absolute z-10 rounded-2xl w-[480px] min-w-[480px] max-w-[480px] h-[270px] min-h-[270px]"
          />
        )}
        <div className="absolute mt-60 flex z-20 gap-2 justify-center w-[480px] min-w-[480px] max-w-[480px] items-center">
          {streamers.length > 3 && (
            <Tooltip content="Previous Page" position="top">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handlePrevPage();
                }}
                size="sm"
                icon="chevronsleft"
              />
            </Tooltip>
          )}
          {streamers.length > 0 + 3 * Math.floor(currentIndex / 3.0) && (
            // <Tooltip
            //   position="top"
            //   content={`${
            //     streamers[0 + 3 * Math.floor(currentIndex / 3.0)].userName
            //   } - ${
            //     streamers[0 + 3 * Math.floor(currentIndex / 3.0)].streamTitle
            //   }`}
            // >
            <Image
              as={NextImage}
              src={
                streamers[0 + 3 * Math.floor(currentIndex / 3.0)].thumbnailUrl
              }
              width={120}
              height={67.5}
              alt={`${
                streamers[0 + 3 * Math.floor(currentIndex / 3.0)].userName
              }'s thumbnail`}
              className={`rounded-xl hover:cursor-pointer absolute z-0 inset-shadow-sm inset-shadow-black ${
                currentIndex === 0 + 3 * Math.floor(currentIndex / 3.0)
                  ? "brightness-100 hover:brightness-[1.25]"
                  : "brightness-[0.25] hover:brightness-[0.75]"
              }`}
              classNames={{ wrapper: "w-full h-[67.5px]" }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCurrentIndex(0 + 3 * Math.floor(currentIndex / 3.0));
              }}
            />
            // </Tooltip>
          )}
          {streamers.length > 1 + 3 * Math.floor(currentIndex / 3.0) && (
            // <Tooltip
            //   position="top"
            //   content={`${
            //     streamers[1 + 3 * Math.floor(currentIndex / 3.0)].userName
            //   } - ${
            //     streamers[1 + 3 * Math.floor(currentIndex / 3.0)].streamTitle
            //   }`}
            // >
            <Image
              as={NextImage}
              src={
                streamers[1 + 3 * Math.floor(currentIndex / 3.0)].thumbnailUrl
              }
              width={120}
              height={67.5}
              alt={`${
                streamers[1 + 3 * Math.floor(currentIndex / 3.0)].userName
              }'s thumbnail`}
              className={`rounded-xl hover:cursor-pointer absolute z-0 inset-shadow-sm inset-shadow-black ${
                currentIndex === 1 + 3 * Math.floor(currentIndex / 3.0)
                  ? "brightness-100 hover:brightness-[1.25]"
                  : "brightness-[0.25] hover:brightness-[0.75]"
              }`}
              classNames={{ wrapper: "w-full h-[67.5px]" }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCurrentIndex(1 + 3 * Math.floor(currentIndex / 3.0));
              }}
            />
            // </Tooltip>
          )}
          {streamers.length > 2 + 3 * Math.floor(currentIndex / 3.0) && (
            // <Tooltip
            //   position="top"
            //   content={`${
            //     streamers[2 + 3 * Math.floor(currentIndex / 3.0)].userName
            //   } - ${
            //     streamers[2 + 3 * Math.floor(currentIndex / 3.0)].streamTitle
            //   }`}
            // >
            <Image
              as={NextImage}
              src={
                streamers[2 + 3 * Math.floor(currentIndex / 3.0)].thumbnailUrl
              }
              width={120}
              height={67.5}
              alt={`${
                streamers[2 + 3 * Math.floor(currentIndex / 3.0)].userName
              }'s thumbnail`}
              className={`rounded-xl hover:cursor-pointer absolute z-0 inset-shadow-sm inset-shadow-black ${
                currentIndex === 2 + 3 * Math.floor(currentIndex / 3.0)
                  ? "brightness-100 hover:brightness-[1.25]"
                  : "brightness-[0.25] hover:brightness-[0.75]"
              }`}
              classNames={{ wrapper: "w-full h-[67.5px]" }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCurrentIndex(2 + 3 * Math.floor(currentIndex / 3.0));
              }}
            />
            // </Tooltip>
          )}
          {streamers.length > 3 && (
            <Tooltip content="Next Page" position="top">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleNextPage();
                }}
                size="sm"
                icon="chevronsright"
              />
            </Tooltip>
          )}
        </div>
        <div className="absolute z-20 mt-[120px] justify-between flex items-center w-[480px] min-w-[480px] max-w-[480px] px-2">
          <Tooltip content="Previous Stream" position="top">
            <Button
              onClick={(e) => {
                e.preventDefault();
                handlePrev();
              }}
              icon="chevronleft"
            />
          </Tooltip>
          <Play
            size={32}
            style={{
              color: colors["textLight"],
            }}
          />
          <Tooltip content="Next Stream" position="top">
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleNext();
              }}
              icon="chevronright"
            />
          </Tooltip>
        </div>
        <div className="relative z-10 p-2">
          <div className="flex flex-col gap-1">
            <p
              style={{
                color: colors["textLight"],
              }}
            >
              {currentStreamer.userName} - {currentStreamer.streamTitle}
            </p>
            <div className="flex gap-2 pl-4 items-center">
              <Tooltip content="Viewer Count" position="top">
                <Chip>
                  <div className="flex gap-1 items-center">
                    <Eye size={16} />
                    <p className="text-sm">{currentStreamer.viewerCount}</p>
                  </div>
                </Chip>
              </Tooltip>
              <div className="flex gap-3">
                {currentStreamer.streamTags
                  .filter((tag) =>
                    [
                      "d2jam",
                      "ludumdare",
                      "gamejam",
                      "gamedev",
                      "unrealengine",
                      "godot",
                      "unity",
                      "blender",
                      "aseprite",
                      "pixelart",
                      "gamedevelopment",
                      "coworking",
                      "piratejam",
                      "art",
                      "games",
                      "gamemaker",
                    ].includes(tag.toLowerCase())
                  )
                  .slice(0, 3)
                  .map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
