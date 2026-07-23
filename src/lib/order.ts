import { SAVED_PRODUCTS, type SavedProduct } from "./favorites-content";

export type Order = {
  id: string;
  placedAt: string;
  items: { id: string; qty: number }[];
  total: number;
  subtotal: number;
  gst: number;
  address: {
    id: string;
    label: string;
    name: string;
    line: string;
    phone: string;
  };
  method: string;
};

export function getLastOrder(): Order | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("skinpop.lastOrder");
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

export function orderDetailedItems(order: Order): { product: SavedProduct; qty: number }[] {
  return order.items
    .map((i) => {
      const p = SAVED_PRODUCTS.find((x) => x.id === i.id);
      return p ? { product: p, qty: i.qty } : null;
    })
    .filter((x): x is { product: SavedProduct; qty: number } => x !== null);
}
