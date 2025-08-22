import { Button } from "@/framework/Button";
import {
  SiBluesky,
  SiDiscord,
  SiForgejo,
  SiGithub,
  SiYoutube,
} from "@icons-pack/react-simple-icons";

export default async function SocialsPage() {
  return (
    <div>
      <Button>
        <SiDiscord />
      </Button>
      <Button>
        <SiBluesky />
      </Button>
      <Button>
        <SiYoutube />
      </Button>
      <Button>
        <SiGithub />
      </Button>
      <Button>
        <SiForgejo />
      </Button>
    </div>
  );
}
