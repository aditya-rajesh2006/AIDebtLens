import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, LogOut, Menu, User, X } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl px-4 surface-panel glow-panel">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
            <Brain className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">AI Debt</p>
            <p className="text-sm font-semibold text-foreground">Lens</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative rounded-xl px-4 py-2 text-sm transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl border border-primary/20 bg-primary/10"
                    transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-xl px-3 py-2 text-right surface-soft">
                <p className="max-w-[140px] truncate text-xs font-medium text-foreground">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Signed in</p>
              </div>
              <button
                onClick={signOut}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:border-destructive/35 hover:text-destructive surface-soft"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:translate-y-[-1px] hover:opacity-95 md:inline-flex"
            >
              <User className="h-4 w-4" />
              Sign In
            </Link>
          )}

          <button className="ml-1 text-foreground md:hidden" onClick={() => setOpen((prev) => !prev)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-3 max-w-7xl rounded-2xl p-3 glow-panel surface-panel md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-4 py-3 text-sm ${
                location.pathname === link.to
                  ? "border border-primary/20 bg-primary/10 text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <button
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className="mt-2 block w-full rounded-xl px-4 py-3 text-left text-sm text-destructive"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
            >
              Sign In
            </Link>
          )}
        </motion.div>
      )}
    </nav>
  );
}
