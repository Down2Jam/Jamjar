// import { createPortal } from "react-dom";
import useHasMounted from "@/hooks/useHasMounted";

export function Backdrop({
  shown,
}: // onClick,
// color = "rgba(0,0,0,0.4)",
{
  shown: boolean;
  onClick: () => void;
  color?: string;
}) {
  const mounted = useHasMounted();

  // Do not render anything server-side or before mount
  if (!mounted || !shown) return null;

  return <div></div>;
  // return createPortal(
  //   <div
  //     className="fixed inset-0 z-40 transition-opacity duration-300"
  //     style={{ backgroundColor: color }}
  //     onClick={onClick}
  //     aria-hidden="true"
  //   />,
  //   document.body
  // );
}
