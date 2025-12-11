import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProjectHoursDetails from "./ProjectHoursDetails";
import ProjectPlanTable from "./ProjectPlanTable";
import RevenueAnalysisTable from "./RevenueAnalysisTable";
import AnalysisByPeriodContent from "./AnalysisByPeriodContent";
import ProjectAmountsTable from "./ProjectAmountsTable";
import PLCComponent from "./PLCComponent";
import FundingComponent from "./FundingComponent";
import RevenueSetupComponent from "./RevenueSetupComponent";
import RevenueCeilingComponent from "./RevenueCeilingComponent";
import { formatDate } from "./utils";
import FinancialDashboard from "./FinancialDashboard";
import Warning from "./Warning";
import { backendUrl } from "./config";

const ProjectBudgetStatus = () => {
  const [projects, setProjects] = useState([]);
  const [prefixes, setPrefixes] = useState(new Set());
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [revenueAccount, setRevenueAccount] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [forecastData, setForecastData] = useState([]);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState("All");
  const [fiscalYearOptions, setFiscalYearOptions] = useState([]);
  const [analysisApiData, setAnalysisApiData] = useState([]);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const hoursRefs = useRef({});
  const amountsRefs = useRef({});
  const revenueRefs = useRef({});
  const analysisRefs = useRef({});
  const revenueSetupRefs = useRef({});
  const revenueCeilingRefs = useRef({});
  const fundingRefs = useRef({});
  const inputRef = useRef(null);
  const dashboardRefs = useRef({});
  const warningRefs = useRef({});

  const EXTERNAL_API_BASE_URL = backendUrl;
  const CALCULATE_COST_ENDPOINT = "/Forecast/CalculateCost";

  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [userName, setUserName] = useState("User");

  function capitalizeWords(str) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const safeFormatDate = (value) => {
  if (!value) return "N/A";
  
  // Directly convert YYYY-MM-DD string to MM/DD/YYYY string
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    // Note: We use month/day/year here to output the desired format from the input string.
    return `${month}/${day}/${year}`;
  }
  
  // Fallback to imported formatDate for other formats, maintaining existing structure
  return formatDate(value); 
};

  useEffect(() => {
    const userString = localStorage.getItem("currentUser");
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        setUserName(userObj.name ? capitalizeWords(userObj.name) : "User");
        setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
      } catch {
        setCurrentUserRole(null);
        setUserName("User");
      }
    }
  }, []);

  const isChildProjectId = (projId) => {
    return projId && typeof projId === "string" && projId.includes(".");
  };

  useEffect(() => {
    if (!activeTab) return;

    const refMap = {
      hours: hoursRefs,
      amounts: amountsRefs,
      revenueAnalysis: revenueRefs,
      analysisByPeriod: analysisRefs,
      revenueSetup: revenueSetupRefs,
      revenueCeiling: revenueCeilingRefs,
      funding: fundingRefs,
      plc: hoursRefs,
      dashboard: dashboardRefs,
      warning: warningRefs,
    };

    const refObj = refMap[activeTab];

    if (refObj && refObj.current && refObj.current[searchTerm]) {
      requestAnimationFrame(() => {
        refObj.current[searchTerm].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (
        !selectedPlan ||
        !selectedPlan.plId ||
        !selectedPlan.templateId ||
        !selectedPlan.plType
      ) {
        setAnalysisApiData([]);
        setIsAnalysisLoading(false);
        setAnalysisError("Please select a plan to view Analysis By Period.");
        return;
      }
      if (activeTab !== "analysisByPeriod") return;

      setIsAnalysisLoading(true);
      setAnalysisError(null);
      try {
        const params = new URLSearchParams({
          planID: selectedPlan.plId.toString(),
          templateId: selectedPlan.templateId.toString(),
          type: selectedPlan.plType,
        });

        const externalApiUrl = `${EXTERNAL_API_BASE_URL}${CALCULATE_COST_ENDPOINT}?${params.toString()}`;
        // const externalApiUrl = `${backendUrl}/Forecast/CalculateCost?${params.toString()}`;

        const response = await fetch(externalApiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          let errorText = "Unknown error";
          try {
            errorText =
              (await response.json()).message ||
              JSON.stringify(await response.json());
          } catch (e) {
            errorText = await response.text();
          }
          throw new Error(
            `HTTP error! status: ${response.status}. Details: ${errorText}`
          );
        }
        const apiResponse = await response.json();
        setAnalysisApiData(apiResponse);
      } catch (err) {
        setAnalysisError(
          `Failed to load Analysis By Period data. ${err.message}. Please ensure the external API is running and accepts GET request with planID, templateId, and type parameters.`
        );
        setAnalysisApiData([]);
      } finally {
        setIsAnalysisLoading(false);
      }
    };
    fetchAnalysisData();
  }, [selectedPlan, activeTab, EXTERNAL_API_BASE_URL, CALCULATE_COST_ENDPOINT]);

  useEffect(() => {
    if (filteredProjects.length > 0) {
      const project = filteredProjects[0];
      const startDate = project.startDate || project.projStartDt;
      const endDate = project.endDate || project.projEndDt;

      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const date = dateStr.includes("/")
          ? (() => {
              const [month, day, year] = dateStr.split("/");
              return new Date(`${year}-${month}-${day}`);
            })()
          : new Date(dateStr);

        return isNaN(date.getTime()) ? null : date;
      };

      const start = parseDate(startDate);
      const end = parseDate(endDate);

      if (start && end) {
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        const currentYear = new Date().getFullYear();

        if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear) {
          const years = [];
          for (let year = startYear; year <= endYear; year++) {
            years.push(year.toString());
          }
          setFiscalYearOptions(["All", ...years]);
          if (years.includes(currentYear.toString())) {
            setFiscalYear(currentYear.toString());
          } else {
            setFiscalYear("All");
          }
        } else {
          setFiscalYearOptions(["All"]);
          setFiscalYear("All");
        }
      } else {
        setFiscalYearOptions(["All"]);
        setFiscalYear("All");
      }
    } else {
      setFiscalYearOptions(["All"]);
      setFiscalYear("All");
    }
  }, [filteredProjects]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearched(false);
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    const term = searchTerm.trim();

    setSearched(true);
    setErrorMessage("");

    // if (!term) {
    //   setFilteredProjects([]);
    //   setSelectedPlan(null);
    //   setRevenueAccount("");
    //   setPrefixes(new Set());
    //   return;
    // }

    setLoading(true);

    try {
      const response = await axios.get(
        `${backendUrl}/Project/GetAllProjectByProjId/${term}`
      );
      const data = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      const project = {
        projId: data.projectId || term,
        projName: data.name || "",
        projTypeDc: data.description || "",
        orgId: data.orgId || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        fundedCost: data.proj_f_cst_amt || "",
        fundedFee: data.proj_f_fee_amt || "",
        fundedRev: data.proj_f_tot_amt || "",
      };
      const prefix = project.projId.includes(".")
        ? project.projId.split(".")[0]
        : project.projId.includes("T")
        ? project.projId.split("T")[0]
        : project.projId;
      setPrefixes(new Set([prefix]));
      setFilteredProjects([project]);
      setRevenueAccount(data.revenueAccount || "");
    } catch (error) {
      try {
        const planResponse = await axios.get(
          `${backendUrl}/Project/GetProjectPlans/${term}`
        );
        const planData = Array.isArray(planResponse.data)
          ? planResponse.data[0]
          : planResponse.data;
        if (planData && planData.projId) {
          const project = {
            projId: planData.projId || term,
            projName: planData.name || "",
            projTypeDc: planData.description || "",
            orgId: planData.orgId || "",
            startDate: planData.startDate || "",
            endDate: planData.endDate || "",
            fundedCost: planData.proj_f_cst_amt || "",
            fundedFee: planData.proj_f_fee_amt || "",
            fundedRev: planData.proj_f_tot_amt || "",
          };
          const prefix = project.projId.includes(".")
            ? project.projId.split(".")[0]
            : project.projId.includes("T")
            ? project.projId.split("T")[0]
            : project.projId;
          setPrefixes(new Set([prefix]));
          setFilteredProjects([project]);
          setRevenueAccount(planData.revenueAccount || "");
          // toast.info("Project data fetched from plans.", {
          //   toastId: "fallback-project-fetch",
          //   autoClose: 3000,
          // });
        } else {
          throw new Error("No valid plan data found.");
        }
      } catch (planError) {
        setErrorMessage("No project or plan found with that ID.");
        setFilteredProjects([]);
        setSelectedPlan(null);
        setRevenueAccount("");
        setPrefixes(new Set());
        toast.error("Failed to fetch project or plan data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    // handleSearch(e.target.value);
    setErrorMessage("");
    setSearched(false);
    setFilteredProjects([]);
    setSelectedPlan(null);
  };

  // const handlePlanSelect = (plan) => {
  //   if (!plan) {
  //     setSelectedPlan(null);
  //     localStorage.removeItem("selectedPlan");
  //     setActiveTab(null);
  //     setForecastData([]);
  //     setIsForecastLoading(false);
  //     setAnalysisApiData([]);
  //     setIsAnalysisLoading(false);
  //     setAnalysisError(null);
  //     return;
  //   }

  //   if (
  //     !selectedPlan ||
  //     selectedPlan.plId !== plan.plId ||
  //     JSON.stringify(selectedPlan) !== JSON.stringify(plan)
  //   ) {
  //     const project = {
  //       projId: plan.projId || "",
  //       projName: plan.projName || "",
  //       projStartDt: plan.projStartDt || "",
  //       projEndDt: plan.projEndDt || "",
  //       orgId: plan.orgId || "",
  //       fundedCost: plan.fundedCost || "",
  //       fundedFee: plan.fundedFee || "",
  //       fundedRev: plan.fundedRev || "",
  //     };

  //     setFilteredProjects([project]);
  //     setRevenueAccount(plan.revenueAccount || "");
  //     setSelectedPlan(plan);
  //     localStorage.setItem("selectedPlan", JSON.stringify(plan));
  //     setForecastData([]);
  //     setIsForecastLoading(false);
  //     setAnalysisApiData([]);
  //     setIsAnalysisLoading(false);
  //     setAnalysisError(null);
  //   }
  // };
  const handlePlanSelect = (plan) => {
    if (!plan) {
      setSelectedPlan(null);
      localStorage.removeItem("selectedPlan");
      setActiveTab(null);
      setForecastData([]);
      setIsForecastLoading(false);
      setAnalysisApiData([]);
      setIsAnalysisLoading(false);
      setAnalysisError(null);
      return;
    }

    // --- CRITICAL FIX START ---
    // Use an explicit check for necessary updates (ID change or Date change)
    // The previous JSON.stringify check was overly strict and caused the issue.

    const isPlanIdentityChanged = 
        !selectedPlan ||
        selectedPlan.plId !== plan.plId ||
        selectedPlan.projId !== plan.projId;
    
    const hasDatesChanged = 
        selectedPlan && 
        (selectedPlan.projStartDt !== plan.projStartDt || selectedPlan.projEndDt !== plan.projEndDt);

    // Retain the core logic structure: Update only if essential state changes.
    if (isPlanIdentityChanged || hasDatesChanged) {
    // --- CRITICAL FIX END ---
        
      const project = {
        projId: plan.projId || "",
        projName: plan.projName || "",
        // Crucial: Use the latest effective dates passed from the table
        projStartDt: plan.projStartDt || "", 
        projEndDt: plan.projEndDt || "",
        // Retain existing properties for project object
        orgId: plan.orgId || "",
        fundedCost: plan.fundedCost || "",
        fundedFee: plan.fundedFee || "",
        fundedRev: plan.fundedRev || "",
      };

      setFilteredProjects([project]);
      setRevenueAccount(plan.revenueAccount || "");
      setSelectedPlan(plan); // The full plan object now has the correct dates
      localStorage.setItem("selectedPlan", JSON.stringify(plan));
      setForecastData([]);
      setIsForecastLoading(false);
      setAnalysisApiData([]);
      setIsAnalysisLoading(false);
      setAnalysisError(null);
    }
  };
  const handleTabClick = (tabName) => {
    if (!selectedPlan) {
      toast.info("Please select a plan first.", {
        toastId: "no-plan-selected",
        autoClose: 3000,
      });
      return;
    }
    if (activeTab !== tabName) {
      setActiveTab(tabName);
    }
  };

  const handleCloseTab = () => {
    setActiveTab(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 font-inter">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 text-sm sm:text-base">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4  space-y-6 text-sm sm:text-base text-gray-800 font-inter ">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 relative w-full sm:w-auto">
          <label className="font-semibold text-xs sm:text-sm">
            Project ID:
          </label>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              ref={inputRef}
              autoComplete="off"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-3 py-1 rounded cursor-pointer text-xs sm:text-sm font-normal hover:bg-blue-700 transition w-full sm:w-auto"
          >
            Search
          </button>
        </div>
      </div>
      {/* {searched && errorMessage ? (
        <div className="text-red-500 italic text-xs sm:text-sm">
          {errorMessage}
        </div>
      ) : searched && filteredProjects.length === 0 ? (
        <div className="text-gray-500 italic text-xs sm:text-sm">
          No project found with that ID.
        </div>
      ) : ( */}
      {/* { filteredProjects.length >= 0 &&  */}
      {/* ( */}

      <div
        key={searchTerm}
        className="space-y-4 sm:p-4 border-overall  p-2  bg-white mb-8"
      >
        {selectedPlan && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-1">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="font-semibold blue-text">Project ID:</span>{" "}
                <span className="text-gray-700">{selectedPlan.projId}</span>
              </div>
              {/* <div>
                    <span className="font-semibold text-green-800">
                      Project Name:
                    </span>{" "}
                    <span className="text-gray-700">
                      {selectedPlan.projName}
                    </span>
                  </div> */}
              <div>
                <span className="font-semibold blue-text">
                  Period of Performance :
                </span>
                Start Date:{" "}
                <span className="text-gray-700">
                  {formatDate(selectedPlan.projStartDt)}
                  {/* {formatDate(selectedPlan.projStartDt)} */}
                  {/* {safeFormatDate(selectedPlan.projStartDt)} */}
                  {/* {safeFormatDate(selectedPlan.projStartDt)} */}
                </span>{" "}
                |{/* <div> */}
                {/* <span className="font-semibold text-green-800"> */}
                End Date:
                {/* </span>{" "} */}
                <span className="text-gray-700">
                  {formatDate(selectedPlan.projEndDt)}
                  {/* {safeFormatDate(selectedPlan.projEndDt)} */}
                  {/* {safeFormatDate(selectedPlan.projEndDt)} */}
                </span>
              </div>
              {/* </div> */}
              {/* <div>
                    <span className="font-semibold text-green-800">
                      Organization:
                    </span>{" "}
                    <span className="text-gray-700">{selectedPlan.orgId}</span>
                  </div> */}
              <div>
                <span className="font-semibold blue-text">Funded Fee:</span>{" "}
                <span className="text-gray-700">
                  {Number(selectedPlan.fundedFee).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div>
                <span className="font-semibold blue-text">Funded Cost:</span>{" "}
                <span className="text-gray-700">
                  {Number(selectedPlan.fundedCost).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div>
                <span className="font-semibold blue-text">Funded Rev:</span>{" "}
                <span className="text-gray-700">
                  {Number(selectedPlan.fundedRev).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
        {/* Flex container to keep buttons on the left of ProjectPlanTable */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex flex-row lg:flex-col gap-2 text-blue-600 text-xs sm:text-sm w-full lg:w-fit lg:min-w-[150px] flex-wrap mt-4">
            {currentUserRole === "admin" && (
              <span
                className={`btn ${
                  activeTab === "dashboard" ? "btn-active" : "btn-inactive"
                }`}
                onClick={() => handleTabClick("dashboard")}
              >
                Dashboard
              </span>
            )}
            <span
              className={`btn ${
                activeTab === "hours" ? "btn-active" : "btn-inactive"
              }`}
              onClick={() => handleTabClick("hours")}
            >
              Hours
            </span>
            <span
              className={`btn ${
                activeTab === "amounts" ? "btn-active" : "btn-inactive"
              }`}
              onClick={() => handleTabClick("amounts")}
            >
              Other Cost
            </span>
            {currentUserRole === "admin" && (
              <>
                <span
                  className={`btn ${
                    activeTab === "revenueAnalysis"
                      ? "btn-active"
                      : "btn-inactive"
                  }`}
                  onClick={() => handleTabClick("revenueAnalysis")}
                >
                  Revenue Details
                </span>
                <span
                  className={`btn ${
                    activeTab === "analysisByPeriod"
                      ? "btn-active"
                      : "btn-inactive"
                  }`}
                  onClick={() => handleTabClick("analysisByPeriod")}
                >
                  Monthly Forecast
                </span>
                <span
                  className={`btn ${
                    activeTab === "plc" ? "btn-active" : "btn-inactive"
                  }`}
                  onClick={() => handleTabClick("plc")}
                >
                  Labor Categories
                </span>
                <span
                  className={`btn ${
                    activeTab === "revenueSetup" ? "btn-active" : "btn-inactive"
                  }`}
                  onClick={() => handleTabClick("revenueSetup")}
                >
                  Revenue Definition
                </span>
                <span
                  className={`btn ${
                    activeTab === "revenueCeiling"
                      ? "btn-active"
                      : "btn-inactive"
                  }`}
                  onClick={() => handleTabClick("revenueCeiling")}
                >
                  Adjustment
                </span>
                <span
                  className={`btn ${
                    activeTab === "funding" ? "btn-active" : "btn-inactive"
                  }`}
                  onClick={() => handleTabClick("funding")}
                >
                  Funding
                </span>
              </>
            )}

            <span
              className={`btn ${
                activeTab === "warning" ? "btn-active" : "btn-inactive"
              }`}
              onClick={() => handleTabClick("warning")}
            >
              Warning
            </span>
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <ProjectPlanTable
              projectId={searchTerm.trim()}
              searched={searched}
              onPlanSelect={handlePlanSelect}
              selectedPlan={selectedPlan}
              fiscalYear={fiscalYear}
              setFiscalYear={setFiscalYear}
              fiscalYearOptions={fiscalYearOptions}
              filteredProjects={filteredProjects}
            />

            {/* <div className="w-full overflow-hidden">
                  <ProjectPlanTable
                    projectId={searchTerm}
                    onPlanSelect={handlePlanSelect}
                    selectedPlan={selectedPlan}
                    fiscalYear={fiscalYear}
                    setFiscalYear={setFiscalYear}
                    fiscalYearOptions={fiscalYearOptions}
                  />
                </div> */}
            {/* <div className="w-full overflow-hidden">
  {!searched ? (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <div className="text-center">
        <p className="text-lg font-medium mb-2">Search to get project details</p>
        <p className="text-sm">Enter a Project ID and click Search to view project information</p>
      </div>
    </div>
  ) : (
    <ProjectPlanTable
      projectId={searchTerm}
      onPlanSelect={handlePlanSelect}
      selectedPlan={selectedPlan}
      fiscalYear={fiscalYear}
      setFiscalYear={setFiscalYear}
      fiscalYearOptions={fiscalYearOptions}
    />
  )}
</div> */}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
              ref={(el) => (dashboardRefs.current[searchTerm] = el)}
            >
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
                <button
                  className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                  onClick={handleCloseTab}
                  title="Close project details"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs">
                  <span>
                    <span className="font-semibold blue-text">
                      Project ID:{" "}
                    </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                </div>
              </div>
              <FinancialDashboard
                planId={selectedPlan.plId}
                templateId={selectedPlan.templateId}
                type={selectedPlan.plType}
              />
            </div>
          )}

        {/* Hours Tab */}
        {activeTab === "hours" && selectedPlan && (
          <div
            className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16 overflow-x-auto"
            ref={(el) => (hoursRefs.current[searchTerm] = el)}
          >
            <div className="w-full bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
              <button
                className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                onClick={handleCloseTab}
                title="Close project details"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs">
                <span>
                  <span className="font-semibold blue-text">Project ID: </span>
                  {selectedPlan.projId}
                </span>
                <span>
                  <span className="font-semibold blue-text">Type: </span>
                  {selectedPlan.plType || "N/A"}
                </span>
                <span>
                  <span className="font-semibold blue-text">Version: </span>
                  {selectedPlan.version || "N/A"}
                </span>
                <span>
                  <span className="font-semibold blue-text">Status: </span>
                  {selectedPlan.status || "N/A"}
                </span>
                <span>
                  <span className="font-semibold blue-text">
                    Period of Performance:{" "}
                  </span>
                  Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"} |
                  End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                </span>
              </div>
            </div>
            <ProjectHoursDetails
              planId={selectedPlan.plId}
              projectId={selectedPlan.projId}
              status={selectedPlan.status}
              planType={selectedPlan.plType}
              closedPeriod={selectedPlan.closedPeriod}
              startDate={selectedPlan.projStartDt}
              endDate={selectedPlan.projEndDt}
              fiscalYear={fiscalYear}
              onSaveSuccess={() => {}}
            />
          </div>
        )}

        {/* Amounts Tab */}
        {activeTab === "amounts" && selectedPlan && (
          <div
            className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
            ref={(el) => (amountsRefs.current[searchTerm] = el)}
          >
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
              <button
                className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                onClick={handleCloseTab}
                title="Close project details"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs">
                <span>
                  <span className="font-semibold blue-text">Project ID: </span>
                  {selectedPlan.projId}
                </span>
                <span>
                  <span className="font-semibold blue-text">Type: </span>
                  {selectedPlan.plType || "N/A"}
                </span>
                <span>
                  <span className="font-semibold blue-text">Version: </span>
                  {selectedPlan.version || "N/A"}
                </span>
                <span>
                  <span className="font-semibold blue-text">Status: </span>
                  {selectedPlan.status || "N/A"}
                </span>
                <span>
                  <span className="font-semibold blue-text">
                    Period of Performance:{" "}
                  </span>
                  Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"} |
                  End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                </span>
              </div>
            </div>
            <ProjectAmountsTable
              initialData={selectedPlan}
              startDate={selectedPlan.projStartDt}
              endDate={selectedPlan.projEndDt}
              planType={selectedPlan.plType}
              fiscalYear={fiscalYear}
              refreshKey={refreshKey}
              onSaveSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
          </div>
        )}

        {/* Revenue Analysis Tab */}
        {activeTab === "revenueAnalysis" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
              ref={(el) => (revenueRefs.current[searchTerm] = el)}
            >
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
                <button
                  className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                  onClick={handleCloseTab}
                  title="Close project details"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs">
                  <span>
                    <span className="font-semibold blue-text">
                      Project ID:{" "}
                    </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">
                      Period of Performance:{" "}
                    </span>
                    Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"}{" "}
                    | End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                  </span>
                </div>
              </div>
              <RevenueAnalysisTable
                planId={selectedPlan.plId}
                status={selectedPlan.status}
                fiscalYear={fiscalYear}
              />
            </div>
          )}

        {/* Analysis By Period Tab */}
        {activeTab === "analysisByPeriod" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative   p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
              ref={(el) => (analysisRefs.current[searchTerm] = el)}
            >
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
                <button
                  className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                  onClick={handleCloseTab}
                  title="Close project details"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                  <span>
                    <span className="font-semibold blue-text">
                      Project ID:{" "}
                    </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold ">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">
                      Period of Performance:{" "}
                    </span>
                    Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"}{" "}
                    | End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                  </span>
                </div>
              </div>
              <AnalysisByPeriodContent
                onCancel={handleCloseTab}
                planID={selectedPlan.plId}
                templateId={selectedPlan.templateId || 1}
                type={selectedPlan.plType || "TARGET"}
                initialApiData={analysisApiData}
                isLoading={isAnalysisLoading}
                error={analysisError}
                fiscalYear={fiscalYear}
              />
            </div>
          )}

        {/* {activeTab === "plc" && selectedPlan && (
              <div
                className="relative border p-2 sm:p-4 bg-gray-50 rounded shadow min-h-[150px] scroll-mt-16"
                ref={(el) => (hoursRefs.current[searchTerm] = el)}
              >
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl z-10"
                  onClick={handleCloseTab}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <PLCComponent
                  selectedProjectId={selectedPlan.projId}
                  selectedPlan={selectedPlan}
                  showPLC={activeTab === "plc"}
                />
              </div>
            )} */}

        {/* PLC Tab */}
        {activeTab === "plc" && selectedPlan && currentUserRole === "admin" && (
          <div
            className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
            ref={(el) => (hoursRefs.current[searchTerm] = el)}
          >
            {/* <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl z-10"
                  onClick={handleCloseTab}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button> */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
              <button
                className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                onClick={handleCloseTab}
                title="Close project details"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                <span>
                  <span className="font-semibold">Project ID: </span>
                  {selectedPlan.projId}
                </span>
                <span>
                  <span className="font-semibold">Type: </span>
                  {selectedPlan.plType || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Version: </span>
                  {selectedPlan.version || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Status: </span>
                  {selectedPlan.status || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Period of Performance: </span>
                  Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"} |
                  End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                </span>
              </div>
            </div>
            <PLCComponent
              selectedProjectId={selectedPlan.projId}
              selectedPlan={selectedPlan}
              showPLC={activeTab === "plc"}
            />
          </div>
        )}

        {/* RevenueSetup Tab */}
        {activeTab === "revenueSetup" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative  p-2 sm:p-4 border-line  min-h-[150px] scroll-mt-16"
              ref={(el) => (revenueSetupRefs.current[searchTerm] = el)}
            >
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
                <button
                  className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                  onClick={handleCloseTab}
                  title="Close project details"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                  <span>
                    <span className="font-semibold">Project ID: </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">
                      Period of Performance:{" "}
                    </span>
                    Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"}{" "}
                    | End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                  </span>
                </div>
              </div>
              <RevenueSetupComponent
                selectedPlan={{
                  ...selectedPlan,
                  startDate: selectedPlan.startDate,
                  endDate: selectedPlan.endDate,
                  orgId: filteredProjects[0]?.orgId,
                }}
                revenueAccount={revenueAccount}
              />
            </div>
          )}

        {/* Revenue Ceiling Tab */}
        {activeTab === "revenueCeiling" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
              ref={(el) => (revenueCeilingRefs.current[searchTerm] = el)}
            >
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
                <button
                  className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                  onClick={handleCloseTab}
                  title="Close project details"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                  <span>
                    <span className="font-semibold">Project ID: </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">
                      Period of Performance:{" "}
                    </span>
                    Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"}{" "}
                    | End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                  </span>
                </div>
              </div>
              <RevenueCeilingComponent
                selectedPlan={{
                  ...selectedPlan,
                  startDate: selectedPlan.startDate,
                  endDate: selectedPlan.endDate,
                  orgId: filteredProjects[0]?.orgId,
                }}
                revenueAccount={revenueAccount}
              />
            </div>
          )}

        {/* Funding Tab */}
        {activeTab === "funding" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
              ref={(el) => (fundingRefs.current[searchTerm] = el)}
            >
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
                <button
                  className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                  onClick={handleCloseTab}
                  title="Close project details"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                  <span>
                    <span className="font-semibold">Project ID: </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">
                      Period of Performance:{" "}
                    </span>
                    Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"}{" "}
                    | End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                  </span>
                </div>
              </div>
              <FundingComponent
                selectedProjectId={selectedPlan.projId}
                selectedPlan={selectedPlan}
              />
            </div>
          )}

        {/* Warning Tab */}
        {activeTab === "warning" && selectedPlan && (
          <div
            className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
            ref={(el) => (warningRefs.current[searchTerm] = el)}
          >
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
              <button
                className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                onClick={handleCloseTab}
                title="Close project details"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                <span>
                  <span className="font-semibold">Project ID: </span>
                  {selectedPlan.projId}
                </span>
                <span>
                  <span className="font-semibold">Type: </span>
                  {selectedPlan.plType || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Version: </span>
                  {selectedPlan.version || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Status: </span>
                  {selectedPlan.status || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Period of Performance: </span>
                  Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"} |
                  End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                </span>
              </div>
            </div>
            <Warning
              planId={selectedPlan.plId}
              projectId={selectedPlan.projId}
              templateId={selectedPlan.templateId}
              planType={selectedPlan.plType}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectBudgetStatus;
