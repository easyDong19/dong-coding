import { MDXContent } from "@/shared/mdx/MDXContent";
import type { About } from "@/entities/about";
import { aboutComponents } from "./lib/mdx-components";
import styles from "./AboutView.module.css";

export function AboutView({ about }: { about: About }) {
  return (
    <div className="wrap">
      <div className={styles.body}>
        <MDXContent code={about.body} components={aboutComponents} />
      </div>
    </div>
  );
}
