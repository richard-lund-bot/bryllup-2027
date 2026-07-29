export type Status = "ikke_startet" | "pagar" | "ferdig";
export type Prioritet = "lav" | "normal" | "hoy" | "kritisk";

export interface Task {
  id: string;
  title: string;
  category: string | null;
  status: Status;
  priority: Prioritet;
  due_date: string | null;
  assignee: string | null;
  notes: string | null;
  sort_order: number;
}

export interface BudgetItem {
  id: string;
  category: string | null;
  name: string;
  vendor: string | null;
  estimate: number;
  actual: number | null;
  deposit: number;
  paid: number;
  payment_status: "ikke_betalt" | "depositum_betalt" | "delbetalt" | "betalt";
  due_date: string | null;
  notes: string | null;
}

export interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  group_label: string | null;
  is_child: boolean;
  allergies: string | null;
  rsvp_status: "venter" | "kommer" | "kommer_ikke";
  song_wish: string | null;
  speech: boolean;
  gift: string | null;
  thank_you_sent: boolean;
  invite_sent: boolean;
  table_id: string | null;
  notes: string | null;
}

export interface SeatingTable {
  id: string;
  name: string;
  capacity: number;
  notes: string | null;
  sort_order: number;
}

export interface Milestone {
  id: string;
  month: string;
  title: string;
  description: string | null;
  done: boolean;
  sort_order: number;
}

export interface ScheduleItem {
  id: string;
  day: "fredag" | "lordag" | "sondag";
  time: string;
  duration_min: number | null;
  title: string;
  responsible: string | null;
  location: string | null;
  notes: string | null;
  sort_order: number;
}

export interface ModuleItem {
  id: string;
  module: string;
  title: string;
  status: Status;
  content: Record<string, unknown>;
  notes: string | null;
  sort_order: number;
}

export interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  price: number | null;
  category: string | null;
  reserved_by: string | null;
  reserved_at: string | null;
  active: boolean;
  sort_order: number;
}

export interface Rsvp {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  attending: boolean;
  num_adults: number;
  num_children: number;
  allergies: string | null;
  song_wish: string | null;
  message: string | null;
  processed: boolean;
  created_at: string;
}
