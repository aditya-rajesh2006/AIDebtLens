import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Loader2, Sparkles, FileCode, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ===== STARTER DATASET: AI-GENERATED CODE SAMPLES =====
const AI_SAMPLES = [
  {
    filename: "ai-utils.ts",
    language: "typescript",
    code: `// Utility functions for data processing
export function processData(data: any[]): any[] {
  const result = data.filter((item) => {
    if (item !== null && item !== undefined) {
      if (typeof item === 'object') {
        if (Object.keys(item).length > 0) {
          return true;
        }
        return false;
      }
      return true;
    }
    return false;
  });
  return result.map((item) => {
    const processedItem = { ...item };
    if (processedItem.timestamp) {
      processedItem.formattedDate = new Date(processedItem.timestamp).toISOString();
    }
    if (processedItem.name) {
      processedItem.displayName = processedItem.name.charAt(0).toUpperCase() + processedItem.name.slice(1);
    }
    return processedItem;
  });
}

export function validateInput(input: string): boolean {
  if (input === null || input === undefined) {
    return false;
  }
  if (typeof input !== 'string') {
    return false;
  }
  if (input.trim().length === 0) {
    return false;
  }
  if (input.length > 1000) {
    return false;
  }
  return true;
}

export function formatResponse(data: any, status: string): { data: any; status: string; timestamp: string; success: boolean } {
  return {
    data: data,
    status: status,
    timestamp: new Date().toISOString(),
    success: status === 'ok',
  };
}`,
  },
  {
    filename: "ai-api-handler.ts",
    language: "typescript",
    code: `// API request handler with error handling
import { Request, Response } from 'express';

interface ApiResponse {
  success: boolean;
  data: any;
  error: string | null;
  timestamp: string;
}

export async function handleApiRequest(req: Request, res: Response): Promise<void> {
  try {
    // Validate the request method
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).json({
        success: false,
        data: null,
        error: 'Method not allowed',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate the request body
    if (req.method === 'POST') {
      if (!req.body) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Request body is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Process the request
    const result = await processRequest(req);

    // Return the response
    res.status(200).json({
      success: true,
      data: result,
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Handle any errors that occur during processing
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({
      success: false,
      data: null,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

async function processRequest(req: Request): Promise<any> {
  const data = req.body || {};
  const processedData = Object.keys(data).reduce((acc: any, key: string) => {
    acc[key] = typeof data[key] === 'string' ? data[key].trim() : data[key];
    return acc;
  }, {});
  return processedData;
}`,
  },
  {
    filename: "ai-config-manager.py",
    language: "python",
    code: `# Configuration management module
import json
import os
from typing import Any, Dict, Optional

class ConfigManager:
    """A class to manage application configuration settings."""
    
    def __init__(self, config_path: str = "config.json"):
        """Initialize the ConfigManager with the specified config file path."""
        self.config_path = config_path
        self.config: Dict[str, Any] = {}
        self.load_config()
    
    def load_config(self) -> None:
        """Load configuration from the config file."""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as config_file:
                    self.config = json.load(config_file)
            else:
                self.config = self._get_default_config()
                self.save_config()
        except json.JSONDecodeError:
            self.config = self._get_default_config()
            self.save_config()
    
    def save_config(self) -> None:
        """Save the current configuration to the config file."""
        with open(self.config_path, 'w') as config_file:
            json.dump(self.config, config_file, indent=2)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value by key."""
        return self.config.get(key, default)
    
    def set(self, key: str, value: Any) -> None:
        """Set a configuration value."""
        self.config[key] = value
        self.save_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Return the default configuration settings."""
        return {
            "app_name": "Application",
            "version": "1.0.0",
            "debug": False,
            "log_level": "INFO",
            "max_retries": 3,
            "timeout": 30,
        }`,
  },
  {
    filename: "ai-react-component.tsx",
    language: "typescript",
    code: `import React, { useState, useEffect } from 'react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserListProps {
  title: string;
  onUserSelect: (user: UserData) => void;
}

const UserList: React.FC<UserListProps> = ({ title, onUserSelect }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="user-list-container">
      <h2 className="user-list-title">{title}</h2>
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <ul className="user-list">
        {filteredUsers.map((user) => (
          <li key={user.id} onClick={() => onUserSelect(user)} className="user-item">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
            <span className="user-role">{user.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;`,
  },
  {
    filename: "ai-sort-algorithms.js",
    language: "javascript",
    code: `// Sorting algorithm implementations
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] <= right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }
  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }
  const temp = arr[i + 1];
  arr[i + 1] = arr[high];
  arr[high] = temp;
  return i + 1;
}

module.exports = { bubbleSort, mergeSort, quickSort };`,
  },
];

// ===== STARTER DATASET: HUMAN-WRITTEN CODE SAMPLES =====
const HUMAN_SAMPLES = [
  {
    filename: "cache.ts",
    language: "typescript",
    code: `const cache = new Map<string, { val: unknown; exp: number }>();

export function get<T>(k: string): T | undefined {
  const e = cache.get(k);
  if (!e) return;
  if (Date.now() > e.exp) { cache.delete(k); return; }
  return e.val as T;
}

export const set = (k: string, v: unknown, ttl = 60_000) =>
  cache.set(k, { val: v, exp: Date.now() + ttl });

export const del = (k: string) => cache.delete(k);
export const clear = () => cache.clear();
export const size = () => cache.size;`,
  },
  {
    filename: "debounce.ts",
    language: "typescript",
    code: `export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}`,
  },
  {
    filename: "router.py",
    language: "python",
    code: `from functools import lru_cache
import re

_routes: list[tuple[re.Pattern, callable]] = []

def route(path: str):
    pat = re.compile("^" + re.sub(r":(\w+)", r"(?P<\\1>[^/]+)", path) + "$")
    def dec(fn):
        _routes.append((pat, fn))
        return fn
    return dec

def dispatch(url: str):
    for pat, handler in _routes:
        m = pat.match(url)
        if m:
            return handler(**m.groupdict())
    raise ValueError(f"no route for {url}")`,
  },
  {
    filename: "EventBus.tsx",
    language: "typescript",
    code: `import { useEffect, useRef, useCallback } from "react";

type Listener = (...args: any[]) => void;
const bus = new Map<string, Set<Listener>>();

export const emit = (ev: string, ...args: any[]) =>
  bus.get(ev)?.forEach(fn => fn(...args));

export function useEvent(ev: string, handler: Listener) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const fn: Listener = (...a) => ref.current(...a);
    if (!bus.has(ev)) bus.set(ev, new Set());
    bus.get(ev)!.add(fn);
    return () => { bus.get(ev)?.delete(fn); };
  }, [ev]);
}`,
  },
  {
    filename: "linked-list.js",
    language: "javascript",
    code: `class Node {
  constructor(v, next = null) { this.v = v; this.next = next; }
}

class LinkedList {
  #head = null; #len = 0;

  push(v) { this.#head = new Node(v, this.#head); this.#len++; }

  pop() {
    if (!this.#head) return;
    const v = this.#head.v;
    this.#head = this.#head.next;
    this.#len--;
    return v;
  }

  find(pred) {
    for (let n = this.#head; n; n = n.next)
      if (pred(n.v)) return n.v;
  }

  *[Symbol.iterator]() {
    for (let n = this.#head; n; n = n.next) yield n.v;
  }

  get length() { return this.#len; }
}

module.exports = LinkedList;`,
  },
];

const STARTER_PACKS = [
  {
    id: "ai-patterns",
    name: "AI-Generated Patterns",
    desc: "5 typical AI-generated code samples (verbose, over-commented, repetitive)",
    icon: Sparkles,
    color: "text-destructive",
    label: "ai" as const,
    samples: AI_SAMPLES,
    count: AI_SAMPLES.length,
  },
  {
    id: "human-patterns",
    name: "Human-Written Patterns",
    desc: "5 human-authored code samples (concise, idiomatic, terse)",
    icon: FileCode,
    color: "text-neon-green",
    label: "human" as const,
    samples: HUMAN_SAMPLES,
    count: HUMAN_SAMPLES.length,
  },
];

interface Props {
  onSamplesAdded: () => void;
}

export default function StarterDatasets({ onSamplesAdded }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const importPack = async (pack: typeof STARTER_PACKS[0]) => {
    setLoading(pack.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in first");

      const samples = pack.samples.map(s => ({
        code: s.code,
        label: pack.label,
        filename: s.filename,
        language: s.language,
        source: "starter-pack",
      }));

      const { data, error } = await supabase.functions.invoke("train-cognitive-model", {
        body: { action: "add-samples", samples },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Pack imported!", description: `${data.inserted} ${pack.label} samples added.` });
      onSamplesAdded();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const importAll = async () => {
    setLoading("all");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in first");

      const allSamples = STARTER_PACKS.flatMap(pack =>
        pack.samples.map(s => ({
          code: s.code,
          label: pack.label,
          filename: s.filename,
          language: s.language,
          source: "starter-pack",
        }))
      );

      const { data, error } = await supabase.functions.invoke("train-cognitive-model", {
        body: { action: "add-samples", samples: allSamples },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "All packs imported!", description: `${data.inserted} samples added.` });
      onSamplesAdded();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 backdrop-blur-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-accent" /> Starter Dataset Packs
        </h4>
        <button
          onClick={importAll}
          disabled={!!loading}
          className="rounded-lg bg-accent px-3 py-1.5 text-[10px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading === "all" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          Import All (10 samples)
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Bootstrap your model with curated code samples. Import both packs for balanced training data.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {STARTER_PACKS.map(pack => (
          <motion.div
            key={pack.id}
            whileHover={{ y: -2 }}
            className="rounded-lg border border-border bg-card/60 p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <pack.icon className={`h-4 w-4 ${pack.color}`} />
              <span className="text-xs font-semibold text-foreground">{pack.name}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{pack.desc}</p>
            <button
              onClick={() => importPack(pack)}
              disabled={!!loading}
              className="rounded-md border border-border px-3 py-1 text-[10px] font-medium hover:bg-secondary/30 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading === pack.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Import {pack.count} samples
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
