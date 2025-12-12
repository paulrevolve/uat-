// // // // import React, { useEffect, useState } from "react";
// // // // import NavigationSidebar from "../components/NavigationSidebar";
// // // // import { Routes, Route, useNavigate } from "react-router-dom";
// // // // import ProjectBudgetStatus from "../components/ProjectBudgetStatus";
// // // // import NewBusiness from "../components/NewBusiness";
// // // // import PoolRate from "../components/PoolRate";
// // // // import PoolConfigurationTable from "../components/PoolConfigurationTable";
// // // // import TemplatePoolMapping from "../components/TemplatePoolMapping";
// // // // import Template from "../components/Template";
// // // // import CeilingConfiguration from "../components/CeilingConfiguration";
// // // // import GlobalConfiguration from "../components/GlobalConfiguration";
// // // // import ProspectiveIdSetup from "../components/ProspectiveIdSetup";
// // // // import DisplaySettings from "../components/DisplaySettings";
// // // // import AnnualHolidays from "../components/HolidayCalendar";
// // // // import MaintainFiscalYearPeriods from "../components/MaintainFiscalYearPeriods";
// // // // import ChatBot from "../components/ChatBot";
// // // // import TopBar from "../components/TopBar";
// // // // import.meta.env.VITE_APP_VERSION;

// // // // const Dashboard = () => {
// // // //   const [currentUserRole, setCurrentUserRole] = useState(null);
// // // //   const [userName, setUserName] = useState("User");
// // // //   const navigate = useNavigate();

// // // //   function capitalizeWords(str) {
// // // //     return str.replace(/\b\w/g, (char) => char.toUpperCase());
// // // //   }

// // // //   useEffect(() => {
// // // //     const userString = localStorage.getItem("currentUser");
// // // //     if (userString) {
// // // //       try {
// // // //         const userObj = JSON.parse(userString);
// // // //         setUserName(userObj.name ? capitalizeWords(userObj.name) : "User");
// // // //         setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
// // // //       } catch {
// // // //         setCurrentUserRole(null);
// // // //         setUserName("User");
// // // //       }
// // // //     }
// // // //   }, []);
// // // //   const appVersion = import.meta.env.VITE_APP_VERSION || "N/A";
// // // //   const handleLogout = () => {
// // // //     try {
// // // //       localStorage.removeItem("currentUser");
// // // //       localStorage.removeItem("authToken");
// // // //       // If you store any other session/user data, remove it here as well
// // // //     } catch (e) {
// // // //       // Optional: handle or log any storage errors
// // // //     }
// // // //     navigate("/login", { replace: true });
// // // //   };

// // // //   return (
// // // //     <>
// // // //       <style>
// // // //         {`
// // // //           @layer utilities {
// // // //             .animate-fade-in {
// // // //               animation: fadeIn 0.6s ease-in-out;
// // // //             }
// // // //             .font-classic {
// // // //               font-family: Georgia, 'Times New Roman', Times, serif;
// // // //             }
// // // //           }
// // // //           @keyframes fadeIn {
// // // //             0% {
// // // //               opacity: 0;
// // // //               transform: translateY(10px);
// // // //             }
// // // //             100% {
// // // //               opacity: 1;
// // // //               transform: translateY(0);
// // // //             }
// // // //           }
// // // //         `}
// // // //       </style>
// // // //       <div className="flex">
// // // //         <div className="sticky top-0 h-screen">
// // // //           <NavigationSidebar />
// // // //         </div>

// // // //         <div className="flex flex-col flex-1 min-h-screen bg-gray-100">
// // // //           <TopBar name={userName} onLogout={handleLogout} />

// // // //           <div className="flex-1 p-4 sm:p-6 bg-gray-100 min-h-screen overflow-auto">
// // // //             <Routes>
// // // //               <Route
// // // //                 path="/"
// // // //                 element={
// // // //                   <div className="flex items-center justify-center min-h-[calc(100vh-2rem)] sm:min-h-[calc(100vh-3rem)]">
// // // //                     <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-xl shadow-lg transform transition-all hover:scale-105">
// // // //                       <div className="mb-6">
// // // //                         <span className="inline-block text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 text-transparent bg-clip-text">
// // // //                           R-AI
// // // //                         </span>
// // // //                       </div>
// // // //                       <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4 animate-fade-in font-classic tracking-wide">
// // // //                         Welcome to R-AI Planning
// // // //                       </h1>
// // // //                       <p className="text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer font-classic font-normal">
// // // //                         Select an option from the sidebar to get started.
// // // //                       </p>
// // // //                     </div>
// // // //                   </div>
// // // //                 }
// // // //               />
// // // //               <Route
// // // //                 path="/project-budget-status"
// // // //                 element={<ProjectBudgetStatus />}
// // // //               />
// // // //               <Route path="/new-business" element={<NewBusiness />} />
// // // //               <Route path="/pool-rate" element={<PoolRate />} />
// // // //               <Route
// // // //                 path="/pool-configuration"
// // // //                 element={<PoolConfigurationTable />}
// // // //               />
// // // //               <Route
// // // //                 path="/template-pool-mapping"
// // // //                 element={<TemplatePoolMapping />}
// // // //               />
// // // //               <Route path="/template" element={<Template />} />
// // // //               <Route
// // // //                 path="/ceiling-configuration"
// // // //                 element={<CeilingConfiguration />}
// // // //               />
// // // //               <Route
// // // //                 path="/global-configuration"
// // // //                 element={<GlobalConfiguration />}
// // // //               />
// // // //               <Route
// // // //                 path="/prospective-id-setup"
// // // //                 element={<ProspectiveIdSetup />}
// // // //               />
// // // //               <Route path="/display-settings" element={<DisplaySettings />} />
// // // //               <Route path="/annual-holidays" element={<AnnualHolidays />} />
// // // //               <Route
// // // //                 path="/maintain-fiscal-year-periods"
// // // //                 element={<MaintainFiscalYearPeriods />}
// // // //               />
// // // //             </Routes>
// // // //           </div>
// // // //         </div>
// // // //         {/* Chatbot at corner */}
// // // //         {currentUserRole === "admin" && (
// // // //           <div>
// // // //             <ChatBot />
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //       {/* Version number fixed at bottom right */}
// // // //       {/* <div className="fixed bottom-2 right-2 text-xs text-gray-500 font-mono select-none pointer-events-none">
// // // //         v{appVersion}
// // // //       </div> */}
// // // //     </>
// // // //   );
// // // // };

// // // // export default Dashboard;

// // import React, { useEffect, useState } from "react";
// // import NavigationSidebar from "../components/NavigationSidebar";
// // import { Routes, Route, useNavigate } from "react-router-dom";
// // import ProjectBudgetStatus from "../components/ProjectBudgetStatus";
// // import NewBusiness from "../components/NewBusiness";
// // import PoolRate from "../components/PoolRate";
// // import PoolConfigurationTable from "../components/PoolConfigurationTable";
// // import TemplatePoolMapping from "../components/TemplatePoolMapping";
// // import Template from "../components/Template";
// // import CeilingConfiguration from "../components/CeilingConfiguration";
// // import GlobalConfiguration from "../components/GlobalConfiguration";
// // import ProspectiveIdSetup from "../components/ProspectiveIdSetup";
// // import DisplaySettings from "../components/DisplaySettings";
// // import AnnualHolidays from "../components/HolidayCalendar";
// // import MaintainFiscalYearPeriods from "../components/MaintainFiscalYearPeriods";
// // import ChatBot from "../components/ChatBot";
// // import TopBar from "../components/TopBar";

// // const Dashboard = () => {
// //   const [currentUserRole, setCurrentUserRole] = useState(null);
// //   const [userName, setUserName] = useState("User");
// //   const navigate = useNavigate();

// //   function capitalizeWords(str) {
// //     return str.replace(/\b\w/g, (char) => char.toUpperCase());
// //   }

// //   useEffect(() => {
// //     const userString = localStorage.getItem("currentUser");
// //     if (userString) {
// //       try {
// //         const userObj = JSON.parse(userString);
// //         setUserName(userObj.name ? capitalizeWords(userObj.name) : "User");
// //         setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
// //       } catch {
// //         setCurrentUserRole(null);
// //         setUserName("User");
// //       }
// //     }
// //   }, []);

// //   const appVersion = import.meta.env.VITE_APP_VERSION || "N/A";
// //   const handleLogout = () => {
// //     try {
// //       localStorage.removeItem("currentUser");
// //       localStorage.removeItem("authToken");
// //     } catch (e) {}
// //     navigate("/login", { replace: true });
// //   };

// //   return (
// //     <>
// //       {/* <style>
// //         {`
// //           @layer utilities {
// //             .animate-fade-in {
// //               animation: fadeIn 0.6s ease-in-out;
// //             }
// //             .font-classic {
// //               font-family: Georgia, 'Times New Roman', Times, serif;
// //             }
// //           }
// //           @keyframes fadeIn {
// //             0% {
// //               opacity: 0;
// //               transform: translateY(10px);
// //             }
// //             100% {
// //               opacity: 1;
// //               transform: translateY(0);
// //             }
// //           }
// //         `}
// //       </style> */}
// //       <TopBar name={userName} onLogout={handleLogout} />
// //       <div className="flex">
// //         <div className="sticky top-0 h-screen">
// //           <NavigationSidebar />
// //         </div>
// //         {/* <div className="flex flex-col flex-1 min-h-screen bg-gray-100 "> */}
// //         {/* <TopBar name={userName} onLogout={handleLogout} /> */}
// //         <div className="flex-1 p-4 sm:p-6 bg-gray-100 min-h-screen overflow-auto">
// //           <Routes>
// //             <Route
// //               path="/"
// //               element={
// //                 <div className="flex items-center justify-center min-h-[calc(100vh-2rem)] sm:min-h-[calc(100vh-3rem)]">
// //                   <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-xl shadow-lg transform transition-all hover:scale-105">
// //                     <div className="mb-6">
// //                       <span className="inline-block text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 text-transparent bg-clip-text">
// //                         R-AI
// //                       </span>
// //                     </div>
// //                     <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4 animate-fade-in font-classic tracking-wide">
// //                       Welcome to R-AI Planning
// //                     </h1>
// //                     <p className="text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer font-classic font-normal">
// //                       Select an option from the sidebar to get started.
// //                     </p>
// //                   </div>
// //                 </div>
// //               }
// //             />
// //             <Route
// //               path="/project-budget-status"
// //               element={<ProjectBudgetStatus />}
// //             />
// //             <Route path="/new-business" element={<NewBusiness />} />
// //             <Route path="/pool-rate" element={<PoolRate />} />
// //             <Route
// //               path="/pool-configuration"
// //               element={<PoolConfigurationTable />}
// //             />
// //             <Route
// //               path="/template-pool-mapping"
// //               element={<TemplatePoolMapping />}
// //             />
// //             <Route path="/template" element={<Template />} />
// //             <Route
// //               path="/ceiling-configuration"
// //               element={<CeilingConfiguration />}
// //             />
// //             <Route
// //               path="/global-configuration"
// //               element={<GlobalConfiguration />}
// //             />
// //             <Route
// //               path="/prospective-id-setup"
// //               element={<ProspectiveIdSetup />}
// //             />
// //             <Route path="/display-settings" element={<DisplaySettings />} />
// //             <Route path="/annual-holidays" element={<AnnualHolidays />} />
// //             <Route
// //               path="/maintain-fiscal-year-periods"
// //               element={<MaintainFiscalYearPeriods />}
// //             />
// //           </Routes>
// //         </div>
// //         {/* <div className="fixed bottom-2 right-2 text-xs text-gray-500 font-mono select-none pointer-events-none">
// //             v{appVersion}
// //           </div> */}
// //         {/* </div> */}
// //         {/* {currentUserRole === "admin" && (
// //           <div>
// //             <ChatBot />
// //           </div>
// //         )} */}
// //       </div>
// //     </>
// //   );
// // };

// // export default Dashboard;

// import React, { useEffect, useState } from "react";
// import NavigationSidebar from "../components/NavigationSidebar";
// import { Routes, Route, useNavigate } from "react-router-dom";
// import ProjectBudgetStatus from "../components/ProjectBudgetStatus";
// import NewBusiness from "../components/NewBusiness";
// import PoolRate from "../components/PoolRate";
// import PoolConfigurationTable from "../components/PoolConfigurationTable";
// import TemplatePoolMapping from "../components/TemplatePoolMapping";
// import Template from "../components/Template";
// import CeilingConfiguration from "../components/CeilingConfiguration";
// import GlobalConfiguration from "../components/GlobalConfiguration";
// import ProspectiveIdSetup from "../components/ProspectiveIdSetup";
// import DisplaySettings from "../components/DisplaySettings";
// import AnnualHolidays from "../components/HolidayCalendar";
// import MaintainFiscalYearPeriods from "../components/MaintainFiscalYearPeriods";
// import ChatBot from "../components/ChatBot";
// import TopBar from "../components/TopBar";

// const SIDEBAR_WIDTH = 240; // px, adjust as needed
// const TOPBAR_HEIGHT = 64; // px, adjust as needed

// const Dashboard = () => {
//   const [currentUserRole, setCurrentUserRole] = useState(null);
//   const [userName, setUserName] = useState("User");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const userString = localStorage.getItem("currentUser");
//     if (userString) {
//       try {
//         const userObj = JSON.parse(userString);
//         setUserName(
//           userObj.name
//             ? userObj.name.replace(/\b\w/g, (c) => c.toUpperCase())
//             : "User"
//         );
//         setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
//       } catch {
//         setCurrentUserRole(null);
//         setUserName("User");
//       }
//     }
//   }, []);

//   const handleLogout = () => {
//     try {
//       localStorage.removeItem("currentUser");
//       localStorage.removeItem("authToken");
//     } catch {}
//     navigate("/login", { replace: true });
//   };

//   return (
//     <>
//       <style>
//         {`
//           .sidebar {
//             width: ${SIDEBAR_WIDTH}px;
//             top: ${TOPBAR_HEIGHT}px;
//             height: calc(100vh - ${TOPBAR_HEIGHT}px);
//           }
//           .topbar {
//             height: ${TOPBAR_HEIGHT}px;
//           }
//           .main-content {
//             margin-left: ${SIDEBAR_WIDTH}px;
//             margin-top: ${TOPBAR_HEIGHT}px;
//             height: calc(100vh - ${TOPBAR_HEIGHT}px);
//             overflow-y: auto;
//           }
//         `}
//       </style>
//       {/* TopBar: always at the top */}
//       <div className="topbar fixed top-0 left-0 right-0 z-40  flex items-center ">
//         <TopBar name={userName} onLogout={handleLogout} />
//       </div>

//       {/* Sidebar: always at the left, below topbar */}
//       <div className="sidebar fixed left-0">
//         <NavigationSidebar />
//       </div>

//       {/* Main content container, using margin to avoid overlap */}
//       <div className="main-content bg-gray-100 ">
//         <Routes>
//           <Route
//             path="/"
//             element={
//               <div className="flex items-center justify-center h-full">
//                 <div className="max-w-md w-full text-center bg-transparent p-8 rounded-xl shadow-lg">
//                   <span className="inline-block text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 text-transparent bg-clip-text">
//                     R-AI
//                   </span>
//                   <h1 className="text-3xl font-semibold text-gray-900 mb-4 mt-4">
//                     Welcome to R-AI Planning
//                   </h1>
//                   <p className="text-base text-gray-600">
//                     Select an option from the sidebar to get started.
//                   </p>
//                 </div>
//               </div>
//             }
//           />
//           <Route
//             path="/project-budget-status"
//             element={<ProjectBudgetStatus />}
//           />
//           <Route path="/new-business" element={<NewBusiness />} />
//           <Route path="/pool-rate" element={<PoolRate />} />
//           <Route
//             path="/pool-configuration"
//             element={<PoolConfigurationTable />}
//           />
//           <Route
//             path="/template-pool-mapping"
//             element={<TemplatePoolMapping />}
//           />
//           <Route path="/template" element={<Template />} />
//           <Route
//             path="/ceiling-configuration"
//             element={<CeilingConfiguration />}
//           />
//           <Route
//             path="/global-configuration"
//             element={<GlobalConfiguration />}
//           />
//           <Route
//             path="/prospective-id-setup"
//             element={<ProspectiveIdSetup />}
//           />
//           <Route path="/display-settings" element={<DisplaySettings />} />
//           <Route path="/annual-holidays" element={<AnnualHolidays />} />
//           <Route
//             path="/maintain-fiscal-year-periods"
//             element={<MaintainFiscalYearPeriods />}
//           />
//         </Routes>
//         {currentUserRole === "admin" && <ChatBot />}
//       </div>
//     </>
//   );
// };

// export default Dashboard;

import React, { useEffect, useState } from "react";
import NavigationSidebar from "../components/NavigationSidebar";
import { Navigate } from "react-router-dom";
import { Routes, Route, useNavigate } from "react-router-dom";
import ProjectBudgetStatus from "../components/ProjectBudgetStatus";
import NewBusiness from "../components/NewBusiness";
import PoolRate from "../components/PoolRate";
import PoolConfigurationTable from "../components/PoolConfigurationTable";
import TemplatePoolMapping from "../components/TemplatePoolMapping";
import Template from "../components/Template";
import CeilingConfiguration from "../components/CeilingConfiguration";
import GlobalConfiguration from "../components/GlobalConfiguration";
import ProspectiveIdSetup from "../components/ProspectiveIdSetup";
import DisplaySettings from "../components/DisplaySettings";
import AnnualHolidays from "../components/HolidayCalendar";
import MaintainFiscalYearPeriods from "../components/MaintainFiscalYearPeriods";
import ChatBot from "../components/ChatBot";
import TopBar from "../components/TopBar";
import PoolRateTabs from "../components/PoolRateTabs";
import AnalogRate from "../components/AnalogRate";

const SIDEBAR_WIDTH = 190; // px
const TOPBAR_HEIGHT = 45; // px

const Dashboard = () => {
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();

  useEffect(() => {
    const userString = localStorage.getItem("currentUser");
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        setUserName(
          userObj.name
            ? userObj.name.replace(/\b\w/g, (c) => c.toUpperCase())
            : "User"
        );
        setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
      } catch {
        setCurrentUserRole(null);
        setUserName("User");
      }
    }
  }, []);

  const ProtectedRoute = ({ children, allowedRoles }) => {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
      return <Navigate to="/" replace />;
    }
    const userObj = JSON.parse(storedUser);
    if (!userObj.role || !allowedRoles.includes(userObj.role.toLowerCase())) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
    } catch {}
    navigate("/login", { replace: true });
  };

  return (
    <>
      <style>
        {`
          .sidebar {
            width: ${SIDEBAR_WIDTH}px;
            top: ${TOPBAR_HEIGHT}px;
            height: calc(100vh - ${TOPBAR_HEIGHT}px);
          }
          .topbar {
            height: ${TOPBAR_HEIGHT}px;
          }
          .main-content {
            margin-left: ${SIDEBAR_WIDTH}px;
            margin-top: ${TOPBAR_HEIGHT}px;
            height: calc(100vh - ${TOPBAR_HEIGHT}px);
            overflow-y: auto;
          }
        `}
      </style>
      {/* TopBar fixed at the top */}
      <div className="topbar fixed top-0 left-0 right-0 z-40 flex items-center bg-white border-b border-gray-200">
        <TopBar name={userName} onLogout={handleLogout} />
      </div>

      {/* Sidebar fixed at the left, below TopBar */}
      <div className="sidebar fixed left-0 bg-white border-r border-gray-200">
        <NavigationSidebar />
      </div>

      {/* Main content: minimal padding and no white bg */}
      <div className="main-content bg-gradient-to-b from-blue-100 to-white p-2">
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex items-center justify-center h-full">
                <div className="max-w-md w-full text-center bg-transparent p-2 rounded">
                  <span className="inline-block text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 text-transparent bg-clip-text">
                    FinAxis
                  </span>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2 mt-4">
                    Welcome to FinAxis Planning
                  </h1>
                  <p className="text-base text-gray-600">
                    Select an option from the sidebar to get started.
                  </p>
                </div>
              </div>
            }
          />
          <Route
            path="/project-budget-status"
            element={<ProjectBudgetStatus />}
          />
          <Route path="/new-business" element={<NewBusiness />} />
          {/* Support dashboard-prefixed path used by NavigationSidebar */}
          <Route
            path="/pool-rate-tabs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PoolRateTabs />
              </ProtectedRoute>
            }
          />
          {/* Protect for only admin */}
          {/* <Route element={<ProtectedRoute allowedRoles={["admin" ]} />}> */}
          {/* <Route path="/pool-rate" element={<PoolRate />} /> */}
          <Route
            path="/pool-rate-tabs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PoolRateTabs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pool-configuration"
            // element={<PoolConfigurationTable />}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PoolConfigurationTable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/template-pool-mapping"
            // element={<TemplatePoolMapping />}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <TemplatePoolMapping />
              </ProtectedRoute>
            }
          />
          <Route
            path="/template"
            // element={<Template />}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Template />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ceiling-configuration"
            // element={<CeilingConfiguration />}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CeilingConfiguration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analog-rate"
            // element={<CeilingConfiguration />}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnalogRate/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/global-configuration"
            // element={<GlobalConfiguration />}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <GlobalConfiguration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prospective-id-setup"
            // element={<ProspectiveIdSetup />}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ProspectiveIdSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/display-settings"
            // element={<DisplaySettings />}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DisplaySettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/annual-holidays"
            // element={<AnnualHolidays />}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnnualHolidays />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintain-fiscal-year-periods"
            // element={<MaintainFiscalYearPeriods />}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MaintainFiscalYearPeriods />
              </ProtectedRoute>
            }
          />
          {/* </Route> */}
        </Routes>
        {/* {currentUserRole === "admin" && <ChatBot />} */}
      </div>
    </>
  );
};

export default Dashboard;
