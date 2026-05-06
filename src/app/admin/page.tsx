"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DollarSign, Package, ShoppingCart, Users, TrendingUp,
  AlertTriangle, Clock, CheckCircle, Eye,
  ArrowRight, RefreshCw, Tag, BarChart3, Grid3x3,
} from "lucide-react";
import { adminApi, categoriesApi, productsApi } from "@/lib/api";
import Link from "next/link";
import type { AdminStats, RecentOrder, Category } from "@/types";
// No recharts dependency needed — charts built with inline SVG + CSS

// ─── Mock revenue chart data (replace with real endpoint when available) ───────
const REVENUE_DATA = [
  { month: "Nov", revenue: 4200, orders: 38 },
  { month: "Dec", revenue: 6800, orders: 61 },
  { month: "Jan", revenue: 5100, orders: 47 },
  { month: "Feb", revenue: 7400, orders: 68 },
  { month: "Mar", revenue: 8900, orders: 82 },
  { month: "Apr", revenue: 7200, orders: 65 },
  { month: "May", revenue: 9600, orders: 91 },
];

const CATEGORY_COLORS = [
  "#2563eb","#9333ea","#16a34a","#d97706",
  "#ef4444","#0891b2","#be185d","#4f46e5",
  "#059669","#b45309","#7c3aed","#0f766e",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function orderStatusClass(status: string) {
  const map: Record<string, string> = {
    pending:"status-pending", confirmed:"status-confirmed",
    processing:"status-processing", shipped:"status-shipped",
    delivered:"status-delivered", cancelled:"status-cancelled", "on-hold":"status-on-hold",
  };
  return map[status] ?? "badge-gray";
}
function paymentStatusClass(status: string) {
  const map: Record<string, string> = {
    paid:"status-paid", pending:"status-pending", failed:"status-failed", refunded:"status-refunded",
  };
  return map[status] ?? "badge-gray";
}
function formatDate(raw: string | null | undefined) {
  if (!raw) return "—";
  try { return new Date(raw).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }); }
  catch { return raw; }
}

// ─── SVG Charts (no external dependencies) ───────────────────────────────────

function RevenueChart({ data }: { data: typeof REVENUE_DATA }) {
  const W = 600; const H = 180; const PAD = { t:10, r:10, b:30, l:48 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const maxRev = Math.max(...data.map(d => d.revenue));
  const maxOrd = Math.max(...data.map(d => d.orders));
  const xStep = cW / (data.length - 1);
  const ry = (v: number) => PAD.t + cH - (v / maxRev) * cH;
  const oy = (v: number) => PAD.t + cH - (v / maxOrd) * cH;
  const revPts = data.map((d,i) => `${PAD.l + i*xStep},${ry(d.revenue)}`).join(" ");
  const ordPts = data.map((d,i) => `${PAD.l + i*xStep},${oy(d.orders)}`).join(" ");
  const revArea = `M${PAD.l},${PAD.t+cH} ` + data.map((d,i)=>`L${PAD.l+i*xStep},${ry(d.revenue)}`).join(" ") + ` L${PAD.l+cW},${PAD.t+cH} Z`;
  const ordArea = `M${PAD.l},${PAD.t+cH} ` + data.map((d,i)=>`L${PAD.l+i*xStep},${oy(d.orders)}`).join(" ") + ` L${PAD.l+cW},${PAD.t+cH} Z`;
  return (
    <div className="h-[220px] w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{overflow:"visible"}}>
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".18"/><stop offset="100%" stopColor="#2563eb" stopOpacity="0"/></linearGradient>
          <linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9333ea" stopOpacity=".18"/><stop offset="100%" stopColor="#9333ea" stopOpacity="0"/></linearGradient>
        </defs>
        {/* Grid lines */}
        {[0,25,50,75,100].map(pct => {
          const y = PAD.t + (cH * pct / 100);
          return <line key={pct} x1={PAD.l} y1={y} x2={PAD.l+cW} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 3" strokeWidth="1"/>;
        })}
        {/* Y axis labels (revenue) */}
        {[0,25,50,75,100].map(pct => (
          <text key={pct} x={PAD.l-6} y={PAD.t+(cH*pct/100)+4} textAnchor="end" fontSize="10" fill="hsl(var(--muted-foreground))">
            ${Math.round(maxRev*(1-pct/100)/1000)}k
          </text>
        ))}
        {/* Areas */}
        <path d={revArea} fill="url(#rg)"/>
        <path d={ordArea} fill="url(#og)"/>
        {/* Lines */}
        <polyline points={revPts} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        <polyline points={ordPts} fill="none" stroke="#9333ea" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        {/* Dots + X labels */}
        {data.map((d,i) => (
          <g key={i}>
            <circle cx={PAD.l+i*xStep} cy={ry(d.revenue)} r="3.5" fill="#2563eb"/>
            <circle cx={PAD.l+i*xStep} cy={oy(d.orders)}  r="3.5" fill="#9333ea"/>
            <text x={PAD.l+i*xStep} y={H-6} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">{d.month}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function DonutChart({ data, total }: { data:{name:string;value:number}[]; total:number }) {
  if (!data.length) return (
    <div className="h-[160px] flex items-center justify-center">
      <div className="w-[100px] h-[100px] rounded-full border-[14px] border-secondary flex items-center justify-center">
        <p className="text-xs text-muted-foreground text-center leading-tight">{total}<br/>cats</p>
      </div>
    </div>
  );
  const total_val = data.reduce((s,d)=>s+d.value,0);
  const cx=80; const cy=80; const R=58; const r=38;
  let angle = -Math.PI/2;
  const slices = data.map((d,i) => {
    const sweep = (d.value/total_val)*Math.PI*2;
    const x1=cx+R*Math.cos(angle); const y1=cy+R*Math.sin(angle);
    const x2=cx+R*Math.cos(angle+sweep); const y2=cy+R*Math.sin(angle+sweep);
    const ix1=cx+r*Math.cos(angle); const iy1=cy+r*Math.sin(angle);
    const ix2=cx+r*Math.cos(angle+sweep); const iy2=cy+r*Math.sin(angle+sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path=`M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${large} 0 ${ix1},${iy1} Z`;
    angle += sweep + 0.02;
    return { path, color: CATEGORY_COLORS[i%CATEGORY_COLORS.length] };
  });
  return (
    <div className="h-[160px] flex items-center justify-center">
      <svg viewBox="0 0 160 160" width="160" height="160">
        {slices.map((s,i)=><path key={i} d={s.path} fill={s.color}/>)}
        <circle cx={cx} cy={cy} r={r} fill="hsl(var(--card))"/>
        <text x={cx} y={cy-4} textAnchor="middle" fontSize="16" fontWeight="800" fill="hsl(var(--foreground))">{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">CATEGORIES</text>
      </svg>
    </div>
  );
}

function StatusBarChart({ bars }: { bars:{label:string;value?:number;color:string}[] }) {
  const max = Math.max(...bars.map(b=>b.value??0), 1);
  const W=340; const H=100; const barW=50; const gap=(W-bars.length*barW)/(bars.length+1);
  return (
    <div className="h-[120px] mb-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {bars.map((b,i) => {
          const bH = Math.max(((b.value??0)/max)*(H-24), 2);
          const x = gap + i*(barW+gap);
          return (
            <g key={b.label}>
              <rect x={x} y={H-24-bH} width={barW} height={bH} rx="4" fill={b.color}/>
              <text x={x+barW/2} y={H-10} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{b.label}</text>
              <text x={x+barW/2} y={H-26-bH} textAnchor="middle" fontSize="10" fontWeight="700" fill={b.color}>{b.value??0}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: string | number; sub: string;
  trend?: string; trendUp?: boolean; icon: React.ElementType;
  iconColor: string; iconBg: string; accentColor: string; isLoading: boolean;
}
function StatCard({ label, value, sub, trend, trendUp, icon:Icon, iconColor, iconBg, accentColor, isLoading }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-[18px] shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)]">
      <div className="pointer-events-none absolute -bottom-4 -right-4 rounded-full opacity-[0.07]"
        style={{background:accentColor,width:72,height:72}}/>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.7px] text-muted-foreground">{label}</p>
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px]" style={{background:iconBg}}>
          <Icon className="h-4 w-4" style={{color:iconColor}} strokeWidth={2}/>
        </div>
      </div>
      {trend && (
        <div className="mb-1.5 inline-flex items-center gap-1 rounded-[6px] px-[7px] py-[2px] text-[11px] font-bold"
          style={{background:iconBg,color:iconColor}}>
          {trendUp ? "↑" : "↓"} {trend}
        </div>
      )}
      {isLoading
        ? <div className="skeleton mb-1.5 h-8 w-24"/>
        : <p className="mb-1.5 text-[24px] font-extrabold tracking-[-1px] text-foreground">{value}</p>
      }
      <p className="text-xs font-medium text-muted-foreground">{sub}</p>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data: stats, isLoading, refetch, isFetching } = useQuery<AdminStats>({
    queryKey: ["admin","stats"],
    queryFn: () => adminApi.stats() as Promise<AdminStats>,
    staleTime: 30_000,
  });

  // Fetch real categories (includes productCount per your Category type)
  const { data: categoriesPage } = useQuery({
    queryKey: ["categories","admin-dashboard"],
    queryFn: () => categoriesApi.list({ limit: 50 }),
    staleTime: 60_000,
  });

  // Handle both array response and PageResponse<Category>
  const categories: Category[] = Array.isArray(categoriesPage)
    ? categoriesPage
    : (categoriesPage as any)?.items ?? [];

  // Fetch products to extract unique brands
  const { data: productsPage } = useQuery({
    queryKey: ["products", "admin-brands"],
    queryFn: () => productsApi.list({ limit: 500 }),
    staleTime: 60_000,
  });
  const allProducts = productsPage?.items ?? productsPage ?? [];
  const uniqueBrands: string[] = Array.from(
    new Set(
      (Array.isArray(allProducts) ? allProducts : [])
        .map((p: any) => p.brand)
        .filter(Boolean)
    )
  ).sort() as string[];
  const totalBrands = uniqueBrands.length;
  const activeCategories = categories.filter((c: Category) => c.isActive);
  const totalCategories = stats?.totalCategories ?? activeCategories.length;

  // Pie data — use productCount from Category type
  const pieData = activeCategories
    .filter((c: Category) => (c.productCount ?? 0) > 0)
    .map((c: Category) => ({ name: c.name, value: c.productCount ?? 0 }));

  const totalCategoryProducts = activeCategories.reduce((s, c) => s + (c.productCount ?? 0), 0);

  const statCards: StatCardProps[] = [
    {
      label:"Revenue", sub:"All paid orders", trend:"12.4%", trendUp:true,
      value: stats ? `$${(stats.totalRevenue ?? 0).toLocaleString("en-US",{minimumFractionDigits:2})}` : "—",
      icon:DollarSign, iconColor:"#16a34a", iconBg:"#dcfce7", accentColor:"#16a34a", isLoading,
    },
    {
      label:"Orders", sub:`${stats?.pendingOrders ?? 0} pending`, trend:"8.1%", trendUp:true,
      value:stats?.totalOrders ?? "—",
      icon:ShoppingCart, iconColor:"#2563eb", iconBg:"#dbeafe", accentColor:"#2563eb", isLoading,
    },
    {
      label:"Products", sub:"Active listings",
      trend:`${stats?.lowStockProducts?.length ?? 0} low stock`, trendUp:false,
      value:stats?.totalProducts ?? "—",
      icon:Package, iconColor:"#9333ea", iconBg:"#f3e8ff", accentColor:"#9333ea", isLoading,
    },
    {
      label:"Users", sub:"Registered accounts",
      trend:(stats?.pendingStudentVerifications ?? 0) > 0 ? `${stats!.pendingStudentVerifications} pending` : undefined,
      trendUp:false, value:stats?.totalUsers ?? "—",
      icon:Users, iconColor:"#d97706", iconBg:"#fef3c7", accentColor:"#d97706", isLoading,
    },
    {
      label:"Brands", sub:"Unique brands",
      value: totalBrands > 0 ? totalBrands : (stats?.totalProducts ? "—" : "—"),
      icon:Tag, iconColor:"#0891b2", iconBg:"#cffafe", accentColor:"#0891b2", isLoading:false,
    },
  ];

  const statusBars = [
    { label:"Pending",    value:stats?.pendingOrders,    color:"#f59e0b", textColor:"#b45309", pct:Math.round(((stats?.pendingOrders??0)/(stats?.totalOrders||1))*100) },
    { label:"Processing", value:stats?.processingOrders, color:"#9333ea", textColor:"#7e22ce", pct:Math.round(((stats?.processingOrders??0)/(stats?.totalOrders||1))*100) },
    { label:"Delivered",  value:stats?.deliveredOrders,  color:"#16a34a", textColor:"#15803d", pct:Math.round(((stats?.deliveredOrders??0)/(stats?.totalOrders||1))*100) },
    { label:"Cancelled",  value:stats?.cancelledOrders,  color:"#ef4444", textColor:"#be123c", pct:Math.round(((stats?.cancelledOrders??0)/(stats?.totalOrders||1))*100) },
  ];

  return (
    <div className="animate-fade-in p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your store</p>
        </div>
        <button onClick={()=>refetch()} disabled={isFetching} className="btn-secondary gap-2 text-xs disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching?"animate-spin":""}`}/>
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map(card => <StatCard key={card.label} {...card}/>)}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.7px] text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5"/>
            Revenue & Orders — Last 7 Months
          </h2>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-1.5 rounded-full bg-blue-500"/>Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-1.5 rounded-full bg-purple-500"/>Orders
            </span>
          </div>
        </div>
        <RevenueChart data={REVENUE_DATA}/>
      </div>

      {/* Categories + Order Status */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Categories */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.7px] text-muted-foreground">
              <Grid3x3 className="h-3.5 w-3.5"/>
              Categories
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                {totalCategories} total
              </span>
              <Link href="/admin/categories" className="text-[11px] font-semibold text-primary hover:opacity-75 flex items-center gap-0.5">
                Manage <ArrowRight className="h-3 w-3"/>
              </Link>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Tag className="h-5 w-5 text-muted-foreground"/>
              </div>
              <p className="text-sm text-muted-foreground">No categories yet</p>
              <Link href="/admin/categories" className="mt-2 text-xs font-semibold text-primary hover:opacity-75">
                Create your first category →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Donut chart */}
                <div className="h-[160px]">
                  <DonutChart data={pieData} total={totalCategories}/>
                </div>

                {/* Category list */}
                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px] pr-1">
                  {activeCategories.map((cat:Category, i:number) => (
                    <div key={cat.id} className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{background:CATEGORY_COLORS[i % CATEGORY_COLORS.length]}}/>
                        <span className="font-medium text-foreground truncate">{cat.name}</span>
                        {!cat.isActive && (
                          <span className="text-[9px] text-muted-foreground">(inactive)</span>
                        )}
                      </div>
                      <span className="font-bold text-muted-foreground ml-2 flex-shrink-0 tabular-nums">
                        {cat.productCount ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary stacked bar */}
              {totalCategoryProducts > 0 && (
                <>
                  <div className="flex overflow-hidden rounded-full h-2 gap-0.5">
                    {activeCategories.filter(c=>c.productCount).map((cat:Category, i:number) => (
                      <div key={cat.id}
                        title={`${cat.name}: ${cat.productCount} products`}
                        style={{
                          background:CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                          flex:cat.productCount ?? 1,
                          borderRadius: i===0 ? "9999px 0 0 9999px" : i===activeCategories.length-1 ? "0 9999px 9999px 0" : 0,
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {totalCategoryProducts} products across {activeCategories.length} active categories
                  </p>
                </>
              )}

              {/* All categories grid */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  All Categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat:Category, i:number) => (
                    <span key={cat.id}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                        cat.isActive ? "border-border bg-secondary/60" : "border-dashed border-border/50 text-muted-foreground"
                      }`}>
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{background:cat.isActive ? CATEGORY_COLORS[i % CATEGORY_COLORS.length] : "#d1d5db"}}/>
                      {cat.name}
                      {cat.productCount !== undefined && (
                        <span className="text-muted-foreground font-normal">({cat.productCount})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Order Status */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.7px] text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5"/>
            Order Status Breakdown
          </h2>

          <StatusBarChart bars={statusBars}/>

          {isLoading
            ? <div className="space-y-3">{[1,2,3,4].map(i=><div key={i} className="skeleton h-5"/>)}</div>
            : (
              <div className="space-y-3">
                {statusBars.map(({label,value,color,textColor,pct})=>(
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className="inline-block h-[7px] w-[7px] flex-shrink-0 rounded-full" style={{background:color}}/>
                        {label}
                      </div>
                      <span className="text-sm font-bold" style={{color:textColor}}>{value ?? 0}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:color}}/>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
          <Link href="/admin/orders" className="mt-4 flex w-full items-center gap-1 border-t border-border pt-4 text-xs font-semibold text-primary hover:opacity-75">
            View all orders <ArrowRight className="h-3 w-3"/>
          </Link>
        </div>
      </div>

      {/* Brands Panel */}
      {uniqueBrands.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.7px] text-muted-foreground">
              <Tag className="h-3.5 w-3.5"/>
              Brands
            </h2>
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-700">
              {totalBrands} brands
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueBrands.map((brand, i) => {
              // Count products per brand
              const count = (Array.isArray(allProducts) ? allProducts : [])
                .filter((p: any) => p.brand === brand).length;
              return (
                <div key={brand}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-default">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{background: CATEGORY_COLORS[i % CATEGORY_COLORS.length]}}/>
                  {brand}
                  <span className="text-muted-foreground font-normal">({count})</span>
                </div>
              );
            })}
          </div>
          {/* Brand distribution bar */}
          {totalBrands > 1 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex overflow-hidden rounded-full h-1.5 gap-px">
                {uniqueBrands.map((brand, i) => {
                  const count = (Array.isArray(allProducts) ? allProducts : [])
                    .filter((p: any) => p.brand === brand).length;
                  return (
                    <div key={brand} title={`${brand}: ${count} products`}
                      style={{
                        background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                        flex: count,
                        borderRadius: i===0 ? "9999px 0 0 9999px" : i===uniqueBrands.length-1 ? "0 9999px 9999px 0" : 0,
                      }}
                    />
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Product distribution across {totalBrands} brands
              </p>
            </div>
          )}
        </div>
      )}

      {/* Low Stock */}
      <div>

        {/* Low Stock */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.7px] text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500"/>
            Low Stock Alerts
          </h2>
          {isLoading
            ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-10"/>)}</div>
            : (stats?.lowStockProducts?.length ?? 0) > 0
              ? (
                <div>
                  {stats!.lowStockProducts.slice(0,5).map(p=>(
                    <div key={p.id} className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0">
                      <div className="mr-3 min-w-0 flex-1">
                        <p className="line-clamp-1 font-semibold text-foreground">{p.name}</p>
                        {p.sku && <p className="font-mono text-[11px] text-muted-foreground">SKU: {p.sku}</p>}
                      </div>
                      {p.stock === 0
                        ? <span className="badge badge-red shrink-0">Out of stock</span>
                        : <span className="badge badge-yellow shrink-0">{p.stock} left</span>
                      }
                    </div>
                  ))}
                </div>
              )
              : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle className="h-5 w-5 text-green-600"/>
                  </div>
                  <p className="text-sm text-muted-foreground">All products are well stocked</p>
                </div>
              )
          }
          <Link href="/admin/products" className="mt-4 flex w-full items-center gap-1 border-t border-border pt-4 text-xs font-semibold text-primary hover:opacity-75">
            Manage products <ArrowRight className="h-3 w-3"/>
          </Link>
        </div>

      {/* Recent Orders */}
      {(stats?.recentOrders?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.7px] text-muted-foreground">
              <Clock className="h-3.5 w-3.5"/>
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-75">
              View all <ArrowRight className="h-3 w-3"/>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th><th/></tr>
              </thead>
              <tbody>
                {stats!.recentOrders!.map((order:RecentOrder)=>(
                  <tr key={order.id}>
                    <td>
                      <span className="inline-block rounded-[6px] bg-primary/[0.07] px-2 py-1 font-mono text-[12px] font-semibold text-primary">
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-foreground line-clamp-1">{order.customerName ?? "Guest"}</p>
                      {order.customerEmail && <p className="text-[11px] text-muted-foreground line-clamp-1">{order.customerEmail}</p>}
                    </td>
                    <td className="font-bold text-foreground">${Number(order.total).toFixed(2)}</td>
                    <td><span className={`badge ${orderStatusClass(order.status)} capitalize`}>{order.status}</span></td>
                    <td><span className={`badge ${paymentStatusClass(order.paymentStatus)} capitalize`}>{order.paymentStatus}</span></td>
                    <td className="whitespace-nowrap font-mono text-xs text-muted-foreground">{formatDate(order.createdAt)}</td>
                    <td>
                      <Link href={`/admin/orders?id=${order.id}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] border border-border bg-card transition-all hover:border-primary hover:bg-primary/[0.06]">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground"/>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
</div>
    </div>
  );
}