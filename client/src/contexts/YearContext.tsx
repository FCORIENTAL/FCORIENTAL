import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMatches } from "@/lib/firebase";

const currentYear = String(new Date().getFullYear());

interface YearContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
}

const YearContext = createContext<YearContextType>({
  selectedYear: currentYear,
  setSelectedYear: () => {},
  availableYears: [currentYear],
});

export function YearProvider({ children }: { children: React.ReactNode }) {
  const [selectedYear, setSelectedYear] = useState(currentYear);

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

  // 데이터 로드 후 현재 연도가 없으면 가장 최근 시즌으로 변경
  useEffect(() => {
    if (availableYears.length > 1 && selectedYear !== "all") {
      const seasons = availableYears.filter((y) => y !== "all");
      if (!seasons.includes(selectedYear)) {
        setSelectedYear(seasons[0]);
      }
    }
  }, [availableYears]);

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear, availableYears }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  return useContext(YearContext);
}
