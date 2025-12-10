// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { backendUrl } from "./config";
// import EmployeeSchedule from "./EmployeeSchedule";

// const Warning = ({ planId, projectId, templateId, planType, emplId }) => {
//   const [warnings, setWarnings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showEmployeeSchedule, setShowEmployeeSchedule] = useState(false);
//   const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

//   // const fetchWarnings = async () => {
//   //   if (!planId) {
//   //     setWarnings([]);
//   //     setLoading(false);
//   //     return;
//   //   }

//   //   try {
//   //     setLoading(true);
//   //     const response = await axios.get(
//   //       `${backendUrl}/Project/GetWarningsByPlId/${planId}`
//   //     );

//   //     setWarnings(response.data || []);
//   //     setError(null);
//   //   } catch (err) {
//   //     setError("Failed to fetch warnings");
//   //     // console.error("Error fetching warnings:", err);
//   //     setWarnings([]);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   useEffect(() => {
//     const fetchWarnings = async () => {
//       setLoading(true);
//       try {
//         let url;
//         if (emplId) {
//           url = `${backendUrl}/Project/GetWarningsByEMployee/${planId}/${emplId}`;
//         } else {
//           url = `${backendUrl}/Project/GetWarningsByPlId/${planId}`; // example fallback endpoint
//         }
//         const response = await axios.get(url);
//         setWarnings(response.data);
//         setError(null);
//       } catch (err) {
//         setError("Failed to fetch warnings");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (planId) {
//       fetchWarnings();
//     }
//   }, [planId, emplId]);

//   const handleEmployeeRowClick = (employeeId) => {
//     setSelectedEmployeeId(employeeId);
//     setShowEmployeeSchedule(true);
//   };

//   const handleCloseEmployeeSchedule = () => {
//     setShowEmployeeSchedule(false);
//     setSelectedEmployeeId(null);
//   };

//   // useEffect(() => {
//   //   fetchWarnings();
//   // }, [planId,emplId]);

//   if (loading) {
//     return (
//       // <div className="flex justify-center items-center py-4">
//       //   <div className="text-gray-600 text-sm">Loading warnings...</div>
//       // </div>
//       <div className="p-4 font-inter flex justify-center items-center">
//         <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
//         <span className="ml-2 text-xs text-gray-600">Loading Warnings...</span>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex justify-center items-center py-4">
//         <div className="text-red-600 text-sm">{error}</div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full">
//       {warnings.length === 0 ? (
//         <div className="text-center py-4 text-gray-500 text-sm">
//           No warnings found for this project.
//         </div>
//       ) : (
//         <div
//           className="overflow-x-auto overflow-y-auto border-line"
//           style={{ maxHeight: "300px" }}
//         >
//           <table className="min-w-full table">
//             <thead className="thead">
//               <tr>
//                 <th className="th-thead">Warning</th>
//                 <th className="th-thead">ProjId</th>
//                 <th className="th-thead">EmplId</th>
//                 <th className="th-thead">Year</th>
//                 <th className="th-thead">Month</th>
//               </tr>
//             </thead>
//             <tbody className="tbody">
//               {warnings.map((warning, index) => (
//                 <tr
//                   key={index}
//                   className={`${
//                     index === 1
//                       ? "hover:bg-blue-50 cursor-pointer bg-blue-25"
//                       : "hover:bg-gray-50"
//                   }`}
//                   onClick={
//                     index === 1
//                       ? () => handleEmployeeRowClick(warning.emplId)
//                       : undefined
//                   }
//                   title={index === 1 ? "Click to view employee schedule" : ""}
//                 >
//                   <td className="tbody-td text-left">
//                     {warning.warning || ""}
//                   </td>
//                   <td className="tbody-td">{warning.projId || ""}</td>
//                   <td className="tbody-td">{warning.emplId || ""}</td>
//                   <td className="tbody-td">{warning.year || ""}</td>
//                   <td className="tbody-td">
//                     {warning.month === 0 ? "All Year" : warning.month || ""}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Employee Schedule Modal */}
//       {showEmployeeSchedule && (
//         <EmployeeSchedule
//           employeeId={selectedEmployeeId}
//           onClose={handleCloseEmployeeSchedule}
//         />
//       )}
//     </div>
//   );
// };

// export default Warning;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "./config";
import EmployeeSchedule from "./EmployeeSchedule";

const Warning = ({
  planId,
  projectId,
  templateId,
  planType,
  emplId,
  startDate,
  endDate,
  fiscalYear,
}) => {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmployeeSchedule, setShowEmployeeSchedule] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  // useEffect(() => {
  //   const fetchWarnings = async () => {
  //     setLoading(true);
  //     try {
  //       let url;
  //       if (emplId) {
  //         url = `${backendUrl}/Project/GetWarningsByEMployee/${planId}/${emplId}`;
  //       } else {
  //         url = `${backendUrl}/Project/GetWarningsByPlId/${planId}`;
  //       }
  //       const response = await axios.get(url);
  //       setWarnings(response.data);
  //       setError(null);
  //     } catch (err) {
  //       setError("Failed to fetch warnings");
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (planId) {
  //     fetchWarnings();
  //   }
  // }, [planId, emplId]);

  useEffect(() => {
    const fetchWarnings = async () => {
      setLoading(true);
      try {
        let url;
        if (emplId) {
          url = `${backendUrl}/Project/GetWarningsByEMployee/${planId}/${emplId}`;
        } else {
          url = `${backendUrl}/Project/GetWarningsByPlId/${planId}`;
        }

        const response = await axios.get(url);
        setWarnings(response.data);
        setError(null);
      } catch (err) {
        // Try to use API message, fallback to generic
        const apiMessage =
          err?.response?.data?.message || "Failed to fetch warnings";
        setError(apiMessage);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      fetchWarnings();
    }
  }, [planId, emplId]);

  // const handleEmployeeRowClick = (employeeId, index) => {
  //   setSelectedEmployeeId(employeeId);
  //   setSelectedRowIndex(index);
  // };

  const handleEmployeeRowClick = (employeeId, index) => {
    // If the same row is clicked again, unselect it
    if (selectedRowIndex === index) {
      setSelectedEmployeeId(null);
      setSelectedRowIndex(null);
    } else {
      // Otherwise, select the new row
      setSelectedEmployeeId(employeeId);
      setSelectedRowIndex(index);
    }
  };

  const handleShowEmployeeSchedule = () => {
    if (!selectedEmployeeId) {
      return;
    }
    setShowEmployeeSchedule(true);
  };

  const handleCloseEmployeeSchedule = () => {
    setShowEmployeeSchedule(false);
  };

  if (loading) {
    return (
      <div className="p-4 font-inter flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-gray-600">Loading Warnings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  // Show Employee Schedule Modal
  if (showEmployeeSchedule && selectedEmployeeId) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Employee Schedule - {selectedEmployeeId}
            </h3>
            <button
              onClick={handleCloseEmployeeSchedule}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>

          <EmployeeSchedule
            planId={planId}
            projectId={projectId}
            status="In Progress"
            planType={planType}
            startDate={startDate}
            endDate={endDate}
            fiscalYear={fiscalYear}
            emplId={selectedEmployeeId}
          />

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCloseEmployeeSchedule}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Employee Schedule Button */}
      <div className="mb-3 flex justify-end">
        <button
          onClick={handleShowEmployeeSchedule}
          disabled={!selectedEmployeeId}
          className={`px-4 py-2 rounded text-xs font-medium transition ${
            selectedEmployeeId
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          title={
            !selectedEmployeeId
              ? "Please select a row first by clicking on it"
              : "View employee schedule"
          }
        >
          Employee Schedule
        </button>
      </div>

      {warnings.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No warnings found for this project.
        </div>
      ) : (
        <div
          className="overflow-x-auto overflow-y-auto border-line"
          style={{ maxHeight: "300px" }}
        >
          <table className="min-w-full table">
            <thead className="thead">
              <tr>
                <th className="th-thead">Warning</th>
                <th className="th-thead">ProjId</th>
                <th className="th-thead">EmplId</th>
                <th className="th-thead">Year</th>
                <th className="th-thead">Month</th>
              </tr>
            </thead>
            <tbody className="tbody">
              {warnings.map((warning, index) => (
                <tr
                  key={index}
                  className={`${
                    selectedRowIndex === index
                      ? "bg-blue-100"
                      : "hover:bg-gray-50"
                  } cursor-pointer`}
                  onClick={() => handleEmployeeRowClick(warning.emplId, index)}
                  title="Click to select this employee"
                >
                  <td className="tbody-td text-left">
                    {warning.warning || ""}
                  </td>
                  <td className="tbody-td">{warning.projId || ""}</td>
                  <td className="tbody-td">{warning.emplId || ""}</td>
                  <td className="tbody-td">{warning.year || ""}</td>
                  <td className="tbody-td">
                    {warning.month === 0 ? "All Year" : warning.month || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Warning;
