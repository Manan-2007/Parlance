import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { SpaceId } from "@/community/model";
import { NotFoundPage } from "../NotFoundPage";
import { SPACE_STYLE, SPACE_TITLE, SpaceChip } from "./parts";
import { ThreadList } from "./ThreadList";

const DESCRIPTIONS: Record<SpaceId, string> = {
  everyday: "Shops, travel, neighbours, banks and getting things done.",
  work: "Interviews, workplace access, interpreters at work, careers.",
  study: "School, college, exam support, ISL in the classroom.",
  health: "Doctors, hospitals, hearing aids, implants and feeling well.",
  rights: "UDID card, disability certificate, schemes and your rights. Always check the official source too.",
  family: "Hearing families, CODAs, relationships, raising children.",
  "learn-isl": "Regional signs, new words, finding practice partners.",
  tech: "Captions, video calls, apps and phones that work for you.",
  meetups: "Meet in person. When you are there, the host opens a live room and everyone joins with the code.",
};

export function SpacePage() {
  const { spaceId } = useParams();
  const space = spaceId && spaceId in SPACE_STYLE ? (spaceId as SpaceId) : null;
  useDocumentTitle(space ? `${SPACE_TITLE[space]} · Community` : "Community");
  if (!space) return <NotFoundPage />;
  const newPost = `/app/community/new?space=${space}${space === "meetups" ? "&kind=meetup" : ""}`;

  return (
    <div className="container-app max-w-4xl py-8 sm:py-12">
      <Link to="/app/community" className="inline-flex items-center gap-1.5 text-sm font-bold text-royal hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Community
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <SpaceChip space={space} className="size-14 [&_svg]:size-7" />
          <div className="min-w-0">
            <h1 className="text-[2.25rem] leading-[1.05] font-extrabold tracking-[-0.045em] text-navy sm:text-[2.75rem]">{SPACE_TITLE[space]}</h1>
            <p className="mt-2 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">{DESCRIPTIONS[space]}</p>
          </div>
        </div>
        <Link to={newPost} className={buttonClasses({ variant: "primary" })}>
          <Plus className="size-4" aria-hidden /> {space === "meetups" ? "Plan a meetup" : "New post"}
        </Link>
      </div>
      <div className="mt-6">
        <ThreadList
          space={space}
          initialSort={space === "meetups" ? "meetups" : "active"}
          emptyAction={
            <Link to={newPost} className={buttonClasses({ size: "sm" })}>
              {space === "meetups" ? "Plan the first meetup" : "Write the first post"}
            </Link>
          }
        />
      </div>
    </div>
  );
}
