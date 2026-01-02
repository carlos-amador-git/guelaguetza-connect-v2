import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Search,
  Filter,
  ShoppingCart,
  Star,
  Package,
} from 'lucide-react';
import {
  getProducts,
  getCart,
  Product,
  ProductCategory,
  CATEGORY_LABELS,
  formatPrice,
} from '../services/marketplace';
import { ViewState } from '../types';

interface TiendaViewProps {
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

const CATEGORIES: ProductCategory[] = ['ARTESANIA', 'MEZCAL', 'TEXTIL', 'CERAMICA', 'JOYERIA', 'GASTRONOMIA'];

export default function TiendaView({ onNavigate, onBack }: TiendaViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadProducts();
    loadCartCount();
  }, [category]);

  const loadProducts = async (append = false) => {
    try {
      setLoading(true);
      const currentPage = append ? page + 1 : 1;
      const result = await getProducts({
        category: category || undefined,
        search: search || undefined,
        page: currentPage,
        limit: 20,
      });

      if (append) {
        setProducts((prev) => [...prev, ...result.products]);
      } else {
        setProducts(result.products);
      }

      setPage(currentPage);
      setHasMore(currentPage < result.pagination.totalPages);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    try {
      const cart = await getCart();
      setCartCount(cart.itemCount);
    } catch {
      // Not logged in or error
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadProducts();
  };

  const handleProductClick = (product: Product) => {
    onNavigate(ViewState.PRODUCT_DETAIL, { productId: product.id });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 pt-8 md:pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full md:hidden">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Tienda</h1>
                <p className="text-sm md:text-base text-white/80">Artesanias y productos oaxaquenos</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate(ViewState.CART)}
              className="relative p-2 md:p-3 bg-white/20 rounded-full hover:bg-white/30 transition"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="flex gap-2 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-white text-gray-900 rounded-lg"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 md:p-3 rounded-lg ${showFilters ? 'bg-white text-amber-600' : 'bg-white/20'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Category filters */}
          {showFilters && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 md:flex-wrap">
              <button
                onClick={() => setCategory('')}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-sm whitespace-nowrap ${
                  category === '' ? 'bg-white text-amber-600' : 'bg-white/20 hover:bg-white/30'
                } transition`}
              >
                Todos
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-sm whitespace-nowrap ${
                    category === cat ? 'bg-white text-amber-600' : 'bg-white/20 hover:bg-white/30'
                  } transition`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {loading && products.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No se encontraron productos</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={() => loadProducts(true)}
                  disabled={loading}
                  className="w-full md:w-auto md:px-8 py-3 mt-6 text-amber-600 font-medium hover:bg-amber-50 rounded-lg transition mx-auto block"
                >
                  {loading ? 'Cargando...' : 'Cargar mas productos'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Orders Button */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 md:hidden">
        <button
          onClick={() => onNavigate(ViewState.ORDERS)}
          className="w-full py-3 border-2 border-amber-500 text-amber-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-amber-50 transition"
        >
          <Package className="w-5 h-5" />
          Mis Pedidos
        </button>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
  const mainImage = product.images[0] || `https://picsum.photos/200/200?random=${product.id}`;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
    >
      <div className="relative aspect-square">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium">Agotado</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-amber-600">
            {CATEGORY_LABELS[product.category]}
          </span>
        </div>
      </div>

      <div className="p-3 md:p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 md:text-lg">{product.name}</h3>
        <p className="text-lg md:text-xl font-bold text-amber-600 mt-1">{formatPrice(product.price)}</p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            {product.seller.rating > 0 && (
              <>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{product.seller.rating.toFixed(1)}</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
          </span>
        </div>
      </div>
    </div>
  );
}
