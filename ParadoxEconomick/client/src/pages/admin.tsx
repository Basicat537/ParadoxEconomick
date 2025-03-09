import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/components/admin/Dashboard";
import { Category, Product } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Admin() {
  const { toast } = useToast();
  
  const { isLoading: categoriesLoading, data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { isLoading: productsLoading, data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const addProductMutation = useMutation({
    mutationFn: async (newProduct: Omit<Product, "id">) => {
      const res = await apiRequest("POST", "/api/products", newProduct);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Product added",
        description: "The product has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add product: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (product: Product) => {
      const res = await apiRequest("PUT", `/api/products/${product.id}`, product);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update product: ${error}`,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/products/${id}`, null);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = (product: Omit<Product, "id">) => {
    addProductMutation.mutate(product);
  };

  const handleUpdateProduct = (product: Product) => {
    updateProductMutation.mutate(product);
  };

  const handleDeleteProduct = (id: number) => {
    deleteProductMutation.mutate(id);
  };

  const isLoading = categoriesLoading || productsLoading;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="admin-container mx-auto bg-white rounded-lg shadow-md">
          <div className="bg-dark text-white p-4 rounded-t-lg flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex h-[600px]">
            <Skeleton className="w-64 h-full" />
            <div className="flex-1 p-4">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-40 w-full mb-4" />
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Dashboard 
        categories={categories || []} 
        products={products || []}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
      />
    </MainLayout>
  );
}
