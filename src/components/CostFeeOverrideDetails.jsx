import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaSave, FaTimes, FaEdit } from "react-icons/fa";
import { backendUrl } from "./config"; // replace with your backend URL

const CostFeeOverrideDetails = ({
  projectId,
  isSearched,
  updatedBy = "System",
}) => {
  const [overrides, setOverrides] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRow, setNewRow] = useState({
    costCeiling: "",
    feeCeiling: "",
    totalValueCeiling: "",
    ceilingCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchedProjectId, setLastSearchedProjectId] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const applyToRBAOptions = [
    { value: "", label: "Select" },
    { value: "R", label: "Revenue" },
    { value: "B", label: "Billing" },
    { value: "A", label: "All" },
    { value: "N", label: "None" },
  ];

  const isValidProjectId = (id) => !!id;

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isSearched && isValidProjectId(projectId)) {
        setIsLoading(true);
        try {
          const response = await axios.get(
            `${backendUrl}/Project/GetAllCeilingAmtForTotalProjectCost`,
            { params: { projId: projectId } }
          );
          if (isMounted) {
            setOverrides(response.data?.data || []);
            setLastSearchedProjectId(projectId);
            setHasSearched(true);
          }
        } catch (error) {
          if (isMounted) {
            setOverrides([]);
            toast.error("Failed to fetch cost fee override details ");
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
            setShowNewRow(false);
          }
        }
      } else if (isMounted) {
        setOverrides([]);
        setIsLoading(false);
        setShowNewRow(false);
        setLastSearchedProjectId("");
        setHasSearched(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [isSearched, projectId]);

  const shouldShowTable =
    hasSearched && isValidProjectId(lastSearchedProjectId);

  const handleNewClick = () => {
    if (!shouldShowTable) {
      toast.warning("Please search for a valid project first.");
      return;
    }
    setShowNewRow(true);
    setNewRow({
      costCeiling: "",
      feeCeiling: "",
      totalValueCeiling: "",
      ceilingCode: "",
    });
  };

  const handleSave = async () => {
    if (!newRow.costCeiling || !newRow.feeCeiling) {
      toast.warning("Please fill required fields.");
      return;
    }

    try {
      await axios.post(
        `${backendUrl}/Project/CreateCeilingAmtForTotalProjectCost`,
        { projectId, ...newRow },
        { params: { updatedBy } }
      );
      toast.success("Saved successfully ");

      const response = await axios.get(
        `${backendUrl}/Project/GetAllCeilingAmtForTotalProjectCost`,
        { params: { projId: lastSearchedProjectId } }
      );
      setOverrides(response.data?.data || []);
      setShowNewRow(false);
    } catch (error) {
      toast.error("Failed to save ");
    }
  };

  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditRow({ ...overrides[index] });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditRow((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (index) => {
    try {
      await axios.put(
        `${backendUrl}/Project/UpdateCeilingAmtForTotalProjectCost`,
        { ...editRow, projectId: lastSearchedProjectId },
        { params: { updatedBy } }
      );
      toast.success("Updated successfully ");

      const response = await axios.get(
        `${backendUrl}/Project/GetAllCeilingAmtForTotalProjectCost`,
        { params: { projId: lastSearchedProjectId } }
      );
      setOverrides(response.data?.data || []);
      setEditIndex(null);
      setEditRow({});
    } catch (error) {
      toast.error("Error updating record ");
    }
  };

  const handleDelete = async (index) => {
    const row = overrides[index];
    if (!row) return;

    try {
      await axios.delete(
        `${backendUrl}/Project/DeleteCeilingAmtForTotalProjectCostAsync/${row.projectId}`
      );
      setOverrides((prev) => prev.filter((_, i) => i !== index));
      toast.success("Deleted successfully 🗑️");
    } catch (error) {
      toast.error("Error deleting record ");
    }
  };

  const handleCancelNewRow = () => {
    setShowNewRow(false);
    setNewRow({
      costCeiling: "",
      feeCeiling: "",
      totalValueCeiling: "",
      ceilingCode: "",
    });
    toast.info("New row canceled.");
  };

  return (
    <div className="animate-fade-in">
      <ToastContainer />
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-md">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Cost Fee Overrides
          </h2>
          <div className="flex items-center mb-2">
            <label className="text-sm font-medium text-gray-700 mr-2">
              Project:
            </label>
            <span className="text-sm text-gray-900">
              {lastSearchedProjectId}
            </span>
          </div>
          <button
            className="mb-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
            onClick={handleNewClick}
          >
            New
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : overrides.length === 0 && !showNewRow ? (
          <p className="text-gray-600">
            No data available for this project ID.
          </p>
        ) : (
          <div className="overflow-x-auto border-line">
            <table className="w-full table">
              <thead className="thead">
                <tr>
                  {/* <th className="th-thead">
                    Project ID
                  </th> */}
                  <th className="th-thead">Cost Ceiling</th>
                  <th className="th-thead">Fee Ceiling</th>
                  <th className="th-thead">Total Value Ceiling</th>
                  <th className="th-thead">Ceiling Code</th>
                  <th className="th-thead">Action</th>
                </tr>
              </thead>
              <tbody className="tbody">
                {showNewRow && (
                  <tr className="bg-white border-b border-gray-200 hover:bg-gray-50">
                    {/* <td className="px-2 py-1 text-xs">
                      {lastSearchedProjectId}
                    </td> */}
                    <td className="tbody-td">
                      <input
                        type="number"
                        value={newRow.costCeiling}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            costCeiling: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                      />
                    </td>
                    <td className="tbody-td">
                      <input
                        type="number"
                        value={newRow.feeCeiling}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            feeCeiling: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                      />
                    </td>
                    <td className="tbody-td">
                      <input
                        type="number"
                        value={newRow.totalValueCeiling}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            totalValueCeiling: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                      />
                    </td>
                    <td className="tbody-td ">
                      <select
                        name="ceilingCode"
                        value={newRow.ceilingCode}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            ceilingCode: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs text-center"
                      >
                        {applyToRBAOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="tbody-td">
                      <button
                        onClick={handleSave}
                        className="text-green-700 hover:text-green-800"
                        style={{ background: "none", border: "none" }}
                      >
                        <FaSave size={16} />
                      </button>
                      <button
                        onClick={handleCancelNewRow}
                        className="text-gray-500 hover:text-gray-700"
                        style={{ background: "none", border: "none" }}
                      >
                        <FaTimes size={16} />
                      </button>
                    </td>
                  </tr>
                )}

                {overrides.map((row, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b border-gray-200 hover:bg-gray-50"
                  >
                    {/* <td className="px-2 py-1 text-xs">{row.projectId}</td> */}
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <input
                          type="number"
                          name="costCeiling"
                          value={editRow.costCeiling}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                        />
                      ) : (
                        row.costCeiling
                      )}
                    </td>
                    <td className="tbody-td ">
                      {editIndex === index ? (
                        <input
                          type="number"
                          name="feeCeiling"
                          value={editRow.feeCeiling}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                        />
                      ) : (
                        row.feeCeiling
                      )}
                    </td>
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <input
                          type="number"
                          name="totalValueCeiling"
                          value={editRow.totalValueCeiling}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                        />
                      ) : (
                        row.totalValueCeiling
                      )}
                    </td>
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <select
                          name="ceilingCode"
                          value={editRow.ceilingCode}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs text-center"
                        >
                          {applyToRBAOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        row.ceilingCode
                      )}
                    </td>
                    <td className="tbody-td ">
                      {editIndex === index ? (
                        <>
                          <button
                            onClick={() => handleUpdate(index)}
                            className="text-green-700 hover:text-green-800"
                            style={{ background: "none", border: "none" }}
                          >
                            <FaSave size={16} />
                          </button>
                          <button
                            onClick={() => setEditIndex(null)}
                            className="text-gray-500 hover:text-gray-700"
                            style={{ background: "none", border: "none" }}
                          >
                            <FaTimes size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(index)}
                            className="text-blue-400 hover:text-blue-700"
                            style={{ background: "none", border: "none" }}
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="text-gray-400 hover:text-gray-800"
                            style={{ background: "none", border: "none" }}
                          >
                            <FaTrash size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostFeeOverrideDetails;
