import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const EMPLOYEE_COLUMNS = [
  { key: "idType", label: "ID Type" },
  { key: "emplId", label: "ID" },
  { key: "name", label: "Name" },
  { key: "acctId", label: "Account" },
  { key: "acctName", label: "Account Name" }, // ADD THIS LINE
  { key: "orgId", label: "Organization" },
  { key: "isRev", label: "Rev" },
  { key: "isBrd", label: "Brd" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total" },
];

const ID_TYPE_OPTIONS = [
  { value: "", label: "Select ID Type" },
  { value: "Employee", label: "Employee" },
  { value: "Vendor", label: "Vendor" },
  { value: "Vendor Employee", label: "Vendor Employee" },
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

const ProjectAmountsTable = ({
  initialData,
  startDate,
  endDate,
  planType,
  fiscalYear: propFiscalYear,
  onSaveSuccess,
  refreshKey,
}) => {
  // Normalize fiscal year - add after component definition
  const normalizedFiscalYear =
    propFiscalYear === "All" || !propFiscalYear
      ? "All"
      : String(propFiscalYear).trim();

  const [employees, setEmployees] = useState([]);
  const [durations, setDurations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
    perHourRate: "",
    status: "Act",
  });
  const [newEntryPeriodAmounts, setNewEntryPeriodAmounts] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageText, setSuccessMessageText] = useState("");
  const [hiddenRows, setHiddenRows] = useState({});
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [nonLaborAccounts, setNonLaborAccounts] = useState([]);
  const [otherDirectCostNonLaborAccounts, setOtherDirectCostNonLaborAccounts] = useState([]);
  const [showFillValues, setShowFillValues] = useState(false);
  const [fillMethod, setFillMethod] = useState("None");
  const [sourceRowIndex, setSourceRowIndex] = useState(null);
  const [editedRowData, setEditedRowData] = useState({});
  const [idError, setIdError] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null); // dctId of selected employee
  const [localEmployees, setLocalEmployees] = useState([]);
  const [employeeNonLaborAccounts, setEmployeeNonLaborAccounts] = useState([]);
  const [subContractorNonLaborAccounts, setSubContractorNonLaborAccounts] =
    useState([]);
  const [accountOptionsWithNames, setAccountOptionsWithNames] = useState([]);
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [modifiedAmounts, setModifiedAmounts] = useState({});
  const [hasUnsavedAmountChanges, setHasUnsavedAmountChanges] = useState(false);

  // Add after existing state declarations around line 88
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [hasUnsavedFieldChanges, setHasUnsavedFieldChanges] = useState(false);

  // Copy-paste functionality states
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [hasClipboardData, setHasClipboardData] = useState(false);
  const [copiedRowsData, setCopiedRowsData] = useState([]);
  const [newEntries, setNewEntries] = useState([]);
  const [newEntryPeriodAmountsArray, setNewEntryPeriodAmountsArray] = useState(
    []
  );
  const [copiedMonthMetadata, setCopiedMonthMetadata] = useState([]);
  const [pastedEntrySuggestions, setPastedEntrySuggestions] = useState({});
  const [pastedEntryAccounts, setPastedEntryAccounts] = useState({});
  const [pastedEntryOrgs, setPastedEntryOrgs] = useState({});
  const isPastingRef = useRef(false);

  const [findMatches, setFindMatches] = useState([]);
  const [showFindOnly, setShowFindOnly] = useState(false);

  // Add these after pastedEntryOrgs state
  const [cachedProjectData, setCachedProjectData] = useState(null);
  const [cachedOrgData, setCachedOrgData] = useState(null);

  const isEditable = initialData.status === "In Progress";
  const planId = initialData.plId;
  const projectId = initialData.projId;
  const closedPeriod = initialData.closedPeriod;
  const isBudPlan =
    (planType && planType.toUpperCase() === "BUD") ||
    planType?.toUpperCase() === "NBBUD";
  const isFieldEditable =
    planType && ["BUD", "NBBUD", "EAC"].includes(planType.toUpperCase());
  // const isEAC = planType && planType.toUpperCase() === "EAC";
  // const shouldDisableDelete = isEAC || !isEditable;  // ADD THIS LINE
  const isEAC = planType && planType.toUpperCase() === "EAC";
  //  Add this new constant
  const shouldHideButtons =
    isEAC &&
    ["SUBMITTED", "APPROVED", "CONCLUDED"].includes(
      initialData.status?.toUpperCase()
    );
  const shouldDisableDelete =
    isEAC && initialData.status?.toUpperCase() === "IN PROGRESS";
  const firstTableRef = useRef(null);
  const secondTableRef = useRef(null);
  const scrollingLock = useRef(false);

  const [maxKbdSuffix, setMaxKbdSuffix] = useState(0);

  // Add after line 143, after normalizedFiscalYear declaration
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

    // Don't show Prior Year if selected year is the Start Date year
    if (selectedYear === startYear) return false;

    // Show Prior Year for ANY year after start year
    return selectedYear > startYear;
  };

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

  const getMonthAmounts = (emp) => {
    const monthAmounts = {};
    if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
      emp.emple.plForecasts.forEach((forecast) => {
        const uniqueKey = `${forecast.month}_${forecast.year}`;
        // Use actualhours for EAC, forecastedhours otherwise
        const value =
          planType === "EAC" && forecast.actualamt !== undefined
            ? forecast.actualamt
            : forecast.forecastedamt ?? 0;
        monthAmounts[uniqueKey] = { value, ...forecast };
      });
    }
    return monthAmounts;
  };

  const columnTotals = useMemo(() => {
    const totals = {};

    let ctdTotal = 0;
    let priorYearTotal = 0;

    const currentFiscalYear =
      normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;
    const startYear = startDate ? parseInt(startDate.split("-")[0]) : null;

    // Calculate CTD and Prior Year from ALL durations (use all, not filtered)
    if (currentFiscalYear && startYear) {
      durations.forEach((duration) => {
        let total = 0;
        const uniqueKey = `${duration.monthNo}_${duration.year}`;

        // Sum amounts from existing employees
        employees.forEach((emp, idx) => {
          if (hiddenRows[idx]) return;
          const inputValue = inputValues[`${idx}_${uniqueKey}`];
          const monthAmounts = getMonthAmounts(emp);
          const forecastValue = monthAmounts[uniqueKey]?.value;
          const value =
            inputValue !== undefined && inputValue !== ""
              ? inputValue
              : forecastValue;
          total += value && !isNaN(value) ? Number(value) : 0;
        });

        // Add amounts from new entry forms
        newEntries.forEach((entry, entryIndex) => {
          const newEntryValue =
            newEntryPeriodAmountsArray[entryIndex]?.[uniqueKey];
          total +=
            newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
        });

        // Prior Year: sum of (selected fiscal year - 1)
        if (duration.year === currentFiscalYear - 1) {
          priorYearTotal += total;
        }

        // CTD: sum from start year to (selected fiscal year - 2)
        if (
          duration.year >= startYear &&
          duration.year <= currentFiscalYear - 2
        ) {
          ctdTotal += total;
        }
      });
    }

    // Calculate monthly totals for visible columns (filtered by fiscal year)
    sortedDurations.forEach((duration) => {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;
      let total = 0;

      // Sum amounts from existing employees
      employees.forEach((emp, idx) => {
        if (hiddenRows[idx]) return;
        const inputValue = inputValues[`${idx}_${uniqueKey}`];
        const monthAmounts = getMonthAmounts(emp);
        const forecastValue = monthAmounts[uniqueKey]?.value;
        const value =
          inputValue !== undefined && inputValue !== ""
            ? inputValue
            : forecastValue;
        total += value && !isNaN(value) ? Number(value) : 0;
      });

      // Add amounts from new entry forms
      newEntries.forEach((entry, entryIndex) => {
        const newEntryValue =
          newEntryPeriodAmountsArray[entryIndex]?.[uniqueKey];
        total +=
          newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
      });

      totals[uniqueKey] = total;
    });

    totals["ctd"] = ctdTotal;
    totals["priorYear"] = priorYearTotal;

    return totals;
  }, [
    durations,
    employees,
    inputValues,
    hiddenRows,
    newEntries,
    newEntryPeriodAmountsArray,
    sortedDurations,
    normalizedFiscalYear,
    startDate,
  ]);

  useEffect(() => {
    const existingKbdIds =
      employees
        ?.map((emp) => emp.emple?.emplId)
        .filter((id) => id && id.startsWith("KBD")) || [];

    const suffixes = existingKbdIds.map((id) => {
      const match = id.match(/^KBD(\d{3})$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxSuffix = suffixes.length ? Math.max(...suffixes) : 0;
    setMaxKbdSuffix(maxSuffix);
  }, [employees]);

  // useEffect(() => {
  //   if (newEntry.idType === "Other") {
  //     // Only generate if id is empty or invalid
  //     if (
  //       !newEntry.id ||
  //       newEntry.id === "" ||
  //       /^KBD\d{3}$/.test(newEntry.id) === false
  //     ) {
  //       const newId = "KBD" + String(maxKbdSuffix + 1).padStart(3, "0");
  //       setNewEntry((prev) => ({
  //         ...prev,
  //         id: newId,
  //       }));
  //       setMaxKbdSuffix((prev) => prev + 1); // increment so next time increments further too
  //     }
  //   }
  // }, [newEntry.idType, maxKbdSuffix]);

  // Reset form state when project or plan changes

  useEffect(() => {
    setCachedProjectData(null);
    setCachedOrgData(null);
  }, [projectId, planType]);

  useEffect(() => {
    if (newEntry.idType === "Other") {
      // Only generate if id is empty or invalid
      if (
        !newEntry.id ||
        newEntry.id === "" ||
        /^KBD\d{3}$/.test(newEntry.id) === false
      ) {
        const newId = "KBD" + String(maxKbdSuffix + 1).padStart(3, "0");
        setNewEntry((prev) => ({
          ...prev,
          id: newId,
          status: "ACT", // Force status to "ACT" for Other type
        }));
        setMaxKbdSuffix((prev) => prev + 1);
      } else {
        // If ID already exists, just set status to "ACT"
        setNewEntry((prev) => ({
          ...prev,
          status: "ACT",
        }));
      }
    }
  }, [newEntry.idType, maxKbdSuffix]);

  useEffect(() => {
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
      perHourRate: "",
      status: "Act",
    });
    setNewEntryPeriodAmounts({});
    setEmployeeSuggestions([]);
    setEmployeeNonLaborAccounts([]);
    setSubContractorNonLaborAccounts([]);
  }, [planId, projectId]); // Reset when planId or projectId changes

  // Add this useEffect to initialize account names on component mount
  // useEffect(() => {
  //   const initializeAccountNames = async () => {
  //     if (!projectId || !planType) return;

  //     try {
  //       const response = await axios.get(
  //         `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`
  //       );
  //       const data = Array.isArray(response.data)
  //         ? response.data[0]
  //         : response.data;

  //       // Collect ALL account types with names for existing employees
  //       let allAccountsWithNames = [];

  //       if (
  //         data.employeeNonLaborAccounts &&
  //         Array.isArray(data.employeeNonLaborAccounts)
  //       ) {
  //         const employeeAccountsWithNames = data.employeeNonLaborAccounts.map(
  //           (account) => ({
  //             id: account.accountId || account,
  //             name: account.acctName || account.accountId || String(account),
  //           })
  //         );
  //         allAccountsWithNames.push(...employeeAccountsWithNames);
  //       }

  //       if (
  //         data.subContractorNonLaborAccounts &&
  //         Array.isArray(data.subContractorNonLaborAccounts)
  //       ) {
  //         const subAccountsWithNames = data.subContractorNonLaborAccounts.map(
  //           (account) => ({
  //             id: account.accountId || account,
  //             name: account.acctName || account.accountId || String(account),
  //           })
  //         );
  //         allAccountsWithNames.push(...subAccountsWithNames);
  //       }

  //       // Remove duplicates
  //       const uniqueAccountsWithNamesMap = new Map();
  //       allAccountsWithNames.forEach((acc) => {
  //         if (acc.id && !uniqueAccountsWithNamesMap.has(acc.id)) {
  //           uniqueAccountsWithNamesMap.set(acc.id, {
  //             id: acc.id,
  //             name: acc.name,
  //           });
  //         }
  //       });
  //       const uniqueAccountsWithNames = Array.from(
  //         uniqueAccountsWithNamesMap.values()
  //       );

  //       setAccountOptionsWithNames(uniqueAccountsWithNames);
  //     } catch (err) {
  //       console.error("Failed to initialize account names:", err);
  //       setAccountOptionsWithNames([]);
  //     }
  //   };

  //   initializeAccountNames();
  // }, [projectId, planType]);
  useEffect(() => {
  const initializeAccountNames = async () => {
    if (!projectId || !planType) return;

    try {
      const response = await axios.get(
        `${backendUrl}Project/GetAllProjectByProjId/${projectId}/${planType}`
      );
      const data = Array.isArray(response.data) ? response.data[0] : response.data;

      let allAccountsWithNames = [];

      // Employee Accounts
      if (data.employeeNonLaborAccounts && Array.isArray(data.employeeNonLaborAccounts)) {
        const employeeAccountsWithNames = data.employeeNonLaborAccounts.map((account) => ({
          id: account.accountId || account,
          name: account.acctName || account.accountId || String(account),
        }));
        allAccountsWithNames.push(...employeeAccountsWithNames);
      }

      // SubContractor Accounts
      if (data.subContractorNonLaborAccounts && Array.isArray(data.subContractorNonLaborAccounts)) {
        const subAccountsWithNames = data.subContractorNonLaborAccounts.map((account) => ({
          id: account.accountId || account,
          name: account.acctName || account.accountId || String(account),
        }));
        allAccountsWithNames.push(...subAccountsWithNames);
      }

      // ✅ Other Direct Cost Accounts - MAKE SURE THIS IS HERE
      if (data.otherDirectCostNonLaborAccounts && Array.isArray(data.otherDirectCostNonLaborAccounts)) {
        const otherAccountsWithNames = data.otherDirectCostNonLaborAccounts.map((account) => ({
          id: account.accountId || account,
          name: account.acctName || account.accountId || String(account),
        }));
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

      const uniqueAccountsWithNames = Array.from(uniqueAccountsWithNamesMap.values());
      setAccountOptionsWithNames(uniqueAccountsWithNames);
    } catch (err) {
      console.error("Failed to initialize account names", err);
      setAccountOptionsWithNames([]);
    }
  };

  initializeAccountNames();
}, [projectId, planType]);


  const syncScroll = (sourceRef, targetRef) => {
    if (!sourceRef.current || !targetRef.current) return;
    // Only sync if not already in an update
    if (!scrollingLock.current) {
      scrollingLock.current = true;
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
      // Allow event on next tick
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
  // Vertical sync only
  // useEffect(() => {
  //   const container = verticalScrollRef.current;
  //   const firstScroll = vfirstTableRef.current;
  //   const lastScroll = vlastTableRef.current;

  //   if (!container || !firstScroll || !lastScroll) return;

  //   const onScroll = () => {
  //     const scrollTop = container.scrollTop;
  //     firstScroll.scrollTop = scrollTop;
  //     lastScroll.scrollTop = scrollTop;
  //   };

  //   container.addEventListener("scroll", onScroll);
  //   return () => container.removeEventListener("scroll", onScroll);
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate || !planId) {
        setDurations([]);
        setEmployees([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const durationResponse = await axios.get(
          `${backendUrl}/Orgnization/GetWorkingDaysForDuration/${startDate}/${endDate}`
        );
        if (!Array.isArray(durationResponse.data)) {
          throw new Error("Invalid duration response format");
        }
        const fetchedDurations = durationResponse.data;
        setDurations(fetchedDurations);

        const response = await axios.get(
          `${backendUrl}/Project/GetDirectCostForecastDataByPlanId/${planId}`
        );
        const apiData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        if (apiData.length === 0) {
          setEmployees([]);
          toast.info("No forecast data available for this plan.", {
            toastId: "no-forecast-data",
            autoClose: 3000,
          });
        } else {
          const updatedEmployees = apiData.map((item, idx) => ({
            emple: {
              empleId: item.empl?.id || `auto-${idx}`,
              emplId: item.empl?.id || "",
              firstName: item.empl?.firstName || "",
              lastName: item.empl?.lastName || "",
              accId: item.empl?.acctId || "",
              orgId: item.empl?.orgId || "",
              perHourRate: item.empl?.hrRate || "",
              isRev: item.empl?.isRev || false,
              isBrd: item.empl?.isBrd || false,
              status: item.empl?.status || "Act",
              type: item.empl?.type || "",
              category: item.empl?.category || "",
              dctId: item.dctId || 0,
              plId: item.pl_ID || 0,
              plForecasts: item.empl?.plForecasts || [],
            },
          }));
          setEmployees(updatedEmployees);
        }
        setInputValues({});
        setNewEntryPeriodAmounts({});
      } catch (err) {
        setError("Failed to load data. Please try again.");
        if (err.response && err.response.status === 500) {
          setEmployees([]);
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

    fetchData();
  }, [startDate, endDate, planId, refreshKey]); // Added propFiscalYear for refetch on fiscal year change

  useEffect(() => {
    const loadOrganizationOptions = async () => {
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
    if (showNewForm || isEditable) {
      loadOrganizationOptions();
    }
  }, [showNewForm, isEditable]);

  useEffect(() => {
    const formOpen = showNewForm || isEditable;
    const fetchEmployees = async () => {
      if (!projectId || !formOpen) {
        // console.warn("projectId is undefined, skipping employee fetch");
        setEmployeeSuggestions([]);
        return;
      }
      if (!showNewForm) {
        // console.log("New entry form is not open, skipping employee fetch");
        setEmployeeSuggestions([]);
        return;
      }
      // console.log(`Fetching employees for projectId: ${projectId}`);
      try {
        const endpoint =
          newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee"
            ? `${backendUrl}/Project/GetVenderEmployeesByProject/${projectId}`
            : `${backendUrl}/Project/GetEmployeesByProject/${projectId}`;
        const response = await axios.get(endpoint);
        // console.log("Employee suggestions response:", response.data);
        const suggestions = Array.isArray(response.data)
          ? response.data.map((emp) => {
              if (newEntry.idType === "Vendor") {
                return {
                  emplId: emp.vendId,
                  firstName: "",
                  lastName: emp.employeeName || "",
                };
              } else if (newEntry.idType === "Vendor Employee") {
                return {
                  emplId: emp.empId,
                  firstName: "",
                  lastName: emp.employeeName || "",
                };
              } else {
                const [lastName, firstName] = (emp.employeeName || "")
                  .split(", ")
                  .map((str) => str.trim());
                return {
                  emplId: emp.empId,
                  firstName: firstName || "",
                  lastName: lastName || "",
                  orgId: emp.orgId,
                  acctId: emp.acctId,
                };
              }
            })
          : [];
        setEmployeeSuggestions(suggestions);
        // console.log("Updated employeeSuggestions:", suggestions);
      } catch (err) {
        // console.error("Error fetching employees:", err);
        setEmployeeSuggestions([]);
        toast.error(
          `Failed to fetch ${
            newEntry.idType === "Vendor" ||
            newEntry.idType === "Vendor Employee"
              ? "vendor "
              : ""
          }employee suggestions${
            projectId
              ? " for project ID " + projectId
              : ". Project ID is missing."
          }`,
          {
            toastId: "employee-fetch-error",
            autoClose: 3000,
          }
        );
      }
    };

    // const fetchNonLaborAccounts = async () => {
    //   if (!projectId) {
    //     console.warn(
    //       "projectId is undefined, skipping non-labor accounts fetch"
    //     );
    //     setNonLaborAccounts([]);
    //     return;
    //   }
    //   if (!showNewForm) {
    //     console.log(
    //       "New entry form is not open, skipping non-labor accounts fetch"
    //     );
    //     setNonLaborAccounts([]);
    //     return;
    //   }
    //   console.log(`Fetching non-labor accounts for projectId: ${projectId}`);
    //   try {
    //     const response = await axios.get(
    //       `${backendUrl}/Project/GetAllProjectByProjId/${projectId}`
    //     );
    //     console.log("Non-labor accounts response:", response.data);
    //     const data = Array.isArray(response.data)
    //       ? response.data[0]
    //       : response.data;
    //     const accounts = Array.isArray(data.nonLaborAccounts)
    //       ? data.nonLaborAccounts.map((account) => ({ id: account }))
    //       : [];
    //     setNonLaborAccounts(accounts);
    //     console.log("Updated nonLaborAccounts:", accounts);
    //   } catch (err) {
    //     console.error("Error fetching non-labor accounts:", err);
    //     setNonLaborAccounts([]);
    //     toast.error(
    //       `Failed to fetch non-labor accounts${
    //         projectId
    //           ? " for project ID " + projectId
    //           : ". Project ID is missing."
    //       }`,
    //       {
    //         toastId: "non-labor-accounts-error",
    //         autoClose: 3000,
    //       }
    //     );
    //   }
    // };
    const fetchNonLaborAccounts = async () => {
      if (!projectId || !formOpen) {
        setEmployeeNonLaborAccounts([]);
        setSubContractorNonLaborAccounts([]);
        return;
      }

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

        // -------------------------
        // Employee Non-Labor Accounts
        // -------------------------
        let employeeAccounts = Array.isArray(data.employeeNonLaborAccounts)
          ? data.employeeNonLaborAccounts.map((account) => ({
              id: account.accountId || account, // handle both object/string
              name: account.acctName || account.accountId || String(account),
            }))
          : [];

        // Deduplicate employee accounts
        const uniqueEmployeeMap = new Map();
        employeeAccounts.forEach((acc) => {
          if (acc.id && !uniqueEmployeeMap.has(acc.id)) {
            uniqueEmployeeMap.set(acc.id, acc);
          }
        });
        const uniqueEmployeeAccounts = Array.from(uniqueEmployeeMap.values());
        setEmployeeNonLaborAccounts(uniqueEmployeeAccounts);

        // -------------------------
        // SubContractor Non-Labor Accounts
        // -------------------------
        let subAccounts = Array.isArray(data.subContractorNonLaborAccounts)
          ? data.subContractorNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            }))
          : [];

        // Deduplicate subcontractor accounts
        const uniqueSubMap = new Map();
        subAccounts.forEach((acc) => {
          if (acc.id && !uniqueSubMap.has(acc.id)) {
            uniqueSubMap.set(acc.id, acc);
          }
        });
        const uniqueSubAccounts = Array.from(uniqueSubMap.values());
        setSubContractorNonLaborAccounts(uniqueSubAccounts);

        // Other Direct Cost Non-Labor Accounts
    let otherAccounts = Array.isArray(data.otherDirectCostNonLaborAccounts)
      ? data.otherDirectCostNonLaborAccounts.map((account) => ({
          id: account.accountId || account,
          name: account.acctName || account.accountId || String(account),
        }))
      : [];
    
    const uniqueOtherMap = new Map();
    otherAccounts.forEach((acc) => {
      if (acc.id && !uniqueOtherMap.has(acc.id)) {
        uniqueOtherMap.set(acc.id, acc);
      }
    });
    const uniqueOtherAccounts = Array.from(uniqueOtherMap.values());
    setOtherDirectCostNonLaborAccounts(uniqueOtherAccounts);

        let allAccountsWithNames = [
          ...uniqueEmployeeAccounts,
          ...uniqueSubAccounts,
          ...uniqueOtherAccounts, 
        ];
        setAccountOptionsWithNames(allAccountsWithNames);
      } catch (err) {
        // console.error("Error fetching non-labor accounts:", err);
        setEmployeeNonLaborAccounts([]);
        setSubContractorNonLaborAccounts([]);
        if (planType?.toUpperCase() !== "NBBUD") {
          toast.error("Failed to fetch non-labor accounts", {
            toastId: "non-labor-accounts-error",
            autoClose: 3000,
          });
        }
      }
    };

    if (formOpen) {
      fetchEmployees();
      fetchNonLaborAccounts();
    } else {
      setEmployeeNonLaborAccounts([]); // ✅ correct reset
      setSubContractorNonLaborAccounts([]);
      setEmployeeSuggestions([]);
      // setOrganizationOptions([]);
    }
  }, [projectId, showNewForm, newEntry.idType, isEditable]);

  // CORRECTED: Add keyboard listener for paste - MUST be unconditional
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        // Only handle if conditions are met
        if (hasClipboardData && copiedRowsData.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          handlePasteMultipleRows();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    hasClipboardData,
    copiedRowsData,
    propFiscalYear,
    durations,
    showNewForm,
    projectId,
    planType,
  ]); // Add all dependencies

  // const handleIdChange = (value) => {
    
  //   const isDuplicateId = employees.some((emp) => {
  //     const empl = emp.emple;
  //     if (!empl) return false;
  //     return (
  //       empl.emplId === value &&
  //       empl.accId === newEntry.acctId &&
  //       empl.plcGlcCode === newEntry.plcGlcCode
  //     );
  //   });
  //   //   if (isDuplicateId) {
  //   //     toast.error("ID is already present in table so can't save.", {
  //   //       toastId: "duplicate-id-error",
  //   //       autoClose: 3000,
  //   //     });
  //   //     // Still update the input but show the error
  //   //     setNewEntry((prev) => ({
  //   //       ...prev,
  //   //       id: value,
  //   //       firstName: "",
  //   //       lastName: "",
  //   //       acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
  //   //       orgId: "",
  //   //     }));
  //   //     return; // Exit early to prevent other validations
  //   //   }
  //   // }
  //   if (isDuplicateId) {
  //     toast.error(
  //       "ID with the same Account and PLC is already present, so can't save.",
  //       {
  //         toastId: "duplicate-id-error",
  //         autoClose: 3000,
  //       }
  //     );
  //     setNewEntry((prev) => ({
  //       ...prev,
  //       id: value,
  //       firstName: "",
  //       lastName: "",
  //       acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
  //       orgId: "",
  //     }));
  //     return; // Exit early to prevent other validations
  //   }

  //   // **SECOND CHECK: Invalid Employee ID validation (only if not duplicate)**
  //   // if (newEntry.idType !== "Other" && value.length >= 3) {
  //   // Check if any employee ID starts with typed value
  //   const partialMatch = employeeSuggestions.some((emp) =>
  //     emp.emplId.startsWith(value)
  //   );

  //   if (!partialMatch) {
  //     toast.error("Invalid Employee ID, please select a valid one!", {
  //       toastId: "invalid-employee-id",
  //       autoClose: 3000,
  //     });
  //     // Still update the input but show the error
  //     setNewEntry((prev) => ({
  //       ...prev,
  //       id: value,
  //       firstName: "",
  //       lastName: "",
  //       acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
  //       orgId: "",
  //     }));
  //     return; // Exit early
  //   }

  //   // **NORMAL PROCESSING: If no errors, proceed with employee selection**
  //   const selectedEmployee = employeeSuggestions.find(
  //     (emp) => emp.emplId === value
  //   );
  //   // console.log("Selected employee:", selectedEmployee);

  //   setNewEntry((prev) => ({
  //     ...prev,
  //     id: value,
  //     firstName: selectedEmployee ? selectedEmployee.firstName || "" : "",
  //     lastName: selectedEmployee ? selectedEmployee.lastName || "" : "",
  //     acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
  //     orgId: selectedEmployee?.orgId ? String(selectedEmployee.orgId) : "",
  //   }));
  //   // console.log("Selected employee orgId:", selectedEmployee?.orgId);
  // };
  

  const handleIdChange = (value) => {
    // 1. Remove Emojis immediately from the input
    const rawValue = value.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    );

    // 2. Create a trimmed version for lookups/validation
    const trimmedValue = rawValue.trim();

    // --- FIX: Bypass validation if ID Type is "Other" ---
    if (newEntry.idType === "Other") {
      setNewEntry((prev) => ({
        ...prev,
        id: rawValue, // Use the sanitized rawValue (spaces allowed, emojis removed)
        firstName: "", // Reset names or keep logic to parse them later
        lastName: "",
        // Keep existing account if selected, otherwise default
        acctId:
          prev.acctId ||
          (nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : ""),
        orgId: "",
      }));
      return; // Stop here, do not run duplicate/employee checks
    }

    // --- EXISTING LOGIC FOR EMPLOYEE / VENDOR ---

    // 1. Check for duplicate ID
    const isDuplicateId = employees.some((emp) => {
      const emple = emp.emple;
      if (!emple) return false;
      return (
        emple.emplId === trimmedValue && // Use trimmed for comparison
        emple.accId === newEntry.acctId &&
        emple.plcGlcCode === newEntry.plcGlcCode
      );
    });

    if (isDuplicateId) {
      toast.error(
        "ID with the same Account and PLC is already present, so can't save.",
        {
          toastId: "duplicate-id-error",
          autoClose: 3000,
        }
      );
      // Update input to show what user typed (sanitized), but don't proceed with selection
      setNewEntry((prev) => ({
        ...prev,
        id: rawValue,
        firstName: "",
        lastName: "",
        acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
        orgId: "",
      }));
      return;
    }

    // 2. Check against Suggestions (Validation)
    // Only run this check if the user has typed something
    if (trimmedValue.length > 0) {
      const partialMatch = employeeSuggestions.some((emp) =>
        emp.emplId.startsWith(trimmedValue)
      );

      if (!partialMatch) {
        toast.error("Invalid Employee ID, please select a valid one!", {
          toastId: "invalid-employee-id",
          autoClose: 3000,
        });

        setNewEntry((prev) => ({
          ...prev,
          id: rawValue, // Allow typing to continue (sanitized)
          firstName: "",
          lastName: "",
          acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
          orgId: "",
        }));
        return;
      }
    }

    // 3. Valid Input - Try to find exact match
    const selectedEmployee = employeeSuggestions.find(
      (emp) => emp.emplId === trimmedValue
    );

    setNewEntry((prev) => ({
      ...prev,
      id: rawValue, // Keep spaces in the input field
      firstName: selectedEmployee ? selectedEmployee.firstName || "" : "",
      lastName: selectedEmployee ? selectedEmployee.lastName || "" : "",
      acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
      orgId: selectedEmployee?.orgId ? String(selectedEmployee.orgId) : "",
    }));
  };


  // const handleIdChange = (value) => {
  //   // 1. Keep raw value for the UI (allows typing spaces)
  //   const rawValue = value;
  //   // 2. Create a trimmed version for lookups/validation
  //   const trimmedValue = value.trim();

  //   // --- FIX: Bypass validation if ID Type is "Other" ---
  //   if (newEntry.idType === "Other") {
  //     setNewEntry((prev) => ({
  //       ...prev,
  //       id: rawValue, // Allow spaces
  //       firstName: "", // Reset names or keep logic to parse them later
  //       lastName: "",
  //       // Keep existing account if selected, otherwise default
  //       acctId: prev.acctId || (nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : ""),
  //       orgId: "",
  //     }));
  //     return; // Stop here, do not run duplicate/employee checks
  //   }

  //   // --- EXISTING LOGIC FOR EMPLOYEE / VENDOR ---

  //   // 1. Check for duplicate ID
  //   const isDuplicateId = employees.some((emp) => {
  //     const empl = emp.emple;
  //     if (!empl) return false;
  //     return (
  //       empl.emplId === trimmedValue && // Use trimmed for comparison
  //       empl.accId === newEntry.acctId &&
  //       empl.plcGlcCode === newEntry.plcGlcCode
  //     );
  //   });

  //   if (isDuplicateId) {
  //     toast.error(
  //       "ID with the same Account and PLC is already present, so can't save.",
  //       {
  //         toastId: "duplicate-id-error",
  //         autoClose: 3000,
  //       }
  //     );
  //     // Update input to show what user typed, but don't proceed with selection
  //     setNewEntry((prev) => ({
  //       ...prev,
  //       id: rawValue, 
  //       firstName: "",
  //       lastName: "",
  //       acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
  //       orgId: "",
  //     }));
  //     return; 
  //   }

  //   // 2. Check against Suggestions (Validation)
  //   // Only run this check if the user has typed something
  //   if (trimmedValue.length > 0) {
  //     const partialMatch = employeeSuggestions.some((emp) =>
  //       emp.emplId.startsWith(trimmedValue)
  //     );

  //     if (!partialMatch) {
  //       toast.error("Invalid Employee ID, please select a valid one!", {
  //         toastId: "invalid-employee-id",
  //         autoClose: 3000,
  //       });
        
  //       setNewEntry((prev) => ({
  //         ...prev,
  //         id: rawValue, // Allow typing to continue
  //         firstName: "",
  //         lastName: "",
  //         acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
  //         orgId: "",
  //       }));
  //       return; 
  //     }
  //   }

  //   // 3. Valid Input - Try to find exact match
  //   const selectedEmployee = employeeSuggestions.find(
  //     (emp) => emp.emplId === trimmedValue
  //   );

  //   setNewEntry((prev) => ({
  //     ...prev,
  //     id: rawValue, // Keep spaces in the input field
  //     firstName: selectedEmployee ? selectedEmployee.firstName || "" : "",
  //     lastName: selectedEmployee ? selectedEmployee.lastName || "" : "",
  //     acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
  //     orgId: selectedEmployee?.orgId ? String(selectedEmployee.orgId) : "",
  //   }));
  // };

  const handleRowFieldChange = (rowIdx, field, value) => {
    if (!isFieldEditable || !isEditable) return;
    setEditedRowData((prev) => ({
      ...prev,
      [rowIdx]: {
        ...prev[rowIdx],
        [field]: value,
      },
    }));
  };

 


//   const handleRowFieldBlur = async (rowIdx, emp) => {
//     if (!isFieldEditable || !isEditable) return;
//     if (!emp || !emp.emple) {
//       toast.error("Employee data is missing for update.");
//       return;
//     }

//     const edited = editedRowData[rowIdx] || {};
//     if (
//       edited.acctId === undefined &&
//       edited.orgId === undefined &&
//       edited.isRev === undefined &&
//       edited.isBrd === undefined
//     )
//       return;

//     const payload = {
//       dctId: emp.emple.dctId || 0,
//       plId: emp.emple.plId || 0,
//       accId: edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
//       orgId: edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
//       type: emp.emple.type || "",
//       category: emp.emple.category || "",
//       amountType: emp.emple.amountType || "",
//       id: emp.emple.emplId || "",
//       isRev: edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
//       isBrd: edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
//       createdBy: emp.emple.createdBy || "System",
//       lastModifiedBy: "System",
//     };

//     // ✅ Add validation BEFORE saving
//    const validAccounts = 
//   emp.emple.type === 'Vendor' || emp.emple.type === 'Vendor Employee'
//     ? subContractorNonLaborAccounts.map(a => a.id || a.accountId)
//     : emp.emple.type === 'Other'
//     ? otherDirectCostNonLaborAccounts.map(a => a.id || a.accountId)
//     : employeeNonLaborAccounts.map(a => a.id || a.accountId);

// if (payload.accId && !validAccounts.includes(payload.accId)) {
//   toast.error("Please select a valid account from suggestions");
//   return; // stop here, don't call API or show success
// }
//     // ✅ Validate orgId against organizationOptions
//     const validOrgs = organizationOptions.map((org) => org.value);
//     if (payload.orgId && !validOrgs.includes(payload.orgId)) {
//       toast.error("Please select a valid organization from suggestions");
//       return; // 🚫 block update
//     }

//     try {
//       await axios.put(
//         `${backendUrl}/DirectCost/UpdateDirectCost`,
//         { ...payload, acctId: payload.accId },
//         { headers: { "Content-Type": "application/json" } }
//       );
//       setEditedRowData((prev) => {
//         const newData = { ...prev };
//         delete newData[rowIdx];
//         return newData;
//       });
//       setEmployees((prev) => {
//         const updated = [...prev];
//         updated[rowIdx] = {
//           ...updated[rowIdx],
//           emple: {
//             ...updated[rowIdx].emple,
//             ...payload,
//           },
//         };
//         return updated;
//       });
//       toast.success("Employee updated successfully!", {
//         toastId: `employee-update-${rowIdx}`,
//         autoClose: 2000,
//       });
//     } catch (err) {
//       toast.error(
//         "Failed to update row: " + (err.response?.data?.message || err.message)
//       );
//     }
//   };
  
  const handleRowFieldBlur = async (rowIdx, emp) => {
  if (!isFieldEditable || !isEditable) return;
  if (!emp || !emp.emple) {
    toast.error("Employee data is missing for update.");
    return;
  }

  const edited = editedRowData[rowIdx];
  if (edited.acctId === undefined && edited.orgId === undefined && edited.isRev === undefined && edited.isBrd === undefined) {
    return;
  }

  const payload = {
    dctId: emp.emple.dctId || 0,
    plId: emp.emple.plId || 0,
    accId: edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
    orgId: edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
    type: emp.emple.type || '',
    category: emp.emple.category || '',
    amountType: emp.emple.amountType || '',
    id: emp.emple.emplId || '',
    isRev: edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
    isBrd: edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
    createdBy: emp.emple.createdBy || 'System',
    lastModifiedBy: 'System',
  };

  // ✅ FIXED VALIDATION - Only validate if account was changed
  if (edited.acctId !== undefined) {
    const validAccounts = 
      emp.emple.type === 'Vendor' || emp.emple.type === 'Vendor Employee'
        ? subContractorNonLaborAccounts.map(a => a.id || a.accountId)
        : emp.emple.type === 'Other'
        ? otherDirectCostNonLaborAccounts.map(a => a.id || a.accountId)
        : employeeNonLaborAccounts.map(a => a.id || a.accountId);
    
    if (payload.accId && !validAccounts.includes(payload.accId)) {
      toast.error("Please select a valid account from suggestions");
      return; // stop here, don't call API or show success
    }
  }

  // Validate orgId against organizationOptions - Only if changed
  if (edited.orgId !== undefined) {
    const validOrgs = organizationOptions.map(org => org.value);
    if (payload.orgId && !validOrgs.includes(payload.orgId)) {
      toast.error("Please select a valid organization from suggestions");
      return; // block update
    }
  }

  try {
    await axios.put(`${backendUrl}DirectCost/UpdateDirectCost`, {
      ...payload,
      acctId: payload.accId,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    setEditedRowData(prev => {
      const newData = { ...prev };
      delete newData[rowIdx];
      return newData;
    });

    setEmployees(prev => {
      const updated = [...prev];
      updated[rowIdx] = {
        ...updated[rowIdx],
        emple: {
          ...updated[rowIdx].emple,
          ...payload,
        },
      };
      return updated;
    });

    toast.success("Employee updated successfully!", {
      toastId: `employee-update-${rowIdx}`,
      autoClose: 2000,
    });
  } catch (err) {
    toast.error(`Failed to update row: ${err.response?.data?.message || err.message}`);
  }
};

  const getEmployeeRow = (emp, idx) => {
    const monthAmounts = getMonthAmounts(emp);
    const totalAmount = sortedDurations.reduce((sum, duration) => {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;
      const inputValue = inputValues[`${idx}_${uniqueKey}`];
      const forecastValue = monthAmounts[uniqueKey]?.value;
      const value =
        inputValue !== undefined && inputValue !== ""
          ? inputValue
          : forecastValue;
      return sum + (value && !isNaN(value) ? Number(value) : 0);
    }, 0);

    return {
      idType: emp.emple.type || "-",
      emplId: emp.emple.emplId || "-",
      name:
        emp.emple.category || emp.emple.firstName || emp.emple.lastName
          ? emp.emple.category ||
            `${emp.emple.lastName || ""}${
              emp.emple.firstName && emp.emple.lastName ? ", " : ""
            }${emp.emple.firstName || ""}`
          : "-",
      acctId: emp.emple.accId || "-",
      acctName: (() => {
        const accountId = emp.emple.accId || "-";
        const accountWithName = accountOptionsWithNames.find(
          (acc) => acc.id === accountId
        );
        return accountWithName ? accountWithName.name : "-";
      })(), // ADD THIS FIELD
      orgId: emp.emple.orgId || "-",
      isRev: emp.emple.isRev ? (
        <span className="text-green-600 font-sm text-xl">✓</span>
      ) : (
        "-"
      ),
      isBrd: emp.emple.isBrd ? (
        <span className="text-green-600 font-sm text-xl">✓</span>
      ) : (
        "-"
      ),
      status: emp.emple.status || "-",
      total: totalAmount.toFixed(2) || "-",
    };
  };

  // const getMonthAmounts = (emp) => {
  //   const monthAmounts = {};
  //   if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
  //     emp.emple.plForecasts.forEach((forecast) => {
  //       const uniqueKey = `${forecast.month}_${forecast.year}`;
  //       // Use actualhours for EAC, forecastedhours otherwise
  //       const value =
  //         planType === "EAC" && forecast.actualamt !== undefined
  //           ? forecast.actualamt
  //           : forecast.forecastedamt ?? 0;
  //       monthAmounts[uniqueKey] = { value, ...forecast };
  //     });
  //   }
  //   return monthAmounts;
  // };

  const handleInputChange = (empIdx, uniqueKey, newValue) => {
    if (!isEditable) return;

    const currentDuration = sortedDurations.find(
      (d) => `${d.monthNo}_${d.year}` === uniqueKey
    );

    if (!isMonthEditable(currentDuration, closedPeriod, planType)) {
      toast.warn("Cannot edit amounts for a closed period.", {
        toastId: "closed-period-warning",
        autoClose: 3000,
      });
      return;
    }

    if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
      console.log(`Updating inputValues for ${empIdx}_${uniqueKey}:`, newValue);
      setInputValues((prev) => ({
        ...prev,
        [`${empIdx}_${uniqueKey}`]: newValue,
      }));

      // Track modified amounts for save functionality
      setModifiedAmounts((prev) => ({
        ...prev,
        [`${empIdx}_${uniqueKey}`]: {
          empIdx,
          uniqueKey,
          newValue,
          employee: employees[empIdx],
        },
      }));

      setHasUnsavedAmountChanges(true);
    }
  };

  const handleSaveAllAmounts = async () => {
    if (Object.keys(modifiedAmounts).length === 0) {
      toast.info("No changes to save.", { autoClose: 2000 });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Prepare bulk payload array - DO NOT use individual updates
      const bulkPayload = [];

      for (const key in modifiedAmounts) {
        const { empIdx, uniqueKey, newValue, employee } = modifiedAmounts[key];

        const newNumericValue = newValue === "" ? 0 : Number(newValue);
        const emp = employee;
        const monthAmounts = getMonthAmounts(emp);
        const forecast = monthAmounts[uniqueKey];

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

        // Create payload matching EXACT bulk API structure
        const payload = {
          forecastedamt:
            planType === "EAC"
              ? forecast?.forecastedamt ?? 0
              : Number(newNumericValue) || 0,
          actualamt:
            planType === "EAC"
              ? Number(newNumericValue) || 0
              : forecast?.actualamt ?? 0,
          forecastid: Number(forecast?.forecastid ?? 0),
          projId: String(forecast?.projId ?? projectId ?? ""),
          plId: Number(forecast?.plId ?? planId ?? 0),
          emplId: String(forecast?.emplId ?? emp?.emple?.emplId ?? ""),
          dctId: Number(forecast?.dctId ?? 0),
          month: Number(forecast?.month ?? currentDuration?.monthNo ?? 0),
          year: Number(forecast?.year ?? currentDuration?.year ?? 0),
          totalBurdenCost: Number(forecast?.totalBurdenCost ?? 0),
          fees: Number(forecast?.fees ?? 0),
          burden: Number(forecast?.burden ?? 0),
          ccffRevenue: Number(forecast?.ccffRevenue ?? 0),
          tnmRevenue: Number(forecast?.tnmRevenue ?? 0),
          revenue: Number(forecast?.revenue ?? 0),
          cost: Number(forecast?.cost ?? 0),
          forecastedCost: Number(forecast?.forecastedCost ?? 0),
          fringe: Number(forecast?.fringe ?? 0),
          overhead: Number(forecast?.overhead ?? 0),
          gna: Number(forecast?.gna ?? 0),
          materials: Number(forecast?.materials ?? 0),
          forecastedhours: Number(forecast?.forecastedhours ?? 0),
          actualhours: Number(forecast?.actualhours ?? 0),
          createdat: forecast?.createdat ?? new Date().toISOString(),
          updatedat: new Date().toISOString(),
          displayText: String(forecast?.displayText ?? ""),
          acctId: String(emp?.emple?.accId ?? ""),
          orgId: String(emp?.emple?.orgId ?? ""),
          plc: String(emp?.emple?.plcGlcCode ?? ""),
          empleId: Number(emp?.emple?.id ?? 0),
          hrlyRate: Number(parseFloat(emp?.emple?.perHourRate ?? 0) || 0),
          effectDt: new Date().toISOString().split("T")[0],
          emple: emp?.emple
            ? {
                id: Number(emp.emple.id ?? 0),
                emplId: String(emp.emple.emplId ?? ""),
                orgId: String(emp.emple.orgId ?? ""),
                firstName: String(emp.emple.firstName ?? ""),
                lastName: String(emp.emple.lastName ?? ""),
                plcGlcCode: String(emp.emple.plcGlcCode ?? ""),
                perHourRate: Number(
                  parseFloat(emp.emple.perHourRate ?? 0) || 0
                ),
                salary: Number(parseFloat(emp.emple.salary ?? 0) || 0),
                accId: String(emp.emple.accId ?? ""),
                hireDate:
                  emp.emple.hireDate ?? new Date().toISOString().split("T")[0],
                isRev: Boolean(emp.emple.isRev ?? false),
                isBrd: Boolean(emp.emple.isBrd ?? false),
                createdAt: emp.emple.createdAt ?? new Date().toISOString(),
                type: String(emp.emple.type ?? ""),
                status: String(emp.emple.status ?? ""),
                plId: Number(planId ?? 0),
                isWarning: Boolean(emp.emple.isWarning ?? false),
                plForecasts: [],
                organization: emp.emple.organization || null,
                plProjectPlan: emp.emple.plProjectPlan || null,
              }
            : null,
        };

        bulkPayload.push(payload);
        successCount++;
      }

      if (bulkPayload.length === 0) {
        toast.warning("No valid entries to save.", { autoClose: 3000 });
        return;
      }

      // SINGLE BULK API CALL - NOT individual updates
      console.log(
        "Calling BULK amount API:",
        `${backendUrl}/Forecast/BulkUpdateForecastAmount/${planType}`
      );
      console.log("Bulk Payload:", JSON.stringify(bulkPayload, null, 2));

      const response = await axios.put(
        `${backendUrl}/Forecast/BulkUpdateForecastAmount/${planType}`,
        bulkPayload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Bulk amount update SUCCESS:", response.data);

      // Update local state for all successful updates
      setEmployees((prev) => {
        const updated = [...prev];

        for (const key in modifiedAmounts) {
          const { empIdx, uniqueKey, newValue } = modifiedAmounts[key];
          const newNumericValue = newValue === "" ? 0 : Number(newValue);

          if (
            updated[empIdx] &&
            updated[empIdx].emple &&
            updated[empIdx].emple.plForecasts
          ) {
            const currentDuration = sortedDurations.find(
              (d) => `${d.monthNo}_${d.year}` === uniqueKey
            );

            const forecastIndex = updated[empIdx].emple.plForecasts.findIndex(
              (f) =>
                f.month === currentDuration?.monthNo &&
                f.year === currentDuration?.year
            );

            if (forecastIndex !== -1) {
              if (planType === "EAC") {
                updated[empIdx].emple.plForecasts[forecastIndex].actualamt =
                  newNumericValue;
              } else {
                updated[empIdx].emple.plForecasts[forecastIndex].forecastedamt =
                  newNumericValue;
              }
              // Update the displayed value as well
              updated[empIdx].emple.plForecasts[forecastIndex].value =
                newNumericValue;
            }
          }
        }

        return updated;
      });

      // Clear modified amounts and reset flags
      setModifiedAmounts({});
      setHasUnsavedAmountChanges(false);

      toast.success(`Successfully saved ${successCount} amount entries`, {
        autoClose: 3000,
      });

      if (errorCount > 0) {
        toast.warning(`${errorCount} entries could not be processed.`, {
          autoClose: 3000,
        });
      }

      // DO NOT call onSaveSuccess to avoid refetch
      // The local state update above should be sufficient
    } catch (err) {
      console.error("Bulk amount update ERROR:", err);
      toast.error(
        "Failed to save amounts via BULK API: " +
          (err.response?.data?.message || err.message),
        {
          toastId: "save-amounts-error",
          autoClose: 3000,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Combined save handler for both amounts and field changes
  const handleSaveAllChanges = async () => {
    if (hasUnsavedAmountChanges && hasUnsavedFieldChanges) {
      // Save both amounts and field changes
      await Promise.all([handleSaveAllAmounts(), handleSaveFieldChanges()]);
    } else if (hasUnsavedAmountChanges) {
      // Save only amounts
      await handleSaveAllAmounts();
    } else if (hasUnsavedFieldChanges) {
      // Save only field changes
      await handleSaveFieldChanges();
    }
  };

  // Handler for saving field changes
  // const handleSaveFieldChanges = async () => {
  //   if (editingRowIndex === null || !editedRowData[editingRowIndex]) {
  //     toast.info("No field changes to save.", { autoClose: 2000 });
  //     return;
  //   }

  //   const emp = employees[editingRowIndex];
  //   if (!emp || !emp.emple) {
  //     toast.error("Employee data is missing for update.");
  //     return;
  //   }

  //   const edited = editedRowData[editingRowIndex];

  //   // Validation
  //   const validAccounts =
  //     emp.idType === "Vendor" || emp.idType === "Vendor Employee"
  //       ? subContractorNonLaborAccounts.map((a) => a.id || a.accountId || "")
  //       : employeeNonLaborAccounts.map((a) => a.id || a.accountId || "");

  //   if (edited.acctId && !validAccounts.includes(edited.acctId)) {
  //     toast.error("Please select a valid account from suggestions");
  //     return;
  //   }

  //   const validOrgs = organizationOptions.map((org) => org.value);
  //   if (edited.orgId && !validOrgs.includes(edited.orgId)) {
  //     toast.error("Please select a valid organization from suggestions");
  //     return;
  //   }

  //   const payload = {
  //     dctId: emp.emple.dctId || 0,
  //     plId: emp.emple.plId || 0,
  //     accId: edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
  //     orgId: edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
  //     type: emp.emple.type || "",
  //     category: emp.emple.category || "",
  //     amountType: emp.emple.amountType || "",
  //     id: emp.emple.emplId || "",
  //     isRev: edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
  //     isBrd: edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
  //     createdBy: emp.emple.createdBy || "System",
  //     lastModifiedBy: "System",
  //   };

  //   setIsLoading(true);
  //   try {
  //     await axios.put(
  //       `${backendUrl}/DirectCost/UpdateDirectCost`,
  //       { ...payload, acctId: payload.accId },
  //       { headers: { "Content-Type": "application/json" } }
  //     );

  //     // Clear edited data and reset states
  //     setEditedRowData((prev) => {
  //       const newData = { ...prev };
  //       delete newData[editingRowIndex];
  //       return newData;
  //     });

  //     setEmployees((prev) => {
  //       const updated = [...prev];
  //       updated[editingRowIndex] = {
  //         ...updated[editingRowIndex],
  //         emple: {
  //           ...updated[editingRowIndex].emple,
  //           ...payload,
  //         },
  //       };
  //       return updated;
  //     });

  //     setEditingRowIndex(null);
  //     setHasUnsavedFieldChanges(false);

  //     toast.success("Employee updated successfully!", {
  //       toastId: `employee-update-${editingRowIndex}`,
  //       autoClose: 2000,
  //     });
  //   } catch (err) {
  //     toast.error(
  //       "Failed to update employee: " +
  //         (err.response?.data?.message || err.message)
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleSaveFieldChanges = async () => {
  if (editingRowIndex === null || !editedRowData[editingRowIndex]) {
    toast.info("No field changes to save.", { autoClose: 2000 });
    return;
  }

  const emp = employees[editingRowIndex];
  if (!emp || !emp.emple) {
    toast.error("Employee data is missing for update.");
    return;
  }

  const edited = editedRowData[editingRowIndex];

  // ✅ FIXED: Added "Other" condition for validation
  const validAccounts =
    emp.emple.type === "Vendor" || emp.emple.type === "Vendor Employee"
      ? subContractorNonLaborAccounts.map((a) => a.id || a.accountId || "")
      : emp.emple.type === "Other"
      ? otherDirectCostNonLaborAccounts.map((a) => a.id || a.accountId || "")
      : employeeNonLaborAccounts.map((a) => a.id || a.accountId || "");

  if (edited.acctId && !validAccounts.includes(edited.acctId)) {
    toast.error("Please select a valid account from suggestions");
    return;
  }

  const validOrgs = organizationOptions.map((org) => org.value);
  if (edited.orgId && !validOrgs.includes(edited.orgId)) {
    toast.error("Please select a valid organization from suggestions");
    return;
  }

  const payload = {
    dctId: emp.emple.dctId || 0,
    plId: emp.emple.plId || 0,
    accId: edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
    orgId: edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
    type: emp.emple.type || "",
    category: emp.emple.category || "",
    amountType: emp.emple.amountType || "",
    id: emp.emple.emplId || "",
    isRev: edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
    isBrd: edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
    createdBy: emp.emple.createdBy || "System",
    lastModifiedBy: "System",
  };

  setIsLoading(true);
  try {
    await axios.put(
      `${backendUrl}/DirectCost/UpdateDirectCost`,
      { ...payload, acctId: payload.accId },
      { headers: { "Content-Type": "application/json" } }
    );

    // Clear edited data and reset states
    setEditedRowData((prev) => {
      const newData = { ...prev };
      delete newData[editingRowIndex];
      return newData;
    });

    setEmployees((prev) => {
      const updated = [...prev];
      updated[editingRowIndex] = {
        ...updated[editingRowIndex],
        emple: {
          ...updated[editingRowIndex].emple,
          ...payload,
        },
      };
      return updated;
    });

    setEditingRowIndex(null);
    setHasUnsavedFieldChanges(false);

    toast.success("Employee updated successfully!", {
      toastId: `employee-update-${editingRowIndex}`,
      autoClose: 2000,
    });
  } catch (err) {
    toast.error(
      "Failed to update employee: " +
        (err.response?.data?.message || err.message)
    );
  } finally {
    setIsLoading(false);
  }
};


  // Handler for canceling field changes
  const handleCancelFieldChanges = () => {
    if (editingRowIndex !== null) {
      setEditedRowData((prev) => {
        const newData = { ...prev };
        delete newData[editingRowIndex];
        return newData;
      });
    }
    setEditingRowIndex(null);
    setHasUnsavedFieldChanges(false);
    toast.info("Field changes cancelled.", { autoClose: 1500 });
  };

  // Combined cancel handler for both amounts and field changes
  const handleCancelAllChanges = () => {
    // Cancel amount changes
    if (hasUnsavedAmountChanges) {
      setModifiedAmounts({});
      setInputValues({});
      setHasUnsavedAmountChanges(false);
    }

    // Cancel field changes
    if (hasUnsavedFieldChanges) {
      if (editingRowIndex !== null) {
        setEditedRowData((prev) => {
          const newData = { ...prev };
          delete newData[editingRowIndex];
          return newData;
        });
        setEditingRowIndex(null);
      }
      setHasUnsavedFieldChanges(false);
    }

    toast.info("All changes cancelled.", { autoClose: 1500 });
  };

  const resetNewEntry = (newIdType) => {
    setNewEntry({
      id: "",
      firstName: "",
      lastName: "",
      isRev: false,
      isBrd: false,
      idType: newIdType || "", // preserve new idType
      acctId: "",
      orgId: "",
      perHourRate: "",
      status: "Act",
    });
  };

  const handleFillValues = async () => {
    if (!showNewForm || !isEditable) return;

    const newAmounts = {};
    if (fillMethod === "Copy From Source Record" && sourceRowIndex !== null) {
      const sourceEmp = employees[sourceRowIndex];
      const sourceMonthAmounts = getMonthAmounts(sourceEmp);
      sortedDurations.forEach((duration) => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        if (
          planType === "EAC" &&
          !isMonthEditable(duration, closedPeriod, planType)
        ) {
          newAmounts[uniqueKey] = newEntryPeriodAmounts[uniqueKey] || "0";
        } else {
          newAmounts[uniqueKey] =
            sourceMonthAmounts[uniqueKey]?.value?.toString() || "0";
        }
      });
    }

    setNewEntryPeriodAmounts((prev) => ({ ...prev, ...newAmounts }));
    setShowFillValues(false);
    setFillMethod("None");
    setSourceRowIndex(null);
  };

  const handleSaveNewEntry = async () => {
    if (!planId) {
      toast.error("Plan ID is required to save a new entry.", {
        toastId: "no-plan-id",
        autoClose: 3000,
      });
      return;
    }

    // Check for empty ID
    if (!newEntry.id || newEntry.id.trim() === "") {
      toast.error("ID is required to save a new entry.", {
        toastId: "empty-id-error",
        autoClose: 3000,
      });
      return;
    }

    // **NEW VALIDATION: Check if ID is from valid suggestions (not for "Other" type)**
    if (newEntry.idType !== "Other") {
      const isValidEmployeeId = employeeSuggestions.some(
        (emp) => emp.emplId === newEntry.id
      );

      if (!isValidEmployeeId) {
        toast.error("Please select a valid employee ID from the suggestions.", {
          toastId: "invalid-employee-selection",
          autoClose: 3000,
        });
        return; // Prevent saving
      }
    }

    // **NEW VALIDATION: Check if account is valid**
    // if (newEntry.acctId) {
    //   const validAccounts =
    //     newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee"
    //       ? subContractorNonLaborAccounts.map((a) => a.id || a.accountId)
    //        : newEntry.idType === "Other"  // ADD THIS
    //   ? otherDirectCostNonLaborAccounts.map((a) => a.id || a.accountId || "")
    //       : employeeNonLaborAccounts.map((a) => a.id || a.accountId);

    //   if (!validAccounts.includes(newEntry.acctId)) {
    //     toast.error("Please select a valid account from the suggestions.", {
    //       toastId: "invalid-account-selection",
    //       autoClose: 3000,
    //     });
    //     return;
    //   }
    // }
    if (newEntry.acctId) {
  const validAccounts = 
    newEntry.idType === 'Vendor' || newEntry.idType === 'Vendor Employee'
      ? subContractorNonLaborAccounts.map(a => a.id || a.accountId)
      : newEntry.idType === 'Other'
      ? otherDirectCostNonLaborAccounts.map(a => a.id || a.accountId)
      : employeeNonLaborAccounts.map(a => a.id || a.accountId);
  
  if (!validAccounts.includes(newEntry.acctId)) {
    toast.error("Please select a valid account from the suggestions.", {
      toastId: 'invalid-account-selection',
      autoClose: 3000,
    });
    return;
  }
}


    // **NEW VALIDATION: Check if organization is valid**
    if (newEntry.orgId) {
      const validOrgs = organizationOptions.map((org) => org.value);
      if (!validOrgs.includes(newEntry.orgId)) {
        toast.error(
          "Please select a valid organization from the suggestions.",
          {
            toastId: "invalid-org-selection",
            autoClose: 3000,
          }
        );
        return;
      }
    }

    // Check for duplicate ID
    // const isDuplicateId = employees.some((emp) => {
    //   const emple = emp.emple;
    //   if (!emple) return false;
    //   return emple.emplId === newEntry.id;
    // });

    // Check for duplicate ID (Combined ID + Account check)
    const isDuplicateId = employees.some((emp) => {
      const emple = emp.emple;
      if (!emple) return false;
      
      // Only consider it a duplicate if BOTH ID and Account match
      return (
        emple.emplId === newEntry.id && 
        emple.accId === newEntry.acctId
      ); 
    });

    if (isDuplicateId) {
      toast.error(
        "An entry with this ID already exists; cannot save duplicate.",
        {
          toastId: "duplicate-id-error",
          autoClose: 3000,
        }
      );
      return;
    }

    setIsLoading(true);

    const payloadForecasts = durations.map((duration) => ({
      forecastedamt:
        Number(newEntryPeriodAmounts[`${duration.monthNo}_${duration.year}`]) ||
        0,
      forecastid: 0,
      projId: projectId,
      plId: planId,
      emplId: newEntry.id,
      dctId: 0,
      month: duration.monthNo,
      year: duration.year,
      totalBurdenCost: 0,
      fees: 0,
      burden: 0,
      ccffRevenue: 0,
      tnmRevenue: 0,
      revenue: 0,
      cost: 0,
      fringe: 0,
      overhead: 0,
      gna: 0,
      forecastedhours: 0,
      updatedat: new Date().toISOString().split("T")[0],
      displayText: "",
      acctId: newEntry.acctId,
      orgId: newEntry.orgId,
      hrlyRate: Number(newEntry.perHourRate) || 0,
      effectDt: null,
    }));

    const payload = {
      dctId: 0,
      plId: planId,
      acctId: newEntry.acctId || "",
      orgId: newEntry.orgId || "",
      notes: "",
      category:
        newEntry.lastName && newEntry.firstName
          ? `${newEntry.lastName}, ${newEntry.firstName}`
          : newEntry.lastName || newEntry.firstName || "",
      amountType: "",
      id: newEntry.id,
      type: newEntry.idType || "-",
      isRev: newEntry.isRev || false,
      isBrd: newEntry.isBrd || false,
      status: newEntry.status || "-",
      createdBy: "System",
      lastModifiedBy: "System",
      plForecasts: payloadForecasts,
      plDct: {},
    };

    try {
      const response = await axios.post(
        `${backendUrl}/DirectCost/AddNewDirectCost`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      const newEmployee = {
        emple: {
          empleId: newEntry.id,
          emplId: newEntry.id,
          firstName: newEntry.firstName || "",
          lastName: newEntry.lastName || "",
          accId: newEntry.acctId || "",
          orgId: newEntry.orgId || "",
          perHourRate: Number(newEntry.perHourRate) || 0,
          isRev: newEntry.isRev || false,
          isBrd: newEntry.isBrd || false,
          status: newEntry.status || "Act",
          type: newEntry.idType || "Employee",
          category:
            newEntry.lastName && newEntry.firstName
              ? `${newEntry.lastName}, ${newEntry.firstName}`
              : newEntry.lastName || newEntry.firstName || "",
          plForecasts: payloadForecasts.map((forecast) => ({
            ...forecast,
            forecastid:
              response.data?.plForecasts?.find(
                (f) => f.month === forecast.month && f.year === forecast.year
              )?.forecastid || 0,
            createdat: new Date().toISOString(),
          })),
        },
      };

      setEmployees((prevEmployees) => {
        const employeeMap = new Map();
        prevEmployees.forEach((emp) => {
          const emplId = emp.emple.emplId || `auto-${Math.random()}`;
          employeeMap.set(emplId, emp);
        });
        employeeMap.set(newEntry.id, newEmployee);
        return Array.from(employeeMap.values());
      });

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
        perHourRate: "",
        status: "Act",
      });
      setEmployeeSuggestions([]);
      setNonLaborAccounts([]);

      if (onSaveSuccess) {
        onSaveSuccess();
      }

      toast.success("New entry saved and added to table!", {
        toastId: "save-entry-success",
        autoClose: 3000,
      });
    } catch (err) {
      const errorMessage = err.response?.data?.errors
        ? Object.entries(err.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("; ")
        : err.response?.data?.message || err.message;
      setSuccessMessageText("Failed to save entry.");
      setShowSuccessMessage(true);
      toast.error(`Failed to save new entry: ${errorMessage}`, {
        toastId: "save-entry-error",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setShowSuccessMessage(false), 2000);
    }
  };

  const handleSaveMultiplePastedEntries = async () => {
    if (newEntries.length === 0) {
      toast.info("No pasted entries to save", { autoClose: 2000 });
      return;
    }

    if (!planId) {
      toast.error("Plan ID is required to save entries.", {
        toastId: "no-plan-id",
        autoClose: 3000,
      });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const successfulIndices = []; // Track which entries were saved successfully

    try {
      // Loop through each pasted entry
      for (let entryIndex = 0; entryIndex < newEntries.length; entryIndex++) {
        const entry = newEntries[entryIndex];
        const periodAmounts = newEntryPeriodAmountsArray[entryIndex] || {};

        // SAME VALIDATION AS handleSaveNewEntry
        // 1. Check for empty ID
        if (!entry.id || entry.id.trim() === "") {
          errors.push(`Entry ${entryIndex + 1}: ID is required`);
          errorCount++;
          continue;
        }

        // 2. Check for valid employee ID (not for "Other" type)
        if (entry.idType !== "Other") {
          const isValidEmployeeId = (
            pastedEntrySuggestions[entryIndex] || []
          ).some((emp) => emp.emplId === entry.id);
          if (!isValidEmployeeId) {
            errors.push(
              `Entry ${entryIndex + 1}: Invalid employee ID "${entry.id}"`
            );
            errorCount++;
            continue;
          }
        }

        // 3. Check for valid account
        if (entry.acctId) {
          const validAccounts =
            entry.idType === "Vendor" || entry.idType === "Vendor Employee"
              ? (pastedEntryAccounts[entryIndex] || []).map(
                  (a) => a.id || a.accountId
                )
              : (pastedEntryAccounts[entryIndex] || []).map(
                  (a) => a.id || a.accountId
                );

          if (!validAccounts.includes(entry.acctId)) {
            errors.push(
              `Entry ${entryIndex + 1}: Invalid account "${entry.acctId}"`
            );
            errorCount++;
            continue;
          }
        }

        // 4. Check for valid organization
        if (entry.orgId) {
          const validOrgs = (pastedEntryOrgs[entryIndex] || []).map(
            (org) => org.value
          );
          if (!validOrgs.includes(entry.orgId)) {
            errors.push(
              `Entry ${entryIndex + 1}: Invalid organization "${entry.orgId}"`
            );
            errorCount++;
            continue;
          }
        }

    

        // Check for duplicate ID (Combined ID + Account check)
        const isDuplicateId = employees.some((emp) => {
          const emple = emp.emple;
          if (!emple) return false;
          
          // Only consider it a duplicate if BOTH ID and Account match
          return (
            emple.emplId === entry.id && 
            emple.accId === entry.acctId
          );
        });

        if (isDuplicateId) {
          errors.push(
            `Entry ${entryIndex + 1}: ID "${entry.id}" with Account "${entry.acctId}" already exists in table`
          );
          errorCount++;
          continue;
        }

        // const isDuplicateId = employees.some((emp) => {
        //   const emple = emp.emple;
        //   if (!emple) return false;
        //   return emple.emplId === entry.id;
        // });

        // if (isDuplicateId) {
        //   errors.push(
        //     `Entry ${entryIndex + 1}: ID "${entry.id}" already exists in table`
        //   );
        //   errorCount++;
        //   continue;
        // }

        // SAME PAYLOAD STRUCTURE AS handleSaveNewEntry
        const payloadForecasts = durations.map((duration) => ({
          forecastedamt:
            Number(periodAmounts[`${duration.monthNo}_${duration.year}`]) || 0,
          forecastid: 0,
          projId: projectId,
          plId: planId,
          emplId: entry.id,
          dctId: 0,
          month: duration.monthNo,
          year: duration.year,
          totalBurdenCost: 0,
          fees: 0,
          burden: 0,
          ccffRevenue: 0,
          tnmRevenue: 0,
          revenue: 0,
          cost: 0,
          fringe: 0,
          overhead: 0,
          gna: 0,
          forecastedhours: 0,
          updatedat: new Date().toISOString().split("T")[0],
          displayText: "",
          acctId: entry.acctId,
          orgId: entry.orgId,
          hrlyRate: 0,
          effectDt: null,
        }));

        const payload = {
          dctId: 0,
          plId: planId,
          acctId: entry.acctId || "",
          orgId: entry.orgId || "",
          notes: "",
          category:
            entry.lastName && entry.firstName
              ? `${entry.lastName}, ${entry.firstName}`
              : entry.lastName || entry.firstName || "",
          amountType: "",
          id: entry.id,
          type: entry.idType || "Employee",
          isRev: entry.isRev || false,
          isBrd: entry.isBrd || false,
          status: entry.status || "Act",
          createdBy: "System",
          lastModifiedBy: "System",
          plForecasts: payloadForecasts,
          plDct: "",
        };

        // SAME API CALL AS handleSaveNewEntry
        try {
          const response = await axios.post(
            `${backendUrl}/DirectCost/AddNewDirectCost`,
            payload,
            {
              headers: { "Content-Type": "application/json" },
            }
          );

          // Add to local state
          const newEmployee = {
            emple: {
              empleId: entry.id,
              emplId: entry.id,
              firstName: entry.firstName || "",
              lastName: entry.lastName || "",
              accId: entry.acctId || "",
              orgId: entry.orgId || "",
              perHourRate: 0,
              isRev: entry.isRev || false,
              isBrd: entry.isBrd || false,
              status: entry.status || "Act",
              type: entry.idType || "Employee",
              category:
                entry.lastName && entry.firstName
                  ? `${entry.lastName}, ${entry.firstName}`
                  : entry.lastName || entry.firstName || "",
              plForecasts: payloadForecasts.map((forecast) => ({
                ...forecast,
                forecastid:
                  response.data?.plForecasts?.find(
                    (f) =>
                      f.month === forecast.month && f.year === forecast.year
                  )?.forecastid || 0,
                createdat: new Date().toISOString(),
              })),
            },
          };

          setEmployees((prevEmployees) => {
            const employeeMap = new Map();
            prevEmployees.forEach((emp) => {
              const emplId = emp.emple.emplId || `auto-${Math.random()}`;
              employeeMap.set(emplId, emp);
            });
            employeeMap.set(entry.id, newEmployee);
            return Array.from(employeeMap.values());
          });

          successCount++;
          successfulIndices.push(entryIndex); // Mark this entry as successfully saved
        } catch (err) {
          const errorMessage = err.response?.data?.message || err.message;
          errors.push(`Entry ${entryIndex + 1}: ${errorMessage}`);
          errorCount++;
        }
      }

      // ONLY REMOVE SUCCESSFULLY SAVED ENTRIES
      if (successfulIndices.length > 0) {
        setNewEntries((prev) =>
          prev.filter((_, idx) => !successfulIndices.includes(idx))
        );
        setNewEntryPeriodAmountsArray((prev) =>
          prev.filter((_, idx) => !successfulIndices.includes(idx))
        );

        // Also clean up suggestions for removed entries
        setPastedEntrySuggestions((prev) => {
          const updated = { ...prev };
          successfulIndices.forEach((idx) => delete updated[idx]);
          // Re-index remaining entries
          const reindexed = {};
          Object.keys(updated).forEach((key) => {
            const oldIdx = parseInt(key);
            const newIdx =
              oldIdx - successfulIndices.filter((si) => si < oldIdx).length;
            reindexed[newIdx] = updated[key];
          });
          return reindexed;
        });

        setPastedEntryAccounts((prev) => {
          const updated = { ...prev };
          successfulIndices.forEach((idx) => delete updated[idx]);
          const reindexed = {};
          Object.keys(updated).forEach((key) => {
            const oldIdx = parseInt(key);
            const newIdx =
              oldIdx - successfulIndices.filter((si) => si < oldIdx).length;
            reindexed[newIdx] = updated[key];
          });
          return reindexed;
        });

        setPastedEntryOrgs((prev) => {
          const updated = { ...prev };
          successfulIndices.forEach((idx) => delete updated[idx]);
          const reindexed = {};
          Object.keys(updated).forEach((key) => {
            const oldIdx = parseInt(key);
            const newIdx =
              oldIdx - successfulIndices.filter((si) => si < oldIdx).length;
            reindexed[newIdx] = updated[key];
          });
          return reindexed;
        });
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully saved ${successCount} entries!`, {
          autoClose: 3000,
        });
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      }

      if (errorCount > 0) {
        toast.error(
          `Failed to save ${errorCount} entries:\n${errors
            .slice(0, 3)
            .join("\n")}${
            errors.length > 3 ? `\n...and ${errors.length - 3} more` : ""
          }`,
          { toastId: "save-pasted-error", autoClose: 5000 }
        );
      }
    } catch (err) {
      toast.error(`Failed to save pasted entries: ${err.message}`, {
        toastId: "save-pasted-error",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (actualEmpIdx) => {
    // if (!isEditable) return;

    // Toggle selection in selectedRowIndex for UI highlighting
    setSelectedRowIndex((prev) =>
      prev === actualEmpIdx ? null : actualEmpIdx
    );

    // Use employees instead of Employees
    const selectedEmployee = employees[actualEmpIdx];
    setSelectedEmployeeId(
      selectedEmployee ? selectedEmployee.emple.dctId : null
    );
    setSelectedColumnKey(null);
    setReplaceScope(actualEmpIdx === selectedRowIndex ? "all" : "row");

    if (showNewForm) {
      setSourceRowIndex(actualEmpIdx);
    }

    // ADD THIS: Toggle row selection for copy functionality
    setSelectedRows((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(actualEmpIdx)) {
        newSelection.delete(actualEmpIdx);
      } else {
        newSelection.add(actualEmpIdx);
      }
      setShowCopyButton(newSelection.size > 0);
      return newSelection;
    });
  };

  const handleDeleteEmployee = async (dctId) => {
    if (!dctId) {
      toast.error("No employee selected for deletion");
      return;
    }

    try {
      // Confirm deletion with user
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this employee?"
      );
      if (!confirmDelete) return;

      // Call delete API
      await axios.delete(`${backendUrl}/DirectCost/DeleteDirectCost/${dctId}`);

      // Show success message
      toast.success("Employee deleted successfully!");

      // Remove employee from local state
      setEmployees((prev) => prev.filter((emp) => emp.emple.dctId !== dctId));

      // Clear selection
      setSelectedRowIndex(null);
      setSelectedEmployeeId(null);
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
      // Prepare bulk payload array - DO NOT use individual updates
      const bulkPayload = [];
      const updatedInputValues = { ...inputValues };

      for (const empIdx in employees) {
        const emp = employees[empIdx];
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

          // Get the actual displayed value
          let displayedValue;
          if (inputValues[currentInputKey] !== undefined) {
            displayedValue = String(inputValues[currentInputKey]);
          } else {
            const monthAmounts = getMonthAmounts(emp);
            const forecast = monthAmounts[uniqueKey];
            if (forecast && forecast.value !== undefined) {
              displayedValue = String(forecast.value);
            } else {
              displayedValue = "0";
            }
          }

          const findValueTrimmed = findValue.trim();
          const displayedValueTrimmed = displayedValue.trim();

          // Matching logic
          let isMatch = false;

          if (findValueTrimmed === "0") {
            const numValue = parseFloat(displayedValueTrimmed);
            isMatch =
              displayedValueTrimmed === "" ||
              displayedValueTrimmed === "0" ||
              (!isNaN(numValue) && numValue === 0);
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
            const monthAmounts = getMonthAmounts(emp);
            const forecast = monthAmounts[uniqueKey];

            // Only proceed if we have a valid forecast with forecastid
            if (!forecast || !forecast.forecastid) {
              skippedCount++;
              continue;
            }

            const originalValue =
              planType === "EAC"
                ? forecast.actualamt ?? 0
                : forecast.forecastedamt ?? 0;

            if (newNumericValue !== originalValue) {
              updatedInputValues[currentInputKey] = newValue;
              replacementsCount++;

              // Create payload matching EXACT bulk API structure from handleSaveAllAmounts
              const payload = {
                forecastedamt:
                  planType === "EAC"
                    ? forecast?.forecastedamt ?? 0
                    : Number(newNumericValue) || 0,
                actualamt:
                  planType === "EAC"
                    ? Number(newNumericValue) || 0
                    : forecast?.actualamt ?? 0,
                forecastid: Number(forecast?.forecastid ?? 0),
                projId: String(forecast?.projId ?? projectId ?? ""),
                plId: Number(forecast?.plId ?? planId ?? 0),
                emplId: String(forecast?.emplId ?? emp?.emple?.emplId ?? ""),
                dctId: Number(forecast?.dctId ?? 0),
                month: Number(forecast?.month ?? duration?.monthNo ?? 0),
                year: Number(forecast?.year ?? duration?.year ?? 0),
                totalBurdenCost: Number(forecast?.totalBurdenCost ?? 0),
                fees: Number(forecast?.fees ?? 0),
                burden: Number(forecast?.burden ?? 0),
                ccffRevenue: Number(forecast?.ccffRevenue ?? 0),
                tnmRevenue: Number(forecast?.tnmRevenue ?? 0),
                revenue: Number(forecast?.revenue ?? 0),
                cost: Number(forecast?.cost ?? 0),
                forecastedCost: Number(forecast?.forecastedCost ?? 0),
                fringe: Number(forecast?.fringe ?? 0),
                overhead: Number(forecast?.overhead ?? 0),
                gna: Number(forecast?.gna ?? 0),
                materials: Number(forecast?.materials ?? 0),
                forecastedhours: Number(forecast?.forecastedhours ?? 0),
                actualhours: Number(forecast?.actualhours ?? 0),
                createdat: forecast?.createdat ?? new Date().toISOString(),
                updatedat: new Date().toISOString(),
                displayText: String(forecast?.displayText ?? ""),
                acctId: String(emp?.emple?.accId ?? ""),
                orgId: String(emp?.emple?.orgId ?? ""),
                plc: String(emp?.emple?.plcGlcCode ?? ""),
                empleId: Number(emp?.emple?.id ?? 0),
                hrlyRate: Number(parseFloat(emp?.emple?.perHourRate ?? 0) || 0),
                effectDt: new Date().toISOString().split("T")[0],
                emple: emp?.emple
                  ? {
                      id: Number(emp.emple.id ?? 0),
                      emplId: String(emp.emple.emplId ?? ""),
                      orgId: String(emp.emple.orgId ?? ""),
                      firstName: String(emp.emple.firstName ?? ""),
                      lastName: String(emp.emple.lastName ?? ""),
                      plcGlcCode: String(emp.emple.plcGlcCode ?? ""),
                      perHourRate: Number(
                        parseFloat(emp.emple.perHourRate ?? 0) || 0
                      ),
                      salary: Number(parseFloat(emp.emple.salary ?? 0) || 0),
                      accId: String(emp.emple.accId ?? ""),
                      hireDate:
                        emp.emple.hireDate ??
                        new Date().toISOString().split("T")[0],
                      isRev: Boolean(emp.emple.isRev ?? false),
                      isBrd: Boolean(emp.emple.isBrd ?? false),
                      createdAt:
                        emp.emple.createdAt ?? new Date().toISOString(),
                      type: String(emp.emple.type ?? ""),
                      status: String(emp.emple.status ?? ""),
                      plId: Number(planId ?? 0),
                      isWarning: Boolean(emp.emple.isWarning ?? false),
                      plForecasts: [],
                      organization: emp.emple.organization || null,
                      plProjectPlan: emp.emple.plProjectPlan || null,
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

      // SINGLE BULK API CALL - NOT individual updates, matching handleSaveAllAmounts
      console.log(
        "Calling BULK find/replace amount API:",
        `${backendUrl}/Forecast/BulkUpdateForecastAmount/${planType}`
      );
      console.log(
        "Bulk Find/Replace Payload:",
        JSON.stringify(bulkPayload, null, 2)
      );

      const response = await axios.put(
        `${backendUrl}/Forecast/BulkUpdateForecastAmount/${planType}`,
        bulkPayload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Bulk find/replace amount update SUCCESS:", response.data);

      // Update local state for all successful updates matching handleSaveAllAmounts pattern
      setEmployees((prev) => {
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
                    updated[empIdx].emple.plForecasts[forecastIndex].actualamt =
                      newValue;
                  } else {
                    updated[empIdx].emple.plForecasts[
                      forecastIndex
                    ].forecastedamt = newValue;
                  }
                  // Update the displayed value as well
                  updated[empIdx].emple.plForecasts[forecastIndex].value =
                    newValue;
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
      console.error("Bulk find/replace amount ERROR:", err);
      toast.error(
        "Failed to replace values via BULK API: " +
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

  const handleFind = () => {
    if (!findValue) {
      toast.warn("Please enter a value to find.", { autoClose: 2000 });
      return;
    }

    const matches = [];
    const findValueTrimmed = findValue.trim();

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

    for (const empIdx in employees) {
      const emp = employees[empIdx];
      const actualEmpIdx = parseInt(empIdx, 10);

      if (replaceScope === "row" && actualEmpIdx !== selectedRowIndex) continue;

      for (const duration of sortedDurations) {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;

        if (replaceScope === "column" && uniqueKey !== selectedColumnKey)
          continue;

        if (!isMonthEditable(duration, closedPeriod, planType)) continue;

        const currentInputKey = `${actualEmpIdx}_${uniqueKey}`;
        let displayedValue;

        if (inputValues[currentInputKey] !== undefined) {
          displayedValue = String(inputValues[currentInputKey]);
        } else {
          const monthAmounts = getMonthAmounts(emp);
          const forecast = monthAmounts[uniqueKey];
          if (forecast && forecast.value !== undefined) {
            displayedValue = String(forecast.value);
          } else {
            displayedValue = "0";
          }
        }

        const displayedValueTrimmed = displayedValue.trim();
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
          matches.push({ empIdx: actualEmpIdx, uniqueKey });
        }
      }
    }

    setFindMatches(matches);

    if (matches.length === 0) {
      toast.info("No matches found.", { autoClose: 2000 });
    } else {
      // toast.success(`Found ${matches.length} matches highlighted in the table.`, { autoClose: 3000 });
      setShowFindReplace(false);
    }
  };

  const showHiddenRows = () => setHiddenRows({});

  // const sortedDurations =
  //   propFiscalYear && propFiscalYear !== "All"
  //     ? durations
  //         .filter((d) => d.year === parseInt(propFiscalYear))
  //         .sort(
  //           (a, b) =>
  //             new Date(a.year, a.monthNo - 1, 1) -
  //             new Date(b.year, b.monthNo - 1, 1)
  //         )
  //     : durations.sort(
  //         (a, b) =>
  //           new Date(a.year, a.monthNo - 1, 1) -
  //           new Date(b.year, b.monthNo - 1, 1)
  //       );

  if (isLoading) {
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
    employees.filter((_, idx) => !hiddenRows[idx]).length +
      (showNewForm ? 1 : 0),
    2
  );

  // Calculate column totals for each month
  // const calculateColumnTotals = () => {
  //   const columnTotals = {};

  //   sortedDurations.forEach((duration) => {
  //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //     let total = 0;

  //     // Sum amounts from existing employees
  //     employees
  //       .filter((_, idx) => !hiddenRows[idx])
  //       .forEach((emp, idx) => {
  //         const actualEmpIdx = employees.findIndex((e) => e === emp);
  //         const inputValue = inputValues[`${actualEmpIdx}_${uniqueKey}`];
  //         const monthAmounts = getMonthAmounts(emp);
  //         const forecastValue = monthAmounts[uniqueKey]?.value;
  //         const value =
  //           inputValue !== undefined && inputValue !== ""
  //             ? inputValue
  //             : forecastValue;

  //         total += value && !isNaN(value) ? Number(value) : 0;
  //       });

  //     // Add amounts from new entry form if visible
  //     if (showNewForm) {
  //       const newEntryValue = newEntryPeriodAmounts[uniqueKey];
  //       total +=
  //         newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //     }

  //     columnTotals[uniqueKey] = total;
  //   });

  //   return columnTotals;
  // };

  //   const calculateColumnTotals = () => {
  //   const columnTotals = {};

  //   let ctdTotal = 0;
  //   let priorYearTotal = 0;

  //   const currentFiscalYear = normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;
  //   const startYear = startDate ? parseInt(startDate.split('-')[0]) : null;

  //   // Calculate CTD and Prior Year from ALL durations
  //   if (currentFiscalYear && startYear) {
  //     durations.forEach((duration) => {
  //       let total = 0;
  //       const uniqueKey = `${duration.monthNo}_${duration.year}`;

  //       // Sum amounts from existing employees
  //       employees.forEach((emp, idx) => {
  //         if (hiddenRows[idx]) return;
  //         const inputValue = inputValues[`${idx}_${uniqueKey}`];
  //         const monthAmounts = getMonthAmounts(emp);
  //         const forecastValue = monthAmounts[uniqueKey]?.value;
  //         const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
  //         total += value && !isNaN(value) ? Number(value) : 0;
  //       });

  //       // Add amounts from new entry forms
  //       newEntries.forEach((entry, entryIndex) => {
  //         const newEntryValue = newEntryPeriodAmountsArray[entryIndex]?.[uniqueKey];
  //         total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //       });

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

  //   // Calculate monthly totals for visible columns (filtered by fiscal year)
  //   sortedDurations.forEach((duration) => {
  //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //     let total = 0;

  //     // Sum amounts from existing employees
  //     employees.forEach((emp, idx) => {
  //       if (hiddenRows[idx]) return;
  //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
  //       const monthAmounts = getMonthAmounts(emp);
  //       const forecastValue = monthAmounts[uniqueKey]?.value;
  //       const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
  //       total += value && !isNaN(value) ? Number(value) : 0;
  //     });

  //     // Add amounts from new entry forms
  //     newEntries.forEach((entry, entryIndex) => {
  //       const newEntryValue = newEntryPeriodAmountsArray[entryIndex]?.[uniqueKey];
  //       total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //     });

  //     columnTotals[uniqueKey] = total;
  //   });

  //   // Add CTD and Prior Year to columnTotals
  //   columnTotals['ctd'] = ctdTotal;
  //   columnTotals['priorYear'] = priorYearTotal;

  //   return columnTotals;
  // };

  // Replace the regular function with useMemo - ADD THIS RIGHT AFTER sortedDurations

  // Function to handle row selection
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
      employees.forEach((_, index) => {
        if (!hiddenRows[index]) {
          allRowIndices.add(index);
        }
      });
      setSelectedRows(allRowIndices);
      setShowCopyButton(true);
    } else {
      setSelectedRows(new Set());
      setShowCopyButton(false);
    }
  };

  // const handleCopySelectedRows = () => {
  //   if (selectedRows.size === 0) {
  //     toast.info("No rows selected to copy.", { autoClose: 2000 });
  //     return;
  //   }

  //   const sortedDurations = durations.sort((a, b) => {
  //     if (a.year !== b.year) return a.year - b.year;
  //     return a.monthNo - b.monthNo;
  //   });

  //   const headers = [
  //     "ID Type",
  //     "ID",
  //     "Name",
  //     "Account",
  //     "Account Name",
  //     "Organization",
  //     "Rev",
  //     "Brd",
  //     "Status",
  //   ];

  //   // Store month metadata for matching during paste
  //   const monthMetadata = [];

  //   sortedDurations.forEach((duration) => {
  //     const monthName = new Date(
  //       duration.year,
  //       duration.monthNo - 1
  //     ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  //     headers.push(monthName);
  //     monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
  //   });

  //   const copyData = [headers];
  //   const structuredData = [];

  //   selectedRows.forEach((rowIndex) => {
  //     const emp = employees[rowIndex];
  //     if (emp && emp.emple && !hiddenRows[rowIndex]) {
  //       const employeeRow = getEmployeeRow(emp, rowIndex);
  //       const rowData = [
  //         employeeRow.idType,
  //         employeeRow.emplId,
  //         employeeRow.name,
  //         employeeRow.acctId,
  //         employeeRow.acctName,
  //         employeeRow.orgId,
  //         typeof employeeRow.isRev === "object" ? "✓" : employeeRow.isRev,
  //         typeof employeeRow.isBrd === "object" ? "✓" : employeeRow.isBrd,
  //         employeeRow.status,
  //       ];

  //       sortedDurations.forEach((duration) => {
  //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //         const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
  //         const monthAmounts = getMonthAmounts(emp);
  //         const forecastValue = monthAmounts[uniqueKey]?.value;
  //         const value =
  //           inputValue !== undefined && inputValue !== ""
  //             ? inputValue
  //             : forecastValue || "0.00";
  //         rowData.push(value);
  //       });

  //       copyData.push(rowData);
  //       structuredData.push(rowData);
  //     }
  //   });

  //   const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

  //   navigator.clipboard
  //     .writeText(tsvContent)
  //     .then(() => {
  //       setCopiedRowsData(() => structuredData);
  //       setCopiedMonthMetadata(() => monthMetadata);
  //       setHasClipboardData(() => true);

  //       toast.success(`Copied ${structuredData.length} rows!`, {
  //         autoClose: 3000,
  //       });

  //       Promise.resolve().then(() => {
  //         setSelectedRows(new Set());
  //         setShowCopyButton(false);
  //       });
  //     })
  //     .catch((err) => {
  //       console.error("Copy failed:", err);
  //       toast.error("Failed to copy data.", { autoClose: 3000 });
  //     });
  // };

  // const handleCopySelectedRows = () => {
  //   if (selectedRows.size === 0) {
  //     toast.info("No rows selected to copy.", { autoClose: 2000 });
  //     return;
  //   }

  //   // COPY ALL DURATIONS (not filtered by fiscal year) - use spread to avoid mutation
  //   const sortedDurations = [...durations].sort((a, b) => {
  //     if (a.year !== b.year) return a.year - b.year;
  //     return a.monthNo - b.monthNo;
  //   });

  //   const headers = [
  //     "ID Type",
  //     "ID",
  //     "Name",
  //     "Account",
  //     "Account Name",
  //     "Organization",
  //     "Rev",
  //     "Brd",
  //     "Status",
  //     "Total",
  //   ];

  //   // Store month metadata for matching during paste
  //   const monthMetadata = [];

  //   sortedDurations.forEach((duration) => {
  //     const monthName = new Date(
  //       duration.year,
  //       duration.monthNo - 1
  //     ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  //     headers.push(monthName);
  //     monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
  //   });

  //   const copyData = [headers];
  //   const structuredData = [];

  //   selectedRows.forEach((rowIndex) => {
  //     const emp = employees[rowIndex];
  //     if (emp && emp.emple && !hiddenRows[rowIndex]) {
  //       const employeeRow = getEmployeeRow(emp, rowIndex);
  //       const rowData = [
  //         employeeRow.idType,
  //         employeeRow.emplId,
  //         employeeRow.name,
  //         employeeRow.acctId,
  //         employeeRow.acctName,
  //         employeeRow.orgId,
  //         typeof employeeRow.isRev === "object" ? "✓" : employeeRow.isRev === true ? "✓" : "-",
  //         typeof employeeRow.isBrd === "object" ? "✓" : employeeRow.isBrd === true ? "✓" : "-",
  //         employeeRow.status,
  //         employeeRow.total,
  //       ];

  //       sortedDurations.forEach((duration) => {
  //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //         const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
  //         const monthAmounts = getMonthAmounts(emp);
  //         const forecastValue = monthAmounts[uniqueKey]?.value;

  //         // Format the value properly
  //         let value = "0.00";
  //         if (inputValue !== undefined && inputValue !== "" && inputValue !== null) {
  //           value = parseFloat(inputValue).toFixed(2);
  //         } else if (forecastValue !== undefined && forecastValue !== "" && forecastValue !== null) {
  //           value = parseFloat(forecastValue).toFixed(2);
  //         }

  //         rowData.push(value);
  //       });

  //       copyData.push(rowData);
  //       structuredData.push(rowData);
  //     }
  //   });

  //   const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

  //   navigator.clipboard
  //     .writeText(tsvContent)
  //     .then(() => {
  //       setCopiedRowsData(() => structuredData);
  //       setCopiedMonthMetadata(() => monthMetadata);
  //       setHasClipboardData(() => true);

  //       toast.success(`Copied ${structuredData.length} rows with all fiscal year data!`, {
  //         autoClose: 3000,
  //       });

  //       Promise.resolve().then(() => {
  //         setSelectedRows(new Set());
  //         setShowCopyButton(false);
  //       });
  //     })
  //     .catch((err) => {
  //       console.error("Copy failed:", err);
  //       toast.error("Failed to copy data.", { autoClose: 3000 });
  //     });
  // };
  const handleCopySelectedRows = () => {
    if (selectedRows.size === 0) {
      toast.info("No rows selected to copy.", { autoClose: 2000 });
      return;
    }

    // COPY ALL DURATIONS (not filtered by fiscal year) - use spread to avoid mutation
    // const sortedDurations = [...durations].sort((a, b) => {
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
      "Rev",
      "Brd",
      "Status",
      "Total",
    ];

    // Store month metadata for matching during paste
    const monthMetadata = [];

    // GENERATE MONTH NAMES CORRECTLY
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    sortedDurations.forEach((duration) => {
      // Use direct month mapping instead of Date object
      const monthName = `${monthNames[duration.monthNo - 1]} ${duration.year}`;
      headers.push(monthName);
      monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
    });

    const copyData = [headers];
    const structuredData = [];

    selectedRows.forEach((rowIndex) => {
      const emp = employees[rowIndex];
      if (emp && emp.emple && !hiddenRows[rowIndex]) {
        const employeeRow = getEmployeeRow(emp, rowIndex);
        const rowData = [
          employeeRow.idType,
          employeeRow.emplId,
          employeeRow.name,
          employeeRow.acctId,
          employeeRow.acctName,
          employeeRow.orgId,
          typeof employeeRow.isRev === "object"
            ? "✓"
            : employeeRow.isRev === true
            ? "✓"
            : "-",
          typeof employeeRow.isBrd === "object"
            ? "✓"
            : employeeRow.isBrd === true
            ? "✓"
            : "-",
          employeeRow.status,
          employeeRow.total,
        ];

        sortedDurations.forEach((duration) => {
          const uniqueKey = `${duration.monthNo}_${duration.year}`;
          const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
          const monthAmounts = getMonthAmounts(emp);
          const forecastValue = monthAmounts[uniqueKey]?.value;

          // Format the value properly
          let value = "0.00";
          if (
            inputValue !== undefined &&
            inputValue !== "" &&
            inputValue !== null
          ) {
            value = parseFloat(inputValue).toFixed(2);
          } else if (
            forecastValue !== undefined &&
            forecastValue !== "" &&
            forecastValue !== null
          ) {
            value = parseFloat(forecastValue).toFixed(2);
          }

          rowData.push(value);
        });

        copyData.push(rowData);
        structuredData.push(rowData);
      }
    });

    const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

    navigator.clipboard
      .writeText(tsvContent)
      .then(() => {
        setCopiedRowsData(() => structuredData);
        setCopiedMonthMetadata(() => monthMetadata);
        setHasClipboardData(() => true);

        toast.success(
          `Copied ${structuredData.length} rows with all fiscal year data!`,
          {
            autoClose: 3000,
          }
        );

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

  //   if (showNewForm) {
  //     setShowNewForm(false);
  //   }

  //   const sortedDurations = [...durations]
  //     .filter((d) => {
  //       if (propFiscalYear === "All") return true;
  //       return d.year === parseInt(propFiscalYear);
  //     })
  //     .sort((a, b) => {
  //       if (a.year !== b.year) return a.year - b.year;
  //       return a.monthNo - b.monthNo;
  //     });

  //   const processedEntries = [];
  //   const processedAmountsArray = [];

  //   copiedRowsData.forEach((rowData) => {
  //     const [
  //       idTypeLabel,
  //       id,
  //       name,
  //       acctId,
  //       acctName,
  //       orgId,
  //       isRev,
  //       isBrd,
  //       status,
  //       ...monthValues
  //     ] = rowData;

  //     const idType =
  //       ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
  //       idTypeLabel;

  //     let firstName = "";
  //     let lastName = "";

  //     if (idType === "Vendor" || idType === "Vendor Employee") {
  //       lastName = name;
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
  //       perHourRate: "",
  //       status: status || "ACT",
  //       isRev: isRev === "✓",
  //       isBrd: isBrd === "✓",
  //     };

  //     const periodAmounts = {};
  //     const copiedAmountsMap = {};
  //     copiedMonthMetadata.forEach((meta, index) => {
  //       const key = `${meta.monthNo}_${meta.year}`;
  //       copiedAmountsMap[key] = monthValues[index];
  //     });

  //     sortedDurations.forEach((duration) => {
  //       const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //       const value = copiedAmountsMap[uniqueKey];

  //       if (value && value !== "0.00" && value !== "0" && value !== "") {
  //         periodAmounts[uniqueKey] = value;
  //       }
  //     });

  //     processedEntries.push(entry);
  //     processedAmountsArray.push(periodAmounts);
  //   });

  //   setNewEntries(processedEntries);
  //   setNewEntryPeriodAmountsArray(processedAmountsArray);

  //   processedEntries.forEach((entry, index) => {
  //     fetchSuggestionsForPastedEntry(index, entry);
  //   });

  //   setHasClipboardData(false);
  //   setCopiedRowsData([]);
  //   setCopiedMonthMetadata([]);

  //   toast.success(
  //     `Pasted ${processedEntries.length} entries for fiscal year ${propFiscalYear}!`,
  //     { autoClose: 3000 }
  //   );
  // };

  // **NEW OPTIMIZED FUNCTION** - Fetches all data with minimal API calls
//   const fetchAllSuggestionsOptimizedForAmounts = async (processedEntries) => {
//     if (processedEntries.length === 0) return;

//     const encodedProjectId = encodeURIComponent(projectId);

//     try {
//       // **STEP 1: Fetch common project-level data ONCE**
//       let projectData = cachedProjectData;
//       let orgOptions = cachedOrgData;

//       // Fetch project data if not cached
//       if (!projectData) {
//         const projectResponse = await axios.get(
//           `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
//         );
//         projectData = Array.isArray(projectResponse.data)
//           ? projectResponse.data[0]
//           : projectResponse.data;
//         setCachedProjectData(projectData);
//       }

//       // Fetch org data if not cached
//       if (!orgOptions) {
//         const orgResponse = await axios.get(
//           `${backendUrl}/Orgnization/GetAllOrgs`
//         );
//         orgOptions = Array.isArray(orgResponse.data)
//           ? orgResponse.data.map((org) => ({
//               value: org.orgId,
//               label: org.orgId,
//             }))
//           : [];
//         setCachedOrgData(orgOptions);
//       }

//       // **STEP 2: Group entries by idType to minimize API calls**
//       const employeeEntries = [];
//       const vendorEntries = [];

//       processedEntries.forEach((entry, index) => {
//         if (entry.idType === "Employee") {
//           employeeEntries.push({ entry, index });
//         } else if (
//           entry.idType === "Vendor" ||
//           entry.idType === "Vendor Employee"
//         ) {
//           vendorEntries.push({ entry, index });
//         }
//       });

//       // **STEP 3: Fetch employee suggestions ONCE per type**
//       let employeeSuggestions = [];
//       let vendorSuggestions = [];

//       // Fetch Employee suggestions only if there are Employee entries
//       if (employeeEntries.length > 0) {
//         try {
//           const response = await axios.get(
//             `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`
//           );
//           employeeSuggestions = Array.isArray(response.data)
//             ? response.data.map((emp) => {
//                 const [lastName, firstName] = (emp.employeeName || "")
//                   .split(", ")
//                   .map((str) => str.trim());
//                 return {
//                   emplId: emp.empId,
//                   firstName: firstName || "",
//                   lastName: lastName || "",
//                   orgId: emp.orgId || "",
//                   acctId: emp.acctId || "",
//                 };
//               })
//             : [];
//         } catch (err) {
//           console.error("Failed to fetch employee suggestions:", err);
//         }
//       }

//       // Fetch Vendor suggestions only if there are Vendor entries
//       if (vendorEntries.length > 0) {
//         try {
//           const response = await axios.get(
//             `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
//           );
//           vendorSuggestions = Array.isArray(response.data)
//             ? response.data.map((emp) => ({
//                 emplId: emp.vendId || emp.empId,
//                 firstName: "",
//                 lastName: emp.employeeName,
//                 orgId: emp.orgId || "",
//                 acctId: emp.acctId || "",
//               }))
//             : [];
//         } catch (err) {
//           console.error("Failed to fetch vendor suggestions:", err);
//         }
//       }

//       // **STEP 4: Apply cached data to all entries**
//       processedEntries.forEach((entry, entryIndex) => {
//         // Set employee/vendor suggestions based on type
//         if (entry.idType === "Employee") {
//           setPastedEntrySuggestions((prev) => ({
//             ...prev,
//             [entryIndex]: employeeSuggestions,
//           }));
//         } else if (
//           entry.idType === "Vendor" ||
//           entry.idType === "Vendor Employee"
//         ) {
//           setPastedEntrySuggestions((prev) => ({
//             ...prev,
//             [entryIndex]: vendorSuggestions,
//           }));
//         }

//         // Set account options based on idType
//         // let accountsWithNames = [];
//         // if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
//         //   accountsWithNames = Array.isArray(
//         //     projectData.subContractorNonLaborAccounts
//         //   )
//         //     ? projectData.subContractorNonLaborAccounts.map((account) => ({
//         //         id: account.accountId || account,
//         //         name: account.acctName || account.accountId || String(account),
//         //       }))
//         //     : [];
//         // } else if (entry.idType === "Employee") {
//         //   accountsWithNames = Array.isArray(
//         //     projectData.employeeNonLaborAccounts
//         //   )
//         //     ? projectData.employeeNonLaborAccounts.map((account) => ({
//         //         id: account.accountId || account,
//         //         name: account.acctName || account.accountId || String(account),
//         //       }))
//         //     : [];
//         // } else if (entry.idType === "Other") {
//         //   accountsWithNames = Array.isArray(
//         //     projectData.otherDirectCostLaborAccounts
//         //   )
//         //     ? projectData.otherDirectCostLaborAccounts.map((account) => ({
//         //         id: account.accountId || account,
//         //         name: account.acctName || account.accountId || String(account),
//         //       }))
//         //     : [];
//         // }

//         // setPastedEntryAccounts((prev) => ({
//         //   ...prev,
//         //   [entryIndex]: accountsWithNames,
//         // }));
//         if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
//   accountsWithNames = Array.isArray(projectData.subContractorNonLaborAccounts)
//     ? projectData.subContractorNonLaborAccounts.map((account) => ({
//         id: account.accountId || account,
//         name: account.acctName || account.accountId || String(account),
//       }))
//     : [];
// } else if (entry.idType === "Other") {  // ADD THIS CONDITION
//   accountsWithNames = Array.isArray(projectData.otherDirectCostNonLaborAccounts)
//     ? projectData.otherDirectCostNonLaborAccounts.map((account) => ({
//         id: account.accountId || account,
//         name: account.acctName || account.accountId || String(account),
//       }))
//     : [];
// } else if (entry.idType === "Employee") {
//   accountsWithNames = Array.isArray(projectData.employeeNonLaborAccounts)
//     ? projectData.employeeNonLaborAccounts.map((account) => ({
//         id: account.accountId || account,
//         name: account.acctName || account.accountId || String(account),
//       }))
//     : [];
// }

// setPastedEntryAccounts((prev) => ({
//   ...prev,
//   [entryIndex]: accountsWithNames,
// }));

//         // Set org options (same for all)
//         setPastedEntryOrgs((prev) => ({
//           ...prev,
//           [entryIndex]: orgOptions,
//         }));
//       });
//     } catch (err) {
//       console.error("Failed to fetch suggestions for pasted entries:", err);
//     }
//   };
const fetchAllSuggestionsOptimizedForAmounts = async (processedEntries) => {
  if (processedEntries.length === 0) return;

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
            label: org.orgId,
          }))
        : [];
      setCachedOrgData(orgOptions);
    }

    // **STEP 2: Group entries by idType to minimize API calls**
    const employeeEntries = [];
    const vendorEntries = [];

    processedEntries.forEach((entry, index) => {
      if (entry.idType === "Employee") {
        employeeEntries.push({ entry, index });
      } else if (
        entry.idType === "Vendor" ||
        entry.idType === "Vendor Employee"
      ) {
        vendorEntries.push({ entry, index });
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
              const [lastName, firstName] = (emp.employeeName || "")
                .split(", ")
                .map((str) => str.trim());
              return {
                emplId: emp.empId,
                firstName: firstName || "",
                lastName: lastName || "",
                orgId: emp.orgId || "",
                acctId: emp.acctId || "",
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
              emplId: emp.vendId || emp.empId,
              firstName: "",
              lastName: emp.employeeName,
              orgId: emp.orgId || "",
              acctId: emp.acctId || "",
            }))
          : [];
      } catch (err) {
        console.error("Failed to fetch vendor suggestions:", err);
      }
    }

    // **STEP 4: Apply cached data to all entries**
    processedEntries.forEach((entry, entryIndex) => {
      // Set employee/vendor suggestions based on type
      if (entry.idType === "Employee") {
        setPastedEntrySuggestions((prev) => ({
          ...prev,
          [entryIndex]: employeeSuggestions,
        }));
      } else if (
        entry.idType === "Vendor" ||
        entry.idType === "Vendor Employee"
      ) {
        setPastedEntrySuggestions((prev) => ({
          ...prev,
          [entryIndex]: vendorSuggestions,
        }));
      }

      // Set account options based on idType
      let accountsWithNames = [];
      
      if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
        accountsWithNames = Array.isArray(projectData.subContractorNonLaborAccounts)
          ? projectData.subContractorNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            }))
          : [];
      } else if (entry.idType === "Other") {
        accountsWithNames = Array.isArray(projectData.otherDirectCostNonLaborAccounts)
          ? projectData.otherDirectCostNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            }))
          : [];
      } else if (entry.idType === "Employee") {
        accountsWithNames = Array.isArray(projectData.employeeNonLaborAccounts)
          ? projectData.employeeNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
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
    });
  } catch (err) {
    console.error("Failed to fetch suggestions for pasted entries:", err);
  }
};


  // const handlePasteMultipleRows = async () => {
  //   if (copiedRowsData.length === 0) {
  //     toast.error("No copied data available to paste", { autoClose: 2000 });
  //     return;
  //   }

  //   if (showNewForm) {
  //     setShowNewForm(false);
  //   }

  //   // USE ALL DURATIONS (not filtered) - same as what was copied
  //   const allDurations = [...durations].sort((a, b) => {
  //     if (a.year !== b.year) return a.year - b.year;
  //     return a.monthNo - b.monthNo;
  //   });

  //   const processedEntries = [];
  //   const processedAmountsArray = [];

  //   copiedRowsData.forEach((rowData) => {
  //     const [
  //       idTypeLabel,
  //       id,
  //       name,
  //       acctId,
  //       acctName,
  //       orgId,
  //       isRev,
  //       isBrd,
  //       status,
  //       total,
  //       ...monthValues
  //     ] = rowData;

  //     const idType =
  //       ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
  //       idTypeLabel;

  //     let firstName = "";
  //     let lastName = "";

  //     if (idType === "Vendor" || idType === "Vendor Employee") {
  //       lastName = name;
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
  //       perHourRate: "",
  //       status: status || "ACT",
  //       isRev: isRev === "✓",
  //       isBrd: isBrd === "✓",
  //     };

  //     const periodAmounts = {};

  //     copiedMonthMetadata.forEach((meta, index) => {
  //       const uniqueKey = `${meta.monthNo}_${meta.year}`;
  //       const value = monthValues[index];

  //       if (value && value !== "0.00" && value !== "0" && value !== "") {
  //         periodAmounts[uniqueKey] = value;
  //       }
  //     });

  //     processedEntries.push(entry);
  //     processedAmountsArray.push(periodAmounts);
  //   });

  //   setNewEntries(processedEntries);
  //   setNewEntryPeriodAmountsArray(processedAmountsArray);

  //   // **OPTIMIZED: Fetch common data ONCE, then populate all entries**
  //   await fetchAllSuggestionsOptimizedForAmounts(processedEntries);

  //   setHasClipboardData(false);
  //   setCopiedRowsData([]);
  //   setCopiedMonthMetadata([]);

  //   toast.success(
  //     `Pasted ${processedEntries.length} entries with all fiscal year data!`,
  //     { autoClose: 3000 }
  //   );
  // };

  const handlePasteMultipleRows = async () => {
    if (copiedRowsData.length === 0) {
      toast.error("No copied data available to paste", { autoClose: 2000 });
      return;
    }

    if (showNewForm) {
      setShowNewForm(false);
    }

    // USE ALL DURATIONS (not filtered) - same as what was copied
    const allDurations = [...durations].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNo - b.monthNo;
    });

    const processedEntries = [];
    const processedAmountsArray = [];

    copiedRowsData.forEach((rowData) => {
      const [
        idTypeLabel,
        rawId, // Rename to rawId to process it
        name,
        acctId,
        acctName,
        orgId,
        isRev,
        isBrd,
        status,
        total,
        ...monthValues
      ] = rowData;

      const idType =
        ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
        idTypeLabel;

      // --- FIX: SANITIZE ID IMMEDIATELY ---
      const id = (rawId || "").replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
        ""
      );
      // ------------------------------------

      let firstName = "";
      let lastName = "";

      if (idType === "Vendor" || idType === "Vendor Employee") {
        lastName = name;
      } else if (idType === "Employee") {
        const nameParts = name.split(" ");
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      } else {
        firstName = name;
      }

      const entry = {
        id: id, // Use the sanitized id
        firstName: firstName,
        lastName: lastName,
        idType: idType,
        acctId: acctId,
        orgId: orgId,
        perHourRate: "",
        status: status || "ACT",
        isRev: isRev === "✓",
        isBrd: isBrd === "✓",
      };

      const periodAmounts = {};

      copiedMonthMetadata.forEach((meta, index) => {
        const uniqueKey = `${meta.monthNo}_${meta.year}`;
        const value = monthValues[index];

        if (value && value !== "0.00" && value !== "0" && value !== "") {
          periodAmounts[uniqueKey] = value;
        }
      });

      processedEntries.push(entry);
      processedAmountsArray.push(periodAmounts);
    });

    setNewEntries(processedEntries);
    setNewEntryPeriodAmountsArray(processedAmountsArray);

    // **OPTIMIZED: Fetch common data ONCE, then populate all entries**
    await fetchAllSuggestionsOptimizedForAmounts(processedEntries);

    setHasClipboardData(false);
    setCopiedRowsData([]);
    setCopiedMonthMetadata([]);

    toast.success(
      `Pasted ${processedEntries.length} entries with all fiscal year data!`,
      { autoClose: 3000 }
    );
  };

  // const handlePasteMultipleRows = () => {
  //   if (copiedRowsData.length === 0) {
  //     toast.error("No copied data available to paste", { autoClose: 2000 });
  //     return;
  //   }

  //   if (showNewForm) {
  //     setShowNewForm(false);
  //   }

  //   // USE ALL DURATIONS (not filtered) - same as what was copied
  //   const allDurations = [...durations].sort((a, b) => {
  //     if (a.year !== b.year) return a.year - b.year;
  //     return a.monthNo - b.monthNo;
  //   });

  //   const processedEntries = [];
  //   const processedAmountsArray = [];

  //   copiedRowsData.forEach((rowData) => {
  //     const [
  //       idTypeLabel,
  //       id,
  //       name,
  //       acctId,
  //       acctName,
  //       orgId,
  //       isRev,
  //       isBrd,
  //       status,
  //       total, // Added total column
  //       ...monthValues
  //     ] = rowData;

  //     const idType =
  //       ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
  //       idTypeLabel;

  //     let firstName = "";
  //     let lastName = "";

  //     if (idType === "Vendor" || idType === "Vendor Employee") {
  //       lastName = name;
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
  //       perHourRate: "",
  //       status: status || "ACT",
  //       isRev: isRev === "✓",
  //       isBrd: isBrd === "✓",
  //     };

  //     const periodAmounts = {};

  //     // Map copied months directly using copiedMonthMetadata
  //     copiedMonthMetadata.forEach((meta, index) => {
  //       const uniqueKey = `${meta.monthNo}_${meta.year}`;
  //       const value = monthValues[index];

  //       if (value && value !== "0.00" && value !== "0" && value !== "") {
  //         periodAmounts[uniqueKey] = value;
  //       }
  //     });

  //     processedEntries.push(entry);
  //     processedAmountsArray.push(periodAmounts);
  //   });

  //   setNewEntries(processedEntries);
  //   setNewEntryPeriodAmountsArray(processedAmountsArray);

  //   processedEntries.forEach((entry, index) => {
  //     fetchSuggestionsForPastedEntry(index, entry);
  //   });

  //   setHasClipboardData(false);
  //   setCopiedRowsData([]);
  //   setCopiedMonthMetadata([]);

  //   toast.success(
  //     `Pasted ${processedEntries.length} entries with all fiscal year data!`,
  //     { autoClose: 3000 }
  //   );
  // };

  // const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
  //   // if (planType === "NBBUD") return;

  //   const encodedProjectId = encodeURIComponent(projectId);
  //   const apiPlanType = planType === "NBBUD" ? "BUD" : planType;

  //   if (entry.idType && entry.idType !== "") {
  //     try {
  //       const endpoint =
  //         entry.idType === "Vendor" || entry.idType === "Vendor Employee"
  //           ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
  //           : `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`;

  //       const response = await axios.get(endpoint);
  //       const suggestions = Array.isArray(response.data)
  //         ? response.data.map((emp) => {
  //             if (
  //               entry.idType === "Vendor" ||
  //               entry.idType === "Vendor Employee"
  //             ) {
  //               return {
  //                 emplId: emp.vendId || emp.empId,
  //                 firstName: "",
  //                 lastName: emp.employeeName,
  //                 orgId: emp.orgId || "",
  //                 acctId: emp.acctId || "",
  //               };
  //             } else {
  //               const [lastName, firstName] = (emp.employeeName || "")
  //                 .split(", ")
  //                 .map((str) => str.trim());
  //               return {
  //                 emplId: emp.empId,
  //                 firstName: firstName || "",
  //                 lastName: lastName || "",
  //                 orgId: emp.orgId || "",
  //                 acctId: emp.acctId || "",
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

  //   try {
  //     const response = await axios.get(
  //       `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${apiPlanType}`
  //     );
  //     const data = Array.isArray(response.data)
  //       ? response.data[0]
  //       : response.data;

  //     let accountsWithNames = [];
  //     if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
  //       accountsWithNames = Array.isArray(data.subContractorNonLaborAccounts)
  //         ? data.subContractorNonLaborAccounts.map((account) => ({
  //             id: account.accountId || account,
  //             name: account.acctName || account.accountId || String(account),
  //           }))
  //         : [];
  //     } else {
  //       accountsWithNames = Array.isArray(data.employeeNonLaborAccounts)
  //         ? data.employeeNonLaborAccounts.map((account) => ({
  //             id: account.accountId || account,
  //             name: account.acctName || account.accountId || String(account),
  //           }))
  //         : [];
  //     }

  //     setPastedEntryAccounts((prev) => ({
  //       ...prev,
  //       [entryIndex]: accountsWithNames,
  //     }));

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
  //   } catch (err) {
  //     console.error(
  //       `Failed to fetch pasted entry options for index ${entryIndex}:`,
  //       err
  //     );
  //   }
  // };

  // Add keyboard listener for paste

  // const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
  //   const encodedProjectId = encodeURIComponent(projectId);
  //   const apiPlanType = planType === "NBBUD" ? "BUD" : planType;

  //   // Fetch employee suggestions based on ID type
  //   if (entry.idType && entry.idType !== "") {
  //     try {
  //       const endpoint =
  //         entry.idType === "Vendor" || entry.idType === "Vendor Employee"
  //           ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
  //           : `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`;

  //       const response = await axios.get(endpoint);
  //       const suggestions = Array.isArray(response.data)
  //         ? response.data.map((emp) => {
  //             if (
  //               entry.idType === "Vendor" ||
  //               entry.idType === "Vendor Employee"
  //             ) {
  //               return {
  //                 emplId: emp.vendId || emp.empId,
  //                 firstName: "",
  //                 lastName: emp.employeeName,
  //                 orgId: emp.orgId || "",
  //                 acctId: emp.acctId || "",
  //               };
  //             } else {
  //               const [lastName, firstName] = (emp.employeeName || "")
  //                 .split(", ")
  //                 .map((str) => str.trim());
  //               return {
  //                 emplId: emp.empId,
  //                 firstName: firstName || "",
  //                 lastName: lastName || "",
  //                 orgId: emp.orgId || "",
  //                 acctId: emp.acctId || "",
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

  //   // **ADD THIS SECTION** - Fetch accounts and organizations
  //   try {
  //     const response = await axios.get(
  //       `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
  //     );
  //     const data = Array.isArray(response.data)
  //       ? response.data[0]
  //       : response.data;

  //     // Fetch accounts based on ID type
  //     let accountsWithNames = [];
  //     if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
  //       accountsWithNames = Array.isArray(data.subContractorNonLaborAccounts)
  //         ? data.subContractorNonLaborAccounts.map((account) => ({
  //             id: account.accountId || account,
  //             name: account.acctName || account.accountId || String(account),
  //           }))
  //         : [];
  //     } else if (entry.idType === "Employee") {
  //       accountsWithNames = Array.isArray(data.employeeNonLaborAccounts)
  //         ? data.employeeNonLaborAccounts.map((account) => ({
  //             id: account.accountId || account,
  //             name: account.acctName || account.accountId || String(account),
  //           }))
  //         : [];
  //     } else if (entry.idType === "Other") {
  //       accountsWithNames = Array.isArray(data.otherDirectCostLaborAccounts)
  //         ? data.otherDirectCostLaborAccounts.map((account) => ({
  //             id: account.accountId || account,
  //             name: account.acctName || account.accountId || String(account),
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
  //   } catch (err) {
  //     console.error(
  //       `Failed to fetch pasted entry options for index ${entryIndex}:`,
  //       err
  //     );
  //   }
  // };

  // Clear cache when project or plan type changes
  // useEffect(() => {
  //   setCachedProjectData(null);
  //   setCachedOrgData(null);
  // }, [projectId, planType]);

  //   const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
  //   const encodedProjectId = encodeURIComponent(projectId);

  //   // Fetch employee suggestions based on ID type (entry-specific, must be called per entry)
  //   if (entry.idType && entry.idType !== "") {
  //     try {
  //       const endpoint =
  //         entry.idType === "Vendor" || entry.idType === "Vendor Employee"
  //           ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
  //           : `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`;

  //       const response = await axios.get(endpoint);
  //       const suggestions = Array.isArray(response.data)
  //         ? response.data.map((emp) => {
  //             if (
  //               entry.idType === "Vendor" ||
  //               entry.idType === "Vendor Employee"
  //             ) {
  //               return {
  //                 emplId: emp.vendId || emp.empId,
  //                 firstName: "",
  //                 lastName: emp.employeeName,
  //                 orgId: emp.orgId || "",
  //                 acctId: emp.acctId || "",
  //               };
  //             } else {
  //               const [lastName, firstName] = (emp.employeeName || "")
  //                 .split(", ")
  //                 .map((str) => str.trim());
  //               return {
  //                 emplId: emp.empId,
  //                 firstName: firstName || "",
  //                 lastName: lastName || "",
  //                 orgId: emp.orgId || "",
  //                 acctId: emp.acctId || "",
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

  //   // **OPTIMIZED** - Use cached project and org data instead of fetching for each entry
  //   try {
  //     let projectData = cachedProjectData;
  //     let orgOptions = cachedOrgData;

  //     // Only fetch project data if not already cached
  //     if (!projectData) {
  //       const response = await axios.get(
  //         `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
  //       );
  //       projectData = Array.isArray(response.data)
  //         ? response.data[0]
  //         : response.data;
  //       setCachedProjectData(projectData);
  //     }

  //     // Only fetch org data if not already cached
  //     if (!orgOptions) {
  //       const orgResponse = await axios.get(`${backendUrl}/Orgnization/GetAllOrgs`);
  //       orgOptions = Array.isArray(orgResponse.data)
  //         ? orgResponse.data.map((org) => ({
  //             value: org.orgId,
  //             label: org.orgId,
  //           }))
  //         : [];
  //       setCachedOrgData(orgOptions);
  //     }

  //     // Now use the cached data to populate entry-specific options
  //     let accountsWithNames = [];
  //     if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
  //       accountsWithNames = Array.isArray(projectData.subContractorNonLaborAccounts)
  //         ? projectData.subContractorNonLaborAccounts.map((account) => ({
  //             id: account.accountId || account,
  //             name: account.acctName || account.accountId || String(account),
  //           }))
  //         : [];
  //     } else if (entry.idType === "Employee") {
  //       accountsWithNames = Array.isArray(projectData.employeeNonLaborAccounts)
  //         ? projectData.employeeNonLaborAccounts.map((account) => ({
  //             id: account.accountId || account,
  //             name: account.acctName || account.accountId || String(account),
  //           }))
  //         : [];
  //     } else if (entry.idType === "Other") {
  //       accountsWithNames = Array.isArray(projectData.otherDirectCostLaborAccounts)
  //         ? projectData.otherDirectCostLaborAccounts.map((account) => ({
  //             id: account.accountId || account,
  //             name: account.acctName || account.accountId || String(account),
  //           }))
  //         : [];
  //     }

  //     setPastedEntryAccounts((prev) => ({
  //       ...prev,
  //       [entryIndex]: accountsWithNames,
  //     }));

  //     setPastedEntryOrgs((prev) => ({
  //       ...prev,
  //       [entryIndex]: orgOptions,
  //     }));
  //   } catch (err) {
  //     console.error(
  //       `Failed to fetch pasted entry options for index ${entryIndex}:`,
  //       err
  //     );
  //   }
  // };

  // Clear cache when project or plan type changes
  // Clear cache when project or plan type changes

  const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
    const encodedProjectId = encodeURIComponent(projectId);

    // **OPTIMIZATION: Use cached data instead of fetching for each entry**
    try {
      let projectData = cachedProjectData;
      let orgOptions = cachedOrgData;
      let employeeSuggestions = [];
      let vendorSuggestions = [];

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
              label: org.orgId,
            }))
          : [];
        setCachedOrgData(orgOptions);
      }

      // **NEW: Fetch employee suggestions ONCE and cache**
      if (entry.idType === "Employee") {
        // Check if already fetched
        const cacheKey = `employee_${projectId}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          employeeSuggestions = JSON.parse(cached);
        } else {
          const response = await axios.get(
            `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`
          );
          employeeSuggestions = Array.isArray(response.data)
            ? response.data.map((emp) => {
                const [lastName, firstName] = (emp.employeeName || "")
                  .split(", ")
                  .map((str) => str.trim());
                return {
                  emplId: emp.empId,
                  firstName: firstName || "",
                  lastName: lastName || "",
                  orgId: emp.orgId || "",
                  acctId: emp.acctId || "",
                };
              })
            : [];
          sessionStorage.setItem(cacheKey, JSON.stringify(employeeSuggestions));
        }

        setPastedEntrySuggestions((prev) => ({
          ...prev,
          [entryIndex]: employeeSuggestions,
        }));
      } else if (
        entry.idType === "Vendor" ||
        entry.idType === "Vendor Employee"
      ) {
        // Check if already fetched
        const cacheKey = `vendor_${projectId}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          vendorSuggestions = JSON.parse(cached);
        } else {
          const response = await axios.get(
            `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
          );
          vendorSuggestions = Array.isArray(response.data)
            ? response.data.map((emp) => ({
                emplId: emp.vendId || emp.empId,
                firstName: "",
                lastName: emp.employeeName,
                orgId: emp.orgId || "",
                acctId: emp.acctId || "",
              }))
            : [];
          sessionStorage.setItem(cacheKey, JSON.stringify(vendorSuggestions));
        }

        setPastedEntrySuggestions((prev) => ({
          ...prev,
          [entryIndex]: vendorSuggestions,
        }));
      }

      // Now use the cached data to populate entry-specific options
      let accountsWithNames = [];
      if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
        accountsWithNames = Array.isArray(
          projectData.subContractorNonLaborAccounts
        )
          ? projectData.subContractorNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            }))
          : [];
      } else if (entry.idType === "Employee") {
        accountsWithNames = Array.isArray(projectData.employeeNonLaborAccounts)
          ? projectData.employeeNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            }))
          : [];
      } else if (entry.idType === "Other") {
        accountsWithNames = Array.isArray(
          projectData.otherDirectCostNonLaborAccounts
        )
          ? projectData.otherDirectCostNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            }))
          : [];
      }

      setPastedEntryAccounts((prev) => ({
        ...prev,
        [entryIndex]: accountsWithNames,
      }));

      setPastedEntryOrgs((prev) => ({
        ...prev,
        [entryIndex]: orgOptions,
      }));
    } catch (err) {
      console.error(
        `Failed to fetch pasted entry options for index ${entryIndex}:`,
        err
      );
    }
  };

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
      perHourRate: "",
      status: "Act",
    };
    setNewEntries((prev) => [...prev, newEntry]);
    setNewEntryPeriodAmountsArray((prev) => [...prev, {}]);
  };

  const removeNewEntryForm = (index) => {
    setNewEntries((prev) => prev.filter((_, i) => i !== index));
    setNewEntryPeriodAmountsArray((prev) => prev.filter((_, i) => i !== index));
  };

  const updateNewEntry = (index, updates) => {
    setNewEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry))
    );
  };

  const updateNewEntryPeriodAmounts = (index, periodAmounts) => {
    setNewEntryPeriodAmountsArray((prev) =>
      prev.map((amounts, i) =>
        i === index ? { ...amounts, ...periodAmounts } : amounts
      )
    );
  };

  return (
    <div className="relative p-4 font-inter w-full synchronized-tables-outer">
      <div className="w-full flex justify-between mb-4 gap-2">
        <div className="flex-grow"></div>
        <div className="flex gap-2">
          {Object.values(hiddenRows).some(Boolean) && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
              onClick={showHiddenRows}
            >
              Show Hidden Rows
            </button>
          )}

          {isEditable && (
            <button
              onClick={() => {
                if (showNewForm) {
                  // Cancel new form
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
                    perHourRate: "",
                    status: "Act",
                  });
                  setNewEntryPeriodAmounts({});
                  setEmployeeSuggestions([]);
                  setEmployeeNonLaborAccounts([]);
                  setSubContractorNonLaborAccounts([]);
                } else if (newEntries.length > 0) {
                  // Cancel pasted entries
                  setNewEntries([]);
                  setNewEntryPeriodAmountsArray([]);
                  setPastedEntrySuggestions({});
                  setPastedEntryAccounts({});
                  setPastedEntryOrgs({});
                  toast.info("Cancelled pasted entries", { autoClose: 1500 });
                } else {
                  // Show new form
                  setShowNewForm(true);
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
            >
              {showNewForm || newEntries.length > 0 ? "Cancel" : "New"}
            </button>
          )}

          {/* Copy/Paste Buttons */}
          {showCopyButton && newEntries.length === 0 && (
            <button
              onClick={handleCopySelectedRows}
              className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700"
            >
              Copy Selected ({selectedRows.size})
            </button>
          )}

          {/* Paste button - only show when has clipboard data and NOT in new form mode */}
          {/* {hasClipboardData && !showNewForm && newEntries.length === 0 && status === "In Progress" && (
            <button
              onClick={handlePasteMultipleRows}
              className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-md hover:bg-purple-700"
            >
              Paste ({copiedRowsData.length} data)
            </button>
          )} */}
          {/* {hasClipboardData && !showNewForm && newEntries.length === 0    (
  <button
    onClick={handlePasteMultipleRows}
    className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-md hover:bg-purple-700"
  >
    Paste ({copiedRowsData.length} rows)
  </button>
)} */}

          {hasClipboardData &&
            !showNewForm &&
            newEntries.length === 0 &&
            initialData.status === "In Progress" && (
              <button
                onClick={handlePasteMultipleRows}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-md hover:bg-purple-700"
              >
                Paste ({copiedRowsData.length} rows)
              </button>
            )}

          {/* Save Entry Button - Shows for BOTH single new form AND pasted entries */}
          {/* {(showNewForm || newEntries.length > 0) && (
    <button
      onClick={() => {
        if (newEntries.length > 0) {
          // Save all pasted entries using existing logic
          handleSaveNewEntry(); // You'll need to modify this to handle multiple
        } else {
          // Save single new entry
          handleSaveNewEntry();
        }
      }}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
    >
      {newEntries.length > 0 ? `Save All (${newEntries.length})` : "Save Entry"}
    </button>
  )} */}
          {/* Save Entry Button - Shows for BOTH single new form AND pasted entries */}
          {(showNewForm || newEntries.length > 0) && (
            <button
              onClick={() => {
                if (newEntries.length > 0) {
                  // Save all pasted entries using NEW function
                  handleSaveMultiplePastedEntries();
                } else {
                  // Save single new entry
                  handleSaveNewEntry();
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
              disabled={isLoading}
            >
              {isLoading
                ? "Saving..."
                : newEntries.length > 0
                ? `Save All (${newEntries.length})`
                : "Save Entry"}
            </button>
          )}

          {!showNewForm && !shouldHideButtons && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
              onClick={() => {
                if (isEditable) {
                  setShowFindReplace(true);
                }
              }}
            >
              Find / Replace
            </button>
          )}

          {/* <button
    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium"
    onClick={() => {
      if (!selectedEmployeeId) {
        toast.error("Please select an employee to delete");
        return;
      }
      handleDeleteEmployee(selectedEmployeeId);
    }}
  >
    Delete
  </button> */}

          {/* Delete Button */}
          {!shouldHideButtons && (
            <button
              className={`px-4 py-2 text-white rounded transition text-xs font-medium ${
                shouldDisableDelete
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
                  setSelectedEmployeeId(null);
                }
              }}
              disabled={shouldDisableDelete}
            >
              Delete
            </button>
          )}

          {/* {showNewForm && (
    <button
      onClick={handleSaveNewEntry}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
    >
      Save Entry
    </button>
  )} */}

          {showNewForm && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
              onClick={() => {
                if (isEditable) {
                  setShowFillValues(true);
                }
              }}
            >
              Fill Values
            </button>
          )}

          {/* Combined Save button for both amounts and field changes */}
          {/* {(hasUnsavedAmountChanges || hasUnsavedFieldChanges) && (
    <button
      onClick={handleSaveAllChanges}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
      disabled={isLoading}
    >
      {isLoading ? "Saving..." : "Save"}
    </button>
  )} */}
          {/* Combined Save and Cancel buttons for both amounts and field changes */}
          {(hasUnsavedAmountChanges || hasUnsavedFieldChanges) && (
            <>
              <button
                onClick={handleSaveAllChanges}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : `Save Changes (${
                      Object.keys(modifiedAmounts).length +
                      (hasUnsavedFieldChanges ? 1 : 0)
                    })`}
              </button>
              <button
                onClick={handleCancelAllChanges}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
            </>
          )}
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
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Start Period
              </label>
              <input
                type="text"
                value={startDate}
                readOnly
                className="w-full border border-gray-300 rounded-md p-2 text-xs bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                End Period
              </label>
              <input
                type="text"
                value={endDate}
                readOnly
                className="w-full border border-gray-300 rounded-md p-2 text-xs bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFillValues(false);
                  setFillMethod("None");
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

      {employees.length === 0 && !showNewForm && sortedDurations.length > 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs">
          No forecast data available for this plan.
        </div>
      ) : (
        // <div ref={verticalScrollRef} className="vertical-scroll-wrapper">
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
              <table className="table-fixed min-w-full table">
                <thead className="thead">
                  <tr
                    style={{
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      lineHeight: "normal",
                    }}
                  >
                    {EMPLOYEE_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="th-thead whitespace-nowrap   min-w-[70px]" // Changed p-2 to p-1.5, min-w-[80px] to min-w-[70px]
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tbody">
                  {showNewForm && (
                    <tr
                      key="new-entry"
                      // className="bg-gray-50"
                      style={{
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        lineHeight: "normal",
                      }}
                    >
                      <td className="tbody-td">
                        {" "}
                        {/* Changed px-2 to px-1.5 */}
                        <select
                          name="idType"
                          value={newEntry.idType || ""}
                          // onChange={(e) =>
                          //   setNewEntry({ ...newEntry, idType: e.target.value })
                          // }
                          onChange={(e) => resetNewEntry(e.target.value)}
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
                        {" "}
                        {/* Changed px-2 to px-1.5 */}
                        <input
                          type="text"
                          name="id"
                          value={newEntry.id}
                          onChange={(e) => handleIdChange(e.target.value)}
                          className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                          list="employee-id-list"
                          placeholder="Enter ID"
                        />
                        {newEntry.idType !== "Other" && (
                          <datalist id="employee-id-list">
                            {employeeSuggestions
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
                        )}
                      </td>
                      <td className="tbody-td">
                        {" "}
                        {/* Changed px-2 to px-1.5 */}
                        {/* <input
                        type="text"
                        name="name"
                        value={
                          newEntry.lastName && newEntry.firstName
                            ? `${newEntry.lastName}, ${newEntry.firstName}`
                            : newEntry.lastName || newEntry.firstName || ""
                        }
                        readOnly
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100 cursor-not-allowed"
                        placeholder="Name (auto-filled)"
                      /> */}
                        {/* <input
                          type="text"
                          name="name"
                          value={
                            newEntry.idType === "Other"
                              ? // For "Other", combine firstName and lastName if desired, or allow raw input
                                (newEntry.firstName || "") +
                                (newEntry.lastName
                                  ? " " + newEntry.lastName
                                  : "")
                              : newEntry.lastName && newEntry.firstName
                              ? `${newEntry.lastName}, ${newEntry.firstName}`
                              : newEntry.lastName || newEntry.firstName || ""
                          }
                          readOnly={newEntry.idType !== "Other"}
                          className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                            newEntry.idType === "Other"
                              ? "bg-white cursor-text"
                              : "bg-gray-100 cursor-not-allowed"
                          }`}
                          placeholder="Name (auto-filled or editable for 'Other')"
                          onChange={(e) => {
                            if (newEntry.idType === "Other") {
                              const fullName = e.target.value.trim();
                              const parts = fullName.split(" ");
                              const firstName = parts[0] || "";
                              const lastName = parts.slice(1).join(" ") || "";
                              setNewEntry((prev) => ({
                                ...prev,
                                firstName,
                                lastName,
                              }));
                            }
                          }}
                        /> */}
                    <input
  type="text"
  name="name"
  value={
    newEntry.idType === "Other"
      ? (newEntry.firstName || "") + (newEntry.lastName ? " " + newEntry.lastName : "")
      : newEntry.lastName && newEntry.firstName
      ? `${newEntry.lastName}, ${newEntry.firstName}`
      : newEntry.lastName || newEntry.firstName || ""
  }
  readOnly={newEntry.idType !== "Other"}
  className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
    newEntry.idType === "Other"
      ? "bg-white cursor-text"
      : "bg-gray-100 cursor-not-allowed"
  }`}
  placeholder="Name (auto-filled or editable for 'Other')"
  onChange={(e) => {
    if (newEntry.idType === "Other") {
      const rawInput = e.target.value;

      // --- FIX: REMOVE EMOJIS ---
      const noEmojiInput = rawInput.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F0F5}\u{1F200}-\u{1F270}]/gu, "");

      // --- FIX: ALLOW SPACES ---
      // Do NOT split here. Store the full string in firstName.
      // This ensures "John " (with a space) is stored as-is in state.
      setNewEntry((prev) => ({
        ...prev,
        firstName: noEmojiInput,
        lastName: "" // Clear lastName to avoid duplication in the 'value' prop logic above
      }));
    }
  }}
/>
                      </td>
                      <td className="tbody-td">
                        {" "}
                        {/* <input
                          type="text"
                          name="acctId"
                          value={newEntry.acctId}
                          // onChange={(e) =>
                          //   isBudPlan &&
                          //   setNewEntry({ ...newEntry, acctId: e.target.value })
                          // }
                          onChange={(e) =>
                            isFieldEditable &&
                            setNewEntry({ ...newEntry, acctId: e.target.value })
                          }
                          className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                            !isFieldEditable
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                          onBlur={(e) => {
                            const val = e.target.value.trim();

                            // Build valid accounts list
                            const validAccounts =
                              newEntry.idType === "Vendor" ||
                              newEntry.idType === "Vendor Employee"
                                ? subContractorNonLaborAccounts.map(
                                    (a) => a.id || a.accountId || ""
                                  )
                                 : newEntry.idType === "Other"  // ADD THIS CONDITION
          ? otherDirectCostNonLaborAccounts.map((a) => a.id || a.accountId || "")
                                : employeeNonLaborAccounts.map(
                                    (a) => a.id || a.accountId || ""
                                  );

                            if (val !== "" && !validAccounts.includes(val)) {
                              toast.error(
                                "Please select a valid account from suggestions"
                              );
                              setNewEntry((prev) => ({ ...prev, acctId: "" })); // reset
                            }
                          }}
                          list="account-list"
                          placeholder="Enter Account"
                          // readOnly={!isBudPlan}
                          readOnly={!isFieldEditable}
                        /> */}
                        <input
  type="text"
  name="acctId"
  value={newEntry.acctId}
  onChange={(e) => {
    const val = e.target.value;
    
    // Determine correct account list
    const accountList = 
      newEntry.idType === 'Vendor' || newEntry.idType === 'Vendor Employee'
        ? subContractorNonLaborAccounts
        : newEntry.idType === 'Other'
        ? otherDirectCostNonLaborAccounts
        : employeeNonLaborAccounts;
    
    // Find matching account
    const accountWithName = accountList.find(acc => 
      (acc.id || acc.accountId) === val
    );
    
    // Update BOTH acctId and acctName
    setNewEntry({
      ...newEntry,
      acctId: val,
      acctName: accountWithName ? (accountWithName.name || accountWithName.acctName) : '',
    });
  }}
  list="account-list"
  className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
  placeholder="Enter Account"
/>

                  

                        <datalist id="account-list">
                          {(newEntry.idType === "Vendor" ||
                          newEntry.idType === "Vendor Employee"
                            ? subContractorNonLaborAccounts
                             : newEntry.idType === "Other"  // ADD THIS CONDITION
      ? otherDirectCostNonLaborAccounts
                            : employeeNonLaborAccounts
                          ).map((account, index) => {
                            const valueText =
                              account.id || account.accountId || "";
                            // const displayText =
                            //   account.name ||
                            //   account.acctName ||
                            //   account.accountId ||
                            //   valueText;
                            return (
                              <option
                                key={`${valueText}-${index}`}
                                value={valueText}
                              >
                                {/* {displayText} */}
                              </option>
                            );
                          })}
                        </datalist>
                        {/* Changed px-2 to px-1.5 */}
                        {/* <input
                          type="text"
                          name="acctId"
                          value={newEntry.acctId}
                          onChange={(e) =>
                            isBudPlan &&
                            setNewEntry({ ...newEntry, acctId: e.target.value })
                          }
                          className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                            !isBudPlan ? "bg-gray-100 cursor-not-allowed" : ""
                          }`}
                          list="account-list"
                          placeholder="Enter Account"
                          readOnly={!isBudPlan}
                        /> */}
                        {/* <datalist id="account-list">
                            {nonLaborAccounts.map((account, index) => (
                              <option
                                key={`${account.id}-${index}`}
                                value={account.id}
                              >
                                {account.id}
                              </option>
                            ))}
                          </datalist> */}
                        {/* <datalist id="account-list">
                          {(newEntry.idType === "Vendor" ||
                          newEntry.idType === "Vendor Employee"
                            ? subContractorNonLaborAccounts
                            : employeeNonLaborAccounts
                          ).map((account, index) => {
                            const valueText =
                              account.id || account.accountId || ""; // safe fallback
                            const displayText =
                              account.name ||
                              account.acctName ||
                              account.accountId ||
                              valueText;

                            return (
                              <option
                                key={`${valueText}-${index}`}
                                value={valueText}
                              >
                                {displayText}
                              </option>
                            );
                          })}
                        </datalist> */}
                      </td>
                      {/* ADD THIS NEW TD FOR ACCOUNT NAME */}
                      <td className="tbody-td">
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
                      <td className="tbody-td">
                        {" "}
                        {/* Changed px-2 to px-1.5 */}
                        {/* <input
                          type="text"
                          name="orgId"
                          value={newEntry.orgId}
                          onChange={(e) =>
                            isBudPlan &&
                            setNewEntry({ ...newEntry, orgId: e.target.value })
                          }
                          className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                            !isBudPlan ? "bg-gray-100 cursor-not-allowed" : ""
                          }`}
                          placeholder="Enter Organization"
                          list="organization-list"
                          readOnly={!isBudPlan}
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
                        </datalist> */}
                        <input
                          type="text"
                          name="orgId"
                          value={newEntry.orgId}
                          // onChange={(e) =>
                          //   isBudPlan &&
                          //   setNewEntry({ ...newEntry, orgId: e.target.value })
                          // }
                          onChange={(e) =>
                            isFieldEditable &&
                            setNewEntry({ ...newEntry, orgId: e.target.value })
                          }
                          className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                            !isFieldEditable
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            const validOrgs = organizationOptions.map(
                              (org) => org.value
                            );

                            if (val !== "" && !validOrgs.includes(val)) {
                              toast.error(
                                "Please select a valid organization from suggestions"
                              );
                              setNewEntry((prev) => ({ ...prev, orgId: "" })); // reset
                            }
                          }}
                          placeholder="Enter Organization"
                          list="organization-list"
                          // readOnly={!isBudPlan}
                          readOnly={!isFieldEditable}
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

                      <td className="tbody-td text-center">
                        {" "}
                        {/* Changed px-2 to px-1.5 */}
                        <input
                          type="checkbox"
                          name="isRev"
                          checked={newEntry.isRev}
                          // onChange={(e) =>
                          //   isBudPlan &&
                          //   setNewEntry({
                          //     ...newEntry,
                          //     isRev: e.target.checked,
                          //   })
                          // }
                          onChange={(e) =>
                            isFieldEditable &&
                            setNewEntry({
                              ...newEntry,
                              isRev: e.target.checked,
                            })
                          }
                          className={`w-4 h-4 ${
                            !isFieldEditable ? "cursor-not-allowed" : ""
                          }`}
                          // className={`w-4 h-4 ${
                          //   !isBudPlan ? "cursor-not-allowed" : ""
                          // }`}
                          // disabled={!isBudPlan}
                          disabled={!isFieldEditable}
                        />
                      </td>
                      <td className="tbody-td text-center">
                        {" "}
                        {/* Changed px-2 to px-1.5 */}
                        <input
                          type="checkbox"
                          name="isBrd"
                          checked={newEntry.isBrd}
                          // onChange={(e) =>
                          //   isBudPlan &&
                          //   setNewEntry({
                          //     ...newEntry,
                          //     isBrd: e.target.checked,
                          //   })
                          // }
                          onChange={(e) =>
                            isFieldEditable &&
                            setNewEntry({
                              ...newEntry,
                              isBrd: e.target.checked,
                            })
                          }
                          className={`w-4 h-4 ${
                            !isFieldEditable ? "cursor-not-allowed" : ""
                          }`}
                          // className={`w-4 h-4 ${
                          //   !isBudPlan ? "cursor-not-allowed" : ""
                          // }`}
                          // disabled={!isBudPlan}
                          disabled={!isFieldEditable}
                        />
                      </td>
                      <td className="tbody-td">
                        {" "}
                        {/* Changed px-2 to px-1.5 */}
                        <input
                          type="text"
                          name="status"
                          value={newEntry.status}
                          onChange={(e) =>
                            setNewEntry({ ...newEntry, status: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                          placeholder="Enter Status"
                          disabled={newEntry.idType === "Other"}
                          readOnly={newEntry.idType === "Other"}
                        />
                      </td>
                      <td className="tbody-td">
                        {" "}
                        {/* Changed px-2 to px-1.5 */}
                        {Object.values(newEntryPeriodAmounts)
                          .reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Pasted Entries */}
                  {/* Pasted Entries */}
              {newEntries.length > 0 &&
  newEntries.map((entry, entryIndex) => (
    <React.Fragment key={`pasted-entry-${entryIndex}`}>
      <tr
        style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}
      >
        {/* ID Type - Dropdown (EDITABLE) */}
        <td className="tbody-td">
          <select
            value={entry.idType}
            onChange={(e) => {
              updateNewEntry(entryIndex, {
                idType: e.target.value,
                id: "",
                firstName: "",
                lastName: "",
                acctId: "",
                orgId: "",
              });
              // Fetch suggestions for new ID type
              fetchSuggestionsForPastedEntry(entryIndex, {
                ...entry,
                idType: e.target.value,
              });
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

        {/* ID - Input with Suggestions (EDITABLE) */}
        <td className="tbody-td">
          <input
            type="text"
            value={entry.id}
            // onChange={(e) => {
            //   const value = e.target.value;
            //   updateNewEntry(entryIndex, { id: value });

            //   // Auto-fill name if employee is selected from suggestions
            //   const selectedEmployee = (
            //     pastedEntrySuggestions[entryIndex] || []
            //   ).find((emp) => emp.emplId === value);
            //   if (selectedEmployee) {
            //     updateNewEntry(entryIndex, {
            //       id: value,
            //       firstName: selectedEmployee.firstName || "",
            //       lastName: selectedEmployee.lastName || "",
            //       orgId: selectedEmployee.orgId || entry.orgId,
            //       acctId: selectedEmployee.acctId || entry.acctId,
            //     });
            //   }
            // }}
            onChange={(e) => {
              // --- FIX: SANITIZE INPUT ON EDIT ---
              const rawValue = e.target.value;
              const value = rawValue.replace(
                /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                ""
              );
              // -----------------------------------

              updateNewEntry(entryIndex, { id: value });

              // Auto-fill name if employee is selected from suggestions
              const selectedEmployee = (
                pastedEntrySuggestions[entryIndex] || []
              ).find((emp) => emp.emplId === value);
              
              if (selectedEmployee) {
                updateNewEntry(entryIndex, {
                  id: value,
                  firstName: selectedEmployee.firstName || "",
                  lastName: selectedEmployee.lastName || "",
                  orgId: selectedEmployee.orgId || entry.orgId,
                  acctId: selectedEmployee.acctId || entry.acctId,
                });
              }
            }}
            list={`employee-id-list-${entryIndex}`}
            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
            placeholder="Enter ID"
          />
          {entry.idType !== "Other" && (
            <datalist id={`employee-id-list-${entryIndex}`}>
              {(pastedEntrySuggestions[entryIndex] || [])
                .filter(
                  (emp) =>
                    emp.emplId &&
                    typeof emp.emplId === "string"
                )
                .map((emp, idx) => (
                  <option
                    key={`${emp.emplId}-${idx}`}
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
          )}
        </td>

        {/* Name - Auto-filled or Editable for "Other" */}
        {/* <td className="tbody-td">
          <input
            type="text"
            value={
              entry.idType === "Other"
                ? (entry.firstName || "") +
                  (entry.lastName ? " " + entry.lastName : "")
                : entry.lastName && entry.firstName
                ? `${entry.lastName}, ${entry.firstName}`
                : entry.lastName || entry.firstName || ""
            }
            readOnly={entry.idType !== "Other"}
            className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
              entry.idType === "Other"
                ? "bg-white cursor-text"
                : "bg-gray-100 cursor-not-allowed"
            }`}
            placeholder="Name (auto-filled or editable for 'Other')"
            onChange={(e) => {
              if (entry.idType === "Other") {
                const fullName = e.target.value.trim();
                const parts = fullName.split(" ");
                const firstName = parts[0] || "";
                const lastName = parts.slice(1).join(" ") || "";
                updateNewEntry(entryIndex, {
                  firstName,
                  lastName,
                });
              }
            }}
          />
        </td> */}
        {/* Name - Auto-filled or Editable for "Other" */}
        <td className="tbody-td">
          <input
            type="text"
            value={
              entry.idType === "Other"
                ? (entry.firstName || "") +
                  (entry.lastName ? " " + entry.lastName : "")
                : entry.lastName && entry.firstName
                ? `${entry.lastName}, ${entry.firstName}`
                : entry.lastName || entry.firstName || ""
            }
            readOnly={entry.idType !== "Other"}
            className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
              entry.idType === "Other"
                ? "bg-white cursor-text"
                : "bg-gray-100 cursor-not-allowed"
            }`}
            placeholder="Name (auto-filled or editable for 'Other')"
            onChange={(e) => {
              if (entry.idType === "Other") {
                const rawInput = e.target.value;

                // 1. Remove Emojis
                const noEmojiInput = rawInput.replace(
                  /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                  ""
                );

                // 2. Update State directly
                // We store the whole string in firstName and clear lastName to allow spaces while typing
                updateNewEntry(entryIndex, {
                  firstName: noEmojiInput,
                  lastName: "", 
                });
              }
            }}
          />
        </td>

        {/* Account - Editable with Suggestions */}
        <td key={`${entry.id}-${entryIndex}-acctId`} className="tbody-td min-w-70px">
          <input
            type="text"
            value={entry.acctId}
            onChange={(e) => {
              const val = e.target.value;
              const accountList = pastedEntryAccounts[entryIndex] || [];
              const accountWithName = accountList.find(acc => (acc.id || acc.accountId) === val);
              
              updateNewEntry(entryIndex, {
                acctId: val,
                acctName: accountWithName ? (accountWithName.name || accountWithName.acctName) : '',
              });
            }}
            list={`account-list-pasted-${entryIndex}`}
            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
            placeholder="Enter Account"
          />
          <datalist id={`account-list-pasted-${entryIndex}`}>
            {(pastedEntryAccounts[entryIndex] || []).map((account, index) => {
              const valueText = account.id || account.accountId;
              return <option key={`${valueText}-${index}`} value={valueText} />;
            })}
          </datalist>
        </td>

        {/* Account Name - Auto-filled (READ-ONLY) */}
        <td key={`${entry.id}-${entryIndex}-acctName`} className="tbody-td">
          <input
            type="text"
            value={entry.acctName || ''}
            readOnly
            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100 cursor-not-allowed"
            placeholder="Account Name (auto-filled)"
          />
        </td>

        {/* Organization - Editable with Suggestions */}
        <td key={`${entry.id}-${entryIndex}-orgId`} className="tbody-td">
          <input
            type="text"
            value={entry.orgId}
            onChange={(e) =>
              isFieldEditable &&
              updateNewEntry(entryIndex, {
                orgId: e.target.value,
              })
            }
            onBlur={(e) => {
              const val = e.target.value.trim();
              const validOrgs = (
                pastedEntryOrgs[entryIndex] || []
              ).map((org) => org.value);

              if (val !== "" && !validOrgs.includes(val)) {
                toast.error(
                  "Please select a valid organization from suggestions"
                );
                updateNewEntry(entryIndex, { orgId: "" });
              }
            }}
            list={`org-list-${entryIndex}`}
            className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
              !isFieldEditable
                ? "bg-gray-100 cursor-not-allowed"
                : ""
            }`}
            placeholder="Enter Organization"
            readOnly={!isFieldEditable}
          />
          <datalist id={`org-list-${entryIndex}`}>
            {(pastedEntryOrgs[entryIndex] || []).map(
              (org, idx) => (
                <option
                  key={`${org.value}-${idx}`}
                  value={org.value}
                >
                  {org.label}
                </option>
              )
            )}
          </datalist>
        </td>

        {/* Rev - Checkbox */}
        <td className="tbody-td text-center">
          <input
            type="checkbox"
            checked={entry.isRev}
            onChange={(e) =>
              isFieldEditable &&
              updateNewEntry(entryIndex, {
                isRev: e.target.checked,
              })
            }
            className={`w-4 h-4 ${
              !isFieldEditable ? "cursor-not-allowed" : ""
            }`}
            disabled={!isFieldEditable}
          />
        </td>

        {/* Brd - Checkbox */}
        <td className="tbody-td text-center">
          <input
            type="checkbox"
            checked={entry.isBrd}
            onChange={(e) =>
              isFieldEditable &&
              updateNewEntry(entryIndex, {
                isBrd: e.target.checked,
              })
            }
            className={`w-4 h-4 ${
              !isFieldEditable ? "cursor-not-allowed" : ""
            }`}
            disabled={!isFieldEditable}
          />
        </td>

        {/* Status */}
        <td className="tbody-td">
          <input
            type="text"
            value={entry.status}
            onChange={(e) =>
              updateNewEntry(entryIndex, {
                status: e.target.value,
              })
            }
            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
            placeholder="Enter Status"
            disabled={entry.idType === "Other"}
            readOnly={entry.idType === "Other"}
          />
        </td>

        {/* Total */}
        <td className="tbody-td">
          {Object.values(
            newEntryPeriodAmountsArray[entryIndex] || {}
          )
            .reduce(
              (sum, val) => sum + (parseFloat(val) || 0),
              0
            )
            .toFixed(2)}
        </td>
      </tr>
    </React.Fragment>
  ))
}


                  {employees
                    .filter((_, idx) => !hiddenRows[idx])
                    .map((emp, idx) => {
                      const actualEmpIdx = employees.findIndex(
                        (e) => e === emp
                      );
                      const row = getEmployeeRow(emp, actualEmpIdx);
                      const uniqueRowKey = `${
                        emp.emple.emplId || "emp"
                      }-${actualEmpIdx}`;
                      return (
                        <tr
                          key={uniqueRowKey}
                          className={`whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200 ${
                            selectedRows.has(actualEmpIdx)
                              ? "bg-blue-100" // Selected row background
                              : selectedRowIndex === actualEmpIdx
                              ? "bg-yellow-100"
                              : "even:bg-gray-50"
                          }`}
                          style={{
                            height: `${ROW_HEIGHT_DEFAULT}px`,
                            lineHeight: "normal",
                            cursor: isEditable ? "pointer" : "default",
                          }}
                          onClick={() => handleRowClick(actualEmpIdx)}
                        >
                          {EMPLOYEE_COLUMNS.map((col) => {
                            if (isBudPlan && isEditable) {
                              if (col.key === "acctId") {
                                return (
                                  <td
                                    key={`${emp.emple.emplId}-${actualEmpIdx}-acctId`}
                                    className="tbody-td min-w-[70px]"
                                  >
                                    <input
                                      type="text"
                                      value={
                                        editedRowData[actualEmpIdx]?.acctId !==
                                        undefined
                                          ? editedRowData[actualEmpIdx].acctId
                                          : row.acctId
                                      }
                                       onChange={(e) => {
    const val = e.target.value;
    
    // Determine correct account list based on ID type
    const accountList = 
      emp.emple.type === 'Vendor' || emp.emple.type === 'Vendor Employee'
        ? subContractorNonLaborAccounts
        : emp.emple.type === 'Other'
        ? otherDirectCostNonLaborAccounts
        : employeeNonLaborAccounts;
    
    // Find matching account
    const accountWithName = accountList.find(acc => 
      (acc.id || acc.accountId) === val
    );
    
    // Update BOTH acctId and acctName at the same time
    setEditedRowData(prev => ({
      ...prev,
      [actualEmpIdx]: {
        ...prev[actualEmpIdx],
        acctId: val,
        acctName: accountWithName ? (accountWithName.name || accountWithName.acctName) : '',
      },
    }));
    
    setEditingRowIndex(actualEmpIdx);
    setHasUnsavedFieldChanges(true);
  }}
                                      // onChange={(e) => {
                                      //   const val = e.target.value;
                                      //   handleRowFieldChange(
                                      //     actualEmpIdx,
                                      //     "acctId",
                                      //     val
                                      //   );
                                      //   setEditingRowIndex(actualEmpIdx);
                                      //   setHasUnsavedFieldChanges(true);
                                      // }}
                                      // disabled={isEAC}
                                      // readOnly={isEAC}
                                      list={`account-list-${actualEmpIdx}`}
                                      className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                      placeholder="Enter Account"
                                    />

                                    {/* <datalist
                                      id={`account-list-${actualEmpIdx}`}
                                    >
                                      {(emp.idType === "Vendor" ||
                                      emp.idType === "Vendor Employee"
                                        ? subContractorNonLaborAccounts
                                        : employeeNonLaborAccounts
                                      ).map((account, index) => {
                                        const valueText =
                                          account.id || account.accountId || "";
                                      

                                        return (
                                          <option
                                            key={`${valueText}-${index}`}
                                            value={valueText}
                                          >
                                            
                                          </option>
                                        );
                                      })}
                                    </datalist> */}
                                    {/* <datalist id={`account-list-${actualEmpIdx}`}>
  {(emp.emple.type === "Vendor" || emp.emple.type === "Vendor Employee"
    ? subContractorNonLaborAccounts
    : emp.emple.type === "Other"
    ? otherDirectCostNonLaborAccounts
    : employeeNonLaborAccounts
  ).map((account, index) => {
    const valueText = account.id || account.accountId || "";
    return (
      <option
        key={`${valueText}-index`}
        value={valueText}
      >
      </option>
    );
  })}
</datalist> */}
<datalist id={`account-list-${actualEmpIdx}`}>  {/* or id="account-list" for new entry */}
  {(emp.emple.type === 'Vendor' || emp.emple.type === 'Vendor Employee'
    ? subContractorNonLaborAccounts
    : emp.emple.type === 'Other'
    ? otherDirectCostNonLaborAccounts
    : employeeNonLaborAccounts
  ).map((account, index) => {
    const valueText = account.id || account.accountId;
    const displayText = account.name || account.acctName || valueText;
    return (
      <option key={`${valueText}-${index}`} value={valueText}>
        {/* {displayText} */}
      </option>
    );
  })}
</datalist>


                                  </td>
                                );
                              }
                              if (col.key === "orgId") {
                                return (
                                  // <td
                                  //   key={`${uniqueRowKey}-orgId`}
                                  //   className="p-1.5 border-r border-gray-200 text-xs text-gray-700 min-w-[70px]"
                                  // >
                                  //   {" "}
                                  //   {/* Changed p-2 to p-1.5, min-w-[80px] to min-w-[70px] */}
                                  //   <input
                                  //     type="text"
                                  //     value={
                                  //       editedRowData[actualEmpIdx]?.orgId !==
                                  //       undefined
                                  //         ? editedRowData[actualEmpIdx].orgId
                                  //         : row.orgId
                                  //     }
                                  //     onChange={(e) =>
                                  //       handleRowFieldChange(
                                  //         actualEmpIdx,
                                  //         "orgId",
                                  //         e.target.value
                                  //       )
                                  //     }
                                  //     onBlur={() =>
                                  //       handleRowFieldBlur(actualEmpIdx, emp)
                                  //     }
                                  //     list={`organization-list-${actualEmpIdx}`}
                                  //     className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                  //   />
                                  //   <datalist
                                  //     id={`organization-list-${actualEmpIdx}`}
                                  //   >
                                  //     {organizationOptions.map((org, index) => (
                                  //       <option
                                  //         key={`${org.value}-${index}`}
                                  //         value={org.value}
                                  //       >
                                  //         {org.label}
                                  //       </option>
                                  //     ))}
                                  //   </datalist>
                                  // </td>
                                  <td
                                    key={`${emp.emple.emplId}-${actualEmpIdx}-orgId`}
                                    className="tbody-td min-w-[70px]"
                                  >
                                    <input
                                      type="text"
                                      value={
                                        editedRowData[actualEmpIdx]?.orgId !==
                                        undefined
                                          ? editedRowData[actualEmpIdx].orgId
                                          : row.orgId
                                      }
                                      // onChange={(e) =>
                                      //   handleRowFieldChange(
                                      //     actualEmpIdx,
                                      //     "orgId",
                                      //     e.target.value
                                      //   )
                                      // }
                                      onChange={(e) => {
                                        handleRowFieldChange(
                                          actualEmpIdx,
                                          "orgId",
                                          e.target.value
                                        );
                                        setEditingRowIndex(actualEmpIdx);
                                        setHasUnsavedFieldChanges(true);
                                      }}
                                      disabled={isEAC}
                                      readOnly={isEAC}
                                      list={`organization-list-${actualEmpIdx}`}
                                      className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                    />
                                    <datalist
                                      id={`organization-list-${actualEmpIdx}`}
                                    >
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
                                );
                              }
                              if (col.key === "isRev") {
                                return (
                                  <td
                                    key={`${emp.emple.emplId}-${actualEmpIdx}-isRev`}
                                    className="tbody-td min-w-[70px] text-center"
                                  >
                                    {" "}
                                    {/* Changed p-2 to p-1.5, min-w-[80px] to min-w-[70px] */}
                                    <input
                                      type="checkbox"
                                      checked={
                                        editedRowData[actualEmpIdx]?.isRev !==
                                        undefined
                                          ? editedRowData[actualEmpIdx].isRev
                                          : emp.emple.isRev
                                      }
                                      // onChange={(e) =>
                                      //   handleRowFieldChange(
                                      //     actualEmpIdx,
                                      //     "isRev",
                                      //     e.target.checked
                                      //   )
                                      // }
                                      onChange={(e) => {
                                        handleRowFieldChange(
                                          actualEmpIdx,
                                          "isRev",
                                          e.target.checked
                                        );
                                        setEditingRowIndex(actualEmpIdx);
                                        setHasUnsavedFieldChanges(true);
                                      }}
                                      disabled={isEAC}
                                      readOnly={isEAC}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                );
                              }
                              if (col.key === "isBrd") {
                                return (
                                  <td
                                    key={`${emp.emple.emplId}-${actualEmpIdx}-isBrd`}
                                    className="tbody-td min-w-[70px] text-center"
                                  >
                                    {" "}
                                    {/* Changed p-2 to p-1.5, min-w-[80px] to min-w-[70px] */}
                                    <input
                                      type="checkbox"
                                      checked={
                                        editedRowData[actualEmpIdx]?.isBrd !==
                                        undefined
                                          ? editedRowData[actualEmpIdx].isBrd
                                          : emp.emple.isBrd
                                      }
                                      onChange={(e) => {
                                        handleRowFieldChange(
                                          actualEmpIdx,
                                          "isBrd",
                                          e.target.checked
                                        );
                                        setEditingRowIndex(actualEmpIdx);
                                        setHasUnsavedFieldChanges(true);
                                      }}
                                      disabled={isEAC}
                                      readOnly={isEAC}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                );
                              }
                            }
                            return (
                              <td
                                key={`${uniqueRowKey}-${col.key}`}
                                className="tbody-td min-w-[70px]"
                              >
                                {" "}
                                {/* Changed p-2 to p-1.5, min-w-[80px] to min-w-[70px] */}
                                {row[col.key]}
                              </td>
                            );
                          })}
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
                    <td colSpan={EMPLOYEE_COLUMNS.length}>"" </td>
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
              <table className="min-w-full text-xs text-center table">
                <thead className="  thead">
                  <tr
                    style={{
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      lineHeight: "normal",
                    }}
                  >
                    {/* CTD and Prior Year headers - only show when fiscal year is NOT "All" */}
                    {normalizedFiscalYear !== "All" && (
                      <>
                        {/* <th className="th-thead min-w-80px">
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
    </th> */}
                        {shouldShowCTD() && (
                          <th className="th-thead min-w-100px">
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="whitespace-nowrap th-thead font-bold">
                                CTD
                              </span>
                              <span className="whitespace-nowrap text-xs text-gray-600 font-normal normal-case">
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

                        {shouldShowPriorYear() && (
                          <th className="th-thead min-w-100px">
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="whitespace-nowrap th-thead font-bold">
                                Prior Year
                              </span>
                              <span className="whitespace-nowrap text-xs text-gray-600 font-normal normal-case">
                                {parseInt(normalizedFiscalYear) - 1}
                              </span>
                            </div>
                          </th>
                        )}
                      </>
                    )}

                    {sortedDurations.map((duration) => {
                      const uniqueKey = `${duration.monthNo}_${duration.year}`;
                      return (
                        <th
                          key={uniqueKey}
                          className={`th-thead min-w-[80px]  ${
                            /* Changed py-2 px-3 to px-2 py-1.5, min-w-[100px] to min-w-[80px] */
                            selectedColumnKey === uniqueKey
                              ? "bg-yellow-100"
                              : ""
                          }`}
                          style={{ cursor: isEditable ? "pointer" : "default" }}
                          onClick={() => handleColumnHeaderClick(uniqueKey)}
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className="whitespace-nowrap th-thead ">
                              {duration.month}
                            </span>
                            <span className="text-xs text-gray-600 font-normal normal-case">
                              amt
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="tbody">
                  {/* Pasted Entries in Second Table */}
                  {newEntries.length > 0 &&
                    newEntries.map((entry, entryIndex) => (
                      <tr
                        key={`pasted-duration-${entryIndex}`}
                        className="bg-yellow-50"
                        style={{
                          height: `${ROW_HEIGHT_DEFAULT}px`,
                          lineHeight: "normal",
                        }}
                      >
                        {shouldShowCTD() && (
        <td className="tbody-td text-center text-xs bg-gray-100">
          0.00
        </td>
      )}

      {shouldShowPriorYear() && (
        <td className="tbody-td text-center text-xs bg-gray-100">
          0.00
        </td>
      )}
                        {sortedDurations.map((duration) => {
                          const uniqueKey = `${duration.monthNo}_${duration.year}`;
                          const isInputEditable =
                            isEditable &&
                            isMonthEditable(duration, closedPeriod, planType);
                          const value =
                            newEntryPeriodAmountsArray[entryIndex]?.[
                              uniqueKey
                            ] || "";

                          return (
                            <td
                              key={`pasted-${entryIndex}-${uniqueKey}`}
                              className={`tbody-td min-w-[80px] ${
                                planType === "EAC"
                                  ? isInputEditable
                                    ? "bg-green-50"
                                    : "bg-gray-100"
                                  : ""
                              }`}
                            >
                              <input
                                type="text"
                                inputMode="numeric"
                                value={value}
                                onChange={(e) => {
                                  if (isInputEditable) {
                                    updateNewEntryPeriodAmounts(entryIndex, {
                                      [uniqueKey]: e.target.value.replace(
                                        /[^0-9.]/g,
                                        ""
                                      ),
                                    });
                                  }
                                }}
                                className={`text-center border border-gray-300 bg-white text-xs w-[50px] h-[18px] p-[2px] ${
                                  !isInputEditable
                                    ? "cursor-not-allowed text-gray-400"
                                    : "text-gray-700"
                                }`}
                                disabled={!isInputEditable}
                                placeholder="0.00"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                  {showNewForm && (
                    <tr
                      key="new-entry"
                      className="bg-gray-50"
                      style={{
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        lineHeight: "normal",
                      }}
                    >
                      {shouldShowCTD() && (
                        <td className="tbody-td text-center text-xs bg-gray-100">
                          0.00
                        </td>
                      )}

                      {shouldShowPriorYear() && (
                        <td className="tbody-td text-center text-xs bg-gray-100">
                          0.00
                        </td>
                      )}
                      {sortedDurations.map((duration) => {
                        const uniqueKey = `${duration.monthNo}_${duration.year}`;
                        const isInputEditable =
                          isEditable &&
                          isMonthEditable(duration, closedPeriod, planType);
                        return (
                          <td
                            key={`new-${uniqueKey}`}
                            className={`tbody-td min-w-[80px] ${
                              /* Changed py-2 px-3 to px-2 py-1.5, min-w-[100px] to min-w-[80px] */
                              planType === "EAC"
                                ? isInputEditable
                                  ? "bg-green-50"
                                  : "bg-gray-100"
                                : ""
                            }`}
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              value={newEntryPeriodAmounts[uniqueKey] || ""}
                              onChange={(e) =>
                                isInputEditable &&
                                setNewEntryPeriodAmounts((prev) => ({
                                  ...prev,
                                  [uniqueKey]: e.target.value.replace(
                                    /[^0-9.]/g,
                                    ""
                                  ),
                                }))
                              }
                              className={`text-center border border-gray-300 bg-white text-xs w-[50px] h-[18px] p-[2px] ${
                                /* Changed w-[55px] h-[20px] to w-[50px] h-[18px] */
                                !isInputEditable
                                  ? "cursor-not-allowed text-gray-400"
                                  : "text-gray-700"
                              }`}
                              disabled={!isInputEditable}
                              placeholder="Enter Amount"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  )}
                  {employees
                    .filter((_, idx) => !hiddenRows[idx])
                    .map((emp, idx) => {
                      const actualEmpIdx = employees.findIndex(
                        (e) => e === emp
                      );
                      const monthAmounts = getMonthAmounts(emp);
                      const uniqueRowKey = `${
                        emp.emple.emplId || "emp"
                      }-${actualEmpIdx}`;
                      return (
                        <tr
                          key={uniqueRowKey}
                          className={`whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200 ${
                            selectedRows.has(actualEmpIdx)
                              ? "bg-blue-100" // Selected row background
                              : selectedRowIndex === actualEmpIdx
                              ? "bg-yellow-100"
                              : "even:bg-gray-50"
                          }`}
                          style={{
                            height: `${ROW_HEIGHT_DEFAULT}px`,
                            lineHeight: "normal",
                            cursor: isEditable ? "pointer" : "default",
                          }}
                          onClick={() => handleRowClick(actualEmpIdx)}
                        >
                          {/* CTD and Prior Year cells */}
                          {normalizedFiscalYear !== "All" && (
                            <>
                              {shouldShowCTD() && (
                                <td className="tbody-td text-center">
                                  {(() => {
                                    let empCtd = 0;
                                    const currentFiscalYear =
                                      parseInt(normalizedFiscalYear);
                                    const startYear = parseInt(
                                      startDate.split("-")[0]
                                    );

                                    durations.forEach((duration) => {
                                      if (
                                        duration.year >= startYear &&
                                        duration.year <= currentFiscalYear - 2
                                      ) {
                                        const uniqueKey = `${duration.monthNo}_${duration.year}`;
                                        const inputValue =
                                          inputValues[
                                            `${actualEmpIdx}_${uniqueKey}`
                                          ];
                                        const monthAmounts =
                                          getMonthAmounts(emp);
                                        const forecastValue =
                                          monthAmounts[uniqueKey]?.value;
                                        const value =
                                          inputValue !== undefined &&
                                          inputValue !== ""
                                            ? inputValue
                                            : forecastValue;
                                        empCtd +=
                                          value && !isNaN(value)
                                            ? Number(value)
                                            : 0;
                                      }
                                    });

                                    return empCtd.toFixed(2);
                                  })()}
                                </td>
                              )}

                              {shouldShowPriorYear() && (
                                <td className="tbody-td text-center">
                                  {(() => {
                                    let empPriorYear = 0;
                                    const currentFiscalYear =
                                      parseInt(normalizedFiscalYear);

                                    durations.forEach((duration) => {
                                      if (
                                        duration.year ===
                                        currentFiscalYear - 1
                                      ) {
                                        const uniqueKey = `${duration.monthNo}_${duration.year}`;
                                        const inputValue =
                                          inputValues[
                                            `${actualEmpIdx}_${uniqueKey}`
                                          ];
                                        const monthAmounts =
                                          getMonthAmounts(emp);
                                        const forecastValue =
                                          monthAmounts[uniqueKey]?.value;
                                        const value =
                                          inputValue !== undefined &&
                                          inputValue !== ""
                                            ? inputValue
                                            : forecastValue;
                                        empPriorYear +=
                                          value && !isNaN(value)
                                            ? Number(value)
                                            : 0;
                                      }
                                    });

                                    return empPriorYear.toFixed(2);
                                  })()}
                                </td>
                              )}
                            </>
                          )}
                          {sortedDurations.map((duration) => {
                            const uniqueKey = `${duration.monthNo}_${duration.year}`;
                            const forecast = monthAmounts[uniqueKey];
                            const value =
                              inputValues[`${actualEmpIdx}_${uniqueKey}`] ??
                              (forecast?.value !== undefined
                                ? forecast.value
                                : "0");
                            const isInputEditable =
                              isEditable &&
                              isMonthEditable(duration, closedPeriod, planType);
                            return (
                              <td
                                key={`${uniqueRowKey}-${uniqueKey}`}
                                className={`tbody-td min-w-[80px] ${
                                  /* Changed py-2 px-3 to px-2 py-1.5, min-w-[100px] to min-w-[80px] */
                                  selectedColumnKey === uniqueKey
                                    ? "bg-yellow-100"
                                    : ""
                                } ${
                                  planType === "EAC"
                                    ? isInputEditable
                                      ? "bg-green-50"
                                      : "bg-gray-100"
                                    : ""
                                }`}
                              >
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
                                  // onBlur={(e) =>
                                  //   handleForecastAmountBlur(
                                  //     actualEmpIdx,
                                  //     uniqueKey,
                                  //     e.target.value
                                  //   )
                                  // }
                                  disabled={!isInputEditable}
                                  placeholder="Enter Amount"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
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
                    {/* CTD and Prior Year footer totals */}
                    {normalizedFiscalYear !== "All" && (
                      <>
                        {/* <td className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200">
      {(() => {
        const columnTotals = calculateColumnTotals();
        return (columnTotals['ctd'] || 0).toFixed(2);
      })()}
    </td> */}
                        {shouldShowCTD() && (
                          <td className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200">
                            {(columnTotals["ctd"] || 0).toFixed(2)}
                          </td>
                        )}

                        {/* <td className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200">
      {(() => {
        const columnTotals = calculateColumnTotals();
        return (columnTotals['priorYear'] || 0).toFixed(2);
      })()}
    </td> */}
                        {shouldShowPriorYear() && (
                          <td className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200">
                            {(columnTotals["priorYear"] || 0).toFixed(2)}
                          </td>
                        )}
                      </>
                    )}
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
                      const total = columnTotals[uniqueKey] || 0;
                      {
                        /* ✅ Use memoized columnTotals directly */
                      }
                      return (
                        <td
                          key={`total-${uniqueKey}`}
                          className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200"
                        >
                          {total.toFixed(2)}
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
              Find and Replace Amounts
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
                      ? employees[selectedRowIndex]?.emple.emplId
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs cursor-pointer"
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
                      ? employees[selectedRowIndex]?.emple.emplId
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
                          (d) => `${d.monthNo}_${d.year}` === selectedColumnKey
                        )?.month
                      : "NA"}
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
    </div>
  );
};

export default ProjectAmountsTable;
