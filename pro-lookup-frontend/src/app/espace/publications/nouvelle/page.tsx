"use client";

import { SpaceHeading } from "@/components/space/SpaceShell";
import { PostEditor } from "@/components/space/PostEditor";

export default function NewPostPage() {
  return (
    <div>
      <SpaceHeading eyebrow="Publications" title="Nouvelle publication" lead="Votre publication sera visible par tout le monde, sans compte, dès que vous la publiez." />
      <PostEditor />
    </div>
  );
}
