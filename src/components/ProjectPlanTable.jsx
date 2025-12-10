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
  projId: "Project ID",
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

  // Add a ref to track the last fetched project ID to prevent unnecessary API calls
  const lastFetchedProjectId = useRef(null);
  // Add a ref to store the original full project ID for actions
  const fullProjectId = useRef(null);

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
    // Parse the date string as UTC to avoid timezone offset issues
    const dateString = value.includes("T") ? value.split("T")[0] : value;
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`; // Changed to MM/DD/YYYY format
  };

  const sortPlansByProjIdPlTypeVersion = (plansArray) => {
    return [...plansArray].sort((a, b) => {
      if (a.projId < b.projId) return -1;
      if (a.projId > b.projId) return 1;
      if (a.plType < b.plType) return -1;
      if (a.plType > b.plType) return 1;
      // Explicit numeric compare for version
      const aVersion = Number(a.version) || 0;
      const bVersion = Number(b.version) || 0;
      return aVersion - bVersion;
    });
  };

  useEffect(() => {
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
  }, []);

  const fetchPlans = async () => {
    if (!searched && projectId.trim() === "") {
      setPlans([]);
      setFilteredPlans([]);
      setLoading(false);
      lastFetchedProjectId.current = null;
      fullProjectId.current = null;
      return;
    }

    // Prevent unnecessary API calls for the same project
    if (lastFetchedProjectId.current === projectId) {
      setLoading(false);
      return;
    }

    // Store the full project ID for use in actions
    fullProjectId.current = projectId;

    setLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/Project/GetProjectPlans/${projectId}`
      );

      //   console.log('API response:', response.data);

      const transformedPlans = response.data.map((plan, idx) => ({
        plId: plan.plId || plan.id || 0,
        projId:
          plan.projId ||
          plan.fullProjectId ||
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

      //   console.log(transformedPlans);
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

      // Update the last fetched project ID
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

  // Filter plans based on BUD/EAC checkbox
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

  // Modified useEffect to only fetch when projectId actually changes
  useEffect(() => {
    // Only fetch if projectId has actually changed
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
  }, [plans]);

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
          plan.projId ||
          plan.fullProjectId ||
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
    } catch (error) {
      // console.error('Error refreshing plans:', error);
      toast.error("Failed to refresh plans.");
    }
  };

  const handleNewBusinessSave = async (savedData) => {
    // Refresh the plans table to show the newly created project plan
    await refreshPlans();
  };

  // Updated handleRowClick to prevent any side effects that might trigger re-fetching
  const handleRowClick = (plan) => {
    if (
      !selectedPlan ||
      selectedPlan.plId !== plan.plId ||
      selectedPlan.projId !== plan.projId
    ) {
      onPlanSelect(plan);
    }
  };

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

      // Check if response is valid
      if (!response.data || response.data.size === 0) {
        toast.error("No data received from server");
        return;
      }

      // Create blob with proper content type
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

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success("Plan exported successfully!");
    } catch (err) {
      // console.error("Export error:", err);

      // Better error handling
      if (err.response) {
        // Server responded with error status
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
        // Network error
        toast.error("Network error: Unable to reach server");
      } else {
        // Other error
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
          p.projId === updated.projId // ADD THIS LINE
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

    // "In Progress" handling for exclusivity
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
        projId: updated.projId,
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

  //   const handleVersionCodeChange = async (idx, value) => {
  //     const prevPlans = [...plans];
  //     const planId = plans[idx].plId;
  //     let updated = { ...plans[idx], versionCode: value };
  //     const newPlans = plans.map((plan) =>
  //       plan.plId === planId ? updated : plan
  //     );
  //     setPlans(newPlans);
  //     if (planId && Number(planId) > 0) {
  //       const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;
  //       toast.info("Updating version code...", { toastId: "version-code-info" });
  //       try {
  //         setIsActionLoading(true);
  //         await axios.put(updateUrl, updated);
  //       } catch (err) {
  //         setPlans(prevPlans);
  //         toast.error(
  //           "Error updating version code: " +
  //             (err.response?.data?.message || err.message),
  //           { toastId: "version-code-error" }
  //         );
  //       } finally {
  //         setIsActionLoading(false);
  //       }
  //     }
  //   };

  // FIXED: Updated handleActionSelect to use the full project ID

  const handleVersionCodeChange = async (idx, value) => {
    const prevPlans = [...plans];
    const currentPlan = plans[idx];
    const planId = currentPlan.plId;

    // Check if value actually changed
    if (currentPlan.versionCode === value) {
      return; // No change, don't call API
    }

    let updated = { ...currentPlan, versionCode: value };
    const newPlans = plans.map((plan) =>
      plan.plId === planId ? updated : plan
    );
    setPlans(newPlans);

    if (planId && Number(planId) > 0) {
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

  // const handleActionSelect = async (idx, action) => {
  //   const plan = plans[idx];

  //   // console.log('Selected plan object:', plan);
  //   // console.log('Full project ID from ref:', fullProjectId.current);

  //   if (action === "None") return;
  //   try {
  //     setIsActionLoading(true);
  //     if (action === "Delete") {
  //       if (!plan.plId || Number(plan.plId) <= 0) {
  //         toast.error("Cannot delete: Invalid plan ID.");
  //         setIsActionLoading(false);
  //         return;
  //       }
  //       const confirmed = window.confirm(
  //         `Are you sure you want to delete this plan`
  //       );
  //       if (!confirmed) {
  //         setIsActionLoading(false);
  //         return;
  //       }
  //       toast.info("Deleting plan...");
  //       try {
  //         await axios.delete(
  //           `${backendUrl}/Project/DeleteProjectPlan/${plan.plId}`
  //         );
  //         toast.success("Plan deleted successfully!");
  //       } catch (err) {
  //         if (err.response && err.response.status === 404) {
  //           toast.error(
  //             "Plan not found on server. It may have already been deleted."
  //           );
  //         } else {
  //           toast.error(
  //             "Error deleting plan: " +
  //               (err.response?.data?.message || err.message)
  //           );
  //         }
  //         setIsActionLoading(false);
  //         return;
  //       }
  //       // await refreshPlans();
  //       setPlans(plans.filter((p, i) => i !== idx));
  //       if (selectedPlan?.plId === plan.plId) {
  //         onPlanSelect(null); // Deselect if deleted plan selected
  //       }
  //     } 
  //     else if (
  //       action === "Create Budget" ||
  //       action === "Create Blank Budget" ||
  //       action === "Create EAC" ||
  //       action === "Create NB BUD"
  //     ) {
  //       // Use the full project ID from the ref, fallback to plan.projId if not available
  //       const actionProjId = fullProjectId.current || plan.projId;

  //       const payloadTemplate = {
  //         projId: selectedPlan.projId,
  //         plId: plan.plId || 0,
  //         plType:
  //           action === "Create NB BUD"
  //             ? "NBBUD"
  //             : action === "Create Budget" || action === "Create Blank Budget"
  //             ? "BUD"
  //             : "EAC",

  //         source: plan.source || "",
  //         type: isChildProjectId(actionProjId) ? "SYSTEM" : plan.type || "",
  //         version: plan.version,
  //         versionCode: plan.versionCode || "",
  //         finalVersion: false,
  //         isCompleted: false,
  //         isApproved: false,
  //         status: "In Progress",
  //         createdBy: plan.createdBy || "User",
  //         modifiedBy: plan.modifiedBy || "User",
  //         approvedBy: "",
  //         templateId: plan.templateId || 1,
  //         fiscalYear: fiscalYear,
  //       };

  //       // console.log('Payload for action:', payloadTemplate);

  //       toast.info(
  //         `Creating ${
  //           action === "Create Budget"
  //             ? "Budget"
  //             : action === "Create Blank Budget"
  //             ? "Blank Budget"
  //             : "EAC"
  //         }...`
  //       );
  //       // const response = await axios.post(
  //       //   `${backendUrl}/Project/AddProjectPlan?type=${
  //       //     action === "Create Blank Budget" ? "blank" : "actual"
  //       //   }`,
  //       //   payloadTemplate
  //       // );
  //       // const createdPlan = response.data;
  //       // await refreshPlans(); // refresh
  //       // setTimeout(() => {
  //       //   onPlanSelect(createdPlan);
          
  //       // }, 100);
  //       // setPlans([...plans, createdPlan]);
        
  //       const response = await axios.post(
  //         `${backendUrl}/Project/AddProjectPlan?type=${
  //           action === "Create Blank Budget" ? "blank" : "actual"
  //         }`,
  //         payloadTemplate
  //       );
  //       const rawCreatedPlan = response.data;

  //       // FIX: Normalize the plan object to match the table structure to prevent crash
  //       const normalizedPlan = {
  //         ...rawCreatedPlan,
  //         plId: rawCreatedPlan.plId || rawCreatedPlan.id || 0,
  //         projId: rawCreatedPlan.projId || 
  //                 rawCreatedPlan.fullProjectId || 
  //                 rawCreatedPlan.project_id || 
  //                 rawCreatedPlan.projectId || 
  //                 projectId,
  //         projName: rawCreatedPlan.projName || "",
  //         plType:
  //           rawCreatedPlan.plType === "Budget"
  //             ? "BUD"
  //             : rawCreatedPlan.plType === "EAC"
  //             ? "EAC"
  //             : rawCreatedPlan.plType || "",
  //         source: rawCreatedPlan.source || "",
  //         version: rawCreatedPlan.version || 0,
  //         versionCode: rawCreatedPlan.versionCode || "",
  //         finalVersion: !!rawCreatedPlan.finalVersion,
  //         isCompleted: !!rawCreatedPlan.isCompleted,
  //         isApproved: !!rawCreatedPlan.isApproved,
  //         status:
  //           rawCreatedPlan.plType && rawCreatedPlan.version
  //             ? (rawCreatedPlan.status || "In Progress")
  //                 .replace("Working", "In Progress")
  //                 .replace("Completed", "Submitted")
  //             : "",
  //         closedPeriod: rawCreatedPlan.closedPeriod || "",
  //         templateId: rawCreatedPlan.templateId || 0,
  //       };

  //       await refreshPlans(); // refresh
        
  //       setTimeout(() => {
  //         // Pass the normalized plan instead of the raw API response
  //         onPlanSelect(normalizedPlan);
  //       }, 100);
       
       
  //       toast.success(
  //         `${
  //           action === "Create Budget"
  //             ? "Budget"
  //             : action === "Create Blank Budget"
  //             ? "Blank Budget"
  //             : action === "Create NB BUD"
  //             ? "NB BUD"
  //             : "EAC"
  //         } created successfully!`
  //       );
  //     } else {
  //       toast.info(`Action "${action}" selected (API call not implemented)`);
  //     }
  //   } catch (err) {
  //     toast.error(
  //       "Error performing action: " +
  //         (err.response?.data?.message || err.message)
  //     );
  //   } finally {
  //     setIsActionLoading(false);
  //   }
  // };
  
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
      const confirmed = window.confirm(`Are you sure you want to delete this plan`);
      if (!confirmed) {
        setIsActionLoading(false);
        return;
      }
      toast.info("Deleting plan...");
      try {
        await axios.delete(`${backendUrl}/Project/DeleteProjectPlan/${plan.plId}`);
        toast.success("Plan deleted successfully!");
      } catch (err) {
        if (err.response && err.response.status === 404) {
          toast.error("Plan not found on server. It may have already been deleted.");
        } else {
          toast.error("Error deleting plan: " + (err.response?.data?.message || err.message));
        }
        setIsActionLoading(false);
        return;
      }
      setPlans(plans.filter((p, i) => i !== idx));
      if (selectedPlan?.plId === plan.plId) {
        onPlanSelect(null);
      }
    }
    else if (
      action === "Create Budget" ||
      action === "Create Blank Budget" ||
      action === "Create EAC" ||
      action === "Create NB BUD"
    ) {
      // Defensive fallback for project ID
      const actionProjId = fullProjectId.current || plan.projId || projectId || "";

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
        type: typeof isChildProjectId === "function" && isChildProjectId(actionProjId) ? "SYSTEM" : plan.type || "",
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
        `Creating ${action === "Create Budget"
          ? "Budget"
          : action === "Create Blank Budget"
            ? "Blank Budget"
            : action === "Create NB BUD"
              ? "NB BUD"
              : "EAC"}...`
      );

      const response = await axios.post(
        `${backendUrl}/Project/AddProjectPlan?type=${action === "Create Blank Budget" ? "blank" : "actual"}`,
        payloadTemplate
      );
      const rawCreatedPlan = response.data;

      // Improved normalization, covering all possible plan types and keys
      // const normType = (() => {
      //   const t = (rawCreatedPlan.plType || "").toString().toUpperCase();
      //   if (t === "BUDGET" || t === "BUD") return "BUD";
      //   if (t === "EAC") return "EAC";
      //   if (t === "NB BUD" || t === "NBBUD") return "NBBUD";
      //   return t || "";
      // })();

      // const normalizedPlan = {
      //   // Basic and fallback fields
      //   ...rawCreatedPlan,
      //   plId: rawCreatedPlan.plId || rawCreatedPlan.id || 0,
      //   projId: rawCreatedPlan.projId ||
      //           rawCreatedPlan.fullProjectId ||
      //           rawCreatedPlan.project_id ||
      //           rawCreatedPlan.projectId ||
      //           actionProjId ||
      //           "",
      //   projName: rawCreatedPlan.projName || "",
      //   plType: normType,
      //   source: rawCreatedPlan.source || "",
      //   version: Number(rawCreatedPlan.version) || 0,
      //   versionCode: rawCreatedPlan.versionCode || "",
      //   finalVersion: !!rawCreatedPlan.finalVersion,
      //   isCompleted: !!rawCreatedPlan.isCompleted,
      //   isApproved: !!rawCreatedPlan.isApproved,
      //   status: rawCreatedPlan.status
      //     ? rawCreatedPlan.status.replace("Working", "In Progress").replace("Completed", "Submitted")
      //     : "In Progress",
      //   closedPeriod: rawCreatedPlan.closedPeriod || "",
      //   templateId: rawCreatedPlan.templateId || 0,
      // };

      const normalizedPlan = {
        ...plan, // Fallback to existing plan details
        ...rawCreatedPlan, // Override with new details from API
        plId: rawCreatedPlan.plId || rawCreatedPlan.id || 0,
        projId: rawCreatedPlan.projId || plan.projId,
        projName: rawCreatedPlan.projName || plan.projName || "",
        plType: rawCreatedPlan.plType === "Budget" ? "BUD" : (rawCreatedPlan.plType || "BUD"),
        version: Number(rawCreatedPlan.version) || 0,
        status: "In Progress", 
        finalVersion: false,
        isCompleted: false,
        isApproved: false,
        // Ensure dates exist to prevent date parsing crashes in parent
        projStartDt: rawCreatedPlan.projStartDt || plan.projStartDt || "",
        projEndDt: rawCreatedPlan.projEndDt || plan.projEndDt || "",
      };
      
      // Defensive: Ensure essential fields never blank or invalid
      if (!normalizedPlan.projId || !normalizedPlan.plType) {
        toast.error("Plan returned from backend is missing required fields. Please reload and try again.");
        setIsActionLoading(false);
        return;
      }

      await refreshPlans();

      setTimeout(() => {
        onPlanSelect(normalizedPlan);
      }, 100);

      toast.success(`${action === "Create Budget"
        ? "Budget"
        : action === "Create Blank Budget"
          ? "Blank Budget"
          : action === "Create NB BUD"
            ? "NB BUD"
            : "EAC"} created successfully!`);
    } else {
      toast.info(`Action "${action}" selected (API call not implemented)`);
    }
  } catch (err) {
    toast.error("Error performing action: " + (err.response?.data?.message || err.message));
  } finally {
    setIsActionLoading(false);
  }
};
  
  // const handleActionSelect = async (idx, action) => {
  //   const plan = plans[idx];

  //   if (action === "None") return;

  //   try {
  //     setIsActionLoading(true);

  //     // --- DELETE LOGIC ---
  //     if (action === "Delete") {
  //       if (!plan.plId || Number(plan.plId) <= 0) {
  //         toast.error("Cannot delete: Invalid plan ID.");
  //         setIsActionLoading(false);
  //         return;
  //       }
  //       const confirmed = window.confirm(
  //         `Are you sure you want to delete this plan?`
  //       );
  //       if (!confirmed) {
  //         setIsActionLoading(false);
  //         return;
  //       }
  //       toast.info("Deleting plan...");
  //       try {
  //         await axios.delete(
  //           `${backendUrl}/Project/DeleteProjectPlan/${plan.plId}`
  //         );
  //         toast.success("Plan deleted successfully!");
  //       } catch (err) {
  //         if (err.response && err.response.status === 404) {
  //           toast.error(
  //             "Plan not found on server. It may have already been deleted."
  //           );
  //         } else {
  //           toast.error(
  //             "Error deleting plan: " +
  //               (err.response?.data?.message || err.message)
  //           );
  //         }
  //         setIsActionLoading(false);
  //         return;
  //       }
        
  //       setPlans(plans.filter((p, i) => i !== idx));
  //       if (selectedPlan?.plId === plan.plId) {
  //         onPlanSelect(null); // Deselect if deleted plan selected
  //       }
  //     } 
  //     // --- CREATE LOGIC (Budget, Blank, EAC, NB BUD) ---
  //     else if (
  //       action === "Create Budget" ||
  //       action === "Create Blank Budget" ||
  //       action === "Create EAC" ||
  //       action === "Create NB BUD"
  //     ) {
  //       // Use the full project ID from the ref, fallback to plan.projId if not available
  //       const actionProjId = fullProjectId.current || plan.projId;

  //       const payloadTemplate = {
  //         projId: selectedPlan.projId,
  //         plId: plan.plId || 0,
  //         plType:
  //           action === "Create NB BUD"
  //             ? "NBBUD"
  //             : action === "Create Budget" || action === "Create Blank Budget"
  //             ? "BUD"
  //             : "EAC",

  //         source: plan.source || "",
  //         type: isChildProjectId(actionProjId) ? "SYSTEM" : plan.type || "",
  //         version: plan.version,
  //         versionCode: plan.versionCode || "",
  //         finalVersion: false,
  //         isCompleted: false,
  //         isApproved: false,
  //         status: "In Progress",
  //         createdBy: plan.createdBy || "User",
  //         modifiedBy: plan.modifiedBy || "User",
  //         approvedBy: "",
  //         templateId: plan.templateId || 1,
  //         fiscalYear: fiscalYear,
  //       };

  //       toast.info(
  //         `Creating ${
  //           action === "Create Budget"
  //             ? "Budget"
  //             : action === "Create Blank Budget"
  //             ? "Blank Budget"
  //             : "EAC"
  //         }...`
  //       );

  //       const response = await axios.post(
  //         `${backendUrl}/Project/AddProjectPlan?type=${
  //           action === "Create Blank Budget" ? "blank" : "actual"
  //         }`,
  //         payloadTemplate
  //       );
        
  //       const rawCreatedPlan = response.data;

  //       // --- CRITICAL FIX: Normalize Data to prevent Crash ---
  //       // This matches the transformation logic in fetchPlans()
  //       const normalizedPlan = {
  //         ...rawCreatedPlan,
  //         plId: rawCreatedPlan.plId || rawCreatedPlan.id || 0,
  //         projId: rawCreatedPlan.projId || 
  //                 rawCreatedPlan.fullProjectId || 
  //                 rawCreatedPlan.project_id || 
  //                 rawCreatedPlan.projectId || 
  //                 projectId,
  //         projName: rawCreatedPlan.projName || "",
  //         // Transform API type to UI type (Budget -> BUD)
  //         plType:
  //           rawCreatedPlan.plType === "Budget"
  //             ? "BUD"
  //             : rawCreatedPlan.plType === "EAC"
  //             ? "EAC"
  //             : rawCreatedPlan.plType || "",
  //         source: rawCreatedPlan.source || "",
  //         version: rawCreatedPlan.version || 0,
  //         versionCode: rawCreatedPlan.versionCode || "",
  //         finalVersion: !!rawCreatedPlan.finalVersion,
  //         isCompleted: !!rawCreatedPlan.isCompleted,
  //         isApproved: !!rawCreatedPlan.isApproved,
  //         // Transform Status string
  //         status:
  //           rawCreatedPlan.plType && rawCreatedPlan.version
  //             ? (rawCreatedPlan.status || "In Progress")
  //                 .replace("Working", "In Progress")
  //                 .replace("Completed", "Submitted")
  //             : "In Progress",
  //         closedPeriod: rawCreatedPlan.closedPeriod || "",
  //         templateId: rawCreatedPlan.templateId || 0,
  //         createdAt: rawCreatedPlan.createdAt || "",
  //         updatedAt: rawCreatedPlan.updatedAt || "",
  //         // Ensure numeric fields are not undefined
  //         fundedCost: rawCreatedPlan.proj_f_cst_amt || "",
  //         fundedFee: rawCreatedPlan.proj_f_fee_amt || "",
  //         fundedRev: rawCreatedPlan.proj_f_tot_amt || "",
  //       };

  //       await refreshPlans(); 
        
  //       // Use timeout to allow React state to settle before selecting
  //       setTimeout(() => {
  //         onPlanSelect(normalizedPlan);
  //       }, 200);
        
  //       toast.success(
  //         `${
  //           action === "Create Budget"
  //             ? "Budget"
  //             : action === "Create Blank Budget"
  //             ? "Blank Budget"
  //             : action === "Create NB BUD"
  //             ? "NB BUD"
  //             : "EAC"
  //         } created successfully!`
  //       );
  //     } else {
  //       toast.info(`Action "${action}" selected (API call not implemented)`);
  //     }
  //   } catch (err) {
  //     toast.error(
  //       "Error performing action: " +
  //         (err.response?.data?.message || err.message)
  //     );
  //   } finally {
  //     setIsActionLoading(false);
  //   }
  // };

  const getActionOptions = (plan) => {
    let options = ["None"];
    if (isChildProjectId(plan.projId) && !plan.plType && !plan.version) {
      return ["None", "Create Budget", "Create Blank Budget"];
    }
    if (!plan.plType || !plan.version) return options;
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
    return options;
  };

  const getButtonAvailability = (plan, action) => {
    const options = getActionOptions(plan);
    return options.includes(action);
  };

  // Check if it's a parent project (no dots) and no actions have been performed
  // const isParentProjectWithoutActions = (plan) => {
  //   if (isChildProjectId(plan.projId)) return false; // It's a child project

  //   // If it's a parent project (no dots) and has no plType or version, no actions performed
  //   return !plan.plType || !plan.version;
  // };

  const checkedFinalVersionIdx = plans.findIndex((plan) => plan.finalVersion);

  const getCheckboxProps = (plan, col, idx) => {
    if (!plan.plType || !plan.version)
      return { checked: false, disabled: true };

    if (col === "isCompleted")
      return { checked: plan.isCompleted, disabled: !!plan.isApproved };

    if (col === "isApproved")
      return { checked: plan.isApproved, disabled: !plan.isCompleted };

    if (col === "finalVersion") {
      // Find if any other plan with same plType and same projId has finalVersion checked
      const anotherFinalVersionIdx = plans.findIndex(
        (p, i) =>
          i !== idx &&
          p.plType === plan.plType &&
          p.projId === plan.projId &&
          p.finalVersion
      );

      // Disable finalVersion checkbox for this row only if another finalVersion in the same plType and projId is checked
      return {
        checked: plan.finalVersion,
        disabled: anotherFinalVersionIdx !== -1, // disable if any other finalVersion for same plType and projId
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
    if (!selectedPlan || !selectedPlan.plType || !selectedPlan.version)
      return true;
    if (field === "isCompleted") return !!selectedPlan.isApproved;
    if (field === "isApproved") return !selectedPlan.isCompleted;
    if (field === "finalVersion") {
      // Check if any other plan with same plType and same projId has finalVersion checked
      const anotherFinalVersionIdx = plans.findIndex(
        (p) =>
          p.plId !== selectedPlan.plId &&
          p.plType === selectedPlan.plType &&
          p.projId === selectedPlan.projId &&
          p.finalVersion
      );
      if (anotherFinalVersionIdx !== -1) return true;
      return !selectedPlan.isApproved;
    }
    return false;
  };

  const getCalcButtonDisabled = () => {
    return !selectedPlan || !selectedPlan.plId || !selectedPlan.templateId;
  };

  const getMasterProjects = (plans) => {
    return plans.filter((plan) => {
      const projId = plan.projId?.trim();
      if (!projId) return false;

      // Master = no dots at all
      return !projId.includes(".");
    });
  };

  const getMasterAndRelatedProjects = (plans, clickedProjId) => {
    if (!clickedProjId)
      return { master: null, related: [], sameLevelBud: false };

    const parts = clickedProjId.split(".");
    const masterId = parts[0];
    const selectedLevel = parts.length; // ✅ selected row level

    // Filter only bud plans that start with masterId
    const filtered = plans.filter(
      (p) => p.projId?.startsWith(masterId) && p.plType === "BUD"
    );

    // Deduplicate by projId
    const seen = new Set();
    const related = filtered
      .filter((p) => {
        if (seen.has(p.projId)) return false;
        seen.add(p.projId);
        return true;
      })
      .map((p) => ({
        ...p,
        level: p.projId.split(".").length, // each BUD plan's level
      }));

    if (related.length === 0) {
      return { master: masterId, related, selectedLevel, sameLevelBud: true };
    }
    // ✅ Check if any bud is created at same level as selected row
    const sameLevelBud = related.some((r) => r.level === selectedLevel);

    return { master: masterId, related, selectedLevel, sameLevelBud };
  };

  // const getMasterAndRelatedProjects = (plans, clickedProjId) => {
  //   if (!clickedProjId)
  //     return { master: null, related: [], sameLevelBud: false };

  //   const parts = clickedProjId.split(".");
  //   const masterId = parts[0];
  //   const selectedLevel = parts.length; // ✅ selected row level

  //   // Filter only bud plans that start with masterId
  //   const filtered = plans.filter(
  //     (p) => p.projId?.startsWith(masterId) && p.plType === "BUD"
  //   );

  //   // Deduplicate by projId
  //   const seen = new Set();
  //   const related = filtered
  //     .filter((p) => {
  //       if (seen.has(p.projId)) return false;
  //       seen.add(p.projId);
  //       return true;
  //     })
  //     .map((p) => ({
  //       ...p,
  //       level: p.projId.split(".").length, // each BUD plan's level
  //     }));

  //   // ✅ Check if any bud is created at same level as selected row
  //   const sameLevelBud = related.some((r) => r.level === selectedLevel);

  //   return { master: masterId, related, selectedLevel, sameLevelBud };
  // };

  // // Enable actions if plType and version are both empty
  //  const isPlanWithoutActions = plan => !plan.plType && !plan.version;

  // if (loading) {
  //   return (
  //     <div className="p-4">
  //       <div className="flex items-center justify-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  //         <span className="ml-2">Loading project plans...</span>
  //       </div>
  //     </div>
  //   );
  // }

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

      {/* New Business Popup Overlay - positioned specifically over the table area */}

      {showNewBusinessPopup && (
        <div className="absolute inset-0 z-30">
          {/* Blur overlay */}
          <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm"></div>

          {/* Popup container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Content - with proper scrolling */}
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

      {/* Your existing content with blur effect when popup is open */}
      <div
        className={`transition-all duration-200 ${
          showNewBusinessPopup ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <div className="flex justify-between items-center mb-2 gap-1">
          <div className="flex gap-1 flex-wrap items-center ">
            {plans.length >= 0 && (
              <>
                {/* Create Budget */}
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
                    !getButtonAvailability(selectedPlan, "Create Budget") ||
                    !getMasterAndRelatedProjects(plans, selectedPlan?.projId)
                      .sameLevelBud
                  }
                  className={`btn1 ${
                    !selectedPlan ||
                    !getButtonAvailability(selectedPlan, "Create Budget") ||
                    !getMasterAndRelatedProjects(plans, selectedPlan?.projId)
                      .sameLevelBud
                      ? "btn-disabled"
                      : "btn-blue"
                  }`}
                  title="Create Budget"
                >
                  New Budget
                </button>
                {/* Create Blank budget */}
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
                    !getButtonAvailability(
                      selectedPlan,
                      "Create Blank Budget"
                    ) ||
                    !getMasterAndRelatedProjects(plans, selectedPlan?.projId)
                      .sameLevelBud
                  }
                  className={`btn1 ${
                    !selectedPlan ||
                    !getButtonAvailability(
                      selectedPlan,
                      "Create Blank Budget"
                    ) ||
                    !getMasterAndRelatedProjects(plans, selectedPlan?.projId)
                      .sameLevelBud
                      ? "btn-disabled"
                      : "btn-blue"
                  }`}
                  title="Create Blank Budget"
                >
                  New Blank Budget
                </button>
                {/* Create EAC */}
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
                    !getButtonAvailability(selectedPlan, "Create EAC") ||
                    !getMasterAndRelatedProjects(plans, selectedPlan?.projId)
                      .sameLevelBud
                  }
                  className={`btn1 ${
                    !selectedPlan ||
                    !getButtonAvailability(selectedPlan, "Create EAC") ||
                    !getMasterAndRelatedProjects(plans, selectedPlan?.projId)
                      .sameLevelBud
                      ? "btn-disabled"
                      : "btn-blue"
                  }`}
                  title="Create EAC"
                >
                  New EAC
                </button>

                {/* new bud */}
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

                {/* Delete */}
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

                {/* Submit */}
                <button
                  onClick={() => handleTopButtonToggle("isCompleted")}
                  disabled={
                    getTopButtonDisabled("isCompleted") || isActionLoading
                  }
                  className={`btn1 ${
                    getTopButtonDisabled("isCompleted") || isActionLoading
                      ? "btn-disabled"
                      : selectedPlan?.status === "Submitted"
                      ? "btn-orange"
                      : "btn-blue"
                  }`}
                  title={
                    selectedPlan?.status === "Submitted" ? "Unsubmit" : "Submit"
                  }
                >
                  {isActionLoading
                    ? "Processing..."
                    : selectedPlan?.status === "Submitted"
                    ? "Unsubmit"
                    : "Submit"}
                </button>

                {/* Approve */}
                <button
                  onClick={() => handleTopButtonToggle("isApproved")}
                  disabled={
                    getTopButtonDisabled("isApproved") || isActionLoading
                  }
                  className={`btn1 ${
                    getTopButtonDisabled("isApproved") || isActionLoading
                      ? "btn-disabled"
                      : selectedPlan?.status === "Approved" ||
                        selectedPlan?.finalVersion
                      ? "btn-orange"
                      : "btn-blue"
                  }`}
                  title={
                    selectedPlan?.status === "Approved"
                      ? "Unapprove"
                      : "Approve"
                  }
                >
                  {isActionLoading
                    ? "Processing..."
                    : selectedPlan?.status === "Approved" ||
                      selectedPlan?.finalVersion
                    ? "Unapprove"
                    : "Approve"}
                </button>

                {/* Conclude */}
                <button
                  onClick={() => handleTopButtonToggle("finalVersion")}
                  disabled={
                    getTopButtonDisabled("finalVersion") || isActionLoading
                  }
                  className={`btn1 ${
                    getTopButtonDisabled("finalVersion") || isActionLoading
                      ? "btn-disabled"
                      : selectedPlan?.finalVersion
                      ? "btn-orange"
                      : "btn-blue"
                  }`}
                  title={selectedPlan?.finalVersion ? "Unconclude" : "Conclude"}
                >
                  {isActionLoading
                    ? "Processing..."
                    : selectedPlan?.finalVersion
                    ? "Unconclude"
                    : "Conclude"}
                </button>

                {/* Calculate */}
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

                {/* filter BUD/EAC */}
                <button
                  onClick={() => setBudEacFilter(!budEacFilter)}
                  className={`btn1 ${budEacFilter ? "btn-orange" : "btn-blue"}`}
                  title={
                    budEacFilter ? "Show All Plans" : "Filter BUD/EAC Plans"
                  }
                >
                  {budEacFilter ? "Show All" : "BUD/EAC"}
                </button>

                {/* New Business */}
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

          {/* Right side controls - Import and Fiscal Year */}
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

        <div className="rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto h-85">
            <table className="min-w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Export
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-widern whitespace-nowrap text-center"
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
                      key={`plan-${plan.plId || idx}-${
                        plan.projId || "unknown"
                      }`}
                      className={`transition-all duration-200 cursor-pointer ${
                        selectedPlan &&
                        selectedPlan.plId === plan.plId &&
                        selectedPlan.projId === plan.projId
                          ? "bg-blue-200 hover:bg-blue-300 "
                          : "even:bg-gray-50 hover:bg-blue-50"
                      }`}
                      //border-l-4 border-l-blue-600
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
                          className={` text-xs h-1 px-1 py-1 text-center text-gray-700
                            
    
                ${col === "projId" || col === "projName" ? "break-words" : ""}
                ${
                  col === "createdAt" ||
                  col === "updatedAt" ||
                  col === "closedPeriod"
                    ? "whitespace-nowrap"
                    : ""
                }
              `}
                        >
                          {col === "closedPeriod" ? (
                            formatDateOnly(plan[col])
                          ) : col === "createdAt" || col === "updatedAt" ? (
                            formatDateWithTime(plan[col])
                          ) : col === "versionCode" ? (
                            <input
                              type="text"
                              value={
                                editingVersionCodeIdx === idx
                                  ? editingVersionCodeValue
                                  : plan.versionCode || ""
                              }
                              autoFocus={editingVersionCodeIdx === idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVersionCodeIdx(idx);
                                setEditingVersionCodeValue(
                                  plan.versionCode || ""
                                );
                              }}
                              onChange={(e) =>
                                setEditingVersionCodeValue(e.target.value)
                              }
                              onBlur={() => {
                                if (editingVersionCodeIdx === idx) {
                                  if (
                                    editingVersionCodeValue !== plan.versionCode
                                  ) {
                                    handleVersionCodeChange(
                                      idx,
                                      editingVersionCodeValue
                                    );
                                  }
                                  setEditingVersionCodeIdx(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (
                                    editingVersionCodeValue !== plan.versionCode
                                  ) {
                                    handleVersionCodeChange(
                                      idx,
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
