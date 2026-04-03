import { createContext, useContext, useState } from "react";

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

function generateYears(): string[] {
  const startYear = 2024;
  const end = new Date().getFullYear();
  const years: string[] = [];
  for (let y = end; y >= startYear; y--) {
    years.push(String(y));
  }
  return years;
}

export function YearProvider({ children }: { children: React.ReactNode }) {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const availableYears = generateYears();

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear, availableYears }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  return useContext(YearContext);
}
