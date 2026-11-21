import { useEffect } from "react";

export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} · Parlance` : "Parlance · Learn and translate Indian Sign Language";
  }, [title]);
}
