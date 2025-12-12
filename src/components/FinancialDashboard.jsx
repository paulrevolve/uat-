
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// "use client";
// import { useState, useEffect, useMemo, useCallback } from "react";
// import React from "react";
// import { Bar, Doughnut } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";
// // import { backendUrl } from "./config"; // API logic disabled for testing
// import html2canvas from 'html2canvas'; 
// import { jsPDF } from 'jspdf';         
// import { FaFilePdf, FaFileExcel } from 'react-icons/fa'; 
// import ForecastReport from "./ForecastReport";
// import SpendChart from "./SpendChart"; 
// import UtilizationChart from "./UtilizationChart"; 

// // Register Chart.js components required for all charts
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend
// );

// // --- API RESPONSE TRANSFORMATION FUNCTIONS (Disabled) ---
// function transformApiResponseToRevenueAnalysisRows(apiResponse) { return []; }
// // --- END API RESPONSE TRANSFORMATION FUNCTIONS ---


// // MOCK DATA and HEADERS for Exporting Forecast Report Data 
// const MOCK_TIME_PERIODS_EXPORT = [
//     'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'FY-25 Total'
// ];

// // Helper ensures raw numbers are used for CSV/XLSX export
// const createExportFinancials = (baseValue) => {
//     const financials = {};
//     let runningTotal = 0;
//     MOCK_TIME_PERIODS_EXPORT.forEach((period, i) => {
//         if (!period.includes('Total')) {
//             const value = baseValue + i * 5000;
//             // Store as unformatted number
//             financials[period] = value; 
//             runningTotal += value;
//         }
//     });
//     financials['FY-25 Total'] = runningTotal;
//     return financials;
// };

// // Ensure this array uses the numerical data generated above
// const MOCK_FORECAST_EXPORT_DATA = [
//     { Project: '22001.01.01', 'Project Name': 'USAF Labor Contract', Org: '1.01.01', 'Account ID': '500-001', 'Account Name': 'Direct Labor', 'POP Start Date': '2025-01-01', 'POP End Date': '2025-12-31', ...createExportFinancials(50000) },
//     { Project: '22001.02.01', 'Project Name': 'NASA Research Grant', Org: '1.02.01', 'Account ID': '500-002', 'Account Name': 'Travel Expenses', 'POP Start Date': '2025-03-01', 'POP End Date': '2026-03-31', ...createExportFinancials(20000) },
// ];
// const MOCK_FORECAST_HEADERS = 'Project,Project Name,Org,Account ID,Account Name,POP Start Date,POP End Date,' + MOCK_TIME_PERIODS_EXPORT.join(',');


// // --- FINANCIAL DASHBOARD COMPONENT ---
// const FinancialDashboard = ({ planId, templateId, type }) => {
//   const [loading, setLoading] = useState(false); 
//   const [error, setError] = useState(null);
//   const [fullApiResponse, setFullApiResponse] = useState(null); 
//   const [processedData, setProcessedData] = useState([]);
//   const [revenueChartData, setRevenueChartData] = useState(null);
//   const [plcPieChartData, setPlcPieChartData] = useState(null);

//   const [selectedPlc, setSelectedPlc] = useState("all");
//   const [selectedEmployee, setSelectedEmployee] = useState("all");
//   const [activeTab, setActiveTab] = useState('forecast'); 

//   const plcOptions = useMemo(() => {
//     return ["all", ...processedData.map((p) => p.plcName)];
//   }, [processedData]);

//   const employeeOptions = useMemo(() => {
//     const allEmployees = new Map();
//     processedData.forEach((plc) => {
//       plc.employees.forEach((emp) => {
//         if (!allEmployees.has(emp.emplId)) {
//           allEmployees.set(emp.emplId, emp.name);
//         }
//       });
//     });
//     return [
//       "all",
//       ...Array.from(allEmployees.entries()).map(([id, name]) => ({ id, name })),
//     ];
//   }, [processedData]);

//   // --- EXPORT LOGIC ---

//   const exportToPdf = async () => {
//     if (loading || error) return;

//     const originalInput = document.getElementById('financial-dashboard-content');
//     if (!originalInput) {
//       console.error("Content element for PDF not found.");
//       return;
//     }
    
//     // Clone the node to strip dynamic bindings and ensure a clean render copy
//     const input = originalInput.cloneNode(true);
//     input.style.width = originalInput.offsetWidth + 'px'; 
//     input.style.height = originalInput.offsetHeight + 'px'; 
    
//     document.body.appendChild(input); 

//     try {
//         await new Promise(resolve => setTimeout(resolve, 800)); // Increased delay for stability

//         const canvas = await html2canvas(input, { 
//             scale: 3, 
//             useCORS: true, 
//             allowTaint: true, 
//             backgroundColor: '#ffffff', 
//             // Filter elements containing the class 'exclude-pdf' OR the custom attribute
//             ignoreElements: (element) => 
//                 (element.className && String(element.className).includes('exclude-pdf')) || 
//                 (element.hasAttribute && element.hasAttribute('data-ignore-pdf-style')),
//             foreignObjectRendering: false, 
//             removeContainer: false, 
//             logging: false,
//         }); 

//         document.body.removeChild(input); 

//         const imgData = canvas.toDataURL('image/png');
//         const pdf = new jsPDF('p', 'mm', 'a4');
//         const imgWidth = 210;
//         const pageHeight = 295;
//         const imgHeight = (canvas.height * imgWidth) / canvas.width;
//         let heightLeft = imgHeight;
//         let position = 0;

//         pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//         heightLeft -= pageHeight;

//         while (heightLeft >= 0) {
//             position = heightLeft - imgHeight;
//             pdf.addPage();
//             pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//             heightLeft -= pageHeight;
//         }

//         pdf.save(`Financial_Dashboard_${activeTab}_${planId || 'report'}_${new Date().toISOString().slice(0, 10)}.pdf`);
//     } catch (error) {
//         if(document.body.contains(input)) {
//              document.body.removeChild(input); 
//         }
//         console.error("Error generating PDF:", error);
//         alert("PDF failed. The only resolution is manually reviewing and simplifying the CSS in ForecastReport.jsx (removing complex Tailwind colors).");
//     }
//   };

//   /**
//    * Generates a CSV string and downloads it with an .xlsx extension.
//    */
//   const exportDataToXlsx = (data, fileName, headers) => {
//     if (!data.length) return;

//     try {
//         // The UTF-8 BOM helps Excel recognize encoding and formatting correctly
//         let csv = '\ufeff' + headers + '\n'; 
        
//         // CRITICAL FIX: Changing delimiter to semicolon (;) for better compatibility with European Excel locales.
//         // If this still fails, try changing it to a tab ('\t').
//         const delimiter = ';'; 

//         data.forEach(row => {
//             csv += Object.values(row).map(value => {
//                 // Cast all values to string 
//                 let strValue = String(value ?? ''); 
                
//                 // CRITICAL FIX FOR XLSX: Ensure numbers are locale-neutral 
//                 // Remove all commas from numerical data to prevent false column separation.
//                 if (!isNaN(parseFloat(strValue)) && isFinite(strValue)) {
//                     strValue = strValue.replace(/,/g, ''); 
//                 }

//                 // Escape internal double quotes with two double quotes (CSV standard)
//                 const escapedValue = strValue.replace(/"/g, '""');
                
//                 // CRITICAL: Enclose ALL values in double quotes for maximal CSV safety
//                 return `"${escapedValue}"`;
//             }).join(delimiter) + '\n';
//         });

//         const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//         const link = document.createElement('a');
//         if (link.download !== undefined) {
//             const url = URL.createObjectURL(blob);
//             link.setAttribute('href', url);
//             link.setAttribute('download', fileName.replace('.csv', '.xlsx')); 
//             link.style.visibility = 'hidden';
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//         }
//     } catch (e) {
//         console.error("XLSX Export Error:", e);
//         alert("XLSX failed. Check console for CSV formatting details.");
//     }
//   };

//   const handleExportOverviewXlsx = () => { /* Placeholder */ };
//   const handleExportSpendXlsx = () => { alert("Export logic for Spend Chart is currently placeholder."); };

//   const handleExportForecastXlsx = () => {
//     exportDataToXlsx(MOCK_FORECAST_EXPORT_DATA, `Forecast_Report_${planId || 'report'}_${new Date().toISOString().slice(0, 10)}.xlsx`, MOCK_FORECAST_HEADERS);
//   };
//   // --- END EXPORT LOGIC ---

//   // --- API CALL LOGIC DISABLED ---
//   const fetchDashboardData = useCallback(async () => {
//     setLoading(false);
//     setError(null);
//     const apiResponse = { employeeForecastSummary: [] }; 
//     setFullApiResponse(apiResponse); 
//     const transformedCostData = transformApiResponseToRevenueAnalysisRows(apiResponse);
//     setProcessedData(transformedCostData);
//   }, []); 

//   useEffect(() => {
//     fetchDashboardData();
//   }, [fetchDashboardData]); 

//   // Data processing logic remains
//   useEffect(() => {
//     // Logic to update charts based on processedData (will be skipped due to data being empty)
//   }, [processedData, selectedPlc, selectedEmployee]);

//   if (loading) return (
//       <div className="p-4 font-inter flex justify-center items-center">
//         <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
//         <span className="ml-2 text-xs text-gray-600">Loading Dashboard</span>
//       </div>
//     );
//   if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

//   const getTabClasses = (tabName) => {
//     return `px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none ${
//       activeTab === tabName
//         ? "border-b-2 border-blue-600 text-blue-600 bg-white"
//         : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
//     }`;
//   };

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen font-sans">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold text-gray-800">
//           Financial Dashboard
//         </h1>
//         <div className="flex space-x-3">
//           <button
//             onClick={exportToPdf}
//             className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors shadow-md disabled:opacity-50"
//             title="Export current tab view to PDF"
//             disabled={loading || error}
//           >
//             <FaFilePdf className="mr-2" /> PDF
//           </button>
          
//           {/* Example dynamic XLSX export button for the active tab */}
//           {activeTab === 'forecast' && (
//             <button
//               onClick={handleExportForecastXlsx}
//               className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
//               title="Export Forecast Report data to XLSX (Excel)"
//               disabled={loading || error}
//             >
//               <FaFileExcel className="mr-2" /> XLSX (Forecast Data)
//             </button>
//           )}
//           {activeTab === 'overview' && (
//             <button
//               onClick={handleExportOverviewXlsx}
//               className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
//               title="Export aggregated Overview data to XLSX (Excel)"
//               disabled={loading || error || processedData.length === 0}
//             >
//               <FaFileExcel className="mr-2" /> XLSX (Overview Data)
//             </button>
//           )}
//           {activeTab === 'spend' && (
//             <button
//               onClick={handleExportSpendXlsx}
//               className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
//               title="Export Spend Chart time-series data to XLSX (Excel)"
//               disabled={loading || error}
//             >
//               <FaFileExcel className="mr-2" /> XLSX (Spend Data)
//             </button>
//           )}
//            {activeTab === 'utilization' && (
//             <button
//               onClick={() => alert("Utilization Chart export placeholder")}
//               className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
//               title="Export Utilization Chart data to XLSX (Excel)"
//               disabled={loading || error}
//             >
//               <FaFileExcel className="mr-2" /> XLSX (Utilization Data)
//             </button>
//           )}
//         </div>
//       </div>

//       <div id="financial-dashboard-content"> 

//         {/* Tabs Navigation */}
//         <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg shadow-sm">
//           <button
//             className={getTabClasses('forecast')}
//             onClick={() => setActiveTab('forecast')}
//           >
//             Forecast Report
//           </button>
//           <button
//             className={getTabClasses('spend')}
//             onClick={() => setActiveTab('spend')}
//           >
//             Spend Chart
//           </button>
//           <button
//             className={getTabClasses('utilization')}
//             onClick={() => setActiveTab('utilization')}
//           >
//             Utilization Chart
//           </button>
//           <button
//             className={getTabClasses('overview')}
//             onClick={() => setActiveTab('overview')}
//           >
//             Financial Overview
//           </button>
//         </div>

//         {/* Content Area */}
//         {activeTab === 'overview' && (
//           <>
//             {/* Filters Section */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-white rounded-lg shadow">
//               <div className="exclude-pdf"> 
//                 <label htmlFor="plc-filter" className="block text-sm font-medium text-gray-700">Filter by PLC</label>
//                 <select id="plc-filter" value={selectedPlc} onChange={(e) => setSelectedPlc(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
//                   {plcOptions.map((plc) => (<option key={plc} value={plc}>{plc === "all" ? "All PLCs" : plc}</option>))}
//                 </select>
//               </div>
//             </div>
            
//             {/* Charts for Financial Overview (Placeholder) */}
//             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
//               <div id="revenue-vs-cost-chart" className="lg:col-span-3 p-4 bg-white rounded-lg shadow" data-ignore-pdf-style="true">
//                 <h2 className="text-xl font-semibold text-gray-700 mb-4">Revenue vs. Cost (Chart Placeholder)</h2>
//                 <div className="text-center py-10 text-gray-500">Chart data processing omitted.</div>
//               </div>
//             </div>
//           </>
//         )}
        
//         {/* SPEND CHART TAB CONTENT */}
//         {activeTab === 'spend' && (
//             <div data-ignore-pdf-style="true">
//                 <SpendChart fullApiResponse={fullApiResponse} />
//             </div>
//         )}

//         {/* UTILIZATION CHART TAB CONTENT */}
//         {activeTab === 'utilization' && (
//             <div data-ignore-pdf-style="true">
//                 <UtilizationChart fullApiResponse={fullApiResponse} />
//             </div>
//         )}

//         {/* FORECAST REPORT TAB CONTENT */}
//         {activeTab === 'forecast' && (
//             <ForecastReport fullApiResponse={fullApiResponse} />
//         )}
//       </div>
//     </div>
//   );
// };

// export default FinancialDashboard;


"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
// import { backendUrl } from "./config"; // API logic disabled for testing
import html2canvas from 'html2canvas'; 
import { jsPDF } from 'jspdf';          
import { FaFilePdf, FaFileExcel } from 'react-icons/fa'; 
import ForecastReport from "./ForecastReport";
import SpendChart from "./SpendChart"; 
import UtilizationChart from "./UtilizationChart"; 

// Register Chart.js components required for all charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// --- API RESPONSE TRANSFORMATION FUNCTIONS (Disabled) ---
function transformApiResponseToRevenueAnalysisRows(apiResponse) { return []; }
// --- END API RESPONSE TRANSFORMATION FUNCTIONS ---

// MOCK DATA and HEADERS for Exporting Forecast Report Data 
const MOCK_TIME_PERIODS_EXPORT = [
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'FY-25 Total'
];

// Helper ensures raw numbers are used for CSV/XLSX export
const createExportFinancials = (baseValue) => {
    const financials = {};
    let runningTotal = 0;
    MOCK_TIME_PERIODS_EXPORT.forEach((period, i) => {
        if (!period.includes('Total')) {
            const value = baseValue + i * 5000;
            financials[period] = value; 
            runningTotal += value;
        }
    });
    financials['FY-25 Total'] = runningTotal;
    return financials;
};

const MOCK_FORECAST_EXPORT_DATA = [
    { Project: '22001.01.01', 'Project Name': 'USAF Labor Contract', Org: '1.01.01', 'Account ID': '500-001', 'Account Name': 'Direct Labor', 'POP Start Date': '2025-01-01', 'POP End Date': '2025-12-31', ...createExportFinancials(50000) },
    { Project: '22001.02.01', 'Project Name': 'NASA Research Grant', Org: '1.02.01', 'Account ID': '500-002', 'Account Name': 'Travel Expenses', 'POP Start Date': '2025-03-01', 'POP End Date': '2026-03-31', ...createExportFinancials(20000) },
];
const MOCK_FORECAST_HEADERS = 'Project,Project Name,Org,Account ID,Account Name,POP Start Date,POP End Date,' + MOCK_TIME_PERIODS_EXPORT.join(',');

// --- FINANCIAL DASHBOARD COMPONENT ---
const FinancialDashboard = ({ planId, templateId, type }) => {
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [fullApiResponse, setFullApiResponse] = useState(null); 
  const [processedData, setProcessedData] = useState([]);
  const [revenueChartData, setRevenueChartData] = useState(null);
  const [plcPieChartData, setPlcPieChartData] = useState(null);

  const [selectedPlc, setSelectedPlc] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [activeTab, setActiveTab] = useState('forecast'); 

  const plcOptions = useMemo(() => {
    return ["all", ...processedData.map((p) => p.plcName)];
  }, [processedData]);

  const employeeOptions = useMemo(() => {
    const allEmployees = new Map();
    processedData.forEach((plc) => {
      plc.employees.forEach((emp) => {
        if (!allEmployees.has(emp.emplId)) {
         allEmployees.set(emp.emplId, emp.name);
        }
      });
    });
    return [
      "all",
      ...Array.from(allEmployees.entries()).map(([id, name]) => ({ id, name })),
    ];
  }, [processedData]);

  // --- EXPORT LOGIC ---
  const exportToPdf = async () => {
    if (loading || error) return;

    const originalInput = document.getElementById('financial-dashboard-content');
    if (!originalInput) {
      console.error("Content element for PDF not found.");
      return;
    }
    
    const input = originalInput.cloneNode(true);
    input.style.width = originalInput.offsetWidth + 'px'; 
    input.style.height = originalInput.offsetHeight + 'px'; 
    
    document.body.appendChild(input); 

    try {
        await new Promise(resolve => setTimeout(resolve, 800));

        const canvas = await html2canvas(input, { 
            scale: 3, 
            useCORS: true, 
            allowTaint: true, 
            backgroundColor: '#ffffff', 
            ignoreElements: (element) => 
                (element.className && String(element.className).includes('exclude-pdf')) || 
                (element.hasAttribute && element.hasAttribute('data-ignore-pdf-style')),
            foreignObjectRendering: false, 
            removeContainer: false, 
            logging: false,
        }); 

        document.body.removeChild(input); 

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4'); // LANDSCAPE for wide tables
        const imgWidth = 297; // Full landscape width
        const pageHeight = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`Financial_Dashboard_${activeTab}_${planId || 'report'}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
        if(document.body.contains(input)) {
           document.body.removeChild(input); 
        }
        console.error("Error generating PDF:", error);
        alert("PDF failed. Try simplifying CSS in child components.");
    }
  };

  const exportDataToXlsx = (data, fileName, headers) => {
    if (!data.length) return;

    try {
        let csv = '\ufeff' + headers + '\n'; 
        const delimiter = ';'; 

        data.forEach(row => {
            csv += Object.values(row).map(value => {
                let strValue = String(value ?? ''); 
                if (!isNaN(parseFloat(strValue)) && isFinite(strValue)) {
                    strValue = strValue.replace(/,/g, ''); 
                }
                const escapedValue = strValue.replace(/"/g, '""');
                return `"${escapedValue}"`;
            }).join(delimiter) + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName.replace('.csv', '.xlsx')); 
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("XLSX Export Error:", e);
        alert("XLSX failed. Check console for CSV formatting details.");
    }
  };

  const handleExportOverviewXlsx = () => { /* Placeholder */ };
  const handleExportSpendXlsx = () => { alert("Export logic for Spend Chart is currently placeholder."); };

  const handleExportForecastXlsx = () => {
    exportDataToXlsx(MOCK_FORECAST_EXPORT_DATA, `Forecast_Report_${planId || 'report'}_${new Date().toISOString().slice(0, 10)}.xlsx`, MOCK_FORECAST_HEADERS);
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(false);
    setError(null);
    const apiResponse = { employeeForecastSummary: [] }; 
    setFullApiResponse(apiResponse); 
    const transformedCostData = transformApiResponseToRevenueAnalysisRows(apiResponse);
    setProcessedData(transformedCostData);
  }, []); 

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); 

  useEffect(() => {
    // Logic to update charts based on processedData
  }, [processedData, selectedPlc, selectedEmployee]);

  if (loading) return (
      <div className="p-4 font-inter flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-lg text-gray-600">Loading Dashboard</span>
      </div>
  );
  if (error) return <div className="p-8 text-red-500 text-center text-xl">Error: {error}</div>;

  const getTabClasses = (tabName) => {
    return `px-6 py-3 text-base font-semibold transition-all duration-300 focus:outline-none ${
      activeTab === tabName
        ? "border-b-4 border-blue-600 text-blue-600 bg-white shadow-lg"
        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md"
    }`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-0"> {/* FULL BLEED */}
      {/* *** FULL WIDTH HEADER WITH EXPORT BUTTONS *** */}
      <div id="financial-dashboard-content" className="min-h-screen"> 

        {/* *** FULL WIDTH TABS *** */}
        <div className="bg-white/90 backdrop-blur-md border-b-2 border-gray-200 shadow-lg sticky z-40    ">
          <div className="max-w-full mx-auto px-6 py-1">
            <div className="flex border-b border-transparent overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <button className={getTabClasses('forecast')} onClick={() => setActiveTab('forecast')}>
                📊 Forecast Report
              </button>
              <button className={getTabClasses('spend')} onClick={() => setActiveTab('spend')}>
                💰 Spend Analysis
              </button>
              <button className={getTabClasses('utilization')} onClick={() => setActiveTab('utilization')}>
                👥 Utilization
              </button>
              <button className={getTabClasses('overview')} onClick={() => setActiveTab('overview')}>
                📈 Overview
              </button>

               <div className="flex flex-wrap gap-3">
              {/* <button
                onClick={exportToPdf}
                className="flex items-center gap-2 px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 border-2 border-red-400 disabled:opacity-50"
                title="Export current tab to PDF (Landscape)"
                disabled={loading || error}
              >
                <FaFilePdf className="w-5 h-5" /> PDF Export
              </button> */}
              
              {/* {activeTab === 'forecast' && (
                <button
                  onClick={handleExportForecastXlsx}
                  className="flex items-center gap-2 px-2 py-1 text-lg font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 border-2 border-green-400 disabled:opacity-50"
                  title="Export Forecast data to Excel"
                >
                  <FaFileExcel className="w-5 h-5" /> Excel Export
                </button>
              )} */}
            </div>
            </div>
          </div>
        </div>

        {/* *** FULL WIDTH CONTENT AREA WITH SCROLLBARS *** */}
        <div className="max-w-full mx-auto px-0 relative">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="p-8 bg-white/50 backdrop-blur-sm min-h-screen">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                <div className="p-8 bg-white rounded-2xl shadow-2xl border border-blue-100 exclude-pdf">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Filters</h2>
                  <select value={selectedPlc} onChange={(e) => setSelectedPlc(e.target.value)} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-lg">
                    {plcOptions.map((plc) => (<option key={plc} value={plc}>{plc === "all" ? "All PLCs" : plc}</option>))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* SPEND CHART TAB */}
          {activeTab === 'spend' && (
            <div className="min-h-screen p-0" data-ignore-pdf-style="true">
              <SpendChart fullApiResponse={fullApiResponse} />
            </div>
          )}

          {/* UTILIZATION CHART TAB */}
          {activeTab === 'utilization' && (
            <div className="min-h-screen p-0" data-ignore-pdf-style="true">
              <UtilizationChart fullApiResponse={fullApiResponse} />
            </div>
          )}

          {/* *** FORECAST REPORT TAB - FULL WIDTH WITH SCROLLBARS *** */}


          {activeTab === 'forecast' && (
  <div
    className="w-full px-4 pb-6"
    style={{ maxHeight: '500px' }}    // or whatever height you want
  >
    {/* single scroll container, no extra background */}
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowX: 'auto',
        overflowY: 'auto',
      }}
    >
      <ForecastReport fullApiResponse={fullApiResponse} />
    </div>
  </div>
)}

        </div>
      </div>

      {/* *** CUSTOM SCROLLBAR STYLES *** */}
      <style jsx global>{`
        /* Custom Scrollbar for Webkit Browsers */
        .scrollbar-thin::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #3b82f6, #6366f1);
          border-radius: 10px;
          border: 2px solid #f1f5f9;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #2563eb, #4f46e5);
        }
        
        /* Firefox Scrollbar */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 #f1f5f9;
        }
        
        /* Ensure ForecastReport table fills container */
        .forecast-report-container {
          // min-width: 3200px !important;
          width: calc(100vw-2rem) !important;
        }
      `}</style>
    </div>
  );
};

export default FinancialDashboard;
