"use client";

import { useEffect, useState } from "react";
import { FeaturedStreamerType } from "@/types/FeaturedStreamerType";
import { Button, Chip, Image, Tooltip } from "@nextui-org/react";
import NextImage from "next/image";
import { getStreamers } from "@/requests/streamer";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Play,
} from "lucide-react";

export default function SidebarStreams() {
  const [streamers, setStreamers] = useState<FeaturedStreamerType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // State to track the currently displayed streamer

  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        const response = await getStreamers();
        if (!response.ok) {
          throw new Error("Failed to fetch featured streamers");
        }

        const data: FeaturedStreamerType[] = await response.json();
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
      <div className="text-[#333] dark:text-white transition-color duration-250 w-[480px] min-w-[480px] max-w-[480px] hover:cursor-pointer h-[320px]">
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
        <div className="hidden dark:block absolute z-10 bg-gradient-radial from-40% from-transparent to-black rounded-2xl w-[480px] min-w-[480px] max-w-[480px] h-[270px] min-h-[270px]" />
        <div className="absolute mt-60 flex z-20 gap-2 justify-center w-[480px] min-w-[480px] max-w-[480px] items-center">
          {streamers.length > 3 && (
            <Tooltip
              content="Previous Page"
              className="text-black dark:text-white"
            >
              <Button
                isIconOnly
                variant="light"
                onClick={(e) => {
                  e.preventDefault();
                }}
                onPress={() => {
                  handlePrevPage();
                }}
                size="sm"
              >
                <ChevronsLeft size={16} className="text-[#999]" />
              </Button>
            </Tooltip>
          )}
          {streamers.length > 0 + 3 * Math.floor(currentIndex / 3.0) && (
            <Tooltip
              className="text-black dark:text-white"
              content={
                streamers[0 + 3 * Math.floor(currentIndex / 3.0)].streamTitle
              }
            >
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
            </Tooltip>
          )}
          {streamers.length > 1 + 3 * Math.floor(currentIndex / 3.0) && (
            <Tooltip
              className="text-black dark:text-white"
              content={
                streamers[1 + 3 * Math.floor(currentIndex / 3.0)].streamTitle
              }
            >
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
            </Tooltip>
          )}
          {streamers.length > 2 + 3 * Math.floor(currentIndex / 3.0) && (
            <Tooltip
              className="text-black dark:text-white"
              content={
                streamers[2 + 3 * Math.floor(currentIndex / 3.0)].streamTitle
              }
            >
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
            </Tooltip>
          )}
          {streamers.length > 3 && (
            <Tooltip content="Next Page" className="text-black dark:text-white">
              <Button
                isIconOnly
                variant="light"
                onClick={(e) => {
                  e.preventDefault();
                }}
                onPress={handleNextPage}
                size="sm"
              >
                <ChevronsRight size={16} className="text-[#999]" />
              </Button>
            </Tooltip>
          )}
        </div>
        <div className="absolute z-20 mt-[120px] justify-between flex items-center w-[480px] min-w-[480px] max-w-[480px] px-2">
          <Tooltip
            content="Previous Stream"
            className="text-black dark:text-white"
          >
            <Button
              isIconOnly
              variant="light"
              onClick={(e) => {
                e.preventDefault();
              }}
              onPress={handlePrev}
            >
              <ChevronLeft className="text-white" />
            </Button>
          </Tooltip>
          <Play size={32} className="text-white" />
          <Tooltip content="Next Stream" className="text-black dark:text-white">
            <Button
              isIconOnly
              variant="light"
              onClick={(e) => {
                e.preventDefault();
              }}
              onPress={handleNext}
            >
              <ChevronRight className="text-white" />
            </Button>
          </Tooltip>
        </div>
        <div className="relative z-10 p-2">
          <div className="flex flex-col gap-1">
            <p className="text-white">{currentStreamer.streamTitle}</p>
            <div className="flex gap-2 pl-4 items-center">
              <Tooltip
                content="Viewer Count"
                className="text-black dark:text-white"
              >
                <Chip size="sm" variant="faded">
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
                    ].includes(tag.toLowerCase())
                  )
                  .slice(0, 3)
                  .map((tag) => (
                    <Chip size="sm" key={tag} variant="faded">
                      {tag}
                    </Chip>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
  // return (
  //   <div className="text-[#333] dark:text-white text-center p-6 transition-color duration-250">
  //     <h1>Featured Streamer</h1>
  //     <div
  //       style={{
  //         display: "flex",
  //         flexDirection: "column",
  //         alignItems: "center",
  //         border: "1px solid #ccc",
  //         borderRadius: "8px",
  //         padding: "20px",
  //         width: "400px",
  //         margin: "0 auto",
  //       }}
  //     >
  //       <Image
  //         as={NextImage}
  //         src={currentStreamer.thumbnailUrl}
  //         alt={`${currentStreamer.userName}'s thumbnail`}
  //         style={{ width: "100%", borderRadius: "4px", marginBottom: "10px" }}
  //         width={320}
  //         height={180}
  //       />
  //       <a
  //         href={`https://twitch.tv/${currentStreamer.userName}`}
  //         target="_blank"
  //       >
  //         <div
  //           style={{
  //             height: "100px",
  //             display: "flex",
  //             flexDirection: "column",
  //             justifyContent: "center",
  //           }}
  //         >
  //           <h3>{currentStreamer.userName}</h3>
  //           <p>{currentStreamer.streamTitle}</p>
  //         </div>
  //       </a>
  //       <div>
  //         {currentStreamer.streamTags.map((tag, index) => (
  //           <span
  //             key={index}
  //             style={{
  //               display: "inline-block",
  //               backgroundColor: "#f0f0f0",
  //               borderRadius: "4px",
  //               padding: "2px 6px",
  //               marginRight: "4px",
  //               fontSize: "12px",
  //             }}
  //           >
  //             {tag}
  //           </span>
  //         ))}
  //       </div>
  //     </div>
  //     <div style={{ marginTop: "20px" }}>
  //       <button onClick={handlePrev} style={{ marginRight: "10px" }}>
  //         &larr; Previous
  //       </button>
  //       <button onClick={handleNext}>&rarr; Next</button>
  //     </div>
  //   </div>
  // );
}
