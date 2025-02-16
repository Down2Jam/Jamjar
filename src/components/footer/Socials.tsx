import { FC, ReactNode } from "react";
import { HTMLNextUIProps } from '@nextui-org/system';
import IconLink from "@/components/link-components/IconLink";
import { SiBluesky, SiDiscord, SiForgejo, SiGithub } from "@icons-pack/react-simple-icons";

interface Social {
    icon: ReactNode,
    name: string,
    href: string
}

export const socialList: Social[] = [
    {
        icon: <SiGithub />,
        name: "Github",
        href: "https://github.com/Dare2Jam"
    },
    {
        icon: <SiForgejo />,
        name: "Personal Git",
        href: "https://git.edikoyo.com/Ategon/Jamjar"
    },
    {
        icon: <SiBluesky />,
        name: "BlueSky",
        href: "https://bsky.app/profile/d2jam.com"
    },
    {
        icon: <SiDiscord />,
        name: "Discord",
        href: "https://discord.d2jam.com"
    }
]

const Socials: FC<HTMLNextUIProps> = ({}) => {
    return (
        <>
            {socialList.map(social => (<IconLink key={social.name} icon={social.icon} href={social.href} />))}
        </>
    )
}

export default Socials;