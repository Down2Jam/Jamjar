import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { NavbarBrand } from "@heroui/navbar";
import NextImage from "next/image";

export default function Brand() {
  return (
    <NavbarBrand className="flex-grow-0 mr-2">
      <Link
        href="/"
        className={`duration-500 ease-in-out transition-all transform flex gap-2 text-white`}
      >
        <Image
          as={NextImage}
          src="/images/D2J_Icon.png"
          className="min-w-[40px]"
          alt="Down2Jam logo"
          width={40}
          height={40}
        />
        <p className="bg-gradient-to-r from-[#46c2e1] to-[#d84f7b] bg-clip-text text-transparent w-fit text-xl">
          D2Jam
        </p>
      </Link>
    </NavbarBrand>
  );
}
