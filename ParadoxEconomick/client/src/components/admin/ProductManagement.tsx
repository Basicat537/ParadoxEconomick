import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Product, Category } from "@shared/types";

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Omit<Product, "id">) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
}

export default function ProductManagement({ 
  products, 
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: ProductManagementProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({
    name: "",
    description: "",
    price: 0,
    originalPrice: 0,
    stock: 0,
    categoryId: 1,
    platform: "",
    region: "",
    status: "active"
  });

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    const matchesCategory = filterCategory === "all" || product.categoryId.toString() === filterCategory;
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleAddProduct = () => {
    onAddProduct(newProduct);
    setIsAddDialogOpen(false);
    // Reset form
    setNewProduct({
      name: "",
      description: "",
      price: 0,
      originalPrice: 0,
      stock: 0,
      categoryId: 1,
      platform: "",
      region: "",
      status: "active"
    });
  };

  const handleUpdateProduct = () => {
    if (currentProduct) {
      onUpdateProduct(currentProduct);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteProduct = () => {
    if (currentProduct) {
      onDeleteProduct(currentProduct.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-dark">Products Management</h2>
        <Button 
          className="bg-green-500 hover:bg-green-600"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Product
        </Button>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-3 rounded shadow mb-4">
        <div className="flex flex-wrap gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">In Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
          
          <Input 
            type="text" 
            placeholder="Search products..." 
            className="flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <Button 
            className="bg-telegram hover:bg-blue-600"
            onClick={() => {
              setSearchTerm("");
              setFilterCategory("all");
              setFilterStatus("all");
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg> 
            Reset Filters
          </Button>
        </div>
      </div>
      
      {/* Products Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="p-3">{product.id}</td>
                <td className="p-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded mr-2 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <span>{product.name}</span>
                  </div>
                </td>
                <td className="p-3">{getCategoryName(product.categoryId)}</td>
                <td className="p-3">${product.price.toFixed(2)}</td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3">
                  {product.status === 'active' && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
                  )}
                  {product.status === 'out_of_stock' && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Out of Stock</span>
                  )}
                  {product.status === 'hidden' && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Hidden</span>
                  )}
                  {product.stock > 0 && product.stock <= 5 && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs ml-1">Low Stock</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex space-x-1">
                    <button 
                      className="text-telegram hover:bg-telegram-light p-1 rounded"
                      onClick={() => {
                        setCurrentProduct(product);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      className="text-red-500 hover:bg-red-100 p-1 rounded"
                      onClick={() => {
                        setCurrentProduct(product);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-5 text-center text-gray-500">
                  No products found. Try different filters or add a new product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          Showing {filteredProducts.length} of {products.length} products
        </div>
        <div className="flex space-x-1">
          <button className="px-3 py-1 border rounded text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="px-3 py-1 border rounded bg-telegram text-white">1</button>
          <button className="px-3 py-1 border rounded text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input 
                  value={newProduct.name} 
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={newProduct.categoryId.toString()} 
                  onValueChange={(value) => setNewProduct({...newProduct, categoryId: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={newProduct.description} 
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price ($)</label>
                <Input 
                  type="number" 
                  value={newProduct.price} 
                  onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Original Price ($)</label>
                <Input 
                  type="number" 
                  value={newProduct.originalPrice || ''} 
                  onChange={(e) => setNewProduct({...newProduct, originalPrice: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <Input 
                  type="number" 
                  value={newProduct.stock} 
                  onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <Input 
                  value={newProduct.platform} 
                  onChange={(e) => setNewProduct({...newProduct, platform: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Region</label>
                <Input 
                  value={newProduct.region} 
                  onChange={(e) => setNewProduct({...newProduct, region: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={newProduct.status} 
                onValueChange={(value) => setNewProduct({...newProduct, status: value as 'active' | 'out_of_stock' | 'hidden'})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {currentProduct && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    value={currentProduct.name} 
                    onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={currentProduct.categoryId.toString()} 
                    onValueChange={(value) => setCurrentProduct({...currentProduct, categoryId: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={currentProduct.description} 
                  onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price ($)</label>
                  <Input 
                    type="number" 
                    value={currentProduct.price} 
                    onChange={(e) => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Original Price ($)</label>
                  <Input 
                    type="number" 
                    value={currentProduct.originalPrice || ''} 
                    onChange={(e) => setCurrentProduct({...currentProduct, originalPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock</label>
                  <Input 
                    type="number" 
                    value={currentProduct.stock} 
                    onChange={(e) => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Input 
                    value={currentProduct.platform} 
                    onChange={(e) => setCurrentProduct({...currentProduct, platform: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <Input 
                    value={currentProduct.region} 
                    onChange={(e) => setCurrentProduct({...currentProduct, region: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={currentProduct.status} 
                  onValueChange={(value) => setCurrentProduct({...currentProduct, status: value as 'active' | 'out_of_stock' | 'hidden'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProduct}>Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the product '{currentProduct?.name}'? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
