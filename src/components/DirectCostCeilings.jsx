import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSave, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const applyToRBAOptions = [
  { value: "", label: "Select" },
  { value: "R", label: "Revenue" },
  { value: "B", label: "Billing" },
  { value: "A", label: "All" },
  { value: "N", label: "None" },
];

// Accept any non-empty trimmed projectId
const isValidProjectId = (id) => !!id;

const DirectCostCeilings = ({ projectId, isSearched, updatedBy = "TEST" }) => {
  const [accounts, setAccounts] = useState([]);
  const [directCostCeilings, setDirectCostCeilings] = useState([]);
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRow, setNewRow] = useState({
    accountId: "",
    accountName: "",
    ceilingAmountFunc: "",
    applyToRbaCode: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [lastSearchedProjectId, setLastSearchedProjectId] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Don't fetch until a real search and valid projectId.
  // useEffect(() => {
  //   let active = true;
  //   const fetchAccounts = async () => {
  //     if (!(isSearched && isValidProjectId(projectId))) {
  //       setAccounts([]);
  //       return;
  //     }
  //     try {
  //       const res = await axios.get(
  //         `${backendUrl}/Project/GetAllProjectByProjId/${projectId}`
  //       );
  //       const project = Array.isArray(res.data) ? res.data[0] : {};
  //       const labor = Array.isArray(project?.laborAccounts)
  //         ? project.laborAccounts.map((code) => ({
  //             acctId: code,
  //             acctName: code,
  //           }))
  //         : [];
  //       const nonLabor = Array.isArray(project?.nonLaborAccounts)
  //         ? project.nonLaborAccounts.map((code) => ({
  //             acctId: code,
  //             acctName: code,
  //           }))
  //         : [];
  //       if (active) setAccounts([...labor, ...nonLabor]);
  //     } catch (err) {
  //       setAccounts([]);
  //       // Don't toast for search errors!
  //     }
  //   };
  //   fetchAccounts();
  //   return () => {
  //     active = false;
  //   };
  // }, [isSearched, projectId]);

  // ✅ Fetch accounts for project based on searched projectId
  useEffect(() => {
    let active = true;

    const fetchAccounts = async () => {
      if (!(isSearched && isValidProjectId(projectId))) {
        setAccounts([]);
        return;
      }

      try {
        const res = await axios.get(
          `${backendUrl}/Project/GetAllProjectByProjId/${projectId}`
        );

        const project = Array.isArray(res.data) ? res.data[0] : {};

        // ✅ Collect accounts from Employee, Subcontractor, and Other Direct Cost NON-LABOR
        const employeeNonLabor = Array.isArray(
          project?.employeeNonLaborAccounts
        )
          ? project.employeeNonLaborAccounts.map((acc) => ({
              acctId: acc.accountId,
              acctName: acc.acctName,
            }))
          : [];

        const subcontractorNonLabor = Array.isArray(
          project?.subContractorNonLaborAccounts
        )
          ? project.subContractorNonLaborAccounts.map((acc) => ({
              acctId: acc.accountId,
              acctName: acc.acctName,
            }))
          : [];

        const otherDirectCostNonLabor = Array.isArray(
          project?.otherDirectCostNonLaborAccounts
        )
          ? project.otherDirectCostNonLaborAccounts.map((acc) => ({
              acctId: acc.accountId,
              acctName: acc.acctName,
            }))
          : [];

        // ✅ Merge all NON-LABOR account lists
        const mergedAccounts = [
          ...employeeNonLabor,
          ...subcontractorNonLabor,
          ...otherDirectCostNonLabor,
        ];

        if (active) setAccounts(mergedAccounts);
      } catch (err) {
        // console.error("Error fetching accounts:", err);
        setAccounts([]);
      }
    };

    fetchAccounts();

    return () => {
      active = false;
    };
  }, [isSearched, projectId]);

  useEffect(() => {
    let active = true;
    const fetchDirectCostCeilings = async () => {
      if (isSearched && isValidProjectId(projectId)) {
        setIsLoading(true);
        try {
          const res = await axios.get(
            `${backendUrl}/Project/GetAllCeilingAmtForDirectCost?projId=${projectId}`
          );
          if (active) {
            setDirectCostCeilings(
              Array.isArray(res.data?.data) ? res.data.data : []
            );
            setLastSearchedProjectId(projectId);
            setHasSearched(true);
          }
        } catch {
          setDirectCostCeilings([]);
          setLastSearchedProjectId(projectId);
          setHasSearched(true);
        } finally {
          if (active) {
            setIsLoading(false);
            setShowNewRow(false);
          }
        }
      } else if (active) {
        setDirectCostCeilings([]);
        setShowNewRow(false);
        setLastSearchedProjectId("");
        setHasSearched(false);
        setIsLoading(false);
      }
    };
    fetchDirectCostCeilings();
    return () => {
      active = false;
    };
  }, [isSearched, projectId]);

  const shouldShowTable =
    hasSearched && isValidProjectId(lastSearchedProjectId);

  // Account input change for new row (typed suggestion)
  const handleNewAccountInput = (value) => {
    const selected = accounts.find((a) => a.acctId === value);
    if (selected) {
      setNewRow((prev) => ({
        ...prev,
        accountId: selected.acctId,
        accountName: selected.acctName,
      }));
    } else {
      setNewRow((prev) => ({
        ...prev,
        accountId: value,
        accountName: "",
      }));
    }
  };

  const handleNewClick = () => {
    setShowNewRow(true);
    setNewRow({
      accountId: "",
      accountName: "",
      ceilingAmountFunc: "",
      applyToRbaCode: "",
    });
  };

  const handleSave = async () => {
    if (
      !newRow.accountId ||
      !newRow.ceilingAmountFunc ||
      !newRow.applyToRbaCode
    ) {
      toast.warning("Please fill all required fields.");
      return;
    }
    try {
      const requestBody = {
        projectId: lastSearchedProjectId,
        accountId: newRow.accountId,
        ceilingAmountFunc: parseFloat(newRow.ceilingAmountFunc) || 0,
        ceilingAmountBilling: 0,
        applyToRbaCode: newRow.applyToRbaCode,
      };
      await axios.post(
        `${backendUrl}/Project/CreateCeilingAmtForDirectCost?updatedBy=${updatedBy}`,
        requestBody
      );
      toast.success("Saved successfully");
      const res = await axios.get(
        `${backendUrl}/Project/GetAllCeilingAmtForDirectCost?projId=${lastSearchedProjectId}`
      );
      setDirectCostCeilings(Array.isArray(res.data?.data) ? res.data.data : []);
      setShowNewRow(false);
      setNewRow({
        accountId: "",
        accountName: "",
        ceilingAmountFunc: "",
        applyToRbaCode: "",
      });
    } catch {
      toast.error("Failed to save. Try again.");
    }
  };

  const handleEditClick = (index) => {
    setEditIndex(index);
    const row = directCostCeilings[index];
    setEditRow({
      ceilingAmountFunc: row.ceilingAmountFunc,
      applyToRbaCode: row.applyToRbaCode || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditRow((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (index) => {
    const row = directCostCeilings[index];
    try {
      const requestBody = {
        projectId: row.projectId,
        accountId: row.accountId,
        ceilingAmountFunc: parseFloat(editRow.ceilingAmountFunc) || 0,
        ceilingAmountBilling: 0,
        applyToRbaCode: editRow.applyToRbaCode,
      };
      await axios.put(
        `${backendUrl}/Project/UpdateCeilingAmtForDirectCost?updatedBy=${updatedBy}`,
        requestBody
      );
      toast.success("Updated successfully");
      const res = await axios.get(
        `${backendUrl}/Project/GetAllCeilingAmtForDirectCost?projId=${lastSearchedProjectId}`
      );
      setDirectCostCeilings(Array.isArray(res.data?.data) ? res.data.data : []);
      setEditIndex(null);
      setEditRow({});
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditRow({});
    toast.info("Edit canceled");
  };

  // const handleDeleteUI = (index) => {
  //   setDirectCostCeilings((prev) => prev.filter((_, i) => i !== index));
  //   toast.info("Row removed (UI only)");
  // };

  const handleDelete = async (index) => {
    const ceiling = directCostCeilings[index];
    if (!ceiling) return;

    try {
      const response = await fetch(
        `${backendUrl}/Project/DeleteCeilingAmtForDirectCost/${ceiling.projectId}/${ceiling.accountId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete direct cost ceiling");
      }

      // ✅ Update UI after successful API call
      setDirectCostCeilings((prev) => prev.filter((_, i) => i !== index));

      // ✅ Toast success
      toast.success("Direct cost ceiling deleted successfully!");
    } catch (error) {
      // console.error("Delete error:", error);
      toast.error("Could not delete direct cost ceiling. Please try again.");
    }
  };

  const handleCancelNewRow = () => {
    setShowNewRow(false);
    setNewRow({
      accountId: "",
      accountName: "",
      ceilingAmountFunc: "",
      applyToRbaCode: "",
    });
    toast.info("Canceled");
  };

  // Messages for unsearched/invalid
  if (!isSearched) {
    return (
      <div className="text-gray-600">
        Please search for a project to view details.
      </div>
    );
  }

  if (isSearched && !isValidProjectId(projectId)) {
    return <div className="text-red-600 font-medium">Invalid project ID.</div>;
  }

  if (!shouldShowTable) {
    return (
      <div className="text-gray-600">
        Please search for a project to view details.
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <ToastContainer position="top-right" autoClose={1600} />
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-md">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Direct Cost Ceilings
          </h2>
          <div className="flex items-center mb-2">
            <label className="text-sm font-medium text-gray-700 mr-2">
              Project:
            </label>
            <span className="text-sm text-gray-900">
              {lastSearchedProjectId}
            </span>
            <span className="ml-4 text-sm text-gray-900">Org ID: 1.02</span>
          </div>
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
            onClick={handleNewClick}
          >
            New
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : directCostCeilings.length === 0 && !showNewRow ? (
          <p className="text-gray-600">No data available.</p>
        ) : (
          <div className="overflow-x-auto border-line">
            <table className="w-full table">
              <thead className="thead">
                <tr>
                  <th className="th-thead">Account</th>
                  <th className="th-thead">Account Name</th>
                  <th className="th-thead ">
                    Functional Currency Ceiling Amount
                  </th>
                  <th className="th-thead  ">Apply to R/B/A</th>
                  <th className="th-thead  ">Action</th>
                </tr>
              </thead>
              <tbody className="tbody">
                {showNewRow && (
                  <tr className="bg-white border-b border-gray-200 hover:bg-gray-50">
                    <td className="tbody-td">
                      {/* <input
                        list="dc-account-suggestions"
                        value={newRow.accountId}
                        onChange={(e) => handleNewAccountInput(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                        placeholder="Search account"
                      />
                      <datalist id="dc-account-suggestions">
                        {accounts.map((a) => (
                          <option key={a.acctId} value={a.acctId}>
                            {a.acctId}
                          </option>
                        ))}
                      </datalist> */}
                      <input
                        list="dc-account-suggestions"
                        value={newRow.accountId}
                        onChange={(e) => handleNewAccountInput(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                        placeholder="Search account"
                      />
                      <datalist id="dc-account-suggestions">
                        {accounts.map((a) => (
                          <option key={a.acctId} value={a.acctId}>
                            {a.acctId} - {a.acctName}{" "}
                            {/* 👈 Show both ID + Name in dropdown */}
                          </option>
                        ))}
                      </datalist>
                    </td>
                    <td className="tbody-td">{newRow.accountName}</td>
                    <td className="tbody-td">
                      <input
                        type="number"
                        step="0.01"
                        value={newRow.ceilingAmountFunc}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            ceilingAmountFunc: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="tbody-td">
                      <select
                        value={newRow.applyToRbaCode}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            applyToRbaCode: e.target.value,
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
                        title="Save"
                        style={{ background: "none", border: "none" }}
                      >
                        <FaSave size={16} />
                      </button>
                      <button
                        onClick={handleCancelNewRow}
                        className="text-gray-500 hover:text-gray-700"
                        title="Cancel"
                        style={{ background: "none", border: "none" }}
                      >
                        <FaTimes size={16} />
                      </button>
                    </td>
                  </tr>
                )}

                {directCostCeilings.map((ceiling, index) => (
                  <tr
                    key={`${ceiling.accountId}-${
                      ceiling.projectId || "proj"
                    }-${index}`}
                    className="bg-white border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="tbody-td">{ceiling.accountId}</td>
                    <td className="tbody-td">
                      {accounts.find((a) => a.acctId === ceiling.accountId)
                        ?.acctName || "N/A"}
                    </td>
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <input
                          type="number"
                          step="0.01"
                          name="ceilingAmountFunc"
                          value={editRow.ceilingAmountFunc}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs text-center"
                        />
                      ) : (
                        ceiling.ceilingAmountFunc
                      )}
                    </td>
                    <td className="tbody-td  ">
                      {editIndex === index ? (
                        <select
                          name="applyToRbaCode"
                          value={editRow.applyToRbaCode}
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
                        ceiling.applyToRbaCode || ""
                      )}
                    </td>
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <>
                          <button
                            onClick={() => handleUpdate(index)}
                            className="text-green-700 hover:text-green-800"
                            title="Save"
                            style={{ background: "none", border: "none" }}
                          >
                            <FaSave size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-500 hover:text-gray-700"
                            title="Cancel"
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
                            title="Edit"
                            style={{ background: "none", border: "none" }}
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="text-gray-400 hover:text-gray-800"
                            title="Delete"
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

export default DirectCostCeilings;
