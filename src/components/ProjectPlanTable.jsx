import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProjectPlanForm from "./ProjectPlanForm";
import NewBusiness from "./NewBusiness";
import { formatDate } from "./utils";
import { backendUrl } from "./config";

const BOOLEAN_FIELDS = ["finalVersion", "isCompleted", "isApproved"];

const COLUMN_LABELS = {
  projId: "Project Id",
  projName: "Project Name",
  plType: "BUD/EAC",
  version: "Revision",
  versionCode: "Version Type",
  source: "Origin",
  finalVersion: "Conclude",
  isCompleted: "Submitted",
  isApproved: "Approved",
  status: "Status",
  closedPeriod: "Closed Period",
  projectStartDate: "Project Start Date",
  projectEndDate: "Project End Date",
  createdAt: "Created At",
  updatedAt: "Updated At",
};

const ProjectPlanTable = ({
  onPlanSelect,
  selectedPlan,
  projectId,
  fiscalYear,
  setFiscalYear,
  fiscalYearOptions,
  searched,
  filteredProjects,
}) => {
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef(null);
  const [lastImportedVersion, setLastImportedVersion] = useState(null);
  const [lastImportTime, setLastImportTime] = useState(null);
  const [editingVersionCodeIdx, setEditingVersionCodeIdx] = useState(null);
  const [editingVersionCodeValue, setEditingVersionCodeValue] = useState("");
  const [budEacFilter, setBudEacFilter] = useState(false);
  const [showNewBusinessPopup, setShowNewBusinessPopup] = useState(false);
  const [editingDates, setEditingDates] = useState({}); // { plId: { startDate, endDate } }


  // Stores manual dates if fetched project lacks them
  const [manualProjectDates, setManualProjectDates] = useState({
    startDate: "",
    endDate: "",
  });

  const [manualDatesSubmitted, setManualDatesSubmitted] = useState(false);


  // Track last fetched project ID and full ID
  const lastFetchedProjectId = useRef(null);
  const fullProjectId = useRef(null);

  // Ref mirror of manual dates (used for non-reactive flows)
  const tempManualDatesRef = useRef({ startDate: "", endDate: "" });

  const isParentProject = (projId) => {
    return projId && typeof projId === "string" && !projId.includes(".");
  };

  const isChildProjectId = (projId) => {
    return projId && typeof projId === "string" && projId.includes(".");
  };

  const formatDateWithTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateOnly = (value) => {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-");
      return `${month}/${day}/${year}`;
    }
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      const y = date.getUTCFullYear();
      const m = date.getUTCMonth() + 1;
      const d = date.getUTCDate();
      return `${m < 10 ? "0" + m : m}/${d < 10 ? "0" + d : d}/${y}`;
    } catch (e) {
      return value;
    }
  };

  const sortPlansByProjIdPlTypeVersion = (plansArray) => {
    return [...plansArray].sort((a, b) => {
      if (a.projId < b.projId) return -1;
      if (a.projId > b.projId) return 1;
      if (a.plType < b.plType) return -1;
      if (a.plType > b.plType) return 1;
      const aVersion = Number(a.version) || 0;
      const bVersion = Number(b.version) || 0;
      return aVersion - bVersion;
    });
  };

  useEffect(() => {
    if (filteredProjects.length > 0) {
      const project = filteredProjects[0];
      const hasStartDate = project.startDate || project.projStartDt;
      const hasEndDate = project.endDate || project.projEndDt;

      const initialDates = {
        startDate: hasStartDate || "",
        endDate: hasEndDate || "",
      };

      setManualProjectDates(initialDates);
      tempManualDatesRef.current = initialDates;

      setColumns([
        "projId",
        "projName",
        "plType",
        "version",
        "versionCode",
        "source",
        "isCompleted",
        "isApproved",
        "finalVersion",
        "status",
        "closedPeriod",
        "projectStartDate",
        "projectEndDate",
      ]);
    } else {
      setColumns([
        "projId",
        "projName",
        "plType",
        "version",
        "versionCode",
        "source",
        "isCompleted",
        "isApproved",
        "finalVersion",
        "status",
        "closedPeriod",
      ]);
      setManualProjectDates({ startDate: "", endDate: "" });
    }
  }, [filteredProjects, projectId]);

  const fetchPlans = async () => {
    if (!searched && projectId.trim() === "") {
      setPlans([]);
      setFilteredPlans([]);
      setLoading(false);
      lastFetchedProjectId.current = null;
      fullProjectId.current = null;
      return;
    }

    if (lastFetchedProjectId.current === projectId) {
      setLoading(false);
      return;
    }

    fullProjectId.current = projectId;

    setLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/Project/GetProjectPlans/${projectId}`
      );

      const transformedPlans = response.data.map((plan, idx) => ({
        plId: plan.plId || plan.id || 0,
        projId:
          plan.fullProjectId ||
          plan.projId ||
          
          plan.project_id ||
          plan.projectId ||
          projectId,
        projName: plan.projName || "",
        plType:
          plan.plType === "Budget"
            ? "BUD"
            : plan.plType === "EAC"
            ? "EAC"
            : plan.plType || "",
        source: plan.source || "",
        version: plan.version || 0,
        versionCode: plan.versionCode || "",
        finalVersion: !!plan.finalVersion,
        isCompleted: !!plan.isCompleted,
        isApproved: !!plan.isApproved,
        status:
          plan.plType && plan.version
            ? (plan.status || "In Progress")
                .replace("Working", "In Progress")
                .replace("Completed", "Submitted")
            : "",
        closedPeriod: plan.closedPeriod || "",
        createdAt: plan.createdAt || "",
        updatedAt: plan.updatedAt || "",
        modifiedBy: plan.modifiedBy || "",
        approvedBy: plan.approvedBy || "",
        createdBy: plan.createdBy || "",
        templateId: plan.templateId || 0,
        projStartDt: plan.projStartDt || "",
        projEndDt: plan.projEndDt || "",
        orgId: plan.orgId || "",
        fundedCost: plan.proj_f_cst_amt || "",
        fundedFee: plan.proj_f_fee_amt || "",
        fundedRev: plan.proj_f_tot_amt || "",
        revenueAccount: plan.revenueAccount || "",
      }));

      const sortedPlans = sortPlansByProjIdPlTypeVersion(transformedPlans);
      setPlans(sortedPlans);
      setFilteredPlans(sortedPlans);
      setColumns([
        "projId",
        "projName",
        "plType",
        "version",
        "versionCode",
        "source",
        "isCompleted",
        "isApproved",
        "finalVersion",
        "status",
        "closedPeriod",
      ]);

      lastFetchedProjectId.current = projectId;
    } catch (error) {
      setPlans([]);
      setFilteredPlans([]);
      toast.error("Failed to fetch plans.");
      lastFetchedProjectId.current = null;
      fullProjectId.current = null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (budEacFilter) {
      const filtered = plans.filter(
        (plan) => plan.plType === "BUD" || plan.plType === "EAC"
      );
      setFilteredPlans(filtered);
    } else {
      setFilteredPlans(plans);
    }
  }, [budEacFilter, plans]);

  useEffect(() => {
    if (projectId !== lastFetchedProjectId.current) {
      fetchPlans();
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedPlan && plans.length > 0) {
      const latest = plans.find(
        (p) => p.plId === selectedPlan.plId && p.projId === selectedPlan.projId
      );
      if (
        latest &&
        (latest.status !== selectedPlan.status ||
          latest.isCompleted !== selectedPlan.isCompleted ||
          latest.isApproved !== selectedPlan.isApproved ||
          latest.finalVersion !== selectedPlan.finalVersion)
      ) {
        onPlanSelect(latest);
      }
    }
  }, [plans, selectedPlan, onPlanSelect]);

  const getCurrentPlan = () => {
    if (!selectedPlan) return null;
    return (
      plans.find(
        (p) => p.plId === selectedPlan.plId && p.projId === selectedPlan.projId
      ) || selectedPlan
    );
  };

  // const refreshPlans = async () => {
  //   if (!projectId) {
  //     setPlans([]);
  //     setFilteredPlans([]);
  //     return;
  //   }

  //   try {
  //     const response = await axios.get(
  //       `${backendUrl}/Project/GetProjectPlans/${projectId}`
  //     );

  //     const transformedPlans = response.data.map((plan) => ({
  //       plId: plan.plId || plan.id || 0,
  //       projId:
  //       plan.fullProjectId ||
  //         plan.projId ||
          
  //         plan.project_id ||
  //         plan.projectId ||
  //         projectId,
  //       projName: plan.projName || "",
  //       plType:
  //         plan.plType === "Budget"
  //           ? "BUD"
  //           : plan.plType === "EAC"
  //           ? "EAC"
  //           : plan.plType || "",
  //       source: plan.source || "",
  //       version: plan.version || 0,
  //       versionCode: plan.versionCode || "",
  //       finalVersion: !!plan.finalVersion,
  //       isCompleted: !!plan.isCompleted,
  //       isApproved: !!plan.isApproved,
  //       status:
  //         plan.plType && plan.version
  //           ? (plan.status || "In Progress")
  //               .replace("Working", "In Progress")
  //               .replace("Completed", "Submitted")
  //           : "",
  //       closedPeriod: plan.closedPeriod || "",
  //       createdAt: plan.createdAt || "",
  //       updatedAt: plan.updatedAt || "",
  //       modifiedBy: plan.modifiedBy || "",
  //       approvedBy: plan.approvedBy || "",
  //       createdBy: plan.createdBy || "",
  //       templateId: plan.templateId || 0,
  //       projStartDt: plan.projStartDt || "",
  //       projEndDt: plan.projEndDt || "",
  //       orgId: plan.orgId || "",
  //       fundedCost: plan.proj_f_cst_amt || "",
  //       fundedFee: plan.proj_f_fee_amt || "",
  //       fundedRev: plan.proj_f_tot_amt || "",
  //       revenueAccount: plan.revenueAccount || "",
  //     }));

  //     const sortedPlans = sortPlansByProjIdPlTypeVersion(transformedPlans);
  //     setPlans(sortedPlans);
  //     setFilteredPlans(sortedPlans);
  //     return sortedPlans;
  //   } catch (error) {
  //     toast.error("Failed to refresh plans.");
  //   }
  // };
  
  const refreshPlans = async () => {
  if (!projectId) {
    setPlans([]);
    setFilteredPlans([]);
    return;
  }

  try {
    const response = await axios.get(
      `${backendUrl}/Project/GetProjectPlans/${projectId}`
    );

    const transformedPlans = response.data.map((plan) => ({
      plId: plan.plId || plan.id || 0,
      projId:
        plan.fullProjectId ||
        plan.projId ||
        plan.project_id ||
        plan.projectId ||
        projectId,
      projName: plan.projName || "",
      plType:
        plan.plType === "Budget"
          ? "BUD"
          : plan.plType === "EAC"
          ? "EAC"
          : plan.plType || "",
      source: plan.source || "",
      version: plan.version || 0,
      versionCode: plan.versionCode || "",
      finalVersion: !!plan.finalVersion,
      isCompleted: !!plan.isCompleted,
      isApproved: !!plan.isApproved,
      status:
        plan.plType && plan.version
          ? (plan.status || "In Progress")
              .replace("Working", "In Progress")
              .replace("Completed", "Submitted")
          : "",
      closedPeriod: plan.closedPeriod || "",
      createdAt: plan.createdAt || "",
      updatedAt: plan.updatedAt || "",
      modifiedBy: plan.modifiedBy || "",
      approvedBy: plan.approvedBy || "",
      createdBy: plan.createdBy || "",
      templateId: plan.templateId || 0,
      projStartDt: plan.projStartDt || "",
      projEndDt: plan.projEndDt || "",
      orgId: plan.orgId || "",
      fundedCost: plan.proj_f_cst_amt || "",
      fundedFee: plan.proj_f_fee_amt || "",
      fundedRev: plan.proj_f_tot_amt || "",
      revenueAccount: plan.revenueAccount || "",
    }));

    const sortedPlans = sortPlansByProjIdPlTypeVersion(transformedPlans);
    setPlans(sortedPlans);
    setFilteredPlans(sortedPlans);
    return sortedPlans;
  } catch (error) {
    toast.error("Failed to refresh plans.");
  }
};

// Only used when projectId is empty but a row is selected.
const refreshPlansForSelected = async () => {
  if (!selectedPlan?.projId) return [];

  try {
    const response = await axios.get(
      `${backendUrl}/Project/GetProjectPlans/${selectedPlan.projId}`
    );

    const transformedPlans = response.data.map((plan) => ({
      plId: plan.plId || plan.id || 0,
      projId:
        plan.fullProjectId ||
        plan.projId ||
        plan.project_id ||
        plan.projectId ||
        selectedPlan.projId,
      projName: plan.projName || "",
      plType:
        plan.plType === "Budget"
          ? "BUD"
          : plan.plType === "EAC"
          ? "EAC"
          : plan.plType || "",
      source: plan.source || "",
      version: plan.version || 0,
      versionCode: plan.versionCode || "",
      finalVersion: !!plan.finalVersion,
      isCompleted: !!plan.isCompleted,
      isApproved: !!plan.isApproved,
      status:
        plan.plType && plan.version
          ? (plan.status || "In Progress")
              .replace("Working", "In Progress")
              .replace("Completed", "Submitted")
          : "",
      closedPeriod: plan.closedPeriod || "",
      createdAt: plan.createdAt || "",
      updatedAt: plan.updatedAt || "",
      modifiedBy: plan.modifiedBy || "",
      approvedBy: plan.approvedBy || "",
      createdBy: plan.createdBy || "",
      templateId: plan.templateId || 0,
      projStartDt: plan.projStartDt || "",
      projEndDt: plan.projEndDt || "",
      orgId: plan.orgId || "",
      fundedCost: plan.proj_f_cst_amt || "",
      fundedFee: plan.proj_f_fee_amt || "",
      fundedRev: plan.proj_f_tot_amt || "",
      revenueAccount: plan.revenueAccount || "",
    }));

    const sortedPlans = sortPlansByProjIdPlTypeVersion(transformedPlans);
    // Important: DO NOT overwrite the main table data when user is in “all projects” mode.
    // Just return the plans for re‑selecting the row.
    return sortedPlans;
  } catch (error) {
    toast.error("Failed to refresh plans.");
    return [];
  }
};


//   const refreshPlans = async () => {
//   // If nothing is selected and no projectId, just clear
//   if (!selectedPlan && !projectId) {
//     setPlans([]);
//     setFilteredPlans([]);
//     return [];
//   }

//   // Prefer the projId of the selected row; fall back to projectId prop
//   const targetProjId = selectedPlan?.projId || projectId;
//   if (!targetProjId) {
//     setPlans([]);
//     setFilteredPlans([]);
//     return [];
//   }

//   try {
//     const response = await axios.get(
//       `${backendUrl}/Project/GetProjectPlans/${targetProjId}`
//     );

//     const transformedPlans = response.data.map((plan) => ({
//       plId: plan.plId || plan.id || 0,
//       projId:
//         plan.fullProjectId ||
//         plan.projId ||
//         plan.project_id ||
//         plan.projectId ||
//         targetProjId,
//       projName: plan.projName || "",
//       plType:
//         plan.plType === "Budget"
//           ? "BUD"
//           : plan.plType === "EAC"
//           ? "EAC"
//           : plan.plType || "",
//       source: plan.source || "",
//       version: plan.version || 0,
//       versionCode: plan.versionCode || "",
//       finalVersion: !!plan.finalVersion,
//       isCompleted: !!plan.isCompleted,
//       isApproved: !!plan.isApproved,
//       status:
//         plan.plType && plan.version
//           ? (plan.status || "In Progress")
//               .replace("Working", "In Progress")
//               .replace("Completed", "Submitted")
//           : "",
//       closedPeriod: plan.closedPeriod || "",
//       createdAt: plan.createdAt || "",
//       updatedAt: plan.updatedAt || "",
//       modifiedBy: plan.modifiedBy || "",
//       approvedBy: plan.approvedBy || "",
//       createdBy: plan.createdBy || "",
//       templateId: plan.templateId || 0,
//       projStartDt: plan.projStartDt || "",
//       projEndDt: plan.projEndDt || "",
//       orgId: plan.orgId || "",
//       fundedCost: plan.proj_f_cst_amt || "",
//       fundedFee: plan.proj_f_fee_amt || "",
//       fundedRev: plan.proj_f_tot_amt || "",
//       revenueAccount: plan.revenueAccount || "",
//     }));

//     const sortedPlans = sortPlansByProjIdPlTypeVersion(transformedPlans);
//     setPlans(sortedPlans);
//     setFilteredPlans(sortedPlans);
//     return sortedPlans;
//   } catch (error) {
//     toast.error("Failed to refresh plans.");
//     return [];
//   }
// };


  const selectNewPlan = (newPlanId) => {
    const newPlan = plans.find(
      (p) => p.projId === newPlanId && p.plType === "NBBUD"
    );
    if (newPlan) {
      handleRowClick(newPlan);
    } else {
      onPlanSelect(null);
    }
  };

  const handleNewBusinessSave = async (savedData) => {
    const newPlans = await refreshPlans();
    const newPlanId = savedData.projId || savedData.businessBudgetId;

    if (newPlanId && newPlans) {
      const planToSelect = newPlans.find(
        (p) => p.projId === newPlanId && p.plType === "NBBUD"
      );
      if (planToSelect) {
        handleRowClick(planToSelect);
        toast.success(`NB BUD plan for ${newPlanId} created and selected.`);
      } else {
        toast.error("Plan created, but auto-selection failed.");
      }
    }
  };

  const handleRowClick = (plan, tempDates = manualProjectDates) => {
    const isDateMissing =
      filteredProjects.length > 0 &&
      !(filteredProjects[0].startDate || filteredProjects[0].projStartDt);

    const effectiveStartDate =
      tempDates?.startDate ||
      (isDateMissing && manualProjectDates.startDate) ||
      plan.projStartDt ||
      plan.startDate ||
      "";
    const effectiveEndDate =
      tempDates?.endDate ||
      (isDateMissing && manualProjectDates.endDate) ||
      plan.projEndDt ||
      plan.endDate ||
      "";

    const updatedPlan = {
      ...plan,
      projStartDt: effectiveStartDate,
      projEndDt: effectiveEndDate,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
    };

     setEditingDates(prev => ({
    ...prev,
    [plan.plId]: {
      startDate: plan.projStartDt || plan.startDate || '',
      endDate: plan.projEndDt || plan.endDate || ''
    }
  }));

    const isSamePlanButDatesChanged =
      selectedPlan &&
      selectedPlan.plId === updatedPlan.plId &&
      selectedPlan.projId === updatedPlan.projId &&
      (selectedPlan.projStartDt !== updatedPlan.projStartDt ||
        selectedPlan.projEndDt !== updatedPlan.projEndDt);

    if (
      !selectedPlan ||
      updatedPlan.plId !== selectedPlan.plId ||
      updatedPlan.projId !== selectedPlan.projId ||
      isSamePlanButDatesChanged
    ) {
      onPlanSelect(updatedPlan);
    } else {
      onPlanSelect(updatedPlan);
    }
  };


//   const handleDateCellChange = async (plId, dateColumn, value) => {
//   const dateType = dateColumn === 'projectStartDate' ? 'startDate' : 'endDate';
//   const currentDates = editingDates[plId] || {};
//   const newDates = { ...currentDates, [dateType]: value };
  
//   setEditingDates(prev => ({ ...prev, [plId]: newDates }));

//   // Auto-save when both dates are filled AND it's the selected row
//   if (newDates.startDate && newDates.endDate && selectedPlan?.plId === plId) {
//     const payload = {
//       projId: selectedPlan?.projId,
//       // projId: fullProjectId.current || projectId,
//       // plId: plId,  // Include plan ID for row-specific update
//       projStartDt: newDates.startDate,
//       projEndDt: newDates.endDate
//     };
    
//     try {
//       setIsActionLoading(true);
//       await axios.put(`${backendUrl}/Project/UpdateDates`, payload);
//       toast.success('Plan dates updated successfully!');
//       await refreshPlans(); // Sync with backend
//     } catch (err) {
//       toast.error(`Update failed: ${err.response?.data?.message || err.message}`);
//       // Revert on error
//       setEditingDates(prev => ({ ...prev, [plId]: currentDates }));
//     } finally {
//       setIsActionLoading(false);
//     }
//   }
// };

const handleDateCellChange = async (plId, dateColumn, value) => {
  const dateType = dateColumn === 'projectStartDate' ? 'startDate' : 'endDate';
  const currentDates = editingDates[plId] || {};
  const newDates = { ...currentDates, [dateType]: value };

  setEditingDates(prev => ({ ...prev, [plId]: newDates }));

  const isFullDate = (v) =>
    typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

  if (
    selectedPlan?.plId === plId &&
    isFullDate(newDates.startDate) &&
    isFullDate(newDates.endDate)
  ) {
    const payload = {
      projId: selectedPlan?.projId,
      projStartDt: newDates.startDate,
      projEndDt: newDates.endDate,
    };

    try {
      setIsActionLoading(true);
      await axios.put(`${backendUrl}/Project/UpdateDates`, payload);
      toast.success('Plan dates updated successfully!');

      const updatedPlans =
        projectId?.trim()
          ? await refreshPlans()
          : await refreshPlansForSelected();

      if (updatedPlans && updatedPlans.length > 0) {
        // strictly match both plId and projId to avoid jumping to master row
        let updatedPlan = updatedPlans.find(
          p => p.plId === plId && p.projId === selectedPlan.projId
        );

        // if not found (edge case), fall back to selectedPlan so it stays where it was
        if (!updatedPlan) {
          updatedPlan = {
            ...selectedPlan,
            projStartDt: newDates.startDate,
            projEndDt: newDates.endDate,
          };
        }

        const finalPlan = {
          ...updatedPlan,
          projStartDt: newDates.startDate,
          projEndDt: newDates.endDate,
          startDate: newDates.startDate,
          endDate: newDates.endDate,
        };

        handleRowClick(finalPlan, {
          startDate: newDates.startDate,
          endDate: newDates.endDate,
        });
      }
    } catch (err) {
      toast.error(`Update failed: ${err.response?.data?.message || err.message}`);
      setEditingDates(prev => ({ ...prev, [plId]: currentDates }));
    } finally {
      setIsActionLoading(false);
    }
  }
};

// const handleDateCellChange = async (plId, dateColumn, value) => {
//   const dateType = dateColumn === 'projectStartDate' ? 'startDate' : 'endDate';
//   const currentDates = editingDates[plId] || {};
//   const newDates = { ...currentDates, [dateType]: value };

//   setEditingDates(prev => ({ ...prev, [plId]: newDates }));

//   const isFullDate = (v) =>
//     typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

//   if (
//     selectedPlan?.plId === plId &&
//     isFullDate(newDates.startDate) &&
//     isFullDate(newDates.endDate)
//   ) {
//     const payload = {
//       projId: selectedPlan?.projId,
//       projStartDt: newDates.startDate,
//       projEndDt: newDates.endDate,
//     };

//     try {
//       setIsActionLoading(true);
//       await axios.put(`${backendUrl}/Project/UpdateDates`, payload);
//       toast.success('Plan dates updated successfully!');

//       // Use normal refresh when user searched a project;
//       // use fallback only when projectId is empty.
//       const updatedPlans =
//         projectId?.trim()
//           ? await refreshPlans()
//           : await refreshPlansForSelected();

//       if (updatedPlans && updatedPlans.length > 0) {
//         const updatedPlan = updatedPlans.find(p => p.plId === plId);
//         if (updatedPlan) {
//           const finalPlan = {
//             ...updatedPlan,
//             projStartDt: newDates.startDate,
//             projEndDt: newDates.endDate,
//             startDate: newDates.startDate,
//             endDate: newDates.endDate,
//           };
//           handleRowClick(finalPlan, {
//             startDate: newDates.startDate,
//             endDate: newDates.endDate,
//           });
//         }
//       }
//     } catch (err) {
//       toast.error(`Update failed: ${err.response?.data?.message || err.message}`);
//       setEditingDates(prev => ({ ...prev, [plId]: currentDates }));
//     } finally {
//       setIsActionLoading(false);
//     }
//   }
// };

// const handleDateCellChange = async (plId, dateColumn, value) => {
//   const dateType = dateColumn === 'projectStartDate' ? 'startDate' : 'endDate';
//   const currentDates = editingDates[plId] || {};
//   const newDates = { ...currentDates, [dateType]: value };

//   setEditingDates(prev => ({ ...prev, [plId]: newDates }));

//   const isFullDate = (v) =>
//     typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

//   if (
//     selectedPlan?.plId === plId &&
//     isFullDate(newDates.startDate) &&
//     isFullDate(newDates.endDate)
//   ) {
//     const payload = {
//       projId: selectedPlan?.projId,
//       projStartDt: newDates.startDate,
//       projEndDt: newDates.endDate,
//     };

//     try {
//       setIsActionLoading(true);
//       await axios.put(`${backendUrl}/Project/UpdateDates`, payload);
//       toast.success('Plan dates updated successfully!');

//       const updatedPlans = await refreshPlans(); // now works even when projectId is empty
//       if (updatedPlans && updatedPlans.length > 0) {
//         const updatedPlan = updatedPlans.find(p => p.plId === plId);
//         if (updatedPlan) {
//           const finalPlan = {
//             ...updatedPlan,
//             projStartDt: newDates.startDate,
//             projEndDt: newDates.endDate,
//             startDate: newDates.startDate,
//             endDate: newDates.endDate,
//           };
//           handleRowClick(finalPlan, {
//             startDate: newDates.startDate,
//             endDate: newDates.endDate,
//           });
//         }
//       }
//     } catch (err) {
//       toast.error(`Update failed: ${err.response?.data?.message || err.message}`);
//       setEditingDates(prev => ({ ...prev, [plId]: currentDates }));
//     } finally {
//       setIsActionLoading(false);
//     }
//   }
// };


// const handleDateCellChange = async (plId, dateColumn, value) => {
//   const dateType = dateColumn === 'projectStartDate' ? 'startDate' : 'endDate';
//   const currentDates = editingDates[plId] || {};
//   const newDates = { ...currentDates, [dateType]: value };
  
//   setEditingDates(prev => ({ ...prev, [plId]: newDates }));

//   const isFullDate = (v) =>
//     typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

//   if (
//     selectedPlan?.plId === plId &&
//     isFullDate(newDates.startDate) &&
//     isFullDate(newDates.endDate)
//   ) {
//     const payload = {
//       projId: selectedPlan?.projId,
//       projStartDt: newDates.startDate,
//       projEndDt: newDates.endDate,
//     };

//     try {
//       setIsActionLoading(true);
//       await axios.put(`${backendUrl}/Project/UpdateDates`, payload);
//       toast.success('Plan dates updated successfully!');

//       // 🔹 CRITICAL CHANGE: keep the same row selected even if projectId is empty
//       const updatedPlans = await refreshPlans();   // refreshPlans already returns sortedPlans
//       if (updatedPlans && updatedPlans.length > 0) {
//         const updatedPlan = updatedPlans.find(p => p.plId === plId);
//         if (updatedPlan) {
//           // Make sure effective dates are also on startDate/endDate
//           const finalPlan = {
//             ...updatedPlan,
//             projStartDt: newDates.startDate,
//             projEndDt: newDates.endDate,
//             startDate: newDates.startDate,
//             endDate: newDates.endDate,
//           };
//           handleRowClick(finalPlan, {
//             startDate: newDates.startDate,
//             endDate: newDates.endDate,
//           });
//         }
//       }
//     } catch (err) {
//       toast.error(`Update failed: ${err.response?.data?.message || err.message}`);
//       setEditingDates(prev => ({ ...prev, [plId]: currentDates }));
//     } finally {
//       setIsActionLoading(false);
//     }
//   }
// };


// const handleDateCellChange = async (plId, dateColumn, value) => {
//   const dateType = dateColumn === 'projectStartDate' ? 'startDate' : 'endDate';
//   const currentDates = editingDates[plId] || {};
//   const newDates = { ...currentDates, [dateType]: value };
  
//   setEditingDates(prev => ({ ...prev, [plId]: newDates }));

//   // ✅ helper to ensure full yyyy-mm-dd date only
//   const isFullDate = (v) =>
//     typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

//   // ✅ Only when BOTH are valid full dates AND row is selected
//   if (
//     selectedPlan?.plId === plId &&
//     isFullDate(newDates.startDate) &&
//     isFullDate(newDates.endDate)
//   ) {
//     const payload = {
//       projId: selectedPlan?.projId,
//       projStartDt: newDates.startDate,
//       projEndDt: newDates.endDate,
//     };

//     try {
//       setIsActionLoading(true);
//       await axios.put(`${backendUrl}/Project/UpdateDates`, payload);
//       toast.success('Plan dates updated successfully!');
//       await refreshPlans();
//     } catch (err) {
//       toast.error(`Update failed: ${err.response?.data?.message || err.message}`);
//       setEditingDates(prev => ({ ...prev, [plId]: currentDates }));
//     } finally {
//       setIsActionLoading(false);
//     }
//   }
// };





  const handleExportPlan = async (plan) => {
    if (!selectedPlan?.projId || !plan.version || !plan.plType) {
      toast.error("Missing required parameters for export");
      return;
    }

    try {
      setIsActionLoading(true);
      toast.info("Exporting plan...");

      const response = await axios.get(
        `${backendUrl}/Forecast/ExportPlanDirectCost`,
        {
          params: {
            projId: selectedPlan.projId,
            version: plan.version,
            type: plan.plType,
          },
          responseType: "blob",
        }
      );

      if (!response.data || response.data.size === 0) {
        toast.error("No data received from server");
        return;
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      link.setAttribute(
        "download",
        `Plan_${selectedPlan.projId}_${plan.version}_${plan.plType}.xlsx`
      );

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success("Plan exported successfully!");
    } catch (err) {
      if (err.response) {
        if (err.response.status === 404) {
          toast.error("Export endpoint not found or data not available");
        } else if (err.response.status === 500) {
          toast.error("Server error occurred during export");
        } else {
          toast.error(
            `Export failed: ${err.response.status} - ${err.response.statusText}`
          );
        }
      } else if (err.request) {
        toast.error("Network error: Unable to reach server");
      } else {
        toast.error("Error exporting plan: " + err.message);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleImportPlan = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      toast.error("No file selected");
      return;
    }
    const validExtensions = [".xlsx", ".xls"];
    const fileExtension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      toast.error(
        "Invalid file format. Please upload an Excel file (.xlsx or .xls)"
      );
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    formData.append("projId", selectedPlan.projId);

    try {
      setIsActionLoading(true);
      toast.info("Importing plan...");
      const response = await axios.post(
        `${backendUrl}/Forecast/ImportDirectCostPlan`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      let extractedVersion = null;
      if (typeof response.data === "string") {
        const versionMatch = response.data.match(/version\s*-\s*'([^']+)'/i);
        if (versionMatch) extractedVersion = versionMatch[1];
      } else if (response.data?.version) {
        extractedVersion = response.data.version;
      }
      if (extractedVersion) setLastImportedVersion(extractedVersion);
      setLastImportTime(Date.now());
      toast.success(
        response.data && typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data),
        { toastId: "import-success-" + Date.now(), autoClose: 5000 }
      );
      await refreshPlans();
    } catch (err) {
      let errorMessage =
        "Failed to import plan. Please check the file and project ID, or contact support.";
      if (err.response) {
        if (typeof err.response.data === "string" && err.response.data)
          errorMessage = err.response.data;
        else if (err.response.data?.message)
          errorMessage = err.response.data.message;
        else if (err.response.data)
          errorMessage = JSON.stringify(err.response.data);
        else if (err.response.status === 500)
          errorMessage =
            "Server error occurred. Please verify the file format, project ID, and ensure type is EXCEL.";
      } else errorMessage = err.message || errorMessage;
      toast.error(errorMessage, { toastId: "import-error", autoClose: 5000 });
    } finally {
      setIsActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpdateProjectDates = async (newDates) => {
    if (!projectId || !newDates.startDate || !newDates.endDate) {
      toast.error("Project ID or both dates are missing for update.");
      return false;
    }
    const payload = {
      // projId: fullProjectId.current || projectId,
      projId: selectedPlan?.projId,
      projStartDt: newDates.startDate,
      projEndDt: newDates.endDate,
    };

    setIsActionLoading(true);
    try {
      await axios.put(`${backendUrl}/Project/UpdateDates`, payload);
      toast.success("Project dates updated successfully!");

      setManualDatesSubmitted(true);


      if (filteredProjects.length > 0) {
        const projectIndex = filteredProjects.findIndex(
          (p) => p.projId === projectId
        );
        if (projectIndex !== -1) {
          filteredProjects[projectIndex].startDate = newDates.startDate;
          filteredProjects[projectIndex].projStartDt = newDates.startDate;
          filteredProjects[projectIndex].endDate = newDates.endDate;
          filteredProjects[projectIndex].projEndDt = newDates.endDate;

          // Keep manual dates so they stay visible
          setManualProjectDates({
            startDate: newDates.startDate,
            endDate: newDates.endDate,
          });
          tempManualDatesRef.current = {
            startDate: newDates.startDate,
            endDate: newDates.endDate,
          };

          if (selectedPlan) {
            handleRowClick(selectedPlan, newDates);
          }
        }
      }
      return true;
    } catch (err) {
      toast.error(
        "Failed to update project dates. " +
          (err.response?.data?.message || err.message)
      );
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Date change: keep UI values until both are set, then call API
  // const handleDateChange = (dateType, value) => {
  //   const newDates = {
  //     ...manualProjectDates,
  //     [dateType]: value,
  //   };

  //   setManualProjectDates(newDates);
  //   tempManualDatesRef.current = {
  //     ...tempManualDatesRef.current,
  //     [dateType]: value,
  //   };

  //   const shouldCallApi =
  //     filteredProjects.length > 0 &&
  //     !(filteredProjects[0].startDate || filteredProjects[0].projStartDt);

  //   if (newDates.startDate && newDates.endDate && shouldCallApi) {
  //     handleUpdateProjectDates(newDates);
  //   }

  //   if (selectedPlan) {
  //     handleRowClick(selectedPlan, newDates);
  //   }
  // };

//   const handleDateChange = (dateType, value) => {
//   const newDates = {
//     ...manualProjectDates,
//     [dateType]: value,
//   };

//   // 1) Always keep them in state so UI never clears
//   setManualProjectDates(newDates);
//   tempManualDatesRef.current = {
//     ...tempManualDatesRef.current,
//     [dateType]: value,
//   };

//   // 2) Only call API when *both* dates present and backend has no dates
//   const shouldCallApi =
//     filteredProjects.length > 0 &&
//     !(filteredProjects[0].startDate || filteredProjects[0].projStartDt);

//   if (newDates.startDate && newDates.endDate && shouldCallApi) {
//     handleUpdateProjectDates(newDates);
//   }

//   // 3) Keep selected row in sync so grid columns always show these dates
//   if (selectedPlan) {
//     handleRowClick(selectedPlan, newDates);
//   }
// };

const handleDateChange = (dateType, value) => {
  const newDates = {
    ...manualProjectDates,
    [dateType]: value,
  };

  setManualProjectDates(newDates);
  tempManualDatesRef.current = {
    ...tempManualDatesRef.current,
    [dateType]: value,
  };

  const shouldCallApi =
    filteredProjects.length > 0 &&
    !(filteredProjects[0].startDate || filteredProjects[0].projStartDt);

  if (newDates.startDate && newDates.endDate && shouldCallApi) {
    handleUpdateProjectDates(newDates);
  }

  if (selectedPlan) {
    handleRowClick(selectedPlan, newDates);
  }
};



  const handleCheckboxChange = async (idx, field) => {
    const prevPlans = [...plans];
    const plan = plans[idx];
    const planId = plan.plId;
    if (!plan.plType || !plan.version) {
      toast.error(
        `Cannot update ${field}: Plan Type and Version are required.`,
        { toastId: "checkbox-error" }
      );
      return;
    }
    if (field === "isApproved" && !plan.isCompleted) {
      toast.error("You can't approve this row until Submitted is checked", {
        toastId: "checkbox-error",
      });
      return;
    }
    if (field === "finalVersion" && !plan.isApproved) {
      toast.error("You can't set Conclude until Approved is checked", {
        toastId: "checkbox-error",
      });
      return;
    }
    let updated = { ...plan };
    updated[field] = !plan[field];
    if (field === "isCompleted") {
      updated.status = updated.isCompleted ? "Submitted" : "In Progress";
      if (!updated.isCompleted) {
        updated.isApproved = false;
        updated.finalVersion = false;
      }
    }
    if (field === "isApproved") {
      updated.status = updated.isApproved ? "Approved" : "Submitted";
      if (!updated.isApproved) updated.finalVersion = false;
    }
    if (field === "finalVersion")
      updated.status = updated.finalVersion ? "Concluded" : "Approved";
    let newPlans;

    if (field === "isCompleted" && !updated.isCompleted) {
      const isEAC = updated.plType === "EAC";
      const inProgressCount = plans.filter(
        (p) =>
          p.status === "In Progress" &&
          p.plType === updated.plType &&
          p.projId === updated.projId
      ).length;
      if (inProgressCount > 0 && updated.status === "In Progress") {
        toast.error(
          `Only one ${
            isEAC ? "EAC" : "BUD"
          } plan can have In Progress status at a time.`,
          { toastId: "checkbox-error" }
        );
        return;
      }
    }
    if (field === "finalVersion" && updated.finalVersion) {
      newPlans = plans.map((p, i) =>
        i === idx
          ? updated
          : p.plType === updated.plType && p.projId === updated.projId
          ? { ...p, finalVersion: false }
          : p
      );
    } else {
      newPlans = plans.map((p, i) => (i === idx ? updated : p));
    }

    if (updated.status === "In Progress") {
      newPlans = newPlans.map((p, i) =>
        i !== idx &&
        p.status === "In Progress" &&
        p.plType === updated.plType &&
        p.projId === updated.projId
          ? { ...p, status: "Submitted", isCompleted: true }
          : p
      );
    }
    setPlans(newPlans);
    onPlanSelect(updated);

    if (
      (BOOLEAN_FIELDS.includes(field) || field === "status") &&
      planId &&
      Number(planId) > 0
    ) {
      const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;

      const payload = {
        plId: updated.plId,
        projId: fullProjectId.current || updated.projId,
        plType: updated.plType,
        versionCode: updated.versionCode,
        finalVersion: updated.finalVersion,
        isCompleted: updated.isCompleted,
        isApproved: updated.isApproved,
        status: updated.status,
        approvedBy: updated.approvedBy,
        templateId: updated.templateId,
      };
      try {
        await axios.put(updateUrl, payload);
      } catch (err) {
        setPlans(prevPlans);
        toast.error(
          "Error updating plan: " +
            (err.response?.data?.message || err.message),
          { toastId: "checkbox-error" }
        );
      }
    }
  };

  // const handleVersionCodeChange = async (idx, value) => {
  //   const prevPlans = [...plans];
  //   const currentPlan = plans[idx];
  //   const planId = currentPlan.plId;

  //   if (currentPlan.versionCode === value) {
  //     return;
  //   }

  //   let updated = { ...currentPlan, versionCode: value };
  //   const newPlans = plans.map((plan) =>
  //     plan.plId === planId ? updated : plan
  //   );
  //   setPlans(newPlans);

  //   if (planId && Number(planId) > 0) {
  //     const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;
  //     toast.info("Updating version code...", { toastId: "version-code-info" });
  //     try {
  //       setIsActionLoading(true);
  //       await axios.put(updateUrl, updated);
  //       toast.success("Version code updated successfully!", {
  //         toastId: "version-code-success",
  //       });
  //     } catch (err) {
  //       setPlans(prevPlans);
  //       toast.error(
  //         "Error updating version code: " +
  //           (err.response?.data?.message || err.message),
  //         { toastId: "version-code-error" }
  //       );
  //     } finally {
  //       setIsActionLoading(false);
  //     }
  //   }
  // };
  
  //   const handleVersionCodeChange = async (plId, value) => {
  //   const prevPlans = [...plans];
  //   const currentPlan = plans.find(p => p.plId === plId);
  //   if (!currentPlan) return;
 
  //   if (currentPlan.versionCode === value) {
  //     return;
  //   }
 
  //   let updated = { ...currentPlan, versionCode: value };
  //   const newPlans = plans.map((plan) =>
  //     plan.plId === plId ? updated : plan
  //   );
  //   setPlans(newPlans);
 
  //   if (plId && Number(plId) > 0) {
  //     const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;
  //     toast.info("Updating version code...", { toastId: "version-code-info" });
  //     try {
  //       setIsActionLoading(true);
  //       await axios.put(updateUrl, updated);
  //       toast.success("Version code updated successfully!", {
  //         toastId: "version-code-success",
  //       });
  //     } catch (err) {
  //       setPlans(prevPlans);
  //       toast.error(
  //         "Error updating version code: " +
  //           (err.response?.data?.message || err.message),
  //         { toastId: "version-code-error" }
  //       );
  //     } finally {
  //       setIsActionLoading(false);
  //     }
  //   }
  // };

   const handleVersionCodeChange = async (plId, value) => {
    const prevPlans = [...plans];
    const currentPlan = plans.find(p => p.plId === plId);
    if (!currentPlan) return;
 
    if (currentPlan.versionCode === value) {
      return;
    }
 
    let updated = { ...currentPlan, versionCode: value };
    const newPlans = plans.map((plan) =>
      plan.plId === plId ? updated : plan
    );
    setPlans(newPlans);
 
    if (plId && Number(plId) > 0) {
      const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;
      toast.info("Updating version code...", { toastId: "version-code-info" });
      try {
        setIsActionLoading(true);
        await axios.put(updateUrl, updated);
        toast.success("Version code updated successfully!", {
          toastId: "version-code-success",
        });
      } catch (err) {
        setPlans(prevPlans);
        toast.error(
          "Error updating version code: " +
            (err.response?.data?.message || err.message),
          { toastId: "version-code-error" }
        );
      } finally {
        setIsActionLoading(false);
      }
    }
  };


  const handleActionSelect = async (idx, action) => {
    const plan = plans[idx];
    if (action === "None") return;

    try {
      setIsActionLoading(true);
      if (action === "Delete") {
        if (!plan.plId || Number(plan.plId) <= 0) {
          toast.error("Cannot delete: Invalid plan ID.");
          setIsActionLoading(false);
          return;
        }
        const confirmed = window.confirm(
          `Are you sure you want to delete this plan`
        );
        if (!confirmed) {
          setIsActionLoading(false);
          return;
        }
        toast.info("Deleting plan...");
        try {
          await axios.delete(
            `${backendUrl}/Project/DeleteProjectPlan/${plan.plId}`
          );
          toast.success("Plan deleted successfully!");
        } catch (err) {
          if (err.response && err.response.status === 404) {
            toast.error(
              "Plan not found on server. It may have already been deleted."
            );
          } else {
            toast.error(
              "Error deleting plan: " +
                (err.response?.data?.message || err.message)
            );
          }
          setIsActionLoading(false);
          return;
        }
        setPlans(plans.filter((p, i) => i !== idx));
        if (selectedPlan?.plId === plan.plId) {
          onPlanSelect(null);
        }
      } else if (
        action === "Create Budget" ||
        action === "Create Blank Budget" ||
        action === "Create EAC" ||
        action === "Create NB BUD"
      ) {
        const actionProjId =
          fullProjectId.current || plan.projId || projectId || "";

        const payloadTemplate = {
          projId: selectedPlan?.projId || plan.projId || actionProjId || "",
          plId: plan.plId || 0,
          plType:
            action === "Create NB BUD"
              ? "NBBUD"
              : action === "Create Budget" || action === "Create Blank Budget"
              ? "BUD"
              : "EAC",
          source: plan.source || "",
          type:
            typeof isChildProjectId === "function" &&
            isChildProjectId(actionProjId)
              ? "SYSTEM"
              : plan.type || "",
          version: plan.version || 0,
          versionCode: plan.versionCode || "",
          finalVersion: false,
          isCompleted: false,
          isApproved: false,
          status: "In Progress",
          createdBy: plan.createdBy || "User",
          modifiedBy: plan.modifiedBy || "User",
          approvedBy: "",
          templateId: plan.templateId || 1,
          fiscalYear: fiscalYear,
        };

        toast.info(
          `Creating ${
            action === "Create Budget"
              ? "Budget"
              : action === "Create Blank Budget"
              ? "Blank Budget"
              : action === "Create NB BUD"
              ? "NB BUD"
              : "EAC"
          }...`
        );

        const response = await axios.post(
          `${backendUrl}/Project/AddProjectPlan?type=${
            action === "Create Blank Budget" ? "blank" : "actual"
          }`,
          payloadTemplate
        );
        const rawCreatedPlan = response.data;

        const normalizedPlan = {
          ...plan,
          ...rawCreatedPlan,
          plId: rawCreatedPlan.plId || rawCreatedPlan.id || 0,
          projId: rawCreatedPlan.projId || plan.projId,
          projName: rawCreatedPlan.projName || plan.projName || "",
          plType:
            rawCreatedPlan.plType === "Budget"
              ? "BUD"
              : rawCreatedPlan.plType || "BUD",
          version: Number(rawCreatedPlan.version) || 0,
          status: "In Progress",
          finalVersion: false,
          isCompleted: false,
          isApproved: false,
          projStartDt: rawCreatedPlan.projStartDt || plan.projStartDt || "",
          projEndDt: rawCreatedPlan.projEndDt || plan.projEndDt || "",
        };

        if (!normalizedPlan.projId || !normalizedPlan.plType) {
          toast.error(
            "Plan returned from backend is missing required fields. Please reload and try again."
          );
          setIsActionLoading(false);
          return;
        }

        await refreshPlans();

        setTimeout(() => {
          onPlanSelect(normalizedPlan);
        }, 100);

        toast.success(
          `${
            action === "Create Budget"
              ? "Budget"
              : action === "Create Blank Budget"
              ? "Blank Budget"
              : action === "Create NB BUD"
              ? "NB BUD"
              : "EAC"
          } created successfully!`
        );
      } else {
        toast.info(`Action "${action}" selected (API call not implemented)`);
      }
    } catch (err) {
      toast.error(
        "Error performing action: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const getProjectDotLevel = (projId) => {
    if (!projId || typeof projId !== "string") return 0;
    const dotCount = (projId.match(/\./g) || []).length;
    return dotCount;
  };

  const getActionOptions = (plan) => {
    let options = ["None"];

    if (!plan?.projId) {
      return options;
    }

    let lockDotLevel = null;
    const masterId = plan.projId.split(".")[0];

    for (const p of plans) {
      if (p.plType && p.projId?.startsWith(masterId)) {
        lockDotLevel = getProjectDotLevel(p.projId);
        break;
      }
    }

    if (!plan.plType && !plan.version) {
      const currentDotLevel = getProjectDotLevel(plan.projId);
      const creationOptions = [
        "None",
        "Create Budget",
        "Create Blank Budget",
        "Create EAC",
      ];

      if (lockDotLevel === null) {
        return creationOptions;
      }

      if (currentDotLevel === lockDotLevel) {
        return creationOptions;
      }

      return options;
    }

    if (plan.status === "In Progress") options = ["None", "Delete"];
    else if (plan.status === "Submitted")
      options = ["None", "Create Budget", "Create Blank Budget"];
    else if (plan.status === "Approved")
      options = [
        "None",
        "Create Budget",
        "Create Blank Budget",
        "Create EAC",
        "Delete",
      ];
    else if (plan.status === "Concluded")
      options = ["None", "Create Budget", "Create Blank Budget", "Create EAC"];

    return options;
  };

  const getButtonAvailability = (plan, action) => {
    const options = getActionOptions(plan);
    return options.includes(action);
  };

  const checkedFinalVersionIdx = plans.findIndex((plan) => plan.finalVersion);

  const getCheckboxProps = (plan, col, idx) => {
    if (!plan.plType || !plan.version)
      return { checked: false, disabled: true };

    if (col === "isCompleted")
      return { checked: plan.isCompleted, disabled: !!plan.isApproved };

    if (col === "isApproved")
      return { checked: plan.isApproved, disabled: !plan.isCompleted };

    if (col === "finalVersion") {
      const anotherFinalVersionIdx = plans.findIndex(
        (p, i) =>
          i !== idx &&
          p.plType === plan.plType &&
          p.projId === plan.projId &&
          p.finalVersion
      );

      return {
        checked: plan.finalVersion,
        disabled: anotherFinalVersionIdx !== -1,
      };
    }

    return { checked: plan[col], disabled: false };
  };

  const handleTopButtonToggle = async (field) => {
    if (!selectedPlan) {
      toast.error(`No plan selected to update ${field}.`, {
        toastId: "no-plan-selected",
      });
      return;
    }
    const idx = plans.findIndex((p) => p.plId === selectedPlan.plId);
    if (idx === -1) {
      toast.error(`Selected plan not found.`, { toastId: "plan-not-found" });
      return;
    }
    setIsActionLoading(true);
    await handleCheckboxChange(idx, field);
    setIsActionLoading(false);
  };

  const handleCalc = async () => {
    if (!selectedPlan) {
      toast.error("No plan selected for calculation.", {
        toastId: "no-plan-selected",
      });
      return;
    }
    if (!selectedPlan.plId || !selectedPlan.templateId) {
      toast.error(
        "Cannot calculate: Missing required parameters (planID or templateId).",
        {
          toastId: "missing-params",
        }
      );
      return;
    }
    setIsActionLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/Forecast/CalculateRevenueCost?planID=${selectedPlan.plId}&templateId=${selectedPlan.templateId}&type=actual`
      );
      const message =
        typeof response.data === "string"
          ? response.data
          : response.data?.message || "Revenue Calculation successful!";
      toast.success(message);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Error during calculation.";
      toast.error(errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getTopButtonDisabled = (field) => {
    const currentPlan = getCurrentPlan();
    if (!currentPlan || !currentPlan.plType || !currentPlan.version)
      return true;
    if (field === "isCompleted") return !!currentPlan.isApproved;
    if (field === "isApproved") return !currentPlan.isCompleted;
    if (field === "finalVersion") {
      const anotherFinalVersionIdx = plans.findIndex(
        (p) =>
          p.plId !== currentPlan.plId &&
          p.plType === currentPlan.plType &&
          p.projId === currentPlan.projId &&
          p.finalVersion
      );
      if (anotherFinalVersionIdx !== -1) return true;
      return !currentPlan.isApproved;
    }
    return false;
  };

  const getCalcButtonDisabled = () => {
    return !selectedPlan || !selectedPlan.plId || !selectedPlan.templateId;
  };

  const isAnyActionPerformed = (plansList, selectedProjId) => {
    if (!selectedProjId) return false;
    const selectedLevel = getProjectDotLevel(selectedProjId);
    return plansList.some(
      (plan) => !!plan.plType && plan.projId === selectedProjId
    );
  };

  const getMasterProjects = (plansList) => {
    return plansList.filter((plan) => {
      const projId = plan.projId?.trim();
      if (!projId) return false;
      return !projId.includes(".");
    });
  };

  const getMasterAndRelatedProjects = (plansList, clickedProjId) => {
    if (!clickedProjId)
      return { master: null, related: [], sameLevelBud: false };

    const parts = clickedProjId.split(".");
    const masterId = parts[0];
    const selectedLevel = parts.length;

    const filtered = plansList.filter(
      (p) => p.projId?.startsWith(masterId) && p.plType === "BUD"
    );

    const seen = new Set();
    const related = filtered
      .filter((p) => {
        if (seen.has(p.projId)) return false;
        seen.add(p.projId);
        return true;
      })
      .map((p) => ({
        ...p,
        level: p.projId.split(".").length,
      }));

    if (related.length === 0) {
      return { master: masterId, related, selectedLevel, sameLevelBud: true };
    }

    const sameLevelBud = related.some((r) => r.level === selectedLevel);

    return { master: masterId, related, selectedLevel, sameLevelBud };
  };

  // const isDateMissing =
  //   filteredProjects.length > 0 &&
  //   !(filteredProjects[0].startDate || filteredProjects[0].projStartDt);

  // const isDateMissing =
  // filteredProjects.length > 0 &&
  // !manualDatesSubmitted &&                // keep banner until API written
  // !(filteredProjects[0].startDate || filteredProjects[0].projStartDt);

  const isDateMissing =
  filteredProjects.length > 0 &&
  !manualDatesSubmitted && // keep this if you still want banner until API call
  !filteredProjects[0]?.startDate &&
  !filteredProjects[0]?.projStartDt &&
  !filteredProjects[0]?.endDate &&
  !filteredProjects[0]?.projEndDt;

  // const isDateMissing =
  // selectedPlan?.projId &&
  // !manualDatesSubmitted &&                // keep banner until API written
  // !(selectedPlan?.startDate || selectedPlan?.projStartDt);


  const displayStartDate =
    manualProjectDates.startDate ||
    filteredProjects[0]?.startDate ||
    filteredProjects[0]?.projStartDt;

  const displayEndDate =
    manualProjectDates.endDate ||
    filteredProjects[0]?.endDate ||
    filteredProjects[0]?.projEndDt;

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 relative z-10" key={refreshKey}>
      {isActionLoading && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-20">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-700">Processing...</span>
          </div>
        </div>
      )}

      <div>
        {/* {filteredProjects.length > 0 && isDateMissing && (
          <div className="flex flex-wrap items-center gap-4 p-3 mb-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <h4 className="font-semibold text-sm text-yellow-800">
              Project Dates Missing: Please Enter Below
            </h4>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center text-xs gap-1 text-gray-700">
                Start Date:
                <input
                  type="date"
                  value={manualProjectDates.startDate}
                  onChange={(e) =>
                    handleDateChange("startDate", e.target.value)
                  }
                  className={`border ${
                    !manualProjectDates.startDate
                      ? "border-red-500"
                      : "border-gray-400"
                  } rounded px-1 py-0.5 text-xs`}
                  required
                />
              </label>

              <label className="flex items-center text-xs gap-1 text-gray-700">
                End Date:
                <input
                  type="date"
                  value={manualProjectDates.endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  className={`border ${
                    !manualProjectDates.endDate
                      ? "border-red-500"
                      : "border-gray-400"
                  } rounded px-1 py-0.5 text-xs`}
                  required
                />
              </label>

              {manualProjectDates.startDate && manualProjectDates.endDate && (
                <span className="text-green-600 text-xs self-center">
                  Dates Set. Select a plan below to propagate.
                </span>
              )}
            </div>
          </div>
        )} */}

        <div className="flex justify-between items-center mb-2 gap-1">
          <div className="flex gap-1 flex-wrap items-center ">
            {plans.length >= 0 && (
              <>
                <button
                  onClick={() => {
                    setIsActionLoading(true);
                    handleActionSelect(
                      plans.findIndex((p) => p.plId === selectedPlan?.plId),
                      "Create Budget"
                    );
                  }}
                  disabled={
                    !selectedPlan ||
                    !getButtonAvailability(selectedPlan, "Create Budget")
                  }
                  className={`btn1 ${
                    !selectedPlan ||
                    !getButtonAvailability(selectedPlan, "Create Budget")
                      ? "btn-disabled"
                      : "btn-blue"
                  }`}
                  title="Create Budget"
                >
                  New Budget
                </button>

                <button
                  onClick={() => {
                    setIsActionLoading(true);
                    handleActionSelect(
                      plans.findIndex((p) => p.plId === selectedPlan?.plId),
                      "Create Blank Budget"
                    );
                  }}
                  disabled={
                    !selectedPlan ||
                    !getButtonAvailability(selectedPlan, "Create Blank Budget")
                  }
                  className={`btn1 ${
                    !selectedPlan ||
                    !getButtonAvailability(selectedPlan, "Create Blank Budget")
                      ? "btn-disabled"
                      : "btn-blue"
                  }`}
                  title="Create Blank Budget"
                >
                  New Blank Budget
                </button>

                <button
                  onClick={() => {
                    setIsActionLoading(true);
                    handleActionSelect(
                      plans.findIndex((p) => p.plId === selectedPlan?.plId),
                      "Create EAC"
                    );
                  }}
                  disabled={
                    !selectedPlan ||
                    !getButtonAvailability(selectedPlan, "Create EAC")
                  }
                  className={`btn1 ${
                    !selectedPlan ||
                    !getButtonAvailability(selectedPlan, "Create EAC")
                      ? "btn-disabled"
                      : "btn-blue"
                  }`}
                  title="Create EAC"
                >
                  New EAC
                </button>

                {selectedPlan && selectedPlan.plType === "NBBUD" && (
                  <button
                    onClick={() => {
                      setIsActionLoading(true);
                      handleActionSelect(
                        plans.findIndex((p) => p.plId === selectedPlan?.plId),
                        "Create NB BUD"
                      );
                    }}
                    className="btn1 btn-blue"
                    title="Create BUD"
                  >
                    CREATE NB BUD
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsActionLoading(true);
                    handleActionSelect(
                      plans.findIndex((p) => p.plId === selectedPlan?.plId),
                      "Delete"
                    );
                  }}
                  disabled={
                    !selectedPlan ||
                    selectedPlan.isApproved ||
                    !getButtonAvailability(selectedPlan, "Delete") ||
                    !getMasterAndRelatedProjects(plans, selectedPlan?.projId)
                      .sameLevelBud
                  }
                  className={`btn1 ${
                    !selectedPlan ||
                    selectedPlan.isApproved ||
                    !getButtonAvailability(selectedPlan, "Delete") ||
                    !getMasterAndRelatedProjects(plans, selectedPlan?.projId)
                      .sameLevelBud
                      ? "btn-disabled"
                      : "btn-red"
                  }`}
                  title="Delete Selected Plan"
                >
                  Delete
                </button>

                <button
                  onClick={() => handleTopButtonToggle("isCompleted")}
                  disabled={
                    getTopButtonDisabled("isCompleted") || isActionLoading
                  }
                  className={`btn1 ${
                    getTopButtonDisabled("isCompleted") || isActionLoading
                      ? "btn-disabled"
                      : getCurrentPlan()?.status === "Submitted"
                      ? "btn-orange"
                      : "btn-blue"
                  }`}
                  title={
                    getCurrentPlan()?.status === "Submitted"
                      ? "Unsubmit"
                      : "Submit"
                  }
                >
                  {isActionLoading
                    ? "Processing..."
                    : getCurrentPlan()?.status === "Submitted"
                    ? "Unsubmit"
                    : "Submit"}
                </button>

                <button
                  onClick={() => handleTopButtonToggle("isApproved")}
                  disabled={
                    getTopButtonDisabled("isApproved") || isActionLoading
                  }
                  className={`btn1 ${
                    getTopButtonDisabled("isApproved") || isActionLoading
                      ? "btn-disabled"
                      : getCurrentPlan()?.status === "Approved" ||
                        getCurrentPlan()?.finalVersion
                      ? "btn-orange"
                      : "btn-blue"
                  }`}
                  title={
                    getCurrentPlan()?.status === "Approved"
                      ? "Unapprove"
                      : "Approve"
                  }
                >
                  {isActionLoading
                    ? "Processing..."
                    : getCurrentPlan()?.status === "Approved" ||
                      getCurrentPlan()?.finalVersion
                    ? "Unapprove"
                    : "Approve"}
                </button>

                <button
                  onClick={() => handleTopButtonToggle("finalVersion")}
                  disabled={
                    getTopButtonDisabled("finalVersion") || isActionLoading
                  }
                  className={`btn1 ${
                    getTopButtonDisabled("finalVersion") || isActionLoading
                      ? "btn-disabled"
                      : getCurrentPlan()?.finalVersion
                      ? "btn-orange"
                      : "btn-blue"
                  }`}
                  title={
                    getCurrentPlan()?.finalVersion ? "Unconclude" : "Conclude"
                  }
                >
                  {isActionLoading
                    ? "Processing..."
                    : getCurrentPlan()?.finalVersion
                    ? "Unconclude"
                    : "Conclude"}
                </button>

                <button
                  onClick={() => {
                    setIsActionLoading(true);
                    handleCalc();
                  }}
                  disabled={getCalcButtonDisabled()}
                  className={`btn1 ${
                    getCalcButtonDisabled() ? "btn-disabled" : "btn-blue"
                  }`}
                  title="Calculate"
                >
                  Calc
                </button>

                <button
                  onClick={() => setBudEacFilter(!budEacFilter)}
                  className={`btn1 ${budEacFilter ? "btn-orange" : "btn-blue"}`}
                  title={
                    budEacFilter ? "Show All Plans" : "Filter BUD/EAC Plans"
                  }
                >
                  {budEacFilter ? "Show All" : "BUD/EAC"}
                </button>

                <button
                  onClick={() => setShowNewBusinessPopup(true)}
                  className="btn1 btn-green"
                  title="New Business"
                >
                  New Business
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => {
                fileInputRef.current.click();
              }}
              className="bg-blue-600 text-white px-1 py-1 rounded hover:bg-blue-700 flex items-center text-xs cursor-pointer whitespace-nowrap"
              title="Import Plan"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                handleImportPlan(e);
              }}
              accept=".xlsx,.xls"
              className="hidden"
            />

            <div className="flex items-center gap-1">
              <label
                htmlFor="fiscalYear"
                className="font-semibold text-xs whitespace-nowrap"
              >
                Fiscal Year:
              </label>
              <select
                id="fiscalYear"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={fiscalYearOptions?.length === 0}
              >
                {fiscalYearOptions?.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border border-gray-200 overflow-hidden relative ${
            showNewBusinessPopup ? "" : ""
          }`}
        >
          {showNewBusinessPopup && (
            <div className="absolute inset-0 z-40">
              <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm"></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg  border border-gray-300 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4">
                    <NewBusiness
                      onClose={() => setShowNewBusinessPopup(false)}
                      onSaveSuccess={handleNewBusinessSave}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className={`overflow-x-auto h-85 ${
              showNewBusinessPopup ? "blur-sm pointer-events-none" : ""
            }`}
          >
            <table className="min-w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 capitalize tracking-wider">
                    Export
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-xs font-bold text-gray-600 capitalize tracking-widern whitespace-nowrap text-center"
                    >
                      {COLUMN_LABELS[col] || col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 mt-4">
                          Loading project plans...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ||
                  (!searched && projectId.trim() === "") ? (
                  <tr>
                    <td colSpan={columns.length + 1}>
                      <div className="p-8 text-center text-gray-500 text-lg">
                        Search and select a valid Project to view details
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan, idx) => (
                    <tr
                      key={`plan-${plan.plId || idx}-${plan.projId || "unknown"}`}
                      className={`transition-all duration-200 cursor-pointer ${
                        selectedPlan &&
                        selectedPlan.plId === plan.plId &&
                        selectedPlan.projId === plan.projId
                          ? "bg-blue-200 hover:bg-blue-300 "
                          : "even:bg-gray-50 hover:bg-blue-50"
                      }`}
                      onClick={() => {
                        handleRowClick(plan);
                        getMasterAndRelatedProjects(plans, plan.projId);
                      }}
                    >
                      <td className="px-1 py-1 h-1 text-xs text-gray-700  text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPlan(plan);
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="Export to Excel"
                          disabled={
                            !plan.projId || !plan.version || !plan.plType
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 cursor-pointer"
                            viewBox="0 0 48 48"
                          >
                            <defs>
                              <linearGradient
                                id="grad1"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop
                                  offset="0%"
                                  style={{ stopColor: "#21A366" }}
                                />
                                <stop
                                  offset="100%"
                                  style={{ stopColor: "#185C37" }}
                                />
                              </linearGradient>
                            </defs>

                            <rect
                              x="18"
                              y="6"
                              width="24"
                              height="18"
                              fill="url(#grad1)"
                            />
                            <rect
                              x="18"
                              y="24"
                              width="24"
                              height="18"
                              fill="#107C41"
                            />

                            <rect
                              x="6"
                              y="10"
                              width="16"
                              height="28"
                              rx="2"
                              fill="#185C37"
                            />

                            <path
                              fill="#fff"
                              d="M11.5 29.5L14.2 24l-2.7-5.5h2.9l1.5 3.6 1.5-3.6h2.9L17.2 24l2.7 5.5h-2.9l-1.5-3.6-1.5 3.6z"
                            />
                          </svg>
                        </button>
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col}
                          className={`
      text-xs h-1 px-1 py-1 text-gray-700
      ${
        col === "projId" || col === "projName"
          ? "text-left break-words"
          : "text-center"
      }
      ${
        col === "createdAt" || col === "updatedAt" || col === "closedPeriod"
          ? " whitespace-nowrap"
          : ""
      }
    `}
                        >
                          {col === "closedPeriod" ? (
                            formatDateOnly(plan[col])
                          ) : col === "createdAt" || col === "updatedAt" ? (
                            formatDateWithTime(plan[col])
                          ) : col === 'projectStartDate' || col === 'projectEndDate' ? (
  selectedPlan?.plId === plan.plId && selectedPlan?.projId === plan.projId ? (
    <input
      type="date"
      value={
        editingDates[plan.plId]?.[
          col === 'projectStartDate' ? 'startDate' : 'endDate'
        ] ||
        (col === 'projectStartDate'
          ? (plan.projStartDt || plan.startDate)
          : (plan.projEndDt || plan.endDate))
      }
      // IMPORTANT: remove onClick stopPropagation here
      // onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        // explicitly keep this row as selected when typing in date
        handleRowClick(plan);
        handleDateCellChange(plan.plId, col, e.target.value);
      }}
      className="border border-blue-300 rounded px-1 py-0.5 text-xs bg-yellow-50 focus:border-blue-500 w-full text-center"
    />
  ) : (
    <span className="text-xs text-gray-700 text-center">
      {formatDateOnly(
        col === 'projectStartDate'
          ? (plan.projStartDt || plan.startDate)
          : (plan.projEndDt || plan.endDate)
      )}
    </span>
  )
) :  
                          col === "versionCode" ? (
                            // <input
                            //   type="text"
                            //   value={
                            //     editingVersionCodeIdx === plan.plId
                            //       ? editingVersionCodeValue
                            //       : plan.versionCode || ""
                            //   }
                            //   autoFocus={editingVersionCodeIdx === plan.plId}
                            //   onClick={(e) => {
                            //     e.stopPropagation();
                            //     setEditingVersionCodeIdx(plan.plId);
                            //     setEditingVersionCodeValue(
                            //       plan.versionCode || ""
                            //     );
                            //   }}
                            //   onChange={(e) =>
                            //     setEditingVersionCodeValue(e.target.value)
                            //   }
                            //   onBlur={() => {
                            //     if (editingVersionCodeIdx === plan.plId) {
                            //       if (
                            //         editingVersionCodeValue !==
                            //         plan.versionCode
                            //       ) {
                            //         handleVersionCodeChange(
                            //           plan.plId,
                            //           editingVersionCodeValue
                            //         );
                            //       }
                            //       setEditingVersionCodeIdx(null);
                            //     }
                            //   }}
                            //   onKeyDown={(e) => {
                            //     if (e.key === "Enter") {
                            //       if (
                            //         editingVersionCodeValue !==
                            //         plan.versionCode
                            //       ) {
                            //         handleVersionCodeChange(
                            //           plan.plId,
                            //           editingVersionCodeValue
                            //         );
                            //       }
                            //       setEditingVersionCodeIdx(null);
                            //     } else if (e.key === "Escape") {
                            //       setEditingVersionCodeIdx(null);
                            //       setEditingVersionCodeValue(
                            //         plan.versionCode || ""
                            //       );
                            //     }
                            //   }}
                            //   className={`border border-gray-300 rounded px-2 py-1 w-20 text-xs hover:border-blue-500 focus:border-blue-500 focus:outline-none ${
                            //     !plan.plType || !plan.version
                            //       ? "bg-gray-100 cursor-not-allowed"
                            //       : "bg-white"
                            //   }`}
                            //   disabled={!plan.plType || !plan.version}
                            // />
                             <input
                              type="text"
                              value={
                                editingVersionCodeIdx === plan.plId
                                  ? editingVersionCodeValue
                                  : plan.versionCode || ""
                              }
                              autoFocus={editingVersionCodeIdx === plan.plId}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVersionCodeIdx(plan.plId);
                                setEditingVersionCodeValue(
                                  plan.versionCode || ""
                                );
                              }}
                              onChange={(e) =>
                                setEditingVersionCodeValue(e.target.value)
                              }
                              onBlur={() => {
                                if (editingVersionCodeIdx === plan.plId) {
                                  if (
                                    editingVersionCodeValue !==
                                    plan.versionCode
                                  ) {
                                    handleVersionCodeChange(
                                      plan.plId,
                                      editingVersionCodeValue
                                    );
                                  }
                                  setEditingVersionCodeIdx(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (
                                    editingVersionCodeValue !==
                                    plan.versionCode
                                  ) {
                                    handleVersionCodeChange(
                                      plan.plId,
                                      editingVersionCodeValue
                                    );
                                  }
                                  setEditingVersionCodeIdx(null);
                                } else if (e.key === "Escape") {
                                  setEditingVersionCodeIdx(null);
                                  setEditingVersionCodeValue(
                                    plan.versionCode || ""
                                  );
                                }
                              }}
                              className={`border border-gray-300 rounded px-2 py-1 w-20 text-xs hover:border-blue-500 focus:border-blue-500 focus:outline-none ${
                                !plan.plType || !plan.version
                                  ? "bg-gray-100 cursor-not-allowed"
                                  : "bg-white"
                              }`}
                              disabled={!plan.plType || !plan.version}
                            />
 
                          ) : typeof plan[col] === "boolean" ? (
                            <input
                              type="checkbox"
                              checked={getCheckboxProps(plan, col, idx).checked}
                              disabled={
                                getCheckboxProps(plan, col, idx).disabled
                              }
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onDoubleClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(idx, col);
                              }}
                              className="cursor-pointer"
                            />
                          ) : col === "status" ? (
                            <span
                              className={`
          inline-block rounded-2xl px-4 py-1 whitespace-nowrap
          ${
            plan.status === "Submitted"
              ? "bg-yellow-100 text-black"
              : plan.status === "In Progress"
              ? "bg-red-100 text-black"
              : plan.status === "Approved"
              ? "bg-green-100 text-black"
              : plan.status === "Concluded"
              ? "bg-blue-200 text-black"
              : ""
          }
        `}
                              style={{ minWidth: 90, textAlign: "center" }}
                            >
                              {plan.status}
                            </span>
                          ) : (
                            plan[col] || ""
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {showForm && (
          <ProjectPlanForm
            projectId={fullProjectId.current || projectId}
            onClose={() => {
              setShowForm(false);
              setIsActionLoading(false);
            }}
            onPlanCreated={() => {
              refreshPlans();
              setShowForm(false);
              setIsActionLoading(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectPlanTable;
