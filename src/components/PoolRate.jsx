import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useLocation } from "react-router-dom";
import { backendUrl } from "./config";

// Basic Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message || "Please try again later."}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const PoolRate = ({ userName = "User" }) => {
  const [templates, setTemplates] = useState([]);
  const [pools, setPools] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editMonths, setEditMonths] = useState(new Set());
  const [findValue, setFindAndReplace] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [selectedPools, setSelectedPools] = useState([]);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const initialMonthlyData = useRef([]);
  // const currentYear = new Date().getFullYear();
  // const years = Array.from({ length: 11 }, (_, i) => currentYear + i);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const isNavigating = useRef(false);
  const pendingNavigation = useRef(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${backendUrl}/Orgnization/GetAllTemplates`
        );
        // console.log("Templates API Response:", response.data);
        setTemplates(response.data || []);
        setError(null);
      } catch (err) {
        const errorMessage =
          "Failed to fetch templates: " +
          (err.response?.data?.message || err.message || "Unknown error");
        setError(errorMessage);
        // console.error(errorMessage, err);
        toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!selectedTemplate || !selectedYear) {
      setPools([]);
      setMonthlyData([]);
      setEditMonths(new Set());
      setSelectedPools([]);
      return;
    }

    const fetchPoolsAndRates = async () => {
      setLoading(true);
      try {
        const poolsResponse = await axios.get(
          `${backendUrl}/Orgnization/GetPoolsByTemplateId?templateId=${selectedTemplate}`
        );
        // console.log("Pools API Response:", poolsResponse.data);
        // const poolList = poolsResponse.data || [];
        const rawPoolList = poolsResponse.data || [];

        // Filter out specific poolIds that shouldn't show on UI
        const poolList = rawPoolList.filter(
          (pool) =>
            !["FRINGEONGNA", "OVERHEADONGNA", "FRINGEONOVERHEAD"].includes(
              pool.poolId
            )
        );

        setPools(poolList);

        if (poolList.length === 0) {
          setError("No pools found for the selected template.");
          setMonthlyData([]);
          setLoading(false);
          return;
        }

        const ratesPromises = poolList.map((pool) =>
          axios
            .get(
              `${backendUrl}/Orgnization/GetRatesByPoolsTemplateId?templateId=${selectedTemplate}&poolId=${pool.poolId}&year=${selectedYear}`
            )
            .catch((err) => {
              // console.error(
              //   `Failed to fetch rates for pool ${pool.poolId}:`,
              //   err
              // );
              return { data: [] };
            })
        );
        const ratesResponses = await Promise.all(ratesPromises);
        // console.log("Rates API Responses:", ratesResponses);

        const monthlyData = months.map((month, index) => {
          const monthIndex = index + 1;
          const monthRates = {};
          poolList.forEach((pool, idx) => {
            const fetchedRates = ratesResponses[idx].data || [];
            // console.log(
            //   `Rates for pool ${pool.poolId}, month ${monthIndex}:`,
            //   fetchedRates
            // );
            const monthData = fetchedRates.find(
              (item) => item.month === monthIndex
            );
            monthRates[pool.poolId] = {
              targetRate: monthData ? monthData.targetRate.toString() : "0",
              id: monthData ? monthData.id : 0,
            };
          });
          return { month, rates: monthRates };
        });

        setMonthlyData(monthlyData);
        initialMonthlyData.current = JSON.parse(JSON.stringify(monthlyData));
        setEditMonths(new Set());
        setError(null);
      } catch (err) {
        const errorMessage =
          "Failed to fetch pools or rates: " +
          (err.response?.data?.message || err.message || "Bad request");
        setError(errorMessage);
        // console.error(errorMessage, err);
        toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
      } finally {
        setLoading(false);
      }
    };
    fetchPoolsAndRates();
  }, [selectedTemplate, selectedYear]);

  // Custom navigation blocking for react-router-dom v7
  useEffect(() => {
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;

    const handleNavigation = (nextPath) => {
      if (isNavigating.current) return true;
      if (editMonths.size > 0 && nextPath !== location.pathname) {
        // console.log("Navigation attempt with unsaved changes:", {
        //   current: location.pathname,
        //   next: nextPath,
        //   editMonths: Array.from(editMonths),
        // });
        isNavigating.current = true;
        pendingNavigation.current = nextPath;

        const userConfirmed = window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        );
        if (userConfirmed) {
          isNavigating.current = false;
          pendingNavigation.current = null;
          return true; // Allow navigation
        } else {
          isNavigating.current = false;
          return false; // Block navigation
        }
      }
      isNavigating.current = false;
      return true; // Allow navigation
    };

    window.history.pushState = function (...args) {
      const nextPath = args[2] || location.pathname;
      if (handleNavigation(nextPath)) {
        return originalPush.apply(window.history, args);
      }
    };

    window.history.replaceState = function (...args) {
      const nextPath = args[2] || location.pathname;
      if (handleNavigation(nextPath)) {
        return originalReplace.apply(window.history, args);
      }
    };

    const handlePopState = () => {
      const nextPath = window.location.pathname;
      if (!handleNavigation(nextPath)) {
        // Revert popstate to stay on current page
        window.history.pushState({}, "", location.pathname);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [editMonths, location.pathname]);

  // Handle beforeunload for browser tab close or external navigation
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (editMonths.size > 0 && !isNavigating.current) {
        // console.log(
        //   "BeforeUnload triggered: Unsaved changes detected",
        //   Array.from(editMonths)
        // );
        event.preventDefault();
        event.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return event.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [editMonths]);


  const handleTargetRateChange = (month, poolId, inputValue) => {
    let value = inputValue;

    // Check if the value starts with minus or is negative
    if (
      value.startsWith("-") ||
      (value !== "" && !isNaN(value) && parseFloat(value) < 0)
    ) {
      toast.error(
        "Negative values are not allowed. Please enter a positive value.",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
      return; // Don't update the state with negative value
    }

    // Handle validation for non-empty, non-decimal-point values
    if (value !== "" && value !== ".") {
      // Check if it's a valid number
      if (!isNaN(value)) {
        const numValue = parseFloat(value);

        // Check for infinite values
        if (!isFinite(numValue)) {
          toast.error("Invalid value. Please enter a finite number.", {
            position: "top-right",
            autoClose: 3000,
          });
          return;
        }

        // Only restrict decimal places, NOT the whole number part
        const parts = value.split(".");
        if (parts.length === 2 && parts[1].length > 6) {
          // Truncate to 6 decimal places only
          value = parts[0] + "." + parts[1].substring(0, 6);
          toast.warning(
            "Maximum 6 decimal places allowed. Value has been truncated.",
            {
              position: "top-right",
              autoClose: 2500,
            }
          );
        }
      } else {
        // Invalid number format
        toast.error("Please enter a valid number.", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }
    }

    // Allow empty string, decimal point, or any valid positive number
    if (
      value === "" ||
      value === "." ||
      (!isNaN(value) && isFinite(parseFloat(value)) && parseFloat(value) >= 0)
    ) {
      setMonthlyData((prev) =>
        prev.map((item) =>
          item.month === month
            ? {
                ...item,
                rates: {
                  ...item.rates,
                  [poolId]: { ...item.rates[poolId], targetRate: value },
                },
              }
            : item
        )
      );

      const monthIndex = months.indexOf(month);
      const initialValue =
        initialMonthlyData.current[monthIndex]?.rates[poolId]?.targetRate ||
        "0";
      const hasChanged = value !== initialValue;

      setEditMonths((prev) => {
        const newSet = new Set(prev);
        const key = `${month}_${poolId}`;
        if (hasChanged) {
          newSet.add(key);
        } else {
          newSet.delete(key);
        }
        // console.log("EditMonths updated:", Array.from(newSet));
        return newSet;
      });
    }
  };

  const handleFindAndReplace = () => {
    if (!findValue || !replaceValue || monthlyData.length === 0) {
      toast.error("Please enter both find and replace values.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (selectedPools.length === 0) {
      toast.error(
        "Please select at least one pool to perform find and replace.",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
      return;
    }

    const updatedMonthlyData = monthlyData.map((monthData, monthIndex) => {
      const updatedRates = { ...monthData.rates };
      const poolsToProcess = pools.filter((pool) =>
        selectedPools.includes(pool.poolId)
      );
      poolsToProcess.forEach((pool) => {
        const currentRate = monthData.rates[pool.poolId]?.targetRate || "0";
        if (currentRate === findValue) {
          updatedRates[pool.poolId] = {
            ...updatedRates[pool.poolId],
            targetRate: replaceValue,
          };
          const initialValue =
            initialMonthlyData.current[monthIndex]?.rates[pool.poolId]
              ?.targetRate || "0";
          const hasChanged = replaceValue !== initialValue;
          setEditMonths((prev) => {
            const newSet = new Set(prev);
            const key = `${monthData.month}_${pool.poolId}`;
            if (hasChanged) {
              newSet.add(key);
            } else {
              newSet.delete(key);
            }
            // console.log(
            //   "EditMonths updated after replace:",
            //   Array.from(newSet)
            // );
            return newSet;
          });
        }
      });
      return { ...monthData, rates: updatedRates };
    });

    setMonthlyData(updatedMonthlyData);
    setFindAndReplace("");
    setReplaceValue("");
    setSelectedPools([]);
    const poolScope = ` for pools ${pools
      .filter((p) => selectedPools.includes(p.poolId))
      .map((p) => p.groupName)
      .join(", ")}`;
    toast.success(
      `Replaced "${findValue}" with "${replaceValue}" across all months${poolScope}`,
      {
        position: "top-right",
        autoClose: 3000,
      }
    );
    // console.log(
    //   `Find and Replace applied: find=${findValue}, replace=${replaceValue}, pools=${selectedPools}`
    // );
  };

  const handlePoolToggle = (poolId) => {
    setSelectedPools((prev) =>
      prev.includes(poolId)
        ? prev.filter((id) => id !== poolId)
        : [...prev, poolId]
    );
  };

  const saveMonthlyData = async () => {
    if (editMonths.size === 0 || isSaving) return;

    setIsSaving(true);
    try {
      const payload = Array.from(editMonths).map((key) => {
        const [month, poolId] = key.split("_");
        const monthIndex = months.indexOf(month) + 1;
        const monthData = monthlyData.find((item) => item.month === month);
        const targetRate =
          monthData.rates[poolId].targetRate === ""
            ? 0
            : parseFloat(monthData.rates[poolId].targetRate) || 0;
        return {
          id: monthData.rates[poolId].id || 0,
          templateId: parseInt(selectedTemplate),
          poolId: poolId,
          year: parseInt(selectedYear),
          month: monthIndex,
          targetRate,
          modifiedBy: userName,
        };
      });
      const response = await axios.post(
        `${backendUrl}/Orgnization/UpsertPoolRatesForTemplate?updatedBy=${userName}`,
        payload
      );
      // console.log("Save API Response:", response.data);
      const updatedMonthlyData = monthlyData.map((item) => {
        const monthIndex = months.indexOf(item.month) + 1;
        const updatedRates = { ...item.rates };
        payload.forEach((p) => {
          if (
            p.month === monthIndex &&
            editMonths.has(`${item.month}_${p.poolId}`)
          ) {
            updatedRates[p.poolId] = {
              ...updatedRates[p.poolId],
              targetRate: p.targetRate.toString(),
              id: p.id || 0,
            };
          }
        });
        return { ...item, rates: updatedRates };
      });
      setMonthlyData(updatedMonthlyData);
      initialMonthlyData.current = JSON.parse(
        JSON.stringify(updatedMonthlyData)
      );
      setEditMonths(new Set());
      setError(null);
      toast.success("Data saved successfully", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      const errorMessage =
        "Failed to save monthly data: " +
        (err.response?.data?.message || err.message || "Unknown error");
      setError(errorMessage);
      // console.error(errorMessage, err);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Allow navigation after user acknowledges alert
  const proceedWithNavigation = () => {
    if (pendingNavigation.current && !isNavigating.current) {
      const targetPath = pendingNavigation.current;
      pendingNavigation.current = null;
      isNavigating.current = true;
      navigate(targetPath);
      isNavigating.current = false;
    }
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 text-sm font-roboto">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-4 sm:p-5 max-w-6xl mx-auto font-roboto bg-gray-50 rounded-xl shadow-md">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
        />
        {/* <h1 className="w-full  bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
          Pool Rate
        </h1> */}
        {loading && <p className="text-gray-600 text-sm mb-2">Loading...</p>}
        {isSaving && <p className="text-gray-600 text-sm mb-2">Saving...</p>}
        {error && <p className="text-red-600 text-sm mb-2">Error: {error}</p>}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-1/4 space-y-3">
            <div>
              <label
                htmlFor="template"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Template
              </label>
              <select
                id="template"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={loading}
              >
                <option value="">Select Template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.templateCode}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Year
              </label>
              <select
                id="year"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                style={{ direction: "ltr" }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={loading}
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="button"
                className="w-full px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 text-sm font-medium shadow-sm transition-colors"
                onClick={saveMonthlyData}
                disabled={editMonths.size === 0 || loading || isSaving}
              >
                Save
              </button>
            </div>
            <div>
              {pendingNavigation.current && (
                <button
                  type="button"
                  className="w-full px-4 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm font-medium shadow-sm transition-colors mt-2"
                  onClick={proceedWithNavigation}
                >
                  Proceed with Navigation
                </button>
              )}
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium shadow-sm transition-colors"
                onClick={() => setIsFindReplaceOpen(!isFindReplaceOpen)}
                disabled={loading || isSaving}
              >
                <span>Find and Replace</span>
                <svg
                  className={`w-5 h-5 transform ${
                    isFindReplaceOpen ? "rotate-45" : ""
                  } transition-transform-xs`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
              {isFindReplaceOpen && (
                <div className="mt-3 space-y-3 bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div>
                    <label
                      htmlFor="find"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Find Value
                    </label>
                    <input
                      id="find"
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                      value={findValue}
                      onChange={(e) => setFindAndReplace(e.target.value)}
                      placeholder="Enter value to find"
                      disabled={loading || isSaving}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="replace"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Replace With
                    </label>
                    <input
                      id="replace"
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                      value={replaceValue}
                      onChange={(e) => setReplaceValue(e.target.value)}
                      placeholder="Enter new value"
                      disabled={loading || isSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pools
                    </label>
                    {pools.length > 0 ? (
                      <div className="flex flex-nowrap overflow-x-auto gap-4 py-2">
                        {pools.map((pool) => (
                          <label
                            key={pool.poolId}
                            className="flex items-center space-x-2 text-sm text-gray-700 whitespace-nowrap min-w-fit"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPools.includes(pool.poolId)}
                              onChange={() => handlePoolToggle(pool.poolId)}
                              disabled={loading || isSaving}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="break-words max-w-[150px]">
                              {pool.groupName}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        No pools available
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="w-full px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 text-sm font-medium shadow-sm transition-colors"
                    onClick={handleFindAndReplace}
                    disabled={
                      loading || isSaving || !findValue || !replaceValue
                    }
                  >
                    Replace All
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="lg:w-3/4">
            {selectedTemplate && selectedYear && (
              <div>
                <h2 className="text-sm font-medium text-gray-900 mb-1">
                  Target Rates
                </h2>
                <div className="border border-gray-300 rounded-lg shadow-md overflow-x-auto w-fit">
                  <table className="table">
                    <thead className="thead">
                      <tr>
                        <th className="th-thead w-[80px]">Month</th>
                        {pools.map((pool) => (
                          <th key={pool.poolId} className="th-thead  w-[60px]">
                            {pool.groupName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {monthlyData.length > 0 && !loading && !error ? (
                        monthlyData.map((data) => (
                          <tr key={data.month} className="bg-white">
                            <td className="tbody-td w-[80px]">{data.month}</td>
                            {pools.map((pool) => (
                              <td
                                key={pool.poolId}
                                className="tbody-td w-[60px]"
                              >
                                {/* <input
                                  type="text"
                                  className="w-12 px-1 py-0.5 border border-gray-300 rounded-md bg-green-50 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs shadow-sm hover:border-blue-400 transition-colors"
                                  value={
                                    data.rates[pool.poolId]?.targetRate || ""
                                  }
                                  onChange={(e) =>
                                    handleTargetRateChange(
                                      data.month,
                                      pool.poolId,
                                      e.target.value
                                    )
                                  }
                                  disabled={loading || isSaving}
                                /> */}
                                {/* <input
                                  type="text" // Keep as text to have full control over input
                                  className="w-12 px-1 py-0.5 border border-gray-300 rounded-md bg-green-50 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs shadow-sm hover:border-blue-400 transition-colors"
                                  value={
                                    data.rates[pool.poolId]?.targetRate || ""
                                  }
                                  onChange={(e) =>
                                    handleTargetRateChange(
                                      data.month,
                                      pool.poolId,
                                      e.target.value
                                    )
                                  }
                                  onInput={(e) => {
                                    // Real-time validation during typing
                                    const value = e.target.value;
                                    if (
                                      value.startsWith("-") ||
                                      (value !== "" &&
                                        !isNaN(value) &&
                                        parseFloat(value) < 0)
                                    ) {
                                      toast.error(
                                        "Negative values are not allowed. Please enter a positive value.",
                                        {
                                          position: "top-right",
                                          autoClose: 2000,
                                        }
                                      );
                                    }
                                  }}
                                  onKeyPress={(e) => {
                                    // Prevent minus key from being entered
                                    if (e.key === "-") {
                                      e.preventDefault();
                                      toast.error(
                                        "Negative values are not allowed for pool rates.",
                                        {
                                          position: "top-right",
                                          autoClose: 2000,
                                        }
                                      );
                                    }
                                  }}
                                  placeholder="0.00"
                                  disabled={loading || isSaving}
                                /> */}
                                {/* <input
  type="text"
  className="w-12 px-1 py-0.5 border border-gray-300 rounded-md bg-green-50 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs shadow-sm hover:border-blue-400 transition-colors"
  value={data.rates[pool.poolId]?.targetRate || ""}
  onChange={(e) =>
    handleTargetRateChange(
      data.month,
      pool.poolId,
      e.target.value
    )
  }
  onBlur={(e) => {
    // Clean up the value on blur (remove trailing decimal point, etc.)
    let value = e.target.value;
    if (value.endsWith('.')) {
      value = value.slice(0, -1);
      handleTargetRateChange(data.month, pool.poolId, value);
    }
  }}
  onKeyPress={(e) => {
    // Prevent minus key from being entered
    if (e.key === '-') {
      e.preventDefault();
      toast.error("Negative values are not allowed for pool rates.", {
        position: "top-right",
        autoClose: 2000,
      });
    }
    
    // Allow only numbers, one decimal point, and limit decimal places
    const value = e.target.value;
    const char = e.key;
    
    // Allow control keys (backspace, delete, etc.)
    if (char === 'Backspace' || char === 'Delete' || char === 'Tab' || char === 'Enter') {
      return;
    }
    
    // Allow only digits and one decimal point
    if (!/[0-9.]/.test(char)) {
      e.preventDefault();
      return;
    }
    
    // Prevent multiple decimal points
    if (char === '.' && value.includes('.')) {
      e.preventDefault();
      return;
    }
    
    // Check decimal places limit
    if (value.includes('.')) {
      const decimalPart = value.split('.')[1];
      if (decimalPart && decimalPart.length >= 6 && char !== '.') {
        e.preventDefault();
        // toast.warning("Maximum 6 decimal places allowed.", {
        //   position: "top-right",
        //   autoClose: 2000,
        // });
        return;
      }
    }
  }}
  placeholder="0.000000"
  maxLength="15" // Reasonable limit for input length
  disabled={loading || isSaving}
/> */}
                                <input
                                  type="text"
                                  className="w-12 px-1 py-0.5 border border-gray-300 rounded-md bg-green-50 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs shadow-sm hover:border-blue-400 transition-colors"
                                  value={
                                    data.rates[pool.poolId]?.targetRate || ""
                                  }
                                  onChange={(e) =>
                                    handleTargetRateChange(
                                      data.month,
                                      pool.poolId,
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) => {
                                    // Clean up the value on blur
                                    let value = e.target.value;
                                    if (value.endsWith(".")) {
                                      value = value.slice(0, -1);
                                      handleTargetRateChange(
                                        data.month,
                                        pool.poolId,
                                        value
                                      );
                                    }
                                  }}
                                  onKeyPress={(e) => {
                                    // Prevent minus key from being entered
                                    if (e.key === "-") {
                                      e.preventDefault();
                                      toast.error(
                                        "Negative values are not allowed.",
                                        {
                                          position: "top-right",
                                          autoClose: 2000,
                                        }
                                      );
                                      return;
                                    }

                                    // Allow only numbers, one decimal point, and control keys
                                    const char = e.key;
                                    const value = e.target.value;

                                    // Allow control keys
                                    if (
                                      char === "Backspace" ||
                                      char === "Delete" ||
                                      char === "Tab" ||
                                      char === "Enter"
                                    ) {
                                      return;
                                    }

                                    // Allow only digits and one decimal point
                                    if (!/[0-9.]/.test(char)) {
                                      e.preventDefault();
                                      return;
                                    }

                                    // Prevent multiple decimal points
                                    if (char === "." && value.includes(".")) {
                                      e.preventDefault();
                                      return;
                                    }

                                    // Only restrict decimal places (after the decimal point), not whole numbers
                                    if (value.includes(".")) {
                                      const decimalPart = value.split(".")[1];
                                      if (
                                        decimalPart &&
                                        decimalPart.length >= 6 &&
                                        char !== "."
                                      ) {
                                        e.preventDefault();
                                        toast.warning(
                                          "Maximum 6 decimal places allowed.",
                                          {
                                            position: "top-right",
                                            autoClose: 2000,
                                          }
                                        );
                                        return;
                                      }
                                    }
                                  }}
                                  onPaste={(e) => {
                                    // Handle paste events
                                    e.preventDefault();
                                    const pastedText = (
                                      e.clipboardData || window.clipboardData
                                    ).getData("text");

                                    if (!isNaN(pastedText)) {
                                      const pastedValue =
                                        parseFloat(pastedText);

                                      if (pastedValue < 0) {
                                        toast.error(
                                          "Negative values are not allowed.",
                                          {
                                            position: "top-right",
                                            autoClose: 3000,
                                          }
                                        );
                                        return;
                                      }
                                      if (!isFinite(pastedValue)) {
                                        toast.error(
                                          "Invalid value. Please paste a finite number.",
                                          {
                                            position: "top-right",
                                            autoClose: 3000,
                                          }
                                        );
                                        return;
                                      }

                                      // Check decimal places only
                                      const parts = pastedText.split(".");
                                      if (
                                        parts.length === 2 &&
                                        parts[1].length > 6
                                      ) {
                                        const truncatedValue =
                                          parts[0] +
                                          "." +
                                          parts[1].substring(0, 6);
                                        toast.warning(
                                          "Pasted value truncated to 6 decimal places.",
                                          {
                                            position: "top-right",
                                            autoClose: 3000,
                                          }
                                        );
                                        handleTargetRateChange(
                                          data.month,
                                          pool.poolId,
                                          truncatedValue
                                        );
                                        return;
                                      }

                                      // If valid, handle the pasted value
                                      handleTargetRateChange(
                                        data.month,
                                        pool.poolId,
                                        pastedText
                                      );
                                    } else {
                                      toast.error(
                                        "Invalid format. Please paste a valid number.",
                                        {
                                          position: "top-right",
                                          autoClose: 3000,
                                        }
                                      );
                                    }
                                  }}
                                  placeholder="0.000000"
                                  disabled={loading || isSaving}
                                />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={pools.length + 1} className="tbody-td">
                            {loading ? (
                              <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                <span className="ml-2">Loading...</span>
                              </div>
                            ) : (
                              "Select a template and year to view data"
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PoolRate;

