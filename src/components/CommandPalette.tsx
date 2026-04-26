import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BarChart3, Home, Info, LogIn, FileCode, Zap } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const analyze = (repo: string) => {
    navigate(`/dashboard?repo=${encodeURIComponent(repo)}`);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, actions, or repos..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/")}>
            <Home className="mr-2 h-4 w-4" /> Home
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard")}>
            <BarChart3 className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/about")}>
            <Info className="mr-2 h-4 w-4" /> About
          </CommandItem>
          <CommandItem onSelect={() => go("/auth")}>
            <LogIn className="mr-2 h-4 w-4" /> Sign In
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Analyze">
          <CommandItem onSelect={() => analyze("https://github.com/facebook/react")}>
            <Zap className="mr-2 h-4 w-4" /> Analyze facebook/react
          </CommandItem>
          <CommandItem onSelect={() => analyze("https://github.com/vercel/next.js")}>
            <Zap className="mr-2 h-4 w-4" /> Analyze vercel/next.js
          </CommandItem>
          <CommandItem onSelect={() => analyze("https://github.com/microsoft/vscode")}>
            <Zap className="mr-2 h-4 w-4" /> Analyze microsoft/vscode
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
