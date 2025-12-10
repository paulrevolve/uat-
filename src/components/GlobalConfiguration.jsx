import React, { useState, useEffect, useCallback, useRef } from "react";
import Select from "react-select";
import { backendUrl } from "./config";

const cn = (...args) => {
  return args.filter(Boolean).join(" ");
};

// --- Main LaborForm Component with Tabs ---
const LaborForm = () => {
  const [activeTab, setActiveTab] = useState("projectSettings");

  // States from LaborFormContent
  const [projectBudgetPeriodMethod, setProjectBudgetPeriodMethod] = useState(
    "Accounting Periods ONLY"
  );
  const [unlockEACLastClosedPeriod, setUnlockEACLastClosedPeriod] =
    useState(false);
  const [projectAccountGroupCode, setProjectAccountGroupCode] = useState("");
  const [resourceBudgetCommitFlagDefault, setResourceBudgetCommitFlagDefault] =
    useState(false);
  const [autoPlugCalculation, setAutoPlugCalculation] = useState("On");
  const [
    importBudgetEACsFromExcelCommitFlagDefault,
    setImportBudgetEACsFromExcelCommitFlagDefault,
  ] = useState(false);
  const [timesheetImportHistory, setTimesheetImportHistory] = useState(36); // Default to 36
  const [
    importNewBusinessBudgetFromExcelCommitFlag,
    setImportNewBusinessBudgetFromExcelCommitFlag,
  ] = useState(false);
  const [timesheetScheduleCode, setTimesheetScheduleCode] = useState("");
  const [
    checkTheProjectBudgetEnableSubtaskRowHideOptionByDefault,
    setCheckTheProjectBudgetEnableSubtaskRowHideOptionByDefault,
  ] = useState(false);
  const [laborEscalationMonth, setLaborEscalationMonth] = useState(""); // Initialize as empty for API data
  const [enableProjectHideBudEAC, setEnableProjectHideBudEAC] = useState(false);
  const [laborEscalationValue, setLaborEscalationValue] = useState(""); // Initialize as empty for API data
  const [showBudEACOnlyDefault, setShowBudEACOnlyDefault] = useState(false);
  const [projectSecurityToBeBasedOn, setProjectSecurityToBeBasedOn] = useState(
    "Project Budget Security"
  );
  const [enableBudgetAutoInspect, setEnableBudgetAutoInspect] = useState(false);
  const [
    allowBUDEACCreationPriorToPeriodClose,
    setAllowBUDEACCreationPriorToPeriodClose,
  ] = useState("Create BUD/EACs based on Current Period");
  const [
    ifLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning,
    setIfLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning,
  ] = useState("Yes");
  const [defaultBurdenTemplate, setDefaultBurdenTemplate] = useState("DEFAULT");
  const [projectBudgetSequentialLocking, setProjectBudgetSequentialLocking] =
    useState(false);
  const [workforceRule, setWorkforceRule] = useState("Enforce"); // Default value
  const [orgLevelDisplay, setOrgLevelDisplay] = useState(4); // Default value
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [availableProjects, setAvailableProjects] = useState([]); // To store fetched project IDs/
  const [closingPeriod, setClosingPeriod] = useState("");
  const [loading, setLoading] = useState(true); // Initial loading for projects and config
  const [error, setError] = useState(null);
  const [configValues, setConfigValues] = useState([]);
  const [closingPeriodId, setClosingPeriodId] = useState("");
  const [escalationPercentId, setEscalationPercentId] = useState("");
  const [escalationMonthId, setEscalationMonthId] = useState("");
  const [escalationPercent, setEscalationPercent] = useState("");
  const [escalationMonth, setEscalationMonth] = useState("");

  // Month options mapping numeric values to display text
  const monthOptions = [
    { value: "0", label: "Employee's Anniversary Month" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const workforceRules = ["Enforce", "Do Not Enforce"];

  const handleLaborEscalationValueChange = (value) => {
    // Allow only numbers and a single decimal point (up to 5 decimal places)
    const regex = /^[0-9]*(\.[0-9]{0,5})?$/;
    if (value === "" || regex.test(value)) {
      setLaborEscalationValue(value);
    }
  };

  // States from NewTabContent
  const [paidTimeOffExpenseAccount, setPaidTimeOffExpenseAccount] =
    useState("60-100-001");
  const [updateEmployeeHomeOrg, setUpdateEmployeeHomeOrg] = useState(false);
  const [holidayExpenseAccount, setHolidayExpenseAccount] =
    useState("60-100-001");
  const [updateEmployeeAccrualRate, setUpdateEmployeeAccrualRate] =
    useState(false);
  const [ptoCalculationMethod, setPtoCalculationMethod] = useState("Hours");
  const [
    applyProbabilityToNewBusinessBudgets,
    setApplyProbabilityToNewBusinessBudgets,
  ] = useState(false);
  const [defaultPtoAccrualRate, setDefaultPtoAccrualRate] =
    useState("10.000000");
  const [orgBudgetSequentialLocking, setOrgBudgetSequentialLocking] =
    useState(false);
  const [partTimeHolidayCalculation, setPartTimeHolidayCalculation] =
    useState("0.500000");
  const [defaultFeeRate, setDefaultFeeRate] = useState("0.070000");
  const [defaultUtilization, setDefaultUtilization] = useState("0.820000");
  const [laborExpenseOrgLevels, setLaborExpenseOrgLevels] = useState("4");
  const [nonLaborExpenseOrgLevels, setNonLaborExpenseOrgLevels] = useState("4");
  const [orgBudgetRevenueCalculation, setOrgBudgetRevenueCalculation] =
    useState("Project Plus Org Revenue Adjustment");
  const [nlabHistoryMethod, setNlabHistoryMethod] = useState(
    "Populate GL Account History"
  );

  const handleNumericInput = (setter) => (e) => {
    const value = e.target.value;
    const regex = /^[0-9]*(\.[0-9]*)?$/;
    if (value === "" || regex.test(value)) {
      setter(value);
    }
  };

  const projectOptions = availableProjects.map((project) => ({
    value: project.projectId,
    label: project.name
      ? `${project.projectId} - ${project.name}`
      : project.projectId,
  }));

  // useEffect(() => {
  //   const fetchClosingPeriod = async () => {
  //     setLoading(true);
  //     try {
  //       const res = await fetch(
  //         `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/xxxxx`
  //       );
  //       if (!res.ok) throw new Error("Failed to fetch closing period");

  //       const data = await res.json(); // 👈 parse JSON
  //       const rawValue = (data?.value || "").trim();
  //       setClosingPeriodId(data?.id || null);
  //       let formattedDate = "";

  //       if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
  //         // Already yyyy-MM-dd
  //         formattedDate = rawValue;
  //       } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawValue)) {
  //         // Convert dd-MM-yyyy → yyyy-MM-dd
  //         const [day, month, year] = rawValue.split("-");
  //         formattedDate = `${year}-${month}-${day}`;
  //       } else if (rawValue) {
  //         // console.warn("Unexpected closing_period format:", rawValue);
  //       }

  //       setClosingPeriod(formattedDate);
  //     } catch (err) {
  //       // console.error("Error fetching closing period:", err);
  //       setClosingPeriod("");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchClosingPeriod();
  // }, []);

  // --- API Fetching for ALL available Project IDs ---

  useEffect(() => {
    const fetchOrgConfig = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/xxxxx`
        );
        if (!res.ok) throw new Error("Failed to fetch organization config");
        const configArray = await res.json();

        // Fetch values by name
        const closingConfig = configArray.find(
          (cfg) => cfg.name === "closing_period"
        );
        const percentConfig = configArray.find(
          (cfg) => cfg.name === "escallation_percent"
        );
        const monthConfig = configArray.find(
          (cfg) => cfg.name === "escallation_month"
        );

        setClosingPeriodId(closingConfig?.id || 0);
        setEscalationPercentId(percentConfig?.id || 0);
        setEscalationMonthId(monthConfig?.id || 0);

        // Format date for input type="date" (yyyy-MM-dd)
        let formattedDate = "";
        if (closingConfig?.value) {
          const rawValue = closingConfig.value.trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
            formattedDate = rawValue;
          } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawValue)) {
            const [day, month, year] = rawValue.split("-");
            formattedDate = `${year}-${month}-${day}`;
          }
        }
        setClosingPeriod(formattedDate);
        setEscalationPercent(percentConfig?.value || "");
        setEscalationMonth(monthConfig?.value?.toString() || "");
      } catch (err) {
        setClosingPeriod("");
        setEscalationPercent("");
        setEscalationMonth("");
      } finally {
        setLoading(false);
      }
    };
    fetchOrgConfig();
  }, []);

  useEffect(() => {
    const fetchAllProjects = async () => {
      setLoading(true); // Set loading to true for initial project list fetch
      setError(null);
      try {
        const apiUrl = `${backendUrl}/Project/GetAllProjects`; // Your API endpoint to get ALL projects

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const projects = await response.json();
        setAvailableProjects(projects);

        // Automatically select the first project if available
        if (projects.length > 0) {
          setSelectedProjectId(projects[0].id);
        } else {
          setLoading(false); // No projects to load config for
        }
      } catch (e) {
        // console.error("Failed to fetch project list:", e);
        setError(
          "Failed to load project list. Please check your API connection."
        );
        setLoading(false);
      }
    };

    fetchAllProjects();
  }, []); // Runs once on component mount to get the list of projects

  useEffect(() => {
    const fetchEscalationData = async () => {
      if (!selectedProjectId) {
        // Reset state if no project selected
        setLaborEscalationMonth("");
        setLaborEscalationValue("");
        setWorkforceRule("");
        setConfigValues([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const apiUrl = `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/${selectedProjectId}`;
        const response = await fetch(apiUrl);

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const fetchedConfigValues = (await response.json()) || [];

        if (fetchedConfigValues.length === 0) {
          // ✅ If nothing in backend, initialize defaults
          const defaults = [
            {
              id: 0,
              name: "escallation_month",
              value: "",
              projId: selectedProjectId,
            },
            {
              id: 0,
              name: "escallation_percent",
              value: "",
              projId: selectedProjectId,
            },
            { id: 0, name: "workforce", value: "", projId: selectedProjectId },
          ];
          setConfigValues(defaults);
        } else {
          setConfigValues(fetchedConfigValues);
        }

        // Set state for individual fields
        const monthConfig = fetchedConfigValues.find(
          (c) => c.name === "escallation_month"
        );
        const percentConfig = fetchedConfigValues.find(
          (c) => c.name === "escallation_percent"
        );
        const workforceConfig = fetchedConfigValues.find(
          (c) => c.name === "workforce"
        );

        setLaborEscalationMonth(monthConfig?.value ?? "");
        setLaborEscalationValue(percentConfig?.value ?? "");
        setWorkforceRule(
          workforceConfig?.value != null
            ? String(workforceConfig.value).toLowerCase() === "true"
              ? "Enforce"
              : "Do Not Enforce"
            : ""
        );
      } catch (e) {
        // console.error(
        //   `Failed to fetch config for project ${selectedProjectId}:`,
        //   e
        // );
        setError(
          `Failed to load settings for project ${selectedProjectId}. Please try again.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEscalationData();
  }, [selectedProjectId]);

  const handleSaveProjectSettings = useCallback(async () => {
    if (!selectedProjectId) {
      alert("Please select a Project ID to save settings.");
      return;
    }

    const updateApiUrl = `${backendUrl}/api/Configuration/UpdateConfigValues`;
    const nowIsoString = new Date().toISOString();

    let dataToSave = [];

    if (configValues.length > 0) {
      // Map over existing configValues
      dataToSave = configValues.map((config) => {
        let newValue = config.value;

        if (config.name === "escallation_month")
          newValue = String(laborEscalationMonth);
        if (config.name === "escallation_percent")
          newValue = String(laborEscalationValue);
        if (config.name === "workforce")
          newValue = workforceRule === "Enforce" ? "true" : "false";

        return {
          id: config.id || 0, // ✅ always include id
          name: config.name,
          value: newValue,
          createdAt: nowIsoString,
          projId: selectedProjectId,
        };
      });
    } else {
      // ✅ If nothing came from backend, build payload fresh from UI
      dataToSave = [
        {
          id: 0,
          name: "escallation_month",
          value: String(laborEscalationMonth || "0"),
          createdAt: nowIsoString,
          projId: selectedProjectId,
        },
        {
          id: 0,
          name: "escallation_percent",
          value: String(laborEscalationValue || "0"),
          createdAt: nowIsoString,
          projId: selectedProjectId,
        },
        {
          id: 0,
          name: "workforce",
          value: workforceRule === "Enforce" ? "true" : "false",
          createdAt: nowIsoString,
          projId: selectedProjectId,
        },
      ];
    }

    // console.log("Project Settings Data to Save:", dataToSave);

    try {
      const response = await fetch(updateApiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Server error" }));
        throw new Error(errorData.message || response.statusText);
      }

      const result = await response.json();
      // console.log("Project settings saved successfully:", result);
      alert("Project settings saved successfully!");
    } catch (e) {
      // console.error("Error saving project settings:", e);
      alert(`Error saving project settings: ${e.message}`);
    }
  }, [
    selectedProjectId,
    laborEscalationMonth,
    laborEscalationValue,
    workforceRule,
    configValues,
  ]);

  const handleSaveOrganizationSettings = useCallback(async () => {
    // if (!selectedProjectId) {
    //   alert("Please select a Project ID first.");
    //   return;
    // }

    // console.log("Attempting to save Closing Period...");

    const updateApiUrl = `${backendUrl}/api/Configuration/UpdateConfigValues`;

    const nowIsoString = new Date().toISOString();

    // Build payload ONLY for closing period
    const closingPeriodPayload = [
      {
        id: closingPeriodId, // 0 = let backend assign, or use existing id if you fetched it
        name: "closing_period",
        value: closingPeriod, // <-- your state variable for closing period
        createdAt: nowIsoString,
        projId: "xxxxx",
      },
      {
        id: escalationMonthId, // 0 = let backend assign, or use existing id if you fetched it
        name: "escallation_month",
        value: escalationMonth, // <-- your state variable for closing period
        createdAt: nowIsoString,
        projId: "xxxxx",
      },
      {
        id: escalationPercentId, // 0 = let backend assign, or use existing id if you fetched it
        name: "escallation_percent",
        value: escalationPercent, // <-- your state variable for closing period
        createdAt: nowIsoString,
        projId: "xxxxx",
      },
    ];

    // console.log("Closing Period Payload:", closingPeriodPayload);

    try {
      const response = await fetch(updateApiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(closingPeriodPayload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Server error" }));
        throw new Error(
          `Failed to save closing period: ${
            errorData.message || response.statusText
          }`
        );
      }

      const result = await response.json();
      // console.log("Closing period saved successfully:", result);
      alert("Closing period saved successfully!");
    } catch (e) {
      // console.error("Error saving Closing Period:", e);
      alert(`Error saving Closing Period: ${e.message}`);
    }
  }, [closingPeriod, escalationMonth, escalationPercent, closingPeriodId, escalationMonthId, escalationPercentId]);

  const handleSaveAllSettings = async () => {
    // console.log("Saving all settings...");
    if (activeTab === "projectSettings") {
      await handleSaveProjectSettings();
    } else if (activeTab === "OrganizationSettings") {
      await handleSaveOrganizationSettings();
    }
  };

  const filteredProjects = availableProjects.filter((project) => {
    const keyword = selectedProjectId ? selectedProjectId.toLowerCase() : "";
    const projectIdMatch =
      typeof project.projectId === "string" &&
      project.projectId.toLowerCase().includes(keyword);
    const nameMatch =
      typeof project.name === "string" &&
      project.name.toLowerCase().includes(keyword);
    return projectIdMatch || nameMatch;
  });

  if (loading && availableProjects.length === 0 && !error) {
    return (
      <div className="p-4 text-center text-blue-600">
        Loading available projects...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center p-4">
      {/* Retained w-full px-8 for wider display within its parent */}
      <div className="w-full px-8 bg-white border-line p-6 space-y-6">
        <h2 className="w-full  bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
          Settings
        </h2>

        {/* Tab Navigation */}
        <div className="flex border-line mb-6">
          <button
            className={cn(
              "py-2 px-4 text-lg font-medium focus:outline-none",
              activeTab === "projectSettings"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            )}
            onClick={() => setActiveTab("projectSettings")}
          >
            Project Settings
          </button>
          <button
            className={cn(
              "py-2 px-4 text-lg font-medium focus:outline-none",
              activeTab === "OrganizationSettings"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            )}
            onClick={() => setActiveTab("OrganizationSettings")}
          >
            Organization Settings
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "projectSettings" && (
            <div className="p-4 bg-white border-line">
              <h3 className="text-xl mb-4">Project Settings</h3>
              {/* Changed gap-y-8 back to gap-y-5 for more compact layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Project ID Dropdown */}
                  {/* <div>
                    <label
                      htmlFor="projectId"
                      className="block text-sm font-medium"
                    >
                      Project ID <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="projectId"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option key="select-project-placeholder" value="">
                        Select a Project
                      </option>
                      
                      {availableProjects.map((project, index) => (
                        <option
                          key={
                            project.projectId
                              ? String(project.projectId)
                              : `project-idx-${index}`
                          }
                          value={project.projectId}
                        >
                          {project.name
                            ? `${project.projectId} - ${project.name}`
                            : project.id}
                        </option>
                      ))}
                    </select>
                  </div> */}

                  <div>
                    <label
                      htmlFor="projectId"
                      className="block text-sm font-medium"
                    >
                      Project ID <span className="text-red-500">*</span>
                    </label>
                    <Select
                      inputId="projectId"
                      options={projectOptions}
                      isLoading={loading}
                      value={
                        projectOptions.find(
                          (opt) => opt.value === selectedProjectId
                        ) || null
                      }
                      onChange={(opt) =>
                        setSelectedProjectId(opt ? opt.value : "")
                      }
                      isSearchable
                      placeholder="Search & select a project"
                      menuPlacement="auto"
                    />
                  </div>

                  {/* Project Budget Period Method */}
                  {/* <div>
                    <label
                      htmlFor="projectBudgetPeriodMethod"
                      className="block text-sm font-medium"
                    >
                      Project Budget Period Method{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="projectBudgetPeriodMethod"
                      value={projectBudgetPeriodMethod}
                      onChange={(e) => setProjectBudgetPeriodMethod(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId} // Disable if no project selected
                    >
                      <option
                        key="pbp-accounting-periods-only"
                        value="Accounting Periods ONLY"
                      >
                        Accounting Periods ONLY
                      </option>
                    </select>
                  </div> */}

                  {/* Project Account Group Code */}
                  {/* <div>
                    <label
                      htmlFor="projectAccountGroupCode"
                      className="block text-sm font-medium"
                    >
                      Project Account Group Code
                    </label>
                    <input
                      id="projectAccountGroupCode"
                      type="text"
                      value={projectAccountGroupCode}
                      onChange={(e) => setProjectAccountGroupCode(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    />
                  </div> */}

                  {/* Auto Plug Calculation */}
                  {/* <div>
                    <label
                      htmlFor="autoPlugCalculation"
                      className="block text-sm font-medium"
                    >
                      Auto Plug Calculation <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="autoPlugCalculation"
                      value={autoPlugCalculation}
                      onChange={(e) => setAutoPlugCalculation(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    >
                      <option key="apc-on" value="On">
                        On
                      </option>
                      <option key="apc-off" value="Off">
                        Off
                      </option>
                    </select>
                  </div> */}

                  {/* Timesheet Import History */}
                  {/* <div>
                    <label
                      htmlFor="timesheetImportHistory"
                      className="block text-sm font-medium"
                    >
                      Timesheet Import History
                    </label>
                    <div className="flex items-center mt-1">
                      <input
                        id="timesheetImportHistory"
                        type="number"
                        value={timesheetImportHistory}
                        onChange={(e) =>
                          setTimesheetImportHistory(parseInt(e.target.value, 10))
                        }
                        className="w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading || !selectedProjectId}
                      />
                      <span className="ml-2 text-sm text-gray-600">Months</span>
                    </div>
                  </div> */}

                  {/* Timesheet Schedule Code */}
                  {/* <div>
                    <label
                      htmlFor="timesheetScheduleCode"
                      className="block text-sm font-medium"
                    >
                      Timesheet Schedule Code
                    </label>
                    <input
                      id="timesheetScheduleCode"
                      type="text"
                      value={timesheetScheduleCode}
                      onChange={(e) => setTimesheetScheduleCode(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    />
                  </div> */}

                  {/* Labor Escalation Month */}
                  <div>
                    <label
                      htmlFor="laborEscalationMonth"
                      className="block text-sm font-medium"
                    >
                      Labor Escalation Month{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="laborEscalationMonth"
                      value={laborEscalationMonth}
                      onChange={(e) => setLaborEscalationMonth(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    >
                      <option key="lem-select-option" value="">
                        Select Option
                      </option>
                      {monthOptions.map((option) => (
                        // Ensured option.value is a string for key
                        <option key={String(option.value)} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Labor Escalation Value */}
                  <div>
                    <label
                      htmlFor="laborEscalationValue"
                      className="block text-sm font-medium"
                    >
                      Labor Escalation Value{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      {/* <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                        %
                      </span> */}
                      <input
                        id="laborEscalationValue"
                        type="text"
                        value={
                          laborEscalationValue ? `${laborEscalationValue}%` : ""
                        }
                        onChange={(e) => {
                          let val = e.target.value.replace("%", ""); // strip % when typing
                          handleLaborEscalationValueChange(val);
                        }}
                        placeholder="0.00000"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={loading || !selectedProjectId}
                      />
                    </div>
                  </div>

                  {/* Project Security to be based on */}
                  {/* <div>
                    <label
                      htmlFor="projectSecurityToBeBasedOn"
                      className="block text-sm font-medium"
                    >
                      Project Security to be based on{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="projectSecurityToBeBasedOn"
                      value={projectSecurityToBeBasedOn}
                      onChange={(e) => setProjectSecurityToBeBasedOn(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    >
                      <option
                        key="ps-project-budget-security"
                        value="Project Budget Security"
                      >
                        Project Budget Security
                      </option>
                      <option key="ps-org-id" value="Org ID">
                        Org ID
                      </option>
                    </select>
                  </div> */}

                  {/* Allow BUD/EAC Creation Prior to Period Close */}
                  {/* <div>
                    <label
                      htmlFor="allowBUDEACCreationPriorToPeriodClose"
                      className="block text-sm font-medium"
                    >
                      Allow BUD/EAC creation prior to period close{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="allowBUDEACCreationPriorToPeriodClose"
                      value={allowBUDEACCreationPriorToPeriodClose}
                      onChange={(e) =>
                        setAllowBUDEACCreationPriorToPeriodClose(e.target.value)
                      }
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    >
                      <option
                        key="ace-current-period"
                        value="Create BUD/EACs based on Current Period"
                      >
                        Create BUD/EACs based on Current Period
                      </option>
                      <option
                        key="ace-last-closed-period"
                        value="Create BUD/EACs based on Last Closed Period (Standard function)"
                      >
                        Create BUD/EACs based on Last Closed Period (Standard function)
                      </option>
                    </select>
                  </div> */}

                  {/* If Labor Suppression is off, do you want to show Employee Labor Rate Planning */}
                  {/* <div>
                    <label
                      htmlFor="ifLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning"
                      className="block text-sm font-medium"
                    >
                      If Labor Suppression is off, do you want to show Employee Labor
                      Rate Planning?
                    </label>
                    <select
                      id="ifLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning"
                      value={
                        ifLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning
                      }
                      onChange={(e) =>
                        setIfLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning(
                          e.target.value
                        )
                      }
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    >
                      <option key="slrp-yes" value="Yes">
                        Yes
                      </option>
                      <option key="slrp-no" value="No">
                        No
                      </option>
                    </select>
                  </div> */}

                  {/* Default Burden Template */}
                  {/* <div>
                    <label
                      htmlFor="defaultBurdenTemplate"
                      className="block text-sm font-medium"
                    >
                      Default Burden Template <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="defaultBurdenTemplate"
                      type="text"
                      value={defaultBurdenTemplate}
                      onChange={(e) => setDefaultBurdenTemplate(e.target.value)}
                      readOnly
                      className="w-full mt-1 bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm cursor-not-allowed"
                      disabled={loading || !selectedProjectId}
                    />
                  </div> */}

                  {/* Workforce Rule */}
                  <div>
                    <label
                      htmlFor="workforceRule"
                      className="block text-sm font-medium"
                    >
                      Workforce Rule <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="workforceRule"
                      value={workforceRule}
                      onChange={(e) => setWorkforceRule(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    >
                      {workforceRules.map((rule) => (
                        <option key={rule} value={rule}>
                          {rule}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Org Level Display */}
                  {/* <div>
                    <label
                      htmlFor="orgLevelDisplay"
                      className="block text-sm font-medium"
                    >
                      Org Level Display <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="orgLevelDisplay"
                      type="number"
                      value={orgLevelDisplay}
                      onChange={(e) => setOrgLevelDisplay(parseInt(e.target.value, 10))}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    />
                  </div> */}
                  {/* closing period */}
                  {/* <div>
                    <label
                      htmlFor="closingPeriod"
                      className="block text-sm font-medium"
                    >
                      Closing Period <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="closingPeriod"
                      type="date"
                      value={closingPeriod}
                      onChange={(e) => setClosingPeriod(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 
                       text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    />
                  </div> */}
                </div>

                {/* Right Column (Checkboxes) */}
                {/* Adjusted space-y-4 to space-y-5 to match left column if desired, or keep at space-y-4 for slightly tighter checkbox groups */}
                <div className="space-y-5 mt-8 md:mt-0">
                  {" "}
                  {/* Adjusted to space-y-5 for consistency */}
                  {/* Unlock EAC Last Closed Period */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="unlockEACLastClosedPeriod"
                      type="checkbox"
                      checked={unlockEACLastClosedPeriod}
                      onChange={(e) =>
                        setUnlockEACLastClosedPeriod(e.target.checked)
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="unlockEACLastClosedPeriod"
                      className="text-sm"
                    >
                      Unlock EAC Last Closed Period
                    </label>
                  </div>
                  {/* Resource Budget Commit Flag Default */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="resourceBudgetCommitFlagDefault"
                      type="checkbox"
                      checked={resourceBudgetCommitFlagDefault}
                      onChange={(e) =>
                        setResourceBudgetCommitFlagDefault(e.target.checked)
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="resourceBudgetCommitFlagDefault"
                      className="text-sm"
                    >
                      Resource Budget Commit Flag Default
                    </label>
                  </div>
                  {/* Import Budget/EACs from Excel Commit Flag Default */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="importBudgetEACsFromExcelCommitFlagDefault"
                      type="checkbox"
                      checked={importBudgetEACsFromExcelCommitFlagDefault}
                      onChange={(e) =>
                        setImportBudgetEACsFromExcelCommitFlagDefault(
                          e.target.checked
                        )
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="importBudgetEACsFromExcelCommitFlagDefault"
                      className="text-sm"
                    >
                      Import Budget/EACs from Excel Commit Flag Default
                    </label>
                  </div>
                  {/* Import New Business Budget from Excel Commit Flag */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="importNewBusinessBudgetFromExcelCommitFlag"
                      type="checkbox"
                      checked={importNewBusinessBudgetFromExcelCommitFlag}
                      onChange={(e) =>
                        setImportNewBusinessBudgetFromExcelCommitFlag(
                          e.target.checked
                        )
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="importNewBusinessBudgetFromExcelCommitFlag"
                      className="text-sm"
                    >
                      Import New Business Budget from Excel Commit Flag
                    </label>
                  </div>
                  {/* Check the Project Budget "Enable Subtask Row Hide" option by default */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="checkTheProjectBudgetEnableSubtaskRowHideOptionByDefault"
                      type="checkbox"
                      checked={
                        checkTheProjectBudgetEnableSubtaskRowHideOptionByDefault
                      }
                      onChange={(e) =>
                        setCheckTheProjectBudgetEnableSubtaskRowHideOptionByDefault(
                          e.target.checked
                        )
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="checkTheProjectBudgetEnableSubtaskRowHideOptionByDefault"
                      className="text-sm"
                    >
                      Check the Project Budget "Enable Subtask Row Hide" option
                      by default
                    </label>
                  </div>
                  {/* Enable Project "Hide Bud/EAC" */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="enableProjectHideBudEAC"
                      type="checkbox"
                      checked={enableProjectHideBudEAC}
                      onChange={(e) =>
                        setEnableProjectHideBudEAC(e.target.checked)
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="enableProjectHideBudEAC"
                      className="text-sm"
                    >
                      Enable Project "Hide Bud/EAC"
                    </label>
                  </div>
                  {/* Show Budget/EAC Only Default */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="showBudEACOnlyDefault"
                      type="checkbox"
                      checked={showBudEACOnlyDefault}
                      onChange={(e) =>
                        setShowBudEACOnlyDefault(e.target.checked)
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label htmlFor="showBudEACOnlyDefault" className="text-sm">
                      Show Budget/EAC Only Default
                    </label>
                  </div>
                  {/* Enable Budget Auto Inspect */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="enableBudgetAutoInspect"
                      type="checkbox"
                      checked={enableBudgetAutoInspect}
                      onChange={(e) =>
                        setEnableBudgetAutoInspect(e.target.checked)
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="enableBudgetAutoInspect"
                      className="text-sm"
                    >
                      Enable Budget Auto Inspect
                    </label>
                  </div>
                  {/* Project Budget Sequential Locking */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="projectBudgetSequentialLocking"
                      type="checkbox"
                      checked={projectBudgetSequentialLocking}
                      onChange={(e) =>
                        setProjectBudgetSequentialLocking(e.target.checked)
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="projectBudgetSequentialLocking"
                      className="text-sm"
                    >
                      Project Budget Sequential Locking
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "OrganizationSettings" && (
            <div className="p-4 bg-white border-line">
              <h3 className="text-xl mb-4">Organization Settings</h3>
              {/* Changed gap-y-8 back to gap-y-5 for more compact layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* closing period */}
                  <div>
                    <label
                      htmlFor="closingPeriod"
                      className="block text-sm font-medium"
                    >
                      Closing Period <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="closingPeriod"
                      type="date"
                      value={closingPeriod}
                      onChange={(e) => setClosingPeriod(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 
                       text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      // disabled={loading || !selectedProjectId}
                    />
                  </div>

                  {/* Labor Escalation Month */}
                  <div>
                    <label
                      htmlFor="laborEscalationMonth"
                      className="block text-sm font-medium"
                    >
                      Labor Escalation Month{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="laborEscalationMonth"
                      value={escalationMonth}
                      onChange={(e) => setEscalationMonth(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="">Select Option</option>
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Labor Escalation Value */}
                  <div>
                    <label
                      htmlFor="laborEscalationValue"
                      className="block text-sm font-medium"
                    >
                      Labor Escalation Value{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="laborEscalationValue"
                        type="text"
                        value={escalationPercent ? `${escalationPercent}%` : ""}
                        onChange={(e) =>
                          setEscalationPercent(e.target.value.replace("%", ""))
                        }
                        placeholder="0.00000"
                        className="w-full pl-7 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="paidTimeOffExpenseAccount"
                      className="block text-sm font-medium"
                    >
                      Paid Time Off Expense Account{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="paidTimeOffExpenseAccount"
                      type="text"
                      value={paidTimeOffExpenseAccount}
                      onChange={(e) =>
                        setPaidTimeOffExpenseAccount(e.target.value)
                      }
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Holiday Expense Account */}
                  <div>
                    <label
                      htmlFor="holidayExpenseAccount"
                      className="block text-sm font-medium"
                    >
                      Holiday Expense Account{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="holidayExpenseAccount"
                      type="text"
                      value={holidayExpenseAccount}
                      onChange={(e) => setHolidayExpenseAccount(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* PTO Calculation Method */}
                  <div>
                    <label
                      htmlFor="ptoCalculationMethod"
                      className="block text-sm font-medium"
                    >
                      PTO Calculation Method{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="ptoCalculationMethod"
                      value={ptoCalculationMethod}
                      onChange={(e) => setPtoCalculationMethod(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option key="pto-hours" value="Hours">
                        Hours
                      </option>
                    </select>
                  </div>

                  {/* Default PTO Accrual Rate */}
                  <div>
                    <label
                      htmlFor="defaultPtoAccrualRate"
                      className="block text-sm font-medium"
                    >
                      Default PTO Accrual Rate{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="defaultPtoAccrualRate"
                      type="text"
                      value={defaultPtoAccrualRate}
                      onChange={handleNumericInput(setDefaultPtoAccrualRate)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Part-Time Holiday Calculation % */}
                  <div>
                    <label
                      htmlFor="partTimeHolidayCalculation"
                      className="block text-sm font-medium"
                    >
                      Part-Time Holiday Calculation %{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="partTimeHolidayCalculation"
                      type="text"
                      value={partTimeHolidayCalculation}
                      onChange={handleNumericInput(
                        setPartTimeHolidayCalculation
                      )}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Default Fee Rate */}
                  <div>
                    <label
                      htmlFor="defaultFeeRate"
                      className="block text-sm font-medium"
                    >
                      Default Fee Rate <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="defaultFeeRate"
                      type="text"
                      value={defaultFeeRate}
                      onChange={handleNumericInput(setDefaultFeeRate)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Default Utilization % */}
                  <div>
                    <label
                      htmlFor="defaultUtilization"
                      className="block text-sm font-medium"
                    >
                      Default Utilization %{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="defaultUtilization"
                      type="text"
                      value={defaultUtilization}
                      onChange={handleNumericInput(setDefaultUtilization)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Labor Expense Org Level(s) */}
                  <div>
                    <label
                      htmlFor="laborExpenseOrgLevels"
                      className="block text-sm font-medium"
                    >
                      Labor Expense Org Level(s){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="laborExpenseOrgLevels"
                      type="text"
                      value={laborExpenseOrgLevels}
                      onChange={(e) => setLaborExpenseOrgLevels(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Non-Labor Expense Org Level(s) */}
                  <div>
                    <label
                      htmlFor="nonLaborExpenseOrgLevels"
                      className="block text-sm font-medium"
                    >
                      Non-Labor Expense Org Level(s){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nonLaborExpenseOrgLevels"
                      type="text"
                      value={nonLaborExpenseOrgLevels}
                      onChange={(e) =>
                        setNonLaborExpenseOrgLevels(e.target.value)
                      }
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Org Budget Revenue Calculation */}
                  <div>
                    <label
                      htmlFor="orgBudgetRevenueCalculation"
                      className="block text-sm font-medium"
                    >
                      Org Budget Revenue Calculation{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="orgBudgetRevenueCalculation"
                      value={orgBudgetRevenueCalculation}
                      onChange={(e) =>
                        setOrgBudgetRevenueCalculation(e.target.value)
                      }
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option
                        key="org-budget-revenue-project-plus-org-revenue"
                        value="Project Plus Org Revenue Adjustment"
                      >
                        Project Plus Org Revenue Adjustment
                      </option>
                    </select>
                  </div>

                  {/* NLAB $ History Method */}
                  <div>
                    <label
                      htmlFor="nlabHistoryMethod"
                      className="block text-sm font-medium"
                    >
                      NLAB $ History Method{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="nlabHistoryMethod"
                      value={nlabHistoryMethod}
                      onChange={(e) => setNlabHistoryMethod(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option
                        key="nlab-populate-gl-account-history"
                        value="Populate GL Account History"
                      >
                        Populate GL Account History
                      </option>
                    </select>
                  </div>
                </div>

                {/* Right Column (Checkboxes) */}
                <div className="space-y-4">
                  {" "}
                  {/* Adjusted space-y to 4 for checkboxes for slightly less spacing */}
                  {/* Update Employee Home Org */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="updateEmployeeHomeOrg"
                      type="checkbox"
                      checked={updateEmployeeHomeOrg}
                      onChange={(e) =>
                        setUpdateEmployeeHomeOrg(e.target.checked)
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="updateEmployeeHomeOrg" className="text-sm">
                      Update Employee Home Org
                    </label>
                  </div>
                  {/* Update Employee Accrual Rate */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="updateEmployeeAccrualRate"
                      type="checkbox"
                      checked={updateEmployeeAccrualRate}
                      onChange={(e) =>
                        setUpdateEmployeeAccrualRate(e.target.checked)
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="updateEmployeeAccrualRate"
                      className="text-sm"
                    >
                      Update Employee Accrual Rate
                    </label>
                  </div>
                  {/* Apply % Probability to New Business Budgets */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="applyProbabilityToNewBusinessBudgets"
                      type="checkbox"
                      checked={applyProbabilityToNewBusinessBudgets}
                      onChange={(e) =>
                        setApplyProbabilityToNewBusinessBudgets(
                          e.target.checked
                        )
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="applyProbabilityToNewBusinessBudgets"
                      className="text-sm"
                    >
                      Apply % Probability to New Business Budgets
                    </label>
                  </div>
                  {/* Org Budget Sequential Locking */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="orgBudgetSequentialLocking"
                      type="checkbox"
                      checked={orgBudgetSequentialLocking}
                      onChange={(e) =>
                        setOrgBudgetSequentialLocking(e.target.checked)
                      }
                      className="rounded-md h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="orgBudgetSequentialLocking"
                      className="text-sm"
                    >
                      Org Budget Sequential Locking
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit button for the whole form - can be moved inside each tab if needed */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleSaveAllSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Save Setting
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaborForm;
