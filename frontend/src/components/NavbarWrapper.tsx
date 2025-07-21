"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();
  // Change "/model" to your actual model page route if needed
  if (pathname === "/model") return null;
  return <Navbar />;
}