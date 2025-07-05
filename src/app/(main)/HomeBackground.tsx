export default function HomeBackground() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "-100%",
        width: "300%",
        height: "100%",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      <iframe
        src="https://www.youtube.com/embed/0_e5tjsS2vE?autoplay=1&mute=1&controls=0&loop=1&playlist=0_e5tjsS2vE"
        allowFullScreen
        allow="autoplay"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          backgroundSize: "cover",
          background: "no-repeat center",
          userSelect: "none",
          pointerEvents: "none",

          height: "100%",
          width: "100%",
          minWidth: "100%",
          minHeight: "56.25vw",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </div>
  );
}
