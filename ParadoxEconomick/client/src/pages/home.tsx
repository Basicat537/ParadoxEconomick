import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import TelegramBot from "@/components/telegram/TelegramBot";
import { Category, Product, PaymentMethod, Order } from "@shared/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { isLoading: categoriesLoading, data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { isLoading: productsLoading, data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { isLoading: paymentsLoading, data: paymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
  });

  const { isLoading: ordersLoading, data: orders } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const isLoading = categoriesLoading || productsLoading || paymentsLoading || ordersLoading;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="telegram-container max-w-md mx-auto mb-8 bg-white rounded-lg shadow-md">
          <div className="bg-telegram text-white p-4 rounded-t-lg flex items-center">
            <Skeleton className="h-6 w-6 rounded-full mr-2" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="h-[600px] p-4 space-y-4">
            <Skeleton className="h-12 w-3/4 rounded" />
            <Skeleton className="h-48 w-full rounded" />
            <Skeleton className="h-12 w-full rounded" />
            <Skeleton className="h-12 w-full rounded" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <TelegramBot 
        categories={categories || []} 
        products={products || []} 
        paymentMethods={paymentMethods || []} 
        orders={orders || []}
      />
    </MainLayout>
  );
}
