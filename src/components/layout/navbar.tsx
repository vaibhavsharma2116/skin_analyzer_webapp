import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/sknpop-logo.png.asset.json";


export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center" aria-label="SKNPOP Skincare">
          <img
            src={logoAsset.url}
            alt="SKNPOP Skincare"
            className="h-8 w-auto sm:h-9"
            width={160}
            height={40}
          />
        </Link>


        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#cta" className="transition-colors hover:text-foreground">Get started</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button size="sm" asChild className="rounded-full">
            <Link to="/auth">Start free scan</Link>
          </Button>
        </div>

      </div>
    </header>
  );
}
