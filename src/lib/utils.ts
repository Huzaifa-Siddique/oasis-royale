export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function getTableId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("oasis_table_id");
}

export function setTableId(id: string): void {
  localStorage.setItem("oasis_table_id", id);
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return "1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  return digits;
}
