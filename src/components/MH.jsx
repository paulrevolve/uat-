import React, { useState, useEffect } from 'react';
import { backendUrl } from './config';

const monthsHeader = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

const MH = () => {
 const [data, setData] = useState([]);
   const [year, setYear] = useState(new Date().getFullYear());
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const [baseData, setBaseData] = useState([]);
 const [closePeriod, setClosePeriod] = useState(null);   // 1–12
 const [closePeriodLabel, setClosePeriodLabel] = useState(""); // "Jan 2024"
 const [escPercent, setEscPercent] = useState("");
 
 const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
 
 const fetchConfig = async () => {
   const res = await fetch(
     `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/xxxxx`
   );
   const cfg = await res.json(); // array like the one you showed
 
   const closing = cfg.find((c) => c.name === "closing_period");
   if (closing?.value) {
     const d = new Date(closing.value);        // "2024-01-31"
     const m = d.getMonth();                   // 0-based
     const y = d.getFullYear();
     setClosePeriod(m + 1);                    // 1–12
     setClosePeriodLabel(`${monthNames[m]} ${y}`);
   }
 
   const esc = cfg.find((c) => c.name === "escallation_percent");
   if (esc?.value) {
     setEscPercent(esc.value);  // "10"
   }
 
 };
 
 
 useEffect(() => {
   fetchConfig();
 }, []);
 
   // dummy API-shaped data (matches your example)
 const dummyApiData = [
   {
     orgId: "1.02.01",
     acctId: "647-007-140",
     ytdActual: 840,
     ytdBudget: 7999,
     periods: [
       { Actualamt: 840, BudgetedAmt: 7999, Period: 1 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 2 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 3 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 4 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 5 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 6 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 7 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 8 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 9 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 10 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 11 },
       { Actualamt: 840, BudgetedAmt: 7999, Period: 12 },
     ],
   },
 ];
 const dummyClosePeriod = 6; 
 
 const dummyBaseApiData = [
   {
     orgId: "1.02.01",
     acctId: "647-007-140",
     baseamt: 840,
     YTDallocationamt: 840,
     YTDBudgetedAmt: 7999,
     YTDbudgetedAmt: 7999,
     periods: [
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 1 },
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 2 },
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 3 },
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 4 },
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 5 },
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 6 },          // one month
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 7 },
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 8 },
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 9 },
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 10 },
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 11 },
       { baseamt: 840, allocationamt: 840, BudgetedAmt: 7999, Period: 12 },
     ],
   },
 ];
 
 const mapBaseApiData = (apiData) =>
   apiData.map((row) => ({
     orgId: row.orgId,
     acctId: row.acctId,
     ytdBase: row.YTDBudgetedAmt,
     ytdAllocation: row.YTDallocationamt,
     ytdBudget:   row.YTDbudgetedAmt,
     months: monthsHeader.map((_, idx) => {
       const period = idx + 1;
       const p = row.periods?.find((x) => x.Period === period) || {};
       return {
         // for base table show allocation as “Actual” and BudgetedAmt as “Budget”
         base:  p.baseamt ?? "",
         allocation: p.allocationamt ?? "",
         budget: p.BudgetedAmt ?? "",
       };
     }),
   }));
 
 
 const mapApiData = (apiData) =>
   apiData.map((row) => ({
     orgId: row.orgId,
     acctId: row.acctId,
     ytdActual: row.ytdActualAmt,       // from API
     ytdBudget: row.ytdBudgetedAmt,     // from API
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
 
 
   const fetchData = async (selectedYear) => {
     try {
       setLoading(true);
       setError(null);
 
       const response = await fetch(
         
         `${backendUrl}/Orgnization/GetFringe?fycd=${selectedYear}`
       );
       if (!response.ok) throw new Error("Failed to fetch data");
 
       const result = await response.json();
     //   const combined = [...result, ...dummyApiData];
       const mapped = mapApiData(result);
       setData(mapped);
     } catch (err) {
     //   setError(err.message);
      setError(null);  
       const mapped = mapApiData(dummyApiData);
       setData(mapped);
     //   setData([]);
     } finally {
       setLoading(false);
     }
   };
 
 // const fetchData = async (selectedYear) => {
 //   try {
 //     setLoading(true);
 //     setError(null);
 
 //     const yearParam = `"${String(selectedYear)}"`; // → "\"2025\""
 //     const url = `${backendUrl}/Orgnization/GetFringe?year=${encodeURIComponent(yearParam)}`;
 
 //     const response = await fetch(url);
 //     if (!response.ok) throw new Error("Failed to fetch data");
 
 //     const result = await response.json();
 //     const combined = [...result, ...dummyApiData];
 //     const mapped = mapApiData(combined);
 //     setData(mapped);
 //   } catch (err) {
 //     //   setError(err.message);
 //     setError(null);
 //     const mapped = mapApiData(dummyApiData);
 //     setData(mapped);
 //     //   setData([]);
 //   } finally {
 //     setLoading(false);
 //   }
 // };
 
 
 
   useEffect(() => {
     fetchData(year);
   }, [year]);
 
   useEffect(() => {
   // after fetching or while using dummy:
   setBaseData(mapBaseApiData(dummyBaseApiData));
 }, []);
 
   return (
     <div className="w-full border-line p-3">
         {/* Cost Account table */}
     {/* Close Period */}
       <div className="flex items-center justify-end mb-3 gap-2">
   <div className="flex items-center gap-2">
   <label className="text-sm text-gray-700">Rate:</label>
 
   <div className="flex items-center border border-gray-300 rounded px-2 py-1 h-6">
     <input
       type="number"
       className="text-sm w-12 outline-none"
       value={escPercent}
       onChange={(e) => setEscPercent(e.target.value)}
       disabled
     />
     <span className="text-sm text-gray-600 ml-1">%</span>
   </div>
 </div>
 
           <div className="text-sm text-gray-700">
     Closing period:&nbsp;
     <span className="font-semibold">
       {closePeriodLabel || "—"}
     </span>
   </div>
  {/* Year selector */}
  <div className="flex items-center gap-2">
         <label className="text-sm font-medium text-gray-700">Year:</label>
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
       </div>
 
       {loading && <div className="table">Loading...</div>}
       {error && (
         <div className="table text-red-600">Error: {error}</div>
       )}
 
       {!loading && !error && (
         <div className="overflow-x-auto  max-h-[60vh] overflow-y-auto" >
              <h3 className="text-sm font-semibold mb-2">Cost Account</h3>
           <table className="table w-full">
             <thead className="thead">
               {/* Row 1: Org/Account + months */}
               <tr>
                 <th className="th-thead border border-black whitespace-nowrap" rowSpan={2}>
                   Account Id
                 </th>
                 <th className="th-thead border border-black whitespace-nowrap" rowSpan={2}>
                   Org Id
                 </th>
                  <th className="th-thead border border-black whitespace-nowrap" rowSpan={2}>
                   YTD Actual
                 </th>
                  <th className="th-thead border border-black whitespace-nowrap" rowSpan={2}>
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
 
               {/* Row 2: Actual / Budget per month */}
  {/* <tr>
   {monthsHeader.map((_, i) => {
     const period = i + 1;
     const isClosed = closePeriod ? period <= closePeriod : false;
 
     return (
       <React.Fragment key={period}>
         <th className="th-thead border border-black">
           {isClosed ? "Actual" : "Budget"}
         </th>
         <th className="th-thead border border-black">Budget</th>
       </React.Fragment>
     );
   })}
 </tr> */}
 <tr>
   {monthsHeader.map((_, i) => {
     const period = i + 1;
     const isClosed = closePeriod ? period <= closePeriod : false;
 
     return (
       <React.Fragment key={period}>
         <th className="th-thead border border-black">
           {isClosed ? "Actual" : "Budget"}
         </th>
         {/* <th className="th-thead border border-black">Budget</th> */}
       </React.Fragment>
     );
   })}
 </tr>
 
             </thead>
 
             <tbody className="tbody">
               {data.map((item, idx) => (
                 <tr key={idx}>
                   <td className="tbody-td border border-black whitespace-nowrap">
                     {item.acctId}
                   </td>
                   <td className="tbody-td border border-black whitespace-nowrap">
                     {item.orgId}
                   </td>
              <td className="tbody-td border border-black">{item.ytdActual}</td>
       <td className="tbody-td border border-black">{item.ytdBudget}</td>
 
                   {/* {item.months.map((m, i) => (
                     <React.Fragment key={i}>
                       <td className="tbody-td border border-black">
                         {m.actual}
                       </td>
                       <td className="tbody-td border border-black">
                         {m.budget}
                       </td>
                     </React.Fragment>
                   ))} */}
                   
       {item.months.map((m, i) => {
         const period = i + 1;
         const isClosed = closePeriod ? period <= closePeriod : false;
 
         return (
           <React.Fragment key={period}>
             <td className="tbody-td border border-black">
               {isClosed ? m.actual : m.budget}
             </td>
             {/* <td className="tbody-td border border-black">
               {m.budget}
             </td> */}
           </React.Fragment>
         );
       })}
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       )}
 
       {/* Base Account table */}
 <div className="mt-6 overflow-x-auto max-h-[60vh] overflow-y-auto">
   <h3 className="text-sm font-semibold mb-2">Base Account</h3>
   <table className="table w-full">
     <thead className="thead">
       <tr>
         <th className="th-thead border border-black whitespace-nowrap" rowSpan={2}>Account Id</th>
         <th className="th-thead border border-black" rowSpan={2}>Org Id</th>
         <th className="th-thead border border-black" rowSpan={2}>YTD Base</th>
         <th className="th-thead border border-black" rowSpan={2}>YTD Allocation</th>
         <th className="th-thead border border-black" rowSpan={2}>YTD Budget</th>
         {monthsHeader.map((m) => (
           <th key={m} className="th-thead border border-black" colSpan={2}>
             {m}
           </th>
         ))}
       </tr>
       <tr>
         {monthsHeader.map((_, i) => (
           <React.Fragment key={i}>
             <th className="th-thead border border-black">Base</th>
             <th className="th-thead border border-black">Allocation</th>
             {/* <th className="th-thead border border-black">Budget</th> */}
           </React.Fragment>
         ))}
       </tr>
     </thead>
 
     <tbody className="tbody">
       {baseData.map((item, idx) => (
         <tr key={idx}>
           <td className="tbody-td border border-black whitespace-nowrap">{item.acctId}</td>
           <td className="tbody-td border border-black">{item.orgId}</td>
           <td className="tbody-td border border-black">{item.ytdBase}</td>
           <td className="tbody-td border border-black">{item.ytdAllocation}</td>
           <td className="tbody-td border border-black">{item.ytdBudget}</td>
 
           {item.months.map((m, i) => (
             <React.Fragment key={i}>
               <td className="tbody-td border border-black">{m.base}</td>
               <td className="tbody-td border border-black">{m.allocation}</td>
               {/* <td className="tbody-td border border-black">{m.budget}</td> */}
             </React.Fragment>
           ))}
         </tr>
       ))}
     </tbody>
   </table>
 </div>
 
     </div>
   );
 };

export default MH;
