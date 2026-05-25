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
  selectedYear: "all",
  setSelectedYear: () => {},
  availableYears: ["all"],
});

export function YearProvider({ children }: { children: React.ReactNode }) {
  // "all"로 시작 — 항상 유효한 초기값
  const [selectedYear, setSelectedYear] = useState("all");
  const [initialized, setInitialized] = useState(false);

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

  // 첫 데이터 로드 시 현재 연도 또는 가장 최근 시즌으로 전환
  useEffect(() => {
    if (!initialized && matches.length > 0) {
      const seasons = [...new Set(matches.map((m) => m.season))].sort((a, b) =>
        b.localeCompare(a)
      );
      const target = seasons.includes(currentYear) ? currentYear : seasons[0];
      if (target) setSelectedYear(target);
      setInitialized(true);
    }
  }, [initialized, matches.length]);

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear, availableYears }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  return useContext(YearContext);
}
