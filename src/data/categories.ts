export type Category = { label: string; slug: string };

// Unified site-wide category list. Update here to propagate everywhere.
export const SITE_CATEGORIES: Category[] = [
  { label: "Men", slug: "men" },
  { label: "Women", slug: "women" },
  { label: "Authentic", slug: "authentic" },
  { label: "Higher Grade", slug: "higher-grade" },
];

export const COLLECTION_TABS: Category[] = [
  { label: "All", slug: "all" },
  ...SITE_CATEGORIES,
];