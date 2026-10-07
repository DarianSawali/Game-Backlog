"use client";

import BacklogPrioritySelect from "@/components/BacklogPrioritySelect";
import BacklogStatusSelect from "@/components/BacklogStatusSelect";

type Props = {
  appid: number;
  className?: string;
};

export default function BacklogControls({
  appid,
  className = "",
}: Props) {
  return (
    <div className={`grid gap-2 sm:grid-cols-2 ${className}`}>
      <BacklogStatusSelect appid={appid} />
      <BacklogPrioritySelect appid={appid} />
    </div>
  );
}
