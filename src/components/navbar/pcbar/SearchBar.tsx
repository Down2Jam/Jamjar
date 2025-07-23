"use client";

import { BASE_URL } from "@/requests/config";
import {
  Button,
  Card,
  CardBody,
  Input,
  Kbd,
  Modal,
  ModalBody,
  ModalContent,
  NavbarItem,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { Gamepad, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useShortcut } from "react-keybind";
import SearchResultUser from "./SearchResultUser";
import { UserType } from "@/types/UserType";
import { useTranslations } from "next-intl";

export default function SearchBar() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [results, setResults] = useState<
    | {
        games: { id: number; name: string; slug: string }[];
        users: UserType[];
        posts: { id: number; title: string; slug: string }[];
      }
    | undefined
  >({ games: [], users: [], posts: [] });
  const [loadingResults, setLoadingResults] = useState<boolean>(false);
  const t = useTranslations("Navbar");

  const { registerShortcut, unregisterShortcut } = useShortcut();

  useEffect(() => {
    registerShortcut(onOpen, ["s"], "Save", "Save the file");
    return () => {
      unregisterShortcut(["s"]);
    };
  }, [registerShortcut, unregisterShortcut, onOpen]);

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
          className="bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 text-xs !duration-500"
          startContent={<Search size={16} />}
          onPress={onOpen}
          endContent={<Kbd className="text-xs !duration-500">S</Kbd>}
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
        className="bg-white dark:bg-black"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalBody className="py-4">
                <Input
                  ref={inputRef}
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  classNames={{
                    inputWrapper:
                      "!duration-500 ease-in-out transition-all border-[#d9d9da] dark:border-[#444] dark:bg-[#222222] bg-[#fff] border-2",
                  }}
                  endContent={
                    loadingResults ? (
                      <Spinner size="sm" />
                    ) : (
                      <Search size={16} />
                    )
                  }
                  className="text-[#333] dark:text-white min-w-40"
                />
                {results &&
                  results.games?.length > 0 &&
                  results.games.map((game) => (
                    <Card
                      key={game.id}
                      isPressable
                      as={Link}
                      href={`/g/${game.slug}`}
                      onPress={() => {
                        onClose();
                        setSearch("");
                        setResults({ games: [], users: [], posts: [] });
                      }}
                    >
                      <CardBody className="flex flex-row items-center gap-2">
                        <Gamepad /> {game.name}
                      </CardBody>
                    </Card>
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
                        setResults({ games: [], users: [], posts: [] });
                      }}
                    />
                  ))}
                {results &&
                  results.posts?.length > 0 &&
                  results.posts.map((post) => (
                    <Card
                      key={post.id}
                      isPressable
                      as={Link}
                      href={`/p/${post.slug}`}
                      onPress={() => {
                        onClose();
                        setSearch("");
                        setResults(undefined);
                      }}
                    >
                      <CardBody className="flex flex-row items-center gap-2">
                        <MessageCircle /> {post.title}
                      </CardBody>
                    </Card>
                  ))}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
