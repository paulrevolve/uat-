"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { data } from "react-router-dom";
import { backendUrl } from "./config";

const AnalysisByPeriodContent = ({
  onCancel,
  planID,
  templateId,
  type,
  initialApiData,
  isLoading,
  error,
  fiscalYear,
}) => {
  // Added console.log for fiscalYear prop at the very top
  // console.log("AnalysisByPeriodContent: Received fiscalYear prop:", fiscalYear);
  // console.log(
  //   "AnalysisByPeriodContent: Received initialApiData prop:",
  //   initialApiData
  // );

  const [expandedStaffRows, setExpandedStaffRows] = useState([]);
  const [expandedEmployeeDetails, setExpandedEmployeeDetails] = useState([]);
  const [expandedNonLaborAcctRows, setExpandedNonLaborAcctRows] = useState([]); // State for non-labor account expansion
  const [financialData, setFinancialData] = useState([]);

  const [allApiData, setAllApiData] = useState(null); // This will now hold the fiscalYear-filtered data
  const [dynamicDateRanges, setDynamicDateRanges] = useState([]);

  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [availableOrgIds, setAvailableOrgIds] = useState([]);

  const [selectedRevenueView, setSelectedRevenueView] = useState("t&m");

  // Replace your existing getMonthRangeKey function with this one
  function getMonthRangeKey(period, year) {
    // Add this check to prevent crashes if period or year are missing
    if (period === undefined || year === undefined) {
      return null;
    }
    const month = String(period).padStart(2, "0");
    const monthRange = `${month}/${year}`;
    return monthRange;
  }

  const transformApiDataToFinancialRows = useCallback(
    (
      apiResponse,
      currentOrgId,
      dynamicDateRanges,
      selectedRevenueView,
      planType,
      rawApiResponse,
      fiscalYearParam
    ) => {
      // console.log(
      //   "transformApiDataToFinancialRows: RAW apiResponse",
      //   apiResponse  
      // );
      // console.log(
      //   "transformApiDataToFinancialRows: currentOrgId",
      //   currentOrgId
      // );
      // console.log(
      //   "transformApiDataToFinancialRows: dynamicDateRanges (columns)",
      //   dynamicDateRanges
      // );
      // console.log("transformApiDataToFinancialRows: planType", planType);

      const financialRows = [];

      // Initialize totals
      const monthlyRevenueData = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {}
      );
      const totalExpenseData = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {}
      );
      const profitData = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {}
      );
      const profitOnCostData = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {}
      );
      const profitOnRevenueData = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {}
      );
      const totalStaffCostByMonth = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {}
      );
      const totalNonLaborCostByMonth = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {}
      );

      const totalRevenueOverall = apiResponse.revenue || 0;

      // Compute startYear using raw API data if available (falls back to ranges)
      let startYear = null;
      try {
        const years = [];
        // months from monthlyRevenueSummary
        if (rawApiResponse?.monthlyRevenueSummary?.length > 0) {
          rawApiResponse.monthlyRevenueSummary.forEach((m) => years.push(Number(m.year)));
        }
        // employee payrolls
        if (rawApiResponse?.employeeForecastSummary?.length > 0) {
          rawApiResponse.employeeForecastSummary.forEach((emp) => {
            (emp.emplSchedule?.payrollSalary || []).forEach((p) => years.push(Number(p.year)));
          });
        }
        // direct/indirect cost forecasts
        [rawApiResponse?.directCOstForecastSummary, rawApiResponse?.indirectCostForecastSummary].forEach((list) => {
          (list || []).forEach((nl) => {
            (nl.directCostSchedule?.forecasts || nl.indirectCostSchedule?.forecasts || []).forEach((f) => years.push(Number(f.year)));
          });
        });

        if (years.length > 0) startYear = Math.min(...years.filter((y) => !isNaN(y)));
      } catch (err) {
        startYear = null;
      }

      const selectedYear = fiscalYearParam && fiscalYearParam !== "All" ? parseInt(fiscalYearParam, 10) : null;

      // Monthly Revenue + Staff/Non-Labor cost
      const monthlyRevenueSummary = apiResponse.monthlyRevenueSummary || [];
      monthlyRevenueSummary.forEach((monthData) => {
        const monthRange = getMonthRangeKey(monthData.month, monthData.year);
        if (monthRange && dynamicDateRanges.includes(monthRange)) {
          monthlyRevenueData[monthRange] = monthData.revenue || 0;

          const staffCost = monthData.cost || 0;
          const nonLaborCost = monthData.otherDifrectCost || 0;

          totalStaffCostByMonth[monthRange] = staffCost;
          totalNonLaborCostByMonth[monthRange] = nonLaborCost;

          totalExpenseData[monthRange] = staffCost + nonLaborCost;
        }
      });

      const totalStaffCostOverall = Object.values(totalStaffCostByMonth).reduce(
        (s, v) => s + v,
        0
      );
      const totalNonLaborCostOverall = Object.values(
        totalNonLaborCostByMonth
      ).reduce((s, v) => s + v, 0);
      const totalExpenseOverall = Object.values(totalExpenseData).reduce(
        (s, v) => s + v,
        0
      );
      const totalProfitOverall = totalRevenueOverall - totalExpenseOverall;

      // ---------- PRIOR YEAR CALCULATION ----------
      // Prior year covers from startYear up to selectedYear - 1 (inclusive)
      const priorYearTotals = {};
      if (startYear && selectedYear && startYear < selectedYear) {
        const priorStart = startYear;
        const priorEnd = selectedYear - 1;

        // Helper to build monthRange string
        const monthKey = (m, y) => `${String(m).padStart(2, "0")}/${y}`;

        // Revenue prior-year sum
        let priorRevenue = 0;
        (rawApiResponse?.monthlyRevenueSummary || []).forEach((m) => {
          const y = Number(m.year);
          if (y >= priorStart && y <= priorEnd) priorRevenue += Number(m.revenue || 0);
        });

        // Staff prior-year sum
        let priorStaff = 0;
        (rawApiResponse?.employeeForecastSummary || []).forEach((empSummary) => {
          (empSummary.emplSchedule?.payrollSalary || []).forEach((p) => {
            const y = Number(p.year);
            if (y >= priorStart && y <= priorEnd) priorStaff += Number(p.totalBurdenCost || p.cost || 0);
          });
        });

        // Non-labor prior-year sum
        let priorNonLabor = 0;
        const allNonLabor = [
          ...(rawApiResponse?.directCOstForecastSummary || []),
          ...(rawApiResponse?.indirectCostForecastSummary || []),
        ];
        allNonLabor.forEach((nl) => {
          const schedules = nl.directCostSchedule?.forecasts || nl.indirectCostSchedule?.forecasts || [];
          schedules.forEach((s) => {
            const y = Number(s.year);
            if (y >= priorStart && y <= priorEnd) {
              if (planType === "EAC") priorNonLabor += Number(s.actualamt || 0);
              else if (planType === "BUD") priorNonLabor += Number(s.forecastedamt || 0);
              else priorNonLabor += Number((s.cost || 0) + (s.fringe || 0) + (s.overhead || 0) + (s.gna || 0) + (s.materials || 0));
            }
          });
        });

        const priorExpense = priorStaff + priorNonLabor;
        const priorProfit = priorRevenue - priorExpense;

        priorYearTotals.revenue = priorRevenue;
        priorYearTotals.staff = priorStaff;
        priorYearTotals.nonLabor = priorNonLabor;
        priorYearTotals.expense = priorExpense;
        priorYearTotals.profit = priorProfit;
        priorYearTotals.profitOnCost = priorExpense !== 0 ? priorProfit / priorExpense : 0;
        priorYearTotals.profitOnRevenue = priorRevenue !== 0 ? priorProfit / priorRevenue : 0;
      }

      // ---------- EMPLOYEES ----------
      // const uniqueEmployeesMap = new Map();
      // const filteredEmployeeSummaries = (
      //   apiResponse.employeeForecastSummary || []
      // ).filter((empSummary) => {
      //   const isOrgMatch = currentOrgId
      //     ? empSummary.orgID === currentOrgId
      //     : true;
      //   return isOrgMatch;
      // });

      // if (filteredEmployeeSummaries.length > 0) {
      //   filteredEmployeeSummaries.forEach((empSummary) => {
      //     if (!uniqueEmployeesMap.has(empSummary.emplId)) {
      //       uniqueEmployeesMap.set(empSummary.emplId, {
      //         id: empSummary.emplId,
      //         name: `${empSummary.name} (${empSummary.emplId})`,
      //         cost: 0,
      //         accountId: empSummary.accID || "",
      //         orgId: empSummary.orgId || "",
      //         glcPlc: empSummary.plcCode || "",
      //         hrlyRate: empSummary.perHourRate || 0,
      //         monthlyHours: {},
      //         monthlyCost: {},

      //         // 🔥 new breakdown fields
      //         monthlyRawCost: {},
      //         monthlyFringe: {},
      //         monthlyOverhead: {},
      //         monthlyGna: {},

      //         detailSummary: {},
      //       });
      //     }
      //     const employee = uniqueEmployeesMap.get(empSummary.emplId);

      //     const payrollSalaries = empSummary.emplSchedule?.payrollSalary || [];
      //     payrollSalaries.forEach((salaryEntry) => {
      //       const monthRange = getMonthRangeKey(
      //         salaryEntry.month,
      //         salaryEntry.year
      //       );

      //       if (monthRange && dynamicDateRanges.includes(monthRange)) {
      //         // 🔥 Changed: split into raw / fringe / overhead / gna
      //         employee.monthlyRawCost[monthRange] =
      //           (employee.monthlyRawCost[monthRange] || 0) +
      //           (salaryEntry.cost || 0);
      //         employee.monthlyFringe[monthRange] =
      //           (employee.monthlyFringe[monthRange] || 0) +
      //           (salaryEntry.fringe || 0);
      //         employee.monthlyOverhead[monthRange] =
      //           (employee.monthlyOverhead[monthRange] || 0) +
      //           (salaryEntry.overhead || 0);
      //         employee.monthlyGna[monthRange] =
      //           (employee.monthlyGna[monthRange] || 0) + (salaryEntry.gna || 0);

      //         // total burdened cost
      //         employee.monthlyCost[monthRange] =
      //           (employee.monthlyCost[monthRange] || 0) +
      //           (salaryEntry.totalBurdenCost || 0);

      //         // hours
      //         employee.monthlyHours[monthRange] =
      //           (employee.monthlyHours[monthRange] || 0) +
      //           (salaryEntry.hours || 0);

      //         // 🔥 Updated detailSummary to align with UI rows
      //         if (!employee.detailSummary["Raw Cost"])
      //           employee.detailSummary["Raw Cost"] = {};
      //         employee.detailSummary["Raw Cost"][monthRange] =
      //           (employee.detailSummary["Raw Cost"][monthRange] || 0) +
      //           (salaryEntry.cost || 0);

      //         if (!employee.detailSummary["Fringe Benefits"])
      //           employee.detailSummary["Fringe Benefits"] = {};
      //         employee.detailSummary["Fringe Benefits"][monthRange] =
      //           (employee.detailSummary["Fringe Benefits"][monthRange] || 0) +
      //           (salaryEntry.fringe || 0);

      //         if (!employee.detailSummary["Overhead"])
      //           employee.detailSummary["Overhead"] = {};
      //         employee.detailSummary["Overhead"][monthRange] =
      //           (employee.detailSummary["Overhead"][monthRange] || 0) +
      //           (salaryEntry.overhead || 0);

      //         if (!employee.detailSummary["General & Admin"])
      //           employee.detailSummary["General & Admin"] = {};
      //         employee.detailSummary["General & Admin"][monthRange] =
      //           (employee.detailSummary["General & Admin"][monthRange] || 0) +
      //           (salaryEntry.gna || 0);
      //       }
      //     });
      //   });
      // }

      // ✅ Use Map for unique employees
      const uniqueEmployeesMap = new Map();

      const filteredEmployeeSummaries = (
        apiResponse.employeeForecastSummary || []
      ).filter((empSummary) => {
        const isOrgMatch = currentOrgId
          ? empSummary.orgID === currentOrgId
          : true;
        return isOrgMatch;
      });

      if (filteredEmployeeSummaries.length > 0) {
        filteredEmployeeSummaries.forEach((empSummary) => {
          // 🔥 NEW: create composite key instead of just emplId
          const compositeKey = `${empSummary.emplId}-${empSummary.plcCode}-${empSummary.orgId}-${empSummary.accID}`;

          if (!uniqueEmployeesMap.has(compositeKey)) {
            uniqueEmployeesMap.set(compositeKey, {
              // 🔥 Changed from emplId → compositeKey
              id: compositeKey,
              // 🔥 Changed: display emplId + plcCode for clarity
              name: `${empSummary.name} (${empSummary.emplId}) (${empSummary.plcCode})`,
              cost: 0,
              accountId: empSummary.accID || "",
              orgId: empSummary.orgId || "",
              glcPlc: empSummary.plcCode || "",
              hrlyRate: empSummary.perHourRate || 0,
              monthlyHours: {},
              monthlyCost: {},

              // 🔥 new breakdown fields
              monthlyRawCost: {},
              monthlyFringe: {},
              monthlyOverhead: {},
              monthlyGna: {},

              detailSummary: {},
            });
          }

          // 🔥 Changed: get employee by compositeKey instead of emplId
          const employee = uniqueEmployeesMap.get(compositeKey);

          const payrollSalaries = empSummary.emplSchedule?.payrollSalary || [];
          payrollSalaries.forEach((salaryEntry) => {
            const monthRange = getMonthRangeKey(
              salaryEntry.month,
              salaryEntry.year
            );

            if (monthRange && dynamicDateRanges.includes(monthRange)) {
              // 🔥 Changed: split into raw / fringe / overhead / gna
              employee.monthlyRawCost[monthRange] =
                (employee.monthlyRawCost[monthRange] || 0) +
                (salaryEntry.cost || 0);
              employee.monthlyFringe[monthRange] =
                (employee.monthlyFringe[monthRange] || 0) +
                (salaryEntry.fringe || 0);
              employee.monthlyOverhead[monthRange] =
                (employee.monthlyOverhead[monthRange] || 0) +
                (salaryEntry.overhead || 0);
              employee.monthlyGna[monthRange] =
                (employee.monthlyGna[monthRange] || 0) + (salaryEntry.gna || 0);

              // total burdened cost
              employee.monthlyCost[monthRange] =
                (employee.monthlyCost[monthRange] || 0) +
                (salaryEntry.totalBurdenCost || 0);

              // hours
              employee.monthlyHours[monthRange] =
                (employee.monthlyHours[monthRange] || 0) +
                (salaryEntry.hours || 0);

              // 🔥 Updated detailSummary to align with UI rows
              if (!employee.detailSummary["Raw Cost"])
                employee.detailSummary["Raw Cost"] = {};
              employee.detailSummary["Raw Cost"][monthRange] =
                (employee.detailSummary["Raw Cost"][monthRange] || 0) +
                (salaryEntry.cost || 0);

              if (!employee.detailSummary["Fringe Benefits"])
                employee.detailSummary["Fringe Benefits"] = {};
              employee.detailSummary["Fringe Benefits"][monthRange] =
                (employee.detailSummary["Fringe Benefits"][monthRange] || 0) +
                (salaryEntry.fringe || 0);

              if (!employee.detailSummary["Overhead"])
                employee.detailSummary["Overhead"] = {};
              employee.detailSummary["Overhead"][monthRange] =
                (employee.detailSummary["Overhead"][monthRange] || 0) +
                (salaryEntry.overhead || 0);

              if (!employee.detailSummary["General & Admin"])
                employee.detailSummary["General & Admin"] = {};
              employee.detailSummary["General & Admin"][monthRange] =
                (employee.detailSummary["General & Admin"][monthRange] || 0) +
                (salaryEntry.gna || 0);
            }
          });
        });
      }

      // ---------- NON-LABOR ----------
      const nonLaborAcctDetailsMap = new Map();
      const allNonLaborSummariesFiltered = [
        ...(apiResponse.directCOstForecastSummary || []),
        ...(apiResponse.indirectCostForecastSummary || []),
      ].filter((n) => (currentOrgId ? n.orgID === currentOrgId : true));

      allNonLaborSummariesFiltered.forEach((nonLaborSummary) => {
        const schedules =
          nonLaborSummary.directCostSchedule?.forecasts ||
          nonLaborSummary.indirectCostSchedule?.forecasts ||
          [];
        const accountId = nonLaborSummary.accID;
        const orgId = nonLaborSummary.orgID;
        const glcPlc = nonLaborSummary.plcCode || "";
        const accName = nonLaborSummary.accName || `Account: ${accountId}`;

        if (!nonLaborAcctDetailsMap.has(accountId)) {
          nonLaborAcctDetailsMap.set(accountId, {
            id: accountId,
            description: accName,
            orgId: orgId,
            glcPlc: glcPlc,
            total: 0,
            monthlyData: dynamicDateRanges.reduce(
              (acc, range) => ({ ...acc, [range]: 0 }),
              {}
            ),
            employees: new Map(),
          });
        }
        const acctGroup = nonLaborAcctDetailsMap.get(accountId);
        const employeeId = nonLaborSummary.emplId || "N/A_Employee";
        const employeeName = nonLaborSummary.name || ` ${accountId}`;

        if (!acctGroup.employees.has(employeeId)) {
          acctGroup.employees.set(employeeId, {
            id: employeeId,
            name: `${employeeName} (${employeeId})`,
            total: 0,
            monthlyData: dynamicDateRanges.reduce(
              (acc, range) => ({ ...acc, [range]: 0 }),
              {}
            ),
            entries: [],
          });
        }
        const employeeGroup = acctGroup.employees.get(employeeId);

        schedules.forEach((scheduleEntry) => {
          const monthRange = getMonthRangeKey(
            scheduleEntry.month,
            scheduleEntry.year
          );
          if (monthRange && dynamicDateRanges.includes(monthRange)) {
            let entryCost = 0;
            if (planType === "EAC") {
              entryCost = scheduleEntry.actualamt || 0;
            } else if (planType === "BUD") {
              entryCost = scheduleEntry.forecastedamt || 0;
            } else {
              entryCost =
                (scheduleEntry.cost || 0) +
                (scheduleEntry.fringe || 0) +
                (scheduleEntry.overhead || 0) +
                (scheduleEntry.gna || 0) +
                (scheduleEntry.materials || 0);
            }
            employeeGroup.entries.push({
              id: `${
                scheduleEntry.dctId || scheduleEntry.forecastid
              }-${monthRange}`,
              dctId: scheduleEntry.dctId,
              forecastid: scheduleEntry.forecastid,
              monthLabel: `${String(scheduleEntry.month).padStart(2, "0")}/${
                scheduleEntry.year
              }`,
              total: entryCost,
              monthlyValues: { [monthRange]: entryCost },
            });
            employeeGroup.monthlyData[monthRange] += entryCost;
            employeeGroup.total += entryCost;
            acctGroup.monthlyData[monthRange] += entryCost;
            acctGroup.total += entryCost;
          }
        });
      });

      // ---------- FINALIZE EMPLOYEES ----------
      Array.from(uniqueEmployeesMap.values()).forEach((employee) => {
        // 🔥 recompute totals from new breakdown
        employee.rawCost = Object.values(employee.monthlyRawCost).reduce(
          (s, v) => s + v,
          0
        );
        employee.fringe = Object.values(employee.monthlyFringe).reduce(
          (s, v) => s + v,
          0
        );
        employee.overhead = Object.values(employee.monthlyOverhead).reduce(
          (s, v) => s + v,
          0
        );
        employee.gna = Object.values(employee.monthlyGna).reduce(
          (s, v) => s + v,
          0
        );
        employee.cost = Object.values(employee.monthlyCost).reduce(
          (s, v) => s + v,
          0
        );
        // compute priorYear total for this employee using rawApiResponse when available
        employee.priorYear = 0;
        if (startYear && selectedYear && rawApiResponse?.employeeForecastSummary) {
          const empIdMatches = (s) => {
            // We don't necessarily have a unique lookup id; compare emplId and some attributes
            return (
              s.emplId === employee.name?.match(/\(([^)]+)\)/)?.[1] || s.emplId === employee.id
            );
          };

          rawApiResponse.employeeForecastSummary.forEach((empSummary) => {
            // create matching key similar to earlier compositeKey
            const compositeKeyRaw = `${empSummary.emplId}-${empSummary.plcCode}-${empSummary.orgId}-${empSummary.accID}`;
            if (compositeKeyRaw === employee.id) {
              (empSummary.emplSchedule?.payrollSalary || []).forEach((s) => {
                const y = Number(s.year);
                if (y >= startYear && y <= selectedYear - 1) {
                  employee.priorYear += Number(s.totalBurdenCost || s.cost || 0);
                }
              });
            }
          });
        }
      });

      Array.from(nonLaborAcctDetailsMap.values()).forEach((acctGroup) => {
        acctGroup.total = Object.values(acctGroup.monthlyData).reduce(
          (s, v) => s + v,
          0
        );
        acctGroup.employees = Array.from(acctGroup.employees.values());

        // compute priorYear for non-labor account groups using rawApiResponse when available
        acctGroup.priorYear = 0;
        if (startYear && selectedYear && rawApiResponse) {
          const allNonLabor = [
            ...(rawApiResponse.directCOstForecastSummary || []),
            ...(rawApiResponse.indirectCostForecastSummary || []),
          ];

          allNonLabor.forEach((nl) => {
            const accId = nl.accID || nl.accId || nl.accId;
            if (String(accId) === String(acctGroup.id)) {
              const schedules = nl.directCostSchedule?.forecasts || nl.indirectCostSchedule?.forecasts || [];
              schedules.forEach((s) => {
                const y = Number(s.year);
                if (y >= startYear && y <= selectedYear - 1) {
                  if (planType === "EAC") acctGroup.priorYear += Number(s.actualamt || 0);
                  else if (planType === "BUD") acctGroup.priorYear += Number(s.forecastedamt || 0);
                  else acctGroup.priorYear += Number((s.cost || 0) + (s.fringe || 0) + (s.overhead || 0) + (s.gna || 0) + (s.materials || 0));
                }
              });
            }
          });
        }
      });

      // ---------- PROFIT ----------
      const selectedRevenueData =
        selectedRevenueView === "t&m" ? monthlyRevenueData : monthlyRevenueData;
      dynamicDateRanges.forEach((range) => {
        profitData[range] =
          (selectedRevenueData[range] || 0) - (totalExpenseData[range] || 0);
      });

      const overallProfitOnCost =
        totalExpenseOverall !== 0
          ? totalProfitOverall / totalExpenseOverall
          : 0;
      const overallProfitOnRevenue =
        totalRevenueOverall !== 0
          ? totalProfitOverall / totalRevenueOverall
          : 0;

      // ---------- BUILD ROWS ----------
      financialRows.push({
        id: `revenue-${currentOrgId}`,
        description: "Revenue",
        total: totalRevenueOverall,
        priorYear: priorYearTotals.revenue || 0,
        data: selectedRevenueData,
        tnmRevenueData: monthlyRevenueData,
        cpffRevenueData: monthlyRevenueData,
        type: "summary",
        orgId: currentOrgId,
      });

      financialRows.push({
        id: `total-staff-cost-${currentOrgId}`,
        description: "Total Staff Cost",
        total: totalStaffCostOverall,
        priorYear: priorYearTotals.staff || 0,
        data: totalStaffCostByMonth,
        type: "expandable",
        employees: Array.from(uniqueEmployeesMap.values()),
        orgId: currentOrgId,
      });

      financialRows.push({
        id: `non-labor-staff-cost-${currentOrgId}`,
        description: "Non-Labor Staff Cost",
        total: totalNonLaborCostOverall,
        priorYear: priorYearTotals.nonLabor || 0,
        data: totalNonLaborCostByMonth,
        type: "expandable",
        nonLaborAccts: Array.from(nonLaborAcctDetailsMap.values()),
        orgId: currentOrgId,
      });

      financialRows.push({
        id: `total-expense-${currentOrgId}`,
        description: "Total Expense",
        total: totalExpenseOverall,
        priorYear: priorYearTotals.expense || 0,
        data: totalExpenseData,
        type: "summary",
        orgId: currentOrgId,
      });

      financialRows.push({
        id: `profit-${currentOrgId}`,
        description: "Profit",
        total: totalProfitOverall,
        priorYear: priorYearTotals.profit || 0,
        data: profitData,
        type: "summary",
        orgId: currentOrgId,
      });

      dynamicDateRanges.forEach((range) => {
        const profit = profitData[range] || 0;
        const expense = totalExpenseData[range] || 0;
        profitOnCostData[range] = expense !== 0 ? profit / expense : 0;
      });

      financialRows.push({
        id: `profit-cost-${currentOrgId}`,
        description: "Profit % on Cost",
        total: overallProfitOnCost,
        priorYear: priorYearTotals.profitOnCost || 0,
        data: profitOnCostData,
        type: "summary",
        orgId: currentOrgId,
      });

      dynamicDateRanges.forEach((range) => {
        const profit = profitData[range] || 0;
        let revenueForPercentage = selectedRevenueData[range] || 0;
        profitOnRevenueData[range] =
          revenueForPercentage !== 0 ? profit / revenueForPercentage : 0;
      });

      financialRows.push({
        id: `profit-revenue-${currentOrgId}`,
        description: "Profit % on Revenue",
        total: overallProfitOnRevenue,
        priorYear: priorYearTotals.profitOnRevenue || 0,
        data: profitOnRevenueData,
        type: "summary",
        orgId: currentOrgId,
      });

      // console.log(
      //   "transformApiDataToFinancialRows: Final financialRows",
      //   financialRows
      // );
      return financialRows;
    },
    [selectedRevenueView]
  );

  useEffect(() => {
    // console.log(
    //   "useEffect [initialApiData, isLoading, error, fiscalYear]: Effect triggered."
    // );
    if (isLoading) {
      // console.log("useEffect: Data is still loading.");
      setAllApiData(null);
      setDynamicDateRanges([]);
      setSelectedOrgId("");
      setAvailableOrgIds([]);
      setFinancialData([]);
      return;
    }

    if (error) {
      // console.log("useEffect: Error received from parent:", error);
      setAllApiData(null);
      setDynamicDateRanges([]);
      setSelectedOrgId("");
      setAvailableOrgIds([]);
      setFinancialData([]);
      return;
    }

    if (!initialApiData || Object.keys(initialApiData).length === 0) {
      // console.log("useEffect: initialApiData is null, undefined, or empty.");
      setAllApiData(null);
      setDynamicDateRanges([]);
      setSelectedOrgId("");
      setAvailableOrgIds([]);
      setFinancialData([]);
      return;
    }

    try {
      // console.log(
      //   "useEffect: Processing initialApiData for deep fiscal year filtering..."
      // );

      const processedApiData = { ...initialApiData }; // Start with a copy

      processedApiData.employeeForecastSummary = (
        initialApiData.employeeForecastSummary || []
      )
        .map((empSummary) => {
          const filteredPayrollSalary = (
            empSummary.emplSchedule?.payrollSalary || []
          ).filter((salaryEntry) => {
            return (
              !fiscalYear ||
              fiscalYear === "All" ||
              String(salaryEntry.year) === fiscalYear
            );
          });

          if (filteredPayrollSalary.length > 0) {
            return {
              ...empSummary,
              emplSchedule: {
                ...empSummary.emplSchedule,
                payrollSalary: filteredPayrollSalary,
              },
            };
          }
          return null;
        })
        .filter(Boolean);

      // console.log(
      //   "useEffect: employeeForecastSummary after deep fiscalYear filter:",
      //   processedApiData.employeeForecastSummary
      // );

      processedApiData.directCOstForecastSummary = (
        initialApiData.directCOstForecastSummary || []
      )
        .map((nonLaborSummary) => {
          const filteredForecasts = (
            nonLaborSummary.directCostSchedule?.forecasts || []
          ).filter((f) => {
            return (
              !fiscalYear ||
              fiscalYear === "All" ||
              String(f.year) === fiscalYear
            );
          });
          if (filteredForecasts.length > 0) {
            return {
              ...nonLaborSummary,
              directCostSchedule: {
                ...nonLaborSummary.directCostSchedule,
                forecasts: filteredForecasts,
              },
            };
          }
          return null;
        })
        .filter(Boolean);
      // console.log(
      //   "useEffect: directCOstForecastSummary after deep fiscalYear filter:",
      //   processedApiData.directCOstForecastSummary
      // );

      processedApiData.indirectCostForecastSummary = (
        initialApiData.indirectCostForecastSummary || []
      )
        .map((nonLaborSummary) => {
          const filteredForecasts = (
            nonLaborSummary.indirectCostSchedule?.forecasts || []
          ).filter((f) => {
            return (
              !fiscalYear ||
              fiscalYear === "All" ||
              String(f.year) === fiscalYear
            );
          });
          if (filteredForecasts.length > 0) {
            return {
              ...nonLaborSummary,
              indirectCostSchedule: {
                ...nonLaborSummary.indirectCostSchedule,
                forecasts: filteredForecasts,
              },
            };
          }
          return null;
        })
        .filter(Boolean);
      // console.log(
      //   "useEffect: indirectCostSummariesFiltered after deep fiscalYear filter:",
      //   processedApiData.indirectCostForecastSummary
      // );

      setAllApiData(processedApiData);

      const uniqueOrgIds = new Set();
      const uniqueDateRangesSet = new Set();

      (processedApiData.employeeForecastSummary || []).forEach((summary) => {
        uniqueOrgIds.add(summary.orgID);
        summary.emplSchedule?.payrollSalary?.forEach((salaryEntry) => {
          const monthRangeKey = getMonthRangeKey(
            salaryEntry.month,
            salaryEntry.year
          );
          uniqueDateRangesSet.add(monthRangeKey);
        });
      });

      (processedApiData.directCOstForecastSummary || []).forEach(
        (nonLaborSummary) => {
          uniqueOrgIds.add(nonLaborSummary.orgID);
          nonLaborSummary.directCostSchedule?.forecasts?.forEach(
            (scheduleEntry) => {
              const monthRangeKey = getMonthRangeKey(
                scheduleEntry.month,
                scheduleEntry.year
              );
              uniqueDateRangesSet.add(monthRangeKey);
            }
          );
        }
      );

      (processedApiData.indirectCostForecastSummary || []).forEach(
        (nonLaborSummary) => {
          uniqueOrgIds.add(nonLaborSummary.orgID);
          nonLaborSummary.indirectCostSchedule?.forecasts?.forEach(
            (scheduleEntry) => {
              const monthRangeKey = getMonthRangeKey(
                scheduleEntry.month,
                scheduleEntry.year
              );
              uniqueDateRangesSet.add(monthRangeKey);
            }
          );
        }
      );

      const sortedDateRanges = Array.from(uniqueDateRangesSet).sort((a, b) => {
        const [monthAStr, yearAStr] = a.split("/");
        const yearA = parseInt(yearAStr, 10);
        const monthA = parseInt(monthAStr, 10);

        const [monthBStr, yearBStr] = b.split("/");
        const yearB = parseInt(yearBStr, 10);
        const monthB = parseInt(monthBStr, 10);

        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      });

      setDynamicDateRanges(sortedDateRanges);
      // console.log("useEffect: dynamicDateRanges set to", sortedDateRanges);

      const orgs = Array.from(uniqueOrgIds).sort();
      setAvailableOrgIds(orgs);
      // console.log("useEffect: availableOrgIds set to", orgs);

      if (orgs.length > 0) {
        setSelectedOrgId(orgs[0]);
        // console.log("useEffect: selectedOrgId set to", orgs[0]);
      } else {
        setSelectedOrgId("");
        // console.log("useEffect: selectedOrgId set to empty (no orgs found)");
      }
    } catch (e) {
      // console.error("Error during initial API data processing:", e);
      setAllApiData(null);
      setDynamicDateRanges([]);
      setSelectedOrgId("");
      setAvailableOrgIds([]);
      setFinancialData([]);
    }
  }, [initialApiData, isLoading, error, fiscalYear]);

  useEffect(() => {
    // console.log(
    //   "useEffect [allApiData, selectedOrgId, dynamicDateRanges, ...]: Transform trigger effect."
    // );
    if (allApiData && selectedOrgId && dynamicDateRanges.length > 0) {
      // console.log(
      //   "useEffect (transform trigger): allApiData, selectedOrgId, dynamicDateRanges are ready. Transforming data..."
      // );
      const transformedData = transformApiDataToFinancialRows(
        allApiData,
        selectedOrgId,
        dynamicDateRanges,
        selectedRevenueView,
        type,
        initialApiData,
        fiscalYear
      );
      // console.log(
      //   "Transformed Data (after filter & transform):",
      //   transformedData
      // );
      setFinancialData(transformedData);
    } else {
      // console.log(
      //   "useEffect (transform trigger): Waiting for allApiData, selectedOrgId, or dynamicDateRanges to be ready."
      // );
      setFinancialData([]);
    }
    setExpandedStaffRows([]);
    setExpandedEmployeeDetails([]);
    setExpandedNonLaborAcctRows([]);
  }, [
    allApiData,
    selectedOrgId,
    dynamicDateRanges,
    selectedRevenueView,
    transformApiDataToFinancialRows,
    type,
    fiscalYear,
  ]);

  const toggleStaffRow = (id) => {
    setExpandedStaffRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleEmployeeDetail = (id) => {
    setExpandedEmployeeDetails((prev) =>
      prev.includes(id)
        ? prev.filter((detailId) => detailId !== id)
        : [...prev, id]
    );
  };

  const toggleNonLaborAcctRow = (id) => {
    setExpandedNonLaborAcctRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const formatValue = (value, isHours = false, isPercentage = false) => {
    if (typeof value === "number") {
      let formatted;
      if (isPercentage) {
        formatted = (value * 100).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${formatted}%`;
      }
      formatted = value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return isHours ? `${formatted} hrs` : formatted;
    }
    return isHours ? "0.00 hrs" : isPercentage ? "0.00%" : "0.00";
  };

  const getGlassmorphismClasses = () => `
    bg-white bg-opacity-5 backdrop-filter backdrop-blur-lg rounded-lg
    border border-opacity-10 border-white shadow-lg
  `;

  if (isLoading) {
    return (
      // <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-50 text-gray-800 text-2xl">
      //   Loading data...
      // </div>
      <div className="p-4 font-inter flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-gray-600">Loading data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-50 text-red-600 text-2xl">
        Error: {error}
      </div>
    );
  }

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // const expandAll = () => {
  //   // Expand all staff rows
  //   const staffRowsToExpand = financialData
  //     .filter(
  //       (row) =>
  //         row.type === "expandable" && row.id.startsWith("total-staff-cost")
  //     )
  //     .map((row) => row.id);
  //   setExpandedStaffRows((prev) => [
  //     ...new Set([...prev, ...staffRowsToExpand]),
  //   ]);

  //   // Expand all employee details
  //   const employeeDetailsToExpand = [];
  //   financialData.forEach((row) => {
  //     if (
  //       row.type === "expandable" &&
  //       row.id.startsWith("total-staff-cost") &&
  //       row.employees
  //     ) {
  //       row.employees.forEach((employee) =>
  //         employeeDetailsToExpand.push(`${row.id}-${employee.id}`)
  //       );
  //     }
  //   });
  //   setExpandedEmployeeDetails((prev) => [
  //     ...new Set([...prev, ...employeeDetailsToExpand]),
  //   ]);

  //   // Expand all non-labor account rows
  //   const nonLaborAcctRowsToExpand = [];
  //   financialData.forEach((row) => {
  //     if (
  //       row.type === "expandable" &&
  //       row.id.startsWith("non-labor-staff-cost") &&
  //       row.nonLaborAccts
  //     ) {
  //       row.nonLaborAccts.forEach((acct) =>
  //         nonLaborAcctRowsToExpand.push(`${row.id}-${acct.id}`)
  //       );
  //     }
  //   });
  //   setExpandedNonLaborAcctRows((prev) => [
  //     ...new Set([...prev, ...nonLaborAcctRowsToExpand]),
  //   ]);
  // };

  // const collapseAll = () => {
  //   setExpandedStaffRows([]);
  //   setExpandedEmployeeDetails([]);
  //   setExpandedNonLaborAcctRows([]);
  // };

  const expandAll = () => {
    // ✅ Expand all staff rows (parents)
    const staffRowsToExpand = financialData
      .filter(
        (row) =>
          row.type === "expandable" && row.id.startsWith("total-staff-cost")
      )
      .map((row) => row.id);
    setExpandedStaffRows(staffRowsToExpand);

    // ✅ Expand all employee details (children under staff)
    const employeeDetailsToExpand = [];
    financialData.forEach((row) => {
      if (
        row.type === "expandable" &&
        row.id.startsWith("total-staff-cost") &&
        row.employees
      ) {
        row.employees.forEach((employee) =>
          employeeDetailsToExpand.push(`${row.id}-${employee.id}`)
        );
      }
    });
    setExpandedEmployeeDetails(employeeDetailsToExpand);

    // ✅ Expand all non-labor parent rows (FIXED typo + separate state)
    const nonLaborParentRowsToExpand = financialData
      .filter(
        (row) =>
          row.type === "expandable" && row.id.startsWith("non-labor-staff-cost") // 🔥 FIXED typo
      )
      .map((row) => row.id);

    setExpandedNonLaborAcctRows(nonLaborParentRowsToExpand); // 🔥 now expands parents

    // ✅ Expand all non-labor child account rows
    const nonLaborAcctRowsToExpand = [];
    financialData.forEach((row) => {
      if (
        row.type === "expandable" &&
        row.id.startsWith("non-labor-staff-cost") &&
        row.nonLaborAccts
      ) {
        row.nonLaborAccts.forEach((acct) =>
          nonLaborAcctRowsToExpand.push(`${row.id}-${acct.id}`)
        );
      }
    });
    setExpandedNonLaborAcctRows((prev) => [
      ...new Set([
        ...prev,
        ...nonLaborParentRowsToExpand,
        ...nonLaborAcctRowsToExpand,
      ]),
    ]); //  merge parent + children
  };

  const collapseAll = () => {
    setExpandedStaffRows([]);
    setExpandedEmployeeDetails([]);
    setExpandedNonLaborAcctRows([]); // clears both parent + child IDs
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-50 p-8 text-gray-800 font-inter">
      <button
        onClick={expandAll}
        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 mb-1"
      >
        Expand All
      </button>
      <button
        onClick={collapseAll}
        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 ml-2 mb-1"
      >
        Collapse All
      </button>

      <div className={`p-6 ${getGlassmorphismClasses()}`}>
        <div className="mb-8 flex-wrap justify-center items-center gap-4 hidden"></div>

        <div className="overflow-x-auto max-h-120 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-300 divide-opacity-30">
            {/* <thead>
              <tr className="bg-gray-100 sticky bg-opacity-50">
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700 uppercase tracking-wider sticky left-0 z-10 bg-inherit">
                  Description
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                  Account ID
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                  Org ID
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                  GLC/PLC
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                  Hrly Rate
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                  CTD Total
                </th>
                 
                {dynamicDateRanges.length > 0 &&
                  dynamicDateRanges.map((range) => {
                    const [monthPart, yearPart] = range.split("/");

                    return (
                      <th
                        key={range}
                        className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        {`${monthPart}/${yearPart}`}
                      </th>
                    );
                  })}
              </tr>
            </thead> */}
            <thead>
              <tr className="bg-gray-100 bg-opacity-50">
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700 uppercase tracking-wider sticky left-0 top-0 z-20 bg-gray-100 bg-opacity-50">
                  Description
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                  Account ID
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                  Org ID
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                  GLC/PLC
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                  Hrly Rate
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                  CTD Total
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap sticky top-0 z-10 bg-gray-100 bg-opacity-50">
                  Prior Year
                </th>
                {dynamicDateRanges.length > 0 &&
                  dynamicDateRanges.map((range) => {
                    const [monthPart, yearPart] = range.split("/");

                    return (
                      <th
                        key={range}
                        className="py-3 px-4 text-right text-sm font-semibold text-blue-700 uppercase tracking-wider whitespace-nowrap sticky top-0 z-10 bg-gray-100 bg-opacity-50"
                      >
                        {`${monthPart}/${yearPart}`}
                      </th>
                    );
                  })}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-300 divide-opacity-10">
              {financialData.length === 0 ? (
                <tr>
                  <td
                    colSpan={dynamicDateRanges.length + 8}
                    className="py-8 text-center text-gray-600 text-lg"
                  >
                    {isLoading
                      ? "Loading data..."
                      : "No data available for the selected criteria."}
                  </td>
                </tr>
              ) : (
                financialData.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className={`
                          group hover:bg-gray-100 hover:bg-opacity-50 transition-colors duration-200
                          ${
                            row.type === "summary"
                              ? "bg-gray-100 bg-opacity-20"
                              : ""
                          }
                          ${
                            row.type === "expandable"
                              ? "cursor-pointer bg-blue-100 bg-opacity-30"
                              : ""
                          }
                      `}
                      onClick={() =>
                        row.type === "expandable" &&
                        row.id.startsWith("total-staff-cost")
                          ? toggleStaffRow(row.id)
                          : row.type === "expandable" &&
                            row.id.startsWith("non-labor-staff-cost")
                          ? toggleNonLaborAcctRow(row.id)
                          : null
                      }
                    >
                      <td className="py-3 px-4 whitespace-nowrap sticky left-0 z-10 bg-inherit flex items-center text-gray-800">
                        {row.type === "expandable" && (
                          <span className="mr-2">
                            {(row.id.startsWith("total-staff-cost") &&
                              expandedStaffRows.includes(row.id)) ||
                            (row.id.startsWith("non-labor-staff-cost") &&
                              expandedNonLaborAcctRows.includes(row.id)) ? (
                              <ChevronUpIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                            )}
                          </span>
                        )}
                        {row.description}
                      </td>
                      <td className="py-3 px-4 text-left whitespace-nowrap text-gray-800">
                        {row.accountId || ""}
                      </td>
                      <td className="py-3 px-4 text-left whitespace-nowrap text-gray-800">
                        {row.orgId || ""}
                      </td>
                      <td className="py-3 px-4 text-left whitespace-nowrap text-gray-800">
                        {row.glcPlc || ""}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap text-gray-800">
                        {formatValue(row.hrlyRate)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right whitespace-nowrap text-gray-800 ${
                          typeof row.total === "number" && row.total < 0
                            ? "text-red-600"
                            : typeof row.total === "number" &&
                              row.total > 0 &&
                              row.description === "Profit"
                            ? "text-green-600"
                            : ""
                        }`}
                      >
                        {row.description.includes("Profit %")
                          ? formatValue(row.total, false, true)
                          : formatValue(row.total)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap text-gray-800">
                        {row.description.includes("Profit %")
                          ? formatValue(row.priorYear, false, true)
                          : formatValue(row.priorYear || 0)}
                      </td>
                      {dynamicDateRanges.map((range) => {
                        let dataForRange;

                        if (row.description === "Revenue") {
                          if (
                            selectedRevenueView === "t&m" &&
                            row.tnmRevenueData
                          ) {
                            dataForRange = row.tnmRevenueData[range];
                          } else if (
                            selectedRevenueView === "cpff" &&
                            row.cpffRevenueData
                          ) {
                            dataForRange = row.cpffRevenueData[range];
                          } else {
                            dataForRange = row.data[range];
                          }
                        } else {
                          dataForRange = row.data[range];
                        }
                        // console.log(
                        //   `  Rendering cell for row: ${row.description}, range: ${range}, data: ${dataForRange}`
                        // );

                        const isProfitRow = row.id.startsWith("profit-");
                        const isNegative =
                          typeof dataForRange === "number" && dataForRange < 0;
                        const isPositive =
                          typeof dataForRange === "number" && dataForRange > 0;
                        let textColorClass = "";
                        if (isProfitRow) {
                          if (isNegative) {
                            textColorClass = "text-red-600";
                          } else if (isPositive) {
                            textColorClass = "text-green-600";
                          }
                        }
                        return (
                          <td
                            key={range}
                            className={`py-3 px-4 text-right whitespace-nowrap text-gray-800 ${textColorClass}`}
                          >
                            {row.description.includes("Profit %")
                              ? formatValue(dataForRange, false, true)
                              : formatValue(dataForRange)}
                          </td>
                        );
                      })}
                    </tr>

                    {row.type === "expandable" &&
                      expandedStaffRows.includes(row.id) &&
                      row.employees &&
                      row.employees.length > 0 && (
                        <>
                          {row.employees.map((employee) => (
                            <React.Fragment key={`${row.id}-${employee.id}`}>
                              <tr
                                className="bg-gray-100 bg-opacity-20 hover:bg-gray-100 hover:bg-opacity-50 text-sm cursor-pointer group"
                                onClick={() =>
                                  toggleEmployeeDetail(
                                    `${row.id}-${employee.id}`
                                  )
                                }
                              >
                                <td className="py-2 pl-8 pr-4 whitespace-nowrap sticky left-0 z-10 bg-inherit flex items-center text-gray-800">
                                  <span className="mr-2">
                                    {expandedEmployeeDetails.includes(
                                      `${row.id}-${employee.id}`
                                    ) ? (
                                      <ChevronUpIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                                    ) : (
                                      <ChevronDownIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                                    )}
                                  </span>
                                  {employee.name}
                                </td>
                                <td className="py-2 px-4 text-left whitespace-nowrap text-gray-800">
                                  {employee.accountId || ""}
                                </td>
                                <td className="py-2 px-4 text-left whitespace-nowrap text-gray-800">
                                  {employee.orgId || ""}
                                </td>
                                <td className="py-2 px-4 text-left whitespace-nowrap text-gray-800">
                                  {employee.glcPlc || ""}
                                </td>
                                <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                  {formatValue(employee.hrlyRate)}
                                </td>
                                <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                  {formatValue(employee.cost)}
                                </td>
                                <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                  {formatValue(employee.priorYear || 0)}
                                </td>
                                {dynamicDateRanges.map((currentRange) => (
                                  <td
                                    key={`${employee.id}-${currentRange}-cost`}
                                    className="py-2 px-4 text-right whitespace-nowrap text-gray-800"
                                  >
                                    {formatValue(
                                      employee.monthlyCost[currentRange] || 0
                                    )}
                                  </td>
                                ))}
                              </tr>

                              {expandedEmployeeDetails.includes(
                                `${row.id}-${employee.id}`
                              ) && (
                                <tr
                                  key={`${employee.id}-hours-detail-row`}
                                  className="bg-gray-100 bg-opacity-30 hover:bg-gray-100 hover:bg-opacity-60 text-xs"
                                >
                                  <td className="py-2 pl-16 pr-4 whitespace-nowrap sticky left-0 z-10 bg-inherit italic text-gray-700">
                                    --- Employee Hours
                                  </td>
                                  <td className="py-2 px-4 text-left whitespace-nowrap"></td>
                                  <td className="py-2 px-4 text-left whitespace-nowrap"></td>
                                  <td className="py-2 px-4 text-left whitespace-nowrap"></td>
                                  <td className="py-2 px-4 text-right whitespace-nowrap"></td>
                                  <td className="py-2 px-4 text-right whitespace-nowrap text-gray-700">
                                    {formatValue(
                                      Object.values(
                                        employee.monthlyHours
                                      ).reduce((sum, val) => sum + val, 0)
                                    )}
                                  </td>
                                    <td className="py-2 px-4 text-right whitespace-nowrap text-gray-700">
                                      {formatValue(employee.priorYear || 0)}
                                    </td>
                                  {dynamicDateRanges.map((currentRange) => (
                                    <td
                                      key={`${employee.id}-hours-${currentRange}-amount`}
                                      className="py-2 px-4 text-right whitespace-nowrap text-gray-700"
                                    >
                                      {formatValue(
                                        employee.monthlyHours[currentRange] ||
                                          0,
                                        true
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              )}

                              {expandedEmployeeDetails.includes(
                                `${row.id}-${employee.id}`
                              ) &&
                                Object.keys(employee.detailSummary).length >
                                  0 && (
                                  <>
                                    {Object.keys(employee.detailSummary).map(
                                      (detailDescription) => {
                                        const detailTotal = Object.values(
                                          employee.detailSummary[
                                            detailDescription
                                          ]
                                        ).reduce((sum, val) => sum + val, 0);

                                        return (
                                          <tr
                                            key={`${employee.id}-${detailDescription}-detail-row`}
                                            className="bg-gray-100 bg-opacity-30 hover:bg-gray-100 hover:bg-opacity-60 text-xs"
                                          >
                                            <td className="py-2 pl-16 pr-4 whitespace-nowrap sticky left-0 z-10 bg-inherit italic text-gray-700">
                                              --- {detailDescription}
                                            </td>
                                            <td className="py-2 px-4 text-left whitespace-nowrap text-gray-700">
                                              {employee.accountId || ""}
                                            </td>
                                            <td className="py-2 px-4 text-left whitespace-nowrap"></td>
                                            <td className="py-2 px-4 text-left whitespace-nowrap"></td>
                                            <td className="py-2 px-4 text-right whitespace-nowrap"></td>
                                            <td className="py-2 px-4 text-right whitespace-nowrap text-gray-700">
                                              {formatValue(detailTotal)}
                                            </td>
                                              <td className="py-2 px-4 text-right whitespace-nowrap text-gray-700">
                                                {formatValue(0)}
                                              </td>
                                            {dynamicDateRanges.map(
                                              (currentRange) => (
                                                <td
                                                  key={`${employee.id}-${detailDescription}-${currentRange}-amount`}
                                                  className="py-2 px-4 text-right whitespace-nowrap text-gray-700"
                                                >
                                                  {formatValue(
                                                    employee.detailSummary[
                                                      detailDescription
                                                    ][currentRange] || 0
                                                  )}
                                                </td>
                                              )
                                            )}
                                          </tr>
                                        );
                                      }
                                    )}
                                  </>
                                )}
                            </React.Fragment>
                          ))}
                        </>
                      )}

                    {row.type === "expandable" &&
                      row.id.startsWith("non-labor-staff-cost") &&
                      expandedNonLaborAcctRows.includes(row.id) &&
                      row.nonLaborAccts &&
                      row.nonLaborAccts.length > 0 && (
                        <>
                          {row.nonLaborAccts.map((acctGroup) => (
                            <React.Fragment key={`${row.id}-${acctGroup.id}`}>
                              <tr
                                className="bg-gray-100 bg-opacity-20 hover:bg-gray-100 hover:bg-opacity-50 text-sm cursor-pointer group"
                                onClick={() =>
                                  toggleNonLaborAcctRow(
                                    `${row.id}-${acctGroup.id}`
                                  )
                                }
                              >
                                <td className="py-2 pl-8 pr-4 whitespace-nowrap sticky left-0 z-10 bg-inherit flex items-center text-gray-800">
                                  <span className="mr-2">
                                    {expandedNonLaborAcctRows.includes(
                                      `${row.id}-${acctGroup.id}`
                                    ) ? (
                                      <ChevronUpIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                                    ) : (
                                      <ChevronDownIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                                    )}
                                  </span>
                                  {acctGroup.description}
                                </td>
                                <td className="py-2 px-4 text-left whitespace-nowrap text-gray-800">
                                  {acctGroup.id || ""}
                                </td>
                                <td className="py-2 px-4 text-left whitespace-nowrap text-gray-800">
                                  {acctGroup.orgId || ""}
                                </td>
                                <td className="py-2 px-4 text-left whitespace-nowrap text-gray-800">
                                  {acctGroup.glcPlc || ""}
                                </td>
                                <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800"></td>
                                <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                  {formatValue(acctGroup.total)}
                                </td>
                                  <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800">
                                    {formatValue(acctGroup.priorYear || 0)}
                                  </td>
                                {dynamicDateRanges.map((currentRange) => (
                                  <td
                                    key={`${acctGroup.id}-${currentRange}-cost`}
                                    className="py-2 px-4 text-right whitespace-nowrap text-gray-800"
                                  >
                                    {formatValue(
                                      acctGroup.monthlyData[currentRange] || 0
                                    )}
                                  </td>
                                ))}
                              </tr>

                              {expandedNonLaborAcctRows.includes(
                                `${row.id}-${acctGroup.id}`
                              ) &&
                                acctGroup.employees &&
                                acctGroup.employees.length > 0 && (
                                  <React.Fragment>
                                    <tr className="bg-gray-100 bg-opacity-30">
                                      <td className="py-2 pl-16 pr-4 text-left text-sm font-semibold text-gray-700 uppercase sticky left-0 z-10 bg-inherit">
                                        Employee
                                      </td>
                                      <td
                                        className="py-2 px-4 text-left whitespace-nowrap"
                                        colSpan="4"
                                      ></td>
                                      <td className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase"></td>
                                      {dynamicDateRanges.map((range) => (
                                        <td
                                          key={`header-employee-group-${range}`}
                                          className="py-2 px-4 text-right text-sm font-semibold text-gray-700 uppercase whitespace-nowrap"
                                        ></td>
                                      ))}
                                    </tr>
                                    {acctGroup.employees.map(
                                      (employeeGroup) => (
                                        <tr
                                          key={`${acctGroup.id}-${employeeGroup.id}`}
                                          className="bg-gray-100 bg-opacity-40 hover:bg-gray-100 hover:bg-opacity-70 text-xs"
                                        >
                                          <td className="py-2 pl-16 pr-4 whitespace-nowrap sticky left-0 z-10 bg-inherit flex items-center text-gray-800">
                                            {employeeGroup.name}
                                          </td>
                                          <td
                                            className="py-2 px-4 text-left whitespace-nowrap"
                                            colSpan="4"
                                          ></td>
                                          <td className="py-2 px-4 text-right whitespace-nowrap text-gray-800 font-semibold">
                                            {formatValue(employeeGroup.total)}
                                          </td>
                                          {dynamicDateRanges.map(
                                            (currentRange) => (
                                              <td
                                                key={`${employeeGroup.id}-${currentRange}-monthly-total`}
                                                className="py-2 px-4 text-right whitespace-nowrap text-gray-800"
                                              >
                                                {formatValue(
                                                  employeeGroup.monthlyData[
                                                    currentRange
                                                  ] || 0
                                                )}
                                              </td>
                                            )
                                          )}
                                        </tr>
                                      )
                                    )}
                                  </React.Fragment>
                                )}
                            </React.Fragment>
                          ))}
                        </>
                      )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalysisByPeriodContent;
