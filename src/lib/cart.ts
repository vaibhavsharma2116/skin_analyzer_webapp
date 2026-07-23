import { useEffect, useState, useCallback } from "react";
import { SAVED_PRODUCTS, type SavedProduct } from "./favorites-content";

const KEY = "skinpop.cart.v1";

export type CartItem = { id: string; qty: number };

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("skinpop:cart"));
}

export function priceValue(p: SavedProduct): number {
  return Number(p.price.replace(/[^\d.]/g, "")) || 0;
}

export function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const on = () => setItems(read());
    window.addEventListener("skinpop:cart", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("skinpop:cart", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const add = useCallback((id: string, qty = 1) => {
    const cur = read();
    const idx = cur.findIndex((c) => c.id === id);
    if (idx >= 0) cur[idx].qty += qty;
    else cur.push({ id, qty });
    write(cur);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    let cur = read();
    if (qty <= 0) cur = cur.filter((c) => c.id !== id);
    else cur = cur.map((c) => (c.id === id ? { ...c, qty } : c));
    write(cur);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((c) => c.id !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  const detailed = items
    .map((c) => {
      const p = SAVED_PRODUCTS.find((x) => x.id === c.id);
      return p ? { product: p, qty: c.qty } : null;
    })
    .filter((x): x is { product: SavedProduct; qty: number } => x !== null);

  const subtotal = detailed.reduce((s, i) => s + priceValue(i.product) * i.qty, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal;
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, detailed, add, setQty, remove, clear, subtotal, gst, total, count };
}

export function getProduct(id: string): SavedProduct | undefined {
  return SAVED_PRODUCTS.find((p) => p.id === id);
}
