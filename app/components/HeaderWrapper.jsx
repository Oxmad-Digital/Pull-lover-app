"use client";

import { usePathname } from "next/navigation";
import { splitLocale } from "@/app/i18n/config.mjs";
import Header from "./Header";

export default function HeaderWrapper() {
    const { path } = splitLocale(usePathname());
    return <Header transparent={path === "/"} dashboard={path.startsWith("/dashboard")} />;
}
