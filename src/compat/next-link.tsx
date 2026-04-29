import { useNavigate } from "react-router";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
};

function isExternalHref(href: string) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}

export default function Link({
  href,
  replace,
  scroll: _scroll,
  prefetch: _prefetch,
  onClick,
  target,
  ...props
}: LinkProps) {
  const navigate = useNavigate();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      isExternalHref(href) ||
      target === "_blank" ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(href, { replace });
  }

  if (isExternalHref(href)) {
    return <a href={href} target={target} onClick={onClick} {...props} />;
  }

  return (
    <a href={href} target={target} onClick={handleClick} {...props} />
  );
}
