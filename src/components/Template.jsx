import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { backendUrl } from "./config";

const Template = ({ updatedBy = "User" }) => {
  const [templates, setTemplates] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    templateCode: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${backendUrl}/Orgnization/GetAllTemplates`);
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.templateCode || !newTemplate.description) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const tempId = Date.now();
    const optimisticTemplate = {
      id: tempId,
      templateCode: newTemplate.templateCode,
      description: newTemplate.description,
      plPoolRates: [],
      templatePoolRate: [],
      rates: [],
    };
    setTemplates((prev) => [...prev, optimisticTemplate]);

    try {
      const response = await fetch(
        `${backendUrl}/Orgnization/AddTemplate?updatedBy=${encodeURIComponent(
          updatedBy
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateCode: newTemplate.templateCode,
            description: newTemplate.description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add template");
      }

      await fetchTemplates();
      setNewTemplate({ templateCode: "", description: "" });
      setIsFormOpen(false);
      setIsSubmitting(false);
    } catch (err) {
      setTemplates((prev) => prev.filter((template) => template.id !== tempId));
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (template) => {
    const templateId = template.id;
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));

    try {
      const response = await fetch(
        `${backendUrl}/Orgnization/DeleteTemplate?updatedBy=${encodeURIComponent(
          updatedBy
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: template.id,
            templateCode: template.templateCode,
            description: template.description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      await fetchTemplates();
    } catch (err) {
      setTemplates((prev) => [...prev, template].sort((a, b) => a.id - b.id));
      setError(err.message);
    }
  };

  if (loading && templates.length === 0) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  if (error && templates.length === 0) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center gap-2 mb-4">
        <h2 className="w-full  bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
          Burden Setup
        </h2>
      </div>

      {/* Form to Add New Template */}
      {isFormOpen && (
        <div className="mb-6 p-4 border border-gray-300 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Add New Template
          </h3>
          <form onSubmit={handleAddTemplate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Burden Code
                </label>
                <input
                  type="text"
                  name="templateCode"
                  value={newTemplate.templateCode}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter burden code"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={newTemplate.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter description"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition ease-in-out duration-200 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition ease-in-out duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 -mt-3 mb-3 rounded-md hover:bg-blue-700 transition ease-in-out duration-200 "
          disabled={isSubmitting}
        >
          <Plus className="w-5 h-5" />
          <span>Burden</span>
        </button>
      </div>
      <div className="overflow-x-auto border-line">
        <table className="min-w-full table">
          <thead className="thead">
            <tr>
              <th className="th-thead">Burden_Code</th>
              <th className="th-thead">Description</th>
              <th className="th-thead">Actions</th>
            </tr>
          </thead>
          <tbody className="tbody">
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50">
                <td className="tbody-td">{template.templateCode}</td>
                <td className="tbody-td">{template.description}</td>
                <td className="tbody-td">
                  <button
                    onClick={() => handleDeleteTemplate(template)}
                    className="text-red-600 hover:text-red-800 transition ease-in-out duration-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Template;
