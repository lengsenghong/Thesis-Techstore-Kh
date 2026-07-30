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
  studentVerificationStatus?:  StudentVerificationStatus;
  createdAt:                   string;
  updatedAt?:                  string;
  lastSignedIn?:               string;
}

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
  subtotal?:      number;
  selectedColor?: string;
  // FIX: cancelReason was incorrectly placed on OrderItem — it's an
  // order-level field (a single order has one cancellation reason, not
  // per-item). Moved down to the Order interface where it belongs.
}

export interface Order {
  id:               number;
  // FIX: orderNumber is always present on a created order — the backend
  // generates it synchronously in OrderService.createOrder() before the
  // order is ever returned to the client, so there's no real-world case
  // where an Order exists without one. Making it required removes the
  // `string | undefined` errors at every call site that passes
  // order.orderNumber into something expecting `string` (e.g. the cancel
  // modal heading, copy-to-clipboard, toast messages).
  orderNumber:      string;
  userId:           number;
  status:           OrderStatus;
  subtotal?:        number;
  discount?:        number;
  shipping?:        number;
  total?:           number;
  shippingAddress?: ShippingAddress | Record<string, string>;
  paymentMethod:    PaymentMethod;
  paymentStatus?:   PaymentStatus;
  notes?:           string;
  items?:           OrderItem[];
  // FIX: cancelReason added here — this is what was missing and causing
  // "Property 'cancelReason' does not exist on type 'Order'". Optional,
  // since it's only ever populated once status is "cancelled"/"refunded".
  cancelReason?:    string;
  createdAt:        string;
  updatedAt?:       string;
}

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
  isVerifiedPurchase?:  boolean;
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