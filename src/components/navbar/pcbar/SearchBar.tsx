"use client";

import { BASE_URL } from "@/requests/config";
import {
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  useDisclosure,
} from "bioloom-ui";
import { MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useShortcut } from "react-keybind";
import SearchResultUser from "./SearchResultUser";
import { UserType } from "@/types/UserType";
import { useTranslations } from "next-intl";
import { useTheme } from "@/providers/SiteThemeProvider";
import { usePathname } from "next/navigation";
import { Button, Kbd, NavbarItem, Spinner, Vstack } from "bioloom-ui";
import SearchResultGame from "./SearchResultGame";
import { GameType } from "@/types/GameType";
import SearchResultTrack from "./SearchResultTrack";
import { TrackType } from "@/types/TrackType";

export default function SearchBar() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const pathname = usePathname();
  const [results, setResults] = useState<
    | {
        games: GameType[];
        users: UserType[];
        posts: { id: number; title: string; slug: string }[];
        tracks: TrackType[];
      }
    | undefined
  >({ games: [], users: [], posts: [], tracks: [] });
  const [loadingResults, setLoadingResults] = useState<boolean>(false);
  const t = useTranslations("Navbar");
  const { siteTheme, colors } = useTheme();

  const shortcuts = useShortcut();
  const registerShortcut = shortcuts?.registerShortcut;
  const unregisterShortcut = shortcuts?.unregisterShortcut;

  useEffect(() => {
    if (!registerShortcut || !unregisterShortcut) return;

    registerShortcut(
      () => {
        if (pathname.includes("theme-elimination")) {
          return;
        }
        const active = document.activeElement as HTMLElement | null;
        const tag = active?.tagName?.toLowerCase();
        const isEditable =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          active?.isContentEditable;
        if (isEditable) return;
        onOpen();
      },
      ["s"],
      "Save",
      "Save the file"
    );
    return () => {
      unregisterShortcut(["s"]);
    };
  }, [registerShortcut, unregisterShortcut, onOpen, pathname]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    // Search debouncing so that it only calls the api after a second with no search bar changes
    // (prevents a ton of calls that would be there for typing every letter otherwise)
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) return;

    async function fetchData() {
      setLoadingResults(true);

      fetch(`${BASE_URL}/search?query=${debouncedSearch}`)
        .then((res) => res.json())
        .then((json) => {
          setResults(json.data);
          return json; // For the toast success callback
        })
        .finally(() => setLoadingResults(false));
    }

    fetchData();
  }, [debouncedSearch, setResults]);

  return (
    <>
      <NavbarItem>
        <Button
          size="sm"
          className=" text-xs !duration-500"
          variant="standard"
          leftSlot={<Search size={16} />}
          onClick={onOpen}
          rightSlot={
            <Kbd
              className="text-xs !duration-500 border-1 shadow-md"
              style={{
                backgroundColor: colors["base"],
                borderColor: colors["base"],
                color: colors["text"],
              }}
            >
              S
            </Kbd>
          }
          style={{
            color: colors["textFaded"],
          }}
        >
          {t("Search")}
        </Button>
      </NavbarItem>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        hideCloseButton={true}
        size="2xl"
        backdrop="opaque"
      >
        <ModalContent
          className="max-w-[820px] w-[90vw]"
          style={{
            backgroundColor: siteTheme.colors["mantle"],
            borderColor: siteTheme.colors["base"],
          }}
        >
          {(onClose) => (
            <>
              <ModalBody className="py-4">
                <Vstack align="stretch" gap={2}>
                  <Input
                    ref={inputRef}
                    placeholder={t("Search")}
                    value={search}
                    onValueChange={setSearch}
                    rightIcon={
                      loadingResults ? <Spinner /> : <Search size={16} />
                    }
                    className="w-full"
                    style={{
                      backgroundColor: siteTheme.colors["mantle"],
                      borderColor: siteTheme.colors["base"],
                      color: siteTheme.colors["text"],
                    }}
                  />
                  {results &&
                    results.games?.length > 0 &&
                    results.games.map((game) => (
                      <SearchResultGame
                        key={game.id}
                        game={game}
                        onPress={() => {
                          onClose();
                          setSearch("");
                          setResults({
                            games: [],
                            users: [],
                            posts: [],
                            tracks: [],
                          });
                        }}
                      />
                    ))}
                  {results &&
                    results.users?.length > 0 &&
                    results.users.map((user) => (
                      <SearchResultUser
                        key={user.id}
                        user={user}
                        onPress={() => {
                          onClose();
                          setSearch("");
                          setResults({
                            games: [],
                            users: [],
                            posts: [],
                            tracks: [],
                          });
                        }}
                      />
                    ))}
                  {results &&
                    results.posts?.length > 0 &&
                    results.posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/p/${post.slug}`}
                        className="block"
                        onClick={() => {
                          onClose();
                          setSearch("");
                          setResults(undefined);
                        }}
                      >
                        <Card>
                          <CardBody
                            className="flex flex-row items-center gap-2"
                            style={{
                              backgroundColor: siteTheme.colors["mantle"],
                              borderColor: siteTheme.colors["base"],
                              color: siteTheme.colors["text"],
                            }}
                          >
                            <MessageCircle /> {post.title}
                          </CardBody>
                        </Card>
                      </Link>
                    ))}
                  {results &&
                    results.tracks?.length > 0 &&
                    results.tracks.map((track) => (
                      <SearchResultTrack
                        key={track.id}
                        track={track}
                        onPress={() => {
                          onClose();
                          setSearch("");
                          setResults({
                            games: [],
                            users: [],
                            posts: [],
                            tracks: [],
                          });
                        }}
                      />
                    ))}
                </Vstack>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
