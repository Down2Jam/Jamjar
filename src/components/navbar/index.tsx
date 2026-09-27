import ClientNavbar from "./ClientNavbar";
import { loadLanguages } from "@/lib/loadLanguages";
import { useSession } from "@/hooks/useSession";
const languages = loadLanguages();

export default function Navbar() {
  const { signedIn: isLoggedIn } = useSession();

  return <ClientNavbar isLoggedIn={isLoggedIn} languages={languages} />;
}
