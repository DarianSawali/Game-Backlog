import Link from "next/link";

type Props = { active: "home" | "library" | "profile" };

export default function AppNav({ active }: Props) {
  return (
    <nav aria-label="Primary navigation" className="flex items-center justify-center gap-8">
      {[{ value: "home", href: "/" }, { value: "library", href: "/library" }, { value: "profile", href: "/profile" }].map((item) => (
        <Link key={item.value} href={item.href} className={`border-b pb-2 text-[10px] uppercase tracking-[0.2em] transition ${active === item.value ? "border-[#e4c66a] text-[#f4f0e6]" : "border-transparent text-white/35 hover:text-white/70"}`}>
          {item.value}
        </Link>
      ))}
    </nav>
  );
}
