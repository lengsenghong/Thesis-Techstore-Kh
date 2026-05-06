import axios from "axios";
import Cookies from "js-cookie";
import type {
  User, Product, Category, Order, Review, Payment,
  PageResponse, AuthResponse, KHQRResponse, CheckPaymentResponse,
  CreateBannerRequest, Banner, CreateOrderResponse, AdminStats,
} from "@/types";

const TOKEN_KEY = "techstore_token";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ── Interceptors ──────────────────────────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(err);
  }
);

// ── Token helpers ─────────────────────────────────────────────────────────────

export const setToken    = (token: string) =>
  Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: "strict" });
export const getToken    = () => Cookies.get(TOKEN_KEY);
export const removeToken = () => Cookies.remove(TOKEN_KEY);

// ── Re-export types so consumers can import from one place ────────────────────

export type {
  User, Product, Category, Order, Review, Payment,
  PageResponse, AuthResponse, KHQRResponse, CheckPaymentResponse,
  CreateOrderResponse, AdminStats,
};

// ─── Brand ────────────────────────────────────────────────────────────────────

export interface Brand {
  id:       number;
  name:     string;
  logoUrl?: string;
  isActive: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }): Promise<AuthResponse> =>
    api.post("/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }): Promise<AuthResponse> =>
    api.post("/auth/login", data).then((r) => r.data),

  me: (): Promise<User> =>
    api.get("/auth/me").then((r) => r.data),

  logout: (): Promise<void> =>
    api.post("/auth/logout").then(() => undefined),

  uploadStudentCard: (formData: FormData): Promise<{ message: string; studentCardUrl: string }> =>
    api
      .post("/auth/upload-student-card", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: Record<string, unknown>): Promise<PageResponse<Product>> =>
    api.get("/products", { params }).then((r) => r.data),

  getById: (id: number): Promise<Product> =>
    api.get(`/products/${id}`).then((r) => r.data),

  getBySlug: (slug: string): Promise<Product> =>
    api.get(`/products/slug/${slug}`).then((r) => r.data),

  search: (query: string, params?: Record<string, unknown>): Promise<PageResponse<Product>> =>
    api.get("/products/search", { params: { q: query, ...params } }).then((r) => r.data),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  // FIX: removed the erroneous `p0: { limit: number }` parameter — React Query
  // passes its own context object as the argument to queryFn, which does not
  // have a `limit` property, causing a TS mismatch. The endpoint takes no
  // required client-side params; any server-side defaults are handled by the
  // backend itself.
  list: (): Promise<Category[]> =>
    api.get("/categories").then((r) => r.data),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface CreateOrderRequest {
  items: {
    productId:     number;
    productName:   string;
    productImage?: string;
    price:         number;
    quantity:      number;
  }[];
  shippingAddress: {
    name:    string;
    phone:   string;
    address: string;
    city:    string;
    note?:   string;
  };
  paymentMethod: "bakong_khqr" | "cash_on_delivery";
  isStudent?:    boolean;
  notes?:        string;
}

export const ordersApi = {
  create: (data: CreateOrderRequest): Promise<CreateOrderResponse> =>
    api.post("/orders", data).then((r) => r.data),

  list: (): Promise<Order[]> =>
    api.get("/orders").then((r) => r.data),

  getById: (id: number): Promise<Order> =>
    api.get(`/orders/${id}`).then((r) => r.data),

  confirmCOD: (id: number): Promise<{ success: boolean }> =>
    api.post(`/orders/${id}/confirm-cod`).then((r) => r.data),

  generateKHQR: (id: number): Promise<KHQRResponse> =>
    api.post(`/orders/${id}/generate-khqr`).then((r) => r.data),

  checkPayment: (id: number): Promise<CheckPaymentResponse> =>
    api.get(`/orders/${id}/check-payment`).then((r) => r.data),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface CreateReviewRequest {
  productId: number;
  rating:    number;
  title?:    string;
  body:      string;
}

export const reviewsApi = {
  list: (productId: number, page = 1, limit = 10): Promise<PageResponse<Review>> =>
    api.get("/reviews", { params: { productId, page, limit } }).then((r) => r.data),

  canReview: (productId: number): Promise<{
    hasPurchased: boolean;
    hasReviewed:  boolean;
    canReview:    boolean;
  }> =>
    api.get("/reviews/can-review", { params: { productId } }).then((r) => r.data),

  create: (data: CreateReviewRequest): Promise<Review> =>
    api.post("/reviews", data).then((r) => r.data),

  markHelpful: (id: number): Promise<{ helpfulCount: number }> =>
    api.post(`/reviews/${id}/helpful`).then((r) => r.data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: (): Promise<AdminStats> =>
    api.get("/admin/stats").then((r) => r.data),

  products: {
    list: (params?: Record<string, unknown>): Promise<PageResponse<Product>> =>
      api.get("/admin/products", { params }).then((r) => r.data),
    create: (data: unknown): Promise<Product> =>
      api.post("/admin/products", data).then((r) => r.data),
    update: (id: number, data: unknown): Promise<Product> =>
      api.patch(`/admin/products/${id}`, data).then((r) => r.data),
    delete: (id: number): Promise<{ success: boolean }> =>
      api.delete(`/admin/products/${id}`).then((r) => r.data),
  },

  categories: {
    list: (): Promise<Category[]> =>
      api.get("/admin/categories").then((r) => r.data),
    create: (data: unknown): Promise<Category> =>
      api.post("/admin/categories", data).then((r) => r.data),
    update: (id: number, data: unknown): Promise<Category> =>
      api.patch(`/admin/categories/${id}`, data).then((r) => r.data),
    delete: (id: number): Promise<void> =>
      api.delete(`/admin/categories/${id}`).then((r) => r.data),
  },

  orders: {
    list: (params?: Record<string, unknown>): Promise<PageResponse<Order>> =>
      api.get("/admin/orders", { params }).then((r) => r.data),
    getById: (id: number): Promise<Order> =>
      api.get(`/admin/orders/${id}`).then((r) => r.data),
    updateStatus: (id: number, data: unknown): Promise<Order> =>
      api.patch(`/admin/orders/${id}/status`, data).then((r) => r.data),
  },

  users: {
    list: (params?: Record<string, unknown>): Promise<PageResponse<User>> =>
      api.get("/admin/users", { params }).then((r) => r.data),
    updateRole: (id: number, role: string): Promise<User> =>
      api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
    toggleActive: (id: number, isActive: boolean): Promise<User> =>
      api.patch(`/admin/users/${id}/active`, { isActive }).then((r) => r.data),
    listPendingVerification: (): Promise<User[]> =>
      api.get("/admin/users/pending-verification").then((r) => r.data),
    verifyStudent: (
      id: number,
      action: "approve" | "reject"
    ): Promise<{ id: number; status: string }> =>
      // FIX 6: verifyStudent was sending `null` as the request body with action
      // as a query param. Spring Boot's @RequestBody will reject a null body
      // with HTTP 400. Changed to send action inside the JSON body instead,
      // which matches the standard @RequestBody pattern on the backend.
      api.post(`/admin/users/${id}/verify-student`, { action }).then((r) => r.data),
  },

  reviews: {
    list: (params?: Record<string, unknown>): Promise<PageResponse<Review>> =>
      api.get("/admin/reviews", { params }).then((r) => r.data),
    toggleVisibility: (id: number, isVisible: boolean): Promise<Review> =>
      api.patch(`/admin/reviews/${id}/visibility`, { isVisible }).then((r) => r.data),
    delete: (id: number): Promise<{ success: boolean }> =>
      api.delete(`/admin/reviews/${id}`).then((r) => r.data),
  },

  payments: {
    list: (params?: Record<string, unknown>): Promise<PageResponse<Payment>> =>
      api.get("/admin/payments", { params }).then((r) => r.data),
    updateStatus: (id: number, data: unknown): Promise<Payment> =>
      api.patch(`/admin/payments/${id}/status`, data).then((r) => r.data),
  },

  brands: {
    list: (): Promise<Brand[]> =>
      api.get("/admin/brands").then((r) => r.data),
    create: (data: { name: string; logoUrl?: string }): Promise<Brand> =>
      api.post("/admin/brands", data).then((r) => r.data),
    update: (id: number, data: { name?: string; logoUrl?: string; isActive?: boolean }): Promise<Brand> =>
      api.patch(`/admin/brands/${id}`, data).then((r) => r.data),
    delete: (id: number): Promise<{ success: boolean }> =>
      api.delete(`/admin/brands/${id}`).then((r) => r.data),
  },

  banners: {
    list: (): Promise<Banner[]> =>
      api.get("/admin/banners").then((r) => r.data),
    create: (data: CreateBannerRequest): Promise<Banner> =>
      api.post("/admin/banners", data).then((r) => r.data),
    update: (id: number, data: Partial<CreateBannerRequest>): Promise<Banner> =>
      api.patch(`/admin/banners/${id}`, data).then((r) => r.data),
    toggle: (id: number): Promise<Banner> =>
      api.patch(`/admin/banners/${id}/toggle`).then((r) => r.data),
    delete: (id: number): Promise<{ success: boolean }> =>
      api.delete(`/admin/banners/${id}`).then((r) => r.data),
  },
};

// ─── Brands (public) ──────────────────────────────────────────────────────────

export const brandsApi = {
  list: (): Promise<Brand[]> =>
    api.get("/brands").then((r) => r.data),
};

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post<{ url: string }>(
    "/admin/upload-image",
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.url;
}


// ─── Banners (public) ─────────────────────────────────────────────────────────

export const bannersApi = {
  list: (): Promise<Banner[]> =>
    api.get("/banners").then((r) => r.data),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

// FIX 7: Added a dedicated chatApi section so the chatbot can be called through
// the shared `api` instance (with auth headers and the 401 redirect interceptor)
// instead of a raw fetch(). This also centralises the endpoint in one place.
export interface ChatMessage {
  role:    "user" | "assistant";
  content: string;
}

export interface ChatProduct {
  id:            number;
  name:          string;
  price:         number;
  originalPrice?: number;
  image?:        string;
  badge?:        string;
  rating?:       number;
  slug?:         string;
  stock?:        number;
  brand?:        string;
  category?:     string;
  specs?:        Record<string, string>;
}

export interface ChatResponse {
  reply:    string;
  products: ChatProduct[];
}

export const chatApi = {
  ask: (message: string, history: ChatMessage[]): Promise<ChatResponse> =>
    api.post<ChatResponse>("/chat", { message, history }).then((r) => r.data),
};