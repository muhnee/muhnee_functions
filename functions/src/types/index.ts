export interface Category {
  // the name of the category
  name?: string;

  // the icon font of the category
  icon?: string;

  // the id of the category
  id: string;

  // the amount
  amount: number;
}

export interface _Category {
  [id: string]: Category;
}

export interface CategoryMap {
  income: _Category;
  expense: _Category;
}
