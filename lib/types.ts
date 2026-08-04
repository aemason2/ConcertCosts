export type Concert = {
  id: string;
  user_id: string;
  concert_name: string;
  artist: string;
  venue: string;
  city: string;
  state: string;
  concert_date: string;
  distance_from_home: number;
  hours_at_event: number;
  ticket_cost: number;
  ticket_fees: number;
  tax_cost: number;
  delivery_cost: number;
  parking_cost: number;
  food_drink_cost: number;
  merchandise_cost: number;
  lodging_cost: number;
  travel_cost: number;
  other_cost: number;
  fun_rating: number;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
};

export type ConcertInsert = Omit<Concert, "id" | "created_at">;

export const COST_FIELDS = [
  { key: "ticket_cost", label: "Ticket cost (base)" },
  { key: "ticket_fees", label: "Ticket fees" },
  { key: "tax_cost", label: "Taxes" },
  { key: "delivery_cost", label: "Delivery charges" },
  { key: "parking_cost", label: "Parking" },
  { key: "food_drink_cost", label: "Food & drink" },
  { key: "merchandise_cost", label: "Merchandise" },
  { key: "lodging_cost", label: "Hotel / lodging" },
  { key: "travel_cost", label: "Travel / gas" },
  { key: "other_cost", label: "Other" },
] as const;

export type CostFieldKey = (typeof COST_FIELDS)[number]["key"];
