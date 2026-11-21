import { Outlet, ScrollRestoration } from "react-router-dom";
import { Toaster } from "@/components/ui/Toaster";
import { Preferences } from "./Preferences";
import { RouteTransition } from "./RouteTransition";

export function RootLayout() {
  return (
    <Preferences>
      <Outlet />
      <Toaster />
      <RouteTransition />
      <ScrollRestoration />
    </Preferences>
  );
}
