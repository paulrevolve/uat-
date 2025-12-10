import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify"; // Assuming react-toastify is available
import { backendUrl } from "./config";

const columnLabels = {
  emplId: "Employee ID",
  totalForecastedHours: "Forecasted Hours",
  perHourRate: "Per Hour Rate",
  totalForecastedCost: "Forecasted Cost",
  burdenCost: "Burden Cost (Total + Burden)",
  tnmRevenue: "T&M Revenue",
  cpffRevenue: "CPFF Revenue",
  plcCode: "PLC Code",
};

const ROW_HEIGHT_PX = "64px";

const formatCurrency = (value) => {
  if (value == null || value === "") return "N/A";
  const numValue = Number(value);
  if (isNaN(numValue)) return "N/A";
  return numValue.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Helper to create an empty row for new entries
const emptyRevenueAnalysisRow = () => ({
  emplId: "",
  totalForecastedHours: "",
  perHourRate: "",
  totalForecastedCost: "",
  burdenCost: "",
  tnmRevenue: "",
  cpffRevenue: "",
  plcCode: "",
  isSelected: false, // For the toggle feature
});

const ProjectRevenueAnalysisTable = ({ planId, style, onClose }) => {
  const [data, setData] = useState(null); // Keep original fetched data for reference if needed
  const [rows, setRows] = useState([]); // This will be our editable/displayable rows
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingRowIndex, setEditingRowIndex] = useState(null); // Index of the row being edited, or rows.length for new
  const [inputRow, setInputRow] = useState(emptyRevenueAnalysisRow()); // State for the row being edited/added
  const [selectedRows, setSelectedRows] = useState(new Set()); // For toggle feature

  useEffect(() => {
    if (!planId) {
      setData(null);
      setRows([]); // Clear rows if no planId
      setLoading(false);
      setError(null);
      setEditingRowIndex(null);
      setInputRow(emptyRevenueAnalysisRow());
      setSelectedRows(new Set());
      return;
    }

    setLoading(true);
    setError(null);
    axios
      .get(
        `${backendUrl}/Forecast/CalculateCost?planID=${planId}&templateId=1&type=TARGET`
      )
      .then((res) => {
        const correctedData = {
          ...res.data,
          totalBurdenCost: res.data.totalBurdenCost ?? 0,
          employeeForecastSummary:
            res.data.employeeForecastSummary?.map((row) => ({
              ...row,
              burdenCost: row.totalBurdonCost ?? row.burdonCost ?? row.burdenCost ?? 0,
              isSelected: false, // Add isSelected for existing rows
            })) || [],
        };
        setData(correctedData);
        // Populate rows with fetched data, making them editable if an action triggers it
        setRows(correctedData.employeeForecastSummary);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch revenue analysis data");
        setLoading(false);
        setRows([]); // Ensure rows are cleared on error
      });
  }, [planId]);

  // Calculate totals from the 'rows' state
  const totals = rows.reduce(
    (acc, row) => {
      acc.totalForecastedCost += Number(row.totalForecastedCost) || 0;
      acc.burdenCost += Number(row.burdenCost) || 0;
      acc.tnmRevenue += Number(row.tnmRevenue) || 0;
      acc.cpffRevenue += Number(row.cpffRevenue) || 0;
      return acc;
    },
    {
      totalForecastedCost: 0,
      burdenCost: 0,
      tnmRevenue: 0,
      cpffRevenue: 0,
    }
  );

  const handleNew = () => {
    if (editingRowIndex !== null) {
      toast.warn("Please save or close the current edit before adding a new row.");
      return;
    }
    setInputRow(emptyRevenueAnalysisRow());
    setEditingRowIndex(rows.length); // Set index to a new row at the end to indicate adding
    setSelectedRows(new Set()); // Clear selection when adding/editing
  };

  const handleSave = () => {
    if (editingRowIndex === null) {
      toast.error("No row is being edited or added.");
      return;
    }

    // Basic validation (can be expanded)
    if (!inputRow.emplId) {
      toast.error("Employee ID is required.");
      return;
    }

    setRows((prev) => {
      const updated = [...prev];
      if (editingRowIndex < prev.length) {
        // Editing existing row
        updated[editingRowIndex] = { ...inputRow, isSelected: false }; // Ensure no carry-over selected state
      } else {
        // Adding new row
        updated.push({ ...inputRow, isSelected: false });
      }
      return updated;
    });

    setEditingRowIndex(null); // Exit edit mode
    setInputRow(emptyRevenueAnalysisRow()); // Clear input fields
    setSelectedRows(new Set()); // Clear selection
    toast.success("Revenue analysis data saved locally!"); // This is a local save
    // In a real app, you would make an API call here to persist the data:
    // axios.post('/api/revenue-analysis-line', inputRow).then(...).catch(...)
  };

  const handleCloseEditMode = () => {
    setEditingRowIndex(null); // Exit edit mode
    setInputRow(emptyRevenueAnalysisRow()); // Clear input fields
    setSelectedRows(new Set()); // Clear selection
    toast.info("Edit mode closed. Changes discarded.");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputRow((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRowClick = (index) => {
    if (editingRowIndex !== null && editingRowIndex !== index) {
      toast.warn("Please save or close the current edit before editing another row.");
      return;
    }
    if (editingRowIndex === index) { // Clicked on the currently editing row
      // Do nothing or allow continued editing
      return;
    }
    // Set for editing
    setEditingRowIndex(index);
    setInputRow({ ...rows[index] }); // Load data into inputRow for editing
    setSelectedRows(new Set()); // Clear selection when starting edit
  };

  const handleSelectRow = (index) => {
    setSelectedRows((prev) => {
      const newSelected = new Set(prev);
      const rowId = rows[index].emplId || `row-${index}`; // Use emplId or unique index as ID
      if (newSelected.has(rowId)) {
        newSelected.delete(rowId);
      } else {
        newSelected.add(rowId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allRowIds = new Set(rows.map((row, idx) => row.emplId || `row-${idx}`));
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const isAllSelected = rows.length > 0 && selectedRows.size === rows.length;

  const renderTableContent = () => {
    if (!planId) {
      return (
        <tr style={{ height: ROW_HEIGHT_PX }}>
          <td colSpan={Object.keys(columnLabels).length + 1} className="p-2 text-center text-gray-500">
            Select a plan to view or add revenue analysis.
          </td>
        </tr>
      );
    }
    if (loading) {
      return (
        <tr style={{ height: ROW_HEIGHT_PX }}>
          <td colSpan={Object.keys(columnLabels).length + 1} className="p-2 text-center text-gray-500">
            Loading Revenue Analysis...
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr style={{ height: ROW_HEIGHT_PX }}>
          <td colSpan={Object.keys(columnLabels).length + 1} className="p-2 text-center text-red-600">
            {error}
          </td>
        </tr>
      );
    }
    if (rows.length === 0 && editingRowIndex === null) {
      return (
        <tr style={{ height: ROW_HEIGHT_PX }}>
          <td colSpan={Object.keys(columnLabels).length + 1} className="p-2 text-center text-gray-500">
            No Revenue Analysis data found. Click "New" to add a row.
          </td>
        </tr>
      );
    }

    return (
      <>
        {rows.map((row, idx) => {
          const isEditing = editingRowIndex === idx;
          const rowId = row.emplId || `row-${idx}`;
          const isSelected = selectedRows.has(rowId);
          return (
            <tr
              key={rowId}
              className={`even:bg-gray-50 transition border-b border-gray-200 ${
                isEditing ? "bg-yellow-50" : "hover:bg-blue-50"
              } ${isSelected ? "bg-blue-100" : ""}`}
              style={{ height: ROW_HEIGHT_PX, boxSizing: "border-box", lineHeight: "normal" }}
            >
              <td className="p-2 border-r border-gray-200 text-xs text-gray-700 text-center">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectRow(idx)}
                  className="accent-blue-600"
                  style={{ width: 14, height: 14 }}
                  disabled={editingRowIndex !== null} // Disable selection while editing
                />
              </td>
              {Object.keys(columnLabels).map((colKey) => (
                <td
                  key={colKey}
                  className="p-2 border-r border-gray-200 text-xs text-gray-700"
                  style={{ boxSizing: "border-box", lineHeight: "normal" }}
                  onClick={() => !isEditing && handleRowClick(idx)} // Click to edit only if not already editing
                >
                  {isEditing ? (
                    <input
                      type={
                        ["totalForecastedHours", "perHourRate", "totalForecastedCost", "burdenCost", "tnmRevenue", "cpffRevenue"].includes(colKey)
                          ? "number" // Use number type for numerical fields
                          : "text"
                      }
                      name={colKey}
                      value={inputRow[colKey] || ""}
                      onChange={handleInputChange}
                      className="border border-gray-300 rounded px-1 py-0.5 w-full text-[11px] outline-none"
                    />
                  ) : colKey.includes("Revenue") || colKey.includes("Cost") || colKey.includes("Rate") ? (
                    formatCurrency(row[colKey])
                  ) : (
                    row[colKey] || "N/A"
                  )}
                </td>
              ))}
            </tr>
          );
        })}
        {editingRowIndex === rows.length && ( // New row being added
          <tr
            className="even:bg-gray-50 transition border-b border-gray-200 bg-yellow-50"
            style={{ height: ROW_HEIGHT_PX, boxSizing: "border-box", lineHeight: "normal" }}
          >
            <td className="p-2 border-r border-gray-200 text-xs text-gray-700 text-center">
                <input type="checkbox" disabled className="accent-gray-300" style={{ width: 14, height: 14 }}/>
            </td>
            {Object.keys(columnLabels).map((colKey) => (
              <td
                key={colKey}
                className="p-2 border-r border-gray-200 text-xs text-gray-700"
                style={{ boxSizing: "border-box", lineHeight: "normal" }}
              >
                <input
                  type={
                    ["totalForecastedHours", "perHourRate", "totalForecastedCost", "burdenCost", "tnmRevenue", "cpffRevenue"].includes(colKey)
                      ? "number"
                      : "text"
                  }
                  name={colKey}
                  value={inputRow[colKey] || ""}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-1 py-0.5 w-full text-[11px] outline-none"
                  placeholder={columnLabels[colKey]}
                />
              </td>
            ))}
          </tr>
        )}
        <tr className="bg-yellow-100 font-semibold" style={{ height: ROW_HEIGHT_PX, boxSizing: "border-box", lineHeight: "normal" }}>
          <td className="py-2 px-3 border-r border-gray-200 text-sm text-gray-800"></td> {/* For checkbox column */}
          <td
            className="py-2 px-3 border-r border-gray-200 text-sm text-gray-800"
            colSpan={3}
            style={{ boxSizing: "border-box", lineHeight: "normal" }}
          >
            Total
          </td>
          <td
            className="py-2 px-3 border-r border-gray-200 text-sm text-gray-800 text-right"
            style={{ boxSizing: "border-box", lineHeight: "normal" }}
          >
            {formatCurrency(totals.totalForecastedCost)}
          </td>
          <td
            className="py-2 px-3 border-r border-gray-200 text-sm text-gray-800 text-right"
            style={{ boxSizing: "border-box", lineHeight: "normal" }}
          >
            {formatCurrency(totals.burdenCost)}
          </td>
          <td
            className="py-2 px-3 border-r border-gray-200 text-sm text-gray-800 text-right"
            style={{ boxSizing: "border-box", lineHeight: "normal" }}
          >
            {formatCurrency(totals.tnmRevenue)}
          </td>
          <td
            className="py-2 px-3 border-r border-gray-200 text-sm text-gray-800 text-right"
            style={{ boxSizing: "border-box", lineHeight: "normal" }}
          >
            {formatCurrency(totals.cpffRevenue)}
          </td>
          <td
            className="py-2 px-3 border-r border-gray-200 text-sm text-gray-800"
            style={{ boxSizing: "border-box", lineHeight: "normal" }}
          ></td>
        </tr>
      </>
    );
  };

  return (
    <div className="p-4 font-inter">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xs font-normal text-gray-800">
          Revenue Analysis
        </h2>
        {/* Buttons for New, Save, Close (editing mode) */}
        <div className="flex space-x-2">
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded text-[11px] sm:text-xs hover:bg-blue-700 transition"
            onClick={handleNew}
            type="button"
            disabled={editingRowIndex !== null || !planId} // Disable if already editing or no plan selected
          >
            New
          </button>
          <button
            className="bg-green-600 text-white px-3 py-1 rounded text-[11px] sm:text-xs hover:bg-green-700 transition"
            onClick={handleSave}
            type="button"
            disabled={editingRowIndex === null} // Disable save if not editing/adding
          >
            Save
          </button>
          {editingRowIndex !== null && ( // Close button only when in new/edit mode
            <button
              className="bg-red-600 text-white px-3 py-1 rounded text-[11px] sm:text-xs hover:bg-red-700 transition"
              onClick={handleCloseEditMode}
              type="button"
            >
              Close
            </button>
          )}
          {/* This close button is for closing the entire tab, if needed by parent */}
          {planId && editingRowIndex === null && (
             <button
              onClick={onClose}
              className="bg-gray-500 text-white px-3 py-1 rounded text-[11px] sm:text-xs hover:bg-gray-600 transition"
            >
              Close Tab
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto" style={style}>
        <table className="min-w-full text-xs text-left border-collapse border border-gray-300 bg-white rounded-lg">
          <thead className="bg-blue-100 text-gray-700">
            <tr style={{ height: ROW_HEIGHT_PX, lineHeight: "normal" }}>
              <th
                className="p-2 border border-gray-200 font-normal text-xs text-gray-900 whitespace-nowrap text-center"
                style={{ width: "40px", boxSizing: "border-box", lineHeight: "normal" }}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="accent-blue-600"
                  style={{ width: 14, height: 14 }}
                  disabled={editingRowIndex !== null || rows.length === 0} // Disable select all while editing or no rows
                />
              </th>
              {Object.keys(columnLabels).map((col) => (
                <th
                  key={col}
                  className="p-2 border border-gray-200 font-normal text-xs text-gray-900 whitespace-nowrap"
                  style={{ boxSizing: "border-box", lineHeight: "normal" }}
                >
                  {columnLabels[col]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderTableContent()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectRevenueAnalysisTable;