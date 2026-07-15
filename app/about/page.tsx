import type { Metadata } from "next";
import { getAbout } from "@/entities/about";
import { AboutView } from "@/views/about/AboutView";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutView about={getAbout()} />;
}
