import { Button } from "@/framework/Button";

export default function Footer() {
  return (
    <div className="p-8 bg-[#fff] dark:bg-[#222] mt-8 border-t-2 dark:border-white/15 border-black/15 transition-color duration-500 ease-in-out z-10">
      <div className="flex justify-between">
        <div></div>
        <div className="flex gap-3">
          <Button icon="sigithub" href="https://github.com/Down2Jam" />
          <Button
            icon="siforgejo"
            href="https://git.edikoyo.com/Ategon/Jamjar"
          />
          <Button icon="sidiscord" href="https://discord.d2jam.com" />
        </div>
      </div>
    </div>
  );
}
