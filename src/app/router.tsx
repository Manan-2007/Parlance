import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { PageLoader } from "./PageLoader";
import { RootLayout } from "./RootLayout";
import { RouteError } from "./RouteError";
import { routeGate, shouldGate } from "./routeGate";

/* Every page is its own chunk: the landing page never downloads MediaPipe,
   and the camera workspace never downloads the landing illustrations. */
export const router = createBrowserRouter([
  {
    Component: RootLayout,
    loader: routeGate,
    shouldRevalidate: shouldGate,
    ErrorBoundary: RouteError,
    HydrateFallback: PageLoader,
    children: [
      {
        path: "/",
        lazy: async () => ({ Component: (await import("@/features/landing/LandingPage")).LandingPage }),
      },
      {
        path: "/app",
        Component: AppShell,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import("@/features/home/HomePage")).HomePage }),
          },
          {
            path: "cards",
            lazy: async () => ({ Component: (await import("@/features/cards/CardsPage")).CardsPage }),
          },
          {
            path: "cards/visit",
            lazy: async () => ({ Component: (await import("@/features/cards/VisitPage")).VisitPage }),
          },
          {
            path: "cards/visit/view",
            lazy: async () => ({ Component: (await import("@/features/cards/VisitPage")).SharedVisitPage }),
          },
          {
            path: "cards/:placeId",
            lazy: async () => ({ Component: (await import("@/features/cards/PlacePage")).PlacePage }),
          },
          {
            path: "sound-alerts",
            lazy: async () => ({ Component: (await import("@/features/sound-alerts/SoundAlertsPage")).SoundAlertsPage }),
          },
          {
            path: "learn/work/:pathId",
            lazy: async () => ({ Component: (await import("@/features/learn/WorkPathPage")).WorkPathPage }),
          },
          {
            path: "learn/work/:pathId/lesson",
            lazy: async () => ({ Component: (await import("@/features/learn/LessonPage")).LessonPage }),
          },
          {
            path: "learn",
            lazy: async () => ({ Component: (await import("@/features/learn/LearnPage")).LearnPage }),
          },
          {
            path: "learn/review",
            lazy: async () => ({ Component: (await import("@/features/learn/ReviewPage")).ReviewPage }),
          },
          {
            path: "learn/signs",
            lazy: async () => ({ Component: (await import("@/features/learn/SignLibraryPage")).SignLibraryPage }),
          },
          {
            path: "learn/signs/:gloss",
            lazy: async () => ({ Component: (await import("@/features/learn/SignPage")).SignPage }),
          },
          {
            path: "learn/phrase/:phraseId",
            lazy: async () => ({ Component: (await import("@/features/learn/LessonPage")).LessonPage }),
          },
          {
            path: "learn/together",
            lazy: async () => ({ Component: (await import("@/features/learn/TogetherPage")).TogetherPage }),
          },
          {
            path: "learn/fingerspelling",
            lazy: async () => ({ Component: (await import("@/features/learn/FingerspellingPage")).FingerspellingPage }),
          },
          {
            path: "learn/deck",
            lazy: async () => ({ Component: (await import("@/features/learn/DeckPage")).SharedDeckPage }),
          },
          {
            path: "learn/decks/:deckId",
            lazy: async () => ({ Component: (await import("@/features/learn/DeckPage")).DeckPage }),
          },
          {
            path: "learn/decks/:deckId/lesson",
            lazy: async () => ({ Component: (await import("@/features/learn/LessonPage")).LessonPage }),
          },
          {
            path: "learn/reader",
            lazy: async () => ({ Component: (await import("@/features/learn/ReaderPage")).ReaderPage }),
          },
          {
            path: "learn/check-signs",
            lazy: async () => ({ Component: (await import("@/features/learn/CheckSignsPage")).CheckSignsPage }),
          },
          {
            path: "learn/checks",
            lazy: async () => ({ Component: (await import("@/features/learn/CheckSignsPage")).SharedChecksPage }),
          },
          {
            path: "learn/teach",
            lazy: async () => ({ Component: (await import("@/features/teach/TeachPage")).TeachPage }),
          },
          {
            path: "learn/teach/record",
            lazy: async () => ({ Component: (await import("@/features/teach/RecordPage")).RecordPage }),
          },
          {
            path: "learn/teach/decks/:deckId",
            lazy: async () => ({ Component: (await import("@/features/teach/DeckEditorPage")).DeckEditorPage }),
          },
          {
            path: "learn/:unitId",
            lazy: async () => ({ Component: (await import("@/features/learn/UnitPage")).UnitPage }),
          },
          {
            path: "learn/:unitId/:lessonId",
            lazy: async () => ({ Component: (await import("@/features/learn/LessonPage")).LessonPage }),
          },
          {
            path: "speech-to-sign",
            lazy: async () => ({
              Component: (await import("@/features/speech-to-sign/SpeechToSignPage")).SpeechToSignPage,
            }),
          },
          {
            path: "sign-to-text",
            lazy: async () => ({
              Component: (await import("@/features/sign-to-text/SignToTextPage")).SignToTextPage,
            }),
          },
          {
            path: "history",
            lazy: async () => ({ Component: (await import("@/features/history/HistoryPage")).HistoryPage }),
          },
          {
            path: "settings",
            lazy: async () => ({ Component: (await import("@/features/settings/SettingsPage")).SettingsPage }),
          },
          {
            path: "learn/alphabet",
            lazy: async () => ({ Component: (await import("@/features/learn/AlphabetPage")).AlphabetPage }),
          },
          {
            path: "help",
            lazy: async () => ({ Component: (await import("@/features/help/HelpPage")).HelpPage }),
          },
        ],
      },
      {
        // The signer alone, opened by the Parlance phone app.
        path: "/embed/sign",
        lazy: async () => ({ Component: (await import("@/features/embed/EmbedSignPage")).EmbedSignPage }),
      },
      {
        // One Learn sign or phrase, opened by the Parlance phone app's lessons.
        path: "/embed/learn",
        lazy: async () => ({ Component: (await import("@/features/embed/EmbedLearnPage")).EmbedLearnPage }),
      },
      {
        path: "*",
        lazy: async () => ({ Component: (await import("@/features/NotFoundPage")).NotFoundPage }),
      },
    ],
  },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });
