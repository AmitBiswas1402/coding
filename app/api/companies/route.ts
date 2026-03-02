import { NextResponse } from "next/server";

// Sample company data - in a real app, this would come from a database
const companies = [
  { name: "Meta", count: 1388 },
  { name: "Uber", count: 374 },
  { name: "Google", count: 892 },
  { name: "Amazon", count: 1245 },
  { name: "Microsoft", count: 756 },
  { name: "Apple", count: 423 },
  { name: "Netflix", count: 234 },
  { name: "Twitter", count: 189 },
  { name: "LinkedIn", count: 312 },
  { name: "Airbnb", count: 267 },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  let filteredCompanies = companies;

  if (search) {
    const searchLower = search.toLowerCase();
    filteredCompanies = companies.filter((c) =>
      c.name.toLowerCase().includes(searchLower)
    );
  }

  // Sort by count descending
  filteredCompanies.sort((a, b) => b.count - a.count);

  return NextResponse.json(filteredCompanies);
}
