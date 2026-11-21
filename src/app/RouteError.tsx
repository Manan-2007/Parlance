import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Pal } from "@/components/brand/Pal";
import { RainbowArch } from "@/components/brand/RainbowArch";

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Something went wrong.";
  return (
    <main id="main" className="container-page flex min-h-screen flex-col items-center justify-center bg-paper py-16 text-center">
      <div className="relative w-60" aria-hidden>
        <RainbowArch rings={5} opening={0.5} offset={5} className="w-full" />
        <Pal pose="rest" outfit="tangerine" skin="medium" hair="curly" className="absolute bottom-0 left-1/2 h-[64%] -translate-x-1/2" />
      </div>
      <h1 className="mt-7 text-4xl font-extrabold tracking-[-0.045em]">This page hit a problem</h1>
      <p className="mt-2 max-w-md text-ink-3">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => window.location.reload()} leading={<RefreshCw aria-hidden />}>
          Reload
        </Button>
        <ButtonLink to="/" variant="secondary">
          Go to home
        </ButtonLink>
      </div>
    </main>
  );
}
