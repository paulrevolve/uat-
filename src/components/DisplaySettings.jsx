import React, { useState, useEffect, useCallback } from "react";
import { backendUrl } from "./config";

const DisplaySettingsContent = () => {
  // Existing states for the fields in the Display Settings form
  const [budgetHeaderDateFormat, setBudgetHeaderDateFormat] = useState(""); // Default to empty for "Select"
  const [reportVarianceCalculation, setReportVarianceCalculation] =
    useState(""); // Default to empty for "Select"

  // NEW states for additional fields from the image
  const [reportHeaderDateFormatOrg, setReportHeaderDateFormatOrg] =
    useState("01/3109");
  const [reportHeaderDateFormatProject, setReportHeaderDateFormatProject] =
    useState("JAN-09");
  const [dropdownListDateFormat, setDropdownListDateFormat] =
    useState("01/3109");
  const [reportPrecisionDollar, setReportPrecisionDollar] = useState("2");
  const [reportPrecisionHour, setReportPrecisionHour] = useState("1");
  const [reportPrecisionPercent, setReportPrecisionPercent] = useState("2");
  const [poLagDays, setPoLagDays] = useState("3");
  const [financialStatementCode, setFinancialStatementCode] =
    useState("INDSTM");

  // NEW states for checkboxes
  const [includeInactiveOrganizations, setIncludeInactiveOrganizations] =
    useState(false);
  const [includeInactiveVendors, setIncludeInactiveVendors] = useState(false);
  const [includeEmployeeVendors, setIncludeEmployeeVendors] = useState(false);
  const [includeVendorEmployees, setIncludeVendorEmployees] = useState(false);
  const [includeCostOfMoneyRevenueFee, setIncludeCostOfMoneyRevenueFee] =
    useState(false);
  const [displayDetailAccounts, setDisplayDetailAccounts] = useState(false);
  const [
    includePendingApprovedRequisitions,
    setIncludePendingApprovedRequisitions,
  ] = useState(false);
  const [includeUnreleasedBlanketPO, setIncludeUnreleasedBlanketPO] =
    useState(false);
  const [pendingChangesReportingMethod, setPendingChangesReportingMethod] =
    useState("Exclude From Total Cost");

  // Options for Budget Header Date Format dropdown (from previous iteration)
  const dateFormatOptions = [
    { label: "01/31/09", value: "1" },
    { label: "01/31/2009", value: "2" },
    { label: "01/01-01/31*09", value: "3" },
    { label: "FY09-1", value: "4" },
    { label: "FY09-1-2", value: "5" },
    { label: "01/31/09 (160/176)", value: "6" },
    { label: "01/31/2009 (160/176)", value: "7" },
    { label: "01/01-01/31*09 (160/176)", value: "8" },
    { label: "FY09-1 (160/176)", value: "9" },
    { label: "FY09-1-2 (80/88)", value: "10" },
    { label: "MMM-YY (xxx/xxx)", value: "11" },
    { label: "2009_1_2 (xxx/xxx)", value: "12" },
  ];

  // Options for Report Variance Calculation dropdown (from previous iteration)
  const varianceCalculationOptions = [
    { label: "Actuals", value: "Actuals" },
    { label: "Budgets", value: "Budgets" },
  ];

  // New dropdown options for Report Header Date Format - Project
  const projectDateFormatOptions = [
    { label: "JAN-09", value: "JAN-09" },
    { label: "FEB-09", value: "FEB-09" },
    { label: "MAR-09", value: "MAR-09" },
    { label: "APR-09", value: "APR-09" },
    // Add more options as needed based on actual requirements
  ];

  // New dropdown options for Drop-Down List Date Format
  const dropDownListDateFormatOptions = [
    { label: "01/3109", value: "01/3109" },
    { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
    { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
    // Add more options as needed
  ];

  // New dropdown options for Pending Changes Reporting Method
  const pendingChangesReportingMethodOptions = [
    { label: "Exclude From Total Cost", value: "Exclude From Total Cost" },
    { label: "Include In Total Cost", value: "Include In Total Cost" },
    // Add more options as needed
  ];

  // Generic handler for numeric inputs that might contain decimals
  const handleNumericInput = (setter) => (e) => {
    const value = e.target.value;
    // Allows empty string, or numbers (integers/decimals)
    const regex = /^[0-9]*\.?[0-9]*$/;
    if (value === "" || regex.test(value)) {
      setter(value);
    }
  };

  // Handle saving Display Settings to an API
  const handleSaveSettings = useCallback(async () => {
    // console.log("Attempting to save Display Settings...");

    // Basic validation for required fields
    if (!budgetHeaderDateFormat) {
      alert("Please select a Budget Header Date Format.");
      return;
    }
    if (!reportVarianceCalculation) {
      alert("Please select a Report Variance Calculation option.");
      return;
    }
    if (!reportPrecisionPercent) {
      alert("Report Precision Percent is required.");
      return;
    }
    if (!poLagDays) {
      alert("PO Lag Days is required.");
      return;
    }
    if (!financialStatementCode) {
      alert("Financial Statement Code is required.");
      return;
    }

    // Placeholder API endpoint for saving Display Settings
    // You will need to replace this with your actual API endpoint.
    // api/Configuration/UpdateConfigValues
    const updateApiUrl = `${backendUrl}/api/Configuration/bulk-upsert`;

    const dataToSave = {
      budgetHeaderDateFormat: budgetHeaderDateFormat,
      reportVarianceCalculation: reportVarianceCalculation,
      reportHeaderDateFormatOrg: reportHeaderDateFormatOrg,
      reportHeaderDateFormatProject: reportHeaderDateFormatProject,
      dropdownListDateFormat: dropdownListDateFormat,
      reportPrecisionDollar: reportPrecisionDollar,
      reportPrecisionHour: reportPrecisionHour,
      reportPrecisionPercent: reportPrecisionPercent,
      poLagDays: poLagDays,
      financialStatementCode: financialStatementCode,
      includeInactiveOrganizations: includeInactiveOrganizations,
      includeInactiveVendors: includeInactiveVendors,
      includeEmployeeVendors: includeEmployeeVendors,
      includeVendorEmployees: includeVendorEmployees,
      includeCostOfMoneyRevenueFee: includeCostOfMoneyRevenueFee,
      displayDetailAccounts: displayDetailAccounts,
      includePendingApprovedRequisitions: includePendingApprovedRequisitions,
      includeUnreleasedBlanketPO: includeUnreleasedBlanketPO,
      pendingChangesReportingMethod: pendingChangesReportingMethod,
    };

    // console.log("Display Settings Data to Save:", dataToSave);

    try {
      const response = await fetch(updateApiUrl, {
        method: "PUT", // Or 'POST' or 'PATCH' as per your API
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Server error" }));
        throw new Error(
          `Failed to save settings: ${errorData.message || response.statusText}`
        );
      }

      const result = await response.json();
      // console.log('Display settings saved successfully:', result);
      alert("Display settings saved successfully!"); // Provide user feedback
    } catch (e) {
      // console.error("Error saving Display settings:", e);
      alert(`Error saving Display settings: ${e.message}`); // Provide user feedback
    }
  }, [
    budgetHeaderDateFormat,
    reportVarianceCalculation,
    reportHeaderDateFormatOrg,
    reportHeaderDateFormatProject,
    dropdownListDateFormat,
    reportPrecisionDollar,
    reportPrecisionHour,
    reportPrecisionPercent,
    poLagDays,
    financialStatementCode,
    includeInactiveOrganizations,
    includeInactiveVendors,
    includeEmployeeVendors,
    includeVendorEmployees,
    includeCostOfMoneyRevenueFee,
    displayDetailAccounts,
    includePendingApprovedRequisitions,
    includeUnreleasedBlanketPO,
    pendingChangesReportingMethod,
  ]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center p-4">
      {/* Changed max-w-5xl to w-full px-8 for wider display */}
      <div className="w-full px-8 bg-white border-line p-8 space-y-6  ">
        {/* Changed text-center to text-left */}
        <h2 className="w-full  bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
          Display Settings
        </h2>
        {/* Added bg-gray-50, p-4, rounded-lg, border, and border-gray-300 to the grid container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-4 border-line">
          {/* Left Column Fields */}
          <div className="space-y-4">
            {" "}
            {/* No changes to this inner div */}
            {/* Budget Header Date Format (Existing) */}
            <div>
              <label
                htmlFor="budgetHeaderDateFormat"
                className="block text-sm font-medium"
              >
                Budget Header Date Format{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="budgetHeaderDateFormat"
                value={budgetHeaderDateFormat}
                onChange={(e) => setBudgetHeaderDateFormat(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                {dateFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Report Header Date Format - Org (NEW) */}
            <div>
              <label
                htmlFor="reportHeaderDateFormatOrg"
                className="block text-sm font-medium"
              >
                Report Header Date Format - Org
              </label>
              <input
                id="reportHeaderDateFormatOrg"
                type="text"
                value={reportHeaderDateFormatOrg}
                onChange={(e) => setReportHeaderDateFormatOrg(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Report Header Date Format - Project (NEW) */}
            <div>
              <label
                htmlFor="reportHeaderDateFormatProject"
                className="block text-sm font-medium"
              >
                Report Header Date Format - Project
              </label>
              <select
                id="reportHeaderDateFormatProject"
                value={reportHeaderDateFormatProject}
                onChange={(e) =>
                  setReportHeaderDateFormatProject(e.target.value)
                }
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {projectDateFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Drop-Down List Date Format (NEW) */}
            <div>
              <label
                htmlFor="dropdownListDateFormat"
                className="block text-sm font-medium"
              >
                Drop-Down List Date Format
              </label>
              <select
                id="dropdownListDateFormat"
                value={dropdownListDateFormat}
                onChange={(e) => setDropdownListDateFormat(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {dropDownListDateFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Report Precision Dollar (NEW) */}
            <div>
              <label
                htmlFor="reportPrecisionDollar"
                className="block text-sm font-medium"
              >
                Report Precision Dollar
              </label>
              <input
                id="reportPrecisionDollar"
                type="text" // Using text to allow empty or partial numeric input
                value={reportPrecisionDollar}
                onChange={handleNumericInput(setReportPrecisionDollar)}
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Report Precision Hour (NEW) */}
            <div>
              <label
                htmlFor="reportPrecisionHour"
                className="block text-sm font-medium"
              >
                Report Precision Hour
              </label>
              <input
                id="reportPrecisionHour"
                type="text"
                value={reportPrecisionHour}
                onChange={handleNumericInput(setReportPrecisionHour)}
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Report Precision Percent (NEW) */}
            <div>
              <label
                htmlFor="reportPrecisionPercent"
                className="block text-sm font-medium"
              >
                Report Precision Percent <span className="text-red-500">*</span>
              </label>
              <input
                id="reportPrecisionPercent"
                type="text"
                value={reportPrecisionPercent}
                onChange={handleNumericInput(setReportPrecisionPercent)}
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* PO Lag Days (NEW) */}
            <div>
              <label htmlFor="poLagDays" className="block text-sm font-medium">
                PO Lag Days <span className="text-red-500">*</span>
              </label>
              <input
                id="poLagDays"
                type="text"
                value={poLagDays}
                onChange={handleNumericInput(setPoLagDays)}
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Financial Statement Code (NEW) */}
            <div>
              <label
                htmlFor="financialStatementCode"
                className="block text-sm font-medium"
              >
                Financial Statement Code <span className="text-red-500">*</span>
              </label>
              <input
                id="financialStatementCode"
                type="text"
                value={financialStatementCode}
                onChange={(e) => setFinancialStatementCode(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Report Variance Calculation in favor of (Existing) */}
            <div>
              <label
                htmlFor="reportVarianceCalculation"
                className="block text-sm font-medium"
              >
                Report Variance Calculation in favor of{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="reportVarianceCalculation"
                value={reportVarianceCalculation}
                onChange={(e) => setReportVarianceCalculation(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                {varianceCalculationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column Checkboxes and other fields */}
          <div className="space-y-4 md:mt-0">
            {" "}
            {/* No changes to this inner div */}
            {/* Checkboxes */}
            <div className="flex items-center space-x-2">
              <input
                id="includeInactiveOrganizations"
                type="checkbox"
                checked={includeInactiveOrganizations}
                onChange={(e) =>
                  setIncludeInactiveOrganizations(e.target.checked)
                }
                className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label
                htmlFor="includeInactiveOrganizations"
                className="text-sm font-medium"
              >
                Include Inactive Organizations in Lookups and dropdown lists
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="includeInactiveVendors"
                type="checkbox"
                checked={includeInactiveVendors}
                onChange={(e) => setIncludeInactiveVendors(e.target.checked)}
                className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label
                htmlFor="includeInactiveVendors"
                className="text-sm font-medium"
              >
                Include Inactive Vendors in Lookups and dropdown lists
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="includeEmployeeVendors"
                type="checkbox"
                checked={includeEmployeeVendors}
                onChange={(e) => setIncludeEmployeeVendors(e.target.checked)}
                className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label
                htmlFor="includeEmployeeVendors"
                className="text-sm font-medium"
              >
                Include Employee Vendors in Vendor Lookups and dropdown lists
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="includeVendorEmployees"
                type="checkbox"
                checked={includeVendorEmployees}
                onChange={(e) => setIncludeVendorEmployees(e.target.checked)}
                className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label
                htmlFor="includeVendorEmployees"
                className="text-sm font-medium"
              >
                Include Vendor Employees in Vendor Lookups and dropdown lists
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="includeCostOfMoneyRevenueFee"
                type="checkbox"
                checked={includeCostOfMoneyRevenueFee}
                onChange={(e) =>
                  setIncludeCostOfMoneyRevenueFee(e.target.checked)
                }
                className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label
                htmlFor="includeCostOfMoneyRevenueFee"
                className="text-sm font-medium"
              >
                Include Cost of Money Revenue Fee
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="displayDetailAccounts"
                type="checkbox"
                checked={displayDetailAccounts}
                onChange={(e) => setDisplayDetailAccounts(e.target.checked)}
                className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label
                htmlFor="displayDetailAccounts"
                className="text-sm font-medium"
              >
                Display Detail Accounts in Active Level Reports and PSR
              </label>
            </div>
            {/* Pending section */}
            <div className="mt-4">
              <span className="block text-sm font-semibold mb-2">Pending</span>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  id="includePendingApprovedRequisitions"
                  type="checkbox"
                  checked={includePendingApprovedRequisitions}
                  onChange={(e) =>
                    setIncludePendingApprovedRequisitions(e.target.checked)
                  }
                  className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label
                  htmlFor="includePendingApprovedRequisitions"
                  className="text-sm font-medium"
                >
                  Include Pending/Approved Requisitions
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="includeUnreleasedBlanketPO"
                  type="checkbox"
                  checked={includeUnreleasedBlanketPO}
                  onChange={(e) =>
                    setIncludeUnreleasedBlanketPO(e.target.checked)
                  }
                  className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label
                  htmlFor="includeUnreleasedBlanketPO"
                  className="text-sm font-medium"
                >
                  Include Unreleased Blanket PO Amount in Pending
                </label>
              </div>
            </div>
            {/* Pending Changes Reporting Method (NEW) */}
            <div>
              <label
                htmlFor="pendingChangesReportingMethod"
                className="block text-sm font-medium"
              >
                Pending Changes Reporting Method
              </label>
              <select
                id="pendingChangesReportingMethod"
                value={pendingChangesReportingMethod}
                onChange={(e) =>
                  setPendingChangesReportingMethod(e.target.value)
                }
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {pendingChangesReportingMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit button for this standalone form */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisplaySettingsContent;
