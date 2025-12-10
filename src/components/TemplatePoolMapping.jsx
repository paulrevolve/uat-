import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const TemplatePoolMapping = () => {
  const [templates, setTemplates] = useState([]);
  const [pools, setPools] = useState([]);
  const [groupNames, setGroupNames] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [poolMappings, setPoolMappings] = useState({});
  const [originalPoolMappings, setOriginalPoolMappings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const templateResponse = await axios.get(
          `${backendUrl}/Orgnization/GetAllTemplates`
        );
        setTemplates(templateResponse.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch templates"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const fetchPoolData = async () => {
    setLoading(true);
    try {
      const poolResponse = await axios.get(
        `${backendUrl}/Orgnization/GetAllPools`
      );
      const poolList =
        poolResponse.data.map((item) => ({
          poolId: item.code,
          groupName: item.name || item.code,
        })) || [];
      setPools(poolList);
      const names = poolList.reduce((acc, pool) => {
        acc[pool.poolId] = pool.name;
        return acc;
      }, {});
      setGroupNames(names);

      let initialMappings = poolList.reduce((acc, pool) => {
        acc[pool.poolId] = false;
        return acc;
      }, {});

      if (selectedTemplate) {
        const mappingResponse = await axios.get(
          `${backendUrl}/Orgnization/GetPoolsByTemplateId?templateId=${selectedTemplate}`
        );
        const mappedPools = mappingResponse.data.reduce((acc, pool) => {
          acc[pool.poolId] = true;
          return acc;
        }, {});

        initialMappings = poolList.reduce((acc, pool) => {
          acc[pool.poolId] = mappedPools[pool.poolId] || false;
          return acc;
        }, {});
      }

      setPoolMappings(initialMappings);
      setOriginalPoolMappings({ ...initialMappings });
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch pools"
      );
      setPools([]);
      setGroupNames({});
      setPoolMappings({});
      setOriginalPoolMappings({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTemplate) {
      fetchPoolData();
    } else {
      setPools([]);
      setPoolMappings({});
      setOriginalPoolMappings({});
    }
  }, [selectedTemplate]);

  const handleCheckboxChange = (poolId) => {
    setPoolMappings((prev) => ({
      ...prev,
      [poolId]: !prev[poolId],
    }));
  };

  const handleSave = async () => {
    if (isSaving || !selectedTemplate) return;

    setIsSaving(true);
    try {
      const hasChanges = Object.keys(poolMappings).some(
        (poolId) => poolMappings[poolId] !== originalPoolMappings[poolId]
      );
      if (!hasChanges) {
        toast.info("No changes to save");
        setIsSaving(false);
        return;
      }

      const payload = [
        {
          templateId: parseInt(selectedTemplate),
          ...Object.keys(poolMappings).reduce((acc, poolId) => {
            acc[poolId] = poolMappings[poolId];
            return acc;
          }, {}),
        },
      ];

      const response = await axios.post(
        `${backendUrl}/Orgnization/BulkUpSertTemplatePoolMapping`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      setOriginalPoolMappings({ ...poolMappings });
      localStorage.setItem(
        `poolMappings_${selectedTemplate}`,
        JSON.stringify(poolMappings)
      );

      await fetchPoolData();
      setError(null);
      toast.success("Data saved successfully");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to save pool mappings";
      setError(errorMessage);
      setPoolMappings({ ...originalPoolMappings });
      toast.error("Failed to save data: " + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 font">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 max-w-6xl mx-auto font-roboto bg-gray-50 rounded-xl shadow-md">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
      />
      <h1 className="w-full  bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
        Template Pool Mapping
      </h1>
      {loading && <p className="text-gray-600 text-sm">Loading...</p>}
      {isSaving && <p className="text-gray-600 text-sm">Saving...</p>}
      {error && <p className="text-red-600 text-sm mb-4">Error: {error}</p>}
      <div className="space-y-6 sm:space-y-8">
        <div>
          <label
            htmlFor="template"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Template
          </label>
          <select
            id="template"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            disabled={loading || isSaving}
          >
            <option value="">Select Template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.templateCode}
              </option>
            ))}
          </select>
        </div>
        {selectedTemplate && (
          <>
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-3">
                Pools
              </h2>
              {pools.length === 0 && !loading && (
                <p className="text-gray-600 text-sm">
                  No pools available for this template.
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                {pools.map((pool) => (
                  <div
                    key={pool.poolId}
                    className="flex items-center space-x-1"
                  >
                    <input
                      type="checkbox"
                      id={pool.poolId}
                      checked={poolMappings[pool.poolId] || false}
                      onChange={() => handleCheckboxChange(pool.poolId)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-50"
                      disabled={loading || isSaving}
                      isSaving
                    />
                    <label
                      htmlFor={pool.poolId}
                      className="text-xs font-semibold text-gray-900"
                    >
                      {groupNames[pool.poolId] || pool.groupName || pool.poolId}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 text-sm font-semibold"
                onClick={handleSave}
                disabled={loading || isSaving}
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplatePoolMapping;
