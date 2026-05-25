import { createContext, useContext, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMatches } from "@/lib/firebase";

const currentYear = String(new Date().getFullYear());

interface YearContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
}

const YearContext = createContext<YearContextType>({
  selectedYear: "all",
  setSelectedYear: () => {},
  availableYears: ["all"],
});

export function YearProvider({ children }: { children: React.ReactNode }) {
  const [selectedYear, setSelectedYear] = useState("all");

  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: getMatches,
  });

  const availableYears = useMemo(() => {
    const seasons = [...new Set(matches.map((m) => m.season))].sort((a, b) =>
      b.localeCompare(a)
    );
    return ["all", ...seasons];
  }, [matches]);

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear, availableYears }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  return useContext(YearContext);
}
