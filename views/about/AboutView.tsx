import type { AboutData } from "@/entities/about";
import { ProfileHeader } from "./components/ProfileHeader";
import { Intro } from "./components/Intro";
import { Timeline } from "./components/Timeline";
import { Projects } from "./components/ProjectCard";
import styles from "./AboutView.module.css";

export function AboutView({ about }: { about: AboutData }) {
  return (
    <div className="wrap">
      <div className={styles.body}>
        <ProfileHeader
          role={about.profile.role}
          src={about.profile.src}
          alt={about.profile.alt}
        />
        <Intro lines={about.intro} />
        <h2>이력</h2>
        <Timeline items={about.timeline} />
        <h2>프로젝트</h2>
        <Projects items={about.projects} />
      </div>
    </div>
  );
}
