import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import Warning from "./Warning";
import EmployeeSchedule from "./EmployeeSchedule";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const EMPLOYEE_COLUMNS = [
  { key: "idType", label: "ID Type" },
  { key: "emplId", label: "ID" },
  { key: "warning", label: "Warning" },
  { key: "name", label: "Name" },
  { key: "acctId", label: "Account" },
  { key: "acctName", label: "Account Name" },
  { key: "orgId", label: "Organization" },
  { key: "glcPlc", label: "PLC" },
  { key: "isRev", label: "Rev" },
  { key: "isBrd", label: "Brd" },
  { key: "status", label: "Status" },
  { key: "perHourRate", label: "Hour Rate" },
  { key: "total", label: "Total" },
];

const ID_TYPE_OPTIONS = [
  { value: "", label: "Select ID Type" },
  { value: "Employee", label: "Employee" },
  { value: "Vendor", label: "Vendor Employee" },
  { value: "PLC", label: "PLC" },
  { value: "Other", label: "Other" },
];

const ROW_HEIGHT_DEFAULT = 48;

function isMonthEditable(duration, closedPeriod, planType) {
  if (planType !== "EAC") return true;
  if (!closedPeriod) return true;
  const closedDate = new Date(closedPeriod);
  if (isNaN(closedDate)) return true;
  const durationDate = new Date(duration.year, duration.monthNo - 1, 1);
  const closedMonth = closedDate.getMonth();
  const closedYear = closedDate.getFullYear();
  const durationMonth = durationDate.getMonth();
  const durationYear = durationDate.getFullYear();
  return (
    durationYear > closedYear ||
    (durationYear === closedYear && durationMonth >= closedMonth)
  );
}

const hoursFormatDateDisplay = (value) => {
    if (!value) return "N/A";
    
    // 1. Check for YYYY-MM-DD format (like from date picker)
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-');
        // Output MM/DD/YYYY directly from the string parts
        return `${month}/${day}/${year}`;
    }
    
    // 2. Fallback for ISO/other formats, try to format as UTC date string to avoid timezone shift
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return "N/A";
        
        // Use UTC getter methods to prevent local timezone shift
        const y = date.getUTCFullYear();
        const m = date.getUTCMonth() + 1; // Month is 0-indexed
        const d = date.getUTCDate();
        
        // Format as MM/DD/YYYY
        return `${m < 10 ? '0' + m : m}/${d < 10 ? '0' + d : d}/${y}`;
    } catch (e) {
        return "N/A";
    }
};

// const hoursFormatDateDisplay = (value) => {
//     if (!value) return "N/A";
//     if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
//         const [year, month, day] = value.split('-');
//         // Output MM/DD/YYYY directly from the string parts
//         return `${month}/${day}/${year}`;
//     }
//     // Fallback logic if value is a Date object or full ISO string (optional, keeps existing logic)
//     try {
//         const date = new Date(value);
//         if (isNaN(date.getTime())) return "N/A";
//         // Use local formatting if the incoming string wasn't YYYY-MM-DD
//         return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
//     } catch (e) {
//         return "N/A";
//     }
// };

const ProjectHoursDetails = ({
  planId,
  projectId,
  status,
  planType,
  closedPeriod,
  startDate,
  endDate,
  fiscalYear,
  onSaveSuccess,
}) => {
  // ADD THIS RIGHT HERE - Normalize fiscal year
  const normalizedFiscalYear =
    fiscalYear === "All" || !fiscalYear ? "All" : String(fiscalYear).trim();
  // ADD THIS BLOCK AFTER normalizedFiscalYear definition:

  // console.log("FISCAL YEAR DEBUG:", fiscalYear, "Normalized:", normalizedFiscalYear);
  const [durations, setDurations] = useState([]);
  const [isDurationLoading, setIsDurationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hiddenRows, setHiddenRows] = useState({});
  const [inputValues, setInputValues] = useState({});
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [replaceScope, setReplaceScope] = useState("all");
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [selectedColumnKey, setSelectedColumnKey] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    id: "",
    firstName: "",
    lastName: "",
    isRev: false,
    isBrd: false,
    idType: "",
    acctId: "",
    orgId: "",
    plcGlcCode: "",
    perHourRate: "",
    status: "Act",
  });
  const [newEntryPeriodHours, setNewEntryPeriodHours] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageText, setSuccessMessageText] = useState("");
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [laborAccounts, setLaborAccounts] = useState([]);
  const [plcOptions, setPlcOptions] = useState([]);
  const [plcSearch, setPlcSearch] = useState("");
  const [showFillValues, setShowFillValues] = useState(false);
  const [fillMethod, setFillMethod] = useState("None");
  const [fillHours, setFillHours] = useState(0.0);
  const [sourceRowIndex, setSourceRowIndex] = useState(null);
  const [editedEmployeeData, setEditedEmployeeData] = useState({});
  const [localEmployees, setLocalEmployees] = useState([]);
  const [fillStartDate, setFillStartDate] = useState(startDate);
  const [fillEndDate, setFillEndDate] = useState(endDate);
  const [isLoading, setIsLoading] = useState(false);
  const [autoPopulatedPLC, setAutoPopulatedPLC] = useState(false); // Track if PLC is auto-populated
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [orgSearch, setOrgSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployeeScheduleId, setSelectedEmployeeScheduleId] =
    useState(null);
  const [filteredPlcOptions, setFilteredPlcOptions] = useState([]);
  const [accountOptionsWithNames, setAccountOptionsWithNames] = useState([]);
  const [modifiedHours, setModifiedHours] = useState({});
  const [hasUnsavedHoursChanges, setHasUnsavedHoursChanges] = useState(false);
  const [hasUnsavedEmployeeChanges, setHasUnsavedEmployeeChanges] =
    useState(false);
  const [updateAccountOptions, setUpdateAccountOptions] = useState([]);
  const [updateOrganizationOptions, setUpdateOrganizationOptions] = useState(
    []
  );
  const [updatePlcOptions, setUpdatePlcOptions] = useState([]);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [selectedEmployeeIdForWarning, setSelectedEmployeeIdForWarning] =
    useState(null);
  const [localWarnings, setLocalWarnings] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [hasClipboardData, setHasClipboardData] = useState(false);
  const [copiedRowsData, setCopiedRowsData] = useState([]);
  const [newEntries, setNewEntries] = useState([]);
  const [newEntryPeriodHoursArray, setNewEntryPeriodHoursArray] = useState([]);
  const [copiedMonthMetadata, setCopiedMonthMetadata] = useState([]);

  const [hasUnsavedPastedChanges, setHasUnsavedPastedChanges] = useState(false);

  const [pastedEntrySuggestions, setPastedEntrySuggestions] = useState({});
  const [pastedEntryAccounts, setPastedEntryAccounts] = useState({});
  const [pastedEntryOrgs, setPastedEntryOrgs] = useState({});
  const [pastedEntryPlcs, setPastedEntryPlcs] = useState({});

  const [showFindOnly, setShowFindOnly] = useState(false);
  const [findMatches, setFindMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const [cachedProjectData, setCachedProjectData] = useState(null);
  const [cachedOrgData, setCachedOrgData] = useState(null);

  

  const [showEmployeeSchedule, setShowEmployeeSchedule] = useState(false);

//   useEffect(() => {
//     setFillStartDate(startDate);
//     setFillEndDate(endDate);
// }, [startDate, endDate]);

useEffect(() => {
    // This ensures that when a new plan is selected, or manual dates are entered, 
    // the local state used by the fill tool correctly reflects the latest props.
    setFillStartDate(startDate);
    setFillEndDate(endDate);
}, [startDate, endDate]);

// useEffect(() => {
//     // This ensures that when a new plan is selected, or manual dates are entered, 
//     // the local state used by the fill tool correctly reflects the latest props.
//     setFillStartDate(startDate);
//     setFillEndDate(endDate);
// }, [startDate, endDate]);

  const sortedDurations = useMemo(() => {
    return [...durations]
      .filter((d) => {
        if (normalizedFiscalYear === "All") return true;
        return d.year === parseInt(normalizedFiscalYear);
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNo - b.monthNo;
      });
  }, [durations, normalizedFiscalYear]);

  const firstTableRef = useRef(null);
  const secondTableRef = useRef(null);
  const isPastingRef = useRef(false);

  const debounceTimeout = useRef(null);

  const scrollingLock = useRef(false);
  const [editingPerHourRateIdx, setEditingPerHourRateIdx] =
    React.useState(null);
  const [isEditingNewEntry, setIsEditingNewEntry] = React.useState(false);

  const shouldShowCTD = () => {
    if (normalizedFiscalYear === "All") return false;

    const selectedYear = parseInt(normalizedFiscalYear);
    const startYear = parseInt(startDate.split("-")[0]);

    // Don't show CTD if selected year is the Start Date year
    if (selectedYear === startYear) return false;

    // Show CTD only if selected year is at least 2 years after start year
    return selectedYear >= startYear + 2;
  };

  const shouldShowPriorYear = () => {
    if (normalizedFiscalYear === "All") return false;

    const selectedYear = parseInt(normalizedFiscalYear);
    const startYear = parseInt(startDate.split("-")[0]);

    // CRITICAL FIX: Don't show Prior Year if selected year is the Start Date year
    if (selectedYear === startYear) return false;

    // CRITICAL FIX: Show Prior Year for ANY year after start year (including current year like 2025)
    return selectedYear > startYear;
  };

  const syncScroll = (sourceRef, targetRef) => {
    if (!sourceRef.current || !targetRef.current) return;

    if (!scrollingLock.current) {
      scrollingLock.current = true;
      targetRef.current.scrollTop = sourceRef.current.scrollTop;

      setTimeout(() => {
        scrollingLock.current = false;
      }, 0);
    }
  };

  const handleFirstScroll = () => {
    syncScroll(firstTableRef, secondTableRef);
  };

  const handleSecondScroll = () => {
    syncScroll(secondTableRef, firstTableRef);
  };

  const isEditable = status === "In Progress";

  const isBudPlan = planType === "BUD" || planType === "NBBUD";

  const isFieldEditable =
    planType === "BUD" || planType === "EAC" || planType === "NBBUD";

  // Add a new empty entry form
  const addNewEntryForm = () => {
    const newEntry = {
      id: "",
      firstName: "",
      lastName: "",
      isRev: false,
      isBrd: false,
      idType: "",
      acctId: "",
      orgId: "",
      plcGlcCode: "",
      perHourRate: "",
      status: "Act",
    };
    setNewEntries((prev) => [...prev, newEntry]);
    setNewEntryPeriodHoursArray((prev) => [...prev, {}]);
  };

  // Remove an entry form
  const removeNewEntryForm = (index) => {
    setNewEntries((prev) => prev.filter((_, i) => i !== index));
    setNewEntryPeriodHoursArray((prev) => prev.filter((_, i) => i !== index));
  };

  // Update a specific entry
  const updateNewEntry = (index, updates) => {
    setNewEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry))
    );
  };

  // Update period hours for a specific entry
  const updateNewEntryPeriodHours = (index, periodHours) => {
    setNewEntryPeriodHoursArray((prev) =>
      prev.map((hours, i) =>
        i === index ? { ...hours, ...periodHours } : hours
      )
    );
  };

  // Clear all fields when ID type changes
  useEffect(() => {
    if (isPastingRef.current) {
      return;
    }

    if (newEntry.idType === "PLC") {
      setNewEntry({
        ...newEntry,
        id: "PLC",
        firstName: "",
        lastName: "",
        perHourRate: "",
        orgId: "",
        plcGlcCode: "",
        acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
      });
      setPlcSearch("");
      setAutoPopulatedPLC(false);
    } else if (newEntry.idType !== "") {
      // Clear all fields when switching to any other type
      setNewEntry((prev) => ({
        ...prev,
        id: "",
        firstName: "",
        lastName: "",
        perHourRate: "",
        orgId: "",
        plcGlcCode: "",
        acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
      }));
      setPlcSearch("");
      setAutoPopulatedPLC(false);
    }
  }, [newEntry.idType]);

  // Reset new entry form when planId changes (project/plan change)
  useEffect(() => {
    if (planId) {
      setShowNewForm(false);
      resetNewEntryForm(); // Use the reset function
      setNewEntry({
        id: "",
        firstName: "",
        lastName: "",
        isRev: false,
        isBrd: false,
        idType: "",
        acctId: "",
        orgId: "",
        plcGlcCode: "",
        perHourRate: "",
        status: "Act",
      });
      setNewEntryPeriodHours({});

      // Clear all related states
      setEmployeeSuggestions([]);
      setLaborAccounts([]);
      setPlcOptions([]);
      setFilteredPlcOptions([]);
      setPlcSearch("");
      setOrgSearch("");
      setAutoPopulatedPLC(false);

      // Clear any save-related states
      setHasUnsavedEmployeeChanges(false);
      setHasUnsavedHoursChanges(false);
      setEditedEmployeeData({});
      setModifiedHours({});
      setInputValues({});

      // Clear UI states
      setShowSuccessMessage(false);
      setSuccessMessageText("");
      setSelectedEmployeeId(null);
      setSelectedRowIndex(null);
      setSelectedColumnKey(null);

      // Clear warning states
      setLocalWarnings({});
      setShowWarningPopup(false);
      setSelectedEmployeeIdForWarning(null);

      // Clear update options
      setUpdateAccountOptions([]);
      setUpdateOrganizationOptions([]);
      setUpdatePlcOptions([]);
    }
  }, [planId]); // This will trigger when planId changes

  const isValidEmployeeId = (id) => {
    if (planType === "NBBUD") return true; // Add this line
    if (!id) return false;
    if (newEntry.idType === "Employee" || newEntry.idType === "Vendor") {
      return !!employeeSuggestions.find((emp) => emp.emplId === id);
    }
    if (newEntry.idType === "Other") {
      return !!employeeSuggestions.find((emp) => emp.emplId === id);
    }
    return true;
  };

  const isValidAccount = (val) => {
    if (planType === "NBBUD") return true; // Add this line
    return !val || laborAccounts.some((acc) => acc.id === val);
  };

  const isValidOrg = (val) => {
    if (planType === "NBBUD") return true; // Add this line
    if (!val) return false;
    const trimmed = val.toString().trim();
    if (!/^[\d.]+$/.test(trimmed)) return false;

    if (organizationOptions.length === 0) return true;

    return organizationOptions.some((opt) => opt.value.toString() === trimmed);
  };

  const isValidOrgForUpdate = (val, updateOptions) => {
    if (planType === "NBBUD") return true; // Add this line
    if (!val) return false;
    const trimmed = val.toString().trim();
    if (!/^[\d.]+$/.test(trimmed)) return false;
    return updateOptions.some((opt) => opt.value.toString() === trimmed);
  };

  const isValidAccountForUpdate = (val, updateOptions) => {
    if (planType === "NBBUD") return true; // Add this line
    if (!val) return false;
    const trimmed = val.toString().trim();
    return updateOptions.some((opt) => opt.id === trimmed);
  };

  const isValidPlc = (val) => {
    if (planType === "NBBUD") return true;
    if (!val) return true;
    if (plcOptions.length === 0) return true;

    const trimmedVal = val.toString().trim();
    const isValid = plcOptions.some((option) => {
      const optionValue = option.value ? option.value.toString().trim() : "";
      return optionValue === trimmedVal;
    });

    return isValid;
  };

  const isValidPlcForUpdate = (val, updateOptions) => {
    if (planType === "NBBUD") return true; // Add this line
    if (!val) return true;
    if (updateOptions.length === 0) return true;
    const trimmed = val.toString().trim();
    return updateOptions.some((option) => option.value === trimmed);
  };

  // Track unsaved changes
  const hasUnsavedChanges = () => {
    const isNewEntryModified =
      newEntry.id !== "" ||
      newEntry.firstName !== "" ||
      newEntry.lastName !== "" ||
      newEntry.isRev ||
      newEntry.isBrd ||
      newEntry.idType !== "" ||
      newEntry.acctId !== "" ||
      newEntry.orgId !== "" ||
      newEntry.plcGlcCode !== "" ||
      newEntry.perHourRate !== "" ||
      newEntry.status !== "Act";

    const isPeriodHoursModified = Object.keys(newEntryPeriodHours).length > 0;
    const isInputValuesModified = Object.keys(inputValues).length > 0;
    const isEditedEmployeeDataModified =
      Object.keys(editedEmployeeData).length > 0;

    return (
      isNewEntryModified ||
      isPeriodHoursModified ||
      isInputValuesModified ||
      isEditedEmployeeDataModified
    );
  };

  // Handle beforeunload event for unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges()) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue =
        "You have unsaved changes. Are you sure you want to leave without saving?";
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [newEntry, newEntryPeriodHours, inputValues, editedEmployeeData]);

  const fetchEmployees = async () => {
    if (!planId) return;
    setIsLoading(true);
    try {
      const employeeApi =
        planType === "EAC"
          ? `${backendUrl}/Project/GetEmployeeForecastByPlanID/${planId}`
          : `${backendUrl}/Project/GetEmployeeForecastByPlanID/${planId}`;
      const response = await axios.get(employeeApi);
      setLocalEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setLocalEmployees([]);
      if (err.response && err.response.status === 500) {
        toast.info("No forecast data available for this plan.", {
          toastId: "no-forecast-data",
          autoClose: 3000,
        });
      } else {
        toast.error(
          "Failed to load forecast data: " +
            (err.response?.data?.message || err.message),
          {
            toastId: "forecast-error",
            autoClose: 3000,
          }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [planId, planType]);

  useEffect(() => {
    const fetchDurations = async () => {
      if (!startDate || !endDate) {
        setDurations([]);
        setIsDurationLoading(false);
        return;
      }
      setIsDurationLoading(true);
      setError(null);
      try {
        const durationResponse = await axios.get(
          `${backendUrl}/Orgnization/GetWorkingDaysForDuration/${startDate}/${endDate}`
        );
        if (!Array.isArray(durationResponse.data)) {
          throw new Error("Invalid duration response format");
        }
        setDurations(durationResponse.data);
      } catch (err) {
        setError("Failed to load duration data. Please try again.");
        toast.error(
          "Failed to load duration data: " +
            (err.response?.data?.message || err.message),
          {
            toastId: "duration-error",
            autoClose: 3000,
          }
        );
      } finally {
        setIsDurationLoading(false);
      }
    };
    fetchDurations();
  }, [startDate, endDate]);

  // ADD THIS useEffect after your existing useEffects
  useEffect(() => {
    const loadOrganizationOptions = async () => {
      if (!showNewForm) return;

      try {
        const response = await axios.get(
          `${backendUrl}/Orgnization/GetAllOrgs`
        );
        const orgOptions = Array.isArray(response.data)
          ? response.data.map((org) => ({
              value: org.orgId,
              label: org.orgId,
            }))
          : [];
        setOrganizationOptions(orgOptions);
      } catch (err) {
        // console.error("Failed to fetch organizations:", err);
      }
    };

    loadOrganizationOptions();
  }, [showNewForm]);

  useEffect(() => {
    const initializeUpdateOptions = async () => {
      if (localEmployees.length === 0) return;

      try {
        // Load organizations for updates
        const orgResponse = await axios.get(
          `${backendUrl}/Orgnization/GetAllOrgs`
        );
        const orgOptions = Array.isArray(orgResponse.data)
          ? orgResponse.data.map((org) => ({
              value: org.orgId,
              label: org.orgId,
            }))
          : [];

        // Load project data for accounts and PLC options
        if (projectId) {
          try {
            // const response = await axios.get(
            //   `${backendUrl}/Project/GetAllProjectByProjId/${projectId}`
            // );
            const response = await axios.get(
              `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`
            );
            const data = Array.isArray(response.data)
              ? response.data[0]
              : response.data;

            // Load ALL account types for updates (including PLC and Other types)
            let allAccounts = [];

            // Employee accounts
            if (
              data.employeeLaborAccounts &&
              Array.isArray(data.employeeLaborAccounts)
            ) {
              const employeeAccounts = data.employeeLaborAccounts.map(
                (account) => ({
                  id: account.accountId,
                  type: "employee",
                })
              );
              allAccounts.push(...employeeAccounts);
            }

            // ADD THIS - Store accounts with names for updates
            let allAccountsWithNames = [];

            if (
              data.employeeLaborAccounts &&
              Array.isArray(data.employeeLaborAccounts)
            ) {
              const employeeAccountsWithNames = data.employeeLaborAccounts.map(
                (account) => ({
                  id: account.accountId,
                  name: account.acctName,
                  type: "employee",
                })
              );
              allAccountsWithNames.push(...employeeAccountsWithNames);
            }

            if (
              data.sunContractorLaborAccounts &&
              Array.isArray(data.sunContractorLaborAccounts)
            ) {
              const vendorAccountsWithNames =
                data.sunContractorLaborAccounts.map((account) => ({
                  id: account.accountId,
                  name: account.acctName,
                  type: "vendor",
                }));
              allAccountsWithNames.push(...vendorAccountsWithNames);
            }

            if (
              data.otherDirectCostLaborAccounts &&
              Array.isArray(data.otherDirectCostLaborAccounts)
            ) {
              const otherAccountsWithNames =
                data.otherDirectCostLaborAccounts.map((account) => ({
                  id: account.accountId,
                  name: account.acctName,
                  type: "other",
                }));
              allAccountsWithNames.push(...otherAccountsWithNames);
            }

            // Remove duplicates from accountsWithNames too
            const uniqueAccountsWithNamesMap = new Map();
            allAccountsWithNames.forEach((acc) => {
              if (acc.id && !uniqueAccountsWithNamesMap.has(acc.id)) {
                uniqueAccountsWithNamesMap.set(acc.id, {
                  id: acc.id,
                  name: acc.name,
                });
              }
            });
            const uniqueAccountsWithNames = Array.from(
              uniqueAccountsWithNamesMap.values()
            );

            // Add this line where you set the other update options:
            setAccountOptionsWithNames(uniqueAccountsWithNames);

            // Vendor accounts
            if (
              data.sunContractorLaborAccounts &&
              Array.isArray(data.sunContractorLaborAccounts)
            ) {
              const vendorAccounts = data.sunContractorLaborAccounts.map(
                (account) => ({
                  id: account.accountId,
                  type: "vendor",
                })
              );
              allAccounts.push(...vendorAccounts);
            }

            // Other Direct Cost accounts (for "Other" ID type)
            if (
              data.otherDirectCostLaborAccounts &&
              Array.isArray(data.otherDirectCostLaborAccounts)
            ) {
              const otherAccounts = data.otherDirectCostLaborAccounts.map(
                (account) => ({
                  id: account.accountId,
                  type: "other",
                })
              );
              allAccounts.push(...otherAccounts);
            }

            // Remove duplicates
            const uniqueAccountsMap = new Map();
            allAccounts.forEach((acc) => {
              if (acc.id && !uniqueAccountsMap.has(acc.id)) {
                uniqueAccountsMap.set(acc.id, { id: acc.id });
              }
            });
            const uniqueAccounts = Array.from(uniqueAccountsMap.values());

            // Load PLC options
            let plcOptionsForUpdate = [];
            if (data.plc && Array.isArray(data.plc)) {
              plcOptionsForUpdate = data.plc.map((plc) => ({
                value: plc.laborCategoryCode,
                label: `${plc.laborCategoryCode} - ${plc.description}`,
              }));
            }

            // Initialize all update options with ALL available accounts
            setUpdateAccountOptions(uniqueAccounts);
            setUpdateOrganizationOptions(orgOptions);
            setUpdatePlcOptions(plcOptionsForUpdate);

            // Also update main options if they're empty
            if (plcOptions.length === 0) {
              setPlcOptions(plcOptionsForUpdate);
              setFilteredPlcOptions(plcOptionsForUpdate);
            }
          } catch (err) {
            // console.error("Failed to load project data for updates:", err);
            setUpdateAccountOptions(laborAccounts);
            setUpdateOrganizationOptions(orgOptions);
            setUpdatePlcOptions(plcOptions.length > 0 ? plcOptions : []);
          }
        }
      } catch (err) {
        // console.error("Failed to initialize update options:", err);
      }
    };

    initializeUpdateOptions();
  }, [localEmployees.length, projectId]);

  useEffect(() => {
    const fetchEmployeesSuggestions = async () => {
      // Skip fetching suggestions for NBBUD
      // if (planType === "NBBUD") {
      //   setEmployeeSuggestions([]);
      //   return;
      // }

      if (
        !projectId ||
        !showNewForm ||
        !newEntry.idType ||
        newEntry.idType === ""
      ) {
        setEmployeeSuggestions([]);
        // return;
      }

      try {
        const endpoint =
          newEntry.idType === "Vendor"
            ? `${backendUrl}/Project/GetVenderEmployeesByProject/${projectId}`
            : `${backendUrl}/Project/GetEmployeesByProject/${projectId}`;
        const response = await axios.get(endpoint);
        const suggestions = Array.isArray(response.data)
          ? response.data.map((emp) => {
              if (newEntry.idType === "Vendor") {
                return {
                  emplId: String(emp.vendId),
                  firstName: "",
                  lastName: emp.employeeName || "",
                  perHourRate: emp.perHourRate || emp.hrRate || "",
                  plc: emp.plc || "",
                  orgId: emp.orgId || "",
                };
              } else {
                const [lastName, firstName] = (emp.employeeName || "")
                  .split(", ")
                  .map((str) => str.trim());
                return {
                  emplId: emp.empId,
                  firstName: firstName || "",
                  lastName: lastName || "",
                  perHourRate: emp.perHourRate || emp.hrRate || "",
                  plc: emp.plc || "",
                  orgId: emp.orgId || "",
                };
              }
            })
          : [];
        setEmployeeSuggestions(suggestions);
      } catch (err) {
        setEmployeeSuggestions([]);
        toast.error(`Failed to fetch employee suggestions`, {
          toastId: "employee-fetch-error",
          autoClose: 3000,
        });
      }
    };

    const fetchLaborAccounts = async () => {
      // if (planType === "NBBUD") return;

      if (!projectId || !showNewForm) return;
      try {
        // const response = await axios.get(
        //   `${backendUrl}/Project/GetAllProjectByProjId/${projectId}`
        // );
        const response = await axios.get(
          `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`
        );
        const data = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        let accounts = [];
        let accountsWithNames = []; // ADD THIS

        if (newEntry.idType === "PLC") {
          // Combine both employee and vendor accounts for PLC
          const employeeAccounts = Array.isArray(data.employeeLaborAccounts)
            ? data.employeeLaborAccounts.map((account) => ({
                id: account.accountId,
              }))
            : [];

          const vendorAccounts = Array.isArray(data.sunContractorLaborAccounts)
            ? data.sunContractorLaborAccounts.map((account) => ({
                id: account.accountId,
              }))
            : [];

          accounts = [...employeeAccounts, ...vendorAccounts];

          // ADD THIS - Store accounts with names
          const employeeAccountsWithNames = Array.isArray(
            data.employeeLaborAccounts
          )
            ? data.employeeLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];

          const vendorAccountsWithNames = Array.isArray(
            data.sunContractorLaborAccounts
          )
            ? data.sunContractorLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];

          accountsWithNames = [
            ...employeeAccountsWithNames,
            ...vendorAccountsWithNames,
          ];
        } else if (newEntry.idType === "Employee") {
          accounts = Array.isArray(data.employeeLaborAccounts)
            ? data.employeeLaborAccounts.map((account) => ({
                id: account.accountId,
              }))
            : [];

          // ADD THIS
          accountsWithNames = Array.isArray(data.employeeLaborAccounts)
            ? data.employeeLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
        } else if (newEntry.idType === "Vendor") {
          accounts = Array.isArray(data.sunContractorLaborAccounts)
            ? data.sunContractorLaborAccounts.map((account) => ({
                id: account.accountId,
              }))
            : [];

          // ADD THIS
          accountsWithNames = Array.isArray(data.sunContractorLaborAccounts)
            ? data.sunContractorLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
        } else if (newEntry.idType === "Other") {
          accounts = Array.isArray(data.otherDirectCostLaborAccounts)
            ? data.otherDirectCostLaborAccounts.map((account) => ({
                id: account.accountId,
              }))
            : [];

          // ADD THIS
          accountsWithNames = Array.isArray(data.otherDirectCostLaborAccounts)
            ? data.otherDirectCostLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
        } else {
          accounts = [];
          accountsWithNames = []; // ADD THIS
        }

        // Remove duplicates
        const uniqueAccountsMap = new Map();
        const uniqueAccountsWithNamesMap = new Map(); // ADD THIS
        accounts.forEach((acc) => {
          if (acc.id && !uniqueAccountsMap.has(acc.id)) {
            uniqueAccountsMap.set(acc.id, acc);
          }
        });

        // ADD THIS
        accountsWithNames.forEach((acc) => {
          if (acc.id && !uniqueAccountsWithNamesMap.has(acc.id)) {
            uniqueAccountsWithNamesMap.set(acc.id, acc);
          }
        });
        const uniqueAccounts = Array.from(uniqueAccountsMap.values());
        const uniqueAccountsWithNames = Array.from(
          uniqueAccountsWithNamesMap.values()
        ); // ADD THIS

        setLaborAccounts(uniqueAccounts);
        setAccountOptionsWithNames(uniqueAccountsWithNames); // ADD THIS

        // Rest of your existing code for PLC options and organization...
        if (data.plc && Array.isArray(data.plc)) {
          const plcOptionsFromApi = data.plc.map((plc) => ({
            value: plc.laborCategoryCode,
            label: `${plc.laborCategoryCode} - ${plc.description}`,
          }));

          setPlcOptions(plcOptionsFromApi);
          setFilteredPlcOptions(plcOptionsFromApi);
        } else {
          setPlcOptions([]);
          setFilteredPlcOptions([]);
        }

        // Auto-populate organization for Vendor Employees if present
        if (newEntry.idType === "Vendor" && data.orgId) {
          setNewEntry((prev) => ({
            ...prev,
            orgId: data.orgId,
          }));
        }
      } catch (err) {
        // console.error("Error fetching labor accounts:", err);
        setLaborAccounts([]);
        setAccountOptionsWithNames([]); // ADD THIS
        setPlcOptions([]);
        setFilteredPlcOptions([]);
        toast.error("Failed to fetch labor accounts", {
          toastId: "labor-accounts-error",
          autoClose: 3000,
        });
      }
    };

    if (showNewForm) {
      fetchEmployeesSuggestions();
      fetchLaborAccounts();
    } else {
      setEmployeeSuggestions([]);
      setLaborAccounts([]);
      setPlcOptions([]);
      setFilteredPlcOptions([]); // ADD THIS LINE
      setPlcSearch("");
      setOrgSearch("");
      setAutoPopulatedPLC(false);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [projectId, showNewForm, newEntry.idType, planType]);

  // Initialize filtered PLC options when PLC options change
  useEffect(() => {
    if (plcOptions.length > 0) {
      setFilteredPlcOptions(plcOptions);
    }
  }, [plcOptions]);

  useEffect(() => {
    const initializeAccountNames = async () => {
      if (!projectId || !planType) return;

      try {
        const response = await axios.get(
          `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`
        );
        const data = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        // Collect ALL account types with names for existing employees
        let allAccountsWithNames = [];

        if (
          data.employeeLaborAccounts &&
          Array.isArray(data.employeeLaborAccounts)
        ) {
          const employeeAccountsWithNames = data.employeeLaborAccounts.map(
            (account) => ({
              id: account.accountId,
              name: account.acctName,
            })
          );
          allAccountsWithNames.push(...employeeAccountsWithNames);
        }

        if (
          data.sunContractorLaborAccounts &&
          Array.isArray(data.sunContractorLaborAccounts)
        ) {
          const vendorAccountsWithNames = data.sunContractorLaborAccounts.map(
            (account) => ({
              id: account.accountId,
              name: account.acctName,
            })
          );
          allAccountsWithNames.push(...vendorAccountsWithNames);
        }

        if (
          data.otherDirectCostLaborAccounts &&
          Array.isArray(data.otherDirectCostLaborAccounts)
        ) {
          const otherAccountsWithNames = data.otherDirectCostLaborAccounts.map(
            (account) => ({
              id: account.accountId,
              name: account.acctName,
            })
          );
          allAccountsWithNames.push(...otherAccountsWithNames);
        }

        // Remove duplicates
        const uniqueAccountsWithNamesMap = new Map();
        allAccountsWithNames.forEach((acc) => {
          if (acc.id && !uniqueAccountsWithNamesMap.has(acc.id)) {
            uniqueAccountsWithNamesMap.set(acc.id, {
              id: acc.id,
              name: acc.name,
            });
          }
        });
        const uniqueAccountsWithNames = Array.from(
          uniqueAccountsWithNamesMap.values()
        );

        setAccountOptionsWithNames(uniqueAccountsWithNames);
      } catch (err) {
        console.error("Failed to initialize account names:", err);
        setAccountOptionsWithNames([]);
      }
    };

    initializeAccountNames();
  }, [projectId, planType]); // Trigger when projectId or planType changes

  const handleEmployeeDataChange = (empIdx, field, value) => {
    if (!isEditable || !isFieldEditable) return;

    setEditedEmployeeData((prev) => ({
      ...prev,
      [empIdx]: {
        ...prev[empIdx],
        [field]: value,
      },
    }));

    // Mark as having unsaved changes
    setHasUnsavedEmployeeChanges(true);

    // Rest of your warning logic...
    const emp = localEmployees[empIdx];
    if (emp && emp.emple) {
      const emplId = emp.emple.emplId;

      if (field === "acctId") {
        const warningKey = generateFieldWarningKey(emplId, "account", value);
        const hasWarning = checkAccountInvalid(value, updateAccountOptions);

        setLocalWarnings((prev) => {
          const updated = { ...prev };
          if (hasWarning) {
            updated[warningKey] = true;
          } else {
            delete updated[warningKey];
          }
          return updated;
        });
      }

      if (field === "orgId") {
        const warningKey = generateFieldWarningKey(
          emplId,
          "organization",
          value
        );
        const hasWarning = checkOrgInvalid(value, updateOrganizationOptions);

        setLocalWarnings((prev) => {
          const updated = { ...prev };
          if (hasWarning) {
            updated[warningKey] = true;
          } else {
            delete updated[warningKey];
          }
          return updated;
        });
      }
    }
  };

  const handleOrgInputChangeForUpdate = (value, actualEmpIdx) => {
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Remove real-time validation - only validate on blur
    handleEmployeeDataChange(actualEmpIdx, "orgId", numericValue);
    setOrgSearch(numericValue);

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Always fetch filtered organizations when user types
    if (numericValue.length >= 1) {
      debounceTimeout.current = setTimeout(async () => {
        try {
          const response = await axios.get(
            `${backendUrl}/Orgnization/GetAllOrgs`
          );
          const filteredOptions = Array.isArray(response.data)
            ? response.data
                .filter((org) => org.orgId.toString().startsWith(numericValue))
                .map((org) => ({
                  value: org.orgId,
                  label: org.orgId,
                }))
            : [];
          setUpdateOrganizationOptions(filteredOptions); // Use correct state variable
        } catch (err) {
          // console.error("Failed to fetch organizations:", err);
          setUpdateOrganizationOptions([]);
        }
      }, 300);
    } else {
      // Load all organizations when input is empty
      debounceTimeout.current = setTimeout(async () => {
        try {
          const response = await axios.get(
            `${backendUrl}/Orgnization/GetAllOrgs`
          );
          const orgOptions = Array.isArray(response.data)
            ? response.data.map((org) => ({
                value: org.orgId,
                label: org.orgId,
              }))
            : [];
          setUpdateOrganizationOptions(orgOptions);
        } catch (err) {
          // console.error("Failed to fetch organizations:", err);
          setUpdateOrganizationOptions([]);
        }
      }, 300);
    }
  };

  

  // const handlePlcInputChangeForUpdate = (value, actualEmpIdx) => {
  //   if (planType === "NBBUD") {
  //     handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
  //     setPlcSearch(value);
  //     return;
  //   }

  //   // Only allow empty value or values that start with available PLC options
  //   const isValidInput =
  //     value === "" ||
  //     plcOptions.some((option) =>
  //       option.value.toLowerCase().startsWith(value.toLowerCase())
  //     );

  //   if (!isValidInput) {
  //     // Don't update state if input doesn't match any PLC option
  //     toast.warning("Only values from the PLC suggestions are allowed", {
  //       autoClose: 2000,
  //     });
  //     return;
  //   }

  //   handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
  //   setPlcSearch(value);

  //   // Always filter from the original plcOptions
  //   if (value.length >= 1) {
  //     const filtered = plcOptions.filter(
  //       (option) =>
  //         option.value.toLowerCase().includes(value.toLowerCase()) ||
  //         option.label.toLowerCase().includes(value.toLowerCase())
  //     );
  //     setUpdatePlcOptions(filtered);
  //   } else {
  //     // Reset to all available PLC options when input is empty
  //     setUpdatePlcOptions(plcOptions);
  //   }
  // };
  
  // const handlePlcInputChangeForUpdate = (value, actualEmpIdx) => {
  //   if (planType === "NBBUD") {
  //     handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
  //     setPlcSearch(value);
  //     return;
  //   }

  //   // FIX: Removed the strict isValidInput check here.
  //   // This allows backspacing and typing freely. 
  //   // The existing onBlur logic on the input field handles the final validation.

  //   handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
  //   setPlcSearch(value);

  //   // Always filter from the original plcOptions
  //   if (value.length >= 1) {
  //     const filtered = plcOptions.filter(
  //       (option) =>
  //         option.value.toLowerCase().includes(value.toLowerCase()) ||
  //         option.label.toLowerCase().includes(value.toLowerCase())
  //     );
  //     setUpdatePlcOptions(filtered);
  //   } else {
  //     // Reset to all available PLC options when input is empty
  //     setUpdatePlcOptions(plcOptions);
  //   }
  // };
  
  // const handlePlcInputChangeForUpdate = (value, actualEmpIdx) => {
  //   // 1. Update the PLC code
  //   handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
  //   setPlcSearch(value);

  //   // 2. Find the description (Label) for the new PLC
  //   // Use updatePlcOptions if populated, otherwise fallback to main plcOptions
  //   const currentOptions = updatePlcOptions.length > 0 ? updatePlcOptions : plcOptions;
  //   const selectedOption = currentOptions.find(
  //     (opt) => opt.value.toLowerCase() === value.toLowerCase()
  //   );

  //   // 3. Check if the employee is of type PLC and update the name (firstName)
  //   const emp = localEmployees[actualEmpIdx];
  //   // Check strictly if it is a PLC type row
  //   if (emp && emp.emple && (emp.emple.type === "PLC" || emp.emple.idType === "PLC")) {
  //       if (selectedOption) {
  //           // Update the edited state for firstName with the PLC Description
  //           handleEmployeeDataChange(actualEmpIdx, "firstName", selectedOption.label);
  //       } else if (value === "") {
  //           // Clear name if PLC is cleared
  //           handleEmployeeDataChange(actualEmpIdx, "firstName", "");
  //       }
  //   }

  //   // Filter logic for the datalist
  //   if (value.length >= 1) {
  //     const filtered = plcOptions.filter(
  //       (option) =>
  //         option.value.toLowerCase().includes(value.toLowerCase()) ||
  //         option.label.toLowerCase().includes(value.toLowerCase())
  //     );
  //     setUpdatePlcOptions(filtered);
  //   } else {
  //     setUpdatePlcOptions(plcOptions);
  //   }
  // };
  
  const handlePlcInputChangeForUpdate = (value, actualEmpIdx) => {
    // 1. Update the PLC code in state
    handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
    setPlcSearch(value);

    // 2. Find the matching PLC option to get the description
    // Use the full list of options to ensure we find the match
    const selectedOption = plcOptions.find(
      (opt) => opt.value.toLowerCase() === value.toLowerCase()
    );

    // 3. Check if the row is a PLC type and update the name if a match is found
    const emp = localEmployees[actualEmpIdx];
    // Check strict type (API data might be "PLC" or "PLC Employee" depending on backend)
    const isPlcType = emp && emp.emple && (emp.emple.type === "PLC" || emp.emple.idType === "PLC");

    if (isPlcType) {
      if (selectedOption) {
        // Update the Name (stored in firstName for display) with the PLC Description
        handleEmployeeDataChange(actualEmpIdx, "firstName", selectedOption.label);
      } else if (value === "") {
        // Clear name if PLC is cleared
        handleEmployeeDataChange(actualEmpIdx, "firstName", "");
      }
    }

    // 4. Update the datalist options based on search
    if (value.length >= 1) {
      const filtered = plcOptions.filter(
        (option) =>
          option.value.toLowerCase().includes(value.toLowerCase()) ||
          option.label.toLowerCase().includes(value.toLowerCase())
      );
      setUpdatePlcOptions(filtered);
    } else {
      setUpdatePlcOptions(plcOptions);
    }
  };


  const handleOrgInputChange = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Remove real-time validation - only validate on blur
    setNewEntry((prev) => ({ ...prev, orgId: numericValue }));
    setOrgSearch(numericValue);

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Always fetch filtered organizations when user types
    if (numericValue.length >= 1) {
      debounceTimeout.current = setTimeout(async () => {
        try {
          const response = await axios.get(
            `${backendUrl}/Orgnization/GetAllOrgs`
          );
          const filteredOptions = Array.isArray(response.data)
            ? response.data
                .filter((org) => org.orgId.toString().startsWith(numericValue))
                .map((org) => ({
                  value: org.orgId,
                  label: org.orgId,
                }))
            : [];
          setOrganizationOptions(filteredOptions);
        } catch (err) {
          // console.error("Failed to fetch organizations:", err);
          setOrganizationOptions([]);
        }
      }, 300);
    } else {
      // Load all organizations when input is empty
      debounceTimeout.current = setTimeout(async () => {
        try {
          const response = await axios.get(
            `${backendUrl}/Orgnization/GetAllOrgs`
          );
          const orgOptions = Array.isArray(response.data)
            ? response.data.map((org) => ({
                value: org.orgId,
                label: org.orgId,
              }))
            : [];
          setOrganizationOptions(orgOptions);
        } catch (err) {
          // console.error("Failed to fetch organizations:", err);
          setOrganizationOptions([]);
        }
      }, 300);
    }
  };

  const handleIdTypeChange = (value) => {
    setNewEntry((prev) => ({
      id: "",
      firstName: "",
      lastName: "",
      isRev: false,
      isBrd: false,
      idType: value,
      acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
      orgId: "",
      plcGlcCode: "",
      perHourRate: "",
      // status: "Act",
      status: value === "Other" ? "ACT" : "Act",
    }));
    setPlcSearch("");
    setAutoPopulatedPLC(false);
  };

  const handlePlcInputChange = (value) => {
  // Search for the option regardless of plan type to get the name/label
  const selectedOption = plcOptions.find(
    (opt) => opt.value.toLowerCase() === value.toLowerCase()
  );

  if (planType === "NBBUD") {
    setPlcSearch(value);
    setNewEntry((prev) => ({ 
      ...prev, 
      plcGlcCode: value,
      // FIX: Update name for PLC type in NBBUD
      firstName: prev.idType === "PLC" && selectedOption ? selectedOption.label : prev.firstName
    }));
    return;
  }

  const isValidInput =
    value === "" ||
    plcOptions.some((option) =>
      option.value.toLowerCase().startsWith(value.toLowerCase())
    );

  if (!isValidInput) {
    toast.warning("Only values from the PLC suggestions are allowed", {
      autoClose: 2000,
    });
    return;
  }

  setPlcSearch(value);

  setNewEntry((prev) => ({
    ...prev,
    plcGlcCode: value,
    firstName:
      prev.idType === "PLC" && selectedOption
        ? selectedOption.label
        : prev.firstName,
  }));

  if (value.length >= 1) {
    const filtered = plcOptions.filter((option) =>
      option.value.toLowerCase().startsWith(value.toLowerCase())
    );
    setFilteredPlcOptions(filtered);
  } else {
    setFilteredPlcOptions(plcOptions);
  }

  if (autoPopulatedPLC && value !== newEntry.plcGlcCode) {
    setAutoPopulatedPLC(false);
  }
};

  // const handlePlcInputChange = (value) => {
  //   // Remove real-time validation - only validate on blur
  //   setPlcSearch(value);
  //   setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));

  //   // Filter PLC options
  //   if (value.length >= 1) {
  //     const filtered = plcOptions.filter((option) =>
  //       option.value.toLowerCase().startsWith(value.toLowerCase())
  //     );
  //     setFilteredPlcOptions(filtered);
  //   } else {
  //     setFilteredPlcOptions(plcOptions);
  //   }

  //   // Reset auto-populated flag when user manually types
  //   if (autoPopulatedPLC && value !== newEntry.plcGlcCode) {
  //     setAutoPopulatedPLC(false);
  //   }
  // };

  // const handlePlcInputChange = (value) => {
  //   if (planType === "NBBUD") {
  //     setPlcSearch(value);
  //     setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));
  //     return;
  //   }

  //   // Only allow typing if the value matches available PLC options
  //   const isValidInput =
  //     plcOptions.some((option) =>
  //       option.value.toLowerCase().startsWith(value.toLowerCase())
  //     ) || value === "";

  //   if (!isValidInput && value.length > 0) {
  //     // Don't update if the input doesn't match any PLC option
  //     return;
  //   }

  //   setPlcSearch(value);
  //   setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));

  //   // Filter PLC options
  //   if (value.length >= 1) {
  //     const filtered = plcOptions.filter((option) =>
  //       option.value.toLowerCase().startsWith(value.toLowerCase())
  //     );
  //     setFilteredPlcOptions(filtered);
  //   } else {
  //     setFilteredPlcOptions(plcOptions);
  //   }

  //   // Reset auto-populated flag when user manually types
  //   if (autoPopulatedPLC && value !== newEntry.plcGlcCode) {
  //     setAutoPopulatedPLC(false);
  //   }
  // };

//   const handlePlcInputChange = (value) => {
//   if (planType === "NBBUD") {
//     setPlcSearch(value);
//     setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));
//     return;
//   }

//   // Only allow empty value or values that start with available PLC options
//   const isValidInput =
//     value === "" ||
//     plcOptions.some((option) =>
//       option.value.toLowerCase().startsWith(value.toLowerCase())
//     );

//   if (!isValidInput) {
//     toast.warning("Only values from the PLC suggestions are allowed", {
//       autoClose: 2000,
//     });
//     return;
//   }

//   setPlcSearch(value);

//   // --- FIX START: Only update Name if ID Type is PLC ---
//   const selectedOption = plcOptions.find(
//     (opt) => opt.value.toLowerCase() === value.toLowerCase()
//   );

//   setNewEntry((prev) => ({
//     ...prev,
//     plcGlcCode: value,
//     // Only overwrite firstName if the specific ID Type is PLC
//     firstName:
//       prev.idType === "PLC" && selectedOption
//         ? selectedOption.label
//         : prev.firstName,
//   }));
//   // --- FIX END ---

//   // Filter PLC options
//   if (value.length >= 1) {
//     const filtered = plcOptions.filter((option) =>
//       option.value.toLowerCase().startsWith(value.toLowerCase())
//     );
//     setFilteredPlcOptions(filtered);
//   } else {
//     setFilteredPlcOptions(plcOptions);
//   }

//   if (autoPopulatedPLC && value !== newEntry.plcGlcCode) {
//     setAutoPopulatedPLC(false);
//   }
// };

  // const handlePlcInputChange = (value) => {
  //   if (planType === "NBBUD") {
  //     setPlcSearch(value);
  //     setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));
  //     return;
  //   }

  //   // Only allow empty value or values that start with available PLC options
  //   const isValidInput =
  //     value === "" ||
  //     plcOptions.some((option) =>
  //       option.value.toLowerCase().startsWith(value.toLowerCase())
  //     );

  //   if (!isValidInput) {
  //     // Don't update state if input doesn't match any PLC option
  //     toast.warning("Only values from the PLC suggestions are allowed", {
  //       autoClose: 2000,
  //     });
  //     return;
  //   }

  //   setPlcSearch(value);
  //   const selectedOption = plcOptions.find(opt => opt.value.toLowerCase() === value.toLowerCase());

  //   setNewEntry((prev) => ({ 
  //     ...prev, 
  //     plcGlcCode: value,
  //     // If we found a match, update the name. If newEntry.idType is PLC, this field is read-only in UI
  //     firstName: selectedOption ? selectedOption.label : prev.firstName
  //   }));

  //   // setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));

  //   // Filter PLC options
  //   if (value.length >= 1) {
  //     const filtered = plcOptions.filter((option) =>
  //       option.value.toLowerCase().startsWith(value.toLowerCase())
  //     );
  //     setFilteredPlcOptions(filtered);
  //   } else {
  //     setFilteredPlcOptions(plcOptions);
  //   }

  //   // Reset auto-populated flag when user manually types
  //   if (autoPopulatedPLC && value !== newEntry.plcGlcCode) {
  //     setAutoPopulatedPLC(false);
  //   }
  // };



  const handleAccountBlur = (val) => {
    if (planType === "NBBUD") return; // Add this line
    if (val && !isValidAccount(val)) {
      toast.error("Please enter a valid Account from the available list.", {
        autoClose: 3000,
      });
      setNewEntry((prev) => ({ ...prev, acctId: "" }));
    }
  };

  const handleOrgBlur = (val) => {
    if (planType === "NBBUD") return; // Add this line
    if (!isValidOrg(val)) {
      toast.error(
        "Please enter a valid numeric Organization ID from the available list.",
        { autoClose: 3000 }
      );
      setNewEntry((prev) => ({ ...prev, orgId: "" }));
      setOrgSearch("");
    }
  };

  const handlePlcBlur = (val) => {
    if (planType === "NBBUD") return; // Add this line
    if (val && !isValidPlc(val)) {
      toast.error("Please enter a valid PLC from the available list.", {
        autoClose: 3000,
      });
      if (!autoPopulatedPLC) {
        setNewEntry((prev) => ({ ...prev, plcGlcCode: "" }));
        setPlcSearch("");
      }
    }
  };

  const handleAccountChange = (value) => {
    setNewEntry((prev) => ({ ...prev, acctId: value }));
  };

  const handleOrgChange = (value) => {
    setNewEntry((prev) => ({ ...prev, orgId: value }));
    setOrgSearch(value); // Add this line to track search
  };

  // const handleIdChange = (value) => {
  //   const trimmedValue = value.trim();

  //   if (planType === "NBBUD") {
  //     // For NBBUD, still try to populate from suggestions if available
  //     if (
  //       (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
  //       employeeSuggestions.length > 0 &&
  //       trimmedValue
  //     ) {
  //       const selectedEmployee = employeeSuggestions.find(
  //         (emp) => emp.emplId === trimmedValue
  //       );

  //       if (selectedEmployee) {
  //         setNewEntry((prev) => ({
  //           ...prev,
  //           id: trimmedValue,
  //           firstName: selectedEmployee.firstName || "",
  //           lastName: selectedEmployee.lastName || "",
  //           perHourRate: selectedEmployee.perHourRate || "",
  //           orgId: selectedEmployee.orgId || prev.orgId,
  //           plcGlcCode: selectedEmployee.plc || "",
  //         }));
  //         setPlcSearch(selectedEmployee.plc || "");
  //       }
  //     }
  //     return;
  //   }

  //   // Skip all validation and suggestions for NBBUD
  //   // if (planType === "NBBUD") {
  //   //   setNewEntry((prev) => ({ ...prev, id: trimmedValue }));
  //   //   return;
  //   // }

  //   // 1. PLC type is always “PLC”
  //   if (newEntry.idType === "PLC") {
  //     setNewEntry((prev) => ({ ...prev, id: "PLC" }));
  //     return;
  //   }

  //   // 2. Persist whatever the user typed
  //   setNewEntry((prev) => ({ ...prev, id: trimmedValue }));

  //   // 3. If the field is cleared, reset most fields and exit
  //   if (!trimmedValue) {
  //     setNewEntry((prev) => ({
  //       ...prev,
  //       id: "",
  //       firstName: "",
  //       lastName: "",
  //       perHourRate: "",
  //       orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
  //       plcGlcCode: "",
  //       acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
  //     }));
  //     setPlcSearch("");
  //     setAutoPopulatedPLC(false);
  //     return;
  //   }

  //   // 5. “Other” type needs no further validation
  //   if (newEntry.idType === "Other") return;

  //   // 6. For Employee / Vendor types, try to auto-populate from suggestions
  //   if (
  //     (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
  //     employeeSuggestions.length > 0
  //   ) {
  //     const selectedEmployee = employeeSuggestions.find(
  //       (emp) => emp.emplId === trimmedValue
  //     );

  //     if (selectedEmployee) {
  //       // Found a match – copy its details, *including PLC*
  //       setNewEntry((prev) => ({
  //         ...prev,
  //         id: trimmedValue,
  //         firstName: selectedEmployee.firstName || "",
  //         lastName: selectedEmployee.lastName || "",
  //         perHourRate: selectedEmployee.perHourRate || "",
  //         orgId: selectedEmployee.orgId || prev.orgId,
  //         plcGlcCode: selectedEmployee.plc || "",
  //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
  //       }));
  //       setPlcSearch(selectedEmployee.plc || "");
  //       // setAutoPopulatedPLC(!!selectedEmployee.plc);
  //     } else {
  //       // No exact match – warn only if the entry is clearly invalid
  //       if (trimmedValue.length >= 3) {
  //         const partialMatch = employeeSuggestions.some((emp) =>
  //           emp.emplId.startsWith(trimmedValue)
  //         );
  //         if (!partialMatch) {
  //           toast.error("Invalid ID, please select a valid one!", {
  //             toastId: "invalid-id",
  //             autoClose: 3000,
  //           });
  //         }
  //       }

  //       // Leave any previously auto-populated PLC untouched;
  //       // only clear PLC when it wasn’t auto-filled.
  //       setNewEntry((prev) => ({
  //         ...prev,
  //         firstName: "",
  //         lastName: "",
  //         perHourRate: "",
  //         orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
  //         plcGlcCode:
  //           newEntry.idType === "Vendor" && autoPopulatedPLC
  //             ? prev.plcGlcCode
  //             : "",
  //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
  //       }));

  //       if (!(newEntry.idType === "Vendor" && autoPopulatedPLC)) {
  //         setPlcSearch("");
  //         setAutoPopulatedPLC(false);
  //       }
  //     }
  //   }
  // };

  // Function to handle row selection

  const handleIdChange = (value) => {
  // FIX: Remove emojis immediately before processing
  const valueWithoutEmojis = value.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ""
  );

  // Use the sanitized value
  const trimmedValue = valueWithoutEmojis.trim();

  if (planType === "NBBUD") {
    if (
      (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
      employeeSuggestions.length > 0 &&
      trimmedValue
    ) {
      const selectedEmployee = employeeSuggestions.find(
        (emp) => emp.emplId === trimmedValue
      );

      if (selectedEmployee) {
        setNewEntry((prev) => ({
          ...prev,
          id: valueWithoutEmojis, // Use sanitized value
          firstName: selectedEmployee.firstName || "",
          lastName: selectedEmployee.lastName || "",
          perHourRate: selectedEmployee.perHourRate || "",
          orgId: selectedEmployee.orgId || prev.orgId,
          plcGlcCode: selectedEmployee.plc || "",
        }));
        setPlcSearch(selectedEmployee.plc || "");
        return;
      }
    }
    
    setNewEntry((prev) => ({ ...prev, id: valueWithoutEmojis }));
    return;
  }

  if (newEntry.idType === "PLC") {
    setNewEntry((prev) => ({ ...prev, id: "PLC" }));
    return;
  }

  // Persist sanitized value
  setNewEntry((prev) => ({ ...prev, id: valueWithoutEmojis }));

  if (!trimmedValue) {
    setNewEntry((prev) => ({
      ...prev,
      id: "",
      firstName: "",
      lastName: "",
      perHourRate: "",
      orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
      plcGlcCode: "",
      acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    }));
    setPlcSearch("");
    setAutoPopulatedPLC(false);
    return;
  }

  if (newEntry.idType === "Other") return;

  if (
    (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
    employeeSuggestions.length > 0
  ) {
    const selectedEmployee = employeeSuggestions.find(
      (emp) => emp.emplId === trimmedValue
    );

    if (selectedEmployee) {
      setNewEntry((prev) => ({
        ...prev,
        firstName: selectedEmployee.firstName || "",
        lastName: selectedEmployee.lastName || "",
        perHourRate: selectedEmployee.perHourRate || "",
        orgId: selectedEmployee.orgId || prev.orgId,
        plcGlcCode: selectedEmployee.plc || "",
        acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
      }));
      setPlcSearch(selectedEmployee.plc || "");
    } else {
      if (trimmedValue.length >= 3) {
        const partialMatch = employeeSuggestions.some((emp) =>
          emp.emplId.startsWith(trimmedValue)
        );
        if (!partialMatch) {
          toast.error("Invalid ID, please select a valid one!", {
            toastId: "invalid-id",
            autoClose: 3000,
          });
        }
      }

      setNewEntry((prev) => ({
        ...prev,
        firstName: "",
        lastName: "",
        perHourRate: "",
        orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
        plcGlcCode:
          newEntry.idType === "Vendor" && autoPopulatedPLC
            ? prev.plcGlcCode
            : "",
        acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
      }));

      if (!(newEntry.idType === "Vendor" && autoPopulatedPLC)) {
        setPlcSearch("");
        setAutoPopulatedPLC(false);
      }
    }
  }
};
  
  // const handleIdChange = (value) => {
  //   // KEY CHANGE 1: Keep 'value' raw for the UI, create 'trimmedValue' for lookups
  //   const trimmedValue = value.trim();

  //   if (planType === "NBBUD") {
  //     // For NBBUD, still try to populate from suggestions if available
  //     if (
  //       (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
  //       employeeSuggestions.length > 0 &&
  //       trimmedValue
  //     ) {
  //       const selectedEmployee = employeeSuggestions.find(
  //         (emp) => emp.emplId === trimmedValue
  //       );

  //       if (selectedEmployee) {
  //         setNewEntry((prev) => ({
  //           ...prev,
  //           id: value, // KEY CHANGE: Use raw value to allow spaces while typing
  //           firstName: selectedEmployee.firstName || "",
  //           lastName: selectedEmployee.lastName || "",
  //           perHourRate: selectedEmployee.perHourRate || "",
  //           orgId: selectedEmployee.orgId || prev.orgId,
  //           plcGlcCode: selectedEmployee.plc || "",
  //         }));
  //         setPlcSearch(selectedEmployee.plc || "");
  //         return; // Added return to prevent double state update
  //       }
  //     }
      
  //     // If no match found in NBBUD, just update the ID text
  //     setNewEntry((prev) => ({ ...prev, id: value }));
  //     return;
  //   }

  //   // 1. PLC type is always “PLC”
  //   if (newEntry.idType === "PLC") {
  //     setNewEntry((prev) => ({ ...prev, id: "PLC" }));
  //     return;
  //   }

  //   // 2. Persist whatever the user typed (KEY CHANGE: Use 'value', not 'trimmedValue')
  //   setNewEntry((prev) => ({ ...prev, id: value }));

  //   // 3. If the field is cleared (checking trimmed is fine here), reset most fields and exit
  //   if (!trimmedValue) {
  //     setNewEntry((prev) => ({
  //       ...prev,
  //       id: "", // Explicitly clear
  //       firstName: "",
  //       lastName: "",
  //       perHourRate: "",
  //       orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
  //       plcGlcCode: "",
  //       acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
  //     }));
  //     setPlcSearch("");
  //     setAutoPopulatedPLC(false);
  //     return;
  //   }

  //   // 5. “Other” type needs no further validation
  //   if (newEntry.idType === "Other") return;

  //   // 6. For Employee / Vendor types, try to auto-populate from suggestions
  //   if (
  //     (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
  //     employeeSuggestions.length > 0
  //   ) {
  //     // Use trimmedValue for the LOOKUP
  //     const selectedEmployee = employeeSuggestions.find(
  //       (emp) => emp.emplId === trimmedValue
  //     );

  //     if (selectedEmployee) {
  //       // Found a match – copy its details, *including PLC*
  //       setNewEntry((prev) => ({
  //         ...prev,
  //         // id: trimmedValue, // Optional: You can snap to trimmed here if you want, or keep 'value'
  //         firstName: selectedEmployee.firstName || "",
  //         lastName: selectedEmployee.lastName || "",
  //         perHourRate: selectedEmployee.perHourRate || "",
  //         orgId: selectedEmployee.orgId || prev.orgId,
  //         plcGlcCode: selectedEmployee.plc || "",
  //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
  //       }));
  //       setPlcSearch(selectedEmployee.plc || "");
  //       // setAutoPopulatedPLC(!!selectedEmployee.plc);
  //     } else {
  //       // No exact match – warn only if the entry is clearly invalid
  //       if (trimmedValue.length >= 3) {
  //         const partialMatch = employeeSuggestions.some((emp) =>
  //           emp.emplId.startsWith(trimmedValue)
  //         );
  //         if (!partialMatch) {
  //           toast.error("Invalid ID, please select a valid one!", {
  //             toastId: "invalid-id",
  //             autoClose: 3000,
  //           });
  //         }
  //       }

  //       // Leave any previously auto-populated PLC untouched;
  //       // only clear PLC when it wasn’t auto-filled.
  //       setNewEntry((prev) => ({
  //         ...prev,
  //         firstName: "",
  //         lastName: "",
  //         perHourRate: "",
  //         orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
  //         plcGlcCode:
  //           newEntry.idType === "Vendor" && autoPopulatedPLC
  //             ? prev.plcGlcCode
  //             : "",
  //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
  //       }));

  //       if (!(newEntry.idType === "Vendor" && autoPopulatedPLC)) {
  //         setPlcSearch("");
  //         setAutoPopulatedPLC(false);
  //       }
  //     }
  //   }
  // };
  
  const handleRowSelection = (rowIndex, isSelected) => {
    setSelectedRows((prev) => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(rowIndex);
      } else {
        newSelection.delete(rowIndex);
      }
      setShowCopyButton(newSelection.size > 0);
      return newSelection;
    });
  };

  // Function to select/deselect all rows
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allRowIndices = new Set();
      localEmployees.forEach((_, index) => {
        if (!hiddenRows[index]) {
          allRowIndices.add(index);
        }
      });
      if (showNewForm) {
        allRowIndices.add("new-entry");
      }
      setSelectedRows(allRowIndices);
      setShowCopyButton(true);
    } else {
      setSelectedRows(new Set());
      setShowCopyButton(false);
    }
  };

  const handleCopySelectedRows = () => {
    if (selectedRows.size === 0) {
      toast.info("No rows selected to copy.", { autoClose: 2000 });
      return;
    }

    // const sortedDurations = durations.sort((a, b) => {
    //   if (a.year !== b.year) return a.year - b.year;
    //   return a.monthNo - b.monthNo;
    // });

    const headers = [
      "ID Type",
      "ID",
      "Name",
      "Account",
      "Account Name",
      "Organization",
      "PLC",
      "Rev",
      "Brd",
      "Status",
      "Hour Rate",
      "Total", // ADD Total header
    ];

    // Store month metadata for matching during paste
    const monthMetadata = [];

    sortedDurations.forEach((duration) => {
      const monthName = new Date(
        duration.year,
        duration.monthNo - 1
      ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      headers.push(monthName);
      monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
    });

    const copyData = [headers];
    const structuredData = [];

    selectedRows.forEach((rowIndex) => {
      const emp = localEmployees[rowIndex];
      if (emp && emp.emple && !hiddenRows[rowIndex]) {
        const employeeRow = getEmployeeRow(emp, rowIndex);
        const rowData = [
          employeeRow.idType,
          employeeRow.emplId,
          employeeRow.name,
          employeeRow.acctId,
          employeeRow.acctName,
          employeeRow.orgId,
          employeeRow.glcPlc,
          typeof employeeRow.isRev === "object" ? "✓" : employeeRow.isRev,
          typeof employeeRow.isBrd === "object" ? "✓" : employeeRow.isBrd,
          employeeRow.status,
          employeeRow.perHourRate,
        ];

        // Calculate total hours
        let totalHours = 0;

        sortedDurations.forEach((duration) => {
          const uniqueKey = `${duration.monthNo}_${duration.year}`;
          const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
          const monthHours = getMonthHours(emp);
          const forecastValue = monthHours[uniqueKey]?.value;
          const value =
            inputValue !== undefined && inputValue !== ""
              ? inputValue
              : forecastValue || "0.00";

          totalHours += value && !isNaN(value) ? Number(value) : 0;
        });

        // ADD Total to rowData - CRITICAL for both Excel and structuredData
        rowData.push(totalHours.toFixed(2));

        // Now add month values
        sortedDurations.forEach((duration) => {
          const uniqueKey = `${duration.monthNo}_${duration.year}`;
          const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
          const monthHours = getMonthHours(emp);
          const forecastValue = monthHours[uniqueKey]?.value;
          const value =
            inputValue !== undefined && inputValue !== ""
              ? inputValue
              : forecastValue || "0.00";
          rowData.push(value);
        });

        copyData.push(rowData);
        structuredData.push(rowData); // Now includes Total at position 11
      }
    });

    const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

    navigator.clipboard
      .writeText(tsvContent)
      .then(() => {
        // CRITICAL: Store month metadata with copied data
        setCopiedRowsData(() => structuredData);
        setCopiedMonthMetadata(() => monthMetadata);
        setHasClipboardData(() => true);

        toast.success(`Copied ${structuredData.length} rows!`, {
          autoClose: 3000,
        });

        Promise.resolve().then(() => {
          setSelectedRows(new Set());
          setShowCopyButton(false);
        });
      })
      .catch((err) => {
        console.error("Copy failed:", err);
        toast.error("Failed to copy data.", { autoClose: 3000 });
      });
  };

  // const handlePasteMultipleRows = () => {
  //   if (copiedRowsData.length === 0) {
  //     toast.error("No copied data available to paste", { autoClose: 2000 });
  //     return;
  //   }

  //   // Close single new form if open
  //   if (showNewForm) {
  //     setShowNewForm(false);
  //   }

  //   // Filter durations by selected fiscal year
  //   const sortedDurations = [...durations]
  //     .filter((d) => {
  //       if (fiscalYear === "All") return true;
  //       return d.year === parseInt(fiscalYear);
  //     })
  //     .sort((a, b) => {
  //       if (a.year !== b.year) return a.year - b.year;
  //       return a.monthNo - b.monthNo;
  //     });

  //   const processedEntries = [];
  //   const processedHoursArray = [];

  //   copiedRowsData.forEach((rowData, rowIndex) => {
  //     // Extract employee data (first 11 columns + skip Total column at position 11)
  //     const [
  //       idTypeLabel,
  //       id,
  //       name,
  //       acctId,
  //       acctName,
  //       orgId,
  //       plcGlcCode,
  //       isRev,
  //       isBrd,
  //       status,
  //       perHourRate,
  //       total, // Position 11 - capture but don't use
  //       ...monthValues // Position 12+ - actual month values
  //     ] = rowData;

  //     // Map ID Type
  //     const idType =
  //       ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
  //       idTypeLabel;

  //     // Parse name based on ID type
  //     let firstName = "";
  //     let lastName = "";

  //     if (idType === "PLC") {
  //       firstName = name;
  //     } else if (idType === "Vendor") {
  //       if (name.includes(", ")) {
  //         const nameParts = name.split(", ");
  //         lastName = nameParts[0];
  //         firstName = nameParts[1];
  //       } else {
  //         lastName = name;
  //       }
  //     } else if (idType === "Employee") {
  //       const nameParts = name.split(" ");
  //       firstName = nameParts[0];
  //       lastName = nameParts.slice(1).join(" ");
  //     } else {
  //       firstName = name;
  //     }

  //     const entry = {
  //       id: id,
  //       firstName: firstName,
  //       lastName: lastName,
  //       idType: idType,
  //       acctId: acctId,
  //       orgId: orgId,
  //       plcGlcCode: plcGlcCode,
  //       perHourRate: perHourRate,
  //       status: status || "ACT",
  //       isRev: isRev === "✓",
  //       isBrd: isBrd === "✓",
  //     };

  //     // CRITICAL FIX: Match hours by month/year from copiedMonthMetadata
  //     const periodHours = {};

  //     // Build a lookup map from copiedMonthMetadata to monthValues
  //     const copiedHoursMap = {};
  //     copiedMonthMetadata.forEach((meta, index) => {
  //       const key = `${meta.monthNo}_${meta.year}`;
  //       copiedHoursMap[key] = monthValues[index];
  //     });

  //     // Now map to current fiscal year durations
  //     sortedDurations.forEach((duration) => {
  //       const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //       const value = copiedHoursMap[uniqueKey];

  //       // Only add non-zero values that exist in copied data
  //       if (value && value !== "0.00" && value !== "0" && value !== "") {
  //         periodHours[uniqueKey] = value;
  //       }
  //     });

  //     processedEntries.push(entry);
  //     processedHoursArray.push(periodHours);
  //   });

  //   // Set state with all processed data
  //   setNewEntries(processedEntries);
  //   setNewEntryPeriodHoursArray(processedHoursArray);

  //   // **ADD THIS** - Fetch suggestions for each pasted entry
  //   processedEntries.forEach((entry, index) => {
  //     fetchSuggestionsForPastedEntry(index, entry);
  //   });

  //   // Disable paste button
  //   setHasClipboardData(false);
  //   setCopiedRowsData([]);
  //   setCopiedMonthMetadata([]);

  //   toast.success(
  //     `Pasted ${processedEntries.length} entries for fiscal year ${fiscalYear}!`,
  //     { autoClose: 3000 }
  //   );
  // };

  // ADD this useEffect to clear cache when projectId or planType changes

  // **NEW OPTIMIZED FUNCTION** - Fetches all data with minimal API calls
  const fetchAllSuggestionsOptimized = async (processedEntries) => {
    // if (planType === "NBBUD" || processedEntries.length === 0) return;

    const encodedProjectId = encodeURIComponent(projectId);

    try {
      // **STEP 1: Fetch common project-level data ONCE**
      let projectData = cachedProjectData;
      let orgOptions = cachedOrgData;

      // Fetch project data if not cached
      if (!projectData) {
        const projectResponse = await axios.get(
          `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
        );
        projectData = Array.isArray(projectResponse.data)
          ? projectResponse.data[0]
          : projectResponse.data;
        setCachedProjectData(projectData);
      }

      // Fetch org data if not cached
      if (!orgOptions) {
        const orgResponse = await axios.get(
          `${backendUrl}/Orgnization/GetAllOrgs`
        );
        orgOptions = Array.isArray(orgResponse.data)
          ? orgResponse.data.map((org) => ({
              value: org.orgId,
              label: `${org.orgId}`,
            }))
          : [];
        setCachedOrgData(orgOptions);
      }

      // **STEP 2: Group entries by idType to minimize API calls**
      const employeeEntries = [];
      const vendorEntries = [];
      const otherEntries = [];

      processedEntries.forEach((entry, index) => {
        if (entry.idType === "Employee") {
          employeeEntries.push({ entry, index });
        } else if (entry.idType === "Vendor") {
          vendorEntries.push({ entry, index });
        } else if (entry.idType !== "PLC") {
          otherEntries.push({ entry, index });
        }
      });

      // **STEP 3: Fetch employee suggestions ONCE per type**
      let employeeSuggestions = [];
      let vendorSuggestions = [];

      // Fetch Employee suggestions only if there are Employee entries
      if (employeeEntries.length > 0) {
        try {
          const response = await axios.get(
            `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`
          );
          employeeSuggestions = Array.isArray(response.data)
            ? response.data.map((emp) => {
                const [lastName, firstName] = emp.employeeName
                  .split(",")
                  .map((str) => str.trim());
                return {
                  emplId: emp.empId,
                  firstName: firstName || "",
                  lastName: lastName || "",
                  perHourRate: emp.perHourRate || emp.hrRate || "",
                  plc: emp.plc || "",
                  orgId: emp.orgId || "",
                };
              })
            : [];
        } catch (err) {
          console.error("Failed to fetch employee suggestions:", err);
        }
      }

      // Fetch Vendor suggestions only if there are Vendor entries
      if (vendorEntries.length > 0) {
        try {
          const response = await axios.get(
            `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
          );
          vendorSuggestions = Array.isArray(response.data)
            ? response.data.map((emp) => ({
                emplId: emp.vendId,
                firstName: "",
                lastName: emp.employeeName,
                perHourRate: emp.perHourRate || emp.hrRate || "",
                plc: emp.plc || "",
                orgId: emp.orgId || "",
              }))
            : [];
        } catch (err) {
          console.error("Failed to fetch vendor suggestions:", err);
        }
      }

      setNewEntries((prevEntries) =>
        prevEntries.map((entry) => {
          // 1. Handle Employee Type
          if (entry.idType === "Employee") {
            const match = employeeSuggestions.find(
              (e) => e.emplId === entry.id
            );
            if (match) {
              return {
                ...entry,
                firstName: match.firstName || "",
                lastName: match.lastName || "",
                // Optional: Auto-fill other fields if they are empty in the pasted data
                perHourRate: entry.perHourRate || match.perHourRate || "",
                orgId: entry.orgId || match.orgId || "",
                plcGlcCode: entry.plcGlcCode || match.plc || "",
              };
            }
          }
          // 2. Handle Vendor Type
          else if (entry.idType === "Vendor") {
            const match = vendorSuggestions.find(
              (v) => v.emplId === entry.id
            );
            if (match) {
              return {
                ...entry,
                // Vendor names usually come as a single string in lastName or firstName based on your existing logic
                lastName: match.lastName || match.employeeName || "", 
                firstName: "", 
                perHourRate: entry.perHourRate || match.perHourRate || "",
                orgId: entry.orgId || match.orgId || "",
                plcGlcCode: entry.plcGlcCode || match.plc || "",
              };
            }
          }
          // Return original entry if no match found
          return entry;
        })
      );

      // **STEP 4: Apply cached data to all entries**
      processedEntries.forEach((entry, entryIndex) => {
        // Set employee/vendor suggestions based on type
        if (entry.idType === "Employee") {
          setPastedEntrySuggestions((prev) => ({
            ...prev,
            [entryIndex]: employeeSuggestions,
          }));
        } else if (entry.idType === "Vendor") {
          setPastedEntrySuggestions((prev) => ({
            ...prev,
            [entryIndex]: vendorSuggestions,
          }));
        }

        // Set account options based on idType
        let accountsWithNames = [];
        if (entry.idType === "PLC") {
          const employeeAccounts = Array.isArray(
            projectData.employeeLaborAccounts
          )
            ? projectData.employeeLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
          const vendorAccounts = Array.isArray(
            projectData.sunContractorLaborAccounts
          )
            ? projectData.sunContractorLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
          accountsWithNames = [...employeeAccounts, ...vendorAccounts];
        } else if (entry.idType === "Employee") {
          accountsWithNames = Array.isArray(projectData.employeeLaborAccounts)
            ? projectData.employeeLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
        } else if (entry.idType === "Vendor") {
          accountsWithNames = Array.isArray(
            projectData.sunContractorLaborAccounts
          )
            ? projectData.sunContractorLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
        } else if (entry.idType === "Other") {
          accountsWithNames = Array.isArray(
            projectData.otherDirectCostLaborAccounts
          )
            ? projectData.otherDirectCostLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
        }

        setPastedEntryAccounts((prev) => ({
          ...prev,
          [entryIndex]: accountsWithNames,
        }));

        // Set org options (same for all)
        setPastedEntryOrgs((prev) => ({
          ...prev,
          [entryIndex]: orgOptions,
        }));

        // Set PLC options (same for all)
        if (projectData.plc && Array.isArray(projectData.plc)) {
          const plcOptions = projectData.plc.map((plc) => ({
            value: plc.laborCategoryCode,
            label: `${plc.laborCategoryCode} - ${plc.description}`,
          }));

          setPastedEntryPlcs((prev) => ({
            ...prev,
            [entryIndex]: plcOptions,
          }));
        }
      });
    } catch (err) {
      console.error("Failed to fetch suggestions for pasted entries:", err);
    }
  };

  const handlePasteMultipleRows = async () => {
    if (copiedRowsData.length === 0) {
      toast.error("No copied data available to paste", { autoClose: 2000 });
      return;
    }

    // Close single new form if open
    if (showNewForm) {
      setShowNewForm(false);
    }

    // Filter durations by selected fiscal year
    // const sortedDurations = [...durations]
    //   .filter((d) => {
    //     if (fiscalYear === "All") return true;
    //     return d.year === parseInt(fiscalYear);
    //   })
    //   .sort((a, b) => {
    //     if (a.year !== b.year) return a.year - b.year;
    //     return a.monthNo - b.monthNo;
    //   });

    const processedEntries = [];
    const processedHoursArray = [];

    copiedRowsData.forEach((rowData, rowIndex) => {
      // Extract employee data (first 11 columns + skip Total column at position 11)
      const [
        idTypeLabel,
        id,
        name,
        acctId,
        acctName,
        orgId,
        plcGlcCode,
        isRev,
        isBrd,
        status,
        perHourRate,
        total, // Position 11 - capture but don't use
        ...monthValues // Position 12+ - actual month values
      ] = rowData;

      // Map ID Type
      const idType =
        ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
        idTypeLabel;

      // Parse name based on ID type
      let firstName = "";
      let lastName = "";

      if (idType === "PLC") {
        firstName = name;
      } else if (idType === "Vendor") {
        if (name.includes(", ")) {
          const nameParts = name.split(", ");
          lastName = nameParts[0];
          firstName = nameParts[1];
        } else {
          lastName = name;
        }
      } else if (idType === "Employee") {
        const nameParts = name.split(" ");
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      } else {
        firstName = name;
      }

      const entry = {
        id: id,
        firstName: firstName,
        lastName: lastName,
        idType: idType,
        acctId: acctId,
        orgId: orgId,
        plcGlcCode: plcGlcCode,
        perHourRate: perHourRate,
        status: status || "ACT",
        isRev: isRev === "✓",
        isBrd: isBrd === "✓",
      };

      // CRITICAL FIX: Match hours by month/year from copiedMonthMetadata
      const periodHours = {};

      // Build a lookup map from copiedMonthMetadata to monthValues
      const copiedHoursMap = {};
      copiedMonthMetadata.forEach((meta, index) => {
        const key = `${meta.monthNo}_${meta.year}`;
        copiedHoursMap[key] = monthValues[index];
      });

      // Now map to current fiscal year durations
      sortedDurations.forEach((duration) => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        const value = copiedHoursMap[uniqueKey];

        // Only add non-zero values that exist in copied data
        if (value && value !== "0.00" && value !== "0" && value !== "") {
          periodHours[uniqueKey] = value;
        }
      });

      processedEntries.push(entry);
      processedHoursArray.push(periodHours);
    });

    // Set state with all processed data
    setNewEntries(processedEntries);
    setNewEntryPeriodHoursArray(processedHoursArray);

    // **OPTIMIZED** - Fetch common data ONCE, then process all entries
    await fetchAllSuggestionsOptimized(processedEntries);

    // Disable paste button
    setHasClipboardData(false);
    setCopiedRowsData([]);
    setCopiedMonthMetadata([]);

    toast.success(
      `Pasted ${processedEntries.length} entries for fiscal year ${fiscalYear}!`,
      { autoClose: 3000 }
    );
  };

  useEffect(() => {
    // Clear cached data when project changes
    setCachedProjectData(null);
    setCachedOrgData(null);
  }, [projectId, planType]);

  // const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
  //   // if (planType === "NBBUD") return;

  //   // CRITICAL FIX: URL encode project ID
  //   const encodedProjectId = encodeURIComponent(projectId);
  //   const apiPlanType = planType === "NBBUD" ? "BUD" : planType;

  //   // Fetch employee suggestions based on ID type
  //   if (entry.idType && entry.idType !== "") {
  //     try {
  //       const endpoint =
  //         entry.idType === "Vendor"
  //           ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
  //           : `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`;

  //       const response = await axios.get(endpoint);
  //       const suggestions = Array.isArray(response.data)
  //         ? response.data.map((emp) => {
  //             if (entry.idType === "Vendor") {
  //               return {
  //                 emplId: emp.vendId,
  //                 firstName: "",
  //                 lastName: emp.employeeName,
  //                 perHourRate: emp.perHourRate || emp.hrRate || "",
  //                 plc: emp.plc || "",
  //                 orgId: emp.orgId || "",
  //               };
  //             } else {
  //               const [lastName, firstName] = (emp.employeeName || "")
  //                 .split(", ")
  //                 .map((str) => str.trim());
  //               return {
  //                 emplId: emp.empId,
  //                 firstName: firstName || "",
  //                 lastName: lastName || "",
  //                 perHourRate: emp.perHourRate || emp.hrRate || "",
  //                 plc: emp.plc || "",
  //                 orgId: emp.orgId || "",
  //               };
  //             }
  //           })
  //         : [];

  //       setPastedEntrySuggestions((prev) => ({
  //         ...prev,
  //         [entryIndex]: suggestions,
  //       }));
  //     } catch (err) {
  //       console.error(
  //         `Failed to fetch pasted entry suggestions for index ${entryIndex}:`,
  //         err
  //       );
  //     }
  //   }

  //   // Fetch account, org, and PLC options
  //   try {
  //     const response = await axios.get(
  //       `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${apiPlanType}`
  //     );
  //     const data = Array.isArray(response.data)
  //       ? response.data[0]
  //       : response.data;

  //     // Fetch accounts
  //     let accountsWithNames = [];

  //     if (entry.idType === "PLC") {
  //       const employeeAccounts = Array.isArray(data.employeeLaborAccounts)
  //         ? data.employeeLaborAccounts.map((account) => ({
  //             id: account.accountId,
  //             name: account.acctName,
  //           }))
  //         : [];
  //       const vendorAccounts = Array.isArray(data.sunContractorLaborAccounts)
  //         ? data.sunContractorLaborAccounts.map((account) => ({
  //             id: account.accountId,
  //             name: account.acctName,
  //           }))
  //         : [];
  //       accountsWithNames = [...employeeAccounts, ...vendorAccounts];
  //     } else if (entry.idType === "Employee") {
  //       accountsWithNames = Array.isArray(data.employeeLaborAccounts)
  //         ? data.employeeLaborAccounts.map((account) => ({
  //             id: account.accountId,
  //             name: account.acctName,
  //           }))
  //         : [];
  //     } else if (entry.idType === "Vendor") {
  //       accountsWithNames = Array.isArray(data.sunContractorLaborAccounts)
  //         ? data.sunContractorLaborAccounts.map((account) => ({
  //             id: account.accountId,
  //             name: account.acctName,
  //           }))
  //         : [];
  //     } else if (entry.idType === "Other") {
  //       accountsWithNames = Array.isArray(data.otherDirectCostLaborAccounts)
  //         ? data.otherDirectCostLaborAccounts.map((account) => ({
  //             id: account.accountId,
  //             name: account.acctName,
  //           }))
  //         : [];
  //     }

  //     setPastedEntryAccounts((prev) => ({
  //       ...prev,
  //       [entryIndex]: accountsWithNames,
  //     }));

  //     // Fetch organizations
  //     const orgResponse = await axios.get(
  //       `${backendUrl}/Orgnization/GetAllOrgs`
  //     );
  //     const orgOptions = Array.isArray(orgResponse.data)
  //       ? orgResponse.data.map((org) => ({
  //           value: org.orgId,
  //           label: org.orgId,
  //         }))
  //       : [];

  //     setPastedEntryOrgs((prev) => ({
  //       ...prev,
  //       [entryIndex]: orgOptions,
  //     }));

  //     // Fetch PLC options
  //     if (data.plc && Array.isArray(data.plc)) {
  //       const plcOptions = data.plc.map((plc) => ({
  //         value: plc.laborCategoryCode,
  //         label: `${plc.laborCategoryCode} - ${plc.description}`,
  //       }));

  //       setPastedEntryPlcs((prev) => ({
  //         ...prev,
  //         [entryIndex]: plcOptions,
  //       }));
  //     }
  //   } catch (err) {
  //     console.error(
  //       `Failed to fetch pasted entry options for index ${entryIndex}:`,
  //       err
  //     );
  //   }
  // };

  // const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
  //   // CRITICAL FIX: URL encode project ID
  //   const encodedProjectId = encodeURIComponent(projectId);
  //   // REMOVE THIS LINE: const apiPlanType = planType === "NBBUD" ? "BUD" : planType;

  //   // Fetch employee suggestions based on ID type
  //   if (entry.idType && entry.idType !== "") {
  //     try {
  //       const endpoint =
  //         entry.idType === "Vendor"
  //           ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
  //           : `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`;

  //       const response = await axios.get(endpoint);
  //       const suggestions = Array.isArray(response.data)
  //         ? response.data.map((emp) => {
  //             if (entry.idType === "Vendor") {
  //               return {
  //                 emplId: emp.vendId,
  //                 firstName: "",
  //                 lastName: emp.employeeName,
  //                 perHourRate: emp.perHourRate || emp.hrRate || "",
  //                 plc: emp.plc || "",
  //                 orgId: emp.orgId || "",
  //               };
  //             } else {
  //               const [lastName, firstName] = (emp.employeeName || "")
  //                 .split(", ")
  //                 .map((str) => str.trim());
  //               return {
  //                 emplId: emp.empId,
  //                 firstName: firstName || "",
  //                 lastName: lastName || "",
  //                 perHourRate: emp.perHourRate || emp.hrRate || "",
  //                 plc: emp.plc || "",
  //                 orgId: emp.orgId || "",
  //               };
  //             }
  //           })
  //         : [];

  //       setPastedEntrySuggestions((prev) => ({
  //         ...prev,
  //         [entryIndex]: suggestions,
  //       }));
  //     } catch (err) {
  //       console.error(
  //         `Failed to fetch pasted entry suggestions for index ${entryIndex}:`,
  //         err
  //       );
  //     }
  //   }

  //   // Fetch account, org, and PLC options
  //   try {
  //     // USE planType DIRECTLY instead of apiPlanType
  //     const response = await axios.get(
  //       `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
  //     );
  //     const data = Array.isArray(response.data)
  //       ? response.data[0]
  //       : response.data;

  //     // Fetch accounts
  //     let accountsWithNames = [];

  //     if (entry.idType === "PLC") {
  //       const employeeAccounts = Array.isArray(data.employeeLaborAccounts)
  //         ? data.employeeLaborAccounts.map((account) => ({
  //             id: account.accountId,
  //             name: account.acctName,
  //           }))
  //         : [];
  //       const vendorAccounts = Array.isArray(data.sunContractorLaborAccounts)
  //         ? data.sunContractorLaborAccounts.map((account) => ({
  //             id: account.accountId,
  //             name: account.acctName,
  //           }))
  //         : [];
  //       accountsWithNames = [...employeeAccounts, ...vendorAccounts];
  //     } else if (entry.idType === "Employee") {
  //       accountsWithNames = Array.isArray(data.employeeLaborAccounts)
  //         ? data.employeeLaborAccounts.map((account) => ({
  //             id: account.accountId,
  //             name: account.acctName,
  //           }))
  //         : [];
  //     } else if (entry.idType === "Vendor") {
  //       accountsWithNames = Array.isArray(data.sunContractorLaborAccounts)
  //         ? data.sunContractorLaborAccounts.map((account) => ({
  //             id: account.accountId,
  //             name: account.acctName,
  //           }))
  //         : [];
  //     } else if (entry.idType === "Other") {
  //       accountsWithNames = Array.isArray(data.otherDirectCostLaborAccounts)
  //         ? data.otherDirectCostLaborAccounts.map((account) => ({
  //             id: account.accountId,
  //             name: account.acctName,
  //           }))
  //         : [];
  //     }

  //     setPastedEntryAccounts((prev) => ({
  //       ...prev,
  //       [entryIndex]: accountsWithNames,
  //     }));

  //     // Fetch organizations
  //     const orgResponse = await axios.get(
  //       `${backendUrl}/Orgnization/GetAllOrgs`
  //     );
  //     const orgOptions = Array.isArray(orgResponse.data)
  //       ? orgResponse.data.map((org) => ({
  //           value: org.orgId,
  //           label: org.orgId,
  //         }))
  //       : [];

  //     setPastedEntryOrgs((prev) => ({
  //       ...prev,
  //       [entryIndex]: orgOptions,
  //     }));

  //     // Fetch PLC options
  //     if (data.plc && Array.isArray(data.plc)) {
  //       const plcOptions = data.plc.map((plc) => ({
  //         value: plc.laborCategoryCode,
  //         label: `${plc.laborCategoryCode} - ${plc.description}`,
  //       }));

  //       setPastedEntryPlcs((prev) => ({
  //         ...prev,
  //         [entryIndex]: plcOptions,
  //       }));
  //     }
  //   } catch (err) {
  //     console.error(
  //       `Failed to fetch pasted entry options for index ${entryIndex}:`,
  //       err
  //     );
  //   }
  // };

  // REPLACE the entire fetchSuggestionsForPastedEntry function with this optimized version
  const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
    // if (planType === "NBBUD") return;

    // CRITICAL FIX: URL encode project ID
    const encodedProjectId = encodeURIComponent(projectId);

    // Fetch employee suggestions based on ID type (this is entry-specific, must be called per entry)
    if (entry.idType && entry.idType !== "") {
      try {
        const endpoint =
          entry.idType === "Vendor"
            ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
            : `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`;

        const response = await axios.get(endpoint);
        const suggestions = Array.isArray(response.data)
          ? response.data.map((emp) => {
              if (entry.idType === "Vendor") {
                return {
                  emplId: emp.vendId,
                  firstName: "",
                  lastName: emp.employeeName,
                  perHourRate: emp.perHourRate || emp.hrRate || "",
                  plc: emp.plc || "",
                  orgId: emp.orgId || "",
                };
              } else {
                const [lastName, firstName] = emp.employeeName
                  .split(",")
                  .map((str) => str.trim());
                return {
                  emplId: emp.empId,
                  firstName: firstName || "",
                  lastName: lastName || "",
                  perHourRate: emp.perHourRate || emp.hrRate || "",
                  plc: emp.plc || "",
                  orgId: emp.orgId || "",
                };
              }
            })
          : [];

        setPastedEntrySuggestions((prev) => ({
          ...prev,
          [entryIndex]: suggestions,
        }));
      } catch (err) {
        console.error(
          `Failed to fetch pasted entry suggestions for index ${entryIndex}:`,
          err
        );
      }
    }

    // OPTIMIZATION: Fetch project and org data only once, then cache it
    try {
      let projectData = cachedProjectData;
      let orgOptions = cachedOrgData;

      // Only fetch project data if not already cached
      if (!projectData) {
        const response = await axios.get(
          `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
        );
        projectData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        setCachedProjectData(projectData);
      }

      // Only fetch org data if not already cached
      if (!orgOptions) {
        const orgResponse = await axios.get(
          `${backendUrl}/Orgnization/GetAllOrgs`
        );
        orgOptions = Array.isArray(orgResponse.data)
          ? orgResponse.data.map((org) => ({
              value: org.orgId,
              label: `${org.orgId}`,
            }))
          : [];
        setCachedOrgData(orgOptions);
      }

      // Now use the cached data to populate entry-specific options
      // Fetch accounts
      let accountsWithNames = [];
      if (entry.idType === "PLC") {
        const employeeAccounts = Array.isArray(
          projectData.employeeLaborAccounts
        )
          ? projectData.employeeLaborAccounts.map((account) => ({
              id: account.accountId,
              name: account.acctName,
            }))
          : [];
        const vendorAccounts = Array.isArray(
          projectData.sunContractorLaborAccounts
        )
          ? projectData.sunContractorLaborAccounts.map((account) => ({
              id: account.accountId,
              name: account.acctName,
            }))
          : [];
        accountsWithNames = [...employeeAccounts, ...vendorAccounts];
      } else if (entry.idType === "Employee") {
        accountsWithNames = Array.isArray(projectData.employeeLaborAccounts)
          ? projectData.employeeLaborAccounts.map((account) => ({
              id: account.accountId,
              name: account.acctName,
            }))
          : [];
      } else if (entry.idType === "Vendor") {
        accountsWithNames = Array.isArray(
          projectData.sunContractorLaborAccounts
        )
          ? projectData.sunContractorLaborAccounts.map((account) => ({
              id: account.accountId,
              name: account.acctName,
            }))
          : [];
      } else if (entry.idType === "Other") {
        accountsWithNames = Array.isArray(
          projectData.otherDirectCostLaborAccounts
        )
          ? projectData.otherDirectCostLaborAccounts.map((account) => ({
              id: account.accountId,
              name: account.acctName,
            }))
          : [];
      }

      setPastedEntryAccounts((prev) => ({
        ...prev,
        [entryIndex]: accountsWithNames,
      }));

      // Use cached organizations
      setPastedEntryOrgs((prev) => ({
        ...prev,
        [entryIndex]: orgOptions,
      }));

      // Fetch PLC options
      if (projectData.plc && Array.isArray(projectData.plc)) {
        const plcOptions = projectData.plc.map((plc) => ({
          value: plc.laborCategoryCode,
          label: `${plc.laborCategoryCode} - ${plc.description}`,
        }));

        setPastedEntryPlcs((prev) => ({
          ...prev,
          [entryIndex]: plcOptions,
        }));
      }
    } catch (err) {
      console.error(
        `Failed to fetch pasted entry options for index ${entryIndex}:`,
        err
      );
    }
  };

  const handlePasteToNewEntry = async () => {
    try {
      isPastingRef.current = true;

      // Check if there's an unsaved entry
      if (showNewForm && newEntry.id) {
        toast.warning("Please save the current entry before pasting again.", {
          autoClose: 3000,
        });
        isPastingRef.current = false;
        return;
      }

      const text = await navigator.clipboard.readText();

      if (!text || text.trim() === "") {
        toast.error("No data found in clipboard. Please copy data first.", {
          autoClose: 3000,
        });
        isPastingRef.current = false;
        return;
      }

      // Process the paste
      processPastedText(text);

      setTimeout(() => {
        isPastingRef.current = false;
      }, 300);
    } catch (err) {
      isPastingRef.current = false;
      toast.error(
        "Please use Ctrl+V to paste or grant clipboard permissions.",
        {
          autoClose: 3000,
        }
      );
    }
  };

  const processPastedText = (text) => {
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    if (lines.length === 0) {
      toast.error("No valid data found in clipboard.", { autoClose: 3000 });
      return;
    }

    const isFirstLineHeaders =
      lines[0].toLowerCase().includes("id type") ||
      lines[0].toLowerCase().includes("account");

    const dataLines = isFirstLineHeaders ? lines.slice(1) : lines;

    if (dataLines.length === 0) {
      toast.error("No data rows found in clipboard.", { autoClose: 3000 });
      return;
    }

    // Process first row
    const firstRow = dataLines[0].split("\t");
    pasteRowData(firstRow);

    // Handle remaining rows
    if (dataLines.length > 1) {
      // If there are more rows, save current form and show next paste option
      toast.info(
        `Pasted 1 of ${dataLines.length} rows. Save this entry, then click Paste again for next row.`,
        { autoClose: 4000 }
      );

      // Update clipboard with remaining rows
      const remainingLines = [lines[0], ...dataLines.slice(1)];
      const remainingText = remainingLines.join("\n");

      navigator.clipboard
        .writeText(remainingText)
        .then(() => {
          // Keep hasClipboardData true for next paste
          setHasClipboardData(true);
          // Update copiedRowsData to remove first row
          setCopiedRowsData((prev) => prev.slice(1));
        })
        .catch((err) => {
          console.error("Failed to update clipboard:", err);
          // Even if clipboard update fails, keep states
          setHasClipboardData(true);
          setCopiedRowsData((prev) => prev.slice(1));
        });
    } else {
      // Last row - clear everything
      setHasClipboardData(false);
      setCopiedRowsData([]);
      toast.success("Data pasted successfully!", { autoClose: 2000 });
    }
  };

  // const pasteRowData = (row) => {
  //   if (row.length < 11) {
  //     toast.error("Invalid data format. Please copy complete row data.", {
  //       autoClose: 3000,
  //     });
  //     return;
  //   }

  //   const [
  //     idTypeLabel,
  //     id,
  //     name,
  //     acctId,
  //     acctName,
  //     orgId,
  //     plc,
  //     rev,
  //     brd,
  //     status,
  //     hourRate,
  //     ...monthValues
  //   ] = row;

  //   // const idType =
  //   //   ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value || "Employee";

  //   const idType =
  //     ID_TYPE_OPTIONS.find(
  //       (opt) => opt.label.toLowerCase() === idTypeLabel.toLowerCase()
  //     )?.value || "Employee";

  //   let firstName = "";
  //   let lastName = "";

  //   if (idType === "PLC") {
  //     firstName = name || "";
  //   } else if (idType === "Vendor") {
  //     lastName = name || "";
  //   } else {
  //     const nameParts = (name || "").split(" ");
  //     firstName = nameParts[0] || "";
  //     lastName = nameParts.slice(1).join(" ") || "";
  //   }

  //   const completeNewEntryData = {
  //     id: id || "",
  //     firstName,
  //     lastName,
  //     isRev: rev === "✓",
  //     isBrd: brd === "✓",
  //     idType,
  //     acctId: acctId || "",
  //     orgId: orgId || "",
  //     plcGlcCode: plc || "",
  //     perHourRate: hourRate || "",
  //     status: status || "ACT",
  //   };

  //   setNewEntry(completeNewEntryData);
  //   setPlcSearch(plc || "");
  //   setOrgSearch(orgId || "");

  //   if (monthValues.length > 0 && durations.length > 0) {
  //     const newPeriodHours = {};
  //     const sortedDurations = [...durations].sort((a, b) => {
  //       if (a.year !== b.year) return a.year - b.year;
  //       return a.monthNo - b.monthNo;
  //     });

  //     monthValues.forEach((value, index) => {
  //       if (
  //         index < sortedDurations.length &&
  //         value &&
  //         value !== "0.00" &&
  //         value !== "0"
  //       ) {
  //         const duration = sortedDurations[index];
  //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //         newPeriodHours[uniqueKey] = value;
  //       }
  //     });

  //     setNewEntryPeriodHours(newPeriodHours);
  //   }
  // };
  // Update this function to handle the Total column correctly
  const pasteRowData = (row) => {
    if (row.length < 11) {
      toast.error("Invalid data format. Please copy complete row data.", {
        autoClose: 3000,
      });
      return;
    }

    const [
      idTypeLabel,
      id,
      name,
      acctId,
      acctName,
      orgId,
      plc,
      rev,
      brd,
      status,
      hourRate,
      total, // <--- ADD THIS: Capture 'Total' so it is excluded from ...monthValues
      ...monthValues
    ] = row;

    const idType =
      ID_TYPE_OPTIONS.find(
        (opt) => opt.label.toLowerCase() === idTypeLabel.toLowerCase()
      )?.value || "Employee";

    let firstName = "";
    let lastName = "";

    if (idType === "PLC") {
      firstName = name || "";
    } else if (idType === "Vendor") {
      lastName = name || "";
    } else {
      const nameParts = (name || "").split(" ");
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
    }

    const completeNewEntryData = {
      id: id || "",
      firstName,
      lastName,
      isRev: rev === "✓",
      isBrd: brd === "✓",
      idType,
      acctId: acctId || "",
      orgId: orgId || "",
      plcGlcCode: plc || "",
      perHourRate: hourRate || "",
      status: status || "ACT",
    };

    setNewEntry(completeNewEntryData);
    setPlcSearch(plc || "");
    setOrgSearch(orgId || "");

    if (monthValues.length > 0 && durations.length > 0) {
      const newPeriodHours = {};
      const sortedDurations = [...durations].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNo - b.monthNo;
      });

      monthValues.forEach((value, index) => {
        if (
          index < sortedDurations.length &&
          value &&
          value !== "0.00" &&
          value !== "0"
        ) {
          const duration = sortedDurations[index];
          const uniqueKey = `${duration.monthNo}_${duration.year}`;
          newPeriodHours[uniqueKey] = value;
        }
      });

      setNewEntryPeriodHours(newPeriodHours);
    }
  };


  useEffect(() => {
    const handleKeyDown = async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        e.stopPropagation();

        if (hasClipboardData && copiedRowsData.length > 0) {
          handlePasteMultipleRows();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasClipboardData, copiedRowsData]);

  const resetNewEntryForm = () => {
    setNewEntry({
      id: "",
      firstName: "",
      lastName: "",
      isRev: false,
      isBrd: false,
      idType: "",
      acctId: "",
      orgId: "",
      plcGlcCode: "",
      perHourRate: "",
      status: "Act",
    });
    setNewEntryPeriodHours({});
    setPlcSearch("");
    setOrgSearch("");
    setAutoPopulatedPLC(false);
  };

  const getEmployeeRow = (emp, idx) => {
    if (!emp || !emp.emple) {
      return {
        idType: "-",
        emplId: "-",
        warning: false,
        name: "-",
        acctId: "-",
        acctName: "-", // ADD THIS LINE
        orgId: "-",
        glcPlc: "-",
        isRev: "-",
        isBrd: "-",
        status: "-",
        perHourRate: "0",
        total: "0",
      };
    }

    const monthHours = getMonthHours(emp);
    const totalHours = sortedDurations.reduce((sum, duration) => {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;
      const inputValue = inputValues[`${idx}_${uniqueKey}`];
      const forecastValue = monthHours[uniqueKey]?.value;
      const value =
        inputValue !== undefined && inputValue !== ""
          ? inputValue
          : forecastValue;
      return sum + (value && !isNaN(value) ? Number(value) : 0);
    }, 0);

    // CHECK FOR ANY LOCAL WARNINGS FOR THIS SPECIFIC EMPLOYEE
    const emplId = emp.emple.emplId;
    const plcCode = emp.emple.plcGlcCode || "";

    // Check hours warnings (existing logic)
    const hasHoursWarning = sortedDurations.some((duration) => {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;
      const warningKey = generateWarningKey(emplId, plcCode, uniqueKey);
      return localWarnings[warningKey];
    });

    // CHECK FOR ACCOUNT/ORG FIELD WARNINGS
    const accountWarningKey = generateFieldWarningKey(
      emplId,
      "account",
      emp.emple.accId
    );
    const orgWarningKey = generateFieldWarningKey(
      emplId,
      "organization",
      emp.emple.orgId
    );
    const hasAccountWarning = localWarnings[accountWarningKey];
    const hasOrgWarning = localWarnings[orgWarningKey];

    // Combine all warning types
    const warningValue =
      emp.isWarning ||
      emp.emple?.isWarning ||
      hasHoursWarning ||
      hasAccountWarning ||
      hasOrgWarning ||
      false;

    return {
      idType:
        ID_TYPE_OPTIONS.find(
          (opt) => opt.value === (emp.emple.type || "-")
        )?.label ||
        emp.emple.type ||
        "-",
      emplId: emp.emple.emplId,
      warning: Boolean(warningValue),
      name:
        emp.emple.idType === "Vendor"
          ? emp.emple.lastName || emp.emple.firstName || "-"
          : `${emp.emple.firstName || ""} ${emp.emple.lastName || ""}`.trim() ||
            "-",
      acctId:
        emp.emple.accId ||
        (laborAccounts.length > 0 ? laborAccounts[0].id : "-"),
      acctName: (() => {
        const accountId =
          emp.emple.accId ||
          (laborAccounts.length > 0 ? laborAccounts[0].id : "-");
        const accountWithName = accountOptionsWithNames.find(
          (acc) => acc.id === accountId
        );
        return accountWithName ? accountWithName.name : "-";
      })(),
      orgId: emp.emple.orgId || "-",
      glcPlc: (() => {
        const plcCode = emp.emple.plcGlcCode || "";
        if (!plcCode) return "-";

        const plcOption =
          plcOptions.find((option) => option.value === plcCode) ||
          updatePlcOptions.find((option) => option.value === plcCode);

        return plcOption ? plcOption.label : plcCode;
      })(),
      isRev: emp.emple.isRev ? (
        <span className="text-green-600 font-sm text-lg">✓</span>
      ) : (
        "-"
      ),
      isBrd: emp.emple.isBrd ? (
        <span className="text-green-600 font-sm text-lg">✓</span>
      ) : (
        "-"
      ),
      status: emp.emple.status || "Act",
      perHourRate:
        emp.emple.perHourRate !== undefined && emp.emple.perHourRate !== null
          ? Number(emp.emple.perHourRate).toFixed(2)
          : "0",
      total: totalHours.toFixed(2) || "-",
    };
  };

  const getMonthHours = (emp) => {
    const monthHours = {};
    if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
      emp.emple.plForecasts.forEach((forecast) => {
        const uniqueKey = `${forecast.month}_${forecast.year}`;
        const value =
          planType === "EAC" && forecast.actualhours !== undefined
            ? forecast.actualhours
            : forecast.forecastedhours ?? 0;
        monthHours[uniqueKey] = { value, ...forecast };
      });
    }
    return monthHours;
  };

  // Calculate column totals for each month
  // const calculateColumnTotals = () => {
  //   const columnTotals = {};

  //   sortedDurations.forEach((duration) => {
  //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //     let total = 0;

  //     // Sum hours from existing employees
  //     localEmployees.forEach((emp, idx) => {
  //       if (hiddenRows[idx]) return; // Skip hidden rows

  //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
  //       const monthHours = getMonthHours(emp);
  //       const forecastValue = monthHours[uniqueKey]?.value;
  //       const value =
  //         inputValue !== undefined && inputValue !== ""
  //           ? inputValue
  //           : forecastValue;

  //       total += value && !isNaN(value) ? Number(value) : 0;
  //     });

  //     // Add hours from new entry form if visible
  //     if (showNewForm) {
  //       const newEntryValue = newEntryPeriodHours[uniqueKey];
  //       total +=
  //         newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //     }

  //     columnTotals[uniqueKey] = total;
  //   });

  //   return columnTotals;
  // };

  // Calculate column totals for each month
  // const calculateColumnTotals = () => {
  //   const columnTotals = {};

  //   // Initialize CTD and Prior Year totals
  //   let ctdTotal = 0;
  //   let priorYearTotal = 0;

  //   const currentFiscalYear = fiscalYear !== "All" ? parseInt(fiscalYear) : null;

  //   sortedDurations.forEach((duration) => {
  //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //     let total = 0;

  //     // Sum hours from existing employees
  //     localEmployees.forEach((emp, idx) => {
  //       if (hiddenRows[idx]) return; // Skip hidden rows
  //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
  //       const monthHours = getMonthHours(emp);
  //       const forecastValue = monthHours[uniqueKey]?.value;
  //       const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
  //       total += value && !isNaN(value) ? Number(value) : 0;
  //     });

  //     // Add hours from new entry form if visible
  //     if (showNewForm) {
  //       const newEntryValue = newEntryPeriodHours[uniqueKey];
  //       total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //     }

  //     columnTotals[uniqueKey] = total;

  //     // Calculate CTD and Prior Year based on fiscal year selection
  //     if (currentFiscalYear) {
  //       const startYear = parseInt(startDate.split('-')[0]); // Extract start year from startDate

  //       // Prior Year: sum of (selected fiscal year - 1)
  //       if (duration.year === currentFiscalYear - 1) {
  //         priorYearTotal += total;
  //       }

  //       // CTD: sum from start year to (selected fiscal year - 2)
  //       if (duration.year >= startYear && duration.year <= currentFiscalYear - 2) {
  //         ctdTotal += total;
  //       }
  //     }
  //   });

  //   // Add CTD and Prior Year to columnTotals
  //   columnTotals['ctd'] = ctdTotal;
  //   columnTotals['priorYear'] = priorYearTotal;

  //   return columnTotals;
  // };

  // const calculateColumnTotals = () => {
  //   const columnTotals = {};

  //   let ctdTotal = 0;
  //   let priorYearTotal = 0;

  //   // const currentFiscalYear = normalizedFiscalYear !== "All"  ? parseInt(fiscalYear) : null;
  //    const currentFiscalYear = normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;
  //   const startYear = parseInt(startDate.split('-')[0]);

  //   // ✅ First, calculate CTD and Prior Year from ALL durations
  //   if (currentFiscalYear) {
  //     durations.forEach((duration) => {
  //       let total = 0;
  //       const uniqueKey = `${duration.monthNo}_${duration.year}`;

  //       // Sum hours from existing employees
  //       localEmployees.forEach((emp, idx) => {
  //         if (hiddenRows[idx]) return;
  //         const inputValue = inputValues[`${idx}_${uniqueKey}`];
  //         const monthHours = getMonthHours(emp);
  //         const forecastValue = monthHours[uniqueKey]?.value;
  //         const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
  //         total += value && !isNaN(value) ? Number(value) : 0;
  //       });

  //       // Add hours from new entry form if visible
  //       if (showNewForm) {
  //         const newEntryValue = newEntryPeriodHours[uniqueKey];
  //         total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //       }

  //       // Prior Year: sum of (selected fiscal year - 1)
  //       if (duration.year === currentFiscalYear - 1) {
  //         priorYearTotal += total;
  //       }

  //       // CTD: sum from start year to (selected fiscal year - 2)
  //       if (duration.year >= startYear && duration.year <= currentFiscalYear - 2) {
  //         ctdTotal += total;
  //       }
  //     });
  //   }

  //   // Now calculate monthly totals for visible columns (filtered by fiscal year)
  //   sortedDurations.forEach((duration) => {
  //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //     let total = 0;

  //     // Sum hours from existing employees
  //     localEmployees.forEach((emp, idx) => {
  //       if (hiddenRows[idx]) return;
  //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
  //       const monthHours = getMonthHours(emp);
  //       const forecastValue = monthHours[uniqueKey]?.value;
  //       const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
  //       total += value && !isNaN(value) ? Number(value) : 0;
  //     });

  //     // Add hours from new entry form if visible
  //     if (showNewForm) {
  //       const newEntryValue = newEntryPeriodHours[uniqueKey];
  //       total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //     }

  //     columnTotals[uniqueKey] = total;
  //   });

  //   // Add CTD and Prior Year to columnTotals
  //   // columnTotals['ctd'] = ctdTotal;
  //   // columnTotals['priorYear'] = priorYearTotal;
  //   if (currentFiscalYear) {
  //   columnTotals['ctd'] = ctdTotal;
  //   columnTotals['priorYear'] = priorYearTotal;
  // }

  //   return columnTotals;
  // };

  // const calculateColumnTotals = () => {
  //   const columnTotals = {};

  //   let ctdTotal = 0;
  //   let priorYearTotal = 0;

  //   const currentFiscalYear = normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;

  //   // ✅ Only calculate CTD and Prior Year when a specific fiscal year is selected
  //   if (currentFiscalYear !== null) {
  //     const startYear = parseInt(startDate.split('-')[0]);

  //     // Calculate CTD and Prior Year from ALL durations
  //     durations.forEach((duration) => {
  //       let total = 0;
  //       const uniqueKey = `${duration.monthNo}_${duration.year}`;

  //       // Sum hours from existing employees
  //       localEmployees.forEach((emp, idx) => {
  //         if (hiddenRows[idx]) return;
  //         const inputValue = inputValues[`${idx}_${uniqueKey}`];
  //         const monthHours = getMonthHours(emp);
  //         const forecastValue = monthHours[uniqueKey]?.value;
  //         const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
  //         total += value && !isNaN(value) ? Number(value) : 0;
  //       });

  //       // Add hours from new entry form if visible
  //       if (showNewForm) {
  //         const newEntryValue = newEntryPeriodHours[uniqueKey];
  //         total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //       }

  //       // Prior Year: sum of (selected fiscal year - 1)
  //       if (duration.year === currentFiscalYear - 1) {
  //         priorYearTotal += total;
  //       }

  //       // CTD: sum from start year to (selected fiscal year - 2)
  //       if (duration.year >= startYear && duration.year <= currentFiscalYear - 2) {
  //         ctdTotal += total;
  //       }
  //     });

  //     // Add CTD and Prior Year to columnTotals only when fiscal year is selected
  //     columnTotals['ctd'] = ctdTotal;
  //     columnTotals['priorYear'] = priorYearTotal;
  //   }

  //   // Now calculate monthly totals for visible columns (filtered by fiscal year)
  //   sortedDurations.forEach((duration) => {
  //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //     let total = 0;

  //     // Sum hours from existing employees
  //     localEmployees.forEach((emp, idx) => {
  //       if (hiddenRows[idx]) return;
  //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
  //       const monthHours = getMonthHours(emp);
  //       const forecastValue = monthHours[uniqueKey]?.value;
  //       const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
  //       total += value && !isNaN(value) ? Number(value) : 0;
  //     });

  //     // Add hours from new entry form if visible
  //     if (showNewForm) {
  //       const newEntryValue = newEntryPeriodHours[uniqueKey];
  //       total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //     }

  //     columnTotals[uniqueKey] = total;
  //   });

  //   return columnTotals;
  // };

  // REPLACE THE ENTIRE FUNCTION WITH THIS:
  const columnTotals = useMemo(() => {
    const totals = {};
    const currentFiscalYear =
      normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;

    if (currentFiscalYear === null) {
      // Only calculate monthly totals
      sortedDurations.forEach((duration) => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        let total = 0;

        localEmployees.forEach((emp, idx) => {
          if (hiddenRows[idx]) return;
          const monthHours = getMonthHours(emp);
          const inputValue = inputValues[`${idx}_${uniqueKey}`];
          const forecastValue = monthHours[uniqueKey]?.value;
          const value =
            inputValue !== undefined && inputValue !== ""
              ? inputValue
              : forecastValue;
          total += value && !isNaN(value) ? Number(value) : 0;
        });

        totals[uniqueKey] = total;
      });
      return totals;
    }

    // Calculate CTD, Prior Year, and Monthly totals
    let ctdTotal = 0;
    let priorYearTotal = 0;
    const startYear = parseInt(startDate.split("-")[0]);

    durations.forEach((duration) => {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;
      let monthlyTotal = 0;

      localEmployees.forEach((emp, idx) => {
        if (hiddenRows[idx]) return;
        const monthHours = getMonthHours(emp);
        const inputValue = inputValues[`${idx}_${uniqueKey}`];
        const forecastValue = monthHours[uniqueKey]?.value;
        const value =
          inputValue !== undefined && inputValue !== ""
            ? inputValue
            : forecastValue;
        const numValue = value && !isNaN(value) ? Number(value) : 0;
        monthlyTotal += numValue;
      });

      // Only add CTD if it's a display column
      if (sortedDurations.some((d) => `${d.monthNo}_${d.year}` === uniqueKey)) {
        totals[uniqueKey] = monthlyTotal;
      }

      // Calculate CTD and Prior Year
      if (duration.year === currentFiscalYear - 1) {
        priorYearTotal += monthlyTotal;
      }

      if (
        duration.year >= startYear &&
        duration.year <= currentFiscalYear - 2
      ) {
        ctdTotal += monthlyTotal;
      }
    });

    totals["ctd"] = ctdTotal;
    totals["priorYear"] = priorYearTotal;

    return totals;
  }, [
    durations,
    localEmployees,
    hiddenRows,
    inputValues,
    sortedDurations,
    normalizedFiscalYear,
    startDate,
  ]);

  // ADD THIS NEW MEMOIZED VALUE:
  const employeeYearTotals = useMemo(() => {
    const totals = {};
    const currentFiscalYear =
      normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;

    if (currentFiscalYear === null) return totals;

    const startYear = parseInt(startDate.split("-")[0]);

    localEmployees.forEach((emp, idx) => {
      if (hiddenRows[idx]) return;

      const monthHours = getMonthHours(emp);
      let empCtd = 0;
      let empPriorYear = 0;

      durations.forEach((duration) => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        const inputValue = inputValues[`${idx}_${uniqueKey}`];
        const forecastValue = monthHours[uniqueKey]?.value;
        const value =
          inputValue !== undefined && inputValue !== ""
            ? inputValue
            : forecastValue;
        const numValue = value && !isNaN(value) ? Number(value) : 0;

        if (duration.year === currentFiscalYear - 1) {
          empPriorYear += numValue;
        }

        if (
          duration.year >= startYear &&
          duration.year <= currentFiscalYear - 2
        ) {
          empCtd += numValue;
        }
      });

      totals[idx] = { ctd: empCtd, priorYear: empPriorYear };
    });

    return totals;
  }, [
    localEmployees,
    hiddenRows,
    inputValues,
    durations,
    normalizedFiscalYear,
    startDate,
  ]);

  const handleInputChange = (empIdx, uniqueKey, newValue) => {
    if (!isEditable) return;

    // Allow only numbers and dots
    if (!/^[0-9.]*$/.test(newValue)) return;

    // Get available hours for validation
    const duration = sortedDurations.find(
      (d) => `${d.monthNo}_${d.year}` === uniqueKey
    );
    if (duration && duration.workingHours) {
      const maxAllowedHours = duration.workingHours * 2;
      const numericValue = parseFloat(newValue) || 0;

      // Prevent input if exceeds limit
      if (numericValue > maxAllowedHours) {
        toast.error(`Hours cannot exceed more than available hours * 2 `, {
          autoClose: 3000,
        });
        return; // Don't update the state
      }
    }

    setInputValues((prev) => ({
      ...prev,
      [`${empIdx}_${uniqueKey}`]: newValue,
    }));

    // Track modified hours for save functionality
    setModifiedHours((prev) => ({
      ...prev,
      [`${empIdx}_${uniqueKey}`]: {
        empIdx,
        uniqueKey,
        newValue,
        employee: localEmployees[empIdx],
      },
    }));
    setHasUnsavedHoursChanges(true);

    // Keep the warning logic
    const emp = localEmployees[empIdx];
    if (emp?.emple) {
      const plcCode = emp.emple.plcGlcCode;
      const warningKey = generateWarningKey(
        emp.emple.emplId,
        plcCode,
        uniqueKey
      );
      const hasWarning = checkHoursExceedLimit(empIdx, uniqueKey, newValue);
      setLocalWarnings((prev) => {
        const updated = { ...prev };
        if (hasWarning) {
          updated[warningKey] = true;
        } else {
          delete updated[warningKey];
        }
        return updated;
      });
    }
  };

  const handleEmployeeDataBlur = async (empIdx, emp) => {
    if (!isEditable || !isBudPlan) return;
    const editedData = editedEmployeeData[empIdx] || {};
    const originalData = getEmployeeRow(emp, empIdx);
    if (
      !editedData ||
      ((editedData.acctId === undefined ||
        editedData.acctId === originalData.acctId) &&
        (editedData.orgId === undefined ||
          editedData.orgId === originalData.orgId) &&
        (editedData.glcPlc === undefined ||
          editedData.glcPlc === originalData.glcPlc) &&
        (editedData.perHourRate === undefined ||
          editedData.perHourRate === originalData.perHourRate) &&
        (editedData.isRev === undefined ||
          editedData.isRev === emp.emple.isRev) &&
        (editedData.isBrd === undefined ||
          editedData.isBrd === emp.emple.isBrd))
    ) {
      return;
    }
    const payload = {
      id: emp.emple.id || 0,
      emplId: emp.emple.emplId,
      // firstName: emp.emple.firstName || "",
      firstName: editedData.firstName !== undefined ? editedData.firstName : (emp.emple.firstName || ""),
      lastName: emp.emple.lastName || "",
      type: emp.emple.type || " ",
      isRev:
        editedData.isRev !== undefined ? editedData.isRev : emp.emple.isRev,
      isBrd:
        editedData.isBrd !== undefined ? editedData.isBrd : emp.emple.isBrd,
      plcGlcCode: (editedData.glcPlc || emp.emple.plcGlcCode || "")
        .split("-")[0]
        .substring(0, 20),
      perHourRate: Number(editedData.perHourRate || emp.emple.perHourRate || 0),
      status: emp.emple.status || "Act",
      accId:
        editedData.acctId ||
        emp.emple.accId ||
        (laborAccounts.length > 0 ? laborAccounts[0].id : ""),
      orgId: editedData.orgId || emp.emple.orgId || "",
      plId: planId,
      plForecasts: emp.emple.plForecasts || [],
    };

    try {
      await axios.put(`${backendUrl}/Employee/UpdateEmployee`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      setEditedEmployeeData((prev) => {
        const newData = { ...prev };
        delete newData[empIdx];
        return newData;
      });
      setLocalEmployees((prev) => {
        const updated = [...prev];
        updated[empIdx] = {
          ...updated[empIdx],
          emple: {
            ...updated[empIdx].emple,
            ...payload,
          },
        };
        return updated;
      });

      toast.success("Employee updated successfully!", {
        toastId: `employee-update-${empIdx}`,
        autoClose: 2000,
      });
    } catch (err) {
      // console.error("Failed to update employee:", err);
    }
  };

  const handleSaveAll = async () => {
    const hasHoursChanges = Object.keys(modifiedHours).length > 0;
    const hasEmployeeChanges = Object.keys(editedEmployeeData).length > 0;

    if (!hasHoursChanges && !hasEmployeeChanges) {
      toast.info("No changes to save.", { autoClose: 2000 });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Save employee data changes first
      if (hasEmployeeChanges) {
        for (const empIdx in editedEmployeeData) {
          const emp = localEmployees[empIdx];
          const editedData = editedEmployeeData[empIdx];

          if (!emp || !emp.emple) {
            errorCount++;
            continue;
          }

          const payload = {
            id: emp.emple.id || 0,
            emplId: emp.emple.emplId,
            // firstName: emp.emple.firstName || "",
            firstName: editedData.firstName !== undefined ? editedData.firstName : (emp.emple.firstName || ""),
            lastName: emp.emple.lastName || "",
            type: emp.emple.type || " ",
            isRev:
              editedData.isRev !== undefined
                ? editedData.isRev
                : emp.emple.isRev,
            isBrd:
              editedData.isBrd !== undefined
                ? editedData.isBrd
                : emp.emple.isBrd,
            plcGlcCode: (editedData.glcPlc || emp.emple.plcGlcCode || "")
              .split("-")[0]
              .substring(0, 20),
            perHourRate: Number(
              editedData.perHourRate || emp.emple.perHourRate || 0
            ),
            status: emp.emple.status || "Act",
            accId: editedData.acctId || emp.emple.accId || "",
            orgId: editedData.orgId || emp.emple.orgId || "",
            plId: planId,
            plForecasts: emp.emple.plForecasts || [],
          };

          try {
            await axios.put(`${backendUrl}/Employee/UpdateEmployee`, payload, {
              headers: { "Content-Type": "application/json" },
            });

            // Update local state
            setLocalEmployees((prev) => {
              const updated = [...prev];
              updated[empIdx] = {
                ...updated[empIdx],
                emple: {
                  ...updated[empIdx].emple,
                  ...payload,
                },
              };
              return updated;
            });

            successCount++;
          } catch (err) {
            errorCount++;
          }
        }
      }

      // Save hours changes
      if (hasHoursChanges) {
        const bulkPayload = [];

        for (const key in modifiedHours) {
          const { empIdx, uniqueKey, newValue, employee } = modifiedHours[key];

          const newNumericValue = newValue === "" ? 0 : Number(newValue);
          const emp = employee;
          const monthHours = getMonthHours(emp);
          const forecast = monthHours[uniqueKey];

          if (!forecast || !forecast.forecastid) {
            errorCount++;
            continue;
          }

          const currentDuration = sortedDurations.find(
            (d) => `${d.monthNo}_${d.year}` === uniqueKey
          );

          if (!isMonthEditable(currentDuration, closedPeriod, planType)) {
            errorCount++;
            continue;
          }

          const payload = {
            forecastedamt: forecast?.forecastedamt ?? 0,
            actualamt: forecast?.actualamt ?? 0,
            forecastid: Number(forecast?.forecastid ?? 0),
            projId: forecast?.projId ?? projectId ?? "",
            plId: forecast?.plId ?? planId ?? 0,
            emplId: forecast?.emplId ?? emp?.emple?.emplId ?? "",
            dctId: forecast?.dctId ?? 0,
            month: forecast?.month ?? currentDuration?.monthNo ?? 0,
            year: forecast?.year ?? currentDuration?.year ?? 0,
            totalBurdenCost: forecast?.totalBurdenCost ?? 0,
            fees: forecast?.fees ?? 0,
            burden: forecast?.burden ?? 0,
            ccffRevenue: forecast?.ccffRevenue ?? 0,
            tnmRevenue: forecast?.tnmRevenue ?? 0,
            revenue: forecast?.revenue ?? 0,
            cost: forecast?.cost ?? 0,
            forecastedCost: forecast?.forecastedCost ?? 0,
            fringe: forecast?.fringe ?? 0,
            overhead: forecast?.overhead ?? 0,
            gna: forecast?.gna ?? 0,
            materials: forecast?.materials ?? 0,
            ...(planType === "EAC"
              ? {
                  actualhours: Number(newNumericValue) || 0,
                  forecastedhours: forecast?.forecastedhours ?? 0,
                }
              : {
                  forecastedhours: Number(newNumericValue) || 0,
                  actualhours: forecast?.actualhours ?? 0,
                }),
            createdat: forecast?.createdat ?? new Date().toISOString(),
            updatedat: new Date().toISOString(),
            displayText: forecast?.displayText ?? "",
            acctId: emp?.emple?.accId ?? "",
            orgId: emp?.emple?.orgId ?? "",
            plc: emp?.emple?.plcGlcCode ?? "",
            empleId: emp?.emple?.id ?? 0,
            hrlyRate: emp?.emple?.perHourRate ?? 0,
            effectDt: new Date().toISOString().split("T")[0],
            emple: emp?.emple
              ? {
                  id: emp.emple.id ?? 0,
                  emplId: emp.emple.emplId ?? "",
                  orgId: emp.emple.orgId ?? "",
                  firstName: emp.emple.firstName ?? "",
                  lastName: emp.emple.lastName ?? "",
                  plcGlcCode: emp.emple.plcGlcCode ?? "",
                  perHourRate: emp.emple.perHourRate ?? 0,
                  salary: emp.emple.salary ?? 0,
                  accId: emp.emple.accId ?? "",
                  hireDate:
                    emp.emple.hireDate ??
                    new Date().toISOString().split("T")[0],
                  isRev: emp.emple.isRev ?? false,
                  isBrd: emp.emple.isBrd ?? false,
                  createdAt: emp.emple.createdAt ?? new Date().toISOString(),
                  type: emp.emple.type ?? "",
                  status: emp.emple.status ?? "",
                  plId: planId ?? 0,
                  isWarning: emp.emple.isWarning ?? false,
                  plForecasts: [],
                  organization: emp.emple.organization ?? null,
                  plProjectPlan: emp.emple.plProjectPlan ?? null,
                }
              : null,
          };

          bulkPayload.push(payload);
        }

        if (bulkPayload.length > 0) {
          const apiPlanType = planType === "NBBUD" ? "BUD" : planType;

          await axios.put(
            `${backendUrl}/Forecast/BulkUpdateForecastHours/${apiPlanType}`,
            bulkPayload,
            { headers: { "Content-Type": "application/json" } }
          );

          // Update local state for hours
          setLocalEmployees((prev) => {
            const updated = [...prev];
            for (const key in modifiedHours) {
              const { empIdx, uniqueKey, newValue } = modifiedHours[key];
              const newNumericValue = newValue === "" ? 0 : Number(newValue);

              if (
                updated[empIdx] &&
                updated[empIdx].emple &&
                updated[empIdx].emple.plForecasts
              ) {
                const currentDuration = sortedDurations.find(
                  (d) => `${d.monthNo}_${d.year}` === uniqueKey
                );
                const forecastIndex = updated[
                  empIdx
                ].emple.plForecasts.findIndex(
                  (f) =>
                    f.month === currentDuration?.monthNo &&
                    f.year === currentDuration?.year
                );
                if (forecastIndex !== -1) {
                  if (planType === "EAC") {
                    updated[empIdx].emple.plForecasts[
                      forecastIndex
                    ].actualhours = newNumericValue;
                  } else {
                    updated[empIdx].emple.plForecasts[
                      forecastIndex
                    ].forecastedhours = newNumericValue;
                  }
                }
              }
            }
            return updated;
          });

          successCount += bulkPayload.length;
        }
      }

      try {
        await axios.post(
          `https://test-api-3tmq.onrender.com/Forecast/ValidateForecast?planid=${planId}`
        );
        // console.log("Forecast validation completed successfully");
      } catch (validationErr) {
        console.error("Forecast validation failed:", validationErr);
        toast.warning("Hours saved but validation encountered an issue.", {
          autoClose: 4000,
        });
      }

      // Clear all modified data and reset flags
      setModifiedHours({});
      setHasUnsavedHoursChanges(false);
      setEditedEmployeeData({});
      setHasUnsavedEmployeeChanges(false);

      if (successCount > 0) {
        const message =
          hasHoursChanges && hasEmployeeChanges
            ? `Successfully saved ${successCount} entries and employee updates!`
            : hasHoursChanges
            ? `Successfully saved hour entries!`
            : `Successfully updated employees!`;

        toast.success(message, { autoClose: 3000 });
      }

      if (errorCount > 0) {
        toast.warning(`${errorCount} entries could not be saved.`, {
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.error(
        "Failed to save changes: " +
          (err.response?.data?.message || err.message),
        {
          toastId: "save-all-error",
          autoClose: 3000,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountInputChangeForUpdate = (value, actualEmpIdx) => {
    handleEmployeeDataChange(actualEmpIdx, "acctId", value);

    // Filter accounts based on input - ensure we're using all available accounts
    if (value.length >= 1) {
      const baseAccounts =
        updateAccountOptions.length > 0 ? updateAccountOptions : laborAccounts;
      const filtered = baseAccounts.filter((acc) =>
        acc.id.toLowerCase().includes(value.toLowerCase())
      );
      // Don't update the state here, just use the filtered results for display
      // The datalist will automatically show filtered options
    } else {
      // When input is empty, ensure all accounts are available
      if (updateAccountOptions.length === 0 && laborAccounts.length > 0) {
        setUpdateAccountOptions(laborAccounts);
      }
    }
  };

  const handleFillValues = async () => {
    if (!showNewForm || !isEditable) return;

    if (new Date(fillEndDate) < new Date(fillStartDate)) {
      toast.error("End Period cannot be before Start Period.");
      return;
    }

    const startDateObj = new Date(fillStartDate);
    const endDateObj = new Date(fillEndDate);

    const newHours = {};

    const isDurationInRange = (duration) => {
      const durationValue = duration.year * 100 + duration.monthNo;
      const startYear = startDateObj.getFullYear();
      const startMonth = startDateObj.getMonth() + 1;
      const startValue = startYear * 100 + startMonth;
      const endYear = endDateObj.getFullYear();
      const endMonth = endDateObj.getMonth() + 1;
      const endValue = endYear * 100 + endMonth;
      return durationValue >= startValue && durationValue <= endValue;
    };

    if (fillMethod === "Copy From Source Record" && sourceRowIndex !== null) {
      const sourceEmp = localEmployees[sourceRowIndex];
      const sourceMonthHours = getMonthHours(sourceEmp);
      sortedDurations.forEach((duration) => {
        if (!isDurationInRange(duration)) return;
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        if (
          planType === "EAC" &&
          !isMonthEditable(duration, closedPeriod, planType)
        ) {
          newHours[uniqueKey] = newEntryPeriodHours[uniqueKey] || "0";
        } else {
          newHours[uniqueKey] = sourceMonthHours[uniqueKey]?.value || "0";
        }
      });
    } else if (fillMethod === "Specify Hours") {
      sortedDurations.forEach((duration) => {
        if (!isDurationInRange(duration)) return;
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        if (
          planType === "EAC" &&
          !isMonthEditable(duration, closedPeriod, planType)
        ) {
          newHours[uniqueKey] = newEntryPeriodHours[uniqueKey] || "0";
        } else if (isMonthEditable(duration, closedPeriod, planType)) {
          newHours[uniqueKey] = fillHours.toString();
        }
      });
    } else if (fillMethod === "Use Available Hours") {
      try {
        const response = await axios.get(
          `${backendUrl}/Orgnization/GetWorkingDaysForDuration/${startDate}/${endDate}`
        );
        const availableHours = response.data.reduce((acc, d) => {
          const uniqueKey = `${d.monthNo}_${d.year}`;
          acc[uniqueKey] = d.workingHours || 0;
          return acc;
        }, {});
        sortedDurations.forEach((duration) => {
          if (!isDurationInRange(duration)) return;
          const uniqueKey = `${duration.monthNo}_${duration.year}`;
          if (
            planType === "EAC" &&
            !isMonthEditable(duration, closedPeriod, planType)
          ) {
            newHours[uniqueKey] = newEntryPeriodHours[uniqueKey] || "0";
          } else if (isMonthEditable(duration, closedPeriod, planType)) {
            newHours[uniqueKey] = availableHours[uniqueKey] || "0";
          }
        });
      } catch (err) {
        toast.error("Failed to fetch available hours.", {
          toastId: "available-hours-error",
          autoClose: 3000,
        });
        return;
      }
    } else if (
      fillMethod === "Use Start Period Hours" &&
      sortedDurations.length > 0
    ) {
      const firstDuration = sortedDurations[0];
      if (!isDurationInRange(firstDuration)) {
        toast.error(
          "Start Period hours are outside the selected duration range."
        );
        return;
      }
      const firstUniqueKey = `${firstDuration.monthNo}_${firstDuration.year}`;
      const firstValue = newEntryPeriodHours[firstUniqueKey] || "0";
      sortedDurations.forEach((duration) => {
        if (!isDurationInRange(duration)) return;
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        if (
          planType === "EAC" &&
          !isMonthEditable(duration, closedPeriod, planType)
        ) {
          newHours[uniqueKey] = newEntryPeriodHours[uniqueKey] || "0";
        } else if (isMonthEditable(duration, closedPeriod, planType)) {
          newHours[uniqueKey] = firstValue;
        }
      });
    }

    setNewEntryPeriodHours((prev) => ({ ...prev, ...newHours }));
    setShowFillValues(false);
    setFillMethod("None");
    setFillHours(0.0);
    setSourceRowIndex(null);
  };

  const handleSaveNewEntry = async () => {
    if (!planId) {
      toast.error("Plan ID is required to save a new entry.", {
        autoClose: 3000,
      });
      return;
    }

    // Skip all validations if planType is NBBUD
    if (planType !== "NBBUD") {
      // Check for duplicate employee ID before validating anything else
      const isDuplicate = localEmployees.some((emp) => {
        if (!emp.emple) return false;

        // For "Other" type, only check emplId (like KBD001)
        if (newEntry.idType === "Other") {
          return emp.emple.emplId === newEntry.id.trim();
        }

        // For other types, check both emplId and plcGlcCode
        return (
          emp.emple.emplId === newEntry.id.trim() &&
          emp.emple.plcGlcCode === newEntry.plcGlcCode.trim()
        );
      });

      if (isDuplicate) {
        toast.error(
          "Can't save entry with existing ID and PLC combination. Please use a different ID or PLC.",
          {
            toastId: "duplicate-save-error",
            autoClose: 3000,
          }
        );
        return;
      }

      // UPDATED VALIDATION LOGIC - Apply to ALL ID types except "Other"
      if (newEntry.idType === "PLC") {
        if (!newEntry.id || newEntry.id !== "PLC") {
          toast.error("ID must be automatically set to 'PLC' for PLC type.", {
            autoClose: 3000,
          });
          return;
        }
      } else if (newEntry.idType === "Other") {
        // For Other type, just check that it's not empty (no further validation)
        if (!newEntry.id.trim()) {
          toast.error("ID is required.", { autoClose: 3000 });
          return;
        }
      } else {
        // For ALL other ID types (Employee, Vendor), validate against suggestions
        if (!newEntry.id.trim()) {
          toast.error("ID is required.", { autoClose: 3000 });
          return;
        }

        // MANDATORY validation against suggestions for Employee and Vendor types
        if (employeeSuggestions.length > 0) {
          const validEmployee = employeeSuggestions.find(
            (emp) => emp.emplId === newEntry.id.trim()
          );
          if (!validEmployee) {
            toast.error("Please enter a valid ID from the available list.", {
              autoClose: 3000,
            });
            return;
          }
        } else {
          // If no suggestions are loaded, don't allow saving for Employee/Vendor
          toast.error("Employee suggestions not loaded. Please try again.", {
            autoClose: 3000,
          });
          return;
        }
      }

      if (!isValidAccount(newEntry.acctId)) {
        toast.error("Please enter a valid Account from the available list.", {
          autoClose: 3000,
        });
        return;
      }
      if (!isValidOrg(newEntry.orgId)) {
        toast.error("Organization is required.", { autoClose: 3000 });
        return;
      }

      if (!newEntry.plcGlcCode || !newEntry.plcGlcCode.trim()) {
        toast.error("PLC is required and cannot be empty.", {
          autoClose: 3000,
        });
        return;
      }
      // Enhanced PLC validation - must match exactly from suggestions
      if (newEntry.plcGlcCode && newEntry.plcGlcCode.trim() !== "") {
        const exactPlcMatch = plcOptions.find(
          (option) =>
            option.value.toLowerCase() ===
            newEntry.plcGlcCode.toLowerCase().trim()
        );

        if (!exactPlcMatch) {
          toast.error(
            "PLC must be selected from the available suggestions. Custom values are not allowed.",
            {
              autoClose: 4000,
            }
          );
          return;
        }
      }
    }

    setIsDurationLoading(true);
    const payloadForecasts = durations.map((duration) => ({
      ...(planType === "EAC"
        ? {
            actualhours:
              Number(
                newEntryPeriodHours[`${duration.monthNo}_${duration.year}`]
              ) || 0,
          }
        : {
            forecastedhours:
              Number(
                newEntryPeriodHours[`${duration.monthNo}_${duration.year}`]
              ) || 0,
          }),
      projId: projectId,
      plId: planId,
      emplId: newEntry.id,
      month: duration.monthNo,
      year: duration.year,
      acctId: newEntry.acctId,
      orgId: newEntry.orgId,
      plc: newEntry.plcGlcCode || "",
      hrlyRate: Number(newEntry.perHourRate) || 0,
      effectDt: null,
      plEmployee: null,
    }));

    const payload = {
      id: 0,
      emplId: newEntry.id,
      firstName: newEntry.firstName,
      lastName: newEntry.lastName,
      type: newEntry.idType,
      isRev: newEntry.isRev,
      isBrd: newEntry.isBrd,
      plcGlcCode: (newEntry.plcGlcCode || "").substring(0, 20),
      perHourRate: Number(newEntry.perHourRate) || 0,
      status: newEntry.status || "-",
      accId: newEntry.acctId,
      orgId: newEntry.orgId || "",
      plId: planId,
      plForecasts: payloadForecasts,
    };

    try {
      await axios.post(`${backendUrl}/Employee/AddNewEmployee`, payload);
      setSuccessMessageText("Entry saved successfully!");
      setShowSuccessMessage(true);
      setShowNewForm(false);
      setNewEntry({
        id: "",
        firstName: "",
        lastName: "",
        isRev: false,
        isBrd: false,
        idType: "",
        acctId: "",
        orgId: "",
        plcGlcCode: "",
        perHourRate: "",
        status: "Act",
      });
      setNewEntryPeriodHours({});
      setEmployeeSuggestions([]);
      setLaborAccounts([]);
      setPlcOptions([]);
      setPlcSearch("");
      setAutoPopulatedPLC(false);
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      fetchEmployees();
    } catch (err) {
      setSuccessMessageText("Failed to save entry.");
      setShowSuccessMessage(true);

      // Enhanced error message extraction
      let detailedErrorMessage = "Failed to save new entry. ";

      if (err?.response?.data) {
        const errorData = err.response.data;

        // Handle validation errors specifically
        if (errorData.errors) {
          const fieldErrors = [];
          Object.keys(errorData.errors).forEach((field) => {
            const errors = errorData.errors[field];
            if (Array.isArray(errors) && errors.length > 0) {
              fieldErrors.push(`${field}: ${errors[0]}`);
            }
          });
          if (fieldErrors.length > 0) {
            detailedErrorMessage += `Validation errors - ${fieldErrors.join(
              ", "
            )}`;
          }
        } else if (errorData.error) {
          detailedErrorMessage += `Reason: ${errorData.error}`;
        } else if (errorData.message) {
          detailedErrorMessage += `Reason: ${errorData.message}`;
        } else if (typeof errorData === "string") {
          detailedErrorMessage += `Reason: ${errorData}`;
        } else {
          // Check for specific field validation messages
          const errorMessages = [];
          if (errorData.ID) errorMessages.push(`ID: ${errorData.ID}`);
          if (errorData.Account)
            errorMessages.push(`Account: ${errorData.Account}`);
          if (errorData.Organization)
            errorMessages.push(`Organization: ${errorData.Organization}`);
          if (errorData.PLC) errorMessages.push(`PLC: ${errorData.PLC}`);

          if (errorMessages.length > 0) {
            detailedErrorMessage += `Please check - ${errorMessages.join(
              ", "
            )}`;
          } else {
            detailedErrorMessage += `Server response: ${JSON.stringify(
              errorData
            )}`;
          }
        }
      } else if (err?.message) {
        detailedErrorMessage += `Reason: ${err.message}`;
      } else {
        detailedErrorMessage +=
          "Unknown error occurred. Please check your input and try again.";
      }

      // Show detailed error in toast
      toast.error(detailedErrorMessage, {
        toastId: "save-entry-error",
        autoClose: 7000, // Longer time for detailed messages
      });

      // Log for debugging
      console.error("Save new entry error:", {
        error: err,
        response: err?.response?.data,
        status: err?.response?.status,
      });
    } finally {
      setIsDurationLoading(false);
      setTimeout(() => setShowSuccessMessage(false), 2000);
    }
  };

  const handleSaveMultipleEntry = async () => {
    if (newEntries.length === 0) {
      toast.info("No entries to save.", { autoClose: 2000 });
      return;
    }

    setIsDurationLoading(true);
    let successCount = 0;
    let failCount = 0;
    const failedIndices = [];

    try {
      for (let i = 0; i < newEntries.length; i++) {
        const entry = newEntries[i];
        const periodHours = newEntryPeriodHoursArray[i];

        // Skip all validations if planType is NBBUD
        if (planType !== "NBBUD") {
          // Check for duplicate employee ID before validating anything else
          const isDuplicate = localEmployees.some((emp) => {
            if (!emp.emple) return false;

            // For "Other" type, only check emplId
            if (entry.idType === "Other") {
              return emp.emple.emplId === entry.id.trim();
            }

            // For other types, check both emplId and plcGlcCode
            return (
              emp.emple.emplId === entry.id.trim() &&
              emp.emple.plcGlcCode === entry.plcGlcCode.trim()
            );
          });

          if (isDuplicate) {
            toast.error(
              "Can't save entry with existing ID and PLC combination. Please use a different ID or PLC.",
              {
                toastId: "duplicate-save-error",
                autoClose: 3000,
              }
            );
            failCount++;
            failedIndices.push(i);
            continue;
          }

          // UPDATED VALIDATION LOGIC - Apply to ALL ID types except "Other"
          if (entry.idType === "PLC") {
            if (!entry.id || entry.id !== "PLC") {
              toast.error(
                "ID must be automatically set to 'PLC' for PLC type.",
                {
                  autoClose: 3000,
                }
              );
              failCount++;
              failedIndices.push(i);
              continue;
            }
          } else if (entry.idType === "Other") {
            // For Other type, just check that it's not empty (no further validation)
            if (!entry.id.trim()) {
              toast.error("ID is required.", { autoClose: 3000 });
              failCount++;
              failedIndices.push(i);
              continue;
            }
          } else {
            // For ALL other ID types (Employee, Vendor), validate against suggestions
            if (!entry.id.trim()) {
              toast.error("ID is required.", { autoClose: 3000 });
              failCount++;
              failedIndices.push(i);
              continue;
            }

            // MANDATORY validation against suggestions for Employee and Vendor types
            const suggestions = pastedEntrySuggestions[i] || [];
            if (suggestions.length > 0) {
              const validEmployee = suggestions.find(
                (emp) => emp.emplId === entry.id.trim()
              );
              if (!validEmployee) {
                toast.error(
                  "Please enter a valid ID from the available list.",
                  {
                    autoClose: 3000,
                  }
                );
                failCount++;
                failedIndices.push(i);
                continue;
              }
            } else {
              // If no suggestions are loaded, don't allow saving for Employee/Vendor
              toast.error(
                "Employee suggestions not loaded. Please try again.",
                {
                  autoClose: 3000,
                }
              );
              failCount++;
              failedIndices.push(i);
              continue;
            }
          }

          // Validate Account against pastedEntryAccounts
          const entryAccounts = pastedEntryAccounts[i] || [];
          const isValidAcc = entryAccounts.some(
            (acc) => acc.id === entry.acctId
          );
          if (!isValidAcc) {
            toast.error(
              "Please enter a valid Account from the available list.",
              {
                autoClose: 3000,
              }
            );
            failCount++;
            failedIndices.push(i);
            continue;
          }

          // Validate Organization against pastedEntryOrgs
          const entryOrgs = pastedEntryOrgs[i] || [];

          const hasOrgValue = entry.orgId && entry.orgId.toString().trim() !== "";
          
          const isValidOrganization = entryOrgs.length > 0 
            ? entryOrgs.some((org) => org.value.toString() === entry.orgId.toString())
            : hasOrgValue;


          // const isValidOrganization = entryOrgs.some(
          //   (org) => org.value.toString() === entry.orgId.toString()
          // );
          if (!isValidOrganization) {
            toast.error("Organization is required.", { autoClose: 3000 });
            failCount++;
            failedIndices.push(i);
            continue;
          }

          // Validate PLC is not empty
          if (!entry.plcGlcCode || !entry.plcGlcCode.trim()) {
            toast.error("PLC is required and cannot be empty.", {
              autoClose: 3000,
            });
            failCount++;
            failedIndices.push(i);
            continue;
          }

          // Enhanced PLC validation - must match exactly from suggestions
          const entryPlcs = pastedEntryPlcs[i] || [];
          if (entry.plcGlcCode && entry.plcGlcCode.trim() !== "") {
            const exactPlcMatch = entryPlcs.find(
              (option) =>
                option.value.toLowerCase() ===
                entry.plcGlcCode.toLowerCase().trim()
            );

            if (!exactPlcMatch) {
              toast.error(
                "PLC must be selected from the available suggestions. Custom values are not allowed.",
                {
                  autoClose: 4000,
                }
              );
              failCount++;
              failedIndices.push(i);
              continue;
            }
          }
        }

        // Build payload forecasts
        const payloadForecasts = durations.map((duration) => {
          const uniqueKey = `${duration.monthNo}_${duration.year}`;
          return {
            ...(planType === "EAC"
              ? { actualhours: Number(periodHours[uniqueKey] || 0) }
              : { forecastedhours: Number(periodHours[uniqueKey] || 0) }),
            projId: projectId,
            plId: planId,
            emplId: entry.id,
            month: duration.monthNo,
            year: duration.year,
            acctId: entry.acctId,
            orgId: entry.orgId,
            plc: entry.plcGlcCode || "",
            hrlyRate: Number(entry.perHourRate || 0),
            effectDt: null,
            plEmployee: null,
          };
        });

        const payload = {
          id: 0,
          emplId: entry.id,
          firstName: entry.firstName,
          lastName: entry.lastName,
          type: entry.idType,
          isRev: entry.isRev,
          isBrd: entry.isBrd,
          plcGlcCode: (entry.plcGlcCode || "").substring(0, 20),
          perHourRate: Number(entry.perHourRate || 0),
          status: entry.status || "ACT",
          accId: entry.acctId,
          orgId: entry.orgId || "",
          plId: planId,
          plForecasts: payloadForecasts,
        };

        try {
          await axios.post(`${backendUrl}/Employee/AddNewEmployee`, payload);
          successCount++;
        } catch (err) {
          failCount++;
          failedIndices.push(i);

          // Enhanced error message extraction (same as handleSaveNewEntry)
          let detailedErrorMessage = "Failed to save entry. ";

          if (err?.response?.data) {
            const errorData = err.response.data;

            if (errorData.errors) {
              const fieldErrors = [];
              Object.keys(errorData.errors).forEach((field) => {
                const errors = errorData.errors[field];
                if (Array.isArray(errors) && errors.length > 0) {
                  fieldErrors.push(`${field}: ${errors[0]}`);
                }
              });
              if (fieldErrors.length > 0) {
                detailedErrorMessage += `Validation errors - ${fieldErrors.join(
                  ", "
                )}`;
              }
            } else if (errorData.error) {
              detailedErrorMessage += `Reason: ${errorData.error}`;
            } else if (errorData.message) {
              detailedErrorMessage += `Reason: ${errorData.message}`;
            } else if (typeof errorData === "string") {
              detailedErrorMessage += `Reason: ${errorData}`;
            } else {
              const errorMessages = [];
              if (errorData.ID) errorMessages.push(`ID: ${errorData.ID}`);
              if (errorData.Account)
                errorMessages.push(`Account: ${errorData.Account}`);
              if (errorData.Organization)
                errorMessages.push(`Organization: ${errorData.Organization}`);
              if (errorData.PLC) errorMessages.push(`PLC: ${errorData.PLC}`);

              if (errorMessages.length > 0) {
                detailedErrorMessage += `Please check - ${errorMessages.join(
                  ", "
                )}`;
              } else {
                detailedErrorMessage += `Server response: ${JSON.stringify(
                  errorData
                )}`;
              }
            }
          } else if (err?.message) {
            detailedErrorMessage += `Reason: ${err.message}`;
          } else {
            detailedErrorMessage +=
              "Unknown error occurred. Please check your input and try again.";
          }

          toast.error(detailedErrorMessage, {
            toastId: `save-entry-error-${i}`,
            autoClose: 7000,
          });

          console.error(`Save entry ${i + 1} error:`, {
            error: err,
            response: err?.response?.data,
            status: err?.response?.status,
          });
        }

        // Small delay between saves
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // After all saves, handle results
      if (failedIndices.length > 0) {
        // Keep only failed entries
        const remainingEntries = newEntries.filter((_, idx) =>
          failedIndices.includes(idx)
        );
        const remainingHours = newEntryPeriodHoursArray.filter((_, idx) =>
          failedIndices.includes(idx)
        );

        setNewEntries(remainingEntries);
        setNewEntryPeriodHoursArray(remainingHours);
      } else {
        // All saved successfully
        setNewEntries([]);
        setNewEntryPeriodHoursArray([]);
        toast.success(`Entries saved successfully!`, { autoClose: 3000 });
      }

      if (successCount > 0) {
        fetchEmployees();
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      }
    } catch (err) {
      console.error("Save multiple entries error:", err);
      toast.error("Failed to save entries.", { autoClose: 3000 });
    } finally {
      setIsDurationLoading(false);
    }
  };

  const handleSaveMultipleEntries = async () => {
    for (let i = 0; i < newEntries.length; i++) {
      // Temporarily set state for this entry
      setNewEntry(newEntries[i]);
      setNewEntryPeriodHours(newEntryPeriodHoursArray[i]);

      // Wait for state to update
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Call existing save function with ALL validation
      await handleSaveNewEntry();

      // Delay between saves
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Clear all entries after saving
    setNewEntries([]);
    setNewEntryPeriodHoursArray([]);
  };

  const handleFindReplace = async () => {
    if (
      !isEditable ||
      findValue === "" ||
      (replaceScope === "row" && selectedRowIndex === null) ||
      (replaceScope === "column" && selectedColumnKey === null)
    ) {
      toast.warn("Please select a valid scope and enter a value to find.", {
        toastId: "find-replace-warning",
        autoClose: 3000,
      });
      return;
    }

    setIsLoading(true);
    let replacementsCount = 0;
    let skippedCount = 0;

    try {
      // Prepare bulk payload array
      const bulkPayload = [];
      const updatedInputValues = { ...inputValues };

      for (const empIdx in localEmployees) {
        const emp = localEmployees[empIdx];
        const actualEmpIdx = parseInt(empIdx, 10);

        if (replaceScope === "row" && actualEmpIdx !== selectedRowIndex) {
          continue;
        }

        for (const duration of sortedDurations) {
          const uniqueKey = `${duration.monthNo}_${duration.year}`;

          if (replaceScope === "column" && uniqueKey !== selectedColumnKey) {
            continue;
          }

          if (!isMonthEditable(duration, closedPeriod, planType)) {
            continue;
          }

          const currentInputKey = `${actualEmpIdx}_${uniqueKey}`;
          let displayedValue;
          if (inputValues[currentInputKey] !== undefined) {
            displayedValue = String(inputValues[currentInputKey]);
          } else {
            const monthHours = getMonthHours(emp);
            const forecast = monthHours[uniqueKey];
            if (forecast && forecast.value !== undefined) {
              displayedValue = String(forecast.value);
            } else {
              displayedValue = "0";
            }
          }

          const findValueTrimmed = findValue.trim();
          const displayedValueTrimmed = displayedValue.trim();

          function isZeroLike(val) {
            if (val === undefined || val === null) return true;
            if (typeof val === "number") return val === 0;
            if (typeof val === "string") {
              const trimmed = val.trim();
              return (
                trimmed === "" ||
                trimmed === "0" ||
                trimmed === "0.0" ||
                trimmed === "0.00" ||
                (!isNaN(Number(trimmed)) && Number(trimmed) === 0)
              );
            }
            return false;
          }

          let isMatch = false;
          if (
            !isNaN(Number(findValueTrimmed)) &&
            Number(findValueTrimmed) === 0
          ) {
            isMatch = isZeroLike(displayedValueTrimmed);
          } else {
            isMatch = displayedValueTrimmed === findValueTrimmed;
            if (!isMatch) {
              const findNum = parseFloat(findValueTrimmed);
              const displayNum = parseFloat(displayedValueTrimmed);
              if (!isNaN(findNum) && !isNaN(displayNum)) {
                isMatch = findNum === displayNum;
              }
            }
          }

          if (isMatch) {
            const newValue = replaceValue.trim();
            const newNumericValue = newValue === "" ? 0 : Number(newValue);
            const monthHours = getMonthHours(emp);
            const forecast = monthHours[uniqueKey];

            if (!forecast || !forecast.forecastid) {
              skippedCount++;
              continue;
            }

            if (displayedValueTrimmed !== newValue) {
              updatedInputValues[currentInputKey] = newValue;
              replacementsCount++;

              // Create payload matching the bulk API structure from handleSaveAllHours
              const payload = {
                forecastedamt: forecast?.forecastedamt ?? 0,
                actualamt: forecast?.actualamt ?? 0,
                forecastid: Number(forecast?.forecastid ?? 0),
                projId: forecast?.projId ?? projectId ?? "",
                plId: forecast?.plId ?? planId ?? 0,
                emplId: forecast?.emplId ?? emp?.emple?.emplId ?? "",
                dctId: forecast?.dctId ?? 0,
                month: forecast?.month ?? duration?.monthNo ?? 0,
                year: forecast?.year ?? duration?.year ?? 0,
                totalBurdenCost: forecast?.totalBurdenCost ?? 0,
                fees: forecast?.fees ?? 0,
                burden: forecast?.burden ?? 0,
                ccffRevenue: forecast?.ccffRevenue ?? 0,
                tnmRevenue: forecast?.tnmRevenue ?? 0,
                revenue: forecast?.revenue ?? 0,
                cost: forecast?.cost ?? 0,
                forecastedCost: forecast?.forecastedCost ?? 0,
                fringe: forecast?.fringe ?? 0,
                overhead: forecast?.overhead ?? 0,
                gna: forecast?.gna ?? 0,
                materials: forecast?.materials ?? 0,
                // Update hours based on plan type
                ...(planType === "EAC"
                  ? {
                      actualhours: Number(newNumericValue) || 0,
                      forecastedhours: forecast?.forecastedhours ?? 0,
                    }
                  : {
                      forecastedhours: Number(newNumericValue) || 0,
                      actualhours: forecast?.actualhours ?? 0,
                    }),
                createdat: forecast?.createdat ?? new Date().toISOString(),
                updatedat: new Date().toISOString(),
                displayText: forecast?.displayText ?? "",
                acctId: emp?.emple?.accId ?? "",
                orgId: emp?.emple?.orgId ?? "",
                plc: emp?.emple?.plcGlcCode ?? "",
                empleId: emp?.emple?.id ?? 0,
                hrlyRate: emp?.emple?.perHourRate ?? 0,
                effectDt: new Date().toISOString().split("T")[0],
                emple: emp?.emple
                  ? {
                      id: emp.emple.id ?? 0,
                      emplId: emp.emple.emplId ?? "",
                      orgId: emp.emple.orgId ?? "",
                      firstName: emp.emple.firstName ?? "",
                      lastName: emp.emple.lastName ?? "",
                      plcGlcCode: emp.emple.plcGlcCode ?? "",
                      perHourRate: emp.emple.perHourRate ?? 0,
                      salary: emp.emple.salary ?? 0,
                      accId: emp.emple.accId ?? "",
                      hireDate:
                        emp.emple.hireDate ??
                        new Date().toISOString().split("T")[0],
                      isRev: emp.emple.isRev ?? false,
                      isBrd: emp.emple.isBrd ?? false,
                      createdAt:
                        emp.emple.createdAt ?? new Date().toISOString(),
                      type: emp.emple.type ?? "",
                      status: emp.emple.status ?? "",
                      plId: planId ?? 0,
                      isWarning: emp.emple.isWarning ?? false,
                      plForecasts: [],
                      organization: emp.emple.organization ?? null,
                      plProjectPlan: emp.emple.plProjectPlan ?? null,
                    }
                  : null,
              };

              bulkPayload.push(payload);
            }
          }
        }
      }

      if (bulkPayload.length === 0) {
        if (replacementsCount === 0 && skippedCount === 0) {
          toast.info("No cells replaced.", { autoClose: 2000 });
        }
        return;
      }

      // Update input values for UI consistency
      setInputValues(updatedInputValues);

      // Use correct bulk API endpoint matching handleSaveAllHours
      const apiPlanType = planType === "NBBUD" ? "BUD" : planType;

      const response = await axios.put(
        `${backendUrl}/Forecast/BulkUpdateForecastHours/${apiPlanType}`,
        bulkPayload,
        { headers: { "Content-Type": "application/json" } }
      );

      // Update local state for all successful updates matching handleSaveAllHours pattern
      setLocalEmployees((prev) => {
        const updated = [...prev];

        for (const empIdx in updated) {
          const emp = updated[empIdx];
          for (const duration of sortedDurations) {
            const uniqueKey = `${duration.monthNo}_${duration.year}`;
            const currentInputKey = `${empIdx}_${uniqueKey}`;
            if (updatedInputValues[currentInputKey] !== undefined) {
              if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
                const forecastIndex = emp.emple.plForecasts.findIndex(
                  (f) =>
                    f.month === duration.monthNo && f.year === duration.year
                );

                if (forecastIndex !== -1) {
                  const newValue =
                    parseFloat(updatedInputValues[currentInputKey]) || 0;
                  if (planType === "EAC") {
                    updated[empIdx].emple.plForecasts[
                      forecastIndex
                    ].actualhours = newValue;
                  } else {
                    updated[empIdx].emple.plForecasts[
                      forecastIndex
                    ].forecastedhours = newValue;
                  }
                }
              }
            }
          }
        }

        return updated;
      });

      if (replacementsCount > 0) {
        toast.success(`Successfully replaced ${replacementsCount} cells.`, {
          autoClose: 2000,
        });
      }

      if (skippedCount > 0) {
        toast.warning(`${skippedCount} entries could not be processed.`, {
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Bulk find/replace error:", err);
      toast.error(
        "Failed to replace values: " +
          (err.response?.data?.message || err.message),
        {
          toastId: "replace-error",
          autoClose: 3000,
        }
      );
    } finally {
      setIsLoading(false);
      setShowFindReplace(false);
      setFindValue("");
      setReplaceValue("");
      setSelectedRowIndex(null);
      setSelectedColumnKey(null);
      setReplaceScope("all");
    }
  };

  //  const handleFind = () => {
  //   if (!findValue) {
  //     toast.warn("Please enter a value to find.", { autoClose: 2000 });
  //     return;
  //   }

  //   const matches = [];
  //   const findValueTrimmed = findValue.trim();

  //   // Helper function to check if value is zero-like
  //   function isZeroLike(val) {
  //     if (val === undefined || val === null) return true;
  //     if (typeof val === "number") return val === 0;
  //     if (typeof val === "string") {
  //       const trimmed = val.trim();
  //       return (
  //         !trimmed ||
  //         trimmed === "0" ||
  //         trimmed === "0.0" ||
  //         trimmed === "0.00" ||
  //         (!isNaN(Number(trimmed)) && Number(trimmed) === 0)
  //       );
  //     }
  //     return false;
  //   }

  //   // Search through all employees and their hours
  //   for (const empIdx in localEmployees) {
  //     const emp = localEmployees[empIdx];
  //     const actualEmpIdx = parseInt(empIdx, 10);

  //     // Apply scope filter
  //     if (replaceScope === "row" && actualEmpIdx !== selectedRowIndex) continue;

  //     for (const duration of sortedDurations) {
  //       const uniqueKey = `${duration.monthNo}${duration.year}`;

  //       // Apply scope filter
  //       if (replaceScope === "column" && uniqueKey !== selectedColumnKey) continue;

  //       if (!isMonthEditable(duration, closedPeriod, planType)) continue;

  //       const currentInputKey = `${actualEmpIdx}${uniqueKey}`;
  //       let displayedValue;

  //       if (inputValues[currentInputKey] !== undefined) {
  //         displayedValue = String(inputValues[currentInputKey]);
  //       } else {
  //         const monthHours = getMonthHours(emp);
  //         const forecast = monthHours[uniqueKey];
  //         if (forecast && forecast.value !== undefined) {
  //           displayedValue = String(forecast.value);
  //         } else {
  //           displayedValue = "0";
  //         }
  //       }

  //       const displayedValueTrimmed = displayedValue.trim();

  //       let isMatch = false;

  //       // Check if we're searching for zero/empty
  //       if (!isNaN(Number(findValueTrimmed)) && Number(findValueTrimmed) === 0) {
  //         isMatch = isZeroLike(displayedValueTrimmed);
  //       } else {
  //         // Exact string match
  //         isMatch = displayedValueTrimmed === findValueTrimmed;

  //         // Also try numeric comparison
  //         if (!isMatch) {
  //           const findNum = parseFloat(findValueTrimmed);
  //           const displayNum = parseFloat(displayedValueTrimmed);
  //           if (!isNaN(findNum) && !isNaN(displayNum)) {
  //             isMatch = findNum === displayNum;
  //           }
  //         }
  //       }

  //       if (isMatch) {
  //         matches.push({ empIdx: actualEmpIdx, uniqueKey });
  //       }
  //     }
  //   }

  //   setFindMatches(matches);

  //   if (matches.length === 0) {
  //     toast.info("No matches found.", { autoClose: 2000 });
  //   } else {
  //     // toast.success(`Found ${matches.length} matches highlighted in the table.`, { autoClose: 3000 });
  //     // Close the modal to show the table
  //     setShowFindReplace(false);
  //   }
  // };

  const handleFind = () => {
    if (!findValue) {
      toast.warn("Please enter a value to find.", { autoClose: 2000 });
      return;
    }

    const matches = [];
    const findValueTrimmed = findValue.trim();

    // Helper function to check if value is zero-like
    function isZeroLike(val) {
      if (val === undefined || val === null) return true;
      if (typeof val === "number") return val === 0;
      if (typeof val === "string") {
        const trimmed = val.trim();
        return (
          !trimmed ||
          trimmed === "0" ||
          trimmed === "0.0" ||
          trimmed === "0.00" ||
          (!isNaN(Number(trimmed)) && Number(trimmed) === 0)
        );
      }
      return false;
    }

    // Search through all employees and their hours
    for (const empIdx in localEmployees) {
      const emp = localEmployees[empIdx];
      const actualEmpIdx = parseInt(empIdx, 10);

      // Apply scope filter
      if (replaceScope === "row" && actualEmpIdx !== selectedRowIndex) continue;

      for (const duration of sortedDurations) {
        const uniqueKey = `${duration.monthNo}_${duration.year}`; // FIXED: Added underscore

        // Apply scope filter
        if (replaceScope === "column" && uniqueKey !== selectedColumnKey)
          continue;

        if (!isMonthEditable(duration, closedPeriod, planType)) continue;

        const currentInputKey = `${actualEmpIdx}_${uniqueKey}`; // FIXED: Added underscore
        let displayedValue;

        if (inputValues[currentInputKey] !== undefined) {
          displayedValue = String(inputValues[currentInputKey]);
        } else {
          const monthHours = getMonthHours(emp);
          const forecast = monthHours[uniqueKey];
          if (forecast && forecast.value !== undefined) {
            displayedValue = String(forecast.value);
          } else {
            displayedValue = "0";
          }
        }

        const displayedValueTrimmed = displayedValue.trim();

        let isMatch = false;

        // Check if we're searching for zero/empty
        if (
          !isNaN(Number(findValueTrimmed)) &&
          Number(findValueTrimmed) === 0
        ) {
          isMatch = isZeroLike(displayedValueTrimmed);
        } else {
          // Exact string match
          isMatch = displayedValueTrimmed === findValueTrimmed;

          // Also try numeric comparison
          if (!isMatch) {
            const findNum = parseFloat(findValueTrimmed);
            const displayNum = parseFloat(displayedValueTrimmed);
            if (!isNaN(findNum) && !isNaN(displayNum)) {
              isMatch = findNum === displayNum;
            }
          }
        }

        if (isMatch) {
          matches.push({ empIdx: actualEmpIdx, uniqueKey });
        }
      }
    }

    setFindMatches(matches);

    if (matches.length === 0) {
      toast.info("No matches found.", { autoClose: 2000 });
    } else {
      // toast.success(`Found ${matches.length} matches highlighted in the table.`, { autoClose: 3000 });
      // Close the modal to show the table
      setShowFindReplace(false);
    }
  };

  // const handleRowClick = (actualEmpIdx) => {
  //   if (!isEditable) return;
  //   setSelectedRowIndex(
  //     actualEmpIdx === selectedRowIndex ? null : actualEmpIdx
  //   );
  //   setSelectedEmployeeId(localEmployees[actualEmpIdx]?.emple_Id);
  //   setSelectedEmployeeScheduleId(localEmployees[actualEmpIdx]?.emple?.emplId);
  //   setSelectedColumnKey(null);
  //   setReplaceScope(actualEmpIdx === selectedRowIndex ? "all" : "row");
  //   if (showNewForm) setSourceRowIndex(actualEmpIdx);
  // };

  //   const handleRowClick = (actualEmpIdx) => {
  //   // Allow row selection regardless of isEditable for Employee Schedule
  //   const isSameRow = actualEmpIdx === selectedRowIndex;

  //   setSelectedRowIndex(isSameRow ? null : actualEmpIdx);
  //   setSelectedEmployeeId(isSameRow ? null : localEmployees[actualEmpIdx]?.empleId);
  //   setSelectedEmployeeScheduleId(isSameRow ? null : localEmployees[actualEmpIdx]?.emple?.emplId);
  //   setSelectedColumnKey(null);

  //   if (isEditable) {
  //     setReplaceScope(isSameRow ? "all" : "row");
  //   }

  //   if (showNewForm && !isSameRow) {
  //     setSourceRowIndex(actualEmpIdx);
  //   }
  // };

  const handleRowClick = (actualEmpIdx) => {
    // Allow row selection regardless of isEditable for Employee Schedule
    const isSameRow = actualEmpIdx === selectedRowIndex;

    const employee = localEmployees[actualEmpIdx];
    const emplId = employee?.emple?.emplId;

    console.log("Row clicked:", { actualEmpIdx, isSameRow, employee, emplId }); // Debug log

    setSelectedRowIndex(isSameRow ? null : actualEmpIdx);
    setSelectedEmployeeId(isSameRow ? null : employee?.empleId);
    setSelectedEmployeeScheduleId(isSameRow ? null : emplId);
    setSelectedColumnKey(null);

    if (isEditable) {
      setReplaceScope(isSameRow ? "all" : "row");
    }

    if (showNewForm && !isSameRow) {
      setSourceRowIndex(actualEmpIdx);
    }
  };

  const handleDeleteEmployee = async (emple_Id) => {
    if (!emple_Id) return;

    try {
      await axios.delete(`${backendUrl}/Employee/DeleteEmployee/${emple_Id}`);

      toast.success("Employee deleted successfully!");

      // Remove deleted employee from local state
      setLocalEmployees((prev) =>
        prev.filter((emp) => emp.emple_Id !== emple_Id)
      );
    } catch (err) {
      toast.error(
        "Failed to delete employee: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleColumnHeaderClick = (uniqueKey) => {
    if (!isEditable) return;
    setSelectedColumnKey(uniqueKey === selectedColumnKey ? null : uniqueKey);
    setSelectedRowIndex(null);
    setReplaceScope(uniqueKey === selectedColumnKey ? "all" : "column");
  };

  const hasHiddenRows = Object.values(hiddenRows).some(Boolean);
  const showHiddenRows = () => setHiddenRows({});

  // const sortedDurations = [...durations]
  //   .filter((d) => fiscalYear === "All" || d.year === parseInt(fiscalYear))
  //   .sort(
  //     (a, b) =>
  //       new Date(a.year, a.monthNo - 1, 1) - new Date(b.year, b.monthNo - 1, 1)
  //   );

  const handleWarningClick = (e, emplId) => {
    e.stopPropagation(); // Prevent row click event
    setSelectedEmployeeIdForWarning(emplId);
    setShowWarningPopup(true);
  };

  const checkHoursExceedLimit = (empIdx, uniqueKey, hours) => {
    const duration = sortedDurations.find(
      (d) => `${d.monthNo}_${d.year}` === uniqueKey
    );
    if (!duration || !duration.workingHours) return false;

    const numericHours = parseFloat(hours) || 0;
    // CHANGE: Use just available hours for WARNING COLUMN
    const availableHours = duration.workingHours;
    return numericHours > availableHours;
  };

  const generateWarningKey = (emplId, plcCode, uniqueKey) => {
    return `${emplId}_${plcCode || "NOPLC"}_${uniqueKey}`;
  };

  const generateFieldWarningKey = (emplId, field, value) => {
    return `${emplId}_${field}_${value || "empty"}`;
  };

  const checkAccountInvalid = (value, updateOptions) => {
    if (planType === "NBBUD") return false;
    if (!value || value.trim() === "") return true;
    return !updateOptions.some((opt) => opt.id === value.trim());
  };

  const checkOrgInvalid = (value, updateOptions) => {
    if (planType === "NBBUD") return false;
    if (!value || value.trim() === "") return true;
    const trimmed = value.toString().trim();
    if (!/^[\d.]+$/.test(trimmed)) return true;
    return !updateOptions.some((opt) => opt.value.toString() === trimmed);
  };

  if (isLoading || isDurationLoading) {
    return (
      <div className="p-4 font-inter flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-gray-600">
          Loading forecast data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 font-inter">
        <div className="bg-red-100 border border-red-400 text-red-600 px-4 py-3 rounded">
          <strong className="font-bold text-xs">Error: </strong>
          <span className="block sm:inline text-xs">{error}</span>
        </div>
      </div>
    );
  }

  const rowCount = Math.max(
    localEmployees.filter((_, idx) => !hiddenRows[idx]).length +
      (showNewForm ? 1 : 0),
    2
  );

  // const firstEmplId = localEmployees.length > 0 && localEmployees[0]?.emple?.emplId
  // ? localEmployees[0].emple.emplId
  // : null;

  //   if (showEmployeeSchedule) {
  //   return (
  //     <div className="p-4 font-inter">
  //       {/* Back button */}
  //       <div className="mb-4">
  //         <button
  //           onClick={() => setShowEmployeeSchedule(false)}
  //           className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium cursor-pointer"
  //         >
  //            Back to Hours
  //         </button>
  //       </div>

  //       {/* Employee Schedule Component */}
  //       <EmployeeSchedule
  //         planId={planId}
  //         projectId={projectId}
  //         status={status}
  //         planType={planType}
  //         startDate={startDate}
  //         endDate={endDate}
  //         fiscalYear={fiscalYear}
  //         emplId={firstEmplId}
  //       />
  //     </div>
  //   );
  // }

  // if (showEmployeeSchedule) {
  //   return (
  //     <div className="p-4 font-inter">
  //       {/* Back button */}
  //       <div className="mb-4">
  //         <button
  //           onClick={() => setShowEmployeeSchedule(false)}
  //           className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium cursor-pointer"
  //         >
  //           Back to Hours
  //         </button>
  //       </div>

  //       {/* Employee Schedule Component */}
  //       <EmployeeSchedule
  //         planId={planId}
  //         projectId={projectId}
  //         status={status}
  //         planType={planType}
  //         startDate={startDate}
  //         endDate={endDate}
  //         fiscalYear={fiscalYear}
  //         emplId={selectedEmployeeId}
  //       />
  //     </div>
  //   );
  // }

  if (showEmployeeSchedule) {
    return (
      <div className="p-4 font-inter">
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => setShowEmployeeSchedule(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium cursor-pointer"
          >
            Back to Hours
          </button>
        </div>

        {/* Employee Schedule Component */}
        <EmployeeSchedule
          planId={planId}
          projectId={projectId}
          status={status}
          planType={planType}
          startDate={startDate}
          endDate={endDate}
          fiscalYear={fiscalYear}
          emplId={selectedEmployeeScheduleId}
          // selectedPlan={selectedPlan}
        />
      </div>
    );
  }

  return (
    <div className="relative p-4 font-inter w-full synchronized-tables-outer">
      {showSuccessMessage && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            successMessageText.includes("successfully") ||
            successMessageText.includes("Replaced")
              ? "bg-green-500"
              : "bg-red-500"
          } text-white text-xs`}
        >
          {successMessageText}
        </div>
      )}

      <div className="w-full flex justify-between mb-1 gap-2">
        <div className="flex-grow"></div>
        <div className="flex gap-2 ">
          {hasHiddenRows && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
              onClick={showHiddenRows}
            >
              Show Hidden Rows
            </button>
          )}

          {/* Add this where you want the copy button to appear */}
          {showCopyButton && (
            <button
              onClick={handleCopySelectedRows}
              className="blue-btn-common text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              title="Copy selected rows to clipboard"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Selected ({selectedRows.size})
            </button>
          )}

          {status === "In Progress" &&
            (hasUnsavedHoursChanges || hasUnsavedEmployeeChanges) && (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAll}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Changes (
                      {Object.keys(modifiedHours).length +
                        Object.keys(editedEmployeeData).length}
                      )
                    </>
                  )}
                </button>

                {/* Cancel Button - Show when new form OR pasted entries exist */}
                {(showNewForm ||
                  newEntries.length > 0 ||
                  hasUnsavedHoursChanges ||
                  hasUnsavedEmployeeChanges) && (
                  <button
                    onClick={() => {
                      if (newEntries.length > 0) {
                        // Cancel pasted entries
                        setNewEntries([]);
                        setNewEntryPeriodHoursArray([]);
                        setPastedEntrySuggestions({});
                        setPastedEntryAccounts({});
                        setPastedEntryOrgs({});
                        setPastedEntryPlcs({});
                        toast.info("Cancelled pasted entries", {
                          autoClose: 2000,
                        });
                      }
                      if (showNewForm) {
                        // Cancel single new entry
                        resetNewEntryForm();
                        setShowNewForm(false);
                        toast.info("Cancelled new entry", { autoClose: 2000 });
                      }

                      setHasUnsavedHoursChanges(false);
                      setHasUnsavedEmployeeChanges(false);
                      // Clear clipboard data
                      setHasClipboardData(false);
                      setCopiedRowsData([]);
                      setCopiedMonthMetadata([]);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

          {isEditable && (
            <>
              {/* <button
                onClick={() => setShowNewForm((prev) => !prev)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
              >
                {showNewForm ? "Cancel" : "New"}
              </button> */}

              <button
                onClick={() => {
                  if (showNewForm) {
                    // Reset all form fields when canceling
                    setNewEntry({
                      id: "",
                      firstName: "",
                      lastName: "",
                      isRev: false,
                      isBrd: false,
                      idType: "",
                      acctId: "",
                      orgId: "",
                      plcGlcCode: "",
                      perHourRate: "",
                      status: "Act",
                    });
                    setNewEntryPeriodHours({});
                    setEmployeeSuggestions([]);
                    setLaborAccounts([]);
                    setPlcOptions([]);
                    setFilteredPlcOptions([]);
                    setPlcSearch("");
                    setOrgSearch("");
                    setAutoPopulatedPLC(false);
                    setShowNewForm(false);
                    resetNewEntryForm(); // Reset form first
                  } else {
                    setShowNewForm(true);
                  }
                }}
                className="px-4 py-2 blue-btn-common text-white rounded hover:bg-blue-700 text-xs font-medium"
              >
                {/* {showNewForm ? "Cancel" : "New"} */}
                New
              </button>

              {hasClipboardData && status === "In Progress" && (
                <button
                  onClick={() => {
                    handlePasteMultipleRows();
                    setHasClipboardData(false);
                    setCopiedRowsData([]);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium"
                >
                  Paste ({copiedRowsData.length} data)
                </button>
              )}

              {/* Save Entry - Show for BOTH showNewForm AND newEntries */}
              {(showNewForm || newEntries.length > 0) && (
                <button
                  onClick={() => {
                    if (newEntries.length > 0) {
                      // Save multiple pasted entries
                      handleSaveMultipleEntry();
                    } else {
                      // Save single new entry
                      handleSaveNewEntry();
                    }
                  }}
                  className="px-4 py-2 blue-btn-common text-white rounded  text-xs font-medium"
                >
                  {newEntries.length > 0
                    ? `Save All (${newEntries.length})`
                    : "Save Entry"}
                </button>
              )}

              {/* Cancel Button - Show when new form OR pasted entries exist */}
              {(showNewForm || newEntries.length > 0) && (
                <button
                  onClick={() => {
                    if (newEntries.length > 0) {
                      // Cancel pasted entries
                      setNewEntries([]);
                      setNewEntryPeriodHoursArray([]);
                      setPastedEntrySuggestions({});
                      setPastedEntryAccounts({});
                      setPastedEntryOrgs({});
                      setPastedEntryPlcs({});
                      toast.info("Cancelled pasted entries", {
                        autoClose: 2000,
                      });
                    }
                    if (showNewForm) {
                      // Cancel single new entry
                      resetNewEntryForm();
                      setShowNewForm(false);
                      toast.info("Cancelled new entry", { autoClose: 2000 });
                    }
                    // Clear clipboard data
                    setHasClipboardData(false);
                    setCopiedRowsData([]);
                    setCopiedMonthMetadata([]);
                  }}
                  className="px-4 py-2 blue-btn-common text-white rounded  text-xs font-medium"
                >
                  Cancel
                </button>
              )}

              {!showNewForm && (
                <>
                  <button
                    className="px-4 py-2 blue-btn-common text-white rounded  transition text-xs font-medium"
                    onClick={() => isEditable && setShowFindReplace(true)}
                  >
                    Find / Replace
                  </button>
                  {/* <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium"
                    onClick={() => {
                      if (!selectedEmployeeId) {
                        toast.error("Please select an employee to delete");
                        return;
                      }
                      if (
                        window.confirm(
                          "Are you sure you want to delete this employee?"
                        )
                      ) {
                        handleDeleteEmployee(selectedEmployeeId);
                        setSelectedEmployeeId(null); // optional: clear selection
                      }
                      
                    }}
                    
                  >
                    Delete
                  </button> */}
                  {/* <button
                    className={`px-4 py-2 text-white rounded transition text-xs font-medium
    ${
      planType === "EAC"
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-red-600 hover:bg-red-700"
    }`}
                    onClick={() => {
                      if (!selectedEmployeeId) {
                        toast.error("Please select an employee to delete");
                        return;
                      }
                      if (
                        window.confirm(
                          "Are you sure you want to delete this employee?"
                        )
                      ) {
                        handleDeleteEmployee(selectedEmployeeId);
                        setSelectedEmployeeId(null); // optional: clear selection
                      }
                    }}
                    disabled={planType === "EAC"}
                  >
                    Delete
                  </button> */}
                  <button
  className={`px-4 py-2 text-white rounded transition text-xs font-medium
    ${planType === "EAC" ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
  onClick={() => {
    // FIX: Check if any row is selected in the Set
    if (selectedRows.size === 0) {
      toast.error("Please select an employee to delete");
      return;
    }

    // Get the first selected index (assuming single delete for now based on your UI)
    const selectedIndex = Array.from(selectedRows)[0];
    const empToDelete = localEmployees[selectedIndex];

    if (!empToDelete || !empToDelete.emple_Id) {
      toast.error("Invalid employee selection");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this employee?"
      )
    ) {
      handleDeleteEmployee(empToDelete.emple_Id);
      setSelectedRows(new Set()); // Clear selection after delete
    }
  }}
  disabled={planType === "EAC"}
>
  Delete
</button>
                </>
              )}
              {showNewForm && (
                <button
                  className="px-4 py-2 blue-btn-common text-white rounded  transition text-xs font-medium"
                  onClick={() => isEditable && setShowFillValues(true)}
                >
                  Fill Values
                </button>
              )}

              {/* <button
  onClick={() => setShowEmployeeSchedule(prev => !prev)}
  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium"
>
  {showEmployeeSchedule ? 'Hide Employee Schedule' : 'Employee Schedule'}
</button> */}
              {/* <button
  onClick={() => setShowEmployeeSchedule(true)}
  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium"
>
  Employee Schedule
</button> */}
              {/* <button 
  onClick={() => {
    if (!selectedEmployeeId) {
      toast.error("Please select a row first by clicking on it", { autoClose: 2000 });
      return;
    }
    setShowEmployeeSchedule(true);
  }}
  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium"
>
  Employee Schedule
</button> */}
            </>
          )}
          {/* <button 
  onClick={() => {
    if (!selectedEmployeeScheduleId) {
      toast.error("Please select a row first by clicking on it", { autoClose: 2000 });
      return;
    }
    setShowEmployeeSchedule(true);
  }}
  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium"
>
  Employee Schedule
</button> */}
          <button
            onClick={() => {
              if (!selectedEmployeeScheduleId) {
                toast.error("Please select a row first by clicking on it", {
                  autoClose: 2000,
                });
                return;
              }
              setShowEmployeeSchedule(true);
            }}
            disabled={!selectedEmployeeScheduleId}
            className={`px-4 py-2 rounded text-xs font-medium transition cursor-pointer ${
              selectedEmployeeScheduleId
                ? "blue-btn-common text-white "
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Employee Schedule
          </button>
        </div>
      </div>

      {showFillValues && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
            <h3 className="text-lg font-semibold mb-4">
              Fill Values to selected record/s
            </h3>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Select Fill Method
              </label>
              <select
                value={fillMethod}
                onChange={(e) => setFillMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
              >
                <option value="None">None</option>
                <option value="Copy From Source Record">
                  Copy from source record
                </option>
                <option value="Specify Hours">Specify Hours</option>
                <option value="Use Available Hours">Use Available Hours</option>
                <option value="Use Start Period Hours">
                  Use Start Period Hours
                </option>
              </select>
            </div>
            {fillMethod === "Specify Hours" && (
              <div className="mb-4">
                <label className="block text-gray-700 text-xs font-medium mb-1">
                  Hours
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fillHours}
                  onChange={(e) =>
                    setFillHours(parseFloat(e.target.value) || 0)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Backspace" &&
                      (e.target.value === "0" || e.target.value === "")
                    ) {
                      e.preventDefault();
                      setFillHours("");
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md p-2 text-xs"
                  placeholder="0.00"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Start Period
              </label>
              <input
                type="date"
                value={fillStartDate}
                onChange={(e) => setFillStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                End Period
              </label>
              <input
                type="date"
                value={fillEndDate}
                onChange={(e) => setFillEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFillValues(false);
                  setFillMethod("None");
                  setFillHours(0.0);
                  setSourceRowIndex(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleFillValues}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
              >
                Fill
              </button>
            </div>
          </div>
        </div>
      )}

      {localEmployees.length === 0 &&
      !showNewForm &&
      sortedDurations.length > 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs">
          No forecast data available for this plan.
        </div>
      ) : (
        <div className="border-line">
          <div className="synchronized-tables-container flex w-full">
            <div
              ref={firstTableRef}
              onScroll={handleFirstScroll}
              className="hide-scrollbar flex-1"
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                overflowX: "auto",
              }}
            >
              <table className="table-fixed table min-w-full  ">
                <thead className="thead">
                  <tr
                    style={{
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      lineHeight: "normal",
                    }}
                  >
                    {EMPLOYEE_COLUMNS.map((col) => (
                      <th key={col.key} className="th-thead min-w-[70px]">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tbody">
                  {showNewForm && (
                    <tr
                      key="new-entry"
                      className="bg-gray-50"
                      style={{
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        lineHeight: "normal",
                      }}
                    >
                      <td className="tbody-td">
                        <select
                          name="idType"
                          value={newEntry.idType || ""}
                          onChange={(e) => handleIdTypeChange(e.target.value)}
                          className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                        >
                          {ID_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="tbody-td">
             

                        <input
                          type="text"
                          name="id"
                          value={newEntry.id}
                          // value={
                          //   newEntry.idType === "Other" ? "KBD001" : newEntry.id
                          // }
                          onChange={(e) => handleIdChange(e.target.value)}
                          onKeyDown={(e) => {
    // Allow space key for all inputs - don't prevent default
    if (e.key === ' ') {
      e.stopPropagation(); // Stop parent handlers but allow typing
    }
  }}
                        
                          disabled={newEntry.idType === "PLC"}
                          className={`w-full rounded px-1 py-0.5 text-xs outline-none focus:ring-0 no-datalist-border ${
                            newEntry.idType === "PLC"
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                          
                          list="employee-id-list"
                          placeholder={
                            newEntry.idType === "PLC"
                              ? "Not required for PLC"
                              : "Enter ID"
                          }
                        />
                        <datalist id="employee-id-list">
                          {newEntry.idType !== "Other" &&
                            employeeSuggestions
                              .filter(
                                (emp) =>
                                  emp.emplId && typeof emp.emplId === "string"
                              )
                              .map((emp, index) => (
                                <option
                                  key={`${emp.emplId}-${index}`}
                                  value={emp.emplId}
                                >
                                  {emp.lastName && emp.firstName
                                    ? `${emp.lastName}, ${emp.firstName}`
                                    : emp.lastName ||
                                      emp.firstName ||
                                      emp.emplId}
                                </option>
                              ))}
                        </datalist>
                      </td>

                      <td className="tbody-td text-center">
                        <span className="text-gray-400 text-xs">-</span>
                      </td>

                      <td className="tbody-td">
  {newEntry.idType === "PLC" ? (
    // 1. PLC Type: Read-only, shows PLC Description
    <input
      type="text"
      name="name"
      value={newEntry.firstName || ""} 
      readOnly
      className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100 cursor-not-allowed"
      placeholder="PLC Description"
    />
  ) : (
    // 2. Other Types (Employee, Vendor, Other)
    <input
      type="text"
      name="name"
      // FIX: Removed .trim() here so you can type spaces
      // value={
      //   newEntry.idType === "Other" || planType === "NBBUD"
      //     ? `${newEntry.firstName || ""} ${newEntry.lastName || ""}`
      //     : newEntry.idType === "Vendor"
      //     ? newEntry.lastName || newEntry.firstName || ""
      //     : newEntry.lastName && newEntry.firstName
      //     ? `${newEntry.lastName}, ${newEntry.firstName}`
      //     : newEntry.lastName || newEntry.firstName || ""
      // }
//       value={
//   newEntry.idType === "Other" || planType === "NBBUD"
//     ? (newEntry.firstName || "") + (newEntry.firstName && newEntry.lastName ? " " : "") + (newEntry.lastName || "")
//     : newEntry.idType === "Vendor"
//     ? newEntry.lastName || newEntry.firstName || ""
//     : newEntry.lastName && newEntry.firstName
//     ? `${newEntry.lastName}, ${newEntry.firstName}`
//     : newEntry.lastName || newEntry.firstName || ""
// }
// value={
//         newEntry.idType === "Other" || planType === "NBBUD"
//           ? newEntry.firstName || "" 
//           : newEntry.idType === "Vendor"
//           ? newEntry.lastName || newEntry.firstName || ""
//           : `${newEntry.lastName || ""} ${newEntry.firstName || ""}`.trim() // standard display for emp
//       }
// --- FIX START: Check Vendor FIRST so it correctly displays lastName even in NBBUD ---
    value={
      newEntry.idType === "Vendor"
        ? newEntry.lastName || newEntry.firstName || ""
        : newEntry.idType === "Other" || planType === "NBBUD"
        ? newEntry.firstName || ""
        : newEntry.idType === "PLC"
        ? newEntry.firstName
        : `${newEntry.lastName || ""} ${newEntry.firstName || ""}`.trim()
    }
      readOnly={planType !== "NBBUD" && newEntry.idType !== "Other"}
      
      onKeyDown={(e) => {
        // FIX: Stop propagation so space doesn't trigger row clicks, but allow default typing
        if (e.key === " ") {
          e.stopPropagation();
        }
      }}

      // onChange={(e) => {
      //   if (newEntry.idType === "Other" || planType === "NBBUD") {
          
      //     // 1. Remove emojis (Keep this existing logic)
      //     const cleanValue = e.target.value.replace(
      //       /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      //       ""
      //     );

      //     // 2. Split by space to save into First/Last name buckets
      //     // FIX: Do NOT trim 'cleanValue' here, or you can't type the separation space
      //     const nameParts = cleanValue.split(" ");
      //     const firstName = nameParts[0] || "";
      //     const lastName = nameParts.slice(1).join(" ") || "";

      //     setNewEntry((prev) => ({
      //       ...prev,
      //       firstName: firstName,
      //       lastName: lastName,
      //     }));
      //   }
      // }}
      onChange={(e) => {
        if (newEntry.idType === "Other" || planType === "NBBUD") {
          const cleanValue = e.target.value.replace(
            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
            ""
          );
          
          // Remove leading space only (allow spaces in middle/end)
          const valueToStore = cleanValue.startsWith(" ") ? cleanValue.trimStart() : cleanValue;

          setNewEntry((prev) => ({
            ...prev,
            firstName: valueToStore, // Store full string here temporarily
            lastName: "" // Clear last name, we split on save
          }));
        }
      }}
      className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
        newEntry.idType === "Other" || planType === "NBBUD"
          ? "bg-white"
          : "bg-gray-100 cursor-not-allowed"
      }`}
      placeholder={
        newEntry.idType === "Other" 
          ? "Enter Name" 
          : "Name (auto-filled)"
      }
    />
  )}
</td>

                      <td className="tbody-td">
                        <input
                          type="text"
                          name="acctId"
                          value={newEntry.acctId}
                          onChange={(e) => handleAccountChange(e.target.value)}
                          onBlur={(e) => handleAccountBlur(e.target.value)}
                          className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                            !isFieldEditable
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                          list="account-list"
                          placeholder="Enter Account"
                          //   disabled={!isBudPlan}
                          disabled={!isFieldEditable}
                        />
                        <datalist id="account-list">
                          {laborAccounts.map((account, index) => (
                            <option
                              key={`${account.id}-${index}`}
                              value={account.id}
                            >
                              {account.id}
                            </option>
                          ))}
                        </datalist>
                      </td>
                      {/* ADD THIS NEW TD FOR ACCOUNT NAME IN NEW ENTRY FORM */}
                      {/* <td className="tbody-td">
                        <input
                          type="text"
                          value={(() => {
                            const accountWithName =
                              accountOptionsWithNames.find(
                                (acc) => acc.id === newEntry.acctId
                              );
                            return accountWithName ? accountWithName.name : "";
                          })()}
                          readOnly
                          className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100 cursor-not-allowed"
                          placeholder="Account Name (auto-filled)"
                        />
                      </td> */}
                      <td className="tbody-td min-w-[70px]"> 
  <input
    type="text"
    value={(() => {
      const accountWithName =
        accountOptionsWithNames.find(
          (acc) => acc.id === newEntry.acctId
        );
      return accountWithName ? accountWithName.name : "";
    })()}
    readOnly
    className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100 cursor-not-allowed"
    placeholder="Account Name (auto-filled)"
  />
</td>
                      {/* <td className="tbody-td">
                                      <input
                                        type="text"
                                        name="orgId"
                                        value={newEntry.orgId}
                                        onChange={(e) => handleOrgChange(e.target.value)}
                                        onBlur={(e) => handleOrgBlur(e.target.value)}
                                        className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                                          !isBudPlan ? "bg-gray-100 cursor-not-allowed" : ""
                                        }`}
                                        placeholder="Enter Organization"
                                        disabled={!isBudPlan}
                                      />
                                    </td> */}
                      <td className="tbody-td">
                        <input
                          type="text"
                          name="orgId"
                          value={newEntry.orgId}
                          onChange={(e) => handleOrgInputChange(e.target.value)}
                          onBlur={(e) => handleOrgBlur(e.target.value)}
                          className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                            !isFieldEditable
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                          list="organization-list"
                          placeholder="Enter Organization ID (numeric)"
                          // disabled={!isBudPlan}
                          disabled={!isFieldEditable}
                        />
                        <datalist id="organization-list">
                          {organizationOptions.map((org, index) => (
                            <option
                              key={`${org.value}-${index}`}
                              value={org.value}
                            >
                              {org.label}
                            </option>
                          ))}
                        </datalist>
                      </td>

                      <td className="tbody-td">
                        <input
                          type="text"
                          name="plcGlcCode"
                          value={plcSearch}
                          onChange={(e) => handlePlcInputChange(e.target.value)}
                          onBlur={(e) => {
                            if (planType === "NBBUD") return;
                            const val = e.target.value.trim();

                            if (
                              val !== "" &&
                              !plcOptions.some(
                                (option) =>
                                  option.value.toLowerCase() ===
                                  val.toLowerCase()
                              )
                            ) {
                              toast.error(
                                "PLC must be selected from the available suggestions.",
                                {
                                  autoClose: 3000,
                                }
                              );
                              // Clear invalid input
                              setPlcSearch("");
                              setNewEntry((prev) => ({
                                ...prev,
                                plcGlcCode: "",
                              }));
                            }
                          }}
                          disabled={newEntry.idType === ""}
                          className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                          list="plc-list"
                          placeholder="Enter or select PLC"
                          autoComplete="off"
                        />

                        <datalist id="plc-list">
                          {filteredPlcOptions.map((plc, index) => (
                            <option
                              key={`${plc.value}-${index}`}
                              value={plc.value}
                            >
                              {plc.label}
                            </option>
                          ))}
                        </datalist>
                      </td>

                      <td className="tbody-td text-center">
                        <input
                          type="checkbox"
                          name="isRev"
                          checked={newEntry.isRev}
                          //   onChange={(e) =>
                          //     isBudPlan &&
                          //     setNewEntry({
                          //       ...newEntry,
                          //       isRev: e.target.checked,
                          //     })
                          //   }
                          // CHANGE TO:
                          onChange={(e) =>
                            isFieldEditable &&
                            setNewEntry({
                              ...newEntry,
                              isRev: e.target.checked,
                            })
                          }
                          disabled={!isFieldEditable}
                        />
                      </td>
                      <td className="tbody-td text-center">
                        <input
                          type="checkbox"
                          name="isBrd"
                          checked={newEntry.isBrd}
                          //   onChange={(e) =>
                          //     isBudPlan &&
                          //     setNewEntry({
                          //       ...newEntry,
                          //       isBrd: e.target.checked,
                          //     })
                          //   }
                          //   className="w-4 h-4"
                          //   disabled={!isBudPlan}
                          // CHANGE TO:
                          onChange={(e) =>
                            isFieldEditable &&
                            setNewEntry({
                              ...newEntry,
                              isBrd: e.target.checked,
                            })
                          }
                          disabled={!isFieldEditable}
                        />
                      </td>
                      <td className="tbody-td">
                        <input
                          type="text"
                          name="status"
                          value={newEntry.status}
                          disabled={newEntry.idType === "Other"}
                          onChange={(e) =>
                            setNewEntry({ ...newEntry, status: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                          placeholder="Enter Status"
                        />
                      </td>
                      <td className="tbody-td">
                        <input
                          type="password"
                          name="perHourRate"
                          value={isEditingNewEntry ? newEntry.perHourRate : ""}
                          placeholder={isEditingNewEntry ? "" : "**"}
                          onFocus={() => setIsEditingNewEntry(true)}
                          onBlur={() => setIsEditingNewEntry(false)}
                          // onChange={(e) =>
                          //   isFieldEditable &&
                          //   setNewEntry({
                          //     ...newEntry,
                          //     perHourRate: e.target.value.replace(/[^0-9.]/g, ""),
                          //   })
                          // }
                          // className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                          //   !isFieldEditable
                          //     ? "bg-gray-100 cursor-not-allowed"
                          //     : ""
                          // }`}
                          // disabled={!isFieldEditable}
                          onChange={(e) => {
                            const isFieldEditable = !(
                              newEntry.idType === "Employee" ||
                              newEntry.idType === "Vendor"
                            );
                            if (isFieldEditable) {
                              setNewEntry((prev) => ({
                                ...prev,
                                perHourRate: e.target.value.replace(
                                  /[^0-9.]/g,
                                  ""
                                ),
                              }));
                            }
                          }}
                          disabled={
                            newEntry.idType === "Employee" ||
                            newEntry.idType === "Vendor"
                          } // Disable for Employee and Vendor
                          className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                            newEntry.idType === "Employee" ||
                            newEntry.idType === "Vendor"
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                        />
                      </td>

                      <td className="tbody-td">
                        {Object.values(newEntryPeriodHours)
                          .reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {newEntries.length > 0 &&
                    newEntries.map((entry, entryIndex) => (
                      <React.Fragment key={`new-entry-months-${entryIndex}`}>
                        <tr
                          key={`new-entry-${entryIndex}`}
                          className="bg-gray-50"
                          style={{
                            height: `${ROW_HEIGHT_DEFAULT}px`,
                            lineHeight: "normal",
                          }}
                        >
                          {/* ID Type */}
                          <td className="tbody-td">
                            {/* <select
                              name="idType"
                              value={entry.idType}
                              // onChange={(e) => {
                              //   const value = e.target.value;
                              //   setNewEntries((prev) =>
                              //     prev.map((ent, idx) =>
                              //       idx === entryIndex
                              //         ? {
                              //             id: "",
                              //             firstName: "",
                              //             lastName: "",
                              //             isRev: false,
                              //             isBrd: false,
                              //             idType: value,
                              //             acctId:
                              //               laborAccounts.length > 0
                              //                 ? laborAccounts[0].id
                              //                 : "",
                              //             orgId: "",
                              //             plcGlcCode: "",
                              //             perHourRate: "",
                              //             status: "Act",
                              //           }
                              //         : ent
                              //     )
                              //   );
                              //   setPlcSearch("");
                              //   setAutoPopulatedPLC(false);
                              // }}
                              onChange={(e) => {
  const value = e.target.value;
  
  // 1. Update State
  setNewEntries((prev) =>
    prev.map((ent, idx) =>
      idx === entryIndex
        ? {
            id: "",
            firstName: "",
            lastName: "",
            isRev: false,
            isBrd: false,
            idType: value,
            acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
            orgId: "",
            plcGlcCode: "",
            perHourRate: "",
            status: "Act",
          }
        : ent
    )
  );
  setPlcSearch("");
  setAutoPopulatedPLC(false);

  // 2. FIX: Fetch suggestions immediately for the new ID Type
  // Create a temporary entry object with the NEW idType to pass to the fetcher
  const updatedEntryForFetch = { ...entry, idType: value };
  fetchSuggestionsForPastedEntry(entryIndex, updatedEntryForFetch);
}}
                              className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                            >
                              {ID_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select> */}
                            <select
  name="idType"
  value={entry.idType}
  onChange={(e) => {
    const value = e.target.value;

    // FIX: Auto-populate ID if type is PLC
    const newId = value === "PLC" ? "PLC" : "";

    setNewEntries((prev) =>
      prev.map((ent, idx) =>
        idx === entryIndex
          ? {
              id: newId, // <--- Updated here to use newId
              firstName: "",
              lastName: "",
              isRev: false,
              isBrd: false,
              idType: value,
              acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
              orgId: "",
              plcGlcCode: "",
              perHourRate: "",
              status: "Act",
            }
          : ent
      )
    );
    setPlcSearch("");
    setAutoPopulatedPLC(false);

    // Fetch suggestions for the new ID Type
    const updatedEntryForFetch = { ...entry, idType: value };
    fetchSuggestionsForPastedEntry(entryIndex, updatedEntryForFetch);
  }}
  className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
>
  {ID_TYPE_OPTIONS.map((opt) => (
    <option key={opt.value} value={opt.value}>
      {opt.label}
    </option>
  ))}
</select>
                          </td>
                          {/* ID */}
                         {/* ID Input in Pasted Entry */}
<td className="tbody-td">
  <input
    type="text"
    name="id"
    value={entry.id}
    // FIX: Allow spaces by preventing row click propagation on space key
    onKeyDown={(e) => {
      if (e.key === ' ') {
        e.stopPropagation();
      }
    }}
    onChange={(e) => {
      // FIX: Remove emojis for ALL types
      const valueWithoutEmojis = e.target.value.replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
        ""
      );
      
      const trimmedValue = valueWithoutEmojis.trim();

      setNewEntries((prev) =>
        prev.map((ent, idx) =>
          idx === entryIndex
            ? { ...ent, id: valueWithoutEmojis } // Store raw value to allow typing spaces
            : ent
        )
      );

      // Auto-populate fields if employee found (only if not "Other" type)
      if (entry.idType !== "Other") {
        const suggestions = pastedEntrySuggestions[entryIndex] || [];
        const selectedEmployee = suggestions.find(
          (emp) => emp.emplId === trimmedValue
        );
        if (selectedEmployee) {
          setNewEntries((prev) =>
            prev.map((ent, idx) =>
              idx === entryIndex
                ? {
                    ...ent,
                    id: trimmedValue, // Snap to trimmed ID on match
                    firstName: selectedEmployee.firstName || "",
                    lastName: selectedEmployee.lastName || "",
                    perHourRate: selectedEmployee.perHourRate || "",
                    orgId: selectedEmployee.orgId || ent.orgId,
                    plcGlcCode: selectedEmployee.plc || "",
                  }
                : ent
            )
          );
        }
      }
    }}
    disabled={entry.idType === "PLC"}
    className={`w-full rounded px-1 py-0.5 text-xs outline-none focus:ring-0 no-datalist-border ${
      entry.idType === "PLC"
        ? "bg-gray-100 cursor-not-allowed"
        : ""
    }`}
    list={`employee-id-list-${entryIndex}`}
    placeholder={
      entry.idType === "PLC"
        ? "Not required for PLC"
        : "Enter ID"
    }
  />
  {/* Datalist logic remains the same as previously fixed */}
  <datalist id={`employee-id-list-${entryIndex}`}>
    {entry.idType !== "Other" && 
      (pastedEntrySuggestions[entryIndex] || [])
        .filter(
          (emp) =>
            emp.emplId && typeof emp.emplId === "string"
        )
        .map((emp, index) => (
          <option
            key={`${emp.emplId}-${index}`}
            value={emp.emplId}
          >
            {emp.lastName && emp.firstName
              ? `${emp.lastName}, ${emp.firstName}`
              : emp.lastName ||
                emp.firstName ||
                emp.emplId}
          </option>
        ))
    }
  </datalist>
</td>
                          {/* Warning Column - Empty */}
                          <td className="tbody-td text-center">
                            <span className="text-gray-400 text-xs">-</span>
                          </td>
                          {/* Name */}
                          {/* <td className="tbody-td">
                            <input
                              type="text"
                              name="name"
                              value={
                                entry.idType === "PLC"
                                  ? entry.firstName
                                  : entry.idType === "Vendor"
                                  ? entry.lastName || entry.firstName
                                  : `${entry.firstName || ""} ${
                                      entry.lastName || ""
                                    }`.trim()
                              }
                              readOnly
                              className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100 cursor-not-allowed"
                              placeholder="Name auto-filled"
                            />
                          </td> */}
                          {/* Name Input in Pasted Entry */}
<td className="tbody-td">
  <input
    type="text"
    name="name"
    // Logic to display name based on type
    value={
      entry.idType === "Other" || planType === "NBBUD"
        ? entry.firstName || "" 
        : entry.idType === "PLC"
        ? entry.firstName // PLC Description
        : entry.idType === "Vendor"
        ? entry.lastName || entry.firstName || ""
        : `${entry.lastName || ""} ${entry.firstName || ""}`.trim()
    }
    readOnly={planType !== "NBBUD" && entry.idType !== "Other"}
    
    // FIX: Allow spaces for "Other" type
    onKeyDown={(e) => {
      if (e.key === " ") {
        e.stopPropagation();
      }
    }}

    onChange={(e) => {
      // Only allow editing if type is "Other" or plan is NBBUD
      if (entry.idType === "Other" || planType === "NBBUD") {
        // FIX: Remove emojis immediately
        const cleanValue = e.target.value.replace(
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          ""
        );
        
        // Remove leading space only (allow spaces in middle/end)
        const valueToStore = cleanValue.startsWith(" ") ? cleanValue.trimStart() : cleanValue;

        setNewEntries((prev) => 
          prev.map((ent, idx) => 
            idx === entryIndex 
            ? {
                ...ent,
                firstName: valueToStore, // Store full string here temporarily
                lastName: "" // Clear last name, will be split on save if needed
              }
            : ent
          )
        );
      }
    }}
    className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
      entry.idType === "Other" || planType === "NBBUD"
        ? "bg-white"
        : "bg-gray-100 cursor-not-allowed"
    }`}
    placeholder={
      entry.idType === "Other" 
        ? "Enter Name" 
        : "Name (auto-filled)"
    }
  />
</td>
                          {/* Account */}
                          <td className="tbody-td">
                            <input
                              type="text"
                              name="acctId"
                              value={entry.acctId}
                              onChange={(e) => {
                                const value = e.target.value;
                                setNewEntries((prev) =>
                                  prev.map((ent, idx) =>
                                    idx === entryIndex
                                      ? { ...ent, acctId: value }
                                      : ent
                                  )
                                );

                                // Auto-populate account name if account found
                                const accounts =
                                  pastedEntryAccounts[entryIndex] || [];
                                const selectedAccount = accounts.find(
                                  (acc) => acc.id === value
                                );
                                if (selectedAccount) {
                                  setNewEntries((prev) =>
                                    prev.map((ent, idx) =>
                                      idx === entryIndex
                                        ? {
                                            ...ent,
                                            acctId: value,
                                            acctName: selectedAccount.name,
                                          }
                                        : ent
                                    )
                                  );
                                }
                              }}
                              className="w-full rounded px-1 py-0.5 text-xs outline-none focus:ring-0 no-datalist-border"
                              list={`account-list-${entryIndex}`}
                              placeholder="Enter Account"
                            />
                            <datalist id={`account-list-${entryIndex}`}>
                              {(pastedEntryAccounts[entryIndex] || []).map(
                                (account, index) => (
                                  <option
                                    key={`${account.id}-${index}`}
                                    value={account.id}
                                  >
                                    {account.name}
                                  </option>
                                )
                              )}
                            </datalist>
                          </td>
                          {/* Account Name */}
                          <td className="tbody-td">
                            <input
                              type="text"
                              value={(() => {
                                const accountWithName =
                                  accountOptionsWithNames.find(
                                    (acc) => acc.id === entry.acctId
                                  );
                                return accountWithName
                                  ? accountWithName.name
                                  : "";
                              })()}
                              readOnly
                              className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100 cursor-not-allowed"
                              placeholder="Account Name auto-filled"
                            />
                          </td>
                          {/* Organization */}
                          <td className="tbody-td">
                            <input
                              type="text"
                              name="orgId"
                              value={entry.orgId}
                              onChange={(e) => {
                                const value = e.target.value;
                                setNewEntries((prev) =>
                                  prev.map((ent, idx) =>
                                    idx === entryIndex
                                      ? { ...ent, orgId: value }
                                      : ent
                                  )
                                );
                              }}
                              className="w-full rounded px-1 py-0.5 text-xs outline-none focus:ring-0 no-datalist-border"
                              list={`organization-list-${entryIndex}`}
                              placeholder="Enter Organization"
                            />
                            <datalist id={`organization-list-${entryIndex}`}>
                              {(pastedEntryOrgs[entryIndex] || []).map(
                                (org, index) => (
                                  <option
                                    key={`${org.value}-${index}`}
                                    value={org.value}
                                  >
                                    {org.label}
                                  </option>
                                )
                              )}
                            </datalist>
                          </td>
                          {/* PLC */}
                          {/* <td className="tbody-td">
                            <input
                              type="text"
                              name="plcGlcCode"
                              value={entry.plcGlcCode}
                              onChange={(e) => {
                                const value = e.target.value;
                                setNewEntries((prev) =>
                                  prev.map((ent, idx) =>
                                    idx === entryIndex
                                      ? { ...ent, plcGlcCode: value }
                                      : ent
                                  )
                                );
                              }}
                              className="w-full rounded px-1 py-0.5 text-xs outline-none focus:ring-0 no-datalist-border"
                              list={`plc-list-${entryIndex}`}
                              placeholder="Enter PLC"
                            />
                            <datalist id={`plc-list-${entryIndex}`}>
                              {(pastedEntryPlcs[entryIndex] || []).map(
                                (plc, index) => (
                                  <option
                                    key={`${plc.value}-${index}`}
                                    value={plc.value}
                                  >
                                    {plc.label}
                                  </option>
                                )
                              )}
                            </datalist>
                          </td> */}
                          {/* PLC Input in Pasted Entry */}
<td className="tbody-td">
  <input
    type="text"
    name="plcGlcCode"
    value={entry.plcGlcCode}
    onChange={(e) => {
      const value = e.target.value;
      
      // 1. Find the matching PLC option to get the description
      const currentPlcOptions = pastedEntryPlcs[entryIndex] || [];
      const selectedOption = currentPlcOptions.find(
        (opt) => opt.value.toLowerCase() === value.toLowerCase()
      );

      // 2. Update State
      setNewEntries((prev) =>
        prev.map((ent, idx) =>
          idx === entryIndex
            ? { 
                ...ent, 
                plcGlcCode: value,
                // If type is PLC and we found a match, update the Name (firstName)
                firstName: (ent.idType === "PLC" && selectedOption) 
                  ? selectedOption.label 
                  : ent.firstName
              }
            : ent
        )
      );
    }}
    className="w-full rounded px-1 py-0.5 text-xs outline-none focus:ring-0 no-datalist-border"
    list={`plc-list-${entryIndex}`}
    placeholder="Enter PLC"
  />
  <datalist id={`plc-list-${entryIndex}`}>
    {(pastedEntryPlcs[entryIndex] || []).map((plc, index) => (
      <option key={`${plc.value}-${index}`} value={plc.value}>
        {plc.label}
      </option>
    ))}
  </datalist>
</td>
                          {/* Rev */}
                          <td className="tbody-td text-center">
                            <input
                              type="checkbox"
                              name="isRev"
                              checked={entry.isRev}
                              onChange={(e) => {
                                setNewEntries((prev) =>
                                  prev.map((ent, idx) =>
                                    idx === entryIndex
                                      ? { ...ent, isRev: e.target.checked }
                                      : ent
                                  )
                                );
                              }}
                            />
                          </td>
                          {/* Brd */}
                          <td className="tbody-td text-center">
                            <input
                              type="checkbox"
                              name="isBrd"
                              checked={entry.isBrd}
                              onChange={(e) => {
                                setNewEntries((prev) =>
                                  prev.map((ent, idx) =>
                                    idx === entryIndex
                                      ? { ...ent, isBrd: e.target.checked }
                                      : ent
                                  )
                                );
                              }}
                            />
                          </td>
                          {/* Status */}
                          <td className="tbody-td">
                            <input
                              type="text"
                              name="status"
                              value={entry.status}
                              onChange={(e) => {
                                setNewEntries((prev) =>
                                  prev.map((ent, idx) =>
                                    idx === entryIndex
                                      ? { ...ent, status: e.target.value }
                                      : ent
                                  )
                                );
                              }}
                              className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                            />
                          </td>
                          {/* Hour Rate */}
                          <td className="tbody-td">
                            <input
                              type="text"
                              name="perHourRate"
                              value={entry.perHourRate}
                              onChange={(e) => {
                                setNewEntries((prev) =>
                                  prev.map((ent, idx) =>
                                    idx === entryIndex
                                      ? {
                                          ...ent,
                                          perHourRate: e.target.value.replace(
                                            /[^0-9.]/g,
                                            ""
                                          ),
                                        }
                                      : ent
                                  )
                                );
                              }}
                              className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                            />
                          </td>
                          {/* Total */}
                          <td className="tbody-td">
                            {Object.values(
                              newEntryPeriodHoursArray[entryIndex] || {}
                            )
                              .reduce(
                                (sum, val) => sum + parseFloat(val || 0),
                                0
                              )
                              .toFixed(2)}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}

                  {localEmployees
                    .filter((_, idx) => !hiddenRows[idx])
                    .map((emp, idx) => {
                      const actualEmpIdx = localEmployees.findIndex(
                        (e) => e === emp
                      );
                      const row = getEmployeeRow(emp, actualEmpIdx);
                      const editedData = editedEmployeeData[actualEmpIdx] || {};
                      return (
                        <tr
                          key={`employee-${actualEmpIdx}`}
                          className={`whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200 ${
                            selectedRows.has(actualEmpIdx)
                              ? "bg-blue-100"
                              : selectedRowIndex === actualEmpIdx
                              ? "bg-yellow-100"
                              : "even:bg-gray-50"
                          }`}
                          style={{
                            height: `${ROW_HEIGHT_DEFAULT}px`,
                            lineHeight: "normal",
                            cursor: "pointer", // Make it clear it's clickable
                          }}
                          onClick={() => {
                            // Handle row click for selection
                            handleRowSelection(
                              actualEmpIdx,
                              !selectedRows.has(actualEmpIdx)
                            );
                            handleRowClick(actualEmpIdx); // Keep existing row click functionality
                          }}
                          // onClick={() => handleRowClick(actualEmpIdx)}
                        >
                          <td className="tbody-td min-w-[70px]">
                            {row.idType}
                          </td>
                          <td className="tbody-td min-w-[70px]">
                            {row.emplId}
                          </td>

                          {/* UPDATE THIS WARNING CELL */}
                          <td className="tbody-td min-w-[70px]">
                            {row.warning ? (
                              <span
                                className="text-yellow-500 text-lg cursor-pointer hover:text-yellow-600"
                                title="Click to view warnings"
                                onClick={(e) =>
                                  handleWarningClick(e, row.emplId)
                                }
                              >
                                ⚠️
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
                            )}
                          </td>

                          {/* <td className="tbody-td min-w-[70px]">{row.name}</td> */}
                          <td className="tbody-td min-w-[70px]">
  {/* FIX: Check if we have an edited first name (PLC description) and display it, otherwise show original */}
  {editedData.firstName !== undefined 
    ? editedData.firstName 
    : row.name}
</td>

                          <td className="tbody-td min-w-[70px]">
                            {isBudPlan && isEditable ? (
                              <input
                                type="text"
                                value={
                                  editedData.acctId !== undefined
                                    ? editedData.acctId
                                    : row.acctId
                                }
                                onChange={(e) =>
                                  handleAccountInputChangeForUpdate(
                                    e.target.value,
                                    actualEmpIdx
                                  )
                                }
                                onBlur={(e) => {
                                  if (planType === "NBBUD") return; // Add this line
                                  const val = e.target.value;
                                  const originalValue = row.acctId;

                                  if (
                                    val !== originalValue &&
                                    !isValidAccountForUpdate(
                                      val,
                                      updateAccountOptions
                                    )
                                  ) {
                                    toast.error(
                                      "Please enter a valid Account from the available list.",
                                      {
                                        autoClose: 3000,
                                      }
                                    );
                                  } else {
                                    // handleEmployeeDataBlur(actualEmpIdx, emp);
                                  }
                                }}
                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                list={`account-list-${actualEmpIdx}`}
                                placeholder="Enter Account"
                              />
                            ) : (
                              row.acctId
                            )}
                            <datalist id={`account-list-${actualEmpIdx}`}>
                              {updateAccountOptions.map((account, index) => (
                                <option
                                  key={`${account.id}-${index}`}
                                  value={account.id}
                                >
                                  {account.id}
                                </option>
                              ))}
                            </datalist>
                          </td>

                          {/* ADD THIS MISSING TD FOR ACCOUNT NAME */}
                          <td className="tbody-td min-w-[70px]">
                            {row.acctName}
                          </td>

                          <td className="tbody-td min-w-[70px]">
                            {isBudPlan && isEditable ? (
                              <input
                                type="text"
                                value={
                                  editedData.orgId !== undefined
                                    ? editedData.orgId
                                    : row.orgId
                                }
                                onChange={(e) =>
                                  handleOrgInputChangeForUpdate(
                                    e.target.value,
                                    actualEmpIdx
                                  )
                                }
                                onBlur={(e) => {
                                  if (planType === "NBBUD") return; // Add this line
                                  const val = e.target.value;
                                  const originalValue = row.orgId;

                                  if (
                                    val !== originalValue &&
                                    val &&
                                    !isValidOrgForUpdate(
                                      val,
                                      updateOrganizationOptions
                                    )
                                  ) {
                                    toast.error(
                                      "Please enter a valid numeric Organization ID from the available list.",
                                      {
                                        autoClose: 3000,
                                      }
                                    );
                                  } else {
                                    // handleEmployeeDataBlur(actualEmpIdx, emp);
                                  }
                                }}
                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                list={`organization-list-${actualEmpIdx}`}
                                placeholder="Enter Organization ID"
                              />
                            ) : (
                              row.orgId
                            )}
                            <datalist id={`organization-list-${actualEmpIdx}`}>
                              {updateOrganizationOptions.map((org, index) => (
                                <option
                                  key={`${org.value}-${index}`}
                                  value={org.value}
                                >
                                  {org.label}
                                </option>
                              ))}
                            </datalist>
                          </td>

                          <td className="tbody-td min-w-[70px]">
                            {isBudPlan && isEditable ? (
                              <input
                                type="text"
                                value={
                                  editedData.glcPlc !== undefined
                                    ? editedData.glcPlc
                                    : row.glcPlc
                                }
                                onChange={(e) =>
                                  handlePlcInputChangeForUpdate(
                                    e.target.value,
                                    actualEmpIdx
                                  )
                                }
                                onBlur={(e) => {
                                  if (planType === "NBBUD") return;
                                  const val = e.target.value.trim();
                                  const originalValue = row.glcPlc;

                                  // Only validate if value has changed and is not empty
                                  if (val !== originalValue && val !== "") {
                                    const exactPlcMatch = plcOptions.find(
                                      (option) =>
                                        option.value.toLowerCase() ===
                                        val.toLowerCase()
                                    );

                                    if (!exactPlcMatch) {
                                      toast.error(
                                        "PLC must be selected from the available suggestions. Custom values are not allowed.",
                                        {
                                          autoClose: 4000,
                                        }
                                      );
                                      // Reset to original value
                                      handleEmployeeDataChange(
                                        actualEmpIdx,
                                        "glcPlc",
                                        originalValue
                                      );
                                      setPlcSearch(originalValue);
                                    }
                                  }
                                }}
                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                list={`plc-list-${actualEmpIdx}`}
                                placeholder="Enter PLC"
                              />
                            ) : (
                              row.glcPlc
                            )}
                            <datalist id={`plc-list-${actualEmpIdx}`}>
                              {/* Use updatePlcOptions if available, otherwise fallback to plcOptions */}
                              {(updatePlcOptions.length > 0
                                ? updatePlcOptions
                                : plcOptions
                              ).map((plc, index) => (
                                <option
                                  key={`${plc.value}-${index}`}
                                  value={plc.value}
                                >
                                  {plc.label}
                                </option>
                              ))}
                            </datalist>
                          </td>

                          <td className="tbody-td min-w-[70px] text-center">
                            {isFieldEditable && isEditable ? (
                              <input
                                type="checkbox"
                                checked={
                                  editedData.isRev !== undefined
                                    ? editedData.isRev
                                    : emp.emple.isRev
                                }
                                onChange={(e) =>
                                  handleEmployeeDataChange(
                                    actualEmpIdx,
                                    "isRev",
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4"
                              />
                            ) : (
                              row.isRev
                            )}
                          </td>
                          <td className="tbody-td min-w-[70px] text-center">
                            {isFieldEditable && isEditable ? (
                              <input
                                type="checkbox"
                                checked={
                                  editedData.isBrd !== undefined
                                    ? editedData.isBrd
                                    : emp.emple.isBrd
                                }
                                onChange={(e) =>
                                  handleEmployeeDataChange(
                                    actualEmpIdx,
                                    "isBrd",
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4"
                              />
                            ) : (
                              row.isBrd
                            )}
                          </td>
                          <td className="tbody-td min-w-[70px]">
                            {row.status}
                          </td>

                          <td className="tbody-td min-w-[70px]">
                            {isBudPlan &&
                            isEditable &&
                            emp.emple.type !== "Employee" &&
                            emp.emple.type !== "Vendor Employee" &&
                            emp.emple.type !== "Vendor" ? (
                              <input
                                type="password"
                                value={
                                  editingPerHourRateIdx === actualEmpIdx
                                    ? editedData.perHourRate !== undefined
                                      ? editedData.perHourRate
                                      : row.perHourRate
                                    : ""
                                }
                                placeholder={
                                  editingPerHourRateIdx === actualEmpIdx
                                    ? ""
                                    : "**"
                                }
                                onFocus={() =>
                                  setEditingPerHourRateIdx(actualEmpIdx)
                                }
                                onChange={(e) =>
                                  handleEmployeeDataChange(
                                    actualEmpIdx,
                                    "perHourRate",
                                    e.target.value.replace(/[^0-9.]/g, "")
                                  )
                                }
                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                // disabled={false}
                                disabled={
                                  emp.emple.type !== "Employee" &&
                                  emp.emple.type !== "Vendor Employee" &&
                                  emp.emple.type !== "Vendor"
                                }
                              />
                            ) : (
                              <span className="text-gray-400 cursor-not-allowed">
                                **
                              </span>
                            )}
                          </td>

                          <td className="tbody-td min-w-[70px]">{row.total}</td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr
                    className="bg-white font-normal text-center text-white "
                    style={{
                      position: "sticky",
                      bottom: 0,
                      zIndex: 20,
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      // height: "25px",
                      lineHeight: "normal",
                      borderTop: "2px solid #d1d5db", // tailwind gray-300
                    }}
                  >
                    <td colSpan={EMPLOYEE_COLUMNS.length}>" "</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div
              ref={secondTableRef}
              onScroll={handleSecondScroll}
              className="flex-1"
              style={{
                maxHeight: "400px",
                overflowY: "auto", // show scrollbar
                overflowX: "auto",
              }}
            >
              <table className="min-w-full table">
                <thead className="thead">
                  <tr
                    style={{
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      lineHeight: "normal",
                    }}
                  >
                    {/* CTD Header */}
                    {/* <th
      key="ctd-header"
      className="th-thead min-w-[80px]"
      style={{ cursor: "default" }}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <span className="whitespace-nowrap th-thead">CTD</span>
        <span className="text-xs text-gray-600 font-normal normal-case">
          {(() => {
            if (fiscalYear === "All") return "N/A";
            const startYear = parseInt(startDate.split('-')[0]);
            const selectedYear = parseInt(fiscalYear);
            return `${startYear}-${selectedYear - 2}`;
          })()}
        </span>
      </div>
    </th> */}

                    {/* {normalizedFiscalYear !== "All" && normalizedFiscalYear !== ""  && (
  <th
    key="ctd-header"
    className="th-thead min-w-[80px]"
    style={{ cursor: "default" }}
  >
    <div className="flex flex-col items-center justify-center h-full">
      <span className="whitespace-nowrap th-thead">CTD</span>
      <span className="text-xs text-gray-600 font-normal normal-case">
        {(() => {
          const startYear = parseInt(startDate.split('-')[0]);
          const selectedYear = parseInt(normalizedFiscalYear);
          return `${startYear}-${selectedYear - 2}`;
        })()}
      </span>
    </div>
  </th>
)}
     */}
                    {/* {normalizedFiscalYear !== "All" && normalizedFiscalYear !== "" && (
  <th key="ctd-header" className="th-thead min-w-[80px]">
    <div>
      <span className="th-thead">CTD</span>
      <span className="text-xs text-gray-600 font-normal normal-case">
        {(() => {
          const startYear = parseInt(startDate.split('-')[0]);
          const selectedYear = parseInt(normalizedFiscalYear);
          return `${startYear}-${selectedYear - 2}`;
        })()}
      </span>
    </div>
  </th>
)} */}

                    {/* {normalizedFiscalYear !== "All" && (
  <th key="ctd-header" className="th-thead min-w-80px">
    <div className="flex flex-col items-center justify-center h-full">
      <span className="whitespace-nowrap th-thead">CTD</span>
      <span className="text-xs text-gray-600 font-normal normal-case">
        {(() => {
          const startYear = parseInt(startDate.split("-")[0]);
          const selectedYear = parseInt(normalizedFiscalYear);
          return `${startYear}-${selectedYear - 2}`;
        })()}
      </span>
    </div>
  </th>
)} */}

                    {shouldShowCTD() && (
                      <th key="ctd-header" className="th-thead min-w-80px">
                        <div className="flex flex-col items-center justify-center h-full">
                          <span className="whitespace-nowrap th-thead">
                            CTD
                          </span>
                          <span className="text-xs text-gray-600 font-normal normal-case whitespace-nowrap">
                            {(() => {
                              const startYear = parseInt(
                                startDate.split("-")[0]
                              );
                              const selectedYear =
                                parseInt(normalizedFiscalYear);
                              return `${startYear}-${selectedYear - 2}`;
                            })()}
                          </span>
                        </div>
                      </th>
                    )}

                    {/* Prior Year Header */}
                    {/* <th
      key="prior-year-header"
      className="th-thead min-w-[80px]"
      style={{ cursor: "default" }}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <span className="whitespace-nowrap th-thead">Prior Year</span>
        <span className="text-xs text-gray-600 font-normal normal-case">
          {fiscalYear !== "All" ? parseInt(fiscalYear) - 1 : "N/A"}
        </span>
      </div>
    </th> */}
                    {/* {normalizedFiscalYear !== "All" && normalizedFiscalYear !== ""  && (
  <th
    key="prior-year-header"
    className="th-thead min-w-[80px]"
    style={{ cursor: "default" }}
  >
    <div className="flex flex-col items-center justify-center h-full">
      <span className="whitespace-nowrap th-thead">Prior Year</span>
      <span className="text-xs text-gray-600 font-normal normal-case">
        {parseInt(normalizedFiscalYear) - 1}
      </span>
    </div>
  </th>
)} */}
                    {/* {normalizedFiscalYear !== "All" && (
  <th key="prior-year-header" className="th-thead min-w-80px">
    <div className="flex flex-col items-center justify-center h-full">
      <span className="whitespace-nowrap th-thead">Prior Year</span>
      <span className="text-xs text-gray-600 font-normal normal-case">
        {parseInt(normalizedFiscalYear) - 1}
      </span>
    </div>
  </th>
)} */}
                    {shouldShowPriorYear() && (
                      <th
                        key="prior-year-header"
                        className="th-thead min-w-80px"
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <span className="whitespace-nowrap th-thead">
                            Prior Year
                          </span>
                          <span className="text-xs text-gray-600 font-normal normal-case">
                            {parseInt(normalizedFiscalYear) - 1}
                          </span>
                        </div>
                      </th>
                    )}
                    {sortedDurations.map((duration) => {
                      const uniqueKey = `${duration.monthNo}_${duration.year}`;
                      return (
                        <th
                          key={uniqueKey}
                          className={`th-thead min-w-[80px]  ${
                            selectedColumnKey === uniqueKey
                              ? "bg-yellow-100"
                              : ""
                          }`}
                          style={{ cursor: isEditable ? "pointer" : "default" }}
                          onClick={() => handleColumnHeaderClick(uniqueKey)}
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className="whitespace-nowrap th-thead">
                              {duration.month}
                            </span>
                            <span className="text-xs text-gray-600 font-normal normal-case">
                              {duration.workingHours || 0} hrs
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="tbody">
                  {showNewForm && (
                    <tr
                      key="new-entry"
                      className="bg-gray-50"
                      style={{
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        lineHeight: "normal",
                      }}
                    >
                      {/* CTD Cell - read-only for new entry */}
                      {/* <td className="tbody-td text-center text-xs bg-gray-100">
      0.00
    </td> */}
                      {/* {normalizedFiscalYear !== "All" && normalizedFiscalYear !== ""  && (
  <td className="tbody-td text-center text-xs bg-gray-100">
    0.00
  </td>
)}
*/}

                      {shouldShowCTD() && (
                        <td className="tbody-td text-center text-xs bg-gray-100">
                          0.00
                        </td>
                      )}

                      {/* Prior Year Cell - read-only for new entry */}
                      {/* <td className="tbody-td text-center text-xs bg-gray-100">
      0.00
    </td> */}
                      {/* {normalizedFiscalYear !== "All" && normalizedFiscalYear !== ""  && (
  <td className="tbody-td text-center text-xs bg-gray-100">
    0.00
  </td>
)} */}
                      {shouldShowPriorYear() && (
                        <td className="tbody-td text-center text-xs bg-gray-100">
                          0.00
                        </td>
                      )}
                      {sortedDurations.map((duration) => {
                        const uniqueKey = `${duration.monthNo}_${duration.year}`;
                        const value = newEntryPeriodHours[uniqueKey] || 0; // ← Use newEntryPeriodHours for new form
                        const isInputEditable =
                          isEditable &&
                          isMonthEditable(duration, closedPeriod, planType);

                        return (
                          <td key={`new-entry-${uniqueKey}`} className="tbody-td text-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              className={`text-center border border-gray-300 bg-white text-xs w-[50px] h-[18px] p-[2px] ${
                                !isInputEditable
                                  ? "cursor-not-allowed text-gray-400"
                                  : "text-gray-700"
                              }`}
                              // style={{ minWidth: "80px" }}
                              value={value || ""} // Ensure empty string when undefined/null
                              onChange={(e) => {
                                const inputValue = e.target.value;

                                // Allow completely empty input (for clearing with backspace)
                                if (inputValue === "") {
                                  setNewEntryPeriodHours((prev) => ({
                                    ...prev,
                                    [uniqueKey]: "",
                                  }));
                                  return;
                                }

                                // Only allow numeric input with decimal
                                if (!/^[0-9]*\.?[0-9]*$/.test(inputValue)) {
                                  return; // Don't update if not numeric
                                }

                                // Get available hours for validation
                                const currentDuration = sortedDurations.find(
                                  (d) => `${d.monthNo}_${d.year}` === uniqueKey
                                );
                                if (
                                  currentDuration &&
                                  currentDuration.workingHours
                                ) {
                                  const maxAllowedHours =
                                    currentDuration.workingHours * 2;
                                  const numericValue =
                                    parseFloat(inputValue) || 0;

                                  // Prevent input if exceeds limit
                                  if (numericValue > maxAllowedHours) {
                                    toast.error(
                                      `Hours cannot exceed more than available hours * 2`,
                                      {
                                        autoClose: 3000,
                                      }
                                    );
                                    return; // Don't update the state
                                  }
                                }

                                setNewEntryPeriodHours((prev) => ({
                                  ...prev,
                                  [uniqueKey]: inputValue,
                                }));
                              }}
                              onKeyDown={(e) => {
                                // Allow backspace to completely clear the field
                                if (
                                  e.key === "Backspace" &&
                                  (value === "0" || value === "")
                                ) {
                                  e.preventDefault();
                                  setNewEntryPeriodHours((prev) => ({
                                    ...prev,
                                    [uniqueKey]: "",
                                  }));
                                }
                              }}
                              disabled={!isInputEditable}
                              placeholder="Enter Hours"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {/* PASTED ENTRIES - ADD THIS SECTION */}
                  {newEntries.length > 0 &&
                    newEntries.map((entry, entryIndex) => (
                      <tr
                        key={`new-entry-duration-${entryIndex}`}
                        // className="bg-gray-50"
                        style={{
                          height: `${ROW_HEIGHT_DEFAULT}px`,
                          lineHeight: "normal",
                        }}
                      >

                      {/* ADDED: Render CTD Cell for Pasted Row */}
                        {shouldShowCTD() && (
                          <td className="tbody-td text-center text-xs bg-gray-100">
                            0.00
                          </td>
                        )}

                        {/* ADDED: Render Prior Year Cell for Pasted Row */}
                        {shouldShowPriorYear() && (
                          <td className="tbody-td text-center text-xs bg-gray-100">
                            0.00
                          </td>
                        )}

                        {sortedDurations.map((duration) => {
                          const uniqueKey = `${duration.monthNo}_${duration.year}`;
                          const value =
                            newEntryPeriodHoursArray[entryIndex]?.[uniqueKey] ||
                            "";
                          const isInputEditable =
                            isEditable &&
                            isMonthEditable(duration, closedPeriod, planType);

                          return (
                            <td
                              key={`new-entry-${entryIndex}-${uniqueKey}`}
                              className="tbody-td"
                            >
                              <input
                                type="text"
                                inputMode="numeric"
                                className={`text-center w-full text-xs ${
                                  !isInputEditable
                                    ? "cursor-not-allowed text-gray-400 bg-gray-100"
                                    : "text-gray-700 bg-white"
                                }`}
                                value={value}
                                onChange={(e) => {
                                  const inputValue = e.target.value;

                                  // Allow completely empty input for clearing
                                  if (inputValue === "") {
                                    setNewEntryPeriodHoursArray((prev) =>
                                      prev.map((hours, idx) =>
                                        idx === entryIndex
                                          ? { ...hours, [uniqueKey]: "" }
                                          : hours
                                      )
                                    );
                                    return;
                                  }

                                  // Only allow numeric input with decimal
                                  if (!/^[0-9]*\.?[0-9]*$/.test(inputValue)) {
                                    return; // Don't update if not numeric
                                  }

                                  // Check for negative values
                                  const numericValue = parseFloat(inputValue);
                                  if (numericValue < 0) {
                                    toast.error("Hours cannot be negative", {
                                      autoClose: 2000,
                                    });
                                    return;
                                  }

                                  // Check against available hours * 2
                                  const currentDuration = sortedDurations.find(
                                    (d) =>
                                      `${d.monthNo}_${d.year}` === uniqueKey
                                  );

                                  if (
                                    currentDuration &&
                                    currentDuration.workingHours
                                  ) {
                                    const maxAllowedHours =
                                      currentDuration.workingHours * 2;

                                    if (numericValue > maxAllowedHours) {
                                      toast.error(
                                        `Hours cannot exceed more than available hours * 2`,
                                        { autoClose: 3000 }
                                      );
                                      return; // Don't update the state
                                    }
                                  }

                                  // Update state if validation passes
                                  setNewEntryPeriodHoursArray((prev) =>
                                    prev.map((hours, idx) =>
                                      idx === entryIndex
                                        ? { ...hours, [uniqueKey]: inputValue }
                                        : hours
                                    )
                                  );
                                }}
                                onKeyDown={(e) => {
                                  // Allow backspace to completely clear the field
                                  if (
                                    e.key === "Backspace" &&
                                    (value === "0" || value === "")
                                  ) {
                                    e.preventDefault();
                                    setNewEntryPeriodHoursArray((prev) =>
                                      prev.map((hours, idx) =>
                                        idx === entryIndex
                                          ? { ...hours, [uniqueKey]: "" }
                                          : hours
                                      )
                                    );
                                  }
                                }}
                                disabled={!isInputEditable}
                                placeholder=""
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                  {localEmployees
                    .filter((_, idx) => !hiddenRows[idx])
                    .map((emp, idx) => {
                      const actualEmpIdx = localEmployees.findIndex(
                        (e) => e === emp
                      );
                      const monthHours = getMonthHours(emp);

                      // Calculate CTD and Prior Year for this employee
                      // Calculate CTD and Prior Year for this employee
                      // let empCtd = 0;
                      // let empPriorYear = 0;

                      // if (fiscalYear !== "All") {
                      //   const currentFiscalYear = parseInt(fiscalYear);
                      //   const startYear = parseInt(startDate.split('-')[0]);

                      //   // ✅ CORRECT - Use ALL durations, not filtered sortedDurations
                      //   durations.forEach((duration) => {
                      //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
                      //     const inputValue = inputValues[`${actualEmpIdx}_${uniqueKey}`];
                      //     const forecastValue = monthHours[uniqueKey]?.value;
                      //     const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
                      //     const hours = value && !isNaN(value) ? Number(value) : 0;

                      //     // Prior Year: sum of (selected fiscal year - 1)
                      //     if (duration.year === currentFiscalYear - 1) {
                      //       empPriorYear += hours;
                      //     }

                      //     // CTD: sum from start year to (selected fiscal year - 2)
                      //     if (duration.year >= startYear && duration.year <= currentFiscalYear - 2) {
                      //       empCtd += hours;
                      //     }
                      //   });
                      // }

                      // Calculate CTD and Prior Year for this employee
                      let empCtd = 0;
                      let empPriorYear = 0;

                      if (normalizedFiscalYear !== "All") {
                        // const currentFiscalYear = parseInt(fiscalYear);
                        const currentFiscalYear =
                          parseInt(normalizedFiscalYear);
                        const startYear = parseInt(startDate.split("-")[0]);

                        // ✅ CRITICAL: Use ALL durations, not sortedDurations
                        durations.forEach((duration) => {
                          const uniqueKey = `${duration.monthNo}_${duration.year}`;

                          // ✅ CRITICAL FIX: Use actualEmpIdx (not idx) consistently
                          const inputValue =
                            inputValues[`${actualEmpIdx}_${uniqueKey}`];
                          const forecastValue = monthHours[uniqueKey]?.value;
                          const value =
                            inputValue !== undefined && inputValue !== ""
                              ? inputValue
                              : forecastValue;
                          const hours =
                            value && !isNaN(value) ? Number(value) : 0;

                          // Prior Year: sum of (selected fiscal year - 1)
                          if (duration.year === currentFiscalYear - 1) {
                            empPriorYear += hours;
                          }

                          // CTD: sum from start year to (selected fiscal year - 2)
                          if (
                            duration.year >= startYear &&
                            duration.year <= currentFiscalYear - 2
                          ) {
                            empCtd += hours;
                          }
                        });
                      }

                      return (
                        <tr
                          key={`hours-${actualEmpIdx}`}
                          // className="whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200"
                          style={{
                            height: `${ROW_HEIGHT_DEFAULT}px`,
                            lineHeight: "normal",
                          }}
                        >
                          {/* CTD Cell */}
                          {/* <td className="tbody-td text-center text-xs">
          {empCtd.toFixed(2)}
        </td> */}
                          {/* {normalizedFiscalYear !== "All"  && (
  <td className="tbody-td text-center text-xs">
    {empCtd.toFixed(2)}
  </td>
)} */}
                          {/* {normalizedFiscalYear !== "All" && (
  <td className="tbody-td text-center text-xs">
    {employeeYearTotals[actualEmpIdx]?.ctd?.toFixed(2) || '0.00'}
  </td>
)}
         */}

                          {shouldShowCTD() && (
                            <td className="tbody-td text-center text-xs">
                              {employeeYearTotals[actualEmpIdx]?.ctd?.toFixed(
                                2
                              ) || "0.00"}
                            </td>
                          )}
                          {/* Prior Year Cell */}
                          {/* <td className="tbody-td text-center text-xs">
          {empPriorYear.toFixed(2)}
        </td>
         */}
                          {/* {normalizedFiscalYear !== "All"  && (
  <td className="tbody-td text-center text-xs">
    {empPriorYear.toFixed(2)}
  </td>
)} */}
                          {/* {normalizedFiscalYear !== "All" && (
  <td className="tbody-td text-center text-xs">
    {employeeYearTotals[actualEmpIdx]?.priorYear?.toFixed(2) || '0.00'}
  </td>
)} */}
                          {shouldShowPriorYear() && (
                            <td className="tbody-td text-center text-xs">
                              {employeeYearTotals[
                                actualEmpIdx
                              ]?.priorYear?.toFixed(2) || "0.00"}
                            </td>
                          )}
                          {sortedDurations.map((duration) => {
                            // const actualEmpIdx = 0;
                            const uniqueKey = `${duration.monthNo}_${duration.year}`;
                            const forecast = monthHours[uniqueKey];
                            const value =
                              inputValues[`${actualEmpIdx}_${uniqueKey}`] ??
                              forecast?.value ??
                              0;
                            const isInputEditable =
                              isEditable &&
                              isMonthEditable(duration, closedPeriod, planType);

                            return (
                              <td
                                key={`hours-${actualEmpIdx}-${uniqueKey}`}
                                className="tbody-td"
                              >
                                {/* <input
  type="text"
  inputMode="numeric"
  data-cell-key={`${actualEmpIdx}${uniqueKey}`}  // ADD THIS LINE
  className={`text-center border border-gray-300 bg-white text-xs w-[50px] h-[18px] p-[2px] ${
    !isInputEditable ? "cursor-not-allowed text-gray-400" : "text-gray-700"
  } ${
    findMatches.some((match) => match.empIdx === actualEmpIdx && match.uniqueKey === uniqueKey)
      ? "bg-yellow-200 border-yellow-500 border-2"
      : ""
  }`}
  value={value}
  onChange={(e) => handleInputChange(actualEmpIdx, uniqueKey, e.target.value.replace(/[^0-9.]/g, ""))}
  disabled={!isInputEditable}
  placeholder="0.00"
/> */}
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  className={`text-center border border-gray-300 bg-white text-xs w-[50px] h-[18px] p-[2px] ${
                                    !isInputEditable
                                      ? "cursor-not-allowed text-gray-400"
                                      : "text-gray-700"
                                  } ${
                                    findMatches.some(
                                      (match) =>
                                        match.empIdx === actualEmpIdx &&
                                        match.uniqueKey === uniqueKey
                                    )
                                      ? "bg-yellow-200 border-yellow-500 border-2"
                                      : ""
                                  }`}
                                  value={value}
                                  onChange={(e) =>
                                    handleInputChange(
                                      actualEmpIdx,
                                      uniqueKey,
                                      e.target.value.replace(/[^0-9.]/g, "")
                                    )
                                  }
                                  disabled={!isInputEditable}
                                  placeholder="0.00"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
                {/* <tfoot>
                  <tr
                    className="bg-gray-200 font-bold text-center"
                    style={{
                      position: "sticky",
                      bottom: 0,
                      zIndex: 20,
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      // height: "10px",
                      lineHeight: "normal",
                      borderTop: "2px solid #d1d5db", // tailwind gray-300
                    }}
                  >
                    {(() => {
                      const columnTotals = calculateColumnTotals();
                      return sortedDurations.map((duration) => {
                        const uniqueKey = `${duration.monthNo}_${duration.year}`;
                        const total = columnTotals[uniqueKey] || 0;

                        return (
                          <td
                            key={`total-${uniqueKey}`}
                            className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200"
                          >
                            {total.toFixed(2)}
                          </td>
                        );
                      });
                    })()}
                  </tr>
                </tfoot> */}
                <tfoot>
                  <tr
                    className="bg-gray-200 font-bold text-center"
                    style={{
                      position: "sticky",
                      bottom: 0,
                      zIndex: 20,
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      lineHeight: "normal",
                      borderTop: "2px solid #d1d5db",
                    }}
                  >
                    {/* CTD Column */}
                    {/* {normalizedFiscalYear !== "All"  && (
  // <td
  //   key="total-ctd"
  //   className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200"
  // >
  //   {(() => {
  //     const columnTotals = calculateColumnTotals();
  //     return columnTotals['ctd']?.toFixed(2) || '0.00';
  //   })()}
  // </td>
  <td key="total-ctd" className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200">
  {columnTotals['ctd']?.toFixed(2) || '0.00'}
</td>
)} */}
                    {shouldShowCTD() && (
                      <td
                        key="total-ctd"
                        className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200"
                      >
                        {columnTotals.ctd?.toFixed(2) || "0.00"}
                      </td>
                    )}

                    {/* Prior Year Column */}
                    {/* <td
      key="total-prior-year"
      className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200"
    >
      {(() => {
        const columnTotals = calculateColumnTotals();
        return columnTotals['priorYear']?.toFixed(2) || '0.00';
      })()}
    </td> */}
                    {/* {normalizedFiscalYear !== "All"  && (
  // <td
  //   key="total-prior-year"
  //   className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200"
  // >
  //   {(() => {
  //     const columnTotals = calculateColumnTotals();
  //     return columnTotals['priorYear']?.toFixed(2) || '0.00';
  //   })()}
  // </td>
  <td key="total-prior-year" className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200">
  {columnTotals['priorYear']?.toFixed(2) || '0.00'}
</td>
)} */}
                    {shouldShowPriorYear() && (
                      <td
                        key="total-prior-year"
                        className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200"
                      >
                        {columnTotals.priorYear?.toFixed(2) || "0.00"}
                      </td>
                    )}

                    {/* Existing month columns */}
                    {/* {sortedDurations.map((duration) => {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;
      const columnTotals = calculateColumnTotals();
      const total = columnTotals[uniqueKey] || 0;
      return (
        <td
          key={`total-${uniqueKey}`}
          className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200"
        >
          {total.toFixed(2)}
        </td>
      );
    })} */}
                    {sortedDurations.map((duration) => {
                      const uniqueKey = `${duration.monthNo}_${duration.year}`;
                      return (
                        <td
                          key={`total-${uniqueKey}`}
                          className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200"
                        >
                          {columnTotals[uniqueKey]?.toFixed(2) || "0.00"}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* {showFindReplace && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
            <h3 className="text-lg font-semibold mb-4">
              Find and Replace Hours
            </h3>
            <div className="mb-3">
              <label
                htmlFor="findValue"
                className="block text-gray-700 text-xs font-medium mb-1"
              >
                Find:
              </label>
              <input
                type="text"
                id="findValue"
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                placeholder="Value to find (e.g., 100 or empty)"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="replaceValue"
                className="block text-gray-700 text-xs font-medium mb-1"
              >
                Replace with:
              </label>
              <input
                type="text"
                id="replaceValue"
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={replaceValue}
                onChange={(e) =>
                  setReplaceValue(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="New value (e.g., 120 or empty)"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Scope:
              </label>
              <div className="flex gap-4 flex-wrap">
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="all"
                    checked={replaceScope === "all"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                  />
                  <span className="ml-2">All</span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="row"
                    checked={replaceScope === "row"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedRowIndex === null}
                  />
                  <span className="ml-2">
                    Selected Row (
                    {selectedRowIndex !== null
                      ? localEmployees[selectedRowIndex]?.emple.emplId
                      : "N/A"}
                    )
                  </span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="column"
                    checked={replaceScope === "column"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedColumnKey === null}
                  />
                  <span className="ml-2">
                    Selected Column (
                    {selectedColumnKey
                      ? sortedDurations.find(
                          (d) => `${d.monthNo}_${d.year}` === selectedColumnKey
                        )?.month
                      : "N/A"}
                    )
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFindReplace(false);
                  setSelectedRowIndex(null);
                  setSelectedColumnKey(null);
                  setReplaceScope("all");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFindReplace}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )} */}
      {showFindReplace && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
            <h3 className="text-lg font-semibold mb-4">
              {showFindOnly ? "Find Hours" : "Find and Replace Hours"}
            </h3>

            {/* Toggle Find/Replace Mode */}
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFindOnly(false);
                  setFindMatches([]);
                }}
                className={`px-3 py-1 rounded text-xs ${
                  !showFindOnly
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Find & Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFindOnly(true);
                  setFindMatches([]);
                }}
                className={`px-3 py-1 rounded text-xs ${
                  showFindOnly
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Find Only
              </button>
            </div>

            {/* Find Value Input */}
            <div className="mb-3">
              <label
                htmlFor="findValue"
                className="block text-gray-700 text-xs font-medium mb-1"
              >
                Find
              </label>
              <input
                type="text"
                id="findValue"
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                placeholder="Value to find (e.g., 100 or 0)"
              />
            </div>

            {/* Replace Value Input - Only show in Replace mode */}
            {!showFindOnly && (
              <div className="mb-4">
                <label
                  htmlFor="replaceValue"
                  className="block text-gray-700 text-xs font-medium mb-1"
                >
                  Replace with
                </label>
                <input
                  type="text"
                  id="replaceValue"
                  className="w-full border border-gray-300 rounded-md p-2 text-xs"
                  value={replaceValue}
                  onChange={(e) =>
                    setReplaceValue(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="New value (e.g., 120)"
                />
              </div>
            )}

            {/* Scope Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Scope
              </label>
              <div className="flex gap-4 flex-wrap">
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="all"
                    checked={replaceScope === "all"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                  />
                  <span className="ml-2">All</span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="row"
                    checked={replaceScope === "row"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedRowIndex === null}
                  />
                  <span className="ml-2">
                    Selected Row (
                    {selectedRowIndex !== null
                      ? localEmployees[selectedRowIndex]?.emple.emplId
                      : "NA"}
                    )
                  </span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="column"
                    checked={replaceScope === "column"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedColumnKey === null}
                  />
                  <span className="ml-2">
                    Selected Column (
                    {selectedColumnKey
                      ? sortedDurations.find(
                          (d) => `${d.monthNo}${d.year}` === selectedColumnKey
                        )?.month
                      : "NA"}
                    )
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFindReplace(false);
                  setSelectedRowIndex(null);
                  setSelectedColumnKey(null);
                  setReplaceScope("all");
                  setFindMatches([]);
                  setShowFindOnly(false);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
              >
                Cancel
              </button>
              {showFindOnly ? (
                <button
                  type="button"
                  onClick={handleFind}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                >
                  Find & Highlight
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFindReplace}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                >
                  Replace All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning Popup Modal */}
      {showWarningPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Warnings for Employee: {selectedEmployeeIdForWarning}
              </h3>
              <button
                onClick={() => setShowWarningPopup(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Warning Component */}
            <Warning
              planId={planId}
              projectId={projectId}
              planType={planType}
              emplId={selectedEmployeeIdForWarning}
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowWarningPopup(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Schedule Section */}
      {showEmployeeSchedule && (
        <div className="mt-6 border-t-2 border-gray-300 pt-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Employee Schedule
            </h2>
            <button
              onClick={() => setShowEmployeeSchedule(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ✕ Close
            </button>
          </div>
          <EmployeeSchedule
            planId={planId}
            projectId={projectId}
            status={status}
            planType={planType}
            startDate={startDate}
            endDate={endDate}
            fiscalYear={fiscalYear}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectHoursDetails;
