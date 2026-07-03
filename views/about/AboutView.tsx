import type { AboutData } from "@/entities/about";
import { ProfileHeader } from "./components/ProfileHeader";
import { Intro } from "./components/Intro";
import { Timeline } from "./components/Timeline";
import { Projects } from "./components/ProjectCard";

// h2 — About 본문 전용 ¶모티프. .prose h2와 값(margin·line-height)이 달라 별도 유틸로 재현 (design.md §4.10)
const h2Class =
  "mx-0 mt-8 mb-4 text-xl font-semibold tracking-[-0.02em] before:mr-2 before:font-normal before:text-moss before:content-['¶']";

export function AboutView({ about }: { about: AboutData }) {
  return (
    <div className="wrap">
      <div className="px-0 pt-6 pb-4">
        <ProfileHeader
          role={about.profile.role}
          src={about.profile.src}
          alt={about.profile.alt}
        />
        <Intro lines={about.intro} />
        <h2 className={h2Class}>이력</h2>
        <Timeline items={about.timeline} />
        <h2 className={h2Class}>프로젝트</h2>
        <Projects items={about.projects} />
      </div>
    </div>
  );
}
