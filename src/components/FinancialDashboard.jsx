"use client";
import { useState, useEffect, useMemo } from "react";
import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { backendUrl } from "./config";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// This function would be the one we corrected from your RevenueAnalysisPage
// It's included here for completeness.
function transformApiResponseToRevenueAnalysisRows(apiResponse) {
  const rows = [];
  const plcMap = new Map();

  if (apiResponse && apiResponse.employeeForecastSummary) {
    apiResponse.employeeForecastSummary.forEach((empSummary) => {
      const plcCode = empSummary.plcCode || "Unknown PLC";

      let plcDetail = plcMap.get(plcCode);
      if (!plcDetail) {
        plcDetail = {
          id: `plc-${plcCode}`,
          plcName: plcCode,
          rawCost: 0,
          burdenedCost: 0,
          revenue: 0,
          employees: [],
        };
        plcMap.set(plcCode, plcDetail);
      }

      const compositeKey = `${empSummary.emplId}-${empSummary.plcCode}-${empSummary.orgID}-${empSummary.accID}`;
      let employeeAssignment = plcDetail.employees.find(
        (e) => e.id === compositeKey
      );

      if (!employeeAssignment) {
        const summaryRawCost = empSummary.totalForecastedCost || 0;
        const summaryFringe = empSummary.fringe || 0;
        const summaryOverhead = empSummary.overhead || 0;
        const summaryGNA = empSummary.gna || 0;
        const summaryBurdenedCost =
          summaryRawCost + summaryFringe + summaryOverhead + summaryGNA;

        employeeAssignment = {
          id: compositeKey,
          emplId: empSummary.emplId,
          name: `${empSummary.name} (${empSummary.emplId})`,
          rawCost: summaryRawCost,
          cost: summaryBurdenedCost,
          revenue: empSummary.revenue || 0,
          accountId: empSummary.accID || "",
          orgId: empSummary.orgID || "",
          plcCode: plcCode,
        };
        plcDetail.employees.push(employeeAssignment);
      }
    });

    plcMap.forEach((plc) => {
      plc.rawCost = plc.employees.reduce((sum, emp) => sum + emp.rawCost, 0);
      plc.burdenedCost = plc.employees.reduce((sum, emp) => sum + emp.cost, 0);
      plc.revenue = plc.employees.reduce((sum, emp) => sum + emp.revenue, 0);
    });
  }
  return Array.from(plcMap.values());
}

const FinancialDashboard = ({ planId, templateId, type }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState([]); // Holds the transformed data (array of PLCs)

  // State for filters
  const [selectedPlc, setSelectedPlc] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  // State for chart data
  const [revenueChartData, setRevenueChartData] = useState(null);
  const [plcPieChartData, setPlcPieChartData] = useState(null);

  // Memoize lists for filter dropdowns
  const plcOptions = useMemo(() => {
    return ["all", ...processedData.map((p) => p.plcName)];
  }, [processedData]);

  const employeeOptions = useMemo(() => {
    const allEmployees = new Map();
    processedData.forEach((plc) => {
      plc.employees.forEach((emp) => {
        if (!allEmployees.has(emp.emplId)) {
          allEmployees.set(emp.emplId, emp.name);
        }
      });
    });
    return [
      "all",
      ...Array.from(allEmployees.entries()).map(([id, name]) => ({ id, name })),
    ];
  }, [processedData]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      setError(null);
      if (!planId) {
        setLoading(false);
        setError("Plan ID is required.");
        return;
      }

      try {
        const params = new URLSearchParams({
          planID: planId.toString(),
          templateId: (templateId || 1).toString(),
          type: type || "TARGET",
        });
        const response = await fetch(
          `${backendUrl}/Forecast/CalculateCost?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apiResponse = await response.json();
        const transformedData =
          transformApiResponseToRevenueAnalysisRows(apiResponse);
        setProcessedData(transformedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [planId, templateId, type]);

  // Update charts when data or filters change
  useEffect(() => {
    if (!processedData.length) return;

    // Filter data based on selections
    let filteredPlcs = processedData;
    if (selectedPlc !== "all") {
      filteredPlcs = processedData.filter((p) => p.plcName === selectedPlc);
    }

    if (selectedEmployee !== "all") {
      filteredPlcs = filteredPlcs
        .map((plc) => ({
          ...plc,
          employees: plc.employees.filter(
            (emp) => emp.emplId === selectedEmployee
          ),
        }))
        .filter((plc) => plc.employees.length > 0);
    }

    // --- Prepare data for Revenue vs. Cost Bar Chart ---
    const totalRevenue = filteredPlcs.reduce(
      (sum, plc) => sum + plc.employees.reduce((s, e) => s + e.revenue, 0),
      0
    );
    const totalBurdenedCost = filteredPlcs.reduce(
      (sum, plc) => sum + plc.employees.reduce((s, e) => s + e.cost, 0),
      0
    );
    const totalRawCost = filteredPlcs.reduce(
      (sum, plc) => sum + plc.employees.reduce((s, e) => s + e.rawCost, 0),
      0
    );

    setRevenueChartData({
      labels: ["Totals"],
      datasets: [
        {
          label: "Total Revenue",
          data: [totalRevenue],
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        },
        {
          label: "Total Burdened Cost",
          data: [totalBurdenedCost],
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
        {
          label: "Total Raw Cost",
          data: [totalRawCost],
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
    });

    // --- Prepare data for PLC Cost Breakdown Doughnut Chart ---
    setPlcPieChartData({
      labels: filteredPlcs.map((p) => p.plcName),
      datasets: [
        {
          label: "Cost by PLC",
          data: filteredPlcs.map((p) => p.burdenedCost),
          backgroundColor: [
            "rgba(255, 99, 132, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 206, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(153, 102, 255, 0.7)",
            "rgba(255, 159, 64, 0.7)",
          ],
        },
      ],
    });
  }, [processedData, selectedPlc, selectedEmployee]);

  if (loading)
    return (
      // <div className="p-4">Loading Dashboard...</div>;
      <div className="p-4 font-inter flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-gray-600">Loading Dashboard</span>
      </div>
    );
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Financial Dashboard
      </h1>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-white rounded-lg shadow">
        <div>
          <label
            htmlFor="plc-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Filter by PLC
          </label>
          <select
            id="plc-filter"
            value={selectedPlc}
            onChange={(e) => setSelectedPlc(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {plcOptions.map((plc) => (
              <option key={plc} value={plc}>
                {plc === "all" ? "All PLCs" : plc}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="employee-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Filter by Employee
          </label>
          <select
            id="employee-filter"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {employeeOptions.map((emp) => (
              <option key={emp.id || "all"} value={emp.id || "all"}>
                {emp.name || "All Employees"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Revenue vs. Cost
          </h2>
          {revenueChartData && (
            <Bar
              data={revenueChartData}
              options={{
                responsive: true,
                plugins: { legend: { position: "top" } },
              }}
            />
          )}
        </div>
        <div className="lg:col-span-2 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Cost Breakdown by PLC
          </h2>
          {plcPieChartData && (
            <Doughnut
              data={plcPieChartData}
              options={{
                responsive: true,
                plugins: { legend: { position: "top" } },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
