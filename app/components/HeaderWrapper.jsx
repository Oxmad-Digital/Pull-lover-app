"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper() {
    const pathname = usePathname();
    const isHome = pathname === "/";
    if (pathname.startsWith("/admin") || pathname === "/maintenance") return null;

    return <Header transparent={isHome} dashboard={pathname.startsWith("/dashboard")} />;
}
