"use client";
import { useState, useEffect, useCallback } from "react";
import React from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { backendUrl } from "./config";

const INTERNAL_FINANCIAL_API_URL = `${backendUrl}/Forecast/CalculateCost`;

/**
 * Transforms the raw CalculateCostAPIResponse into the RevenueAnalysisRow structure.
 * This function now aggregates all data into overall totals, without monthly breakdowns or hours.
 * It also extracts individual non-labor data entries from the API response for a detailed breakdown view,
 * including them regardless of dctId presence, but skipping entries where Fringe, Overhead, and G&A are all zero.
 * Non-labor entries are now grouped by Account ID.
 */
function transformApiResponseToRevenueAnalysisRows(apiResponse) {
  // console.time("transformApiResponse"); // Start timer for transformation
  const rows = [];
  const nonLaborAcctMap = new Map(); // To group non-labor entries by acctId

  let totalRevenueOverall = 0;
  let totalLaborCostRaw = 0; // Raw cost (base salary) for all labor
  let totalBurdenedLaborCost = 0; // Total burdened cost for all labor
  let totalLaborRevenue = 0; // Total labor revenue (sum of revenue + revenue from payrollSalary) // Map to group employees by PLC

  const plcMap = new Map();

  // console.log(
  //   `Revenue Analysis: Transforming data for all projects/orgs from API response.`
  // ); // Process employeeForecastSummary for labor and payroll-related non-labor costs

  if (
    !apiResponse.employeeForecastSummary ||
    apiResponse.employeeForecastSummary.length === 0
  ) {
    // console.warn(
    //   `Revenue Analysis: No employee data found in employeeForecastSummary.`
    // );
  } else {
    // ====================================================================
    // NEW LOGIC STARTS HERE
    // ====================================================================
    apiResponse.employeeForecastSummary.forEach((empSummary) => {
      const plcCode = empSummary.plcCode || "Unknown PLC";

      // 1. Get or create the parent PLC group
      let plcDetail = plcMap.get(plcCode);
      if (!plcDetail) {
        plcDetail = {
          id: `plc-${plcCode}`,
          plcName: plcCode,
          rawCost: 0,
          cost: 0,
          burdenedCost: 0,
          employees: [],
        };
        plcMap.set(plcCode, plcDetail);
      }

      // 2. Use a composite key to uniquely identify each employee ASSIGNMENT
      const compositeKey = `${empSummary.emplId}-${empSummary.plcCode}-${empSummary.orgID}-${empSummary.accID}`;

      // Check if this specific assignment has already been processed
      let employeeAssignment = plcDetail.employees.find(
        (e) => e.id === compositeKey
      );

      if (!employeeAssignment) {
        // Calculate the burdened cost for THIS summary.
        // The API's top-level totalBurdonCost can be unreliable, so we sum the components.
        const summaryRawCost = empSummary.totalForecastedCost || 0;
        const summaryFringe = empSummary.fringe || 0;
        const summaryOverhead = empSummary.overhead || 0;
        const summaryGNA = empSummary.gna || 0;
        const summaryBurdenedCost =
          summaryRawCost + summaryFringe + summaryOverhead + summaryGNA;

        // 3. Create a new, unique employee ASSIGNMENT object
        employeeAssignment = {
          id: compositeKey, // Use the unique key
          name: `${empSummary.name} (${empSummary.emplId}) - ${empSummary.accID}`, // More descriptive name
          // 4. Assign values DIRECTLY from the summary. DO NOT aggregate with += here.
          rawCost: summaryRawCost,
          cost: summaryBurdenedCost,
          revenue: empSummary.revenue || 0,
          accountId: empSummary.accID || "",
          orgId: empSummary.orgID || "",
          glcPlc: empSummary.plcCode || "",
          hrlyRate: empSummary.perHourRate || 0,
        };

        // Calculate profit percentages for THIS specific assignment
        employeeAssignment.profit =
          employeeAssignment.revenue - employeeAssignment.cost;
        employeeAssignment.profitOnCost =
          employeeAssignment.cost !== 0
            ? `${(
                (employeeAssignment.profit / employeeAssignment.cost) *
                100
              ).toFixed(2)}%`
            : "0.00%";
        employeeAssignment.profitOnRevenue =
          employeeAssignment.revenue !== 0
            ? `${(
                (employeeAssignment.profit / employeeAssignment.revenue) *
                100
              ).toFixed(2)}%`
            : "0.00%";

        // Add the unique assignment to the PLC's employee list
        plcDetail.employees.push(employeeAssignment);
      }
    });

    // 5. After all unique assignments are created, aggregate their values up to the parent PLC and overall totals.
    plcMap.forEach((plc) => {
      plc.rawCost = plc.employees.reduce((sum, emp) => sum + emp.rawCost, 0);
      plc.burdenedCost = plc.employees.reduce((sum, emp) => sum + emp.cost, 0);
      plc.cost = plc.burdenedCost; // Alias for consistency
    });

    totalLaborCostRaw = Array.from(plcMap.values()).reduce(
      (sum, plc) => sum + plc.rawCost,
      0
    );
    totalBurdenedLaborCost = Array.from(plcMap.values()).reduce(
      (sum, plc) => sum + plc.burdenedCost,
      0
    );
    totalLaborRevenue = apiResponse.employeeForecastSummary.reduce(
      (sum, emp) => sum + (emp.revenue || 0),
      0
    );

    // ====================================================================
    // END OF NEW LOGIC
    // ====================================================================
  } // Process directCOstForecastSummary for other direct costs

  if (
    apiResponse.directCOstForecastSummary &&
    apiResponse.directCOstForecastSummary.length > 0
  ) {
    apiResponse.directCOstForecastSummary.forEach((directCostSummary) => {
      directCostSummary.directCostSchedule?.forecasts.forEach((forecast) => {
        const fringe = forecast.fringe || 0;
        const overhead = forecast.overhead || 0;
        const gna = forecast.gna || 0;
        const cost = forecast.cost || 0;
        const materials = forecast.materials || 0;

        if (
          (fringe !== 0 ||
            overhead !== 0 ||
            gna !== 0 ||
            cost !== 0 ||
            materials !== 0) &&
          forecast.dctId !== null &&
          forecast.dctId !== undefined
        ) {
          const date = new Date(forecast.year, forecast.month - 1);
          const monthLabel =
            date.toLocaleString("default", { month: "short" }) +
            " " +
            date.getFullYear().toString().slice(-2);
          const acctId = forecast.acctId || "N/A Account";

          if (!nonLaborAcctMap.has(acctId)) {
            nonLaborAcctMap.set(acctId, {
              id: `nonlabor-acct-${acctId}`,
              acctId: acctId,
              totalFringe: 0,
              totalOverhead: 0,
              totalGna: 0,
              totalCost: 0,
              totalMaterials: 0,
              total: 0,
              entries: [],
            });
          }
          const acctGroup = nonLaborAcctMap.get(acctId);
          const entryTotal = fringe + overhead + gna + cost + materials;

          acctGroup.totalFringe += fringe;
          acctGroup.totalOverhead += overhead;
          acctGroup.totalGna += gna;
          acctGroup.totalCost += cost;
          acctGroup.totalMaterials += materials;
          acctGroup.total += entryTotal;

          acctGroup.entries.push({
            id: `nonlabor-directcost-${forecast.year}-${forecast.month}-${
              directCostSummary.emplId
            }-${forecast.dctId}-${Date.now() + Math.random()}`,
            monthLabel: monthLabel,
            fringe: fringe,
            overhead: overhead,
            gna: gna,
            cost: cost,
            materials: materials,
            total: entryTotal,
            emplId: directCostSummary.emplId,
            orgId: directCostSummary.orgID,
            projId: forecast.projId,
            dctId: forecast.dctId,
            acctId: acctId,
            type: "direct-cost",
          });
        }
      });
    });
  }

  const nonLaborAcctDetails = Array.from(nonLaborAcctMap.values());

  const totalFringeCost = apiResponse.totalFringe || 0;
  const totalOverheadCost = apiResponse.totalOverhead || 0;
  const totalGnaCost = apiResponse.totalGna || 0;

  const totalNonLaborCost = totalFringeCost + totalOverheadCost + totalGnaCost;

  const totalExpense = totalBurdenedLaborCost + totalNonLaborCost;
  const finalTotalRevenueOverall =
    apiResponse.totalRevenue || totalLaborRevenue;
  const totalProfit = finalTotalRevenueOverall - totalExpense;
  const profitOnCost =
    totalExpense !== 0 ? (totalProfit / totalExpense) * 100 : 0;
  const profitOnRevenue =
    finalTotalRevenueOverall !== 0
      ? (totalProfit / finalTotalRevenueOverall) * 100
      : 0; // --- Construct Rows ---

  rows.push({
    id: "total-revenue",
    description: "Total Revenue",
    billRate: undefined,
    rawCost: undefined,
    cost: totalExpense,
    burdenedCost: totalExpense,
    revenue: finalTotalRevenueOverall,
    profit: totalProfit,
    profitOnCost: `${profitOnCost.toFixed(2)}%`,
    profitOnRevenue: `${profitOnRevenue.toFixed(2)}%`,
    type: "summary",
    projId: "Aggregated",
    orgId: "Aggregated",
  });

  const laborProfit = totalLaborRevenue - totalBurdenedLaborCost;
  const laborProfitOnCost =
    totalBurdenedLaborCost !== 0
      ? (laborProfit / totalBurdenedLaborCost) * 100
      : 0;
  const laborProfitOnRevenue =
    totalLaborRevenue !== 0 ? (laborProfit / totalLaborRevenue) * 100 : 0;

  rows.push({
    id: "labor-revenue",
    description: "Labor Revenue",
    billRate: undefined,
    rawCost: totalLaborCostRaw,
    cost: totalBurdenedLaborCost,
    burdenedCost: totalBurdenedLaborCost,
    revenue: totalLaborRevenue,
    profit: laborProfit,
    profitOnCost: `${laborProfitOnCost.toFixed(2)}%`,
    profitOnRevenue: `${laborProfitOnRevenue.toFixed(2)}%`,
    type: "expandable",
    plcDetails: Array.from(plcMap.values()),
    projId: "Aggregated",
    orgId: "Aggregated",
  });

  rows.push({
    id: "non-labor-details",
    description: "Non-Labor Details",
    billRate: undefined,
    rawCost: totalNonLaborCost,
    cost: totalNonLaborCost,
    burdenedCost: totalNonLaborCost,
    revenue: 0,
    profit: -totalNonLaborCost,
    profitOnCost:
      totalNonLaborCost !== 0
        ? `${((-totalNonLaborCost / totalNonLaborCost) * 100).toFixed(2)}%`
        : "0.00%",
    profitOnRevenue: "0.00%",
    type: "expandable",
    nonLaborAcctDetails: nonLaborAcctDetails,
    projId: "Aggregated",
    orgId: "Aggregated",
  });

  rows.push({
    id: "total-fringe",
    description: "Total Fringe",
    billRate: undefined,
    rawCost: totalFringeCost,
    cost: totalFringeCost,
    burdenedCost: totalFringeCost,
    revenue: 0,
    profit: undefined,
    profitOnCost: undefined,
    profitOnRevenue: undefined,
    type: "summary",
    projId: "Aggregated",
    orgId: "Aggregated",
  });

  rows.push({
    id: "total-overhead",
    description: "Total Overhead",
    billRate: undefined,
    rawCost: totalOverheadCost,
    cost: totalOverheadCost,
    burdenedCost: totalOverheadCost,
    revenue: 0,
    profit: undefined,
    profitOnCost: undefined,
    profitOnRevenue: undefined,
    type: "summary",
    projId: "Aggregated",
    orgId: "Aggregated",
  });

  rows.push({
    id: "general-admin",
    description: "General & Admin",
    billRate: undefined,
    rawCost: totalGnaCost,
    cost: totalGnaCost,
    burdenedCost: totalGnaCost,
    revenue: 0,
    profit: undefined,
    profitOnCost: undefined,
    profitOnRevenue: undefined,
    type: "summary",
    projId: "Aggregated",
    orgId: "Aggregated",
  });

  // console.log("Revenue Analysis: Final transformed rows (aggregated):", rows);
  console.timeEnd("transformApiResponse");
  return { rows };
}

const RevenueAnalysisPage = ({
  onCancel,
  planId,
  templateId,
  type,
  projId,
  budVersion,
  status,
  periodOfPerformance,
}) => {
  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedPlcRows, setExpandedPlcRows] = useState([]);
  const [expandedNonLaborAcctRows, setExpandedNonLaborAcctRows] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [atRiskAmount, setAtRiskAmount] = useState("$0.00 - Placeholder");
  const [atRiskFundedAmount, setAtRiskFundedAmount] = useState(
    "$0.00 - Placeholder"
  );
  const [fundedAmount, setFundedAmount] = useState("$0.00 - Placeholder");

  const currentProjIdDisplay = projId || "Aggregated";
  const currentBudVersion = budVersion || "1";
  const currentStatus = status || "Approved";
  const currentPeriodOfPerformance = periodOfPerformance || "Aggregated Period";

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleChildRow = (parentId, childId) => {
    const fullId = `${parentId}-${childId}`;
    setExpandedPlcRows((prev) =>
      prev.includes(fullId)
        ? prev.filter((rowId) => rowId !== fullId)
        : [...prev, fullId]
    );
  };

  const toggleNonLaborAcctRow = (parentId, acctId) => {
    const fullId = `${parentId}-${acctId}`;
    setExpandedNonLaborAcctRows((prev) =>
      prev.includes(fullId)
        ? prev.filter((rowId) => rowId !== fullId)
        : [...prev, fullId]
    );
  };

  const expandAll = () => {
    setExpandedRows(
      revenueData
        .filter(
          (row) => row.id === "labor-revenue" || row.id === "non-labor-details"
        )
        .map((row) => row.id)
    );

    const allPlcIds = [];
    revenueData.forEach((row) => {
      if (row.id === "labor-revenue" && row.plcDetails) {
        row.plcDetails.forEach((plc) => allPlcIds.push(`${row.id}-${plc.id}`));
      }
    });
    setExpandedPlcRows(allPlcIds);

    const allNonLaborAcctIds = [];
    revenueData.forEach((row) => {
      if (row.id === "non-labor-details" && row.nonLaborAcctDetails) {
        row.nonLaborAcctDetails.forEach((acct) =>
          allNonLaborAcctIds.push(`${row.id}-${acct.id}`)
        );
      }
    });
    setExpandedNonLaborAcctRows(allNonLaborAcctIds);
  };

  const collapseAll = () => {
    setExpandedRows([]);
    setExpandedPlcRows([]);
    setExpandedNonLaborAcctRows([]);
  };

  const formatValue = (value) => {
    if (typeof value === "number") {
      const formatted = value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatted;
    }
    return value === undefined || value === null || value === "" ? "" : value;
  };

  const getGlassmorphismClasses = () => `
    bg-white bg-opacity-5 backdrop-filter backdrop-blur-lg rounded-lg
    border border-opacity-10 border-white shadow-lg
  `;

  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      setError(null);
      if (!planId) {
        setError("No planId provided to Revenue Analysis Page.");
        setLoading(false);
        return;
      }

      try {
        console.time("fetchData");
        const params = new URLSearchParams({
          planID: planId.toString(),
          templateId: (templateId || 1).toString(),
          type: type || "TARGET",
        });
        const apiFetchUrl = `${INTERNAL_FINANCIAL_API_URL}?${params.toString()}`;
        // console.log(
        //   `Revenue Analysis: Fetching data from API (GET): ${apiFetchUrl}`
        // );

        const response = await fetch(apiFetchUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          // console.error("API Error Response (Raw Text):", errorText);
          try {
            const errorData = JSON.parse(errorText);
            // console.error("API Error Response (Parsed JSON):", errorData);
            throw new Error(
              `HTTP error! status: ${
                response.status
              }. Details: ${JSON.stringify(errorData.errors || errorData)}`
            );
          } catch (jsonError) {
            throw new Error(
              `HTTP error! status: ${response.status}. Raw response: ${errorText}`
            );
          }
        }

        const apiResponse = await response.json();
        // console.log("Revenue Analysis: Full API Raw Response:", apiResponse);
        if (
          apiResponse.atRiskAmt !== undefined &&
          apiResponse.atRiskAmt !== null
        ) {
          setAtRiskAmount(formatValue(apiResponse.atRiskAmt));
        } else {
          setAtRiskAmount("$0.00 - Not Found");
        }

        if (
          apiResponse.fundingValue !== undefined &&
          apiResponse.fundingValue !== null
        ) {
          setFundedAmount(formatValue(apiResponse.fundingValue));
        } else {
          setFundedAmount("$0.00 - Not Found");
        }

        const atRisk =
          typeof apiResponse.atRiskAmt === "number" ? apiResponse.atRiskAmt : 0;
        const funded =
          typeof apiResponse.fundingValue === "number"
            ? apiResponse.fundingValue
            : 0;
        setAtRiskFundedAmount(formatValue(atRisk + funded));

        const { rows } = transformApiResponseToRevenueAnalysisRows(apiResponse);
        setRevenueData(rows);
        console.timeEnd("fetchData");
      } catch (err) {
        // console.error(
        //   "Failed to fetch financial data for Revenue Analysis:",
        //   err
        // );
        setError(
          `Failed to load financial data. ${err.message}. Please ensure the API is running and returning valid JSON.`
        );
        setRevenueData([]);
        console.timeEnd("fetchData");
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [planId, templateId, type]);

  if (loading) {
    return (
      // <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-50 text-gray-800 text-2xl">
      //           Loading Revenue Analysis...      {" "}
      // </div>
      <div className="p-4 font-inter flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-gray-600">
          Loading Revenue Analysis...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-50 text-red-600 text-2xl">
                Error: {error}     {" "}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-50 p-8 text-gray-800 font-inter">
           {" "}
      <div className="mb-4 flex gap-4 items-center">
               {" "}
        <button
          onClick={expandAll}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
                    Expand All{" "}
        </button>
               {" "}
        <button
          onClick={collapseAll}
          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
        >
                    Collapse All{" "}
        </button>
               {" "}
        <div className="flex-grow flex justify-center gap-4">
                   {" "}
          <div className="p-4 border border-gray-300 rounded-md shadow-sm bg-white">
                       {" "}
            <span className="font-semibold text-gray-700">
              At risk Amount:{" "}
            </span>
                       {" "}
            <span className="text-red-600 font-bold">{atRiskAmount}</span>     
               {" "}
          </div>
                   {" "}
          <div className="p-4 border border-gray-300 rounded-md shadow-sm bg-white">
                       {" "}
            <span className="font-semibold text-gray-700">Funded: </span>       
                <span className="text-green-600 font-bold">{fundedAmount}</span>
                     {" "}
          </div>
                   {" "}
          <div className="p-4 border border-gray-300 rounded-md shadow-sm bg-white">
                       {" "}
            <span className="font-semibold text-gray-700">
              At risk + Funded:{" "}
            </span>
                       {" "}
            <span className="text-purple-600 font-bold">
              {atRiskFundedAmount}
            </span>
                     {" "}
          </div>
                 {" "}
        </div>
             {" "}
      </div>
           {" "}
      <div
        className={`overflow-x-auto  max-h-120 overflow-y-auto ${getGlassmorphismClasses()}`}
      >
               {" "}
        <table className="min-w-full divide-y divide-gray-300 divide-opacity-30">
          {/*           <thead>
            <tr className="bg-gray-100 bg-opacity-50">
              <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700 uppercase tracking-wider sticky left-0 z-10 bg-inherit">Description</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap">Bill Rate</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider">Cost</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider">Burdened Cost</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider">Revenue</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider">Profit</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider">Profit % on Cost</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider">Profit % on Revenue</th>
            </tr>
          </thead> */}
          <thead>
            <tr className="bg-gray-100 bg-opacity-50">
              <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700 uppercase tracking-wider sticky left-0 top-0 z-20 bg-gray-100 bg-opacity-50">
                Description
              </th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                Bill Rate
              </th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                Cost
              </th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                Burdened Cost
              </th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                Revenue
              </th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                Profit
              </th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                Profit % on Cost
              </th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                Profit % on Revenue
              </th>
              <th
                colSpan={2}
                className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider sticky top-0 z-10 bg-gray-100 bg-opacity-50"
              ></th>
            </tr>
          </thead>
                   {" "}
          <tbody className="divide-y divide-gray-300 divide-opacity-10">
                       {" "}
            {revenueData.length === 0 ? (
              <tr>
                               {" "}
                <td
                  colSpan={12}
                  className="py-8 text-center text-gray-600 text-lg"
                >
                                   {" "}
                  {loading
                    ? "Loading data..."
                    : "No revenue analysis data available based on PlanID, Template, and Type parameters. Please check console for API response or data transformation issues."}
                                 {" "}
                </td>
                             {" "}
              </tr>
            ) : (
              revenueData.map((row) => (
                <React.Fragment key={row.id}>
                                   {" "}
                  <tr
                    className={`
                      group hover:bg-gray-100 hover:bg-opacity-50 transition-colors duration-200
                      ${
                      row.type === "summary" ? "bg-gray-100 bg-opacity-20" : ""
                    }
                      ${
                      row.type === "expandable"
                        ? "cursor-pointer bg-blue-100 bg-opacity-30"
                        : ""
                    }
                    `}
                    onClick={() =>
                      row.type === "expandable" && toggleRow(row.id)
                    }
                  >
                                       {" "}
                    <td className="py-3 px-4 whitespace-nowrap sticky left-0 z-10 bg-inherit flex items-center text-gray-800">
                                           {" "}
                      {row.type === "expandable" && (
                        <span className="mr-2">
                                                   {" "}
                          {expandedRows.includes(row.id) ? (
                            <ChevronUpIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                          )}
                                                 {" "}
                        </span>
                      )}
                                            {row.description}                   {" "}
                    </td>
                                       {" "}
                    <td className="py-3 px-4 text-right whitespace-nowrap text-gray-800">
                      {formatValue(row.billRate)}
                    </td>
                                       {" "}
                    <td className="py-3 px-4 text-right whitespace-nowrap text-gray-800">
                      {formatValue(row.rawCost)}
                    </td>
                                       {" "}
                    <td className="py-3 px-4 text-right whitespace-nowrap text-gray-800">
                      {formatValue(row.burdenedCost)}
                    </td>
                                       {" "}
                    <td className="py-3 px-4 text-right whitespace-nowrap text-gray-800">
                      {formatValue(row.revenue)}
                    </td>
                                       {" "}
                    <td
                      className={`py-3 px-4 text-right whitespace-nowrap text-gray-800 ${
                        typeof row.profit === "number" && row.profit < 0
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                                            {formatValue(row.profit)}           
                             {" "}
                    </td>
                                       {" "}
                    <td
                      className={`py-3 px-4 text-right whitespace-nowrap text-gray-800 ${
                        row.profitOnCost && parseFloat(row.profitOnCost) < 0
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                                            {row.profitOnCost}                 
                       {" "}
                    </td>
                                       {" "}
                    <td
                      className={`py-3 px-4 text-right whitespace-nowrap text-gray-800 ${
                        row.profitOnRevenue &&
                        parseFloat(row.profitOnRevenue) < 0
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                                            {row.profitOnRevenue}               
                         {" "}
                    </td>
                                     {" "}
                    <td
                      className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase"
                      colSpan="2"
                    ></td>{" "}
                  </tr>
                                   {" "}
                  {/* Nested details for Labor Revenue row (PLCs) */}           
                       {" "}
                  {row.id === "labor-revenue" &&
                    expandedRows.includes(row.id) &&
                    row.plcDetails &&
                    row.plcDetails.length > 0 && (
                      <>
                                             {" "}
                        {row.plcDetails.map((plc) => (
                          <React.Fragment key={`${row.id}-${plc.id}`}>
                                                     {" "}
                            <tr
                              className="bg-gray-100 bg-opacity-20 hover:bg-gray-100 hover:bg-opacity-50 text-sm cursor-pointer group"
                              onClick={() => toggleChildRow(row.id, plc.id)}
                            >
                                                         {" "}
                              <td className="py-2 pl-8 pr-4 whitespace-nowrap sticky left-0 z-10 bg-inherit flex items-center text-gray-800">
                                                             {" "}
                                <span className="mr-2">
                                                                 {" "}
                                  {expandedPlcRows.includes(
                                    `${row.id}-${plc.id}`
                                  ) ? (
                                    <ChevronUpIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                                  ) : (
                                    <ChevronDownIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                                  )}
                                                               {" "}
                                </span>
                                                              {plc.plcName}     
                                                     {" "}
                              </td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800"></td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                {formatValue(plc.rawCost)}
                              </td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                {formatValue(plc.burdenedCost)}
                              </td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800"></td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800"></td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800"></td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800"></td>
                                                       {" "}
                              <td
                                className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase"
                                colSpan="2"
                              ></td>{" "}
                            </tr>
                                                     {" "}
                            {expandedPlcRows.includes(`${row.id}-${plc.id}`) &&
                              plc.employees &&
                              plc.employees.length > 0 && (
                                <>
                                                               {" "}
                                  {plc.employees.map((employee) => (
                                    <React.Fragment
                                      key={`${plc.id}-${employee.id}`}
                                    >
                                                                       {" "}
                                      <tr className="bg-gray-100 bg-opacity-30 hover:bg-gray-100 hover:bg-opacity-60 text-xs group">
                                                                           {" "}
                                        <td className="py-2 pl-16 pr-4 whitespace-nowrap sticky left-0 z-10 bg-inherit flex items-center text-gray-800">
                                                                               {" "}
                                          {employee.name}                       
                                                     {" "}
                                        </td>
                                                                           {" "}
                                        <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                          {formatValue(employee.hrlyRate)}
                                        </td>
                                                                           {" "}
                                        <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                          {formatValue(employee.rawCost)}
                                        </td>
                                                                           {" "}
                                        <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                          {formatValue(employee.cost)}
                                        </td>
                                                                           {" "}
                                        <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                          {formatValue(employee.revenue)}
                                        </td>
                                                                           {" "}
                                        <td
                                          className={`py-2 px-4 text-right whitespace-nowrap text-gray-800 ${
                                            typeof employee.profit ===
                                              "number" && employee.profit < 0
                                              ? "text-red-600"
                                              : ""
                                          }`}
                                        >
                                                                               {" "}
                                          {formatValue(employee.profit)}       
                                                                     {" "}
                                        </td>
                                                                           {" "}
                                        <td
                                          className={`py-2 px-4 text-right whitespace-nowrap text-gray-800 ${
                                            employee.profitOnCost &&
                                            parseFloat(employee.profitOnCost) <
                                              0
                                              ? "text-red-600"
                                              : ""
                                          }`}
                                        >
                                                                               {" "}
                                          {employee.profitOnCost}               
                                                             {" "}
                                        </td>
                                                                           {" "}
                                        <td
                                          className={`py-2 px-4 text-right whitespace-nowrap text-gray-800 ${
                                            employee.profitOnRevenue &&
                                            parseFloat(
                                              employee.profitOnRevenue
                                            ) < 0
                                              ? "text-red-600"
                                              : ""
                                          }`}
                                        >
                                                                               {" "}
                                          {employee.profitOnRevenue}           
                                                                 {" "}
                                        </td>
                                        <td
                                          className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase"
                                          colSpan="2"
                                        ></td>{" "}
                                                                         {" "}
                                      </tr>
                                                                     {" "}
                                    </React.Fragment>
                                  ))}
                                                             {" "}
                                </>
                              )}
                                                   {" "}
                          </React.Fragment>
                        ))}
                                           {" "}
                      </>
                    )}
                                   {" "}
                  {/* Nested details for Non-Labor Details row (Account Grouping) */}
                                   {" "}
                  {row.id === "non-labor-details" &&
                    expandedRows.includes(row.id) &&
                    row.nonLaborAcctDetails &&
                    row.nonLaborAcctDetails.length > 0 && (
                      <>
                                             {" "}
                        {row.nonLaborAcctDetails.map((acctGroup) => (
                          <React.Fragment key={`${row.id}-${acctGroup.id}`}>
                                                     {" "}
                            <tr
                              className="bg-gray-100 bg-opacity-20 hover:bg-gray-100 hover:bg-opacity-50 text-sm cursor-pointer group"
                              onClick={() =>
                                toggleNonLaborAcctRow(row.id, acctGroup.id)
                              }
                            >
                                                         {" "}
                              <td className="py-2 pl-8 pr-4 whitespace-nowrap sticky left-0 z-10 bg-inherit flex items-center text-gray-800">
                                                             {" "}
                                <span className="mr-2">
                                                                 {" "}
                                  {expandedNonLaborAcctRows.includes(
                                    `${row.id}-${acctGroup.id}`
                                  ) ? (
                                    <ChevronUpIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                                  ) : (
                                    <ChevronDownIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                                  )}
                                                               {" "}
                                </span>
                                                              Account:{" "}
                                {acctGroup.acctId} (Total Entries:{" "}
                                {acctGroup.entries.length})                    
                                       {" "}
                              </td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800"></td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                {formatValue(acctGroup.totalFringe)}
                              </td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                {formatValue(acctGroup.totalOverhead)}
                              </td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                {formatValue(acctGroup.totalGna)}
                              </td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                {formatValue(acctGroup.totalCost)}
                              </td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                {formatValue(acctGroup.totalMaterials)}
                              </td>
                                                         {" "}
                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800 font-semibold">
                                {formatValue(acctGroup.total)}
                              </td>
                                                         {" "}
                              <td
                                className="py-2 px-4 text-right whitespace-nowrap text-gray-800"
                                colSpan="2"
                              ></td>
                                                       {" "}
                            </tr>
                                                     {" "}
                            {expandedNonLaborAcctRows.includes(
                              `${row.id}-${acctGroup.id}`
                            ) &&
                              acctGroup.entries &&
                              acctGroup.entries.length > 0 && (
                                <>
                                                               {" "}
                                  <tr className="bg-gray-100 bg-opacity-30">
                                                                   {" "}
                                    <td
                                      className="py-2 pl-16 pr-4 text-left text-sm font-semibold text-gray-700 uppercase"
                                      colSpan="2"
                                    >
                                      Employee ID - Period
                                    </td>
                                                                   {" "}
                                    <td className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase">
                                      Fringe
                                    </td>
                                                                   {" "}
                                    <td className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase">
                                      Overhead
                                    </td>
                                                                   {" "}
                                    <td className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase">
                                      G&A
                                    </td>
                                                                   {" "}
                                    <td className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase">
                                      Cost
                                    </td>
                                                                   {" "}
                                    <td className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase">
                                      Materials
                                    </td>
                                                                   {" "}
                                    <td className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase">
                                      Total
                                    </td>
                                                                   {" "}
                                    <td
                                      className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase"
                                      colSpan="2"
                                    ></td>
                                                                 {" "}
                                  </tr>
                                                               {" "}
                                  {acctGroup.entries.map((nonLaborEntry) => (
                                    <tr
                                      key={nonLaborEntry.id}
                                      className="bg-gray-100 bg-opacity-40 hover:bg-gray-100 hover:bg-opacity-70 text-xs"
                                    >
                                                                       {" "}
                                      <td className="py-2 pl-16 pr-4 whitespace-nowrap text-gray-800">
                                                                            Emp
                                        ID: {nonLaborEntry.emplId || "N/A"} -{" "}
                                        {nonLaborEntry.monthLabel}             
                                                             {" "}
                                        {nonLaborEntry.dctId
                                          ? ` (DCT: ${nonLaborEntry.dctId})`
                                          : ""}
                                                                         {" "}
                                      </td>
                                                                       {" "}
                                      <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800"></td>
                                                                       {" "}
                                      <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                        {formatValue(nonLaborEntry.fringe)}
                                      </td>
                                                                       {" "}
                                      <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                        {formatValue(nonLaborEntry.overhead)}
                                      </td>
                                                                       {" "}
                                      <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                        {formatValue(nonLaborEntry.gna)}
                                      </td>
                                                                       {" "}
                                      <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                        {formatValue(nonLaborEntry.cost)}
                                      </td>
                                                                       {" "}
                                      <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                        {formatValue(nonLaborEntry.materials)}
                                      </td>
                                                                       {" "}
                                      <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800 font-semibold">
                                        {formatValue(nonLaborEntry.total)}
                                      </td>
                                                                       {" "}
                                      <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800"></td>
                                                                       {" "}
                                      <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800"></td>
                                                                     {" "}
                                    </tr>
                                  ))}
                                                             {" "}
                                </>
                              )}
                                                   {" "}
                          </React.Fragment>
                        ))}
                                           {" "}
                      </>
                    )}
                                 {" "}
                </React.Fragment>
              ))
            )}
                     {" "}
          </tbody>
                 {" "}
        </table>
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default RevenueAnalysisPage;
