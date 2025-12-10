import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa"; // Importing icons
import { v4 as uuidv4 } from "uuid"; // For unique IDs
import { backendUrl } from "./config";

const PLCComponent = ({ selectedProjectId, selectedPlan, showPLC }) => {
  const [billingRatesSchedule, setBillingRatesSchedule] = useState([]);
  const [newRate, setNewRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editBillRate, setEditBillRate] = useState({});
  const [employees, setEmployees] = useState([]);
  const [employeeBillingRates, setEmployeeBillingRates] = useState([]);
  const [newEmployeeRate, setNewEmployeeRate] = useState(null);
  const [editEmployeeBillRate, setEditEmployeeBillRate] = useState({});
  const [editEmployeeFields, setEditEmployeeFields] = useState({});
  const [editingEmployeeRowId, setEditingEmployeeRowId] = useState(null);
  const [vendorBillingRates, setVendorBillingRates] = useState([]);
  const [newVendorRate, setNewVendorRate] = useState(null);
  const [editVendorBillRate, setEditVendorBillRate] = useState({});
  const [editVendorFields, setEditVendorFields] = useState({});
  const [editingVendorRowId, setEditingVendorRowId] = useState(null);
  const [plcs, setPlcs] = useState([]);
  const [plcSearch, setPlcSearch] = useState("");
  const [vendorEmployees, setVendorEmployees] = useState([]);
  const [editingProjectPlcRowId, setEditingProjectPlcRowId] = useState(null);
  const [editProjectPlcFields, setEditProjectPlcFields] = useState({});
  const [loadingAction, setLoadingAction] = useState({});
  const [hasFetchedPLC, setHasFetchedPLC] = useState(false);
  const [loadingPLC, setLoadingPLC] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [loadingVendor, setLoadingVendor] = useState(false);

  const lookupTypeOptions = ["Select", "Employee", "Contract Employee"];
  const rateTypeOptions = ["Select", "Billing", "Actual"];
  const vendorLookupTypeOptions = ["Select", "Vendor", "Employee"];

  const [isEditing, setIsEditing] = React.useState(false);
  const [editedBillRates, setEditedBillRates] = React.useState({});
  const [selectedRows, setSelectedRows] = useState({});

  const [isEmployeeEditing, setIsEmployeeEditing] = React.useState(false);
  const [selectedEmployeeRows, setSelectedEmployeeRows] = useState({});
  const [isVendorEditing, setIsVendorEditing] = React.useState(false);
  const [selectedVendorRows, setSelectedVendorRows] = useState({});

  const dropdownStyles = {
    //  Remove borders from datalist suggestions
    noBorderDropdown: {
      border: "none",
      outline: "none",
      boxShadow: "none",
      background: "transparent",
    },
  };

  useEffect(() => {
    setHasFetchedPLC(false);
  }, [selectedProjectId]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  // Move the function OUTSIDE useEffect and add useCallback
  const fetchBillingRates = useCallback(async () => {
    if (!selectedProjectId) {
      // ✅ Clear states when no project selected
      setBillingRatesSchedule([]);
      setEditBillRate({});
      setEditProjectPlcFields({});
      return;
    }

    //   setLoading(true);
    setLoadingPLC(true);
    try {
      const response = await axios.get(`${backendUrl}/api/ProjectPlcRates`);
      const filteredData = response.data.filter((item) =>
        item.projId.toLowerCase().startsWith(selectedProjectId.toLowerCase())
      );

      // Check for duplicate IDs
      // const seenKeys = new Set();
      // const uniqueData = filteredData.map((item, index) => {
      //   const id =
      //     item.id ||
      //     `${item.projId}-${item.laborCategoryCode}-${item.effectiveDate}-${index}`;
      //   if (seenKeys.has(id)) {
      //     console.warn(
      //       `Duplicate key detected in billingRatesSchedule: ${id}. Using composite key.`
      //     );
      //     return { ...item, id: `${id}-${index}` };
      //   }
      //   seenKeys.add(id);
      //   return { ...item, id };
      // });

      //   // ✅ ALWAYS generate unique IDs, store original for API calls
      // const uniqueData = filteredData.map((item, index) => {
      //   // const uniqueId = `plc-${Date.now()}-${index}-${uuidv4().substring(0, 8)}`;
      //   const uniqueId = `plc-${Date.now()}-${Math.random()}-${index}-${uuidv4()}`;
      //   return {
      //     ...item,
      //     id: uniqueId,
      //     originalId: item.id // Store original for API calls
      //   };
      // });

      //     const uniqueData = filteredData.map((item, index) => {
      //   const uniqueId = `plc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}-${uuidv4()}`;
      //   return {
      //     ...item,
      //     id: uniqueId,
      //     originalId: item.id // Store original for API calls
      //   };
      // });

      const uniqueData = filteredData.map((item, index) => {
        const uniqueId = `plc-${uuidv4()}-${index}`;
        return {
          ...item,
          id: uniqueId,
          originalId: item.id,
        };
      });

      setBillingRatesSchedule(
        uniqueData.map((item) => ({
          id: item.id,
          originalId: item.originalId,
          plc: item.laborCategoryCode,
          billRate: item.billingRate,
          // rateType: item.rateType || "Select",
          rateType: item.sBillRtTypeCd || "Select",
          startDate: formatDate(item.effectiveDate),
          endDate: formatDate(item.endDate),
        }))
      );

      const newEditBillRate = {};
      const newEditProjectPlcFields = {};
      uniqueData.forEach((item) => {
        newEditBillRate[item.id] = item.billingRate;
        newEditProjectPlcFields[item.id] = {
          // rateType: item.rateType,
          rateType: item.sBillRtTypeCd || "Select",
          startDate: formatDate(item.effectiveDate),
          endDate: formatDate(item.endDate),
        };
      });
      setEditBillRate(newEditBillRate);
      setEditProjectPlcFields(newEditProjectPlcFields);
    } catch (error) {
      // console.error("Error fetching billing rates:", error);
      toast.error(
        `Failed to fetch billing rates: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      // setLoading(false);
      setLoadingPLC(false);
    }
  }, [selectedProjectId]); // ✅ Memoized with dependency

  // Move the function OUTSIDE useEffect and add useCallback
  const fetchEmployees = useCallback(async () => {
    if (
      !selectedProjectId ||
      typeof selectedProjectId !== "string" ||
      selectedProjectId.trim() === ""
    ) {
      // ✅ Clear employees when no valid project selected
      setEmployees([]);
      return;
    }

    //   setLoading(true);
    setLoadingEmployee(true);
    try {
      const response = await axios.get(
        `${backendUrl}/Project/GetEmployeesByProject/${selectedProjectId}`
      );
      setEmployees(
        response.data.map((item) => ({
          empId: item.empId,
          employeeName: item.employeeName,
        }))
      );
    } catch (error) {
      // console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      // setLoading(false);
      setLoadingEmployee(false);
    }
  }, [selectedProjectId]); // Memoized with dependency

  // Simple useEffect that calls the memoized function
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]); // Only runs when selectedProjectId changes

  // Fetch PLCs for search
  // useEffect(() => {
  //   const fetchPlcs = async () => {
  //     if (!plcSearch) {
  //       setPlcs([]);
  //       return;
  //     }
  //     try {
  //       const response = await axios.get(
  //         `${backendUrl}/Project/GetAllPlcs/${plcSearch}`
  //       );
  //       const filteredPlcs = response.data
  //         .filter((item) =>
  //           item.laborCategoryCode
  //             .toLowerCase()
  //             .includes(plcSearch.toLowerCase())
  //         )
  //         .map((item) => ({
  //           laborCategoryCode: item.laborCategoryCode,
  //           description: item.description || "",
  //         }));
  //       setPlcs(filteredPlcs);
  //     } catch (error) {
  //       console.error("Error fetching PLCs:", error);
  //       setPlcs([]);
  //     }
  //   };
  //   fetchPlcs();
  // }, [plcSearch]);

  const fetchPlcs = useCallback(async () => {
    if (!plcSearch) {
      setPlcs([]);
      return;
    }

    try {
      const response = await axios.get(
        `${backendUrl}/Project/GetAllPlcs/${plcSearch}`
      );
      const filteredPlcs = response.data
        .filter((item) =>
          item.laborCategoryCode.toLowerCase().includes(plcSearch.toLowerCase())
        )
        .map((item) => ({
          laborCategoryCode: item.laborCategoryCode,
          description: item.description || "",
        }));
      setPlcs(filteredPlcs);
    } catch (error) {
      // console.error("Error fetching PLCs:", error);
      setPlcs([]);
    }
  }, [plcSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPlcs();
    }, 100); //  debounce to prevent excessive API calls while typing

    return () => clearTimeout(timeoutId);
  }, [fetchPlcs]);

  const fetchEmployeeBillingRates = useCallback(async () => {
    if (!selectedProjectId) {
      setEmployeeBillingRates([]);
      setEditEmployeeBillRate({});
      setEditEmployeeFields({});
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/ProjEmplRt`);
      const filteredData = response.data.filter(
        (item) =>
          item.projId
            .toLowerCase()
            .startsWith(selectedProjectId.toLowerCase()) && item.emplId
      );

      // // Check for duplicate IDs
      // const seenKeys = new Set();
      // const uniqueData = filteredData.map((item, index) => {
      //   const id =
      //     item.projEmplRtKey ||
      //     item.id ||
      //     `${item.projId}-${item.emplId}-${item.startDt}-${index}`;
      //   if (seenKeys.has(id)) {
      //     console.warn(
      //       `Duplicate key detected in employeeBillingRates: ${id}. Using composite key.`
      //     );
      //     return { ...item, id: `${id}-${index}` };
      //   }
      //   seenKeys.add(id);
      //   return { ...item, id };
      // });

      // ✅ Always generate unique IDs
      // const uniqueData = filteredData.map((item, index) => {
      //   // const uniqueId = `emp-${Date.now()}-${index}-${uuidv4().substring(0, 8)}`;
      //   const uniqueId = `emp-${Date.now()}-${Math.random()}-${index}-${uuidv4()}`;
      //   return {
      //     ...item,
      //     id: uniqueId,
      //     originalId: item.projEmplRtKey || item.id // Keep original for API calls
      //   };
      // });

      //     const uniqueData = filteredData.map((item, index) => {
      //   const uniqueId = `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}-${uuidv4()}`;
      //   return {
      //     ...item,
      //     id: uniqueId,
      //     originalId: item.projEmplRtKey || item.id
      //   };
      // });

      const uniqueData = filteredData.map((item, index) => {
        const uniqueId = `emp-${uuidv4()}-${index}`;
        return {
          ...item,
          id: uniqueId,
          originalId: item.projEmplRtKey || item.id,
        };
      });

      setEmployeeBillingRates(
        uniqueData.map((item) => ({
          id: item.id,
          originalId: item.originalId,
          lookupType: item.type || "Select",
          empId: item.emplId,
          employeeName:
            item.emplName ||
            employees.find((emp) => emp.empId === item.emplId)?.employeeName ||
            "",
          plc: item.billLabCatCd,
          plcDescription: item.plcDescription || "",
          billRate: item.billRtAmt,
          rateType: item.sBillRtTypeCd || "Select",
          startDate: formatDate(item.startDt),
          endDate: formatDate(item.endDt),
        }))
      );

      const newEditEmployeeBillRate = {};
      const newEditEmployeeFields = {};
      uniqueData.forEach((item) => {
        const id = item.id;
        if (id) {
          newEditEmployeeBillRate[id] = item.billRtAmt;
          newEditEmployeeFields[id] = {
            lookupType: item.type || "Select",
            rateType: item.sBillRtTypeCd || "Select",
            startDate: formatDate(item.startDt),
            endDate: formatDate(item.endDt),
            empId: item.emplId,
            employeeName: item.employeeName,
            plc: item.billLabCatCd,
            plcDescription: item.plcDescription,
          };
        }
      });
      setEditEmployeeBillRate(newEditEmployeeBillRate);
      setEditEmployeeFields(newEditEmployeeFields);
    } catch (error) {
      // console.error("Error fetching employee billing rates:", error);
      toast.error(
        `Failed to fetch employee billing rates: ${
          error.response?.data?.message || error.message
        }`
      );
      setEmployeeBillingRates([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, employees]);

  const fetchVendorBillingRates = useCallback(async () => {
    if (!selectedProjectId) {
      setVendorBillingRates([]);
      setEditVendorBillRate({});
      setEditVendorFields({});
      return;
    }

    //   setLoading(true);
    setLoadingVendor(true);
    try {
      const response = await axios.get(`${backendUrl}/ProjVendRt`);
      const filteredData = response.data.filter((item) =>
        item.projId.toLowerCase().startsWith(selectedProjectId.toLowerCase())
      );

      // // Check for duplicate IDs
      // const seenKeys = new Set();
      // const uniqueData = filteredData.map((item, index) => {
      //   const id =
      //     item.projVendRtKey ||
      //     item.id ||
      //     `${item.projId}-${item.vendId}-${item.startDt}-${index}`;
      //   if (seenKeys.has(id)) {
      //     console.warn(
      //       `Duplicate key detected in vendorBillingRates: ${id}. Using composite key.`
      //     );
      //     return { ...item, id: `${id}-${index}` };
      //   }
      //   seenKeys.add(id);
      //   return { ...item, id };
      // });

      //   // ✅ Generate truly unique IDs
      // const uniqueData = filteredData.map((item, index) => {
      //   const uniqueId = item.projVendRtKey || item.id || `vendor-${Date.now()}-${index}-${uuidv4().substring(0, 8)}`;
      //   return { ...item, id: uniqueId };
      // });

      // ✅ ALWAYS generate unique IDs
      // const uniqueData = filteredData.map((item, index) => {
      //   // const uniqueId = `vendor-${Date.now()}-${index}-${uuidv4().substring(0, 8)}`;
      //   const uniqueId = `vendor-${Date.now()}-${Math.random()}-${index}-${uuidv4()}`;
      //   return {
      //     ...item,
      //     id: uniqueId,
      //     originalId: item.projVendRtKey || item.id // Store original for API calls
      //   };
      // });

      //     const uniqueData = filteredData.map((item, index) => {
      //   const uniqueId = `vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}-${uuidv4()}`;
      //   return {
      //     ...item,
      //     id: uniqueId,
      //     originalId: item.projVendRtKey || item.id
      //   };
      // });

      const uniqueData = filteredData.map((item, index) => {
        const uniqueId = `vendor-${uuidv4()}-${index}`;
        return {
          ...item,
          id: uniqueId,
          originalId: item.projVendRtKey || item.id,
        };
      });

      setVendorBillingRates(
        uniqueData.map((item) => ({
          id: item.id,
          originalId: item.originalId,
          projVendRtKey: item.projVendRtKey,
          lookupType: item.type || "Select",
          vendorId: item.vendId || "",
          vendorName: item.vendorName || item.vendEmplName || "",
          vendorEmployee: item.vendEmplId || "",
          vendorEmployeeName: item.vendEmplName || "",
          plc: item.billLabCatCd,
          plcDescription: item.plcDescription || item.description || "",
          billRate: item.billRtAmt,
          rateType: item.sBillRtTypeCd || "Select",
          startDate: formatDate(item.startDt),
          endDate: formatDate(item.endDt),
        }))
      );

      const newEditVendorBillRate = {};
      const newEditVendorFields = {};
      uniqueData.forEach((item) => {
        const id = item.id;
        newEditVendorBillRate[id] = item.billRtAmt;
        newEditVendorFields[id] = {
          lookupType: item.type || "Select",
          rateType: item.sBillRtTypeCd || "Select",
          startDate: formatDate(item.startDt),
          endDate: formatDate(item.endDt),
          vendorId: item.vendId || "",
          vendorName: item.vendorName || item.vendEmplName || "",
          vendorEmployee: item.vendEmplId || "",
          vendorEmployeeName: item.vendEmplName || "",
          plc: item.billLabCatCd,
          plcDescription: item.plcDescription,
        };
      });
      setEditVendorBillRate(newEditVendorBillRate);
      setEditVendorFields(newEditVendorFields);
    } catch (error) {
      // console.error("Error fetching vendor billing rates:", error);
      toast.error(
        `Failed to fetch vendor billing rates: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      // setLoading(false);
      setLoadingVendor(false);
    }
  }, [selectedProjectId]);

  // const handleUpdate = async (id) => {
  //   setLoadingAction((prev) => ({ ...prev, [id]: true })); // ✅ Fixed

  //   const currentItem = billingRatesSchedule.find((item) => item.id === id);
  //   const originalId = currentItem?.originalId || id; // ✅ Use original ID for API

  //   const updatedData = {
  //     plc: currentItem?.plc,
  //     billRate: editBillRate[id],
  //     rateType: editProjectPlcFields[id]?.rateType,
  //     startDate: editProjectPlcFields[id]?.startDate,
  //     endDate: editProjectPlcFields[id]?.endDate,
  //   };

  //   if (
  //     updatedData.startDate &&
  //     updatedData.endDate &&
  //     new Date(updatedData.startDate) > new Date(updatedData.endDate)
  //   ) {
  //     toast.error("End Date cannot be before Start Date.");
  //     setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
  //     return;
  //   }

  //   try {
  //     await axios.put(
  //       `${backendUrl}/api/ProjectPlcRates/bulk-billingrate`, // ✅ Use original ID
  //       {
  //         id: originalId, // ✅ Use original ID
  //         projId: selectedProjectId,
  //         laborCategoryCode: updatedData.plc,
  //         costRate: parseFloat(updatedData.billRate) * 0.65,
  //         billingRate: parseFloat(updatedData.billRate),
  //         effectiveDate: updatedData.startDate,
  //         endDate: updatedData.endDate || null,
  //         sBillRtTypeCd: updatedData.rateType,
  //         isActive: true,
  //         modifiedBy: "admin",
  //         createdAt: new Date().toISOString(),
  //         updatedAt: new Date().toISOString(),
  //       }
  //     );

  //     setBillingRatesSchedule((prev) =>
  //       prev.map((rate) =>
  //         rate.id === id
  //           ? {
  //               ...rate,
  //               billRate: parseFloat(updatedData.billRate),
  //               rateType: updatedData.rateType,
  //               startDate: updatedData.startDate,
  //               endDate: updatedData.endDate || null,
  //             }
  //           : rate
  //       )
  //     );
  //     setEditingProjectPlcRowId(null);
  //     toast.success("Billing rate updated successfully!");
  //   } catch (error) {
  //     // console.error("Error updating billing rate:", error);
  //     toast.error(
  //       `Failed to update billing rate: ${
  //         error.response?.data?.message || error.message
  //       }`
  //     );
  //   } finally {
  //     setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
  //   }
  // };

  const handleUpdateAllChanges = async () => {
    setLoading(true);

    try {
      // Prepare array of updated items based on editedBillRates keys
      const itemsToUpdate = Object.keys(editedBillRates)
        .map((idKey) => {
          const numericId = isNaN(Number(idKey)) ? idKey : Number(idKey);
          const currentItem = billingRatesSchedule.find(
            (item) => item.id === numericId
          );
          if (!currentItem) return null;

          // Parse the new bill rate string safely into a number
          const newBillRateStr = String(editedBillRates[idKey] ?? "");
          const newBillRateNum = parseFloat(newBillRateStr.replace(/,/g, ""));
          if (isNaN(newBillRateNum)) return null;

          // Parse original bill rate safely to number for comparison
          const originalBillRateNum = parseFloat(
            String(currentItem.billRate).replace(/,/g, "")
          );

          // Skip if no actual change in bill rate
          if (newBillRateNum === originalBillRateNum) {
            return null;
          }

          return {
            id: currentItem.originalId || currentItem.id,
            projId: selectedProjectId,
            laborCategoryCode: currentItem.plc,
            costRate: newBillRateNum * 0.65,
            billingRate: newBillRateNum,
            effectiveDate:
              editProjectPlcFields[idKey]?.startDate || currentItem.startDate,
            endDate:
              editProjectPlcFields[idKey]?.endDate ??
              currentItem.endDate ??
              null,
            sBillRtTypeCd:
              editProjectPlcFields[idKey]?.rateType || currentItem.rateType,
            isActive: true,
            modifiedBy: "admin",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        })
        .filter((item) => item !== null);

      if (itemsToUpdate.length === 0) {
        toast.warn("No changes to save.");
        setLoading(false);
        return;
      }

      // Send bulk PATCH request updating only changed records
      await axios.patch(
        `${backendUrl}/api/ProjectPlcRates/bulk-billingrate`,
        itemsToUpdate
      );

      // Update local state with the saved changes
      setBillingRatesSchedule((prev) =>
        prev.map((rate) => {
          const updated = itemsToUpdate.find(
            (item) => item.id === (rate.originalId || rate.id)
          );
          if (updated) {
            return {
              ...rate,
              billRate: updated.billingRate,
              rateType: updated.sBillRtTypeCd,
              startDate: updated.effectiveDate,
              endDate: updated.endDate,
            };
          }
          return rate;
        })
      );

      toast.success("Billing rates updated successfully!");

      // Clear edit states after successful save
      setEditedBillRates({});
      setEditProjectPlcFields({});
      setIsEditing(false);
    } catch (error) {
      toast.error(`Failed to update billing rates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorEmployees = useCallback(async () => {
    if (!selectedProjectId) {
      setVendorEmployees([]);
      return;
    }

    try {
      const response = await axios.get(
        `${backendUrl}/Project/GetVenderEmployeesByProject/${selectedProjectId}`
      );
      setVendorEmployees(response.data);
    } catch (error) {
      setVendorEmployees([]);
      // console.error("Error fetching vendor employees:", error);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchVendorEmployees();
  }, [fetchVendorEmployees]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this billing rate?")) {
      return; // User cancelled, do nothing
    }
    setLoading(true);
    try {
      await axios.delete(`${backendUrl}/api/ProjectPlcRates/${id}`);
      setBillingRatesSchedule((prev) => prev.filter((rate) => rate.id !== id));
      setEditBillRate((prev) => {
        const newEditBillRate = { ...prev };
        delete newEditBillRate[id];
        return newEditBillRate;
      });
      setEditProjectPlcFields((prev) => {
        const newEditProjectPlcFields = { ...prev };
        delete newEditProjectPlcFields[id];
        return newEditProjectPlcFields;
      });
      toast.success("Billing rate deleted successfully!");
    } catch (error) {
      // console.error("Error deleting billing rate:", error);
      toast.error(
        `Failed to delete billing rate: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleDeleteSelected = async () => {
  //   // Collect the synthetic IDs selected in the UI
  //   const selectedSyntheticIds = Object.entries(selectedRows)
  //     .filter(([id, selected]) => selected)
  //     .map(([id]) => id);

  //   if (selectedSyntheticIds.length === 0) {
  //     toast.warn("No rows selected for deletion.");
  //     return;
  //   }

  //   if (
  //     !window.confirm("Are you sure you want to delete selected billing rates?")
  //   ) {
  //     return;
  //   }

  //   // Map synthetic IDs to their corresponding original backend IDs
  //   const selectedOriginalIds = selectedSyntheticIds
  //     .map((syntheticId) => {
  //       const matchingItem = billingRatesSchedule.find(
  //         (item) => item.id === syntheticId
  //       );
  //       return matchingItem ? matchingItem.originalId || matchingItem.id : null;
  //     })
  //     .filter((id) => id !== null);

  //   setLoading(true);

  //   try {
  //     // Send original backend IDs in the bulk delete API
  //     await axios.delete(`${backendUrl}/api/ProjectPlcRates/bulk-delete`, {
  //       data: selectedOriginalIds,
  //     });

  //     // Filter out deleted items using synthetic IDs (used for UI state and rendering)
  //     setBillingRatesSchedule((prev) =>
  //       prev.filter((rate) => !selectedSyntheticIds.includes(rate.id))
  //     );

  //     setEditBillRate((prev) => {
  //       const newItems = { ...prev };
  //       selectedSyntheticIds.forEach((id) => delete newItems[id]);
  //       return newItems;
  //     });

  //     setEditProjectPlcFields((prev) => {
  //       const newItems = { ...prev };
  //       selectedSyntheticIds.forEach((id) => delete newItems[id]);
  //       return newItems;
  //     });

  //     toast.success("Selected billing rates deleted successfully!");
  //     setSelectedRows({});
  //   } catch (error) {
  //     toast.error(`Failed to delete billing rates: ${error.message}`);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleDeleteSelected = async () => {
    const selectedSyntheticIds = Object.entries(selectedRows)
      .filter(([id, selected]) => selected)
      .map(([id]) => id);

    if (selectedSyntheticIds.length === 0) {
      toast.warn("No rows selected for deletion.");
      return;
    }

    if (
      !window.confirm("Are you sure you want to delete selected billing rates?")
    ) {
      return;
    }

    const selectedOriginalIds = selectedSyntheticIds
      .map((syntheticId) => {
        const matchingItem = billingRatesSchedule.find(
          (item) => item.id === syntheticId
        );
        return matchingItem ? matchingItem.originalId : null;
      })
      .filter((id) => id !== null);

    setLoading(true);
    try {
      await axios.delete(`${backendUrl}/api/ProjectPlcRates/bulk-delete`, {
        data: selectedOriginalIds,
      });
      setBillingRatesSchedule((prev) =>
        prev.filter((rate) => !selectedSyntheticIds.includes(rate.id))
      );
      setSelectedRows({});
      toast.success("Selected billing rates deleted successfully!");
    } catch (error) {
      toast.error(`Failed to delete billing rates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setNewRate({
      plc: "",
      billRate: "",
      rateType: "",
      startDate: "",
      endDate: "",
    });
  };

  // const handleSaveNewRate = async () => {
  //   if (!newRate || !newRate.plc || !newRate.startDate || !newRate.billRate) {
  //     toast.error(
  //       "Please fill all required fields (PLC, Bill Rate, Start Date)."
  //     );
  //     return;
  //   }

  //   if (isNaN(newRate.billRate) || Number(newRate.billRate) <= 0) {
  //     toast.error("Bill Rate must be a valid number greater than 0.");
  //     return;
  //   }

  //   // if (
  //   //   newRate.startDate &&
  //   //   newRate.endDate &&
  //   //   new Date(newRate.startDate) > new Date(newRate.endDate)
  //   // ) {
  //   //   toast.error("End Date cannot be before Start Date.");
  //   //   return;
  //   // }

  //   if (
  //     newRate.startDate &&
  //     newRate.endDate &&
  //     new Date(newRate.startDate) > new Date(newRate.endDate)
  //   ) {
  //     toast.error("End Date cannot be before Start Date.");
  //     return;
  //   }

  //   // ✅ Project boundaries
  //   const projectStart = new Date(selectedPlan.projStartDt);
  //   const projectEnd = new Date(selectedPlan.projEndDt);

  //   if (newRate.startDate) {
  //     const start = new Date(newRate.startDate);

  //     if (start < projectStart) {
  //       toast.error("Start Date cannot be before Project Start Date.");
  //       return;
  //     }

  //     if (start > projectEnd) {
  //       toast.error("Start Date cannot be after Project End Date.");
  //       return;
  //     }
  //   }

  //   if (newRate.endDate) {
  //     const end = new Date(newRate.endDate);

  //     if (end < projectStart) {
  //       toast.error("End Date cannot be before Project Start Date.");
  //       return;
  //     }

  //     if (end > projectEnd) {
  //       toast.error("End Date cannot be after Project End Date.");
  //       return;
  //     }
  //   }

  //   setLoading(true);
  //   try {
  //     await axios.post(`${backendUrl}/api/ProjectPlcRates`, {
  //       id: 0,
  //       projId: selectedProjectId,
  //       laborCategoryCode: newRate.plc,
  //       costRate: parseFloat(newRate.billRate) * 0.65,
  //       billingRate: parseFloat(newRate.billRate),
  //       effectiveDate: newRate.startDate,
  //       endDate: newRate.endDate || null,
  //       sBillRtTypeCd: newRate.rateType,
  //       isActive: true,
  //       modifiedBy: "admin",
  //       createdAt: new Date().toISOString(),
  //       updatedAt: new Date().toISOString(),
  //     });
  //     setNewRate(null);
  //     const fetchResponse = await axios.get(
  //       `${backendUrl}/api/ProjectPlcRates`
  //     );
  //     const filteredData = fetchResponse.data.filter((item) =>
  //       item.projId.toLowerCase().startsWith(selectedProjectId.toLowerCase())
  //     );
  //     setBillingRatesSchedule(
  //       filteredData.map((item) => ({
  //         id: item.id,
  //         plc: item.laborCategoryCode,
  //         billRate: item.billingRate,
  //         // rateType: item.rateType || "Select",
  //         rateType: item.sBillRtTypeCd || "Select",
  //         startDate: formatDate(item.effectiveDate),
  //         endDate: formatDate(item.endDate),
  //       }))
  //     );
  //     const newEditBillRate = {};
  //     const newEditProjectPlcFields = {};
  //     filteredData.forEach((item) => {
  //       newEditBillRate[item.id] = item.billingRate;
  //       newEditProjectPlcFields[item.id] = {
  //         rateType: item.rateType || "Select",
  //         startDate: formatDate(item.effectiveDate),
  //         endDate: formatDate(item.endDate),
  //       };
  //     });
  //     setEditBillRate(newEditBillRate);
  //     setEditProjectPlcFields(newEditProjectPlcFields);

  //     toast.success("New billing rate added successfully!");
  //   } catch (error) {
  //     // console.error(
  //     //   "Error adding billing rate:",
  //     //   error.response ? error.response.data : error.message
  //     // );
  //     toast.error(
  //       `Failed to add billing rate: ${
  //         error.response?.data?.message || error.message
  //       }`
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSaveNewRate = async () => {
    if (!newRate || !newRate.plc || !newRate.startDate || !newRate.billRate) {
      toast.error(
        "Please fill all required fields (PLC, Bill Rate, Start Date)."
      );
      return;
    }

    if (isNaN(newRate.billRate) || Number(newRate.billRate) <= 0) {
      toast.error("Bill Rate must be a valid number greater than 0.");
      return;
    }

    if (
      newRate.startDate &&
      newRate.endDate &&
      new Date(newRate.startDate) > new Date(newRate.endDate)
    ) {
      toast.error("End Date cannot be before Start Date.");
      return;
    }

    // Project boundaries
    const projectStart = new Date(selectedPlan.projStartDt);
    const projectEnd = new Date(selectedPlan.projEndDt);

    if (newRate.startDate) {
      const start = new Date(newRate.startDate);
      if (start < projectStart) {
        toast.error("Start Date cannot be before Project Start Date.");
        return;
      }
      if (start > projectEnd) {
        toast.error("Start Date cannot be after Project End Date.");
        return;
      }
    }

    if (newRate.endDate) {
      const end = new Date(newRate.endDate);
      if (end < projectStart) {
        toast.error("End Date cannot be before Project Start Date.");
        return;
      }
      if (end > projectEnd) {
        toast.error("End Date cannot be after Project End Date.");
        return;
      }
    }

    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/ProjectPlcRates`, {
        id: 0,
        projId: selectedProjectId,
        laborCategoryCode: newRate.plc,
        costRate: parseFloat(newRate.billRate) * 0.65,
        billingRate: parseFloat(newRate.billRate),
        effectiveDate: newRate.startDate,
        endDate: newRate.endDate || null,
        sBillRtTypeCd: newRate.rateType,
        isActive: true,
        modifiedBy: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setNewRate(null);

      // Fetch refreshed table data for current project
      const fetchResponse = await axios.get(
        `${backendUrl}/api/ProjectPlcRates`
      );
      const filteredData = fetchResponse.data.filter((item) =>
        item.projId.toLowerCase().startsWith(selectedProjectId.toLowerCase())
      );

      setBillingRatesSchedule(
        filteredData.map((item) => ({
          id: item.id,
          plc: item.laborCategoryCode,
          billRate: item.billingRate,
          rateType: item.sBillRtTypeCd || "Select",
          startDate: formatDate(item.effectiveDate),
          endDate: formatDate(item.endDate),
        }))
      );

      // --- New: Auto-select new record after save ---
      if (filteredData.length > 0) {
        // Find the highest id (assuming new records get highest id)
        const newest = filteredData.reduce(
          (a, b) => (a.id > b.id ? a : b),
          filteredData[0]
        );
        setSelectedRows({ [newest.id]: true }); // Auto-select
      } else {
        setSelectedRows({});
      }

      // Update edit arrays
      const newEditBillRate = {};
      const newEditProjectPlcFields = {};
      filteredData.forEach((item) => {
        newEditBillRate[item.id] = item.billingRate;
        newEditProjectPlcFields[item.id] = {
          rateType: item.sBillRtTypeCd || "Select",
          startDate: formatDate(item.effectiveDate),
          endDate: formatDate(item.endDate),
        };
      });
      setEditBillRate(newEditBillRate);
      setEditProjectPlcFields(newEditProjectPlcFields);
      fetchBillingRates();
      toast.success("New billing rate added successfully!");
    } catch (error) {
      toast.error(
        `Failed to add billing rate: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewRateChange = (field, value) => {
    if (field === "billRate") {
      // Allow only digits, commas, and ONE decimal point
      if (!/^\d{0,3}(?:,?\d{3})*(?:\.\d*)?$/.test(value) && value !== "") {
        return; // ignore invalid input
      }

      // Keep value as-is (don't parse here, so user can type 4.5 naturally)
      setNewRate((prev) => ({ ...prev, [field]: value }));
      return;
    }

    setNewRate((prev) => ({ ...prev, [field]: value }));
  };

  const handleBillRateChange = (id, value) => {
    // Allow only digits, commas, and one decimal
    if (!/^\d{0,3}(?:,?\d{3})*(?:\.\d*)?$/.test(value) && value !== "") {
      return; // ignore invalid input
    }

    setEditBillRate((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleProjectPlcFieldChange = (id, field, value) => {
    setEditProjectPlcFields((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleEditProjectPlcRow = (id) => {
    setEditingProjectPlcRowId(id);
    const currentRow = billingRatesSchedule.find((item) => item.id === id);
    if (currentRow) {
      setEditProjectPlcFields((prev) => ({
        ...prev,
        [id]: {
          rateType: currentRow.rateType,
          startDate: currentRow.startDate,
          endDate: currentRow.endDate,
        },
      }));
      setEditBillRate((prev) => ({
        ...prev,
        [id]: currentRow.billRate,
      }));
    }
  };

  // Employee Billing Rates Handlers
  const handleAddEmployeeRow = () => {
    setNewEmployeeRate({
      lookupType: "",
      empId: "",
      employeeName: "",
      plc: "",
      plcDescription: "",
      billRate: "",
      rateType: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleSaveNewEmployeeRate = async () => {
    if (
      !newEmployeeRate ||
      !newEmployeeRate.empId ||
      !newEmployeeRate.plc ||
      !newEmployeeRate.startDate ||
      !newEmployeeRate.billRate
    ) {
      // console.error(
      //   "Please fill all required fields (Employee, PLC, Bill Rate, Start Date)"
      // );
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${backendUrl}/ProjEmplRt`, {
        id: 0,
        projId: selectedProjectId,
        emplId: newEmployeeRate.empId,
        employeeName: newEmployeeRate.employeeName,
        billLabCatCd: newEmployeeRate.plc,
        billRtAmt: parseFloat(newEmployeeRate.billRate),
        startDt: newEmployeeRate.startDate,
        endDt: newEmployeeRate.endDate || null,
        sBillRtTypeCd: newEmployeeRate.rateType,
        type: newEmployeeRate.lookupType,
        isActive: true,
        modifiedBy: "admin",
      });
      setNewEmployeeRate(null);
      const fetchResponse = await axios.get(`${backendUrl}/ProjEmplRt`);
      const filteredData = fetchResponse.data.filter(
        (item) =>
          item.projId
            .toLowerCase()
            .startsWith(selectedProjectId.toLowerCase()) && item.emplId
      );
      setEmployeeBillingRates(
        filteredData.map((item) => ({
          id: item.projEmplRtKey || item.id,
          lookupType: item.type || "Select",
          empId: item.emplId,
          employeeName:
            item.employeeName ||
            employees.find((emp) => emp.empId === item.emplId)?.employeeName ||
            "",
          plc: item.billLabCatCd,
          plcDescription: item.plcDescription || "",
          billRate: item.billRtAmt,
          rateType: item.sBillRtTypeCd || "Select",
          startDate: item.startDt ? item.startDt.split("T")[0] : "",
          endDate: item.endDt ? item.endDt.split("T")[0] : null,
        }))
      );
      const newEditEmployeeBillRate = {};
      const newEditEmployeeFields = {};
      filteredData.forEach((item) => {
        const id = item.projEmplRtKey || item.id;
        if (id) {
          newEditEmployeeBillRate[id] = item.billRtAmt;
          newEditEmployeeFields[id] = {
            lookupType: item.type || "Select",
            rateType: item.sBillRtTypeCd || "Select",
            startDate: item.startDt ? item.startDt.split("T")[0] : "",
            endDate: item.endDt ? item.endDt.split("T")[0] : null,
          };
        }
      });
      setEditEmployeeBillRate(newEditEmployeeBillRate);
      setEditEmployeeFields(newEditEmployeeFields);
      fetchEmployeeBillingRates();
      toast.success("Added Sucessfully");
    } catch (error) {
      // console.error(
      //   "Error adding employee billing rate:",
      //   error.response ? error.response.data : error.message
      // );
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeBillRateChange = (id, value) => {
    // ✅ allow only numbers, commas, and decimals while typing
    if (!/^[0-9,]*\.?[0-9]*$/.test(value) && value !== "") {
      return; // ❌ ignore invalid input
    }

    // Remove commas for validation/storage
    const cleanValue = value.replace(/,/g, "");

    if (cleanValue !== "" && (isNaN(cleanValue) || Number(cleanValue) <= 0)) {
      toast.error("Bill Rate must be a valid number greater than 0.");
      return;
    }

    setEditEmployeeBillRate((prev) => ({
      ...prev,
      [id]: cleanValue, // store clean number string
    }));
  };

  const handleUpdateEmployee = async (id) => {
    if (!id) {
      // console.error("Invalid ID for update");
      return;
    }

    setLoadingAction((prev) => ({ ...prev, [id]: true })); // ✅ Fixed

    const updatedData = employeeBillingRates.find((item) => item.id === id);
    const originalId = updatedData?.originalId || id; // ✅ Use original ID
    const fields = editEmployeeFields[id] || {};

    if (
      fields.startDate &&
      fields.endDate &&
      new Date(fields.startDate) > new Date(fields.endDate)
    ) {
      toast.error("End Date cannot be before Start Date.");
      setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
      return;
    }

    try {
      await axios.put(`${backendUrl}/ProjEmplRt/${originalId}`, {
        // ✅ Use original ID
        projEmplRtKey: originalId, // ✅ Use original ID
        projId: selectedProjectId,
        emplId: fields.empId || updatedData.empId,
        employeeName: fields.employeeName || updatedData.employeeName,
        billLabCatCd: fields.plc || updatedData.plc,
        billRtAmt: parseFloat(editEmployeeBillRate[id] ?? updatedData.billRate),
        startDt: fields.startDate || updatedData.startDate,
        endDt: fields.endDate || updatedData.endDate || null,
        sBillRtTypeCd: fields.rateType || updatedData.rateType,
        type: fields.lookupType || updatedData.lookupType,
        isActive: true,
        modifiedBy: "admin",
      });

      // Update local state with the saved changes
      setEmployeeBillingRates((prev) =>
        prev.map((rate) =>
          rate.id === id
            ? {
                ...rate,
                lookupType: fields.lookupType || updatedData.lookupType,
                empId: fields.empId || updatedData.empId,
                employeeName: fields.employeeName || updatedData.employeeName,
                plc: fields.plc || updatedData.plc,
                plcDescription:
                  plcs.find(
                    (plc) =>
                      plc.laborCategoryCode === (fields.plc || updatedData.plc)
                  )?.description ||
                  fields.plcDescription ||
                  updatedData.plcDescription,
                billRate: parseFloat(
                  editEmployeeBillRate[id] ?? updatedData.billRate
                ),
                rateType: fields.rateType || updatedData.rateType,
                startDate: fields.startDate || updatedData.startDate,
                endDate: fields.endDate || updatedData.endDate || null,
              }
            : rate
        )
      );
      setEditingEmployeeRowId(null);
      toast.success("Employee billing rate updated successfully!");
    } catch (error) {
      // console.error("Error updating employee billing rate:", error);
      toast.error(
        `Failed to update employee billing rate: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
    }
  };

  const handleUpdateAllEmployeeChanges = async () => {
    setLoading(true);
    try {
      // Prepare items to update based on the edited bill rates keys
      const itemsToUpdate = Object.keys(editEmployeeBillRate)
        .map((idKey) => {
          const numericId = isNaN(Number(idKey)) ? idKey : Number(idKey);
          const currentItem = employeeBillingRates.find(
            (item) => item.id === numericId
          );
          if (!currentItem) return null;

          const newBillRateStr = String(editEmployeeBillRate[idKey] ?? "");
          const newBillRateNum = parseFloat(newBillRateStr.replace(/,/g, ""));

          if (isNaN(newBillRateNum)) return null;
          if (newBillRateNum === currentItem.billRate) return null; // skip if no change

          const fields = editEmployeeFields[idKey] || {};

          return {
            projEmplRtKey: currentItem.originalId || currentItem.id,
            projId: selectedProjectId,
            emplId: fields.empId || currentItem.empId,
            billLabCatCd: fields.plc || currentItem.plc,
            plcDescription: fields.plcDescription || currentItem.plcDescription,
            billRtAmt: newBillRateNum,
            sBillRtTypeCd: fields.rateType || currentItem.rateType,
            startDt: fields.startDate || currentItem.startDate,
            endDt: fields.endDate || currentItem.endDate || null,
            modifiedBy: "admin",
            timeStamp: currentItem.timeStamp,
            rowVersion: currentItem.rowVersion,
            companyId: currentItem.companyId,
            type: fields.lookupType || currentItem.lookupType,
            billDiscRt: currentItem.billDiscRt || 0,
            emplName: fields.employeeName || currentItem.employeeName,
          };
        })
        .filter((item) => item !== null);

      if (itemsToUpdate.length === 0) {
        toast.warn("No changes to save.");
        setLoading(false);
        return;
      }

      // Call bulk update API
      await axios.patch(
        `${backendUrl}/ProjEmplRt/bulk-billingrate`,
        itemsToUpdate
      );

      // Update local state with new bill rates for changed items
      setEmployeeBillingRates((prev) =>
        prev.map((rate) => {
          const updated = itemsToUpdate.find(
            (item) => item.projEmplRtKey === (rate.originalId || rate.id)
          );
          if (updated) {
            return {
              ...rate,
              lookupType: updated.type,
              empId: updated.emplId,
              employeeName: updated.emplName,
              plc: updated.billLabCatCd,
              plcDescription: updated.plcDescription,
              billRate: updated.billRtAmt,
              rateType: updated.sBillRtTypeCd,
              startDate: updated.startDt,
              endDate: updated.endDt,
            };
          }
          return rate;
        })
      );

      setEditEmployeeBillRate({});
      setEditEmployeeFields({});
      setIsEmployeeEditing(false);
      toast.success("Employee billing rates updated successfully!");
    } catch (error) {
      toast.error(
        `Failed to update employee billing rates: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleDeleteEmployee = async (id) => {
  //   if (
  //     !window.confirm(
  //       "Are you sure you want to delete this employee billing rate?"
  //     )
  //   ) {
  //     return;
  //   }
  //   if (!id) {
  //     // console.error("Invalid ID for deletion");
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     await axios.delete(`${backendUrl}/ProjEmplRt/${id}`);
  //     setEmployeeBillingRates((prev) => prev.filter((rate) => rate.id !== id));
  //     setEditEmployeeBillRate((prev) => {
  //       const newEditEmployeeBillRate = { ...prev };
  //       delete newEditEmployeeBillRate[id];
  //       return newEditEmployeeBillRate;
  //     });
  //     setEditEmployeeFields((prev) => {
  //       const newEditEmployeeFields = { ...prev };
  //       delete newEditEmployeeFields[id];
  //       return newEditEmployeeFields;
  //     });
  //     setEditingEmployeeRowId(null);
  //     toast.success("Employee billing rate deleted successfully!");
  //   } catch (error) {
  //     // console.error("Error deleting employee billing rate:", error);
  //     toast.error(
  //       `Failed to delete employee billing rate: ${
  //         error.response?.data?.message || error.message
  //       }`
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleDeleteEmployee = async () => {
    // Get selected synthetic IDs from UI state
    const selectedSyntheticIds = Object.entries(selectedEmployeeRows)
      .filter(([id, selected]) => selected)
      .map(([id]) => id);

    if (selectedSyntheticIds.length === 0) {
      toast.warn("No rows selected for deletion.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete selected employee billing rates?"
      )
    ) {
      return;
    }

    // Map synthetic UI IDs to original employee IDs expected by backend
    const selectedOriginalIds = selectedSyntheticIds
      .map((syntheticId) => {
        const matchingItem = employeeBillingRates.find(
          (item) => item.id === syntheticId
        );
        return matchingItem ? matchingItem.originalId || matchingItem.id : null;
      })
      .filter((id) => id !== null);

    setLoading(true);

    try {
      await axios.delete(`${backendUrl}/ProjEmplRt/bulk-delete`, {
        data: selectedOriginalIds,
      });

      // Update UI state filtering synthetic ids
      setEmployeeBillingRates((prev) =>
        prev.filter((rate) => !selectedSyntheticIds.includes(rate.id))
      );

      setEditEmployeeBillRate((prev) => {
        const newItems = { ...prev };
        selectedSyntheticIds.forEach((id) => delete newItems[id]);
        return newItems;
      });

      setEditEmployeeFields((prev) => {
        const newItems = { ...prev };
        selectedSyntheticIds.forEach((id) => delete newItems[id]);
        return newItems;
      });

      toast.success("Selected employee billing rates deleted successfully!");
      setSelectedEmployeeRows({});
    } catch (error) {
      toast.error(`Failed to delete employee billing rates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNewEmployeeRateChange = (field, value, id = null) => {
    const updateState = (prev, selectedEmp = null, selectedPlc = null) => {
      // ✅ Special handling for billRate
      if (field === "billRate") {
        // Only allow digits, commas, decimals
        if (!/^[0-9,]*\.?[0-9]*$/.test(value) && value !== "") {
          return prev; // ❌ invalid → don't update
        }
        // Clean commas for storage
        const cleanValue = value.replace(/,/g, "");
        return { ...prev, [field]: cleanValue };
      }

      const updated = {
        ...prev,
        [field]: value,
        ...(field === "empId" && selectedEmp
          ? { employeeName: selectedEmp.employeeName }
          : {}),
        ...(field === "plc" && selectedPlc
          ? { plcDescription: selectedPlc.description }
          : {}),
      };

      // ✅ Date validations
      if (updated.startDate && updated.endDate) {
        if (new Date(updated.startDate) > new Date(updated.endDate)) {
          toast.error("End Date cannot be before Start Date.");
          return prev;
        }
      }

      if (updated.startDate) {
        if (
          new Date(updated.startDate) < new Date(selectedPlan.projStartDt) ||
          new Date(updated.startDate) > new Date(selectedPlan.projEndDt)
        ) {
          toast.error("Start Date must be within project dates.");
          return prev;
        }
      }

      if (updated.endDate) {
        if (
          new Date(updated.endDate) < new Date(selectedPlan.projStartDt) ||
          new Date(updated.endDate) > new Date(selectedPlan.projEndDt)
        ) {
          toast.error("End Date must be within project dates.");
          return prev;
        }
      }

      return updated; // ✅ valid update
    };

    if (id) {
      // Editing existing row
      const selectedEmp =
        field === "empId" ? employees.find((emp) => emp.empId === value) : null;
      const selectedPlc =
        field === "plc"
          ? plcs.find((plc) => plc.laborCategoryCode === value)
          : null;

      setEditEmployeeFields((prev) => ({
        ...prev,
        [id]: updateState(prev[id] || {}, selectedEmp, selectedPlc),
      }));
    } else {
      // Adding new row
      const selectedEmp =
        field === "empId" ? employees.find((emp) => emp.empId === value) : null;
      const selectedPlc =
        field === "plc"
          ? plcs.find((plc) => plc.laborCategoryCode === value)
          : null;

      setNewEmployeeRate((prev) => updateState(prev, selectedEmp, selectedPlc));
    }
  };

  const handleEditEmployeeRow = (id) => {
    setEditingEmployeeRowId(id);
    const currentRow = employeeBillingRates.find((item) => item.id === id);
    if (currentRow) {
      setEditEmployeeFields((prev) => ({
        ...prev,
        [id]: {
          // lookupType: currentRow.lookupType,
          empId: currentRow.empId,
          employeeName: currentRow.employeeName,
          plc: currentRow.plc,
          plcDescription: currentRow.plcDescription,
          rateType: currentRow.rateType,
          startDate: currentRow.startDate,
          endDate: currentRow.endDate,
        },
      }));
      setEditEmployeeBillRate((prev) => ({
        ...prev,
        [id]: currentRow.billRate,
      }));
    }
  };

  // Vendor Billing Rates Handlers
  const handleAddVendorRow = () => {
    setNewVendorRate({
      lookupType: "",
      vendorId: "",
      vendorName: "",
      vendorEmployee: "",
      vendorEmployeeName: "",
      plc: "",
      plcDescription: "",
      billRate: "",
      rateType: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleSaveNewVendorRate = async () => {
    if (
      !newVendorRate ||
      !newVendorRate.vendorId ||
      !newVendorRate.vendorName ||
      !newVendorRate.plc ||
      !newVendorRate.startDate ||
      !newVendorRate.billRate
    ) {
      // console.error(
      //   "Please fill all required fields (Vendor ID, Vendor Name, PLC, Bill Rate, Start Date)"
      // );
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${backendUrl}/ProjVendRt`, {
        id: 0,
        projId: selectedPlan?.projId || selectedProjectId,
        vendId: newVendorRate.vendorId,
        vendEmplId: newVendorRate.vendorEmployee,
        billLabCatCd: newVendorRate.plc,
        billDiscRt: 0,
        companyId: "1",
        billRtAmt: parseFloat(newVendorRate.billRate),
        startDt: new Date(newVendorRate.startDate).toISOString(),
        endDt: newVendorRate.endDate
          ? new Date(newVendorRate.endDate).toISOString()
          : null,
        sBillRtTypeCd: newVendorRate.rateType,
        type: newVendorRate.lookupType,
        modifiedBy: "admin",
        timeStamp: new Date().toISOString(),
      });
      setNewVendorRate(null);
      const fetchResponse = await axios.get(`${backendUrl}/ProjVendRt`);
      const filteredData = fetchResponse.data.filter((item) =>
        item.projId.toLowerCase().startsWith(selectedProjectId.toLowerCase())
      );
      // setVendorBillingRates(
      //   filteredData.map((item) => ({
      //     id: item.id,
      //     lookupType: item.type || "Select",
      //     vendorId: item.vendId || "",
      //     // vendorName: item.vendorName || "",
      //     // vendorEmployee: item.vendEmplId || "",
      //     vendorName: item.vendEmplName || newVendorRate.vendorName || "", // Use vendEmplName or fallback to newVendorRate.vendorName
      //     vendorEmployee: item.vendEmplId || "",
      //     vendorEmployeeName: item.vendEmplName || "",
      //     plc: item.billLabCatCd,
      //     plcDescription: item.description || "",
      //     billRate: item.billRtAmt,
      //     rateType: item.sBillRtTypeCd || "Select",
      //     startDate: new Date(item.startDt).toISOString().split("T")[0],
      //     endDate: item.endDt
      //       ? new Date(item.endDt).toISOString().split("T")[0]
      //       : null,
      //   }))
      // );
      setVendorBillingRates(
        filteredData.map((item) => ({
          id: item.projVendRtKey || item.id,
          projVendRtKey: item.projVendRtKey,
          lookupType: item.type || "Select",
          vendorId: item.vendId || "",
          vendorName:
            item.vendEmplName || newVendorRate.vendorEmployeeName || "", // Use vendEmplName
          vendorEmployee: item.vendEmplId || "",
          vendorEmployeeName:
            item.vendEmplName || newVendorRate.vendorEmployeeName || "", // Use vendEmplName
          plc: item.billLabCatCd,
          plcDescription: item.plcDescription || "",
          billRate: item.billRtAmt,
          rateType: item.sBillRtTypeCd || "Select",
          // startDate: new Date(item.startDt).toISOString().split("T")[0],
          // endDate: item.endDt
          //   ? new Date(item.endDt).toISOString().split("T")[0]
          //   : null,
          startDate: formatDate(item.startDt),
          endDate: formatDate(item.endDt),
        }))
      );
      const newEditVendorBillRate = {};
      const newEditVendorFields = {};
      filteredData.forEach((item) => {
        newEditVendorBillRate[item.id] = item.billRtAmt;
        newEditVendorFields[item.id] = {
          lookupType: item.type || "Select",
          rateType: item.sBillRtTypeCd || "Select",
          startDate: new Date(item.startDt).toISOString().split("T")[0],
          endDate: item.endDt
            ? new Date(item.endDt).toISOString().split("T")[0]
            : null,
        };
      });
      setEditVendorBillRate(newEditVendorBillRate);
      setEditVendorFields(newEditVendorFields);
      fetchVendorBillingRates();
      toast.success("Added Successfully!");
    } catch (error) {
      // console.error(
      //   "Error adding vendor billing rate:",
      //   error.response ? error.response.data : error.message
      // );
    } finally {
      setLoading(false);
    }
  };

  const handleVendorBillRateChange = (id, value) => {
    // ✅ Allow only digits, commas, and decimals
    if (!/^[0-9,]*\.?[0-9]*$/.test(value) && value !== "") {
      return; // ignore invalid characters
    }

    // ✅ Clean commas
    const clean = value.replace(/,/g, "");

    // ✅ Reject 0 or negative values
    if (clean !== "" && parseFloat(clean) <= 0) {
      toast.error("Bill Rate must be greater than 0.");
      return;
    }

    setEditVendorBillRate((prev) => ({
      ...prev,
      [id]: clean, // keep numeric string (so "2.5" stays "2.5")
    }));
  };

  const handleUpdateVendor = async (id) => {
    setLoadingAction((prev) => ({ ...prev, [id]: true })); // ✅ Fixed

    const row = vendorBillingRates.find((r) => r.id === id);
    const originalId = row?.originalId || row?.projVendRtKey || id; // ✅ Use original ID
    const fields = editVendorFields[id] || {};

    if (
      fields.startDate &&
      fields.endDate &&
      new Date(fields.startDate) > new Date(fields.endDate)
    ) {
      toast.error("End Date cannot be before Start Date.");
      setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
      return;
    }

    try {
      await axios.put(
        `${backendUrl}/ProjVendRt/${originalId}`, // ✅ Use original ID
        {
          projVendRtKey: originalId, // ✅ Use original ID
          projId: selectedProjectId,
          vendId: fields.vendorId || row.vendorId,
          vendEmplId: fields.vendorEmployee || row.vendorEmployee,
          billLabCatCd: fields.plc || row.plc,
          billDiscRt: 0,
          companyId: "1",
          billRtAmt: parseFloat(editVendorBillRate[id] ?? row.billRate),
          startDt: new Date(fields.startDate || row.startDate).toISOString(),
          endDt: fields.endDate
            ? new Date(fields.endDate).toISOString()
            : row.endDate
            ? new Date(row.endDate).toISOString()
            : null,
          sBillRtTypeCd: fields.rateType || row.rateType,
          type: fields.lookupType || row.lookupType,
          modifiedBy: "admin",
          timeStamp: new Date().toISOString(),
        }
      );

      setVendorBillingRates((prev) =>
        prev.map((rate) =>
          rate.id === id
            ? {
                ...rate,
                lookupType: fields.lookupType || rate.lookupType,
                vendorId: fields.vendorId || rate.vendorId,
                vendorName: fields.vendorName || rate.vendorName,
                vendorEmployee: fields.vendorEmployee || rate.vendorEmployee,
                vendorEmployeeName:
                  fields.vendorEmployeeName || rate.vendorEmployeeName,
                plc: fields.plc || rate.plc,
                plcDescription:
                  plcs.find(
                    (plc) => plc.laborCategoryCode === (fields.plc || rate.plc)
                  )?.description ||
                  fields.plcDescription ||
                  rate.plcDescription,
                billRate: parseFloat(editVendorBillRate[id] ?? rate.billRate),
                rateType: fields.rateType || rate.rateType,
                startDate: fields.startDate || rate.startDate,
                endDate: fields.endDate || rate.endDate || null,
              }
            : rate
        )
      );
      setEditingVendorRowId(null);
      toast.success("Vendor billing rate updated successfully!");
    } catch (error) {
      // console.error("Error updating vendor billing rate:", error);
      toast.error(
        `Failed to update vendor billing rate: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
    }
  };

  const handleUpdateAllVendors = async () => {
    setLoading(true);
    try {
      // Prepare payload - include only vendors with changed bill rates
      const vendorsToUpdate = Object.entries(editVendorBillRate)
        .map(([idKey, editedRate]) => {
          const id = isNaN(Number(idKey)) ? idKey : Number(idKey);
          const current = vendorBillingRates.find((v) => v.id === id);
          if (!current) return null;

          const cleanedRateStr =
            typeof editedRate === "string"
              ? editedRate.replace(/,/g, "")
              : editedRate;
          const newBillRate = parseFloat(cleanedRateStr);

          // Skip if not a valid number or unchanged
          if (isNaN(newBillRate) || newBillRate === current.billRate)
            return null;

          const fields = editVendorFields[idKey] || {};

          return {
            projVendRtKey:
              current.originalId || current.projVendRtKey || current.id,
            projId: selectedProjectId,
            vendId: fields.vendorId || current.vendorId,
            vendEmplId: fields.vendorEmployee || current.vendorEmployee,
            billLabCatCd: fields.plc || current.plc,
            billRtAmt: newBillRate,
            sBillRtTypeCd: fields.rateType || current.rateType,
            startDt: fields.startDate
              ? new Date(fields.startDate).toISOString()
              : new Date(current.startDate).toISOString(),
            endDt: fields.endDate
              ? new Date(fields.endDate).toISOString()
              : current.endDate
              ? new Date(current.endDate).toISOString()
              : null,
            modifiedBy: "admin",
            timeStamp: new Date().toISOString(),
            rowVersion: current.rowVersion,
            companyId: current.companyId || "1",
            type: fields.lookupType || current.lookupType,
            billDiscRt: current.billDiscRt || 0,
            vendEmplName:
              fields.vendorEmployeeName || current.vendorEmployeeName,
            plcDescription: fields.plcDescription || current.plcDescription,
          };
        })
        .filter(Boolean);

      if (vendorsToUpdate.length === 0) {
        toast.warn("No vendor billing rates were changed.");
        setLoading(false);
        return;
      }

      // Call bulk update API endpoint
      await axios.patch(
        `${backendUrl}/ProjVendRt/bulk-billingrate`,
        vendorsToUpdate
      );

      // Update local vendorBillingRates state with changes
      setVendorBillingRates((prev) =>
        prev.map((vendor) => {
          const updated = vendorsToUpdate.find(
            (v) =>
              v.projVendRtKey ===
              (vendor.originalId || vendor.projVendRtKey || vendor.id)
          );
          return updated
            ? {
                ...vendor,
                lookupType: updated.type,
                vendorId: updated.vendId,
                vendorEmployee: updated.vendEmplId,
                vendorEmployeeName: updated.vendEmplName,
                plc: updated.billLabCatCd,
                plcDescription: updated.plcDescription,
                billRate: updated.billRtAmt,
                rateType: updated.sBillRtTypeCd,
                startDate: updated.startDt,
                endDate: updated.endDt,
              }
            : vendor;
        })
      );

      // Clear editing states
      setEditVendorBillRate({});
      setEditVendorFields({});
      setIsVendorEditing(false);
      toast.success("Vendor billing rates updated successfully.");
    } catch (error) {
      toast.error(
        `Failed to update vendor billing rates: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this vendor billing rate?"
      )
    ) {
      return;
    }
    const rate = vendorBillingRates.find((rate) => rate.id === id);
    const deleteId = rate?.projVendRtKey || id; // Use projVendRtKey if available
    setLoadingAction((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.delete(`${backendUrl}/ProjVendRt/${deleteId}`);
      setVendorBillingRates((prev) => prev.filter((rate) => rate.id !== id));
      setEditVendorBillRate((prev) => {
        const newEditVendorBillRate = { ...prev };
        delete newEditVendorBillRate[id];
        return newEditVendorBillRate;
      });
      setEditVendorFields((prev) => {
        const newEditVendorFields = { ...prev };
        delete newEditVendorFields[id];
        return newEditVendorFields;
      });
      setEditingVendorRowId(null);
      toast.success("Vendor billing rate deleted successfully!");
    } catch (error) {
      // console.error("Error deleting vendor billing rate:", error);
      toast.error(
        `Failed to delete vendor billing rate: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoadingAction((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteSelectedVendors = async () => {
    // Extract only IDs that are checked (truthy in selectedVendorRows)
    const selectedIds = vendorBillingRates
      .filter((item) => selectedVendorRows[item.id])
      .map((item) => item.projVendRtKey ?? item.id);

    if (selectedIds.length === 0) {
      toast.warn("No vendor billing rates selected for deletion.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} selected vendor billing rate(s)?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${backendUrl}/ProjVendRt/bulk-delete`, {
        data: selectedIds,
      });

      console.log(JSON.stringify(selectedIds));

      // Remove deleted vendors from local state
      setVendorBillingRates((prev) =>
        prev.filter(
          (vendor) => !selectedIds.includes(vendor.projVendRtKey ?? vendor.id)
        )
      );

      // Clean up selection and editing state for removed IDs
      setSelectedVendorRows((prev) => {
        const updated = { ...prev };
        selectedIds.forEach((id) => {
          delete updated[id];
        });
        return updated;
      });
      setEditVendorBillRate((prev) => {
        const updated = { ...prev };
        selectedIds.forEach((id) => {
          delete updated[id];
        });
        return updated;
      });
      setEditVendorFields((prev) => {
        const updated = { ...prev };
        selectedIds.forEach((id) => {
          delete updated[id];
        });
        return updated;
      });

      setEditingVendorRowId(null);

      toast.success("Selected vendor billing rates deleted successfully!");
    } catch (error) {
      toast.error(
        `Failed to delete selected vendor billing rates: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewVendorRateChange = (field, value) => {
    setNewVendorRate((prev) => {
      let updated = { ...prev, [field]: value };

      // ✅ Bill Rate validation
      if (field === "billRate") {
        // Allow only digits, commas, and ONE decimal
        if (!/^[0-9,]*\.?[0-9]*$/.test(value) && value !== "") {
          toast.error("Bill Rate must contain only numbers and decimal.");
          return prev;
        }

        // Remove commas for clean numeric value
        const clean = value.replace(/,/g, "");

        // Prevent 0 or negative
        if (clean !== "" && parseFloat(clean) <= 0) {
          toast.error("Bill Rate must be greater than 0.");
          return prev;
        }

        updated = { ...prev, [field]: clean }; // store clean value
      }

      // ✅ Date validations
      if (updated.startDate && updated.endDate) {
        if (new Date(updated.startDate) > new Date(updated.endDate)) {
          toast.error("End Date cannot be before Start Date.");
          return prev;
        }
      }

      if (updated.startDate) {
        if (
          new Date(updated.startDate) < new Date(selectedPlan.projStartDt) ||
          new Date(updated.startDate) > new Date(selectedPlan.projEndDt)
        ) {
          toast.error("Start Date must be within project dates.");
          return prev;
        }
      }

      if (updated.endDate) {
        if (
          new Date(updated.endDate) < new Date(selectedPlan.projStartDt) ||
          new Date(updated.endDate) > new Date(selectedPlan.projEndDt)
        ) {
          toast.error("End Date must be within project dates.");
          return prev;
        }
      }

      return updated; // ✅ valid update
    });
  };

  const handleVendorFieldChange = (id, field, value) => {
    if (field === "billRate") {
      handleVendorBillRateChange(id, value);
      return;
    }
    if (field === "vendorId") {
      const selectedVend = vendorEmployees.find((v) => v.vendId === value);
      setEditVendorFields((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          vendorId: value,
          vendorName: selectedVend
            ? selectedVend.employeeName
            : prev[id]?.vendorName,
          vendorEmployee: selectedVend
            ? selectedVend.empId
            : prev[id]?.vendorEmployee,
          vendorEmployeeName: selectedVend
            ? selectedVend.employeeName
            : prev[id]?.vendorEmployeeName,
        },
      }));
      setVendorBillingRates((prev) =>
        prev.map((rate) =>
          rate.id === id
            ? {
                ...rate,
                vendorId: value,
                vendorName: selectedVend
                  ? selectedVend.employeeName
                  : rate.vendorName,
                vendorEmployee: selectedVend
                  ? selectedVend.empId
                  : rate.vendorEmployee,
                vendorEmployeeName: selectedVend
                  ? selectedVend.employeeName
                  : rate.vendorEmployeeName,
              }
            : rate
        )
      );
      return;
    }
    setEditVendorFields((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
    if (
      field !== "lookupType" &&
      field !== "rateType" &&
      field !== "startDate" &&
      field !== "endDate" &&
      field !== "billRate"
    ) {
      setVendorBillingRates((prev) =>
        prev.map((rate) =>
          rate.id === id ? { ...rate, [field]: value } : rate
        )
      );
    }
  };

  const handleEditVendorRow = (id) => {
    setEditingVendorRowId(id);
  };

  useEffect(() => {
    if (!showPLC || hasFetchedPLC || !selectedProjectId) return;
    fetchBillingRates();
    fetchEmployeeBillingRates();
    fetchVendorBillingRates();
    setHasFetchedPLC(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPLC, hasFetchedPLC, selectedProjectId]);

  const handlePlcInputChange = (value) => {
    setPlcSearch(value);
  };

  const handlePlcSelect = (value) => {
    handleNewRateChange("plc", value);
    setPlcSearch(value);
  };

  function cancelEditing() {
    setIsEditing(false);
    setEditedBillRates({});
    setSelectedRows({});
  }

  function cancelVendorEditing() {
    setIsVendorEditing(false);
    setEditVendorBillRate({});
    setEditVendorFields({});
    // Optionally, reset selectedVendorRows if you want to clear selection too
    // setSelectedVendorRows({});
  }

  function cancelEmployeeEditing() {
    setIsEmployeeEditing(false);
    setEditEmployeeBillRate({});
    setEditEmployeeFields({});
    // Optionally clear checkboxes if you use selection for other employee batch actions
    // setSelectedEmployeeRows({});
  }

  return (
    <div className=" rounded-xl shadow-lg border border-gray-200  p-2 sm:p-4 min-h-[150px] scroll-mt-16 text-xs">
      {/* <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      /> */}
      {/* Project Labor Categories Billing Rates Schedule */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2 ">
          <h3 className="text-sm font-semibold">
            Project Labor Categories Billing Rates Schedule
          </h3>
          <div className="w-1/5 flex justify-end items-center space-x-2">
            {/* ADD BUTTON */}
            <button
              onClick={handleAddRow}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-normal hover:bg-blue-600 transition"
              disabled={loading || newRate}
            >
              Add
            </button>

            {/* NEW RATE SAVE/CANCEL */}
            {newRate && (
              <>
                <button
                  onClick={handleSaveNewRate}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition text-xs font-normal flex items-center space-x-1"
                  disabled={loading}
                  title="Save"
                >
                  <FaSave className="text-sm" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setNewRate(null)}
                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition text-xs font-normal flex items-center space-x-1"
                  disabled={loading}
                  title="Cancel"
                >
                  <FaTimes className="text-sm" />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {/* EDIT/CANCEL BUTTON */}
            {!newRate && (
              <>
                <button
                  onClick={() =>
                    isEditing ? cancelEditing() : setIsEditing(true)
                  }
                  className={`${
                    isEditing
                      ? "bg-gray-500 hover:bg-gray-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  } text-white px-3 py-1 rounded text-xs font-normal transition flex items-center space-x-1`}
                  disabled={loading || billingRatesSchedule.length === 0}
                  title={isEditing ? "Cancel Editing" : "Edit Bill Rates"}
                >
                  {isEditing ? (
                    <>
                      <FaTimes className="text-sm" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <FaEdit className="text-sm" />
                      <span>Edit</span>
                    </>
                  )}
                </button>

                {/* SAVE BUTTON (only visible in edit mode) */}
                {isEditing && (
                  <button
                    onClick={handleUpdateAllChanges}
                    className="bg-green-500 text-white px-3 py-1 rounded text-xs font-normal hover:bg-green-600 transition flex items-center space-x-1"
                    disabled={loading}
                    title="Save Changes"
                  >
                    <FaSave className="text-sm" />
                    <span>Save</span>
                  </button>
                )}
              </>
            )}

            {/* DELETE SELECTED (always visible, disabled when none selected) */}
            <button
              onClick={handleDeleteSelected} // implement to delete selectedRows IDs
              className="bg-red-500 text-white px-3 py-1 rounded text-xs font-normal hover:bg-red-600 transition flex items-center space-x-1"
              disabled={loading || !Object.values(selectedRows).some(Boolean)}
              title="Delete Selected"
            >
              <FaTrash className="text-sm" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-64 rounded-xl shadow-lg border border-gray-200">
          <table className="w-full table">
            <thead className="sticky top-0 z-10 thead">
              <tr className="bg-gray-100">
                <th className="th-thead">
                  <input
                    type="checkbox"
                    checked={
                      billingRatesSchedule.length > 0 &&
                      billingRatesSchedule.every(
                        (item) => selectedRows[item.id]
                      )
                    }
                    onChange={() => {
                      if (
                        billingRatesSchedule.length > 0 &&
                        billingRatesSchedule.every(
                          (item) => selectedRows[item.id]
                        )
                      ) {
                        setSelectedRows({});
                      } else {
                        const allSelected = {};
                        billingRatesSchedule.forEach((item) => {
                          allSelected[item.id] = true;
                        });
                        setSelectedRows(allSelected);
                      }
                    }}
                  />
                </th>
                <th className="th-thead  ">PLC</th>
                <th className="th-thead  ">Bill Rate</th>
                <th className="th-thead   ">Rate Type</th>
                <th className="th-thead  ">Start Date</th>
                <th className="th-thead   ">End Date</th>
              </tr>
            </thead>
            <tbody className="tbody">
              {newRate && (
                <tr
                  key="new-rate"
                  className="sm:table-row flex flex-col sm:flex-row mb-2 sm:mb-0"
                >
                  {/* New Rate Inputs unchanged */}
                  <td className="tbody-td"></td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newRate.plc || ""}
                      onChange={(e) => {
                        handleNewRateChange("plc", e.target.value);
                        setPlcSearch(e.target.value);
                      }}
                      className="w-full p-1 border rounded text-xs"
                      list="plc-list"
                    />
                    <datalist
                      id="plc-list"
                      style={dropdownStyles.noBorderDropdown}
                    >
                      {plcs.map((plc, index) => (
                        <option
                          key={`${plc.laborCategoryCode}-${index}`}
                          value={plc.laborCategoryCode}
                          style={dropdownStyles.noBorderDropdown}
                        >
                          {plc.description}
                        </option>
                      ))}
                    </datalist>
                  </td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newRate.billRate || ""}
                      onChange={(e) =>
                        handleNewRateChange("billRate", e.target.value)
                      }
                      onBlur={() => {
                        if (newRate.billRate) {
                          const num = parseFloat(
                            newRate.billRate.replace(/,/g, "")
                          );
                          if (!isNaN(num)) {
                            handleNewRateChange(
                              "billRate",
                              num.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            );
                          }
                        }
                      }}
                      className="w-full p-1 border rounded text-xs"
                    />
                  </td>
                  <td className="tbody-td">
                    <select
                      value={newRate.rateType}
                      onChange={(e) =>
                        handleNewRateChange("rateType", e.target.value)
                      }
                      className="w-full p-1 border rounded text-xs"
                    >
                      {rateTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="tbody-td">
                    <input
                      type="date"
                      value={newRate.startDate || ""}
                      onChange={(e) =>
                        handleNewRateChange("startDate", e.target.value)
                      }
                      className="w-full p-1 border rounded text-xs"
                      min={selectedPlan.projStartDt}
                      max={selectedPlan.projEndDt}
                    />
                  </td>
                  <td className="tbody-td">
                    <input
                      type="date"
                      value={newRate.endDate || ""}
                      onChange={(e) =>
                        handleNewRateChange("endDate", e.target.value)
                      }
                      className="w-full p-1 border rounded text-xs"
                      min={newRate.startDate || selectedPlan.projStartDt}
                      max={selectedPlan.projEndDt}
                    />
                  </td>
                  {/* <td className="border p-2 sm:w-1/5"></td> */}
                </tr>
              )}

              {loadingPLC ? (
                <tr key="loading">
                  <td colSpan="7" className="tbody-td">
                    Loading...
                  </td>
                </tr>
              ) : billingRatesSchedule.length === 0 ? (
                <tr key="no-data">
                  <td colSpan="6" className="tbody-td">
                    No data available
                  </td>
                </tr>
              ) : (
                billingRatesSchedule.map((item) => (
                  <tr
                    key={item.id}
                    className="sm:table-row flex flex-col sm:flex-row mb-2 sm:mb-0"
                  >
                    <td className="tbody-td ">
                      <input
                        type="checkbox"
                        checked={!!selectedRows[item.id]}
                        onChange={() => {
                          setSelectedRows((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }));
                        }}
                      />
                    </td>
                    <td className="tbody-td">{item.plc}</td>
                    <td className="tbody-td">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedBillRates[item.id] ?? item.billRate}
                          onChange={(e) =>
                            setEditedBillRates((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          onBlur={() => {
                            const raw =
                              editedBillRates[item.id] ?? item.billRate;
                            const num = parseFloat(raw.replace(/,/g, ""));
                            if (!isNaN(num)) {
                              setEditedBillRates((prev) => ({
                                ...prev,
                                [item.id]: num.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }),
                              }));
                            }
                          }}
                          className="w-full p-1 border rounded text-xs"
                        />
                      ) : (
                        <span>{item.billRate}</span>
                      )}
                    </td>
                    <td className="tbody-td">{item.rateType}</td>
                    <td className="tbody-td">{item.startDate}</td>
                    <td className="tbody-td">{item.endDate || ""}</td>
                    {/* <td className="border p-2 sm:w-1/5"></td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Billing Rates Schedule */}
      {/* <div className="mb-4">
        <h3 className="text-sm font-semibold">Employee Billing Rates Schedule</h3>
        <div className="overflow-x-auto overflow-y-auto max-h-64"> */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold">
            Employee Billing Rates Schedule
          </h3>
          <div className="w-1/5 flex justify-end items-center space-x-2">
            {/* ADD BUTTON */}
            <button
              onClick={handleAddEmployeeRow}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-normal hover:bg-blue-600 transition"
              disabled={loading || newEmployeeRate}
            >
              Add
            </button>

            {/* NEW RATE SAVE/CANCEL */}
            {newEmployeeRate && (
              <>
                <button
                  onClick={handleSaveNewEmployeeRate}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition text-xs font-normal flex items-center space-x-1"
                  disabled={loading}
                  title="Save"
                >
                  <FaSave className="text-sm" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setNewEmployeeRate(null)}
                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition text-xs font-normal flex items-center space-x-1"
                  disabled={loading}
                  title="Cancel"
                >
                  <FaTimes className="text-sm" />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {/* EDIT/CANCEL BUTTON */}
            {!newEmployeeRate && (
              <>
                <button
                  onClick={() =>
                    isEmployeeEditing
                      ? cancelEmployeeEditing()
                      : setIsEmployeeEditing(true)
                  }
                  className={`${
                    isEmployeeEditing
                      ? "bg-gray-500 hover:bg-gray-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  } text-white px-3 py-1 rounded text-xs font-normal transition flex items-center space-x-1`}
                  disabled={loading || employeeBillingRates.length === 0}
                  title={
                    isEmployeeEditing ? "Cancel Editing" : "Edit Bill Rates"
                  }
                >
                  {isEmployeeEditing ? (
                    <>
                      <FaTimes className="text-sm" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <FaEdit className="text-sm" />
                      <span>Edit</span>
                    </>
                  )}
                </button>

                {/* SAVE BUTTON (only visible in edit mode) */}
                {isEmployeeEditing && (
                  <button
                    onClick={handleUpdateAllEmployeeChanges} // implement as needed
                    className="bg-green-500 text-white px-3 py-1 rounded text-xs font-normal hover:bg-green-600 transition flex items-center space-x-1"
                    disabled={loading}
                    title="Save Changes"
                  >
                    <FaSave className="text-sm" />
                    <span>Save</span>
                  </button>
                )}
              </>
            )}

            {/* DELETE SELECTED (always visible) */}
            <button
              onClick={handleDeleteEmployee} // implement as needed
              className="bg-red-500 text-white px-3 py-1 rounded text-xs font-normal hover:bg-red-600 transition flex items-center space-x-1"
              disabled={
                loading || !Object.values(selectedEmployeeRows).some(Boolean)
              }
              title="Delete Selected"
            >
              <FaTrash className="text-sm" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-64 rounded-xl shadow-lg border border-gray-200">
          <table className="w-full table">
            <thead className="sticky top-0 z-10 thead">
              <tr>
                <th className="th-thead">
                  <input
                    type="checkbox"
                    checked={
                      employeeBillingRates.length > 0 &&
                      Object.values(selectedEmployeeRows).length ===
                        employeeBillingRates.length &&
                      Object.values(selectedEmployeeRows).every(Boolean)
                    }
                    onChange={() => {
                      if (
                        employeeBillingRates.length > 0 &&
                        Object.values(selectedEmployeeRows).length ===
                          employeeBillingRates.length &&
                        Object.values(selectedEmployeeRows).every(Boolean)
                      ) {
                        setSelectedEmployeeRows({});
                      } else {
                        const allSelected = {};
                        employeeBillingRates.forEach((item) => {
                          allSelected[item.id] = true;
                        });
                        setSelectedEmployeeRows(allSelected);
                      }
                    }}
                  />
                </th>
                <th className="th-thead">Employee</th>
                <th className="th-thead">Employee Name</th>
                <th className="bth-thead">PLC</th>
                <th className="th-thead">PLC Description</th>
                <th className="th-thead">Bill Rate</th>
                <th className="th-thead">Rate Type</th>
                <th className="th-thead">Start Date</th>
                <th className="th-thead">End Date</th>
              </tr>
            </thead>
            <tbody className="tbody">
              {newEmployeeRate && (
                <tr>
                  {/* Checkbox column for alignment */}
                  <td className="tbody-td"></td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newEmployeeRate.empId || ""}
                      onChange={(e) =>
                        handleNewEmployeeRateChange("empId", e.target.value)
                      }
                      className="w-full p-1 border rounded text-xs"
                      list="employee-list"
                      disabled={employees.length === 0}
                    />
                    <datalist id="employee-list">
                      {employees.map((emp, index) => (
                        <option key={`${emp.empId}-${index}`} value={emp.empId}>
                          {emp.employeeName}
                        </option>
                      ))}
                    </datalist>
                  </td>
                  <td className="tbody-td">
                    {newEmployeeRate.employeeName || ""}
                  </td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newEmployeeRate.plc || ""}
                      onChange={(e) => {
                        handleNewEmployeeRateChange("plc", e.target.value);
                        setPlcSearch(e.target.value);
                      }}
                      className="w-full p-1 border rounded text-xs"
                      list="plc-list"
                    />
                    <datalist id="plc-list">
                      {plcs.map((plc) => (
                        <option
                          key={plc.laborCategoryCode}
                          value={plc.laborCategoryCode}
                        >
                          {plc.description}
                        </option>
                      ))}
                    </datalist>
                  </td>
                  <td className="tbody-td">
                    {plcs.find(
                      (plc) => plc.laborCategoryCode === newEmployeeRate.plc
                    )?.description || ""}
                  </td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newEmployeeRate.billRate || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9,]*\.?[0-9]*$/.test(val) || val === "") {
                          handleNewEmployeeRateChange("billRate", val);
                        }
                      }}
                      onBlur={() => {
                        const raw = newEmployeeRate.billRate;
                        const num = parseFloat((raw || "").replace(/,/g, ""));
                        if (!isNaN(num)) {
                          handleNewEmployeeRateChange(
                            "billRate",
                            num.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          );
                        }
                      }}
                      className="w-full p-1 border rounded text-xs"
                    />
                  </td>
                  <td className="tbody-td">
                    <select
                      value={newEmployeeRate.rateType}
                      onChange={(e) =>
                        handleNewEmployeeRateChange("rateType", e.target.value)
                      }
                      className="w-full p-1 border rounded text-xs"
                    >
                      {rateTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="tbody-td">
                    <input
                      type="date"
                      value={newEmployeeRate.startDate || ""}
                      onChange={(e) =>
                        handleNewEmployeeRateChange("startDate", e.target.value)
                      }
                      className="w-full p-1 border rounded text-xs"
                      min={selectedPlan.projStartDt}
                      max={selectedPlan.projEndDt}
                    />
                  </td>
                  <td className="tbody-td">
                    <input
                      type="date"
                      value={newEmployeeRate.endDate || ""}
                      onChange={(e) =>
                        handleNewEmployeeRateChange("endDate", e.target.value)
                      }
                      className="w-full p-1 border rounded text-xs"
                      min={
                        newEmployeeRate.startDate || selectedPlan.projStartDt
                      }
                      max={selectedPlan.projEndDt}
                    />
                  </td>
                </tr>
              )}

              {loadingEmployee ? (
                <tr>
                  <td colSpan="9" className="tbody-td">
                    Loading...
                  </td>
                </tr>
              ) : employeeBillingRates.length === 0 && !newEmployeeRate ? (
                <tr>
                  <td colSpan="9" className="tbody-td">
                    No data available
                  </td>
                </tr>
              ) : (
                employeeBillingRates.map((item) => (
                  <tr key={item.id}>
                    <td className="tbody-td">
                      <input
                        type="checkbox"
                        checked={!!selectedEmployeeRows[item.id]}
                        onChange={() => {
                          setSelectedEmployeeRows((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }));
                        }}
                      />
                    </td>
                    <td className="tbody-td">{item.empId}</td>
                    <td className="tbody-td">{item.employeeName}</td>
                    <td className="tbody-td">{item.plc}</td>
                    <td className="tbody-td">
                      {plcs.find((plc) => plc.laborCategoryCode === item.plc)
                        ?.description || item.plcDescription}
                    </td>
                    <td className="tbody-td">
                      {isEmployeeEditing ? (
                        <input
                          type="text"
                          value={editEmployeeBillRate[item.id] ?? item.billRate}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9,]*\.?[0-9]*$/.test(val) || val === "") {
                              handleEmployeeBillRateChange(item.id, val);
                            }
                          }}
                          onBlur={() => {
                            const raw =
                              editEmployeeBillRate[item.id] ?? item.billRate;
                            const num = parseFloat(
                              (raw || "").replace(/,/g, "")
                            );
                            if (!isNaN(num)) {
                              handleEmployeeBillRateChange(
                                item.id,
                                num.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              );
                            }
                          }}
                          className="w-full p-1 border rounded text-xs"
                        />
                      ) : (
                        <span>{item.billRate}</span>
                      )}
                    </td>
                    <td className="tbody-td">{item.rateType}</td>
                    <td className="tbody-td">{item.startDate}</td>
                    <td className="tbody-td">{item.endDate || ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Billing Rates Schedule */}
      {/* <div className="mb-4">
        <h3 className="text-sm font-semibold">Vendor Billing Rates Schedule</h3>
        <div className="overflow-x-auto overflow-y-auto max-h-64"> */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold">
            Vendor Billing Rates Schedule
          </h3>
          <div className="w-1/5 flex justify-end items-center space-x-2">
            <button
              onClick={handleAddVendorRow}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-normal hover:bg-blue-600 transition"
              disabled={loading || newVendorRate}
            >
              Add
            </button>
            {newVendorRate && (
              <>
                <button
                  onClick={handleSaveNewVendorRate}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition text-xs font-normal flex items-center space-x-1"
                  disabled={loading}
                  title="Save"
                >
                  <FaSave className="text-sm" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setNewVendorRate(null)}
                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition text-xs font-normal flex items-center space-x-1"
                  disabled={loading}
                  title="Cancel"
                >
                  <FaTimes className="text-sm" />
                  <span>Cancel</span>
                </button>
              </>
            )}
            {!newVendorRate && (
              <>
                <button
                  onClick={() =>
                    isVendorEditing
                      ? cancelVendorEditing()
                      : setIsVendorEditing(true)
                  }
                  className={`${
                    isVendorEditing
                      ? "bg-gray-500 hover:bg-gray-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  } text-white px-3 py-1 rounded text-xs font-normal transition flex items-center space-x-1`}
                  disabled={loading || vendorBillingRates.length === 0}
                  title={isVendorEditing ? "Cancel Editing" : "Edit Bill Rates"}
                >
                  {isVendorEditing ? (
                    <>
                      <FaTimes className="text-sm" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <FaEdit className="text-sm" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
                {isVendorEditing && (
                  <button
                    onClick={handleUpdateAllVendors} // implement as needed
                    className="bg-green-500 text-white px-3 py-1 rounded text-xs font-normal hover:bg-green-600 transition flex items-center space-x-1"
                    disabled={loading}
                    title="Save Changes"
                  >
                    <FaSave className="text-sm" />
                    <span>Save</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={handleDeleteSelectedVendors} // implement as needed
              className="bg-red-500 text-white px-3 py-1 rounded text-xs font-normal hover:bg-red-600 transition flex items-center space-x-1"
              disabled={
                loading || !Object.values(selectedVendorRows).some(Boolean)
              }
              title="Delete Selected"
            >
              <FaTrash className="text-sm" />
              <span>Delete</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-64 rounded-xl shadow-lg border border-gray-200">
          <table className="w-full table">
            <thead className="sticky top-0 z-10 thead">
              <tr>
                <th className="th-thead">
                  <input
                    type="checkbox"
                    checked={
                      vendorBillingRates.length > 0 &&
                      Object.keys(selectedVendorRows).length ===
                        vendorBillingRates.length &&
                      Object.values(selectedVendorRows).every(Boolean)
                    }
                    onChange={() => {
                      if (
                        vendorBillingRates.length > 0 &&
                        Object.keys(selectedVendorRows).length ===
                          vendorBillingRates.length &&
                        Object.values(selectedVendorRows).every(Boolean)
                      ) {
                        // Deselect all
                        setSelectedVendorRows({});
                      } else {
                        // Select all
                        const allSelected = {};
                        vendorBillingRates.forEach((item) => {
                          allSelected[item.id] = true;
                        });
                        setSelectedVendorRows(allSelected);
                      }
                    }}
                  />
                </th>
                <th className="th-thead">Vendor</th>
                <th className="th-thead">Vendor Name</th>
                <th className="th-thead">Vendor Employee ID</th>
                <th className="th-thead">Vendor Employee Name</th>
                <th className="th-thead">PLC</th>
                <th className="th-thead">PLC Description</th>
                <th className="th-thead">Bill Rate</th>
                <th className="th-thead">Rate Type</th>
                <th className="th-thead">Start Date</th>
                <th className="th-thead">End Date</th>
              </tr>
            </thead>
            <tbody className="tbody">
              {newVendorRate && (
                <tr>
                  {/* Checkbox column for alignment */}
                  <td className="tbody-td"></td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newVendorRate.vendorId || ""}
                      onChange={(e) => {
                        // find the vendor for lookup population
                        const selectedVend = vendorEmployees.find(
                          (v) => v.vendId === e.target.value
                        );
                        setNewVendorRate((prev) => ({
                          ...prev,
                          vendorId: e.target.value,
                          vendorName: selectedVend
                            ? selectedVend.employeeName
                            : prev.vendorName,
                          vendorEmployee: selectedVend
                            ? selectedVend.empId
                            : prev.vendorEmployee,
                          vendorEmployeeName: selectedVend
                            ? selectedVend.employeeName
                            : prev.vendorEmployeeName,
                        }));
                      }}
                      className="w-full p-1 border rounded text-xs"
                      list="vendor-list"
                    />
                    <datalist id="vendor-list">
                      {vendorEmployees.map((v, index) => (
                        <option
                          key={`${v.vendId}-${v.empId}-${index}`}
                          value={v.vendId}
                        >
                          {v.employeeName}
                        </option>
                      ))}
                    </datalist>
                  </td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newVendorRate.vendorName || ""}
                      readOnly
                      onChange={(e) =>
                        handleNewVendorRateChange("vendorName", e.target.value)
                      }
                      className="w-full p-2 border rounded text-xs bg-gray-100"
                    />
                  </td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newVendorRate.vendorEmployee || ""}
                      readOnly
                      onChange={(e) =>
                        handleNewVendorRateChange(
                          "vendorEmployee",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border rounded text-xs bg-gray-100"
                    />
                  </td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newVendorRate.vendorEmployeeName || ""}
                      readOnly
                      onChange={(e) =>
                        handleNewVendorRateChange(
                          "vendorEmployeeName",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border rounded text-xs bg-gray-100"
                    />
                  </td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newVendorRate.plc || ""}
                      onChange={(e) => {
                        handleNewVendorRateChange("plc", e.target.value);
                        setPlcSearch(e.target.value);
                      }}
                      className="w-full p-2 border rounded text-xs"
                      list="plc-list"
                    />
                    <datalist id="plc-list">
                      {plcs.map((plc) => (
                        <option
                          key={plc.laborCategoryCode}
                          value={plc.laborCategoryCode}
                        >
                          {plc.description}
                        </option>
                      ))}
                    </datalist>
                  </td>
                  <td className="tbody-td">
                    {plcs.find(
                      (plc) => plc.laborCategoryCode === newVendorRate.plc
                    )?.description || ""}
                  </td>
                  <td className="tbody-td">
                    <input
                      type="text"
                      value={newVendorRate.billRate || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9,]*\.?[0-9]*$/.test(val) || val === "") {
                          handleNewVendorRateChange("billRate", val);
                        }
                      }}
                      onBlur={() => {
                        if (newVendorRate.billRate) {
                          const num = parseFloat(
                            newVendorRate.billRate.replace(/,/g, "")
                          );
                          if (!isNaN(num) && num > 0) {
                            handleNewVendorRateChange(
                              "billRate",
                              num.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            );
                          } else {
                            toast.error("Bill Rate must be greater than 0");
                            handleNewVendorRateChange("billRate", "");
                          }
                        }
                      }}
                      className="w-full p-2 border rounded text-xs"
                    />
                  </td>
                  <td className="tbody-td">
                    <select
                      value={newVendorRate.rateType}
                      onChange={(e) =>
                        handleNewVendorRateChange("rateType", e.target.value)
                      }
                      className="w-full p-2 border rounded text-xs"
                    >
                      {rateTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="tbody-td">
                    <input
                      type="date"
                      value={newVendorRate.startDate || ""}
                      onChange={(e) =>
                        handleNewVendorRateChange("startDate", e.target.value)
                      }
                      className="w-full p-2 border rounded text-xs"
                      min={selectedPlan.projStartDt}
                      max={selectedPlan.projEndDt}
                    />
                  </td>
                  <td className="tbody-td">
                    <input
                      type="date"
                      value={newVendorRate.endDate || ""}
                      onChange={(e) =>
                        handleNewVendorRateChange("endDate", e.target.value)
                      }
                      className="w-full p-2 border rounded text-xs"
                      min={newVendorRate.startDate || selectedPlan.projStartDt}
                      max={selectedPlan.projEndDt}
                    />
                  </td>
                </tr>
              )}
              {loadingVendor ? (
                <tr>
                  <td colSpan="11" className="tbody-td">
                    Loading...
                  </td>
                </tr>
              ) : vendorBillingRates.length === 0 && !newVendorRate ? (
                <tr>
                  <td colSpan="11" className="tbody-td">
                    No data available
                  </td>
                </tr>
              ) : (
                vendorBillingRates.map((item) => (
                  <tr key={item.id}>
                    <td className="tbody-td text-center">
                      <input
                        type="checkbox"
                        checked={!!selectedVendorRows[item.id]}
                        onChange={() => {
                          setSelectedVendorRows((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }));
                        }}
                      />
                    </td>
                    <td className="tbody-td">{item.vendorId}</td>
                    <td className="tbody-td">{item.vendorName}</td>
                    <td className="tbody-td">{item.vendorEmployee}</td>
                    <td className="tbody-td">{item.vendorEmployeeName}</td>
                    <td className="tbody-td">{item.plc}</td>
                    <td className="tbody-td">
                      {plcs.find((plc) => plc.laborCategoryCode === item.plc)
                        ?.description || item.plcDescription}
                    </td>
                    <td className="tbody-td">
                      {isVendorEditing ? (
                        <input
                          type="text"
                          value={editVendorBillRate[item.id] ?? item.billRate}
                          onChange={(e) =>
                            handleVendorBillRateChange(item.id, e.target.value)
                          }
                          onBlur={() => {
                            const raw =
                              editVendorBillRate[item.id] ?? item.billRate;
                            const num = parseFloat(
                              (raw || "").replace(/,/g, "")
                            );
                            if (!isNaN(num) && num > 0) {
                              handleVendorBillRateChange(
                                item.id,
                                num.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              );
                            } else if (raw) {
                              toast.error("Bill Rate must be greater than 0");
                            }
                          }}
                          className="w-full p-2 border rounded text-xs"
                        />
                      ) : (
                        <span>{item.billRate}</span>
                      )}
                    </td>
                    <td className="tbody-td">{item.rateType}</td>
                    <td className="tbody-td">{item.startDate}</td>
                    <td className="tbody-td">{item.endDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PLCComponent;
