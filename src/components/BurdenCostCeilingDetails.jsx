import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSave, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const FISCAL_YEAR_START = 2020;
const FISCAL_YEAR_END = 2035;
const ceilingMethods = [
  { value: "C", label: "Ceiling" },
  { value: "O", label: "Override" },
  { value: "F", label: "Fixed" },
];
const applyToRBAOptions = [
  { value: "R", label: "Revenue" },
  { value: "B", label: "Billing" },
  { value: "A", label: "All" },
  { value: "N", label: "None" },
];

const isValidProjectId = (id) => !!id;

const BurdenCostCeilingDetails = ({
  projectId,
  isSearched,
  updatedBy = "user",
}) => {
  const [accounts, setAccounts] = useState([]);
  const [pools, setPools] = useState([]);
  const [burdenCeilings, setBurdenCeilings] = useState([]);
  const [fiscalYear, setFiscalYear] = useState(
    new Date().getFullYear().toString()
  );
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRow, setNewRow] = useState({
    accountId: "",
    accountName: "",
    poolCode: "",
    rateCeiling: "",
    ceilingMethodCode: "",
    applyToRbaCode: "",
    fiscalYear: new Date().getFullYear().toString(),
  });

  const [editIndex, setEditIndex] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [lastSearchedProjectId, setLastSearchedProjectId] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const shouldShowTable =
    isSearched && isValidProjectId(projectId) && hasSearched;

  // Fiscal years for dropdown
  const fiscalYearOptions = [];
  for (let y = FISCAL_YEAR_START; y <= FISCAL_YEAR_END; y++) {
    fiscalYearOptions.push(y.toString());
  }

  // Fetch ACCOUNTS: make objects with { acctId, acctName }
  // useEffect(() => {
  //   let active = true;
  //   if (!(isSearched && isValidProjectId(projectId))) {
  //     setAccounts([]);
  //     return;
  //   }
  //   axios
  //     .get(`${backendUrl}/Project/GetAllProjectByProjId/${projectId}`)
  //     .then((res) => {
  //       const project = res.data?.[0] || {};
  //       const labor = Array.isArray(project.laborAccounts)
  //         ? project.laborAccounts.map((code) => ({
  //             acctId: code,
  //             acctName: code, // No name provided
  //             type: "labor",
  //           }))
  //         : [];
  //       const nonLabor = Array.isArray(project.nonLaborAccounts)
  //         ? project.nonLaborAccounts.map((code) => ({
  //             acctId: code,
  //             acctName: code, // No name provided
  //             type: "nonLabor",
  //           }))
  //         : [];
  //       if (active) setAccounts([...labor, ...nonLabor]);
  //     })
  //     .catch(() => setAccounts([]));
  //   return () => {
  //     active = false;
  //   };
  // }, [isSearched, projectId]);

  useEffect(() => {
    let active = true;
    if (!(isSearched && isValidProjectId(projectId))) {
      setAccounts([]);
      return;
    }

    axios
      .get(`${backendUrl}/Project/GetAllProjectByProjId/${projectId}`)
      .then((res) => {
        const project = res.data?.[0] || {};

        const getAccounts = (arr, type) =>
          Array.isArray(arr)
            ? arr.map((a) => ({
                acctId: a.accountId,
                acctName: a.acctName,
                type,
              }))
            : [];

        const labor = [
          ...getAccounts(project.employeeLaborAccounts, "labor"),
          ...getAccounts(project.otherDirectCostLaborAccounts, "labor"),
          ...getAccounts(project.sunContractorLaborAccounts, "labor"),
        ];

        const nonLabor = [
          ...getAccounts(project.employeeNonLaborAccounts, "nonLabor"),
          ...getAccounts(project.otherDirectCostNonLaborAccounts, "nonLabor"),
          ...getAccounts(project.subContractorNonLaborAccounts, "nonLabor"),
        ];

        if (active) setAccounts([...labor, ...nonLabor]);
      })
      .catch(() => setAccounts([]));

    return () => {
      active = false;
    };
  }, [isSearched, projectId]);

  // Fetch BURDEN CEILINGS (project/fiscal year)
  useEffect(() => {
    let active = true;
    if (isSearched && isValidProjectId(projectId)) {
      setIsLoading(true);
      axios
        .get(
          `${backendUrl}/Project/GetAllBurdenCeilingForProject?projId=${projectId}`
        )
        .then((res) => {
          if (active) {
            setBurdenCeilings(
              Array.isArray(res.data?.data) ? res.data.data : []
            );
            setLastSearchedProjectId(projectId);
            setHasSearched(true);
          }
        })
        .catch(() => {
          if (active) {
            setBurdenCeilings([]);
            setLastSearchedProjectId(projectId);
            setHasSearched(true);
          }
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
            setShowNewRow(false);
            // setPools([]);
          }
        });
    } else {
      setBurdenCeilings([]);
      setShowNewRow(false);
      setPools([]);
      setLastSearchedProjectId("");
      setHasSearched(false);
      setIsLoading(false);
    }
    return () => {
      active = false;
    };
  }, [isSearched, projectId]);

  // Fetch pools when account is selected in new row
  // const handleNewAccountChange = async (value) => {
  //   const selected = accounts.find((acct) => acct.acctId === value);
  //   if (selected) {
  //     setNewRow((prev) => ({
  //       ...prev,
  //       accountId: selected.acctId,
  //       accountName: selected.acctName,
  //       poolCode: "",
  //     }));
  //     try {
  //       const res = await axios.get(
  //         `${backendUrl}/Orgnization/GetPoolsByOrgAccount?accountId=${selected.acctId}&orgId=1.02`
  //       );
  //       setPools(Array.isArray(res.data) ? res.data : []);
  //     } catch {
  //       setPools([]);
  //     }
  //   } else {
  //     setNewRow((prev) => ({
  //       ...prev,
  //       accountId: value,
  //       accountName: "",
  //       poolCode: "",
  //     }));
  //     setPools([]);
  //   }
  // };
  const handleNewAccountChange = (value) => {
    const selected = accounts.find((acct) => acct.acctId === value);
    if (selected) {
      setNewRow((prev) => ({
        ...prev,
        accountId: selected.acctId,
        accountName: selected.acctName,
        poolCode: "", // reset pool selection
      }));

      // All pools are already fetched in `pools` state via useEffect
      // No need to call API per account
      // You can optionally filter if pools had accountId
      // const filteredPools = pools.filter(p => p.accountId === selected.acctId);
      // setPools(filteredPools);
    } else {
      setNewRow((prev) => ({
        ...prev,
        accountId: value,
        accountName: "",
        poolCode: "",
      }));
    }
  };

  // --- New Entry row controls ---
  const handleNewClick = () => {
    if (!isSearched || !isValidProjectId(projectId)) {
      alert("Please enter a valid project ID (e.g., PROJ123) and search.");
      return;
    }
    setShowNewRow(true);
    setNewRow({
      accountId: "",
      accountName: "",
      poolCode: "",
      rateCeiling: "",
      ceilingMethodCode: "",
      applyToRbaCode: "",
      fiscalYear: fiscalYear,
    });
    // setPools([]);
  };

  // const handleSave = async () => {
  //   if (
  //     !newRow.accountId ||
  //     !newRow.poolCode ||
  //     !newRow.rateCeiling ||
  //     !newRow.ceilingMethodCode ||
  //     !newRow.applyToRbaCode ||
  //     !newRow.fiscalYear
  //   ) {
  //     alert("Please fill all fields.");
  //     return;
  //   }
  //   if (!updatedBy) {
  //     alert("updatedBy is required. Please provide a user name.");
  //     return;
  //   }
  //   if (!isSearched || !isValidProjectId(projectId)) {
  //     alert("Please enter a valid project ID (e.g., PROJ123) and search.");
  //     return;
  //   }
  //   const requestBody = {
  //     projectId: lastSearchedProjectId,
  //     fiscalYear: newRow.fiscalYear,
  //     accountId: newRow.accountId,
  //     poolCode: newRow.poolCode,
  //     rateCeiling: parseFloat(newRow.rateCeiling) || 0,
  //     rateFormat: "%",
  //     comCeiling: 0,
  //     comFormat: "",
  //     ceilingMethodCode: newRow.ceilingMethodCode,
  //     applyToRbaCode: newRow.applyToRbaCode,
  //   };
  //   try {
  //     await axios.post(
  //       `${backendUrl}/Project/CreateBurdenCeilingForProject?updatedBy=${updatedBy}`,
  //       requestBody
  //     );
  //     // Refresh
  //     const res = await axios.get(
  //       `${backendUrl}/Project/GetAllBurdenCeilingForProject?projId=${lastSearchedProjectId}`
  //     );
  //     setBurdenCeilings(Array.isArray(res.data?.data) ? res.data.data : []);
  //     setShowNewRow(false);
  //     setNewRow({
  //       accountId: "",
  //       accountName: "",
  //       poolCode: "",
  //       rateCeiling: "",
  //       ceilingMethodCode: "",
  //       applyToRbaCode: "",
  //       fiscalYear: fiscalYear,
  //     });
  //   } catch (err) {
  //     alert("Failed to save. Please check your input and try again.");
  //   }
  // };

  const handleSave = async () => {
    if (
      !newRow.accountId ||
      !newRow.poolCode ||
      !newRow.rateCeiling ||
      !newRow.ceilingMethodCode ||
      !newRow.applyToRbaCode ||
      !newRow.fiscalYear
    ) {
      alert("Please fill all fields.");
      return;
    }
    if (!updatedBy) {
      alert("updatedBy is required. Please provide a user name.");
      return;
    }
    if (!isSearched || !isValidProjectId(projectId)) {
      alert("Please enter a valid project ID (e.g., PROJ123) and search.");
      return;
    }
    const requestBody = {
      projectId: lastSearchedProjectId,
      fiscalYear: newRow.fiscalYear,
      accountId: newRow.accountId,
      accountDesc: newRow.accountName || "", // Add this field
      poolCode: newRow.poolCode,
      rateCeiling: parseFloat(newRow.rateCeiling) || 0,
      rateFormat: "%",
      comCeiling: 0,
      comFormat: "",
      ceilingMethodCode: newRow.ceilingMethodCode,
      applyToRbaCode: newRow.applyToRbaCode,
    };
    try {
      await axios.post(
        `${backendUrl}/Project/CreateBurdenCeilingForProject?updatedBy=${updatedBy}`,
        requestBody
      );
      // Refresh
      const res = await axios.get(
        `${backendUrl}/Project/GetAllBurdenCeilingForProject?projId=${lastSearchedProjectId}`
      );
      setBurdenCeilings(Array.isArray(res.data?.data) ? res.data.data : []);
      setShowNewRow(false);
      setNewRow({
        accountId: "",
        accountName: "",
        poolCode: "",
        rateCeiling: "",
        ceilingMethodCode: "",
        applyToRbaCode: "",
        fiscalYear: fiscalYear,
      });
    } catch (err) {
      // console.error("Save error:", err.response?.data); // Add this to see detailed error
      alert("Failed to save. Please check your input and try again.");
    }
  };

  const handleCancelNewRow = () => {
    setShowNewRow(false);
    setNewRow({
      accountId: "",
      accountName: "",
      poolCode: "",
      rateCeiling: "",
      ceilingMethodCode: "",
      applyToRbaCode: "",
      fiscalYear: fiscalYear,
    });
    setPools([]);
  };

  // --- Edit controls ---
  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditRow({
      rateCeiling: burdenCeilings[index].rateCeiling,
      applyToRbaCode: burdenCeilings[index].applyToRbaCode,
    });
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditRow((prev) => ({ ...prev, [name]: value }));
  };
  const handleUpdate = async (index) => {
    const row = burdenCeilings[index];
    if (!isSearched || !isValidProjectId(projectId)) {
      alert("Please enter a valid project ID (e.g., PROJ123) and search.");
      return;
    }
    const requestBody = {
      projectId: row.projectId,
      fiscalYear: row.fiscalYear,
      accountId: row.accountId,
      accountDesc: newRow.accountName || "",
      poolCode: row.poolCode,
      rateCeiling: parseFloat(editRow.rateCeiling) || 0,
      rateFormat: row.rateFormat,
      comCeiling: row.comCeiling,
      comFormat: row.comFormat,
      ceilingMethodCode: row.ceilingMethodCode,
      applyToRbaCode: editRow.applyToRbaCode,
    };
    try {
      await axios.put(
        `${backendUrl}/Project/UpdateBurdenCeilingForProject?updatedBy=${updatedBy}`,
        requestBody
      );
      // Refresh
      const res = await axios.get(
        `${backendUrl}/Project/GetAllBurdenCeilingForProject?projId=${lastSearchedProjectId}`
      );
      setBurdenCeilings(Array.isArray(res.data?.data) ? res.data.data : []);
      setEditIndex(null);
      setEditRow({});
    } catch {
      alert("Failed to update. Please check your input and try again.");
    }
  };
  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditRow({});
  };

  // --- UI-only delete for row (not from API) ---
  // const handleDeleteUI = (index) => {
  //   setBurdenCeilings((prev) => prev.filter((_, i) => i !== index));
  // };

  const handleDelete = async (index) => {
    const ceiling = burdenCeilings[index]; // get the row to delete

    if (!ceiling) return;

    try {
      const response = await fetch(
        `${backendUrl}/Project/DeleteBurdenCeilingForProject/${ceiling.projectId}/${ceiling.fiscalYear}/${ceiling.accountId}/${ceiling.poolCode}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete burden ceiling");
      }

      // ✅ Update UI after successful backend delete
      setBurdenCeilings((prev) => prev.filter((_, i) => i !== index));
      toast.success("Record deleted successfully!");
    } catch (error) {
      // console.error("Delete error:", error);
      alert("Could not delete burden ceiling. Please try again.");
    }
  };

  // Fiscal year filter
  const filteredCeilings = burdenCeilings.filter(
    (c) => c.fiscalYear === fiscalYear
  );

  //get pool
  // useEffect(() => {
  //   let active = true;
  //   const fetchPools = async () => {
  //     try {
  //       const res = await axios.get(
  //         "${backendUrl}/Orgnization/GetAllPools"
  //       );
  //       console.log("Pools API response:", res.data); // Debug the response
  //       if (active) {
  //         setPools(Array.isArray(res.data) ? res.data : []);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching pools:", err); // Debug the error
  //       if (active) setPools([]);
  //     }
  //   };
  //   fetchPools();
  //   return () => {
  //     active = false;
  //   };
  // }, []);
  //get pool
  // useEffect(() => {
  //   let active = true;
  //   const fetchPools = async () => {
  //     try {
  //       const res = await axios.get(
  //         "${backendUrl}/Orgnization/GetAllPools"
  //       );
  //       console.log("Pools API response:", res.data); // Debug the response
  //       if (active) {
  //         // Handle different possible response structures
  //         let poolData = [];
  //         if (Array.isArray(res.data)) {
  //           poolData = res.data;
  //         } else if (res.data && Array.isArray(res.data.data)) {
  //           poolData = res.data.data;
  //         }
  //         setPools(poolData);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching pools:", err); // Debug the error
  //       if (active) setPools([]);
  //     }
  //   };
  //   fetchPools();
  //   return () => {
  //     active = false;
  //   };
  // }, []);

  // Fetch pools when project is searched
  useEffect(() => {
    let active = true;
    const fetchPools = async () => {
      try {
        const res = await axios.get(`${backendUrl}/Orgnization/GetAllPools`);
        // console.log("Pools API response:", res.data); // Keep for debugging
        if (active) {
          // Handle different possible response structures
          let poolData = [];
          if (Array.isArray(res.data)) {
            poolData = res.data;
          } else if (res.data && Array.isArray(res.data.data)) {
            poolData = res.data.data;
          } else if (
            res.data &&
            res.data.pools &&
            Array.isArray(res.data.pools)
          ) {
            poolData = res.data.pools;
          }

          // console.log("Processed pools data:", poolData); // Keep for debugging
          setPools(poolData);
        }
      } catch (err) {
        // console.error("Error fetching pools:", err);
        if (active) setPools([]);
      }
    };

    // Only fetch pools when we have a valid searched project
    if (isSearched && isValidProjectId(projectId) && hasSearched) {
      fetchPools();
    } else {
      setPools([]);
    }

    return () => {
      active = false;
    };
  }, [isSearched, projectId, hasSearched, backendUrl]); // Added proper dependencies

  // --- MESSAGE UI ---
  if (isSearched && !isValidProjectId(projectId)) {
    return <div className="text-red-600 font-medium">Invalid project ID.</div>;
  }

  // if (
  //   !isLoading &&
  //   shouldShowTable &&
  //   filteredCeilings.length === 0 &&
  //   !showNewRow
  // ) {
  //   return (
  //     <div className="text-gray-600">
  //       No data available for fiscal year {fiscalYear}.
  //     </div>
  //   );
  // }

  if (!shouldShowTable) {
    return (
      <div className="text-gray-600">
        Please search for a project to view details.
      </div>
    );
  }

  // --- UI ---
  return (
    <div className="animate-fade-in">
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-md">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Burden Cost Ceilings
          </h2>
          <div className="flex items-center mb-2 flex-wrap">
            <label className="text-sm font-medium text-gray-700 mr-2">
              Project:
            </label>
            <span className="text-sm text-gray-900">
              {lastSearchedProjectId}
            </span>
            <span className="ml-4 text-sm text-gray-900">Org ID: 1.02</span>
            <span className="ml-4 text-sm text-gray-900">Fiscal Year:</span>
            <select
              className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
            >
              {fiscalYearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
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
        ) : filteredCeilings.length === 0 && !showNewRow ? (
          <p className="text-gray-600">No data available.</p>
        ) : (
          <div className="overflow-x-auto border-line">
            <table className="w-full table">
              <thead className="thead">
                <tr>
                  <th className="th-thead">Account</th>
                  <th className="th-thead">Account Name</th>
                  <th className="th-thead">Pool</th>
                  <th className="th-thead  ">Rate Ceiling</th>
                  <th className="th-thead  ">Ceiling Method</th>
                  <th className="th-thead  ">Apply to R/B/A</th>
                  <th className="th-thead  ">Action</th>
                </tr>
              </thead>
              <tbody className="tbody">
                {showNewRow && (
                  <tr className="bg-white border-b border-gray-200 hover:bg-gray-50">
                    <td className="tbody-td max-h-32 overflow-y-auto">
                      <input
                        list="accountSuggestions"
                        value={newRow.accountId}
                        onChange={(e) => handleNewAccountChange(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal bg-gray-50"
                        placeholder="Search Account"
                      />
                      {/* <datalist id="accountSuggestions">
                        {accounts.map((account) => (
                          <option key={account.acctId} value={account.acctId}>
                            {account.acctId}
                          </option>
                        ))}
                      </datalist> */}
                      <datalist id="accountSuggestions">
                        {accounts.map((account) => (
                          <option key={account.acctId} value={account.acctId}>
                            {account.acctName} {/* now shows proper name */}
                          </option>
                        ))}
                      </datalist>
                    </td>
                    <td className="tbody-td">{newRow.accountName}</td>
                    {/* <td className="px-2 py-1">
                      <select
                        value={newRow.poolCode}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            poolCode: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                        disabled={!newRow.accountId}
                      >
                        <option value="">-- Select Pool --</option>
                        {pools.map((pool) => (
                          <option
                            key={pool.poolId ?? pool}
                            value={pool.poolId ?? pool}
                          >
                            {pool.poolId ?? pool}
                          </option>
                        ))}
                      </select>
                    </td> */}
                    <td className="tbody-td">
                      <select
                        value={newRow.poolCode}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            poolCode: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal"
                      >
                        <option value="">-- Select Pool --</option>
                        {pools.map((pool, idx) => {
                          // Handle different possible pool object structures
                          const poolCode =
                            pool.code || pool.poolCode || pool.poolId || pool;
                          const poolDisplay =
                            pool.name || pool.poolName || poolCode;
                          return (
                            <option
                              key={pool.id || poolCode || idx}
                              value={poolCode}
                            >
                              {poolDisplay}
                            </option>
                          );
                        })}
                      </select>
                    </td>

                    <td className="tbody-td">
                      <input
                        type="text"
                        value={newRow.rateCeiling}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            rateCeiling: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="tbody-td">
                      <select
                        value={newRow.ceilingMethodCode}
                        onChange={(e) =>
                          setNewRow((prev) => ({
                            ...prev,
                            ceilingMethodCode: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal text-center"
                      >
                        <option value="">-- Select --</option>
                        {ceilingMethods.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
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
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal text-center"
                      >
                        <option value="">-- Select --</option>
                        {applyToRBAOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
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
                {filteredCeilings.map((ceiling, index) => (
                  <tr
                    key={`${ceiling.accountId}-${ceiling.fiscalYear}-${ceiling.poolCode}-${index}`}
                    className="bg-white border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="tbody-td">{ceiling.accountId}</td>
                    <td className="tbody-td">
                      {accounts.find((a) => a.acctId === ceiling.accountId)
                        ?.acctName || "N/A"}
                    </td>
                    {/* <td className="tbody-td">
                      {ceiling.poolCode}
                    </td> */}
                    <td className="tbody-td">
                      {
                        pools.find(
                          (pool) =>
                            pool.code === ceiling.poolCode ||
                            pool.poolCode === ceiling.poolCode ||
                            pool.poolId === ceiling.poolCode
                        )?.name ||
                          pools.find(
                            (pool) => pool.poolCode === ceiling.poolCode
                          )?.poolName ||
                          ceiling.poolCode // fallback if no match
                      }
                    </td>

                    <td className="tbody-td  ">
                      {editIndex === index ? (
                        <input
                          type="text"
                          name="rateCeiling"
                          value={editRow.rateCeiling}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal text-center"
                        />
                      ) : (
                        <span className="font-normal">
                          {ceiling.rateCeiling}
                        </span>
                      )}
                    </td>
                    <td className="tbody-td  ">{ceiling.ceilingMethodCode}</td>
                    <td className="tbody-td  ">
                      {editIndex === index ? (
                        <select
                          name="applyToRbaCode"
                          value={editRow.applyToRbaCode}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs font-normal text-center"
                        >
                          {applyToRBAOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-normal">
                          {ceiling.applyToRbaCode}
                        </span>
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
                          <button
                            onClick={() => handleDelete(index)}
                            className="text-gray-400 hover:text-gray-800"
                            title="Delete"
                            style={{ background: "none", border: "none" }}
                          >
                            <FaTrash size={16} />
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

export default BurdenCostCeilingDetails;
