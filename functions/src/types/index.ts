import { Transaction } from "./Transaction";

export interface Category {
  // the name of the category
  name?: string;

  // the icon font of the category
  icon?: string;

  // the id of the category
  id: string;
}

export interface CategorySummary extends Category {
  // the amount
  amount: number;

  transactions: Transaction[];
}

export interface _Category {
  [id: string]: Category;
}

export interface CategoryMap {
  income: _Category;
  expense: _Category;
}
