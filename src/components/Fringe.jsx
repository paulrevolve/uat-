// // import React, { useState, useEffect } from 'react';
// // import { backendUrl } from './config';

// // const Fringe = () => {
// //   const [data, setData] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   useEffect(() => {
// //     const fetchData = async () => {
// //       try { 
// //         setLoading(true);
// //         // Replace with your actual API endpoint
// //         const response = await fetch(`${backendUrl}/Orgnization/GetHR`);
// //         if (!response.ok) throw new Error('Failed to fetch data');
// //         const result = await response.json();
// //         setData(result);
// //       } catch (err) {
// //         setError(err.message);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchData();
// //   }, []);

// //   if (loading) return <div className="table">Loading...</div>;
// //   if (error) return <div className="table text-red-600">Error: {error}</div>;

// //   return (
// //       <div className="overflow-x-auto w-full border-line">
// //         <table className="table w-full">
// //           <thead className="thead">
// //             <tr>
// //                 <th className="th-thead border border-gray-200">Account Id</th>
// //               <th className="th-thead border border-gray-200">Org Id</th>
// //               <th className="th-thead border border-gray-200">Actual Amt</th>
// //               <th className="th-thead border border-gray-200">Budget Amt</th>
// //             </tr>
// //           </thead>
// //           <tbody className="tbody">
// //             {data.map((item, index) => (
// //               <tr key={item.id || index}>
// //                 <td className="tbody-td border border-gray-200">{item.orgId}</td>
// //                 <td className="tbody-td border border-gray-200">{item.acctId}</td>
// //                 <td className="tbody-td border border-gray-200">{item.actualAmt}</td>
// //                 <td className="tbody-td border border-gray-200">{item.budgetedAmt}</td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>
    
// //   );
// // };

// // export default Fringe;


// import React, { useState, useEffect } from "react";
// import { backendUrl } from "./config";

// const monthsHeader = [
//   "Jan","Feb","Mar","Apr","May","Jun",
//   "Jul","Aug","Sep","Oct","Nov","Dec"
// ];

// const Fringe = () => {
//   const [data, setData] = useState([]);
//   const [year, setYear] = useState(new Date().getFullYear());
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [baseData, setBaseData] = useState([]);
// const [closePeriod, setClosePeriod] = useState(null);   // 1–12
// const [closePeriodLabel, setClosePeriodLabel] = useState(""); // "Jan 2024"
// const [escPercent, setEscPercent] = useState("");

// const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// const fetchConfig = async () => {
//   const res = await fetch(
//     `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/xxxxx`
//   );
//   const cfg = await res.json(); // array like the one you showed

//   const closing = cfg.find((c) => c.name === "closing_period");
//   if (closing?.value) {
//     const d = new Date(closing.value);        // "2024-01-31"
//     const m = d.getMonth();                   // 0-based
//     const y = d.getFullYear();
//     setClosePeriod(m + 1);                    // 1–12
//     setClosePeriodLabel(`${monthNames[m]} ${y}`);
//   }

//   const esc = cfg.find((c) => c.name === "escallation_percent");
//   if (esc?.value) {
//     setEscPercent(esc.value);  // "10"
//   }

// };


// useEffect(() => {
//   fetchConfig();
// }, []);

//   // dummy API-shaped data (matches your example)
// const dummyApiData = [
//   {
//     orgId: "1.02.01",
//     acctId: "647-007-140",
//     ytdActual: 840,
//     ytdBudget: 7999,
//     periods: [
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 1 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 2 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 3 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 4 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 5 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 6 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 7 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 8 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 9 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 10 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 11 },
//       { Actualamt: 840, BudgetedAmt: 7999, Period: 12 },
//     ],
//   },
// ];
// const dummyClosePeriod = 6; 

// const dummyBaseApiData = [
//   {
//     orgId: "1.02.01",
//     acctId: "647-007-140",
//     baseamt: 840,
//     YTDallocationamt: 840,
//     YTDBudgetedAmt: 7999,
//     YTDbudgetedAmt: 7999,
//     periods: [
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 1 },
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 2 },
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 3 },
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 4 },
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 5 },
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 6 },          // one month
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 7 },
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 8 },
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 9 },
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 10 },
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 11 },
//       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 12 },
//     ],
//   },
// ];

// const mapBaseApiData = (apiData) =>
//   apiData.map((row) => ({
//     orgId: row.orgId,
//     acctId: row.acctId,
//     ytdBase: row.YTDBudgetedAmt,
//     ytdAllocation: row.YTDallocationamt,
//     ytdBudget:   row.YTDbudgetedAmt,
//     months: monthsHeader.map((_, idx) => {
//       const period = idx + 1;
//       const p = row.periods?.find((x) => x.Period === period) || {};
//       return {
//         // for base table show allocation as “Actual” and BudgetedAmt as “Budget”
//         base:  p.baseamt ?? "",
//         allocation: p.allocationamt ?? "",
//         budget: p.BudgetedAmt ?? "",
//       };
//     }),
//   }));


// const mapApiData = (apiData) =>
//   apiData.map((row) => ({
//     orgId: row.orgId,
//     acctId: row.acctId,
//     ytdActual: row.ytdActualAmt,       // from API
//     ytdBudget: row.ytdBudgetedAmt,     // from API
//     months: monthsHeader.map((_, idx) => {
//       const period = idx + 1;
//       const p =
//         row.periodDetails?.find((d) => d.period === period) || {};

//       return {
//         actual: p.actualamt ?? "",
//         budget: p.budgetedAmt ?? "",
//       };
//     }),
//   }));


//   const fetchData = async (selectedYear) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await fetch(
        
//         `${backendUrl}/Orgnization/GetHR?fycd=${selectedYear}`
//       );
//       if (!response.ok) throw new Error("Failed to fetch data");

//       const result = await response.json();
//       const mapped = mapApiData(result);
//       setData(mapped);
//     } catch (err) {
//     //   setError(err.message);
//      setError(null);  
//     //   const mapped = mapApiData(dummyApiData);
//     //   setData(mapped);
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

// // const fetchData = async (selectedYear) => {
// //   try {
// //     setLoading(true);
// //     setError(null);

// //     const yearParam = `"${String(selectedYear)}"`; // → "\"2025\""
// //     const url = `${backendUrl}/Orgnization/GetHR?year=${encodeURIComponent(yearParam)}`;

// //     const response = await fetch(url);
// //     if (!response.ok) throw new Error("Failed to fetch data");

// //     const result = await response.json();
// //     const combined = [...result, ...dummyApiData];
// //     const mapped = mapApiData(combined);
// //     setData(mapped);
// //   } catch (err) {
// //     //   setError(err.message);
// //     setError(null);
// //     const mapped = mapApiData(dummyApiData);
// //     setData(mapped);
// //     //   setData([]);
// //   } finally {
// //     setLoading(false);
// //   }
// // };



//   useEffect(() => {
//     fetchData(year);
//   }, [year]);

//   useEffect(() => {
//   // after fetching or while using dummy:
//   setBaseData(mapBaseApiData(dummyBaseApiData));
// }, []);

//   return (
//     <div className="w-full border-line p-3">
//         {/* Cost Account table */}
//     {/* Close Period */}
//       <div className="flex items-center justify-end mb-3 gap-2">
//   <div className="flex items-center gap-2">
//   <label className="text-sm text-gray-700">Rate:</label>

//   <div className="flex items-center border border-gray-300 rounded px-2 py-1 h-6">
//     <input
//       type="number"
//       className="text-sm w-12 outline-none"
//       value={escPercent}
//       onChange={(e) => setEscPercent(e.target.value)}
//       disabled
//     />
//     <span className="text-sm text-gray-600 ml-1">%</span>
//   </div>
// </div>

//           <div className="text-sm text-gray-700">
//     Closing period:&nbsp;
//     <span className="font-semibold">
//       {closePeriodLabel || "—"}
//     </span>
//   </div>
//  {/* Year selector */}
//  <div className="flex items-center gap-2">
//         <label className="text-sm font-medium text-gray-700">Year:</label>
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
//         </div>
//       </div>

//       {loading && <div className="table">Loading...</div>}
//       {error && (
//         <div className="table text-red-600">Error: {error}</div>
//       )}

//       {!loading && !error && (
//         <div className="overflow-x-auto  max-h-[60vh] overflow-y-auto" >
//              <h3 className="text-sm font-semibold mb-2">Cost Account</h3>
//           <table className="table w-full">
//             <thead className="thead">
//               {/* Row 1: Org/Account + months */}
//               <tr>
//                 <th className="th-thead border border-black whitespace-nowrap" rowSpan={2}>
//                   Account Id
//                 </th>
//                 <th className="th-thead border border-black whitespace-nowrap" rowSpan={2}>
//                   Org Id
//                 </th>
//                  <th className="th-thead border border-black whitespace-nowrap" rowSpan={2}>
//                   YTD Actual
//                 </th>
//                  <th className="th-thead border border-black whitespace-nowrap" rowSpan={2}>
//                   YTD Budget
//                 </th>
//                 {monthsHeader.map((m) => (
//                   <th
//                     key={m}
//                     className="th-thead border border-black"
//                     colSpan={1}
//                   >
//                     {m}
//                   </th>
//                 ))}
//               </tr>

//               {/* Row 2: Actual / Budget per month */}
//  {/* <tr>
//   {monthsHeader.map((_, i) => {
//     const period = i + 1;
//     const isClosed = closePeriod ? period <= closePeriod : false;

//     return (
//       <React.Fragment key={period}>
//         <th className="th-thead border border-black">
//           {isClosed ? "Actual" : "Budget"}
//         </th>
//         <th className="th-thead border border-black">Budget</th>
//       </React.Fragment>
//     );
//   })}
// </tr> */}
// <tr>
//   {monthsHeader.map((_, i) => {
//     const period = i + 1;
//     const isClosed = closePeriod ? period <= closePeriod : false;

//     return (
//       <React.Fragment key={period}>
//         <th className="th-thead border border-black">
//           {isClosed ? "Actual" : "Budget"}
//         </th>
//         {/* <th className="th-thead border border-black">Budget</th> */}
//       </React.Fragment>
//     );
//   })}
// </tr>

//             </thead>

//             <tbody className="tbody">
//               {data.map((item, idx) => (
//                 <tr key={idx}>
//                   <td className="tbody-td border border-black whitespace-nowrap">
//                     {item.acctId}
//                   </td>
//                   <td className="tbody-td border border-black whitespace-nowrap">
//                     {item.orgId}
//                   </td>
//              <td className="tbody-td border border-black">{item.ytdActual}</td>
//       <td className="tbody-td border border-black">{item.ytdBudget}</td>

//                   {/* {item.months.map((m, i) => (
//                     <React.Fragment key={i}>
//                       <td className="tbody-td border border-black">
//                         {m.actual}
//                       </td>
//                       <td className="tbody-td border border-black">
//                         {m.budget}
//                       </td>
//                     </React.Fragment>
//                   ))} */}
                  
//       {item.months.map((m, i) => {
//         const period = i + 1;
//         const isClosed = closePeriod ? period <= closePeriod : false;

//         return (
//           <React.Fragment key={period}>
//             <td className="tbody-td border border-black">
//               {isClosed ? m.actual : m.budget}
//             </td>
//             {/* <td className="tbody-td border border-black">
//               {m.budget}
//             </td> */}
//           </React.Fragment>
//         );
//       })}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Base Account table */}
// <div className="mt-6 overflow-x-auto max-h-[60vh] overflow-y-auto">
//   <h3 className="text-sm font-semibold mb-2">Base Account</h3>
//   <table className="table w-full">
//     <thead className="thead">
//       <tr>
//         <th className="th-thead border border-black whitespace-nowrap" rowSpan={2}>Account Id</th>
//         <th className="th-thead border border-black" rowSpan={2}>Org Id</th>
//         <th className="th-thead border border-black" rowSpan={2}>YTD Base</th>
//         <th className="th-thead border border-black" rowSpan={2}>YTD Allocation</th>
//         <th className="th-thead border border-black" rowSpan={2}>YTD Budget</th>
//         {monthsHeader.map((m) => (
//           <th key={m} className="th-thead border border-black" colSpan={2}>
//             {m}
//           </th>
//         ))}
//       </tr>
//       <tr>
//         {monthsHeader.map((_, i) => (
//           <React.Fragment key={i}>
//             <th className="th-thead border border-black">Base</th>
//             <th className="th-thead border border-black">Allocation</th>
//             {/* <th className="th-thead border border-black">Budget</th> */}
//           </React.Fragment>
//         ))}
//       </tr>
//     </thead>

//     <tbody className="tbody">
//       {baseData.map((item, idx) => (
//         <tr key={idx}>
//           <td className="tbody-td border border-black whitespace-nowrap">{item.acctId}</td>
//           <td className="tbody-td border border-black">{item.orgId}</td>
//           <td className="tbody-td border border-black">{item.ytdBase}</td>
//           <td className="tbody-td border border-black">{item.ytdAllocation}</td>
//           <td className="tbody-td border border-black">{item.ytdBudget}</td>

//           {item.months.map((m, i) => (
//             <React.Fragment key={i}>
//               <td className="tbody-td border border-black">{m.base}</td>
//               <td className="tbody-td border border-black">{m.allocation}</td>
//               {/* <td className="tbody-td border border-black">{m.budget}</td> */}
//             </React.Fragment>
//           ))}
//         </tr>
//       ))}
//     </tbody>
//   </table>
// </div>

//     </div>
//   );
// };

// export default Fringe;


import React, { useState, useEffect } from "react";
import { backendUrl } from "./config";

const monthsHeader = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

const Fringe = () => {
  const [costData, setCostData] = useState([]);
  const [baseData, setBaseData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [closePeriod, setClosePeriod] = useState(null);
  const [closePeriodLabel, setClosePeriodLabel] = useState("");
  const [escPercent, setEscPercent] = useState("");   // escalation %
  const [rate, setRate] = useState(0);
  const [closePeriodMonth, setClosePeriodMonth] = useState(null); // 1–12
const [closePeriodYear, setClosePeriodYear] = useState(null);




  const [costTotals, setCostTotals] = useState({
  totalYTDCostActualAmt: 0,
  totalYTDCostBudgetAmt: 0,
  monthTotals: Array(12).fill(0),
});

const [baseTotals, setBaseTotals] = useState({
  ytdBaseTotal: 0,
  ytdAllocTotal: 0,
  ytdBudgetTotal: 0,
  monthBaseTotals: Array(12).fill(0),
  monthAllocTotals: Array(12).fill(0),
});


  const monthNames = monthsHeader;

  // config: closing_period + escallation_percent
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


      const esc = cfg.find((c) => c.name === "escallation_percent");
      if (esc?.value) setEscPercent(esc.value);
    } catch {
      setClosePeriod(null);
      setClosePeriodLabel("");
      setEscPercent("");
    }
  };

 const isPeriodClosed = (period, year) => {
  if (!closePeriodMonth || !closePeriodYear) return false;
  if (year < closePeriodYear) return true;
  if (year > closePeriodYear) return false;
  return period <= closePeriodMonth;
};

  // map cost detail
  const mapCostData = (rows) =>
    rows.map((row) => ({
      orgId: row.orgId,
      acctId: row.acctId,
      ytdActual: row.ytdActualAmt,
      ytdBudget: row.ytdBudgetedAmt,
      months: monthsHeader.map((_, idx) => {
        const period = idx + 1;
        const p =
          row.periodDetails?.find((d) => d.period === period) || {};
        return {
          actual: p.actualamt ?? "",
          budget: p.budgetedAmt ?? "",
        };
      }),
    }));

  // map base detail
const mapBaseData = (rows) =>
  rows.map((row) => ({
    orgId: row.orgId,
    acctId: row.acctId,
    ytdBase: row.ytdActualAmt,          // 22,111,491.57
    ytdAllocation: row.ytdAllocationAmt, // 3,561,851.73
    ytdBudget: row.ytdBudgetedAmt,      // 0
    months: monthsHeader.map((_, idx) => {
      const period = idx + 1;
      const p =
        row.periodDetails?.find((d) => d.period === period) || {};
      return {
        base: p.baseAmt ?? 0,
        allocation: p.allocationAmt ?? 0,
      };
    }),
  }));


  const calcCostTotals = (rows) => {
  const totalYTDCostActualAmt = rows.reduce(
    (sum, r) => sum + (Number(r.ytdActual) || 0),
    0
  );

  const totalYTDCostBudgetAmt = rows.reduce(
    (sum, r) => sum + (Number(r.ytdBudget) || 0),
    0
  );
  const monthTotals = monthsHeader.map((_, idx) =>
    rows.reduce(
      (sum, r) => sum + (Number(r.months[idx]?.actual) || 0),
      0
    )
  );

  return { totalYTDCostActualAmt, monthTotals ,totalYTDCostBudgetAmt};
};

const calcBaseTotals = (rows) => {
  const ytdBaseTotal = rows.reduce(
    (sum, r) => sum + (Number(r.ytdBase) || 0),
    0
  );
  const ytdAllocTotal = rows.reduce(
    (sum, r) => sum + (Number(r.ytdAllocation) || 0),
    0
  );
  const ytdBudgetTotal = rows.reduce(
    (sum, r) => sum + (Number(r.ytdBudget) || 0),
    0
  );

  const monthBaseTotals = monthsHeader.map((_, idx) =>
    rows.reduce(
      (sum, r) => sum + (Number(r.months[idx]?.base) || 0),
      0
    )
  );
  const monthAllocTotals = monthsHeader.map((_, idx) =>
    rows.reduce(
      (sum, r) => sum + (Number(r.months[idx]?.allocation) || 0),
      0
    )
  );

  return {
    ytdBaseTotal,
    ytdAllocTotal,
    ytdBudgetTotal,
    monthBaseTotals,
    monthAllocTotals,
  };
};

    const fetchData = async (selectedYear) => {
        try {
        setLoading(true);
        setError(null);

        const res = await fetch(
            `${backendUrl}/Orgnization/GetHR?fycd=${selectedYear}&type=FRINGE`
        );
        if (!res.ok) throw new Error("Failed to fetch data");

        const json = await res.json();
        const costRaw = json.poolOrgCostFinancialDetail || [];
        const baseRaw = json.poolOrgBaseFinancialDetail || [];

        const mappedCost = mapCostData(costRaw);
        const mappedBase = mapBaseData(baseRaw);

        setCostData(mappedCost);
        setCostTotals(calcCostTotals(mappedCost));
setRate(json.rate ?? 0);
        setBaseData(mappedBase);
        setBaseTotals(calcBaseTotals(mappedBase));
        } catch (e) {
        setError(e.message);
        setCostData([]);
        setBaseData([]);
        } finally {
        setLoading(false);
        }
    };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchData(selectedYear);
    // recompute totals after escPercent fetched
  }, [selectedYear]);

  const formatNumber = (n) =>
    n === null || n === undefined || n === ""
      ? ""
      : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="w-full border-line p-3">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 gap-4">
  {/* Escalation + rate (same styling) */}
  <div className="flex items-center gap-2">
    <label className="text-sm font-medium text-gray-700">
      Rate:
    </label>
    <input
      type="text"
      className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
      value={
           `${formatNumber(rate)}`
      }
      readOnly
    />
  </div>

  {/* Closing period + Year selector keep same as before */}
  <div className="text-sm text-gray-700">
    Closing period:&nbsp;
    <span className="font-semibold">
      {closePeriodLabel || "—"}
    </span>
  </div>

  <div className="flex items-center gap-2">
    <label className="text-sm font-medium text-gray-700">Year:</label>
    <select
      className="border border-gray-300 rounded px-2 py-1 text-sm"
      value={selectedYear}
      onChange={(e) => setSelectedYear(e.target.value)}
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
</div>


      {loading && <div className="table">Loading...</div>}
      {error && <div className="table text-red-600">Error: {error}</div>}

      {/* COST TABLE */}
      {!loading && !error && (
        <>
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <h3 className="text-sm font-semibold mb-2">Cost Account</h3>
          <table className="table w-full">
            <thead className="thead">
              <tr>
                <th className="th-thead border border-black" rowSpan={2}>
                  Account Id
                </th>
                <th className="th-thead border border-black" rowSpan={2}>
                  Org Id
                </th>
                <th className="th-thead border border-black" rowSpan={2}>
                  YTD Actual
                </th>
                <th className="th-thead border border-black" rowSpan={2}>
                  YTD Budget
                </th>
                {monthsHeader.map((m) => (
                  <th
                    key={m}
                    className="th-thead border border-black"
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
        className="th-thead border border-black"
      >
        {closed ? "Actual" : "Budget"}
      </th>
    );
  })}
</tr>
            </thead>
            <tbody className="tbody">
              {costData.map((item, idx) => (
                <tr key={idx}>
                  <td className="tbody-td border border-black whitespace-nowrap">
                    {item.acctId}
                  </td>
                  <td className="tbody-td border border-black whitespace-nowrap">
                    {item.orgId}
                  </td>
                  <td className="tbody-td border border-black">
                    {formatNumber(item.ytdActual)}
                  </td>
                  <td className="tbody-td border border-black">
                    {formatNumber(item.ytdBudget)}
                  </td>

                  {item.months.map((m, i) => {
  const period = i + 1;
  const closed = isPeriodClosed(period, selectedYear);

  return (
    <React.Fragment key={period}>
      <td className="tbody-td border border-black">
        {formatNumber(closed ? m.actual : m.budget)}
      </td>
    </React.Fragment>
  );
})}

                </tr>
              ))}
            </tbody>
<tfoot>
  <tr className="sticky-tfoot">
    <td className="tbody-td border border-black font-semibold" colSpan={2}>
      Totals :
    </td>
    <td className="tbody-td border border-black font-semibold">
      {formatNumber(costTotals.totalYTDCostActualAmt)}
    </td>
     <td className="tbody-td border border-black font-semibold">
      {formatNumber(costTotals.totalYTDCostBudgetAmt)}
    </td>
     
    {monthsHeader.map((_, i) => (
      <td key={i} className="tbody-td border border-black font-semibold">
        {formatNumber(costTotals.monthTotals[i] ?? 0)}
      </td>
    ))}
  </tr>
</tfoot>


          </table>
        </div>
      {/* )} */}

      {/* BASE TABLE */}
      <div className="mt-6 overflow-x-auto max-h-[60vh] overflow-y-auto">
  <h3 className="text-sm font-semibold mb-2">Base Account</h3>
  <table className="table w-full">
    <thead className="thead">
      <tr>
        <th className="th-thead border border-black" rowSpan={2}>
          Account Id
        </th>
        <th className="th-thead border border-black" rowSpan={2}>
          Org Id
        </th>
        <th className="th-thead border border-black" rowSpan={2}>
          YTD Base
        </th>
        <th className="th-thead border border-black" rowSpan={2}>
          YTD Allocation
        </th>
        <th className="th-thead border border-black" rowSpan={2}>
          YTD Budget
        </th>
        {monthsHeader.map((m) => (
          <th
            key={m}
            className="th-thead border border-black"
            colSpan={2}
          >
            {m}
          </th>
        ))}
      </tr>
      <tr>
        {monthsHeader.map((_, i) => (
          <React.Fragment key={i}>
            <th className="th-thead border border-black">Base</th>
            <th className="th-thead border border-black">
              Allocation
            </th>
          </React.Fragment>
        ))}
      </tr>
    </thead>

    <tbody className="tbody">
      {baseData.map((item, idx) => (
        <tr key={idx}>
          <td className="tbody-td border border-black whitespace-nowrap">
            {item.acctId}
          </td>
          <td className="tbody-td border border-black">
            {item.orgId}
          </td>
          <td className="tbody-td border border-black">
          {formatNumber(item.ytdBase)}
          </td>
          <td className="tbody-td border border-black">
            {formatNumber(item.ytdAllocation)}
          </td>
          <td className="tbody-td border border-black">
            {formatNumber(item.ytdBudget)}
          </td>

          {item.months.map((m, i) => (
            <React.Fragment key={i}>
              <td className="tbody-td border border-black">
                {formatNumber(m.base)}
              </td>
              <td className="tbody-td border border-black">
                {formatNumber(m.allocation)}
              </td>
            </React.Fragment>
          ))}
        </tr>
      ))}
    </tbody>

   <tfoot>
  <tr className="sticky-tfoot">
    <td className="tbody-td border border-black font-semibold" colSpan={2}>
      Totals:
    </td>
    <td className="tbody-td border border-black font-semibold">
      {formatNumber(baseTotals.ytdBaseTotal)}
    </td>
    <td className="tbody-td border border-black font-semibold">
      {formatNumber(baseTotals.ytdAllocTotal)}
    </td>
    <td className="tbody-td border border-black font-semibold">
      {formatNumber(baseTotals.ytdBudgetTotal)}
    </td>
    {monthsHeader.map((_, i) => (
      <React.Fragment key={i}>
        <td className="tbody-td border border-black font-semibold">
          {formatNumber(baseTotals.monthBaseTotals[i] ?? 0)}
        </td>
        <td className="tbody-td border border-black font-semibold">
          {formatNumber(baseTotals.monthAllocTotals[i] ?? 0)}
        </td>
      </React.Fragment>
    ))}
  </tr>
</tfoot>


  </table>
</div>
</>
  )}
    </div>
  );
};

export default Fringe;
