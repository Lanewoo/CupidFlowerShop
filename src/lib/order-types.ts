export type OrderStatus = "pending" | "cancelled" | "completed";

export type OrderLine = {
  flowerId: string;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  userEmail: string;
  phoneSnapshot: string;
  addressSnapshot: string;
  items: OrderLine[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};
