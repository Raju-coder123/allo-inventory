"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Reservation {
  id: string;
  quantity: number;
  status: string;
  expiresAt: string;
  product: { name: string; price: number; imageUrl: string };
  warehouse: { name: string; location: string };
}

export default function ReservationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setReservation(data);
        const ms = new Date(data.expiresAt).getTime() - Date.now();
        setTimeLeft(Math.max(0, Math.floor(ms / 1000)));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  async function handleConfirm() {
    setActionLoading(true);
    const res = await fetch(`/api/reservations/${id}/confirm`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setReservation(data);
      setMessage({ text: "✅ Purchase confirmed! Thank you.", type: "success" });
    } else {
      setMessage({ text: `❌ ${data.error}`, type: "error" });
    }
    setActionLoading(false);
  }

  async function handleCancel() {
    setActionLoading(true);
    const res = await fetch(`/api/reservations/${id}/release`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setMessage({ text: "Reservation cancelled. Redirecting...", type: "success" });
      setTimeout(() => router.push("/"), 2000);
    } else {
      setMessage({ text: `❌ ${data.error}`, type: "error" });
    }
    setActionLoading(false);
  }

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading reservation...</p>
    </div>
  );

  if (!reservation) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">Reservation not found.</p>
    </div>
  );

  const isPending = reservation.status === "PENDING";

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.push("/")} className="text-blue-600 text-sm mb-6 hover:underline">
          ← Back to products
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <img src={reservation.product.imageUrl} alt={reservation.product.name} className="w-full h-52 object-cover" />

          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">{reservation.product.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{reservation.warehouse.name} · {reservation.warehouse.location}</p>
            <p className="text-3xl font-bold text-gray-900 mt-3">₹{reservation.product.price.toLocaleString()}</p>

            <div className={`mt-4 inline-block px-3 py-1 rounded-full text-sm font-medium ${
              reservation.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
              reservation.status === "RELEASED" ? "bg-gray-100 text-gray-600" :
              timeLeft === 0 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"
            }`}>
              {reservation.status === "CONFIRMED" ? "✅ Confirmed" :
               reservation.status === "RELEASED" ? "Cancelled" :
               timeLeft === 0 ? "⏰ Expired" : "⏳ Pending"}
            </div>

            {isPending && timeLeft > 0 && (
              <div className="mt-5 p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <p className="text-sm text-orange-600 font-medium">Reserved for</p>
                <p className="text-4xl font-mono font-bold text-orange-700 mt-1">{minutes}:{seconds}</p>
                <p className="text-xs text-orange-500 mt-1">Complete your purchase before time runs out</p>
              </div>
            )}

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {message.text}
              </div>
            )}

            {isPending && timeLeft > 0 && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? "Processing..." : "Confirm Purchase"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}