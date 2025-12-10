// ProspectiveIDSetup.jsx
// "use client";

// import React, { useState, useCallback } from "react";
// import { FaSave, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
// import { backendUrl } from "./config";

// // Utility function for combining Tailwind CSS classes
// const cn = (...args) => {
//   return args.filter(Boolean).join(" ");
// };

// // Static Data for Employee Tab - ADDED MORE ENTRIES
// const initialEmployeeData = [
//   {
//     id: 1,
//     hourlyRate: "60.00",
//     plc: "DEV001",
//     salary: "120000",
//     homeOrg: "IT_Dev",
//     type: "Employee",
//   },
//   {
//     id: 2,
//     hourlyRate: "75.00",
//     plc: "CONS01",
//     salary: "150000",
//     homeOrg: "Consulting",
//     type: "Vendor Employee",
//   },
//   {
//     id: 3,
//     hourlyRate: "45.00",
//     plc: "SUPP01",
//     salary: "90000",
//     homeOrg: "Support",
//     type: "Generic Staff",
//   },
//   {
//     id: 4,
//     hourlyRate: "80.00",
//     plc: "UXD02",
//     salary: "160000",
//     homeOrg: "Design",
//     type: "Employee",
//   },
//   {
//     id: 5,
//     hourlyRate: "55.00",
//     plc: "QA003",
//     salary: "110000",
//     homeOrg: "Testing",
//     type: "Employee",
//   },
//   {
//     id: 6,
//     hourlyRate: "90.00",
//     plc: "MKT001",
//     salary: "180000",
//     homeOrg: "Marketing",
//     type: "Vendor Employee",
//   },
//   {
//     id: 7,
//     hourlyRate: "62.00",
//     plc: "FIN005",
//     salary: "124000",
//     homeOrg: "Finance",
//     type: "Employee",
//   },
//   {
//     id: 8,
//     hourlyRate: "70.00",
//     plc: "HR002",
//     salary: "140000",
//     homeOrg: "HR_Dept",
//     type: "Generic Staff",
//   },
// ];

// // Static Data for Vendor Tab - ADDED MORE ENTRIES
// const initialVendorData = [
//   { id: 101, vendID: "V001", vendName: "Tech Solutions Inc." },
//   { id: 102, vendID: "V002", vendName: "Global Services Ltd." },
//   { id: 103, vendID: "V003", vendName: "Creative Minds Agency" },
//   { id: 104, vendID: "V004", vendName: "Innovate Systems" },
//   { id: 105, vendID: "V005", vendName: "Precision Tools Co." },
// ];

// // Static Data for PLC Tab - ADDED MORE ENTRIES
// const initialPLCData = [
//   { id: 201, category: "Software Development", hrlyRate: "85.00" },
//   { id: 202, category: "Project Management", hrlyRate: "95.00" },
//   { id: 203, category: "Quality Assurance", hrlyRate: "70.00" },
//   { id: 204, category: "UI/UX Design", hrlyRate: "90.00" },
//   { id: 205, category: "Database Administration", hrlyRate: "88.00" },
//   { id: 206, category: "Network Engineering", hrlyRate: "92.00" },
// ];

// const ProspectiveIDSetup = () => {
//   const [activeTab, setActiveTab] = useState("employee"); // 'employee', 'vendor', 'plc'

//   // --- Employee Tab States ---
//   const [employeeHourlyRate, setEmployeeHourlyRate] = useState("");
//   const [employeePLC, setEmployeePLC] = useState("");
//   const [employeeSalary, setEmployeeSalary] = useState("");
//   const [employeeHomeOrg, setEmployeeHomeOrg] = useState("");
//   const [employeeType, setEmployeeType] = useState(""); // Employee, Vendor Employee, Generic Staff
//   const [employeeData, setEmployeeData] = useState(initialEmployeeData); // Initialized with static data

//   const employeeTypeOptions = [
//     { label: "Select Type", value: "" },
//     { label: "Employee", value: "Employee" },
//     { label: "Vendor Employee", value: "Vendor Employee" },
//     { label: "Generic Staff", value: "Generic Staff" },
//   ];

//   const handleAddEmployee = useCallback(() => {
//     if (
//       !employeeHourlyRate ||
//       !employeePLC ||
//       !employeeSalary ||
//       !employeeHomeOrg ||
//       !employeeType
//     ) {
//       alert("Please fill all fields for Employee data.");
//       return;
//     }
//     const newEmployee = {
//       id: Date.now(), // Simple unique ID
//       hourlyRate: employeeHourlyRate,
//       plc: employeePLC,
//       salary: employeeSalary,
//       homeOrg: employeeHomeOrg,
//       type: employeeType,
//     };
//     setEmployeeData((prevData) => [...prevData, newEmployee]);
//     // Clear fields after adding
//     setEmployeeHourlyRate("");
//     setEmployeePLC("");
//     setEmployeeSalary("");
//     setEmployeeHomeOrg("");
//     setEmployeeType("");
//   }, [
//     employeeHourlyRate,
//     employeePLC,
//     employeeSalary,
//     employeeHomeOrg,
//     employeeType,
//   ]);

//   // --- Vendor Tab States ---
//   const [vendorID, setVendorID] = useState("");
//   const [vendorName, setVendorName] = useState("");
//   const [vendorData, setVendorData] = useState(initialVendorData); // Initialized with static data

//   const handleAddVendor = useCallback(() => {
//     if (!vendorID || !vendorName) {
//       alert("Please fill all fields for Vendor data.");
//       return;
//     }
//     const newVendor = {
//       id: Date.now(), // Simple unique ID
//       vendID: vendorID,
//       vendName: vendorName,
//     };
//     setVendorData((prevData) => [...prevData, newVendor]);
//     // Clear fields after adding
//     setVendorID("");
//     setVendorName("");
//   }, [vendorID, vendorName]);

//   // --- PLC Tab States ---
//   const [plcCategory, setPlcCategory] = useState("");
//   const [plcHrlyRate, setPlcHrlyRate] = useState("");
//   const [plcData, setPlcData] = useState(initialPLCData); // Initialized with static data

//   const handleAddPLC = useCallback(() => {
//     if (!plcCategory || !plcHrlyRate) {
//       alert("Please fill all fields for PLC data.");
//       return;
//     }
//     const newPLC = {
//       id: Date.now(), // Simple unique ID
//       category: plcCategory,
//       hrlyRate: plcHrlyRate,
//     };
//     setPlcData((prevData) => [...prevData, newPLC]);
//     // Clear fields after adding
//     setPlcCategory("");
//     setPlcHrlyRate("");
//   }, [plcCategory, plcHrlyRate]);

//   // Generic numeric input handler
//   const handleNumericInput = (setter) => (e) => {
//     const value = e.target.value;
//     const regex = /^[0-9]*(\.[0-9]*)?$/; // Allows empty, integers, or decimals
//     if (value === "" || regex.test(value)) {
//       setter(value);
//     }
//   };

//   // --- Save All Data (Console Log for now) ---
//   const handleSaveAll = useCallback(() => {
//     // console.log('Saving all Prospective ID Setup Data:');
//     // console.log('Employee Data:', employeeData);
//     // console.log('Vendor Data:', vendorData);
//     // console.log('PLC Data:', plcData);
//     alert("All Prospective ID Setup data saved (console logged)!");
//     // In a real application, you would send this data to your backend API endpoints.
//   }, [employeeData, vendorData, plcData]);

//   return (
//     <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-center p-4">
//       {/* Adjusted max-w-7xl to w-full px-8 for wider display within its parent */}
//       <div className="w-full px-8 bg-white rounded-xl shadow-lg p-8 space-y-6 border border-gray-300">
//         {/* Header with Save Button */}
//         <div className="flex justify-between items-center gap-2 mb-6">
//           <h2 className="w-full  bg-green-50 border-l-4 border-green-400 p-3 rounded-lg shadow-sm mb-4">
//             Prospective ID Setup
//           </h2>
//           <button
//             onClick={handleSaveAll}
//             className="bg-blue-600 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs py-1.5 px-3 -mt-4 shadow-sm hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Save All
//           </button>
//         </div>

//         {/* Tab Navigation */}
//         <div className="flex border-b border-gray-200 mb-6">
//           <button
//             className={cn(
//               "py-2 px-4 text-lg font-medium focus:outline-none",
//               activeTab === "employee"
//                 ? "border-b-2 border-blue-600 text-blue-600"
//                 : "text-gray-600 hover:text-blue-600"
//             )}
//             onClick={() => setActiveTab("employee")}
//           >
//             Employee
//           </button>
//           <button
//             className={cn(
//               "py-2 px-4 text-lg font-medium focus:outline-none",
//               activeTab === "vendor"
//                 ? "border-b-2 border-blue-600 text-blue-600"
//                 : "text-gray-600 hover:text-blue-600"
//             )}
//             onClick={() => setActiveTab("vendor")}
//           >
//             Vendor
//           </button>
//           <button
//             className={cn(
//               "py-2 px-4 text-lg font-medium focus:outline-none",
//               activeTab === "plc"
//                 ? "border-b-2 border-blue-600 text-blue-600"
//                 : "text-gray-600 hover:text-blue-600"
//             )}
//             onClick={() => setActiveTab("plc")}
//           >
//             PLC
//           </button>
//         </div>

//         {/* Tab Content */}
//         <div className="bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-200">
//           {activeTab === "employee" && (
//             <div className="space-y-6">
//               <h3 className="text-xl font-semibold mb-4 text-gray-800">
//                 Employee Data Entry
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
//                 <div>
//                   <label
//                     htmlFor="hourlyRate"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Hourly Rate
//                   </label>
//                   <input
//                     id="hourlyRate"
//                     type="text"
//                     value={employeeHourlyRate}
//                     onChange={handleNumericInput(setEmployeeHourlyRate)}
//                     className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="e.g., 50.00"
//                   />
//                 </div>
//                 <div>
//                   <label
//                     htmlFor="plc"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     PLC
//                   </label>
//                   <input
//                     id="plc"
//                     type="text"
//                     value={employeePLC}
//                     onChange={(e) => setEmployeePLC(e.target.value)}
//                     className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="e.g., PL001"
//                   />
//                 </div>
//                 <div>
//                   <label
//                     htmlFor="salary"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Salary{" "}
//                   </label>
//                   <input
//                     id="salary"
//                     type="text"
//                     value={employeeSalary}
//                     onChange={handleNumericInput(setEmployeeSalary)}
//                     className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="e.g., 100000"
//                   />
//                 </div>
//                 <div>
//                   <label
//                     htmlFor="homeOrg"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Home Org
//                   </label>
//                   <input
//                     id="homeOrg"
//                     type="text"
//                     value={employeeHomeOrg}
//                     onChange={(e) => setEmployeeHomeOrg(e.target.value)}
//                     className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="e.g., HRDept"
//                   />
//                 </div>
//                 <div>
//                   <label
//                     htmlFor="employeeType"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Type
//                   </label>
//                   <select
//                     id="employeeType"
//                     value={employeeType}
//                     onChange={(e) => setEmployeeType(e.target.value)}
//                     className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   >
//                     {employeeTypeOptions.map((option) => (
//                       <option key={option.value} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//               <div className="flex justify-end">
//                 <button
//                   onClick={handleAddEmployee}
//                   className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
//                 >
//                   Add Employee
//                 </button>
//               </div>

//               <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-800">
//                 All Employees
//               </h3>
//               <div className="overflow-x-auto rounded-lg border border-gray-300">
//                 <table className="min-w-full divide-y divide-gray-300">
//                   <thead className="bg-gray-200">
//                     <tr>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
//                       >
//                         Hourly Rate ($)
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
//                       >
//                         PLC
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
//                       >
//                         Salary ($)
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
//                       >
//                         Home Org
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
//                       >
//                         Type
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {employeeData.length === 0 ? (
//                       <tr>
//                         <td
//                           colSpan="5"
//                           className="px-6 py-4 text-center text-sm text-gray-500"
//                         >
//                           No employee data added yet.
//                         </td>
//                       </tr>
//                     ) : (
//                       employeeData.map((employee) => (
//                         <tr key={employee.id}>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                             {employee.hourlyRate}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
//                             {employee.plc}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
//                             {employee.salary}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
//                             {employee.homeOrg}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
//                             {employee.type}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
//                             <button
//                               className="text-green-700 hover:text-green-800"
//                               title="Save"
//                               style={{ background: "none", border: "none" }}
//                             >
//                               {" "}
//                               <FaSave size={18} />
//                             </button>
//                             <button
//                               className="text-gray-500 hover:text-gray-700"
//                               title="Cancel"
//                               style={{ background: "none", border: "none" }}
//                             >
//                               {" "}
//                               <FaTimes size={18} />
//                             </button>
//                             <button
//                               className="text-gray-400 hover:text-gray-800"
//                               title="Delete"
//                               style={{ background: "none", border: "none" }}
//                             >
//                               <FaTrash size={18} />
//                             </button>
//                             <button
//                               className="text-blue-400 hover:text-blue-700"
//                               title="Delete"
//                               style={{ background: "none", border: "none" }}
//                             >
//                               <FaEdit size={18} />
//                             </button>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {activeTab === "vendor" && (
//             <div className="space-y-6">
//               <h3 className="text-xl font-semibold mb-4 text-gray-800">
//                 Vendor Data Entry
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label
//                     htmlFor="vendID"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Vend ID
//                   </label>
//                   <input
//                     id="vendID"
//                     type="text"
//                     value={vendorID}
//                     onChange={(e) => setVendorID(e.target.value)}
//                     className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="e.g., V001"
//                   />
//                 </div>
//                 <div>
//                   <label
//                     htmlFor="vendName"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Vend Name
//                   </label>
//                   <input
//                     id="vendName"
//                     type="text"
//                     value={vendorName}
//                     onChange={(e) => setVendorName(e.target.value)}
//                     className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="e.g., Supplier XYZ"
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end">
//                 <button
//                   onClick={handleAddVendor}
//                   className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
//                 >
//                   Add Vendor
//                 </button>
//               </div>

//               <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-800">
//                 All Vendors
//               </h3>
//               <div className="overflow-x-auto rounded-lg border border-gray-300">
//                 <table className="min-w-full divide-y divide-gray-300">
//                   <thead className="bg-gray-200">
//                     <tr>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
//                       >
//                         Vend ID
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
//                       >
//                         Vend Name
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {vendorData.length === 0 ? (
//                       <tr>
//                         <td
//                           colSpan="2"
//                           className="px-6 py-4 text-center text-sm text-gray-500"
//                         >
//                           No vendor data added yet.
//                         </td>
//                       </tr>
//                     ) : (
//                       vendorData.map((vendor) => (
//                         <tr key={vendor.id}>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                             {vendor.vendID}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
//                             {vendor.vendName}
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {activeTab === "plc" && (
//             <div className="space-y-6">
//               <h3 className="text-xl font-semibold mb-4 text-gray-800">
//                 PLC Data Entry
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label
//                     htmlFor="plcCategory"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Category
//                   </label>
//                   <input
//                     id="plcCategory"
//                     type="text"
//                     value={plcCategory}
//                     onChange={(e) => setPlcCategory(e.target.value)}
//                     className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="e.g., Software Dev"
//                   />
//                 </div>
//                 <div>
//                   <label
//                     htmlFor="plcHrlyRate"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Hrly Rate
//                   </label>
//                   <input
//                     id="plcHrlyRate"
//                     type="text"
//                     value={plcHrlyRate}
//                     onChange={handleNumericInput(setPlcHrlyRate)}
//                     className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="e.g., 75.00"
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end">
//                 <button
//                   onClick={handleAddPLC}
//                   className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
//                 >
//                   Add PLC
//                 </button>
//               </div>

//               <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-800">
//                 All PLCs
//               </h3>
//               <div className="overflow-x-auto rounded-lg border border-gray-300">
//                 <table className="min-w-full divide-y divide-gray-300">
//                   <thead className="bg-gray-200">
//                     <tr>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
//                       >
//                         Category
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
//                       >
//                         Hrly Rate
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {plcData.length === 0 ? (
//                       <tr>
//                         <td
//                           colSpan="2"
//                           className="px-6 py-4 text-center text-sm text-gray-500"
//                         >
//                           No PLC data added yet.
//                         </td>
//                       </tr>
//                     ) : (
//                       plcData.map((plc) => (
//                         <tr key={plc.id}>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                             {plc.category}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
//                             {plc.hrlyRate}
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProspectiveIDSetup;

import React, { useState, useCallback, useEffect } from "react";
import { FaSave, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Utility function for combining Tailwind CSS classes
const cn = (...args) => {
  return args.filter(Boolean).join(" ");
};

// Static Data for Employee Tab - ADDED MORE ENTRIES
const initialEmployeeData = [
  {
    id: 1,
    hourlyRate: "60.00",
    plc: "DEV001",
    salary: "120000",
    homeOrg: "IT_Dev",
    type: "Employee",
  },
  {
    id: 2,
    hourlyRate: "75.00",
    plc: "CONS01",
    salary: "150000",
    homeOrg: "Consulting",
    type: "Vendor Employee",
  },
  {
    id: 3,
    hourlyRate: "45.00",
    plc: "SUPP01",
    salary: "90000",
    homeOrg: "Support",
    type: "Generic Staff",
  },
  {
    id: 4,
    hourlyRate: "80.00",
    plc: "UXD02",
    salary: "160000",
    homeOrg: "Design",
    type: "Employee",
  },
  {
    id: 5,
    hourlyRate: "55.00",
    plc: "QA003",
    salary: "110000",
    homeOrg: "Testing",
    type: "Employee",
  },
  {
    id: 6,
    hourlyRate: "90.00",
    plc: "MKT001",
    salary: "180000",
    homeOrg: "Marketing",
    type: "Vendor Employee",
  },
  {
    id: 7,
    hourlyRate: "62.00",
    plc: "FIN005",
    salary: "124000",
    homeOrg: "Finance",
    type: "Employee",
  },
  {
    id: 8,
    hourlyRate: "70.00",
    plc: "HR002",
    salary: "140000",
    homeOrg: "HR_Dept",
    type: "Generic Staff",
  },
];

// Static Data for Vendor Tab - ADDED MORE ENTRIES
const initialVendorData = [
  { id: 101, vendID: "V001", vendName: "Tech Solutions Inc." },
  { id: 102, vendID: "V002", vendName: "Global Services Ltd." },
  { id: 103, vendID: "V003", vendName: "Creative Minds Agency" },
  { id: 104, vendID: "V004", vendName: "Innovate Systems" },
  { id: 105, vendID: "V005", vendName: "Precision Tools Co." },
];

// Static Data for PLC Tab - ADDED MORE ENTRIES
const initialPLCData = [
  { id: 201, category: "Software Development", hrlyRate: "85.00" },
  { id: 202, category: "Project Management", hrlyRate: "95.00" },
  { id: 203, category: "Quality Assurance", hrlyRate: "70.00" },
  { id: 204, category: "UI/UX Design", hrlyRate: "90.00" },
  { id: 205, category: "Database Administration", hrlyRate: "88.00" },
  { id: 206, category: "Network Engineering", hrlyRate: "92.00" },
];

const ProspectiveIDSetup = () => {
  const [activeTab, setActiveTab] = useState("employee");

  // --- Employee States ---
  const [employeeHourlyRate, setEmployeeHourlyRate] = useState("");
  const [employeePLC, setEmployeePLC] = useState("");
  const [employeeSalary, setEmployeeSalary] = useState("");
  const [employeeHomeOrg, setEmployeeHomeOrg] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [employeeData, setEmployeeData] = useState(() => {
    const saved = localStorage.getItem("employeeData");
    return saved ? JSON.parse(saved) : initialEmployeeData;
  });
  const [employeeEditingId, setEmployeeEditingId] = useState(null);
  const [employeeEditRow, setEmployeeEditRow] = useState({});

  const employeeTypeOptions = [
    { label: "Select Type", value: "" },
    { label: "Employee", value: "Employee" },
    { label: "Vendor Employee", value: "Vendor Employee" },
    { label: "Generic Staff", value: "Generic Staff" },
  ];

  // --- Vendor States ---
  const [vendorID, setVendorID] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorData, setVendorData] = useState(() => {
    const saved = localStorage.getItem("vendorData");
    return saved ? JSON.parse(saved) : initialVendorData;
  });
  const [vendorEditingId, setVendorEditingId] = useState(null);
  const [vendorEditRow, setVendorEditRow] = useState({});

  // --- PLC States ---
  const [plcCategory, setPlcCategory] = useState("");
  const [plcHrlyRate, setPlcHrlyRate] = useState("");
  const [plcData, setPlcData] = useState(() => {
    const saved = localStorage.getItem("plcData");
    return saved ? JSON.parse(saved) : initialPLCData;
  });
  const [plcEditingId, setPlcEditingId] = useState(null);
  const [plcEditRow, setPlcEditRow] = useState({});

  // --- Common Handlers ---

  const handleNumericInput = (setter) => (e) => {
    const value = e.target.value;
    const regex = /^[0-9]*(\.[0-9]*)?$/;
    if (value === "" || regex.test(value)) {
      setter(value);
    }
  };

  // --- Employee Handlers ---

  const handleAddEmployee = useCallback(() => {
    if (
      !employeeHourlyRate ||
      !employeePLC ||
      !employeeSalary ||
      !employeeHomeOrg ||
      !employeeType
    ) {
      alert("Please fill all fields for Employee data.");
      return;
    }
    const newEmployee = {
      id: Date.now(),
      hourlyRate: employeeHourlyRate,
      plc: employeePLC,
      salary: employeeSalary,
      homeOrg: employeeHomeOrg,
      type: employeeType,
    };
    setEmployeeData((prev) => [...prev, newEmployee]);
    setEmployeeHourlyRate("");
    setEmployeePLC("");
    setEmployeeSalary("");
    setEmployeeHomeOrg("");
    setEmployeeType("");
    toast.success("Employee data added!");
  }, [
    employeeHourlyRate,
    employeePLC,
    employeeSalary,
    employeeHomeOrg,
    employeeType,
  ]);

  const handleEmployeeEdit = (row) => {
    setEmployeeEditingId(row.id);
    setEmployeeEditRow(row);
  };

  const handleEmployeeEditChange = (e) => {
    const { name, value } = e.target;
    setEmployeeEditRow((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmployeeSave = () => {
    setEmployeeData((prev) =>
      prev.map((row) => (row.id === employeeEditingId ? employeeEditRow : row))
    );
    setEmployeeEditingId(null);
    setEmployeeEditRow({});
    toast.success("Employee updated");
  };

  const handleEmployeeCancel = () => {
    setEmployeeEditingId(null);
    setEmployeeEditRow({});
  };

  const handleEmployeeDelete = (id) => {
    setEmployeeData((prev) => prev.filter((row) => row.id !== id));
    if (employeeEditingId === id) {
      setEmployeeEditingId(null);
      setEmployeeEditRow({});
    }
    toast.success("Employee deleted!");
  };

  // --- Vendor Handlers ---

  const handleAddVendor = useCallback(() => {
    if (!vendorID || !vendorName) {
      alert("Please fill all fields for Vendor data.");
      return;
    }
    const newVendor = {
      id: Date.now(),
      vendID: vendorID,
      vendName: vendorName,
    };
    setVendorData((prev) => [...prev, newVendor]);
    setVendorID("");
    setVendorName("");
    toast.success("Vendor added!");
  }, [vendorID, vendorName]);

  const handleVendorEdit = (row) => {
    setVendorEditingId(row.id);
    setVendorEditRow(row);
  };

  const handleVendorEditChange = (e) => {
    const { name, value } = e.target;
    setVendorEditRow((prev) => ({ ...prev, [name]: value }));
  };

  const handleVendorSave = () => {
    setVendorData((prev) =>
      prev.map((row) => (row.id === vendorEditingId ? vendorEditRow : row))
    );
    setVendorEditingId(null);
    setVendorEditRow({});
    toast.success("Vendor updated!");
  };

  const handleVendorCancel = () => {
    setVendorEditingId(null);
    setVendorEditRow({});
  };

  const handleVendorDelete = (id) => {
    setVendorData((prev) => prev.filter((row) => row.id !== id));
    if (vendorEditingId === id) {
      setVendorEditingId(null);
      setVendorEditRow({});
    }
    toast.success("Vendor deleted!");
  };

  // --- PLC Handlers ---

  const handleAddPLC = useCallback(() => {
    if (!plcCategory || !plcHrlyRate) {
      alert("Please fill all fields for PLC data.");
      return;
    }
    const newPLC = {
      id: Date.now(),
      category: plcCategory,
      hrlyRate: plcHrlyRate,
    };
    setPlcData((prev) => [...prev, newPLC]);
    setPlcCategory("");
    setPlcHrlyRate("");
    toast.success("PLC added!");
  }, [plcCategory, plcHrlyRate]);

  const handlePlcEdit = (row) => {
    setPlcEditingId(row.id);
    setPlcEditRow(row);
  };

  const handlePlcEditChange = (e) => {
    const { name, value } = e.target;
    setPlcEditRow((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlcSave = () => {
    setPlcData((prev) =>
      prev.map((row) => (row.id === plcEditingId ? plcEditRow : row))
    );
    setPlcEditingId(null);
    setPlcEditRow({});
    toast.success("PLC Updated!");
  };

  const handlePlcCancel = () => {
    setPlcEditingId(null);
    setPlcEditRow({});
  };

  const handlePlcDelete = (id) => {
    setPlcData((prev) => prev.filter((row) => row.id !== id));
    if (plcEditingId === id) {
      setPlcEditingId(null);
      setPlcEditRow({});
    }
    toast.success("PLC deleted!");
  };

  // --- Save All Data ---

  const handleSaveAll = () => {
    toast.success("All data saved (console logged)!");
    // console.log("Employee Data:", employeeData);
    // console.log("Vendor Data:", vendorData);
    // console.log("PLC Data:", plcData);
  };

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem("employeeData", JSON.stringify(employeeData));
  }, [employeeData]);

  useEffect(() => {
    localStorage.setItem("vendorData", JSON.stringify(vendorData));
  }, [vendorData]);

  useEffect(() => {
    localStorage.setItem("plcData", JSON.stringify(plcData));
  }, [plcData]);

  return (
    <>
      <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full px-8 bg-white rounded-xl shadow-lg p-8 space-y-6 border border-gray-300">
          {/* Header */}
          <div className="flex justify-between items-center gap-2 mb-6">
            <h2 className="w-full bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
              Prospective ID Setup
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {["employee", "vendor", "plc"].map((tab) => (
              <button
                key={tab}
                className={cn(
                  "py-2 px-4 text-lg font-medium focus:outline-none",
                  activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                )}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-200">
            {/* Employee Tab */}
            {activeTab === "employee" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Employee Data Entry
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label
                      htmlFor="hourlyRate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Hourly Rate
                    </label>
                    <input
                      id="hourlyRate"
                      type="text"
                      value={employeeHourlyRate}
                      onChange={handleNumericInput(setEmployeeHourlyRate)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 50.00"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="plc"
                      className="block text-sm font-medium text-gray-700"
                    >
                      PLC
                    </label>
                    <input
                      id="plc"
                      type="text"
                      value={employeePLC}
                      onChange={(e) => setEmployeePLC(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., PL001"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="salary"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Salary{" "}
                    </label>
                    <input
                      id="salary"
                      type="text"
                      value={employeeSalary}
                      onChange={handleNumericInput(setEmployeeSalary)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 100000"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="homeOrg"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Home Org
                    </label>
                    <input
                      id="homeOrg"
                      type="text"
                      value={employeeHomeOrg}
                      onChange={(e) => setEmployeeHomeOrg(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., HRDept"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="employeeType"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Type
                    </label>
                    <select
                      id="employeeType"
                      value={employeeType}
                      onChange={(e) => setEmployeeType(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {employeeTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddEmployee}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Add Employee
                  </button>
                </div>

                <div className="flex items-center justify-between mt-8 mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    All Employees
                  </h3>
                  <button
                    onClick={handleSaveAll}
                    className="bg-blue-600 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs py-2 px-4 shadow-sm hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save All
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-300">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Hourly Rate ($)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          PLC
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Salary ($)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Home Org
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employeeData.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No employee data added yet.
                          </td>
                        </tr>
                      ) : (
                        employeeData.map((row) =>
                          employeeEditingId === row.id ? (
                            <tr key={row.id} className="bg-yellow-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <input
                                  name="hourlyRate"
                                  value={employeeEditRow.hourlyRate || ""}
                                  onChange={handleEmployeeEditChange}
                                  className="w-20 px-1 border rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                <input
                                  name="plc"
                                  value={employeeEditRow.plc || ""}
                                  onChange={handleEmployeeEditChange}
                                  className="w-20 px-1 border rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                <input
                                  name="salary"
                                  value={employeeEditRow.salary || ""}
                                  onChange={handleEmployeeEditChange}
                                  className="w-24 px-1 border rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                <input
                                  name="homeOrg"
                                  value={employeeEditRow.homeOrg || ""}
                                  onChange={handleEmployeeEditChange}
                                  className="w-20 px-1 border rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                <select
                                  name="type"
                                  value={employeeEditRow.type || ""}
                                  onChange={handleEmployeeEditChange}
                                  className="w-28 px-1 border rounded"
                                >
                                  {employeeTypeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex gap-2">
                                <button
                                  onClick={handleEmployeeSave}
                                  title="Save"
                                  className="text-green-700 hover:text-green-800"
                                >
                                  <FaSave size={18} />
                                </button>
                                <button
                                  onClick={handleEmployeeCancel}
                                  title="Cancel"
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <FaTimes size={18} />
                                </button>
                              </td>
                            </tr>
                          ) : (
                            <tr key={row.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {row.hourlyRate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {row.plc}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {row.salary}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {row.homeOrg}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {row.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex gap-2">
                                <button
                                  onClick={() => handleEmployeeEdit(row)}
                                  title="Edit"
                                  className="text-blue-400 hover:text-blue-700"
                                >
                                  <FaEdit size={18} />
                                </button>
                                <button
                                  onClick={() => handleEmployeeDelete(row.id)}
                                  title="Delete"
                                  className="text-gray-400 hover:text-gray-800"
                                >
                                  <FaTrash size={18} />
                                </button>
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Vendor Tab */}
            {activeTab === "vendor" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Vendor Data Entry
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="vendID"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Vend ID
                    </label>
                    <input
                      id="vendID"
                      type="text"
                      value={vendorID}
                      onChange={(e) => setVendorID(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., V001"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="vendName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Vend Name
                    </label>
                    <input
                      id="vendName"
                      type="text"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Supplier XYZ"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddVendor}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Add Vendor
                  </button>
                </div>

                <div className="flex items-center justify-between mt-8 mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    All Vendors
                  </h3>
                  <button
                    onClick={handleSaveAll}
                    className="bg-blue-600 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs py-2 px-4 shadow-sm hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save All
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-300">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Vend ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Vend Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendorData.length === 0 ? (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No vendor data added yet.
                          </td>
                        </tr>
                      ) : (
                        vendorData.map((row) =>
                          vendorEditingId === row.id ? (
                            <tr key={row.id} className="bg-yellow-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <input
                                  name="vendID"
                                  value={vendorEditRow.vendID || ""}
                                  onChange={handleVendorEditChange}
                                  className="w-24 px-1 border rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                <input
                                  name="vendName"
                                  value={vendorEditRow.vendName || ""}
                                  onChange={handleVendorEditChange}
                                  className="w-48 px-1 border rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex gap-2">
                                <button
                                  onClick={handleVendorSave}
                                  title="Save"
                                  className="text-green-700 hover:text-green-800"
                                >
                                  <FaSave size={18} />
                                </button>
                                <button
                                  onClick={handleVendorCancel}
                                  title="Cancel"
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <FaTimes size={18} />
                                </button>
                              </td>
                            </tr>
                          ) : (
                            <tr key={row.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {row.vendID}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {row.vendName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex gap-2">
                                <button
                                  onClick={() => handleVendorEdit(row)}
                                  title="Edit"
                                  className="text-blue-400 hover:text-blue-700"
                                >
                                  <FaEdit size={18} />
                                </button>
                                <button
                                  onClick={() => handleVendorDelete(row.id)}
                                  title="Delete"
                                  className="text-gray-400 hover:text-gray-800"
                                >
                                  <FaTrash size={18} />
                                </button>
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PLC Tab */}
            {activeTab === "plc" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  PLC Data Entry
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="plcCategory"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Category
                    </label>
                    <input
                      id="plcCategory"
                      type="text"
                      value={plcCategory}
                      onChange={(e) => setPlcCategory(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Software Dev"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="plcHrlyRate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Hrly Rate
                    </label>
                    <input
                      id="plcHrlyRate"
                      type="text"
                      value={plcHrlyRate}
                      onChange={handleNumericInput(setPlcHrlyRate)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 75.00"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddPLC}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Add PLC
                  </button>
                </div>

                <div className="flex items-center justify-between mt-8 mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    All PLCs
                  </h3>
                  <button
                    onClick={handleSaveAll}
                    className="bg-blue-600 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs py-2 px-4 shadow-sm hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save All
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-300">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Hrly Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plcData.length === 0 ? (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No PLC data added yet.
                          </td>
                        </tr>
                      ) : (
                        plcData.map((row) =>
                          plcEditingId === row.id ? (
                            <tr key={row.id} className="bg-yellow-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <input
                                  name="category"
                                  value={plcEditRow.category || ""}
                                  onChange={handlePlcEditChange}
                                  className="w-48 px-1 border rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                <input
                                  name="hrlyRate"
                                  value={plcEditRow.hrlyRate || ""}
                                  onChange={handlePlcEditChange}
                                  className="w-24 px-1 border rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex gap-2">
                                <button
                                  onClick={handlePlcSave}
                                  title="Save"
                                  className="text-green-700 hover:text-green-800"
                                >
                                  <FaSave size={18} />
                                </button>
                                <button
                                  onClick={handlePlcCancel}
                                  title="Cancel"
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <FaTimes size={18} />
                                </button>
                              </td>
                            </tr>
                          ) : (
                            <tr key={row.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {row.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {row.hrlyRate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex gap-2">
                                <button
                                  onClick={() => handlePlcEdit(row)}
                                  title="Edit"
                                  className="text-blue-400 hover:text-blue-700"
                                >
                                  <FaEdit size={18} />
                                </button>
                                <button
                                  onClick={() => handlePlcDelete(row.id)}
                                  title="Delete"
                                  className="text-gray-400 hover:text-gray-800"
                                >
                                  <FaTrash size={18} />
                                </button>
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProspectiveIDSetup;
