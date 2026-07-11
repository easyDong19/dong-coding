import type { AboutData } from "@/entities/about";
import { ProfileHeader } from "./components/ProfileHeader";
import { Intro } from "./components/Intro";
import { SocialLinks } from "./components/SocialLinks";
import { Timeline } from "./components/Timeline";
import { Certifications } from "./components/Certifications";
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
        <SocialLinks contact={about.contact} />
        {/* 소개 블록 ↔ 이력 블록 구분 (design.md §2.5 헤어라인) */}
        <hr className="h-px w-full border-0 bg-line" />
        <h2 className={h2Class}>기술</h2>
        <Certifications items={about.skills} />
        <h2 className={h2Class}>학력</h2>
        <Timeline items={about.education} />
        <h2 className={h2Class}>이력</h2>
        <Timeline items={about.timeline} />
        <h2 className={h2Class}>자격증</h2>
        <Certifications items={about.certifications} />
        <h2 className={h2Class}>프로젝트</h2>
        <Projects items={about.projects} />
      </div>
    </div>
  );
}
