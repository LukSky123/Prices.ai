import Link from "next/link";
import type { Item } from "@/lib/data";

interface ItemCardProps {
  item: Item;
  formattedPrice: string; // Accept formatted price as a prop
}

export function ItemCard({ item, formattedPrice }: ItemCardProps) {
  return (
    <Link href={`/items/${item.id}`} className="card card-hover block p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-xs text-slate-400">Cheapest: {item.cheapestMarket}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{formattedPrice}</div> {/* Display formatted price */}
          <div className="text-xs text-slate-400">avg today</div>
        </div>
      </div>
    </Link>
  );
}
