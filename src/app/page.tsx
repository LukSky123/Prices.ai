"use client";
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

type Item = {
  id: string;
  name: string;
  averagePrice: number;
  cheapestMarket: string;
  history: number[];
};

// Search component
function SearchBar({ searchTerm, onSearchChange, itemsCount }: { 
  searchTerm: string; 
  onSearchChange: (term: string) => void; 
  itemsCount: number;
}) {
  return (
    <div className="relative max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search items... (e.g., rice, spaghetti)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {searchTerm && (
        <div className="mt-1 text-xs text-slate-400">
          {itemsCount} item{itemsCount !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
}

// ItemCard component
function ItemCard({ item, formattedPrice }: { item: Item; formattedPrice: string }) {
  return (
    <a href={`/items/${item.id}`} className="block p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{item.name}</h3>
          <p className="text-xs text-slate-400">Cheapest: {item.cheapestMarket}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{formattedPrice}</div>
          <div className="text-xs text-slate-400">avg today</div>
        </div>
      </div>
    </a>
  );
}

// Pagination component
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) {
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Show 5 page numbers at a time
    
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
          currentPage === 1
            ? 'text-slate-500 cursor-not-allowed'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </button>

      {/* Page numbers */}
      <div className="flex space-x-1">
        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              pageNum === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {pageNum}
          </button>
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
          currentPage === totalPages
            ? 'text-slate-500 cursor-not-allowed'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
}

// Main Dashboard component
export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const itemsPerPage = 12; // Show 12 items per page (4 rows of 3 in lg screens)

  // Function to format price
  const formatPrice = (price: number) => {
    if (isNaN(price) || price === 0) {
      return "₦0.00";
    }
    return `₦${price.toLocaleString('en-NG', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle search change
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Fetch items on component mount
  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true);
        const response = await fetch('/api/prices', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load items');
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, []);

  // Calculate pagination values (now using filtered items)
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <div className="text-center text-slate-400 py-8">
          <div className="animate-pulse">Loading items...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <div className="text-center text-red-400 py-8">
          <p>Error loading items: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          itemsCount={filteredItems.length}
        />
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <div>
          {searchTerm ? (
            <>
              Showing {currentItems.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} results
              {filteredItems.length !== items.length && (
                <span className="ml-2">
                  (filtered from {items.length} total)
                </span>
              )}
            </>
          ) : (
            <>Showing {currentItems.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, items.length)} of {items.length} items</>
          )}
        </div>
        {searchTerm && (
          <button
            onClick={() => handleSearchChange('')}
            className="text-blue-400 hover:text-blue-300 text-xs"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Items grid */}
      {currentItems.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          {searchTerm ? (
            <>
              <Search className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p className="text-lg">No items found for "{searchTerm}"</p>
              <p className="text-sm mt-2">Try searching for something else or clear the search</p>
              <button
                onClick={() => handleSearchChange('')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Clear search
              </button>
            </>
          ) : (
            <p>No items found. Upload some data to get started!</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                formattedPrice={formatPrice(item.averagePrice)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Footer info */}
      <div className="text-center text-xs text-slate-500 pt-4 border-t border-white/10">
        {searchTerm ? (
          <>Page {currentPage} of {totalPages} • {filteredItems.length} results</>
        ) : (
          <>Page {currentPage} of {totalPages} • {items.length} total items</>
        )}
      </div>
    </div>
  );
}