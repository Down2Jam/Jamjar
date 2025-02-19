import Socials from "./Socials";

export default function Footer() {
  return (
    <div className="p-8 bg-[#fff] dark:bg-[#222] mt-8 border-t-2 dark:border-white/15 border-black/15 transition-color duration-500 ease-in-out z-10">
      <div className="flex justify-between">
        <div></div>
        <div className="flex gap-3">
          <Socials />
        </div>
      </div>
    </div>
  );
}
