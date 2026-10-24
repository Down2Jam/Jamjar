import { cloneElement, isValidElement, type ComponentProps, type CSSProperties, type ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { Dropdown, type Button } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";

export default function EditorDropdown(props: ComponentProps<typeof Dropdown>) {
  const { colors } = useTheme();
  const variables = { "--select-text": colors.text, "--select-surface": colors.mantle, "--select-accent": colors.blue } as CSSProperties;
  const triggerClass = "h-11! rounded-full! border-[color-mix(in_srgb,var(--select-text)_16%,transparent)]! py-0! pl-4! pr-0! gap-3! text-[var(--select-text)]! [&>p]:text-sm! [&>p]:font-semibold! bg-[linear-gradient(135deg,color-mix(in_srgb,var(--select-text)_7%,var(--select-surface)),color-mix(in_srgb,var(--select-text)_3%,var(--select-surface))_60%,color-mix(in_srgb,var(--select-text)_6%,var(--select-surface)))]! shadow-[inset_0_1px_0_#ffffff08,0_3px_8px_#0003]! hover:border-[color-mix(in_srgb,var(--select-text)_28%,transparent)]! aria-expanded:border-[color-mix(in_srgb,var(--select-text)_28%,transparent)]! focus-visible:outline-[var(--select-accent)]! cursor-pointer!";
  const chevronClass = "ml-auto flex h-10 w-11 shrink-0 items-center justify-center text-[var(--select-accent)] [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:stroke-[3]";
  const trigger = isValidElement(props.trigger) ? cloneElement(props.trigger as ReactElement<ComponentProps<typeof Button>>, {
    className: `${(props.trigger.props as ComponentProps<typeof Button>).className ?? ""} ${triggerClass}`,
    style: { ...(props.trigger.props as ComponentProps<typeof Button>).style, ...variables },
    rightSlot: <span aria-hidden="true" className={chevronClass}><ChevronDown /></span>,
  }) : props.trigger;

  return <Dropdown {...props} instant arrowToChevron trigger={trigger}
    triggerStyle={{ ...props.triggerStyle, ...variables }}
    menuStyle={{ ...props.menuStyle, ...variables }}
    triggerClassName={`${triggerClass} ${props.triggerClassName ?? ""}`}
    triggerChevronClassName={chevronClass}
    className={`rounded-[10px]! p-[5px]! shadow-[0_8px_24px_#0005]! [&_[role=menuitem]]:rounded! [&_[role=menuitem]]:px-2.5! [&_[role=menuitem]]:py-2! [&_[role=menuitem]]:bg-transparent! [&_[role=menuitem]]:text-[var(--select-text)]! [&_[role=menuitem]]:cursor-pointer! [&_[role=menuitem]_*]:cursor-inherit! [&_[role=menuitem]_*]:transition-none! [&_[role=menuitem]_p]:text-[13px]! [&_[role=menuitem]_p]:leading-4! [&_[role=menuitem]:hover:not(:disabled)]:bg-[var(--select-accent)]! [&_[role=menuitem]:hover:not(:disabled)]:text-[#101b27]! [&_[role=menuitem]:focus-visible]:bg-[var(--select-accent)]! [&_[role=menuitem]:focus-visible]:text-[#101b27]! ${props.className ?? ""}`} />;
}

EditorDropdown.Item = Dropdown.Item;
