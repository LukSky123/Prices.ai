import { NextResponse } from "next/server";

type Market = {
  id: string;
  name: string;
  url: string;
  prices: { itemId: string; price: number }[];
};

const markets: Market[] = [
  {
    id: "jumia",
    name: "Jumia",
    url: "https://www.jumia.com.ng",
    prices: [
      { itemId: "rice_50kg", price: 46500 },
      { itemId: "beans_5kg", price: 6100 },
    ],
  },
  {
    id: "konga",
    name: "Konga",
    url: "https://www.konga.com",
    prices: [
      { itemId: "rice_50kg", price: 47200 },
      { itemId: "garri_5kg", price: 3150 },
    ],
  },
  {
    id: "supermart",
    name: "Supermart",
    url: "https://www.supermart.ng",
    prices: [
      { itemId: "yam_tuber", price: 1750 },
      { itemId: "vegetable_oil_3l", price: 5100 },
    ],
  },
];

export async function GET() {
  return NextResponse.json(markets);
}