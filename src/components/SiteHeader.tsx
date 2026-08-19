import { Link } from "@tanstack/react-router";
import { HeartPulse, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <HeartPulse className="size-5" aria-hidden />
          </span>
          <span className="text-base font-semibold tracking-tight">MediFind AP</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 text-sm sm:flex">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 bg-accent text-accent-foreground" }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/results"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 bg-accent text-accent-foreground" }}
            search={{}}
          >
            Nearby hospitals
          </Link>
        </nav>
        <Button asChild variant="destructive" size="sm" className="ml-auto gap-1.5">
          <a href="tel:108">
            <Phone className="size-4" aria-hidden />
            Emergency 108
          </a>
        </Button>
      </div>
    </header>
  );
}
