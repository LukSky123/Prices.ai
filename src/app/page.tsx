import { fetchItems } from "@/lib/data";  // Assuming this fetches data from Supabase
import { ItemCard } from "@/components/ItemCard";

// This is the function that formats the price with the Naira symbol (₦)
function formatPrice(price: number) {
  if (isNaN(price)) {
    return "₦0.00";  // Return a fallback value if price is invalid
  }
  return `₦${price.toFixed(2)}`;
}


export default async function DashboardPage() {
  const items = await fetchItems(); // Fetch all items from the backend

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pass the formatted price to ItemCard */}
        {items.map((item) => (
          <ItemCard
            key={item.id} // Unique identifier for each item
            item={item}  // Pass the full item data
            formattedPrice={formatPrice(item.price)} // Format the price here
          />
        ))}
      </div>
    </div>
  );
}
