import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash, FaSave, FaPlus, FaTimes } from "react-icons/fa";
import { backendUrl } from "./config";

const EmployeeHoursCeilings = ({
  projectId,
  isSearched,
  updatedBy = "user",
}) => {
  const [employees, setEmployees] = useState([]);
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [laborCategories, setLaborCategories] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRow, setNewRow] = useState({
    empId: "",
    employeeName: "",
    laborCategoryId: "",
    laborCategoryDesc: "",
    hoursCeiling: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchedProjectId, setLastSearchedProjectId] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Validate projectId
  const isValidProjectId = (id) => !!id;

  // Fetch data
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (isSearched && isValidProjectId(projectId)) {
        setIsLoading(true);
        try {
          const [empResponse, ceilingResponse, laborResponse] =
            await Promise.all([
              axios.get(
                `${backendUrl}/Project/GetEmployeesByProject/${projectId}`
              ),
              axios.get(
                `${backendUrl}/Project/GetAllCeilingHrForEmp?projId=${projectId}`
              ),
              axios.get(`${backendUrl}/Project/GetAllPlcs/W`),
            ]);

          if (isMounted) {
            setEmployeeSuggestions(empResponse.data || []);
            setEmployees(
              Array.isArray(ceilingResponse.data?.data)
                ? ceilingResponse.data.data.map((emp) => ({
                    projectId: emp.projectId || "",
                    empId: emp.employeeId?.trim() || "",
                    employeeName: emp.employeeName || "",
                    laborCategoryId: emp.laborCategoryId || "",
                    laborCategoryDesc: emp.laborCategoryDesc || "",
                    hoursCeiling: emp.hoursCeiling ?? 0,
                    applyToRbaCode: emp.applyToRbaCode || "",
                  }))
                : []
            );
            setLaborCategories(laborResponse.data || []);
            setLastSearchedProjectId(projectId);
            setHasSearched(true);
          }
        } catch (error) {
          // console.error("Error fetching data:", error);
          if (isMounted) {
            setEmployees([]);
            setEmployeeSuggestions([]);
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
        setEmployees([]);
        setEmployeeSuggestions([]);
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
  }, [projectId, isSearched]);

  const shouldShowTable =
    hasSearched && isValidProjectId(lastSearchedProjectId);

  // Handle new employee row
  const handleNewClick = () => {
    if (!shouldShowTable) {
      toast.warning("Please search for a valid project first.");
      return;
    }
    setShowNewRow(true);
    setNewRow({
      empId: "",
      employeeName: "",
      laborCategoryId: "",
      laborCategoryDesc: "",
      hoursCeiling: "",
    });
  };

  // Handle employee ID change for new row
  const handleNewEmployeeIdChange = (value) => {
    const selected = employeeSuggestions.find((sug) => sug.empId === value);
    setNewRow((prev) => ({
      ...prev,
      empId: value,
      employeeName: selected ? selected.employeeName : "",
    }));
  };

  // Handle labor category change for new row
  const handleNewLaborCategoryChange = (value) => {
    const selected = laborCategories.find(
      (cat) => cat.laborCategoryCode === value
    );
    setNewRow((prev) => ({
      ...prev,
      laborCategoryId: value,
      laborCategoryDesc: selected ? selected.description : "",
    }));
  };

  // Save new employee
  const handleSave = async () => {
    if (!newRow.empId || !newRow.laborCategoryId || !newRow.hoursCeiling) {
      toast.error("Please fill all fields.");
      return;
    }
    const requestBody = {
      projectId,
      employeeId: newRow.empId,
      laborCategoryId: newRow.laborCategoryId,
      hoursCeiling: Number(newRow.hoursCeiling) || 0,
      applyToRbaCode: "N",
      employeeName: newRow.employeeName || "",
      laborCategoryDesc: newRow.laborCategoryDesc || "",
    };
    try {
      await axios.post(
        `${backendUrl}/Project/CreateCeilingHrForEmp?updatedBy=${updatedBy}`,
        requestBody
      );
      toast.success("Saved successfully.");
      const response = await axios.get(
        `${backendUrl}/Project/GetAllCeilingHrForEmp?projId=${lastSearchedProjectId}`
      );
      setEmployees(
        Array.isArray(response.data?.data)
          ? response.data.data.map((emp) => ({
              projectId: emp.projectId || "",
              empId: emp.employeeId?.trim() || "",
              employeeName: emp.employeeName || "",
              laborCategoryId: emp.laborCategoryId || "",
              laborCategoryDesc: emp.laborCategoryDesc || "",
              hoursCeiling: emp.hoursCeiling ?? 0,
              applyToRbaCode: emp.applyToRbaCode || "",
            }))
          : []
      );
      setShowNewRow(false);
      setNewRow({
        empId: "",
        employeeName: "",
        laborCategoryId: "",
        laborCategoryDesc: "",
        hoursCeiling: "",
      });
    } catch (error) {
      // console.error("Save error:", error);
      toast.error("Failed to save. Please check your input and try again.");
    }
  };

  // Cancel new row
  const handleCancelNewRow = () => {
    setShowNewRow(false);
    setNewRow({
      empId: "",
      employeeName: "",
      laborCategoryId: "",
      laborCategoryDesc: "",
      hoursCeiling: "",
    });
    toast.info("New row canceled.");
  };

  // Handle edit click
  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditRow({ ...employees[index] });
  };

  // Handle edit field change
  const handleEditChange = (field, value) => {
    setEditRow((prev) => ({ ...prev, [field]: value }));
  };

  // Handle employee ID change for edit row
  const handleEmployeeIdChange = (index, value) => {
    const selected = employeeSuggestions.find((sug) => sug.empId === value);
    setEditRow((prev) => ({
      ...prev,
      empId: value,
      employeeName: selected ? selected.employeeName : "",
    }));
  };

  // Handle labor category change for edit row
  const handleLaborCategoryChange = (index, value) => {
    const selected = laborCategories.find(
      (cat) => cat.laborCategoryCode === value
    );
    setEditRow((prev) => ({
      ...prev,
      laborCategoryId: value,
      laborCategoryDesc: selected ? selected.description : "",
    }));
  };

  // Update existing employee
  const handleUpdate = async (index) => {
    const updatedEmp = editRow;
    if (
      !updatedEmp.empId ||
      !updatedEmp.laborCategoryId ||
      !updatedEmp.hoursCeiling
    ) {
      toast.error("Please fill all fields.");
      return;
    }
    const requestBody = {
      projectId,
      employeeId: updatedEmp.empId,
      laborCategoryId: updatedEmp.laborCategoryId,
      hoursCeiling: Number(updatedEmp.hoursCeiling) || 0,
      applyToRbaCode: updatedEmp.applyToRbaCode || "N",
      employeeName: updatedEmp.employeeName || "",
      laborCategoryDesc: updatedEmp.laborCategoryDesc || "",
    };
    try {
      await axios.put(
        `${backendUrl}/Project/UpdateCeilingHrForEmp?updatedBy=${updatedBy}`,
        requestBody
      );
      setEmployees((prev) =>
        prev.map((emp, i) => (i === index ? { ...emp, ...requestBody } : emp))
      );
      toast.success("Update successful");
      setEditIndex(null);
      setEditRow({});
    } catch (error) {
      // console.error("Update error:", error);
      toast.error("Failed to update.");
    }
  };

  // Delete employee
  const handleDelete = async (index) => {
    const employee = employees[index];
    if (!employee) return;
    try {
      await axios.delete(
        `${backendUrl}/Project/DeleteCeilingHrForEmp/${employee.projectId}/${employee.empId}/${employee.laborCategoryId}`
      );
      setEmployees((prev) => prev.filter((_, i) => i !== index));
      toast.success("Employee record deleted successfully!");
    } catch (error) {
      // console.error("Delete error:", error);
      toast.error("Could not delete employee. Please try again.");
    }
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
            Employee Hours Ceilings
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
        ) : employees.length === 0 && !showNewRow ? (
          <p className="text-gray-600">
            No data available for this project ID.
          </p>
        ) : (
          <div className="overflow-x-auto border-line">
            <table className="w-full table">
              <thead className="thead">
                <tr>
                  <th className="th-thead">Empl ID</th>
                  <th className="th-thead">Employee Name</th>
                  <th className="th-thead">Labor Category</th>
                  <th className="th-thead">Labor Desc</th>
                  <th className="th-thead">Hours Ceiling</th>
                  <th className="th-thead">Action</th>
                </tr>
              </thead>
              <tbody className="tbody">
                {showNewRow && (
                  <tr>
                    <td className="tbody-td">
                      <input
                        list="emp-suggestions"
                        value={newRow.empId}
                        onChange={(e) =>
                          handleNewEmployeeIdChange(e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                        placeholder="Search Empl ID"
                      />
                      <datalist id="emp-suggestions">
                        {employeeSuggestions.map((sug) => (
                          <option key={sug.empId} value={sug.empId}>
                            {sug.empId} - {sug.employeeName}
                          </option>
                        ))}
                      </datalist>
                    </td>
                    <td className="tbody-td">{newRow.employeeName}</td>
                    <td className="tbody-td">
                      <input
                        list="labor-suggestions"
                        value={newRow.laborCategoryId}
                        onChange={(e) =>
                          handleNewLaborCategoryChange(e.target.value)
                        }
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
                    <td className="tbody-td">{newRow.laborCategoryDesc}</td>
                    <td className="tbody-td">
                      <input
                        type="number"
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
                {employees.map((emp, index) => (
                  <tr
                    key={`${emp.projectId}-${emp.empId}-${index}`}
                    className="bg-white border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <>
                          <input
                            list={`empSuggestions-${index}`}
                            value={editRow.empId || ""}
                            onChange={(e) =>
                              handleEmployeeIdChange(index, e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                            placeholder="Search Empl ID"
                          />
                          <datalist id={`empSuggestions-${index}`}>
                            {employeeSuggestions.map((sug) => (
                              <option key={sug.empId} value={sug.empId}>
                                {sug.empId} - {sug.employeeName}
                              </option>
                            ))}
                          </datalist>
                        </>
                      ) : (
                        emp.empId
                      )}
                    </td>
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <input
                          type="text"
                          value={editRow.employeeName || ""}
                          disabled
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                        />
                      ) : (
                        emp.employeeName
                      )}
                    </td>
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <>
                          <input
                            list={`laborSuggestions-${index}`}
                            value={editRow.laborCategoryId || ""}
                            onChange={(e) =>
                              handleLaborCategoryChange(index, e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                            placeholder="Search Labor Category"
                          />
                          <datalist id={`laborSuggestions-${index}`}>
                            {laborCategories.map((cat) => (
                              <option
                                key={cat.laborCategoryCode}
                                value={cat.laborCategoryCode}
                              >
                                {cat.laborCategoryCode} - {cat.description}
                              </option>
                            ))}
                          </datalist>
                        </>
                      ) : (
                        emp.laborCategoryId
                      )}
                    </td>
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <input
                          type="text"
                          value={editRow.laborCategoryDesc || ""}
                          disabled
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                        />
                      ) : (
                        emp.laborCategoryDesc
                      )}
                    </td>
                    <td className="tbody-td">
                      {editIndex === index ? (
                        <input
                          type="number"
                          value={editRow.hoursCeiling || ""}
                          onChange={(e) =>
                            handleEditChange("hoursCeiling", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                          placeholder="0"
                        />
                      ) : (
                        emp.hoursCeiling
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

export default EmployeeHoursCeilings;
