import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "./config";

const ProjectPlanForm = ({
  projectId,
  onClose,
  onPlanCreated,
  sourcePlan,
  planType: initialPlanType,
}) => {
  const [versionCode, setVersionCode] = useState("QTR1");
  const [planType, setPlanType] = useState(initialPlanType || "BUD");
  const [template, setTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const response = await axios.get(
          `${backendUrl}/Orgnization/GetAllTemplates`
        );
        // console.log('GetAllTemplates API response:', response.data);
        if (!Array.isArray(response.data)) {
          throw new Error("Invalid response format from templates API");
        }
        setTemplates(response.data);
        setTemplate(response.data[0]?.templateCode || "SYSTEM");
      } catch (err) {
        // console.error('Fetch templates error:', err);
        toast.error(
          "Failed to load templates: " +
            (err.response?.data?.message || err.message),
          { toastId: "fetch-templates-error" }
        );
        setTemplates([
          {
            id: 1,
            templateCode: "SYSTEM",
            description: "Default System Template",
          },
        ]);
        setTemplate("SYSTEM");
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId || !versionCode || !planType || !template) {
      toast.error("Missing required parameters for creating plan", {
        toastId: "create-plan-error",
      });
      return;
    }

    // Find the templateId for the selected templateCode
    const selectedTemplate = templates.find((t) => t.templateCode === template);
    const templateId = selectedTemplate ? selectedTemplate.id : 1;

    const newPlan = {
      projId: projectId,
      plType: planType,
      source: sourcePlan ? sourcePlan.version : "",
      type: "SYSTEM",
      template: template, // Always include selected template
      templateId: templateId,
      version: sourcePlan ? (Number(sourcePlan.version) + 1).toString() : "1",
      versionCode: versionCode,
      finalVersion: false,
      isCompleted: false,
      isApproved: false,
      status: "Working",
      closedPeriod: new Date().toISOString().split("T")[0],
      createdBy: "User",
      modifiedBy: "User",
      approvedBy: "",
    };

    // console.log('AddProjectPlan payload:', newPlan); // Debug payload

    try {
      setIsSubmitting(true);
      const toastId = "create-plan";
      toast.info("Creating plan...", { toastId, autoClose: false });
      const response = await axios.post(
        `${backendUrl}/Project/AddProjectPlan`,
        newPlan
      );
      // console.log('AddProjectPlan API response:', response.data);
      toast.update(toastId, {
        render: "Plan created successfully!",
        type: "success",
        autoClose: 3000,
      });
      onPlanCreated();
      onClose();
    } catch (err) {
      // console.error('Create plan error:', err);
      // console.error('Error details:', err.response?.data);
      toast.error(
        "Error creating plan: " + (err.response?.data?.message || err.message),
        { toastId: "create-plan-error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-300">
        <h2 className="text-lg font-bold mb-4">Create New Project Plan</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">
              Version Code:
            </label>
            <input
              type="text"
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">
              Plan Type:
            </label>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BUD">BUD</option>
              <option value="EAC">EAC</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">
              Template:
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoadingTemplates}
            >
              {isLoadingTemplates ? (
                <option value="">Loading templates...</option>
              ) : (
                templates.map((t) => (
                  <option key={t.id} value={t.templateCode}>
                    {t.templateCode}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingTemplates}
              className={`bg-blue-600 text-white px-3 py-1 rounded text-sm ${
                isSubmitting || isLoadingTemplates
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectPlanForm;
