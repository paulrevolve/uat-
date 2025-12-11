// import React, { useState, useEffect } from "react";
// import { backendUrl } from "./config";

// const monthsHeader = [
//   "Jan","Feb","Mar","Apr","May","Jun",
//   "Jul","Aug","Sep","Oct","Nov","Dec"
// ];

// // Dummy data shaped like final API
// const dummyPoolRateData = [
//   {
//     poolNumber: "100",
//     poolName: "Engineering",
//     months: [
//       { rate: 1.10 }, { rate: 1.12 }, { rate: 1.15 }, { rate: 1.18 },
//       { rate: 1.20 }, { rate: 1.22 }, { rate: 1.25 }, { rate: 1.27 },
//       { rate: 1.30 }, { rate: 1.32 }, { rate: 1.35 }, { rate: 1.38 },
//     ],
//   },
//   {
//     poolNumber: "200",
//     poolName: "Overhead",
//     months: Array.from({ length: 12 }).map((_, i) => ({
//       rate: 0.95,
//     })),
//   },
// ];

// // Example second table dummy set
// const dummyAltPoolRateData = [
//   {
//     poolNumber: "300",
//     poolName: "G&A",
//     months: Array.from({ length: 12 }).map((_, i) => ({
//       rate: 0.8,
//     })),
//   },
// ];

// const Rates = () => {
//   const [data, setData] = useState([]);
//   const [altData, setAltData] = useState([]);
//   const [year, setYear] = useState(new Date().getFullYear());
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//    const [closePeriodMonth, setClosePeriodMonth] = useState(null); // 1–12
//   const [closePeriodYear, setClosePeriodYear] = useState(null);
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [closePeriod, setClosePeriod] = useState(null);
//     const [closePeriodLabel, setClosePeriodLabel] = useState("");
  


//     const fetchConfig = async () => {
//       try {
//         const res = await fetch(
//           `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/xxxxx`
//         );
//         const cfg = await res.json();
  
//   const closing = cfg.find((c) => c.name === "closing_period");
//   if (closing?.value) {
//     const d = new Date(closing.value);
//     const m = d.getMonth(); // 0–11
//     const y = d.getFullYear();
//     setClosePeriodMonth(m + 1);
//     setClosePeriodYear(y);
//     setClosePeriodLabel(`${monthsHeader[m]} ${y}`);
//   }
  
  
//         const esc = cfg.find((c) => c.name === "escallation_percent");
//         if (esc?.value) setEscPercent(esc.value);
//       } catch {
//         setClosePeriod(null);
//         setClosePeriodLabel("");
//         setEscPercent("");
//       }
//     };
  
//    const isPeriodClosed = (period, year) => {
//     if (!closePeriodMonth || !closePeriodYear) return false;
//     if (year < closePeriodYear) return true;
//     if (year > closePeriodYear) return false;
//     return period <= closePeriodMonth;
//   };

//   // Map API response → table shape
//   // Expect each row from API like:
//   // { poolNumber, poolName, periods: [{ Period:1, Rate:1.1 }, ...] }
//  const mapApiData = (apiData) =>
//   apiData.map((row) => ({
//     poolNumber: row.poolNo,
//     poolName: row.poolName,
//     months: monthsHeader.map((_, idx) => {
//       const period = idx + 1;
//       const p = row.periodDetails?.find((x) => x.period === period) || {};
//       return {
//         rate: p.rate ?? "",
//         allocationAmt: p.allocationAmt ?? 0,
//         budgetAmt: p.budgetAmt ?? 0,
//       };
//     }),
//   }));

//   const fetchData = async (selectedYear) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await fetch(
//         `${backendUrl}/Orgnization/GetRates?fycd=${selectedYear}`
//       );

//       if (!response.ok) {
//         throw new Error("Failed to fetch pool rates");
//       }

//       const result = await response.json(); // should be array of rows
//       // When API is ready, map real data:
//       const mapped = mapApiData(result);
//       setData(mapped);

//       // For now, still show alt table from dummy
//       // setAltData(dummyAltPoolRateData);
//     } catch (err) {
//       // While API is not ready / fails, fall back to dummy
//         setError(e.message);
//        setData([])// hide error in UI if you want
//       // setData(dummyPoolRateData);
//       // setAltData(dummyAltPoolRateData);
//     } finally {
//       setLoading(false);
//     }
//   };

//  useEffect(() => {
//      fetchConfig();
//    }, []);
 
//    useEffect(() => {
//      fetchData(selectedYear);
//      // recompute totals after escPercent fetched
//    }, [selectedYear]);

//   return (
//     <div className="w-full border-line p-3">
//       <div className="flex items-center justify-between mb-3 gap-4">

//       <div className="text-sm text-gray-700">
//     Closing period:&nbsp;
//     <span className="font-semibold">
//       {closePeriodLabel || "—"}
//     </span>
//   </div>
//       {/* Fiscal year selector */}
//       <div className="flex items-center justify-end mb-3 gap-2">
//         <label className="text-sm font-medium text-gray-700">
//           Fiscal Year:
//         </label>
//         <select
//           className="border border-gray-300 rounded px-2 py-1 text-sm"
//           value={year}
//           onChange={(e) => setYear(e.target.value)}
//         >
//           {Array.from({ length: 5 }).map((_, i) => {
//             const y = new Date().getFullYear() - 2 + i;
//             return (
//               <option key={y} value={y}>
//                 {y}
//               </option>
//             );
//           })}
//         </select>
//       </div>
// </div>
//       {loading && <div className="table">
//         <div className="flex items-center justify-center py-4">
//                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                         <span className="ml-2 mt-4">
//                           Loading...
//                         </span>
//                       </div>
//                       </div>}
//       {error && (
//         <div className="table text-red-600">Error: {error}</div>
//       )}

//       <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
//                 <table className="table w-full">
//   <thead className="thead">
//     <tr>
//       <th rowSpan={2}>Pool Number</th>
//       <th rowSpan={2}>Pool Name</th>
//       {monthsHeader.map((m) => (
//         <th key={m} colSpan={1}>{m}</th>
//       ))}
//     </tr>
//     <tr>
//       {monthsHeader.map((_, i) => {
//         const period = i + 1;
//         const closed = isPeriodClosed(period, selectedYear);
//         return (
//           <th key={period}>
//             {closed ? 'Actual' : 'ETC'}
//           </th>
//         );
//       })}
//     </tr>
//   </thead>
//   <tbody>
//     {data.map((row) => (
//       <tr key={row.poolNumber}>
//         <td>{row.poolNumber}</td>
//         <td>{row.poolName}</td>
//         {row.months.map((m, i) => {
//           const period = i + 1;
//           const closed = isPeriodClosed(period, selectedYear);
//           return (
//             <td key={period} className="text-right">
//               {m.rate}
//             </td>
//           );
//         })}
//       </tr>
//     ))}
//   </tbody>
// </table>

//               </div>
//     </div>
//   );
// };

// export default Rates;


import React, { useState, useEffect } from "react";
import { backendUrl } from "./config";

const monthsHeader = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const Rates = () => {
  const [data, setData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [closePeriodMonth, setClosePeriodMonth] = useState(null); // 1–12
  const [closePeriodYear, setClosePeriodYear] = useState(null);
  const [closePeriodLabel, setClosePeriodLabel] = useState("");

  // -------- config: closing_period --------
  const fetchConfig = async () => {
    try {
      const res = await fetch(
        `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/xxxxx`
      );
      const cfg = await res.json();

      const closing = cfg.find((c) => c.name === "closing_period");
      if (closing?.value) {
        const d = new Date(closing.value);
        const m = d.getMonth(); // 0–11
        const y = d.getFullYear();
        setClosePeriodMonth(m + 1);
        setClosePeriodYear(y);
        setClosePeriodLabel(`${monthsHeader[m]} ${y}`);
      }
    } catch {
      setClosePeriodMonth(null);
      setClosePeriodYear(null);
      setClosePeriodLabel("");
    }
  };

  const isPeriodClosed = (period, year) => {
    if (!closePeriodMonth || !closePeriodYear) return false;
    if (year < closePeriodYear) return true;
    if (year > closePeriodYear) return false;
    return period <= closePeriodMonth;
  };

  // -------- map GetRates → table shape --------
  // API row example:
  // {
  //   poolName: "FRINGE",
  //   poolNo: 11,
  //   periodDetails: [{ period: 1, rate: 15.8924, allocationAmt: 0, budgetAmt: 0 }, ...]
  // }
  const mapApiData = (apiData) =>
  apiData.map((row) => {
    const rawName = row.poolName || "";
    const key = rawName.toString().toUpperCase(); // normalize
    return {
      poolNumber: row.poolNo,
      poolName: poolDisplayNames[key] || rawName, // fallback to backend value
      months: monthsHeader.map((_, idx) => {
        const period = idx + 1;
        const p = row.periodDetails?.find((x) => x.period === period) || {};
        return {
          rate: p.rate ?? "",
          // allocationAmt: p.allocationAmt ?? 0,
          // budgetAmt: p.budgetAmt ?? 0,
        };
      }),
    };
  });

  // const mapApiData = (apiData) =>
  //   apiData.map((row) => ({
  //     poolNumber: row.poolNo,
  //     poolName: row.poolName,
  //     months: monthsHeader.map((_, idx) => {
  //       const period = idx + 1;
  //       const p = row.periodDetails?.find((x) => x.period === period) || {};
  //       return {
  //         rate: p.rate ?? ""
  //       };
  //     })
  //   }));

  const fetchData = async (year) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${backendUrl}/Orgnization/GetRates?fycd=${year}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch pool rates");
      }
      const result = await response.json();
      const mapped = mapApiData(result);
      setData(mapped);
    } catch (e) {
      setError(e.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchData(selectedYear);
  }, [selectedYear]);

  const formatNumber = (n) =>
    n === null || n === undefined || n === ""
      ? ""
      : Number(n).toLocaleString(undefined, {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4
        });

const poolDisplayNames = {
  FRINGE: "Fringe Benefits",
  HR: "Human Resources",
  OVERHEAD: "Overhead",
  MNH: "Mat & Handling",
  GNA: "General & Admin",
};  


  if (loading) {
    return <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 mt-4">
                          Loading...
                        </span>
                      </div>
                      ;
  }

  if (error) {
    return <div className="table text-red-600">Error: {error}</div>;
  }

  return (
    <div className="w-full border border-gray-200 rounded-lg shadow-sm bg-white p-6 space-y-6">
      {/* Top bar – follow Fringe style */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Closing period&nbsp;
            <span className="font-semibold text-gray-900">
              {closePeriodLabel || "-"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Year:
          </label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Rates table – one table, Actual vs ETC in month header, sticky like Fringe */}
      <div className="space-y-2">
        {/* <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-2 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
          Pool Rates by Month
        </h3> */}

        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm max-h-[400px] bg-white">
          <table className="table w-full min-w-[900px]">
            <thead className="thead bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-20 border-b-2 border-gray-200">
              <tr>
                <th
                  className="th-thead border border-gray-200 font-semibold text-gray-900 py-3 px-4 text-left whitespace-nowrap"
                  rowSpan={2}
                >
                  Pool Number
                </th>
                <th
                  className="th-thead border border-gray-200 font-semibold text-gray-900 py-3 px-4 text-left whitespace-nowrap"
                  rowSpan={2}
                >
                  Pool Name
                </th>
                {monthsHeader.map((m) => (
                  <th
                    key={m}
                    className="th-thead border border-gray-200 font-semibold text-gray-900 py-3 px-2 text-center whitespace-nowrap"
                    colSpan={1}
                  >
                    {m}
                  </th>
                ))}
              </tr>
              <tr>
                {monthsHeader.map((_, i) => {
                  const period = i + 1;
                  const closed = isPeriodClosed(period, selectedYear);
                  return (
                    <th
                      key={period}
                      className={
                        "th-thead border border-gray-200 font-semibold text-gray-900 py-2 px-2 text-center " +
                        (closed
                          ? "bg-gradient-to-r from-green-100 to-green-200"
                          : "bg-gradient-to-r from-orange-100 to-orange-200")
                      }
                    >
                      {closed ? "Actual" : "ETC"}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="tbody divide-y divide-gray-100">
              {data.map((row) => (
                <tr
                  key={row.poolNumber}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap font-mono text-sm">
                    {row.poolNumber}
                  </td>
                  <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap text-sm">
                    {row.poolName}
                  </td>
                  {row.months.map((m, i) => {
                    const period = i + 1;
                    // closed only affects header label (Actual/ETC),
                    // numeric value is the same `m.rate`
                    const closed = isPeriodClosed(period, selectedYear);
                    return (
                      <td
                        key={period}
                        className={
                          "tbody-td border border-gray-200 py-2 px-2 text-right font-mono text-xs " +
                          (closed ? "bg-white" : "bg-white")
                        }
                      >
                        {formatNumber(m.rate)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td
                    className="py-4 px-4 text-center text-sm text-gray-500"
                    colSpan={2 + monthsHeader.length}
                  >
                    No rates available for the selected year.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Rates;
