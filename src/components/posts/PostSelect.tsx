import type { CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import Select, { components, type DropdownIndicatorProps, type Props } from "react-select";
import { useTheme } from "@/providers/useSiteTheme";

function ChevronIndicator<Option, IsMulti extends boolean>(props: DropdownIndicatorProps<Option, IsMulti>) {
  return (
    <components.DropdownIndicator {...props}>
      <span aria-hidden="true" className="flex h-10 w-11 shrink-0 items-center justify-center">
          <ChevronDown size={18} strokeWidth={3} className={`text-[var(--post-select-accent)] transition-transform duration-200 motion-reduce:transition-none ${props.selectProps.menuIsOpen ? "rotate-180" : ""}`} />
      </span>
    </components.DropdownIndicator>
  );
}

export default function PostSelect<Option, IsMulti extends boolean = true>(props: Props<Option, IsMulti>) {
  const { colors } = useTheme();
  const variables = {
    "--post-select-surface": colors.mantle,
    "--post-select-text": colors.text,
    "--post-select-muted": colors.textFaded,
    "--post-select-accent": colors.blue,
  } as CSSProperties;

  return (
    <Select<Option, IsMulti>
      {...props}
      menuPlacement={props.menuPlacement ?? "auto"}
      unstyled
      components={{ DropdownIndicator: ChevronIndicator, IndicatorSeparator: null }}
      styles={{
        container: base => ({ ...base, ...variables }),
        menuPortal: base => ({ ...base, ...variables, zIndex: 100 }),
      }}
      classNames={{
        container: () => "w-full min-w-0 max-w-md text-sm leading-5",
        control: ({ menuIsOpen, isDisabled }) => `min-h-11! rounded-[24px] border pl-4 pr-0 text-[var(--post-select-text)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--post-select-text)_7%,var(--post-select-surface)),color-mix(in_srgb,var(--post-select-text)_3%,var(--post-select-surface))_60%,color-mix(in_srgb,var(--post-select-text)_6%,var(--post-select-surface)))] shadow-[inset_0_1px_0_#ffffff08,0_3px_8px_#0003] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[var(--post-select-accent)] hover:border-[color-mix(in_srgb,var(--post-select-text)_28%,transparent)] ${menuIsOpen ? "border-[color-mix(in_srgb,var(--post-select-text)_28%,transparent)]" : "border-[color-mix(in_srgb,var(--post-select-text)_16%,transparent)]"} ${isDisabled ? "cursor-not-allowed! opacity-50" : "cursor-pointer! [&_*]:cursor-pointer!"}`,
        valueContainer: () => "gap-1 py-0.5 pr-2",
        input: () => "min-w-0 text-[var(--post-select-text)]",
        singleValue: () => "text-[var(--post-select-text)] font-semibold",
        placeholder: () => "text-[var(--post-select-text)] font-semibold",
        indicatorsContainer: () => "h-10 self-center gap-1",
        dropdownIndicator: () => "cursor-pointer",
        clearIndicator: () => "cursor-pointer rounded-full p-1 text-[var(--post-select-muted)] hover:text-[var(--post-select-text)]",
        menu: () => "text-sm leading-4 mt-2 rounded-[10px] bg-[var(--post-select-surface)] p-[5px] text-[var(--post-select-text)] shadow-[0_8px_24px_#0005]",
        menuList: () => "p-0!",
        option: ({ isFocused, isDisabled }) => `rounded px-2.5 py-2 text-[13px]! leading-4! font-semibold transition-none [&_*]:transition-none [&_*]:cursor-inherit! ${isDisabled ? "cursor-not-allowed! opacity-40" : "cursor-pointer!"} ${isFocused && !isDisabled ? "bg-[var(--post-select-accent)] text-[#101b27]" : "text-[var(--post-select-text)]"}`,
        multiValue: () => "min-w-0 rounded-lg bg-[color-mix(in_srgb,var(--post-select-text)_8%,var(--post-select-surface))]",
        multiValueLabel: () => "min-w-0 px-2 py-1 text-[var(--post-select-text)]",
        multiValueRemove: () => "cursor-pointer rounded-r-lg px-1 text-[var(--post-select-muted)] hover:bg-[var(--post-select-accent)] hover:text-[#101b27]",
        noOptionsMessage: () => "p-3 text-[var(--post-select-muted)]",
      }}
    />
  );
}
