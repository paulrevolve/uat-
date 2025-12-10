import React, { useEffect, useState } from "react";
import { backendUrl } from "./config";

const DIRECT_COST_COLUMNS = [
  { key: "line", label: "Line" },
  { key: "hideRow", label: "Hide Row" },
  { key: "amountsType", label: "Amounts Type" },
  { key: "idType", label: "ID Type" },
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "explanation", label: "Explanation" },
  { key: "acctId", label: "Acct ID" },
  { key: "orgId", label: "Org ID" },
  { key: "glcPlc", label: "GLC/PLC" },
  { key: "isRev", label: "Rev" },
  { key: "isBrd", label: "Brd" },
  { key: "total", label: "Total" },
];

const ProjectDirectCostTable = ({ plan, status, plType }) => {
  const [rows, setRows] = useState([]);
  const [hiddenRows, setHiddenRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isEditable = status === "Working";

  useEffect(() => {
    if (!plan) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);

    
    setTimeout(() => {
      setRows([
        {
          line: 1,
          hideRow: false,
          amountsType: plType || "N/A",
          idType: "Employee",
          id: "E123",
          name: "John Doe",
          explanation: "Project work",
          acctId: "A001",
          orgId: "ORG1",
          glcPlc: "GLC1",
          isRev: true,
          isBrd: false,
          total: "1000",
        },
      ]);
      setLoading(false);
    }, 500);
  }, [plan, plType]);

  return (
    <div className="font-inter">
      <div className="overflow-x-auto">
        <table className="min-w-max text-sm text-left border-collapse border border-gray-300 bg-white rounded-lg">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              {DIRECT_COST_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="py-2 px-3 border border-gray-200 font-medium text-xs text-gray-900 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={DIRECT_COST_COLUMNS.length}
                  className="p-4 text-center text-gray-500 text-sm"
                >
                  Loading direct cost data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={DIRECT_COST_COLUMNS.length}
                  className="p-4 text-center text-red-600 text-sm"
                >
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={DIRECT_COST_COLUMNS.length}
                  className="p-4 text-center text-gray-400 text-sm"
                >
                  No direct cost data found for this plan.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="even:bg-gray-50 whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200"
                >
                  {DIRECT_COST_COLUMNS.map((col) => {
                    if (col.key === "hideRow") {
                      return (
                        <td
                          key={col.key}
                          className="py-2 px-3 border-r border-gray-200 text-center"
                        >
                          <input
                            type="checkbox"
                            checked={!!hiddenRows[idx]}
                            onChange={() =>
                              setHiddenRows((prev) => ({
                                ...prev,
                                [idx]: !prev[idx],
                              }))
                            }
                            className={`cursor-pointer ${
                              !isEditable ? "cursor-not-allowed opacity-50" : ""
                            }`}
                            disabled={!isEditable}
                          />
                        </td>
                      );
                    }
                    if (col.key === "isRev" || col.key === "isBrd") {
                      return (
                        <td
                          key={col.key}
                          className="py-2 px-3 border-r border-gray-200 text-center text-sm text-gray-700"
                        >
                          {row[col.key] ? (
                            <span className="text-green-600 font-medium text-xl">
                              ✓
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={col.key}
                        className="py-2 px-3 border-r border-gray-200 text-sm text-gray-700"
                      >
                        {row[col.key]}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectDirectCostTable;