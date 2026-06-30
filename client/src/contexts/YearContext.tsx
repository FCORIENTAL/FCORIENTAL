import { createContext, useContext, useState, useMemo, useEffect } from "react";
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
  // "all"로 시작 — Select 컴포넌트가 항상 유효한 상태가 되도록 함
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

  // 첫 데이터 로드 시 올해 시즌 데이터가 있으면 올해로 자동 전환
  useEffect(() => {
    if (initialized || matches.length === 0) return;
    const seasons = new Set(matches.map((m) => m.season));
    if (seasons.has(currentYear)) {
      setSelectedYear(currentYear);
    }
    setInitialized(true);
  }, [initialized, matches]);

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear, availableYears }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  return useContext(YearContext);
}
