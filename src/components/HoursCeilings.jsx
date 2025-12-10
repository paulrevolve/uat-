import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSave, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const HoursCeilings = ({ projectId, isSearched, updatedBy = "Kartikay" }) => {
  const [hoursCeilings, setHoursCeilings] = useState([]);
  const [laborCategories, setLaborCategories] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRow, setNewRow] = useState({
    laborCategory: "",
    laborCategoryDescription: "",
    hoursCeiling: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const [lastSearchedProjectId, setLastSearchedProjectId] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const isValidProjectId = (id) => !!id;

  // Fetch ceilings + labor categories for project
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isSearched && isValidProjectId(projectId)) {
        setIsLoading(true);
        try {
          // Fetch ceilings
          const [ceilingsRes, projectRes] = await Promise.all([
            axios.get(
              `${backendUrl}/Project/GetAllCeilingHrForPLC?projId=${projectId}`
            ),
            axios.get(
              `${backendUrl}/Project/GetAllProjectByProjId/${projectId}`
            ),
          ]);

          if (isMounted) {
            setHoursCeilings(ceilingsRes.data?.data || []);
            setLaborCategories(projectRes.data?.[0]?.plc || []);
            setLastSearchedProjectId(projectId);
            setHasSearched(true);
          }
        } catch (error) {
          if (isMounted) {
            setHoursCeilings([]);
            setLaborCategories([]);
            setLastSearchedProjectId(projectId);
            setHasSearched(true);
            toast.error("Failed to fetch project details.");
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
            setShowNewRow(false);
          }
        }
      } else if (isMounted) {
        setHoursCeilings([]);
        setLaborCategories([]);
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
      laborCategory: "",
      laborCategoryDescription: "",
      hoursCeiling: "",
    });
  };

  const handleLaborCategoryChange = (value) => {
    setNewRow((prev) => ({
      ...prev,
      laborCategory: value,
      laborCategoryDescription: "",
    }));
  };

  const handleSuggestionSelect = (selectedCode) => {
    const selected = laborCategories.find(
      (cat) => cat.laborCategoryCode === selectedCode
    );
    if (selected) {
      setNewRow((prev) => ({
        ...prev,
        laborCategory: selected.laborCategoryCode,
        laborCategoryDescription: selected.description,
      }));
    }
  };

  // const handleSave = async () => {
  //   if (!newRow.laborCategory || !newRow.hoursCeiling) {
  //     toast.warning("Please fill all fields.");
  //     return;
  //   }
  //   const requestBody = {
  //     projectId: lastSearchedProjectId,
  //     employeeId: newRow.laborCategory,
  //     laborCategoryId: newRow.laborCategory,
  //     hoursCeiling: parseFloat(newRow.hoursCeiling) || 0,
  //     applyToRbaCode: "N",
  //   };
  //   try {
  //     await axios.post(
  //       `${backendUrl}/Project/CreateCeilingHrForEmp?updatedBy=${updatedBy}`,
  //       requestBody
  //     );
  //     toast.success("Saved successfully.");
  //     const response = await axios.get(
  //       `${backendUrl}/Project/GetAllCeilingHrForPLC?projId=${lastSearchedProjectId}`
  //     );
  //     setHoursCeilings(response.data?.data || []);
  //     setShowNewRow(false);
  //     setNewRow({
  //       laborCategory: "",
  //       laborCategoryDescription: "",
  //       hoursCeiling: "",
  //     });
  //   } catch (error) {
  //     toast.error("Failed to save. Please check your input and try again.");
  //   }
  // };

  const handleSave = async () => {
    if (!newRow.laborCategory || !newRow.hoursCeiling) {
      toast.warning("Please fill all fields.");
      return;
    }

    const requestBody = {
      projectId,
      laborCategoryId: newRow.laborCategory,
      laborCategoryDesc: newRow.laborCategoryDescription || "",
      hoursCeiling: parseFloat(newRow.hoursCeiling) || 0,
      applyToRbaCode: "N", // default for now
    };

    try {
      await axios.post(
        `${backendUrl}/Project/CreateCeilingHrForPLC?updatedBy=${updatedBy}`,
        requestBody
      );
      toast.success("Saved successfully.");

      // Refresh table after save
      const response = await axios.get(
        `${backendUrl}/Project/GetAllCeilingHrForPLC?projId=${lastSearchedProjectId}`
      );
      setHoursCeilings(response.data?.data || []);

      setShowNewRow(false);
      setNewRow({
        laborCategory: "",
        laborCategoryDescription: "",
        hoursCeiling: "",
      });
    } catch (error) {
      // console.error("Error saving:", error);
      toast.error("Failed to save. Please check your input and try again.");
    }
  };

  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditRow({ hoursCeiling: hoursCeilings[index].hoursCeiling });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditRow((prev) => ({ ...prev, [name]: value }));
  };

  // const handleUpdate = async (index) => {
  //   const row = hoursCeilings[index];
  //   const requestBody = {
  //     projectId: lastSearchedProjectId,
  //     laborCategoryId: row.laborCategory,
  //     laborCategoryDesc: row.laborCategoryDescription,
  //     hoursCeiling: parseFloat(editRow.hoursCeiling) || 0,
  //     applyToRbaCode: "N",
  //   };
  //   try {
  //     await axios.put(
  //       `${backendUrl}/Project/UpdateCeilingHrForPLC?updatedBy=${updatedBy}`,
  //       requestBody
  //     );
  //     toast.success("Updated successfully.");
  //     const response = await axios.get(
  //       `${backendUrl}/Project/GetAllCeilingHrForPLC?projId=${lastSearchedProjectId}`
  //     );
  //     setHoursCeilings(response.data?.data || []);
  //     setEditIndex(null);
  //     setEditRow({});
  //   } catch (error) {
  //     toast.error("Error updating hours ceiling.");
  //   }
  // };

  const handleUpdate = async (index) => {
    const row = hoursCeilings[index];
    if (!row) return;

    const requestBody = {
      projectId: lastSearchedProjectId,
      laborCategoryId: row.laborCategoryId, // use correct key
      laborCategoryDesc: row.laborCategoryDesc, // use correct key
      hoursCeiling: Number(editRow.hoursCeiling) || 0,
      applyToRbaCode: "N",
    };

    try {
      await axios.put(
        `${backendUrl}/Project/UpdateCeilingHrForPLC`,
        requestBody,
        { params: { updatedBy } } // cleaner way to pass query params
      );

      toast.success("Hours ceiling updated successfully");

      // 🔄 refresh updated list
      const response = await axios.get(
        `${backendUrl}/Project/GetAllCeilingHrForPLC`,
        { params: { projId: lastSearchedProjectId } }
      );

      setHoursCeilings(response.data?.data || []);
      setEditIndex(null);
      setEditRow({});
    } catch (error) {
      // console.error("Update error:", error);
      toast.error("Error updating hours ceiling ❌");
    }
  };

  // const handleDeleteUI = (index) => {
  //   setHoursCeilings((prev) => prev.filter((_, i) => i !== index));
  //   toast.info("Row deleted (UI only).");
  // };

  const handleDelete = async (index) => {
    const row = hoursCeilings[index];
    if (!row) return;

    try {
      await axios.delete(
        `${backendUrl}/Project/DeleteCeilingHrForPLC/${row.projectId}/${row.laborCategoryId}`
      );

      // ✅ Update UI only if API succeeds
      setHoursCeilings((prev) => prev.filter((_, i) => i !== index));

      toast.success("Hours ceiling deleted successfully");
    } catch (error) {
      // console.error("Delete error:", error);
      toast.error("Error deleting hours ceiling");
    }
  };

  const handleCancelNewRow = () => {
    setShowNewRow(false);
    setNewRow({
      laborCategory: "",
      laborCategoryDescription: "",
      hoursCeiling: "",
    });
    toast.info("New row canceled.");
  };

  const getDescription = (laborCategory) => {
    const cat = laborCategories.find(
      (c) => c.laborCategoryCode === laborCategory
    );
    return cat ? cat.description : "Consulting Services";
  };

  if (!shouldShowTable) {
    return (
      <div className="text-gray-600">
        Please search for a project to view details.
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <ToastContainer />
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-md">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Hours Ceilings
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
        ) : hoursCeilings.length === 0 && !showNewRow ? (
          <p className="text-gray-600">
            No data available for this project ID.
          </p>
        ) : (
          <div className="overflow-x-auto border-line">
            <table className="w-full table">
              <thead className="thead">
                <tr>
                  <th className="th-thead">Labor Category</th>
                  <th className="th-thead">Labor Category Description</th>
                  <th className="th-thead">Hours Ceiling</th>
                  <th className="th-thead">Action</th>
                </tr>
              </thead>
              <tbody className="tbody-td">
                {showNewRow && (
                  <tr className="bg-white border-b border-gray-200 hover:bg-gray-50">
                    <td className="tbody-td">
                      <input
                        list="labor-suggestions"
                        value={newRow.laborCategory}
                        onChange={(e) =>
                          handleLaborCategoryChange(e.target.value)
                        }
                        onBlur={(e) => handleSuggestionSelect(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                        placeholder="Search Labor Category"
                      />
                      <datalist id="labor-suggestions">
                        {laborCategories.map((cat) => (
                          <option
                            key={cat.laborCategoryCode}
                            value={cat.laborCategoryCode}
                          >
                            {cat.laborCategoryCode} - {cat.description}
                          </option>
                        ))}
                      </datalist>
                    </td>
                    <td className="tbody-td">
                      {newRow.laborCategoryDescription}
                    </td>
                    <td className="tbody-td">
                      <input
                        type="text"
                        value={newRow.hoursCeiling}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            hoursCeiling: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                        placeholder="0"
                      />
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
                {hoursCeilings.map((ceiling, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="tbody-td">{ceiling.laborCategoryId}</td>
                    <td className="tbody-td">
                      {/* {getDescription(ceiling.laborCategory)} */}
                      {ceiling.laborCategoryDesc}
                    </td>
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <input
                          type="text"
                          name="hoursCeiling"
                          value={editRow.hoursCeiling}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                        />
                      ) : (
                        <span className="font-normal">
                          {ceiling.hoursCeiling}
                        </span>
                      )}
                    </td>
                    <td className="tbody-td">
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

export default HoursCeilings;
