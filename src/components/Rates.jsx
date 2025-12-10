import React, { useState, useEffect } from "react";
import { backendUrl } from "./config";

const monthsHeader = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

// Dummy data shaped like final API
const dummyPoolRateData = [
  {
    poolNumber: "100",
    poolName: "Engineering",
    months: [
      { rate: 1.10 }, { rate: 1.12 }, { rate: 1.15 }, { rate: 1.18 },
      { rate: 1.20 }, { rate: 1.22 }, { rate: 1.25 }, { rate: 1.27 },
      { rate: 1.30 }, { rate: 1.32 }, { rate: 1.35 }, { rate: 1.38 },
    ],
  },
  {
    poolNumber: "200",
    poolName: "Overhead",
    months: Array.from({ length: 12 }).map((_, i) => ({
      rate: 0.95,
    })),
  },
];

// Example second table dummy set
const dummyAltPoolRateData = [
  {
    poolNumber: "300",
    poolName: "G&A",
    months: Array.from({ length: 12 }).map((_, i) => ({
      rate: 0.8,
    })),
  },
];

const Rates = () => {
  const [data, setData] = useState([]);
  const [altData, setAltData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map API response → table shape
  // Expect each row from API like:
  // { poolNumber, poolName, periods: [{ Period:1, Rate:1.1 }, ...] }
  const mapApiData = (apiData) =>
    apiData.map((row) => ({
      poolNumber: row.poolNumber,
      poolName: row.poolName,
      months: monthsHeader.map((_, idx) => {
        const period = idx + 1;
        const p = row.periods?.find((x) => x.Period === period) || {};
        return {
          rate: p.Rate ?? "",
        };
      }),
    }));

  const fetchData = async (selectedYear) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${backendUrl}/Configuration/GetPoolRates?fiscalYear=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch pool rates");
      }

      const result = await response.json(); // should be array of rows
      // When API is ready, map real data:
      const mapped = mapApiData(result);
      setData(mapped);

      // For now, still show alt table from dummy
      setAltData(dummyAltPoolRateData);
    } catch (err) {
      // While API is not ready / fails, fall back to dummy
      console.error("Rates fetch error:", err);
      setError(null); // hide error in UI if you want
      setData(dummyPoolRateData);
      setAltData(dummyAltPoolRateData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(year);
  }, [year]);



  const renderTable = (rows, title) => (
    <div className="border-line p-3 mb-6">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead className="thead">
            <tr>
              <th className="th-thead border border-black whitespace-nowrap">
                Pool Number
              </th>
              <th className="th-thead border border-black whitespace-nowrap">
                Pool Name
              </th>
              {monthsHeader.map((m) => (
                <th
                  key={m}
                  className="th-thead border border-black whitespace-nowrap"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tbody">
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="tbody-td border border-black whitespace-nowrap">
                  {row.poolNumber}
                </td>
                <td className="tbody-td border border-black whitespace-nowrap">
                  {row.poolName}
                </td>
                {row.months.map((m, i) => (
                  <td
                    key={i}
                    className="tbody-td border border-black text-right"
                  >
                    {m.rate}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );


  return (
    <div className="w-full border-line p-3">
      {/* Fiscal year selector */}
      <div className="flex items-center justify-end mb-3 gap-2">
        <label className="text-sm font-medium text-gray-700">
          Fiscal Year:
        </label>
        <select
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const y = new Date().getFullYear() - 2 + i;
            return (
              <option key={y} value={y}>
                {y}
              </option>
            );
          })}
        </select>
      </div>

      {loading && <div className="table">
        <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 mt-4">
                          Loading...
                        </span>
                      </div>
                      </div>}
      {error && (
        <div className="table text-red-600">Error: {error}</div>
      )}

      {!loading && !error && (
        <>
          {renderTable(data, "ETC Indirect Rates")}
          {renderTable(altData, "Actual Indirect Rates")}
        </>
      )}
    </div>
  );
};

export default Rates;
