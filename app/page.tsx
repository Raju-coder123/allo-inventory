"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Stock {
  id: string;
  total: number;
  reserved: number;
  warehouse: { id: string; name: string; location: string };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stocks: Stock[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  async function handleReserve(productId: string, warehouseId: string) {
    setReserving(productId + warehouseId);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reserve");
        return;
      }
      router.push(`/reservation/${data.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setReserving(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-500">Loading products...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Allo Inventory</h1>
        <p className="text-gray-500 mb-8">Reserve products before checkout</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{product.description}</p>
                <p className="text-2xl font-bold text-gray-900 mt-3">₹{product.price.toLocaleString()}</p>

                <div className="mt-4 space-y-2">
                  {product.stocks.map((stock) => {
                    const available = stock.total - stock.reserved;
                    const key = product.id + stock.warehouse.id;
                    return (
                      <div key={stock.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{stock.warehouse.name}</p>
                          <p className="text-xs text-gray-500">{stock.warehouse.location}</p>
                          <span className={`text-xs font-medium mt-1 inline-block ${available > 0 ? "text-green-600" : "text-red-500"}`}>
                            {available > 0 ? `${available} available` : "Out of stock"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleReserve(product.id, stock.warehouse.id)}
                          disabled={available === 0 || reserving === key}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                        >
                          {reserving === key ? "Reserving..." : "Reserve"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}