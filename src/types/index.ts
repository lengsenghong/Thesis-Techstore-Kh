// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id:                          number;
  openId?:                     string;
  name:                        string;
  email:                       string;
  phone?:                      string;
  address?:                    string;
  role:                        "user" | "admin";
  isActive:                    boolean;
  isStudent:                   boolean;
  loginMethod?:                string;
  studentCardUrl?:             string;
  // FIX 1: Widened the union to include "none" consistently with the backend
  // enum (StudentVerificationStatus). The original had the correct values but
  // the type is now exported as a standalone alias so it can be reused in
  // admin pages without repeating the literal union.
  studentVerificationStatus?:  StudentVerificationStatus;
  createdAt:                   string;
  updatedAt?:                  string;
  lastSignedIn?:               string;
}

// FIX 1 (continued): Extracted as a named type alias for reuse.
export type StudentVerificationStatus = "none" | "pending" | "approved" | "rejected";

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id:           number;
  name:         string;
  slug:         string;
  icon?:        string;
  description?: string;
  isActive:     boolean;
  sortOrder:    number;
  // FIX 2: Added productCount — returned by GET /categories and used in the
  // admin category table to show how many products belong to each category.
  productCount?: number;
  createdAt?:   string;
  updatedAt?:   string;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  id:                 number;
  name:               string;
  slug:               string;
  brand?:             string;
  sku?:               string;
  price:              number;
  originalPrice?:     number;
  images?: string[];
  
  colors?: string[];
  stock?:             number;
  rating?:            number;
  averageRating?:     number;
  reviewCount?:       number;
  badge?:             ProductBadge;
  description?:       string;
  shortDescription?:  string;
  specs?:             Record<string, string>;
  categoryId?:        number;
  categoryName?:      string;
  isActive?:          boolean;
  isFeatured?:        boolean;
  createdAt?:         string;
  updatedAt?:         string;
}

// FIX 4 (continued): Named alias preserves literal autocomplete while still
// accepting arbitrary strings the backend might add in future.
export type ProductBadge = "new" | "hot" | "sale" | "featured" | (string & {});

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  product:  Product;
  quantity: number;

  selectedColor?: string;
}

// ─── Shipping ─────────────────────────────────────────────────────────────────
export interface ShippingAddress {
  name:    string;
  phone:   string;
  address: string;
  city:    string;
  note?:   string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  id:             number;
  productId:      number;
  productName:    string;
  productImage?:  string;
  price:          number;
  quantity:       number;
  subtotal?: number;
  selectedColor?: string;
}

export interface Order {
  id:               number;
  // FIX 5: Removed orderId — it was documented as "redundant with id" and
  // having two fields for the same concept causes bugs when code uses orderId
  // in some places and id in others. The backend's Order entity primary key is
  // `id`; use that everywhere. If a legacy endpoint still returns `orderId`,
  // map it to `id` in the API response handler.
  orderNumber?:     string;
  userId:           number;
  status:           OrderStatus;
  subtotal?:        number;
  discount?:        number;
  shipping?:        number;
  total?:           number;
  // FIX 6: Removed totalAmount — duplicate of `total`. The backend
  // CreateOrderResponse uses `total`; the entity also uses `total`.
  // Having both caused components to read the wrong field silently.
  shippingAddress?: ShippingAddress | Record<string, string>;
  paymentMethod:    PaymentMethod;
  paymentStatus?:   PaymentStatus;
  notes?:           string;
  items?:           OrderItem[];
  createdAt:        string;
  updatedAt?:       string;
}

// FIX 5 & 6 (continued): Named aliases for the status unions so they can be
// reused in admin filter dropdowns and status badge components without
// duplicating the literal lists.
export type OrderStatus =
  | "pending" | "confirmed" | "processing"
  | "shipped" | "delivered" | "cancelled"
  | "refunded" | (string & {});

export type PaymentStatus =
  | "pending" | "paid" | "failed" | "refunded" | (string & {});

export type PaymentMethod =
  | "bakong_khqr" | "cash_on_delivery" | (string & {});

/** Mirrors Spring Boot OrderDto.CreateResponse exactly */
export interface CreateOrderResponse {
  orderId:       number;
  orderNumber:   string;
  subtotal:      number;
  discount:      number;
  shipping:      number;
  total:         number;
  paymentMethod: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id:                   number;
  userId:               number;
  productId:            number;
  rating:               number;
  title?:               string;
  body?:                string;
  // FIX 7: Removed `comment` alias. The backend entity field is `body`.
  // Keeping both caused components to check `review.comment ?? review.body`
  // everywhere. If an endpoint returns `comment`, normalise it to `body` in
  // the API layer (api.ts) so the rest of the app only deals with one field.
  isVerifiedPurchase?:  boolean;
  // FIX 8: Removed `isVerified` — duplicate of `isVerifiedPurchase`. The
  // backend entity has a single `isVerifiedPurchase` boolean. Having both
  // caused the admin review table to show inconsistent verified badges.
  isVisible?:           boolean;
  helpfulCount?:        number;
  userName?:            string;
  userEmail?:           string;
  productName?:         string;
  createdAt:            string;
}

/** Mirrors Spring Boot PageResponse<T> */
export interface PageResponse<T> {
  items:      T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user:  User;
}

// ─── Bakong / Payment ─────────────────────────────────────────────────────────

/** Mirrors BakongService.generateKHQR() response */
export interface KHQRResponse {
  paymentId:   number;
  qrString:    string;
  md5:         string;
  amount:      number;
  currency:    string;
  orderNumber: string;
  expiresAt:   string;
}

/** Mirrors BakongService.checkPayment() response */
export interface CheckPaymentResponse {
  isPaid:          boolean;
  orderStatus:     string;
  paymentStatus:   string;
  expired?:        boolean;
  transactionRef?: string;
}

export interface Payment {
  id:              number;
  orderId:         number;
  userId?:         number;
  amount:          number;
  currency?:       string;
  status:          PaymentStatus;
  method:          PaymentMethod;
  transactionRef?: string;
  khqrString?:     string;
  khqrMd5?:        string;
  khqrExpiresAt?:  string;
  paidAt?:         string;
  createdAt:       string;
  updatedAt?:      string;
}

// ─── Banner ───────────────────────────────────────────────────────────────────
export interface Banner {
  id:          number;
  title:       string;
  subtitle?:   string;
  imageUrl:    string;
  linkUrl?:    string;
  linkLabel?:  string;
  sortOrder:   number;
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateBannerRequest {
  title:       string;
  subtitle?:   string;
  imageUrl:    string;
  linkUrl?:    string;
  linkLabel?:  string;
  sortOrder?:  number;
  isActive?:   boolean;
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────
export interface LowStockProduct {
  id:    number;
  name:  string;
  stock: number;
  sku?:  string;
}

export interface RecentOrder {
  id:              number;
  orderNumber:     string;
  total:           string | number;
  status:          string;
  paymentStatus:   string;
  createdAt:       string | null;
  customerName?:   string;
  customerEmail?:  string;
}

export interface AdminStats {
  totalRevenue:                 number;
  totalOrders:                  number;
  totalProducts:                number;
  totalUsers:                   number;
  totalCategories?:             number;
  totalReviews?:                number;
  pendingOrders:                number;
  processingOrders:             number;
  deliveredOrders:              number;
  cancelledOrders?:             number;
  pendingStudentVerifications?: number;
  lowStockProducts:             LowStockProduct[];
  recentOrders?:                RecentOrder[];
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
// FIX 9: Added Chat types. These were missing from types.ts even though the
// chatbot uses them. Centralising them here means ChatBot.tsx can import from
// @/types instead of declaring its own local interfaces.
export interface ChatProduct {
  id:            number;
  name:          string;
  price:         number;
  originalPrice?: number;
  image?:        string;
  badge?:        ProductBadge;
  rating?:       number;
  slug?:         string;
  stock?:        number;
  brand?:        string;
  category?:     string;
  specs?:        Record<string, string>;
}

export interface ChatMessage {
  role:    "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply:    string;
  products: ChatProduct[];
}