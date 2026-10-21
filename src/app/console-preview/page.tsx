import type { Metadata } from "next";
import ConsoleBacklogPreview from "@/components/ConsoleBacklogPreview";

export const metadata: Metadata = {
  title: "Console Preview | Game Backlog",
  description: "A console-focused preview of the complete backlog experience.",
};

export default function ConsolePreviewPage() {
  return <ConsoleBacklogPreview />;
}
