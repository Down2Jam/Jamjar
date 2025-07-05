"use client";

import { BASE_URL } from "@/requests/config";
import {
  Input,
  Modal,
  ModalBody,
  ModalContent,
  NavbarItem,
  useDisclosure,
} from "@heroui/react";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function NavbarSearchbar() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [results, setResults] = useState<{
    games: { id: number; name: string }[];
  }>();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) return;

    async function fetchData() {
      const results = await fetch(
        `${BASE_URL}/search?query=${debouncedSearch}`
      );
      const json = await results.json();
      setResults(json.data);
    }

    fetchData();
  }, [debouncedSearch, setResults]);

  return (
    <>
      <NavbarItem>
        <Input
          placeholder="Search"
          onClick={onOpen}
          classNames={{
            inputWrapper:
              "!duration-500 ease-in-out transition-all border-[#d9d9da] dark:border-[#444] dark:bg-[#222222] bg-[#fff] border-2",
          }}
          endContent={<Search />}
          className="text-[#333] dark:text-white min-w-40"
        />
      </NavbarItem>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        hideCloseButton={true}
        size="2xl"
      >
        <ModalContent>
          {() => (
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
                  endContent={<Search />}
                  className="text-[#333] dark:text-white min-w-40"
                />
                {results &&
                  results.games?.length > 0 &&
                  results.games.map((game) => <p key={game.id}>{game.name}</p>)}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
