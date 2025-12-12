import React, { useState, useEffect } from "react";
import Select from "react-select";
import { backendUrl } from "./config";


const AnalogRate = () => {
  // projectInput (free-text) removed — selection should come only from API-provided dropdown
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [activeTab, setActiveTab] = useState("Burden Cost Ceiling Details");
  const [isSearched, setIsSearched] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


const nbiRateRows = [
  {
    accountType: "1 - Total Revenue (REVENUE)",
    actual: "74,462,470.14",
    rates: ["", "", "", "", "", ""],
  },
  {
    accountType: "2 - Sumaria Labor Onsite (LABOR)",
    actual: "32,886,490.18",
    rates: ["44.17%", "44.17%", "44.17%", "44.17%", "44.17%", "44.17%"],
  },
  {
    accountType: "2 - Sumaria Labor Onsite (UNALLOW-LABOR)",
    actual: "112.92",
    rates: ["0.00%", "0.00%", "0.00%", "0.00%", "0.00%", "0.00%"],
  },
  {
    accountType: "5 - Sumaria Travel (NON-LABOR)",
    actual: "1,350,732.10",
    rates: ["1.81%", "1.81%", "1.81%", "1.81%", "1.81%", "1.81%"],
  },
  {
    accountType: "6 - Subcontractors (LABOR)",
    actual: "14,850,167.76",
    rates: ["19.94%", "19.94%", "19.94%", "19.94%", "19.94%", "19.94%"],
  },
  {
    accountType: "6 - Subcontractors (NON-LABOR)",
    actual: "618,959.31",
    rates: ["0.83%", "0.83%", "0.83%", "0.83%", "0.83%", "0.83%"],
  },
];


  const tabs = [
    "Burden Cost Ceiling Details",
    "Employee Hours Ceilings",
    "Direct Cost Ceilings",
    "Hours Ceilings",
    "Cost Fee Override Details",
  ];

   const projectOptions = availableProjects.map((project) => ({
    value: project.projectId,
    label: project.name
      ? `${project.projectId} - ${project.name}`
      : project.projectId,
  }));

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
            // prefer the API's provided logical project identifier (projectId) if present
            // const initialId = projects[0].projectId ?? projects[0].id ?? "";
            // setSelectedProjectId(initialId);
            setLoading(false);
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
    }, []); 

    useEffect(() => {
      // mark searched when a user chooses a project from dropdown
      setIsSearched(!!selectedProjectId);
    }, [selectedProjectId]);

  // search is handled by selecting a project from the dropdown — no free-text search

  const handleTabClick = (tab) => {
    if (activeTab === tab) {
      // toggling the same tab off should clear selection so we don't keep a stale project
      setActiveTab("");
      setIsSearched(false);
      setSelectedProjectId("");
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
      <h1 className="w-full  bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
        NBIs Analogous Rate
      </h1>
      {/* project selector (API-sourced) — free-text entry removed on purpose */}
 <table className="min-w-full border border-gray-300 text-sm">
  <thead className="bg-gray-100">
    <tr>
      <th className="border px-2 py-1 text-left">NBIs RATE</th>
      <th className="border px-2 py-1 text-right">FY-25 Actual AMT</th>
      <th className="border px-2 py-1 text-right">FY-25 Rate</th>
      <th className="border px-2 py-1 text-right">FY-26 Rate</th>
      <th className="border px-2 py-1 text-right">FY-27 Rate</th>
      <th className="border px-2 py-1 text-right">FY-28 Rate</th>
      <th className="border px-2 py-1 text-right">FY-29 Rate</th>
      <th className="border px-2 py-1 text-right">FY-30 Rate</th>
    </tr>
  </thead>
  <tbody>
    {nbiRateRows.map((row) => (
      <tr key={row.accountType}>
        <td className="border px-2 py-1">{row.accountType}</td>
        <td className="border px-2 py-1 text-right">
          ${" "}{row.actual}
        </td>
        {row.rates.map((r, idx) => (
          <td key={idx} className="border px-2 py-1 text-right">
            {r}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>

    </div>
  );
};

export default AnalogRate;
