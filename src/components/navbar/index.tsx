"use server";

import { cookies } from "next/headers";
import ClientNavbar from "./ClientNavbar";
import { loadLanguages } from "@/lib/loadLanguages";
const languages = loadLanguages();

export default async function Navbar() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get("user");

  const isLoggedIn = !!token;

  return <ClientNavbar isLoggedIn={isLoggedIn} languages={languages} />;
}
