import BackgroundFade from "@/components/background-fade";

export default async function Home() {
  return (
    <div>
      <BackgroundFade />
      <div className="relative z-10">
        <div className="max-w-[600px]">
          <p className="text-5xl">The community centered game jam.</p>
          <p>Make a game in 72 hours.</p>
        </div>
      </div>
    </div>
  );
}
