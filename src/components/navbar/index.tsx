import ClientNavbar from "./ClientNavbar";
import { loadLanguages } from "@/lib/loadLanguages";
import { getCookie } from "@/helpers/cookie";
const languages = loadLanguages();

export default function Navbar() {
  const token = getCookie("user");
  const isLoggedIn = !!token;

  return <ClientNavbar isLoggedIn={isLoggedIn} languages={languages} />;
}
