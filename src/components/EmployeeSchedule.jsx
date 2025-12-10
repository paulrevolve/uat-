// import React, { useEffect, useState, useMemo } from 'react';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { backendUrl } from './config';

// const EmployeeSchedule = ({
//   planId,
//   projectId,
//   status,
//   planType,
//   startDate,
//   endDate,
//   fiscalYear,
//   emplId
// }) => {
//   const [scheduleData, setScheduleData] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Normalize fiscal year
//   const normalizedFiscalYear = fiscalYear === 'All' || !fiscalYear
//     ? 'All'
//     : String(fiscalYear).trim();

//   // Fetch schedule data using the passed emplId
//   useEffect(() => {
//     const fetchScheduleData = async () => {
//       if (!emplId) {
//         setScheduleData(null);
//         return;
//       }

//       setIsLoading(true);
//       setError(null);

//       try {
//         const response = await axios.post(
//           `${backendUrl}/Forecast/GetEmployeeScheduleAsync/${emplId}`
//         );

//         // The response is an object with standardSchedule and projects
//         if (response.data && typeof response.data === 'object') {
//           setScheduleData(response.data);
//         } else {
//           setScheduleData(null);
//         }

//       } catch (err) {
//         setError('Failed to load schedule data');
//         toast.error(
//           `Failed to load schedule data: ${err.response?.data?.message || err.message}`,
//           { toastId: 'schedule-error', autoClose: 3000 }
//         );
//         setScheduleData(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchScheduleData();
//   }, [emplId]);

//   // Extract unique months from standardSchedule and filter by fiscal year
//   const sortedDurations = useMemo(() => {
//     if (!scheduleData?.standardSchedule) return [];

//     const standardSchedule = scheduleData.standardSchedule;

//     return standardSchedule
//       .filter(schedule => {
//         // Filter by fiscal year
//         if (normalizedFiscalYear === 'All') return true;
//         return schedule.year === parseInt(normalizedFiscalYear);
//       })
//       .map(schedule => ({
//         monthNo: schedule.monthNo,
//         year: schedule.year,
//         workingHours: schedule.workingHours || 0,
//         month: schedule.month || ''
//       }))
//       .sort((a, b) => {
//         if (a.year !== b.year) return a.year - b.year;
//         return a.monthNo - b.monthNo;
//       });
//   }, [scheduleData, normalizedFiscalYear]);

//   // Get all projects from the response
//   const allProjects = useMemo(() => {
//     if (!scheduleData?.projects) return [];
//     return scheduleData.projects;
//   }, [scheduleData]);

//   // Get hours for a specific month and project
//   const getMonthHours = (project, duration) => {
//     const schedule = project.schedules.find(
//       s => s.month === duration.monthNo && s.year === duration.year
//     );
//     return schedule ? (schedule.hours || 0) : 0;
//   };

//   // Calculate total hours for a specific project
//   const calculateProjectTotalHours = (project) => {
//     return sortedDurations.reduce((total, duration) => {
//       return total + getMonthHours(project, duration);
//     }, 0);
//   };

//   // Calculate total hours for a specific duration (column total)
//   const calculateDurationTotalHours = (duration) => {
//     return allProjects.reduce((total, project) => {
//       return total + getMonthHours(project, duration);
//     }, 0);
//   };

//   // Format date for display in US format - Fixed to handle UTC dates correctly
//   // const formatDate = (dateString) => {
//   //   if (!dateString) return '-';

//   //   // Parse the date string and add timezone offset to prevent day-off issue
//   //   const date = new Date(dateString);
//   //   const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

//   //   return correctedDate.toLocaleDateString('en-US', {
//   //     year: 'numeric',
//   //     month: 'short',
//   //     day: 'numeric'
//   //   });
//   // };
//   const formatDate = (dateString) => {
//   if (!dateString) return '-';

//   const date = new Date(dateString);
//   const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

//   return correctedDate.toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit'
//   });
// };

//   if (isLoading) {
//     return (
//       <div className="p-4 font-inter flex justify-center items-center">
//         <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
//         <span className="ml-2 text-xs text-gray-600">Loading schedule data...</span>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-4 font-inter">
//         <div className="bg-red-100 border border-red-400 text-red-600 px-4 py-3 rounded">
//           <strong className="font-bold text-xs">Error:</strong>
//           <span className="block text-xs">{error}</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 font-inter">
//       {/* Employee Info Header - Matching ProjectHoursDetail styling */}
//       <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-200">
//         <div className="grid grid-cols-4 gap-4 text-xs">
//           <div>
//             <span className="font-semibold text-gray-700">Employee ID:</span>
//             <div className="mt-1 text-gray-900">{emplId || '-'}</div>
//           </div>
//           <div>
//             <span className="font-semibold text-gray-700">Total Projects:</span>
//             <div className="mt-1 text-gray-900">{allProjects.length}</div>
//           </div>
//           <div>
//             <span className="font-semibold text-gray-700">Start Date:</span>
//             <div className="mt-1 text-gray-900">{formatDate(scheduleData?.startDate)}</div>
//           </div>
//           <div>
//             <span className="font-semibold text-gray-700">End Date:</span>
//             <div className="mt-1 text-gray-900">{formatDate(scheduleData?.endDate)}</div>
//           </div>
//         </div>
//       </div>

//       {/* Employee Schedule Tables */}
//       <div className="border-line">
//         <div className="synchronized-tables-container flex w-full">
//           {/* First Table - Employee Info */}
//           <div className="flex-1" style={{ maxHeight: '400px', overflowY: 'auto' }}>
//             <table className="table-fixed table min-w-full">
//               <thead className="thead sticky top-0 bg-white z-10">
//                 <tr style={{ height: '48px', lineHeight: 'normal' }}>
//                   <th className="th-thead min-w-[150px]">Project ID</th>
//                   <th className="th-thead min-w-[80px]">Source</th>
//                   <th className="th-thead min-w-[70px]">Version</th>
//                   <th className="th-thead min-w-[120px]">Manager</th>
//                   <th className="th-thead min-w-[80px]">Total</th>
//                 </tr>
//               </thead>
//               <tbody className="tbody">
//                 {allProjects.map((project, index) => (
//                   <tr key={project.projId || index} style={{ height: '48px' }}>
//                     <td className="tbody-td text-xs">{project.projId || '-'}</td>
//                     <td className="tbody-td text-xs text-center">
//                       {planType || 'WORKING'}
//                     </td>
//                     <td className="tbody-td text-xs text-center">3</td>
//                     <td className="tbody-td text-xs">{emplId || '-'}</td>
//                     <td className="tbody-td text-xs text-right font-medium">
//                       {calculateProjectTotalHours(project).toFixed(2)}
//                     </td>
//                   </tr>
//                 ))}
//                 {allProjects.length === 0 && (
//                   <tr style={{ height: '48px' }}>
//                     <td colSpan="5" className="tbody-td text-xs text-center text-gray-500">
//                       No projects found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//               <tfoot className="sticky bottom-0 bg-gray-100 z-10">
//                 <tr style={{ height: '48px' }}>
//                   <td colSpan="5" className="th-thead text-xs"></td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>

//           {/* Second Table - Duration Columns */}
//           <div className="flex-1" style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
//             <table className="table-fixed table min-w-full">
//               <thead className="thead sticky top-0 bg-white z-10">
//                 <tr style={{ height: '48px', lineHeight: 'normal' }}>
//                   {sortedDurations.map(duration => {
//                     // Use the month string directly from API if available
//                     const displayDate = duration.month ||
//                       `${new Date(duration.year, duration.monthNo - 1)
//                         .toLocaleDateString('en-US', { month: 'short' })
//                         .toUpperCase()} ${duration.year}`;

//                     return (
//                       <th key={`${duration.monthNo}-${duration.year}`} className="th-thead min-w-[100px]">
//                         <div className="text-xs font-semibold">
//                           {displayDate}
//                         </div>
//                         <div className="text-xs font-normal text-gray-600">
//                           {duration.workingHours} hrs
//                         </div>
//                       </th>
//                     );
//                   })}
//                 </tr>
//               </thead>
//               <tbody className="tbody">
//                 {allProjects.map((project, index) => (
//                   <tr key={project.projId || index} style={{ height: '48px' }}>
//                     {sortedDurations.map(duration => {
//                       const hours = getMonthHours(project, duration);
//                       return (
//                         <td
//                           key={`${project.projId}-${duration.monthNo}-${duration.year}`}
//                           className="tbody-td text-xs text-center"
//                         >
//                           {hours > 0 ? hours.toFixed(2) : '0.00'}
//                         </td>
//                       );
//                     })}
//                   </tr>
//                 ))}
//                 {allProjects.length === 0 && (
//                   <tr style={{ height: '48px' }}>
//                     <td colSpan={sortedDurations.length} className="tbody-td text-xs text-center text-gray-500">
//                       No data available
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//               <tfoot className="sticky bottom-0 bg-gray-100 z-10">
//                 <tr style={{ height: '48px' }}>
//                   {sortedDurations.map(duration => (
//                     <td
//                       key={`total-${duration.monthNo}-${duration.year}`}
//                       className="th-thead text-xs text-center font-bold"
//                     >
//                       {calculateDurationTotalHours(duration).toFixed(2)}
//                     </td>
//                   ))}
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       </div>

//       {sortedDurations.length === 0 && !isLoading && (
//         <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs mt-4">
//           No duration data available for the selected fiscal year.
//         </div>
//       )}
//     </div>
//   );
// };

// export default EmployeeSchedule;

// import React, { useEffect, useState, useMemo } from 'react';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { backendUrl } from './config';

// const EmployeeSchedule = ({
//   planId,
//   projectId,
//   status,
//   planType,
//   startDate,
//   endDate,
//   fiscalYear,
//   emplId
// }) => {
//   const [scheduleData, setScheduleData] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Normalize fiscal year
//   const normalizedFiscalYear = fiscalYear === 'All' || !fiscalYear
//     ? 'All'
//     : String(fiscalYear).trim();

//   // Fetch schedule data using the passed emplId
//   useEffect(() => {
//     const fetchScheduleData = async () => {
//       if (!emplId) {
//         setScheduleData(null);
//         return;
//       }

//       setIsLoading(true);
//       setError(null);

//       try {
//         const response = await axios.post(
//           `${backendUrl}/Forecast/GetEmployeeScheduleAsync/${emplId}`
//         );

//         // The response is an object with standardSchedule and projects
//         if (response.data && typeof response.data === 'object') {
//           setScheduleData(response.data);
//         } else {
//           setScheduleData(null);
//         }

//       } catch (err) {
//         setError('Failed to load schedule data');
//         toast.error(
//           `Failed to load schedule data: ${err.response?.data?.message || err.message}`,
//           { toastId: 'schedule-error', autoClose: 3000 }
//         );
//         setScheduleData(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchScheduleData();
//   }, [emplId]);

//   // Extract unique months from standardSchedule and filter by fiscal year
//   const sortedDurations = useMemo(() => {
//     if (!scheduleData?.standardSchedule) return [];

//     const standardSchedule = scheduleData.standardSchedule;

//     return standardSchedule
//       .filter(schedule => {
//         // Filter by fiscal year
//         if (normalizedFiscalYear === 'All') return true;
//         return schedule.year === parseInt(normalizedFiscalYear);
//       })
//       .map(schedule => ({
//         monthNo: schedule.monthNo,
//         year: schedule.year,
//         workingHours: schedule.workingHours || 0,
//         month: schedule.month || ''
//       }))
//       .sort((a, b) => {
//         if (a.year !== b.year) return a.year - b.year;
//         return a.monthNo - b.monthNo;
//       });
//   }, [scheduleData, normalizedFiscalYear]);

//   // Get all projects from the response
//   const allProjects = useMemo(() => {
//     if (!scheduleData?.projects) return [];
//     return scheduleData.projects;
//   }, [scheduleData]);

//   // Get hours for a specific month and project
//   const getMonthHours = (project, duration) => {
//     const schedule = project.schedules.find(
//       s => s.month === duration.monthNo && s.year === duration.year
//     );
//     return schedule ? (schedule.hours || 0) : 0;
//   };

//   // Calculate total hours for a specific project
//   const calculateProjectTotalHours = (project) => {
//     return sortedDurations.reduce((total, duration) => {
//       return total + getMonthHours(project, duration);
//     }, 0);
//   };

//   // Calculate total hours for a specific duration (column total)
//   const calculateDurationTotalHours = (duration) => {
//     return allProjects.reduce((total, project) => {
//       return total + getMonthHours(project, duration);
//     }, 0);
//   };

//   // Format date for display in US format (MM/DD/YYYY)
//   const formatDate = (dateString) => {
//     if (!dateString) return '-';

//     const date = new Date(dateString);
//     const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

//     return correctedDate.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: '2-digit',
//       day: '2-digit'
//     });
//   };

//   if (isLoading) {
//     return (
//       <div className="p-4 font-inter flex justify-center items-center">
//         <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
//         <span className="ml-2 text-xs text-gray-600">Loading schedule data...</span>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-4 font-inter">
//         <div className="bg-red-100 border border-red-400 text-red-600 px-4 py-3 rounded">
//           <strong className="font-bold text-xs">Error:</strong>
//           <span className="block text-xs">{error}</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 font-inter">
//       {/* Employee Info Header - Matching ProjectHoursDetail styling */}
//       <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-200">
//         <div className="grid grid-cols-4 gap-4 text-xs">
//           <div>
//             <span className="font-semibold text-gray-700">Employee ID:</span>
//             <div className="mt-1 text-gray-900">{emplId || '-'}</div>
//           </div>
//           <div>
//             <span className="font-semibold text-gray-700">Total Projects:</span>
//             <div className="mt-1 text-gray-900">{allProjects.length}</div>
//           </div>
//           <div>
//             <span className="font-semibold text-gray-700">Start Date:</span>
//             <div className="mt-1 text-gray-900">{formatDate(scheduleData?.startDate)}</div>
//           </div>
//           <div>
//             <span className="font-semibold text-gray-700">End Date:</span>
//             <div className="mt-1 text-gray-900">{formatDate(scheduleData?.endDate)}</div>
//           </div>
//         </div>
//       </div>

//       {/* Employee Schedule Tables */}
//       <div className="border-line">
//         <div className="synchronized-tables-container flex w-full">
//           {/* First Table - Employee Info */}
//           <div className="flex-1 hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
//             <table className="table-fixed table min-w-full">
//               <thead className="thead sticky top-0 bg-white z-10">
//                 <tr style={{ height: '48px', lineHeight: 'normal' }}>
//                   <th className="th-thead min-w-[150px]">Project ID</th>
//                   <th className="th-thead min-w-[80px]">Source</th>
//                   <th className="th-thead min-w-[70px]">Version</th>
//                   <th className="th-thead min-w-[120px]">Manager</th>
//                   <th className="th-thead min-w-[80px]">Total</th>
//                 </tr>
//               </thead>
//               <tbody className="tbody">
//                 {allProjects.map((project, index) => (
//                   <tr key={project.projId || index} style={{ height: '48px' }}>
//                     <td className="tbody-td text-xs">{project.projId || '-'}</td>
//                     <td className="tbody-td text-xs text-center">
//                       {project.source || planType || 'WORKING'}
//                     </td>
//                     <td className="tbody-td text-xs text-center">
//                       {project.version || scheduleData?.version || '-'}
//                     </td>
//                     <td className="tbody-td text-xs">{project.manager || emplId || '-'}</td>
//                     <td className="tbody-td text-xs text-right font-medium">
//                       {calculateProjectTotalHours(project).toFixed(2)}
//                     </td>
//                   </tr>
//                 ))}
//                 {allProjects.length === 0 && (
//                   <tr style={{ height: '48px' }}>
//                     <td colSpan="5" className="tbody-td text-xs text-center text-gray-500">
//                       No projects found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//               <tfoot className="sticky bottom-0 bg-gray-100 z-10">
//                 <tr style={{ height: '48px' }}>
//                   <td colSpan="5" className="th-thead text-xs"></td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>

//           {/* Second Table - Duration Columns */}
//           <div className="flex-1 hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
//             <table className="table-fixed table min-w-full">
//               <thead className="thead sticky top-0 bg-white z-10">
//                 <tr style={{ height: '48px', lineHeight: 'normal' }}>
//                   {sortedDurations.map(duration => {
//                     // Use the month string directly from API if available
//                     const displayDate = duration.month ||
//                       `${new Date(duration.year, duration.monthNo - 1)
//                         .toLocaleDateString('en-US', { month: 'short' })
//                         .toUpperCase()} ${duration.year}`;

//                     return (
//                       <th key={`${duration.monthNo}-${duration.year}`} className="th-thead min-w-[100px]">
//                         <div className="text-xs font-semibold">
//                           {displayDate}
//                         </div>
//                         <div className="text-xs font-normal text-gray-600">
//                           {duration.workingHours} hrs
//                         </div>
//                       </th>
//                     );
//                   })}
//                 </tr>
//               </thead>
//               <tbody className="tbody">
//                 {allProjects.map((project, index) => (
//                   <tr key={project.projId || index} style={{ height: '48px' }}>
//                     {sortedDurations.map(duration => {
//                       const hours = getMonthHours(project, duration);
//                       return (
//                         <td
//                           key={`${project.projId}-${duration.monthNo}-${duration.year}`}
//                           className="tbody-td text-xs text-center"
//                         >
//                           {hours > 0 ? hours.toFixed(2) : '0.00'}
//                         </td>
//                       );
//                     })}
//                   </tr>
//                 ))}
//                 {allProjects.length === 0 && (
//                   <tr style={{ height: '48px' }}>
//                     <td colSpan={sortedDurations.length} className="tbody-td text-xs text-center text-gray-500">
//                       No data available
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//               <tfoot className="sticky bottom-0 bg-gray-100 z-10">
//                 <tr style={{ height: '48px' }}>
//                   {sortedDurations.map(duration => (
//                     <td
//                       key={`total-${duration.monthNo}-${duration.year}`}
//                       className="th-thead text-xs text-center font-bold"
//                     >
//                       {calculateDurationTotalHours(duration).toFixed(2)}
//                     </td>
//                   ))}
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       </div>

//       {sortedDurations.length === 0 && !isLoading && (
//         <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs mt-4">
//           No duration data available for the selected fiscal year.
//         </div>
//       )}
//     </div>
//   );
// };

// export default EmployeeSchedule;

// import React, { useEffect, useState, useMemo, useRef } from 'react';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { backendUrl } from './config';

// const EmployeeSchedule = ({
//   planId,
//   projectId,
//   status,
//   planType,
//   startDate,
//   endDate,
//   fiscalYear,
//   emplId,
//   selectedPlan // Add this prop to get version
// }) => {
//   const [scheduleData, setScheduleData] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const lastFetchedEmplId = useRef(null);

//   // Normalize fiscal year
//   const normalizedFiscalYear = fiscalYear === 'All' || !fiscalYear
//     ? 'All'
//     : String(fiscalYear).trim();

//   // Fetch schedule data using the passed emplId

//   // useEffect(() => {
//   //   const fetchScheduleData = async () => {
//   //     if (!emplId) {
//   //       setScheduleData(null);
//   //       return;
//   //     }

//   //     setIsLoading(true);
//   //     setError(null);

//   //     try {
//   //       const response = await axios.post(
//   //         `${backendUrl}/Forecast/GetEmployeeScheduleAsync/${emplId}`
//   //       );

//   //       // The response is an object with standardSchedule and projects
//   //       if (response.data && typeof response.data === 'object') {
//   //         setScheduleData(response.data);
//   //       } else {
//   //         setScheduleData(null);
//   //       }

//   //     } catch (err) {
//   //       setError('Failed to load schedule data');
//   //       toast.error(
//   //         `Failed to load schedule data: ${err.response?.data?.message || err.message}`,
//   //         { toastId: 'schedule-error', autoClose: 3000 }
//   //       );
//   //       setScheduleData(null);
//   //     } finally {
//   //       setIsLoading(false);
//   //     }
//   //   };

//   //   fetchScheduleData();
//   // }, [emplId]);

//    useEffect(() => {
//     const fetchScheduleData = async () => {
//       if (!emplId) {
//         setScheduleData(null);
//         lastFetchedEmplId.current = null;
//         return;
//       }

//       // Prevent duplicate API calls for the same emplId
//       if (lastFetchedEmplId.current === emplId) {
//         return;
//       }

//       setIsLoading(true);
//       setError(null);

//       try {
//         const response = await axios.post(
//           `${backendUrl}/Forecast/GetEmployeeScheduleAsync/${emplId}`
//         );

//         if (response.data && typeof response.data === 'object') {
//           setScheduleData(response.data);
//           lastFetchedEmplId.current = emplId; // Store the fetched ID
//         } else {
//           setScheduleData(null);
//         }

//       } catch (err) {
//         setError('Failed to load schedule data');
//         toast.error(
//           `Failed to load schedule data: ${err.response?.data?.message || err.message}`,
//           { toastId: 'schedule-error', autoClose: 3000 }
//         );
//         setScheduleData(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchScheduleData();
//   }, [emplId]);

//   // Extract unique months from standardSchedule and filter by fiscal year
//   const sortedDurations = useMemo(() => {
//     if (!scheduleData?.standardSchedule) return [];

//     const standardSchedule = scheduleData.standardSchedule;

//     return standardSchedule
//       .filter(schedule => {
//         // Filter by fiscal year
//         if (normalizedFiscalYear === 'All') return true;
//         return schedule.year === parseInt(normalizedFiscalYear);
//       })
//       .map(schedule => ({
//         monthNo: schedule.monthNo,
//         year: schedule.year,
//         workingHours: schedule.workingHours || 0,
//         month: schedule.month || ''
//       }))
//       .sort((a, b) => {
//         if (a.year !== b.year) return a.year - b.year;
//         return a.monthNo - b.monthNo;
//       });
//   }, [scheduleData, normalizedFiscalYear]);

//   // Get all projects from the response
//   const allProjects = useMemo(() => {
//     if (!scheduleData?.projects) return [];
//     return scheduleData.projects;
//   }, [scheduleData]);

//   // Get hours for a specific month and project
//   const getMonthHours = (project, duration) => {
//     const schedule = project.schedules.find(
//       s => s.month === duration.monthNo && s.year === duration.year
//     );
//     return schedule ? (schedule.hours || 0) : 0;
//   };

//   // Calculate total hours for a specific project
//   const calculateProjectTotalHours = (project) => {
//     return sortedDurations.reduce((total, duration) => {
//       return total + getMonthHours(project, duration);
//     }, 0);
//   };

//   // Calculate total hours for a specific duration (column total)
//   const calculateDurationTotalHours = (duration) => {
//     return allProjects.reduce((total, project) => {
//       return total + getMonthHours(project, duration);
//     }, 0);
//   };

//   // Format date for display in US format (MM/DD/YYYY)
//   const formatDate = (dateString) => {
//     if (!dateString) return '-';

//     const date = new Date(dateString);
//     const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

//     return correctedDate.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: '2-digit',
//       day: '2-digit'
//     });
//   };

//   if (isLoading) {
//     return (
//       <div className="p-4 font-inter flex justify-center items-center">
//         <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
//         <span className="ml-2 text-xs text-gray-600">Loading schedule data...</span>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-4 font-inter">
//         <div className="bg-red-100 border border-red-400 text-red-600 px-4 py-3 rounded">
//           <strong className="font-bold text-xs">Error:</strong>
//           <span className="block text-xs">{error}</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 font-inter">
//       {/* Employee Info Header - Matching ProjectHoursDetail styling */}
//       <div className="w-full bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
//         <div className="grid grid-cols-4 gap-6 text-xs">
//           <div>
//             <div className="font-semibold text-gray-700 mb-1">Employee ID:</div>
//             <div className="text-gray-900">{emplId || '-'}</div>
//           </div>
//           <div>
//             <div className="font-semibold text-gray-700 mb-1">Total Projects:</div>
//             <div className="text-gray-900">{allProjects.length}</div>
//           </div>
//           <div>
//             <div className="font-semibold text-gray-700 mb-1">Start Date:</div>
//             <div className="text-gray-900">{formatDate(scheduleData?.startDate)}</div>
//           </div>
//           <div>
//             <div className="font-semibold text-gray-700 mb-1">End Date:</div>
//             <div className="text-gray-900">{formatDate(scheduleData?.endDate)}</div>
//           </div>
//         </div>
//       </div>

//       {/* Employee Schedule Tables */}
//       <div className="border-line">
//         <div className="synchronized-tables-container flex w-full">
//           {/* First Table - Employee Info */}
//           <div className="synchronized-table-scroll hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
//             <table className="table-fixed table min-w-full">
//               <thead className="sticky-thead">
//                 <tr style={{ height: '48px', lineHeight: 'normal' }}>
//                   <th className="th-thead min-w-[150px]">Project ID</th>
//                   <th className="th-thead min-w-[80px]">Source</th>
//                   <th className="th-thead min-w-[70px]">Version</th>
//                   <th className="th-thead min-w-[120px]">Manager</th>
//                   <th className="th-thead min-w-[80px]">Total</th>
//                 </tr>
//               </thead>
//               <tbody className="tbody">
//                 {allProjects.map((project, index) => (
//                   <tr key={project.projId || index} style={{ height: '48px' }}>
//                     <td className="tbody-td text-xs">{project.projId || '-'}</td>
//                     <td className="tbody-td text-xs text-center">
//                       {project.source || planType || 'WORKING'}
//                     </td>
//                     <td className="tbody-td text-xs text-center">
//                       {project.version || scheduleData?.version || selectedPlan?.version || '-'}
//                     </td>
//                     <td className="tbody-td text-xs">{project.manager || emplId || '-'}</td>
//                     <td className="tbody-td text-xs text-right font-medium">
//                       {calculateProjectTotalHours(project).toFixed(2)}
//                     </td>
//                   </tr>
//                 ))}
//                 {allProjects.length === 0 && (
//                   <tr style={{ height: '48px' }}>
//                     <td colSpan="5" className="tbody-td text-xs text-center text-gray-500">
//                       No projects found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//               <tfoot className="sticky bottom-0 bg-gray-50 z-10 border-t-2 border-gray-300">
//                 <tr style={{ height: '48px' }}>
//                   <td colSpan="5" className="th-thead text-xs"></td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>

//           {/* Second Table - Duration Columns */}
//           <div className="synchronized-table-scroll hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
//             <table className="table-fixed table min-w-full">
//               <thead className="sticky-thead">
//                 <tr style={{ height: '48px', lineHeight: 'normal' }}>
//                   {sortedDurations.map(duration => {
//                     // Use the month string directly from API if available
//                     const displayDate = duration.month ||
//                       `${new Date(duration.year, duration.monthNo - 1)
//                         .toLocaleDateString('en-US', { month: 'short' })
//                         .toUpperCase()} ${duration.year}`;

//                     return (
//                       <th key={`${duration.monthNo}-${duration.year}`} className="th-thead min-w-[100px]">
//                         <div className="text-xs font-semibold">
//                           {displayDate}
//                         </div>
//                         <div className="text-xs font-normal text-gray-600">
//                           {duration.workingHours} hrs
//                         </div>
//                       </th>
//                     );
//                   })}
//                 </tr>
//               </thead>
//               <tbody className="tbody">
//                 {allProjects.map((project, index) => (
//                   <tr key={project.projId || index} style={{ height: '48px' }}>
//                     {sortedDurations.map(duration => {
//                       const hours = getMonthHours(project, duration);
//                       return (
//                         <td
//                           key={`${project.projId}-${duration.monthNo}-${duration.year}`}
//                           className="tbody-td text-xs text-center"
//                         >
//                           {hours > 0 ? hours.toFixed(2) : '0.00'}
//                         </td>
//                       );
//                     })}
//                   </tr>
//                 ))}
//                 {allProjects.length === 0 && (
//                   <tr style={{ height: '48px' }}>
//                     <td colSpan={sortedDurations.length} className="tbody-td text-xs text-center text-gray-500">
//                       No data available
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//               <tfoot className="sticky bottom-0 bg-gray-50 z-10 border-t-2 border-gray-300">
//                 <tr style={{ height: '48px' }}>
//                   {sortedDurations.map(duration => (
//                     <td
//                       key={`total-${duration.monthNo}-${duration.year}`}
//                       className="th-thead text-xs text-center font-bold"
//                     >
//                       {calculateDurationTotalHours(duration).toFixed(2)}
//                     </td>
//                   ))}
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       </div>

//       {sortedDurations.length === 0 && !isLoading && (
//         <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs mt-4">
//           No duration data available for the selected fiscal year.
//         </div>
//       )}
//     </div>
//   );
// };

// export default EmployeeSchedule;

import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "./config";

const EmployeeSchedule = ({
  planId,
  projectId,
  status,
  planType,
  startDate,
  endDate,
  fiscalYear,
  emplId,
  selectedPlan,
}) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedEmplId = useRef(null);
  const fetchingRef = useRef(false); // Add this to prevent concurrent calls

  // Normalize fiscal year
  const normalizedFiscalYear =
    fiscalYear === "All" || !fiscalYear ? "All" : String(fiscalYear).trim();

  // Fetch schedule data using the passed emplId
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!emplId) {
        setScheduleData(null);
        lastFetchedEmplId.current = null;
        return;
      }

      // Prevent duplicate API calls for the same emplId
      if (lastFetchedEmplId.current === emplId) {
        return;
      }

      // Prevent concurrent calls
      if (fetchingRef.current) {
        return;
      }

      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post(
          `${backendUrl}/Forecast/GetEmployeeScheduleAsync/${emplId}`
        );

        if (response.data && typeof response.data === "object") {
          setScheduleData(response.data);
          lastFetchedEmplId.current = emplId; // Store the fetched ID
        } else {
          setScheduleData(null);
        }
      } catch (err) {
        setError("Failed to load schedule data");
        toast.error(
          `Failed to load schedule data: ${
            err.response?.data?.message || err.message
          }`,
          { toastId: "schedule-error", autoClose: 3000 }
        );
        setScheduleData(null);
      } finally {
        setIsLoading(false);
        fetchingRef.current = false; // Reset the flag
      }
    };

    fetchScheduleData();
  }, [emplId]);

  // Extract unique months from standardSchedule and filter by fiscal year
  const sortedDurations = useMemo(() => {
    if (!scheduleData?.standardSchedule) return [];

    const standardSchedule = scheduleData.standardSchedule;

    return standardSchedule
      .filter((schedule) => {
        // Filter by fiscal year
        if (normalizedFiscalYear === "All") return true;
        return schedule.year === parseInt(normalizedFiscalYear);
      })
      .map((schedule) => ({
        monthNo: schedule.monthNo,
        year: schedule.year,
        workingHours: schedule.workingHours || 0,
        month: schedule.month || "",
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNo - b.monthNo;
      });
  }, [scheduleData, normalizedFiscalYear]);

  // Get all projects from the response
  const allProjects = useMemo(() => {
    if (!scheduleData?.projects) return [];
    return scheduleData.projects;
  }, [scheduleData]);

  // Get hours for a specific month and project
  const getMonthHours = (project, duration) => {
    const schedule = project.schedules.find(
      (s) => s.month === duration.monthNo && s.year === duration.year
    );
    return schedule ? schedule.hours || 0 : 0;
  };

  // Calculate total hours for a specific project
  const calculateProjectTotalHours = (project) => {
    return sortedDurations.reduce((total, duration) => {
      return total + getMonthHours(project, duration);
    }, 0);
  };

  // Calculate total hours for a specific duration (column total)
  const calculateDurationTotalHours = (duration) => {
    return allProjects.reduce((total, project) => {
      return total + getMonthHours(project, duration);
    }, 0);
  };

  // Format date for display in US format (MM/DD/YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    const correctedDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    );

    return correctedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 font-inter flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-gray-600">
          Loading schedule data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 font-inter">
        <div className="bg-red-100 border border-red-400 text-red-600 px-4 py-3 rounded">
          <strong className="font-bold text-xs">Error:</strong>
          <span className="block text-xs">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 font-inter">
      {/* Employee Info Header - Matching ProjectHoursDetail styling */}
      <div className="w-full bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
        <div className="grid grid-cols-4 gap-6 text-xs">
          <div>
            <div className="font-semibold text-gray-700 mb-1">Employee ID:</div>
            <div className="text-gray-900">{emplId || "-"}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">
              Total Projects:
            </div>
            <div className="text-gray-900">{allProjects.length}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Start Date:</div>
            <div className="text-gray-900">
              {formatDate(scheduleData?.startDate)}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">End Date:</div>
            <div className="text-gray-900">
              {formatDate(scheduleData?.endDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Schedule Tables */}
      <div className="border-line">
        <div className="synchronized-tables-container flex w-full">
          {/* First Table - Employee Info */}
          <div
            className="synchronized-table-scroll hide-scrollbar"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            <table className="table-fixed table min-w-full">
              <thead className="sticky-thead">
                <tr style={{ height: "48px", lineHeight: "normal" }}>
                  <th className="th-thead min-w-[150px]">Project ID</th>
                  <th className="th-thead min-w-[80px]">Source</th>
                  <th className="th-thead min-w-[70px]">Version</th>
                  <th className="th-thead min-w-[120px]">Manager</th>
                  <th className="th-thead min-w-[80px]">Total</th>
                </tr>
              </thead>
              <tbody className="tbody">
                {allProjects.map((project, index) => (
                  <tr key={project.projId || index} style={{ height: "48px" }}>
                    <td className="tbody-td text-xs">
                      {project.projId || "-"}
                    </td>
                    <td className="tbody-td text-xs text-center">
                      {project.source || planType || "WORKING"}
                    </td>
                    <td className="tbody-td text-xs text-center">
                      {project.version ||
                        scheduleData?.version ||
                        selectedPlan?.version ||
                        "-"}
                    </td>
                    <td className="tbody-td text-xs">
                      {project.manager || emplId || "-"}
                    </td>
                    <td className="tbody-td text-xs text-right font-medium">
                      {calculateProjectTotalHours(project).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {allProjects.length === 0 && (
                  <tr style={{ height: "48px" }}>
                    <td
                      colSpan="5"
                      className="tbody-td text-xs text-center text-gray-500"
                    >
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="sticky bottom-0 bg-gray-50 z-10 border-t-2 border-gray-300">
                <tr style={{ height: "48px" }}>
                  <td colSpan="5" className="th-thead text-xs"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Second Table - Duration Columns */}
          <div
            className="synchronized-table-scroll hide-scrollbar"
            style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto" }}
          >
            <table className="table-fixed table min-w-full">
              <thead className="sticky-thead">
                <tr style={{ height: "48px", lineHeight: "normal" }}>
                  {sortedDurations.map((duration) => {
                    // Use the month string directly from API if available
                    const displayDate =
                      duration.month ||
                      `${new Date(duration.year, duration.monthNo - 1)
                        .toLocaleDateString("en-US", { month: "short" })
                        .toUpperCase()} ${duration.year}`;

                    return (
                      <th
                        key={`${duration.monthNo}-${duration.year}`}
                        className="th-thead min-w-[100px]"
                      >
                        <div className="text-xs font-semibold">
                          {displayDate}
                        </div>
                        <div className="text-xs font-normal text-gray-600">
                          {duration.workingHours} hrs
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="tbody">
                {allProjects.map((project, index) => (
                  <tr key={project.projId || index} style={{ height: "48px" }}>
                    {sortedDurations.map((duration) => {
                      const hours = getMonthHours(project, duration);
                      return (
                        <td
                          key={`${project.projId}-${duration.monthNo}-${duration.year}`}
                          className="tbody-td text-xs text-center"
                        >
                          {hours > 0 ? hours.toFixed(2) : "0.00"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {allProjects.length === 0 && (
                  <tr style={{ height: "48px" }}>
                    <td
                      colSpan={sortedDurations.length}
                      className="tbody-td text-xs text-center text-gray-500"
                    >
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="sticky bottom-0 bg-gray-50 z-10 border-t-2 border-gray-300">
                <tr style={{ height: "48px" }}>
                  {sortedDurations.map((duration) => (
                    <td
                      key={`total-${duration.monthNo}-${duration.year}`}
                      className="th-thead text-xs text-center font-bold"
                    >
                      {calculateDurationTotalHours(duration).toFixed(2)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {sortedDurations.length === 0 && !isLoading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs mt-4">
          No duration data available for the selected fiscal year.
        </div>
      )}
    </div>
  );
};

export default EmployeeSchedule;
