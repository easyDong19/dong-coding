import { ProfileHeader } from "../components/ProfileHeader";
import { Intro } from "../components/Intro";
import { Timeline } from "../components/Timeline";
import { Projects } from "../components/ProjectCard";
import type { MDXComponentMap } from "@/shared/mdx/MDXContent";

// about.mdx에 주입할 커스텀 컴포넌트 (pages-plan §4)
export const aboutComponents = {
  ProfileHeader,
  Intro,
  Timeline,
  Projects,
} as unknown as MDXComponentMap;
