import { Metadata } from "next";
import ClientUserPage from "./ClientUserPage";
import { getUser } from "@/requests/user";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await getUser(slug);
  const json = await res.json();

  if (!res.ok) {
    return {
      title: "User not found",
      description: "This user could not be found",
    };
  }

  const { name, short, profilePicture } = json.data;

  const fallbackIcon = "/images/D2J_Icon.png";
  const iconUrl = profilePicture || fallbackIcon;

  return {
    title: `${name}`,
    description: short || "A user in Down2Jam",
    alternates: {
      canonical: `/u/${slug}`,
    },
    icons: {
      icon: [
        { url: iconUrl, sizes: "16x16" },
        { url: iconUrl, sizes: "32x32" },
      ],
      apple: [{ url: iconUrl }],
      shortcut: iconUrl,
    },
    openGraph: {
      title: name,
      description: short || "A user in Down2Jam",
      url: `https://d2jam.com/u/${slug}`,
      type: "website",
      images: [
        {
          url: profilePicture || "/images/D2J_Icon.png",
          width: 720,
          height: 400,
          alt: `${name} profile picture`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: short || "A user in Down2Jam",
      images: [profilePicture || "/images/D2J_Icon.png"],
    },
  };
}

export default function UserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ClientUserPage params={params} />;
}
