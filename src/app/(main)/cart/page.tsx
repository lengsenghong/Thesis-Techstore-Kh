"use client";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ArrowLeft, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart();

  const subtotal = getTotalPrice();
  const itemCount = getTotalItems();

  if (items.length === 0) {
    return (
      <div className="container-wide py-16 animate-fade-in">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some products to get started</p>
          <Link href="/products" className="btn-primary">
            Browse Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/products" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="card-base p-4 flex gap-4 items-start animate-slide-up">
              {/* Product Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary/50 flex-shrink-0">
                {item.product.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                {item.product.brand && (
                  <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-0.5">
                    {item.product.brand}
                  </p>
                )}
                <Link
                  href={`/products/${item.product.slug}`}
                  className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-2"
                >
                  {item.product.name}
                </Link>
                {item.selectedColor && (
                  <p className="text-xs text-muted-foreground mt-0.5">Color: {item.selectedColor}</p>
                )}
                <p className="text-base font-bold text-foreground mt-1">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)} each</p>
                )}
              </div>

              {/* Quantity + Remove */}
              <div className="flex flex-col items-end gap-3">
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-7 h-7 rounded-lg bg-white flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= (item.product.stock ?? 999)}
                    className="w-7 h-7 rounded-lg bg-white flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card-base p-6 sticky top-24">
            <h2 className="font-bold text-lg text-foreground mb-5">Order Summary</h2>

            <div className="space-y-3 mb-5">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-foreground flex-shrink-0">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-green-600">
                  {subtotal >= 100 ? "Free" : "$5.00"}
                </span>
              </div>
              {subtotal < 100 && (
                <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
                  Add ${(100 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
            </div>

            <div className="flex justify-between font-bold text-lg mb-6 border-t border-border pt-4">
              <span>Total</span>
              <span className="text-primary">${(subtotal + (subtotal >= 100 ? 0 : 5)).toFixed(2)}</span>
            </div>

            <Link href="/checkout" className="btn-primary w-full justify-center text-base py-3">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <Link href="/products" className="btn-secondary w-full justify-center mt-3 text-sm">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}