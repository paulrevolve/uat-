import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronRight, Plus, LogOut } from "lucide-react";
import TopBar from "./TopBar";
import.meta.env.VITE_APP_VERSION;

const NavigationSidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [generalMenuOpen, setGeneralMenuOpen] = useState(
    pathname.includes("/dashboard/project-budget-status") ||
      pathname.includes("/dashboard/new-business") ||
      pathname.includes("/dashboard/pool-rate-tabs") ||
      pathname.includes("/dashboard/pool-configuration") ||
      pathname.includes("/dashboard/template-pool-mapping") ||
      pathname.includes("/dashboard/template") ||
      pathname.includes("/dashboard/ceiling-configuration") ||
      pathname.includes("/dashboard/global-configuration") ||
      pathname.includes("/dashboard/prospective-id-setup") ||
      pathname.includes("/dashboard/display-settings") ||
      pathname.includes("/dashboard/annual-holidays") ||
      pathname.includes("/dashboard/maintain-fiscal-year-periods")
  );
  const [planningOpen, setPlanningOpen] = useState(
    pathname.includes("/dashboard/project-budget-status") ||
      pathname.includes("/dashboard/new-business")
  );
  const [configurationOpen, setConfigurationOpen] = useState(
    pathname.includes("/dashboard/pool-rate-tabs") ||
      pathname.includes("/dashboard/pool-configuration") ||
      pathname.includes("/dashboard/template-pool-mapping") ||
      pathname.includes("/dashboard/template") ||
      pathname.includes("/dashboard/ceiling-configuration") ||
      pathname.includes("/dashboard/global-configuration") ||
      pathname.includes("/dashboard/prospective-id-setup") ||
      pathname.includes("/dashboard/display-settings") ||
      pathname.includes("/dashboard/annual-holidays") ||
      pathname.includes("/dashboard/maintain-fiscal-year-periods")
  );
  const [poolMappingOpen, setPoolMappingOpen] = useState(
    pathname.includes("/dashboard/pool-configuration") ||
      pathname.includes("/dashboard/template-pool-mapping")
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(pathname);

  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const userString = localStorage.getItem("currentUser");
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        setUserName(userObj.name || "User");
        setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
      } catch {
        setCurrentUserRole(null);
        setUserName("User");
      }
    }
  }, []);

  const appVersion = import.meta.env.VITE_APP_VERSION || "N/A";
  // useEffect(() => {
  //   setSelectedPage(pathname);
  //   setGeneralMenuOpen(
  //     pathname.includes("/dashboard/project-budget-status") ||
  //       pathname.includes("/dashboard/new-business") ||
  //       pathname.includes("/dashboard/pool-rate") ||
  //       pathname.includes("/dashboard/pool-configuration") ||
  //       pathname.includes("/dashboard/template-pool-mapping") ||
  //       pathname.includes("/dashboard/template") ||
  //       pathname.includes("/dashboard/ceiling-configuration") ||
  //       pathname.includes("/dashboard/global-configuration") ||
  //       pathname.includes("/dashboard/prospective-id-setup") ||
  //       pathname.includes("/dashboard/display-settings") ||
  //       pathname.includes("/dashboard/annual-holidays") ||
  //       pathname.includes("/dashboard/maintain-fiscal-year-periods")
  //   );
  //   setPlanningOpen(
  //     pathname.includes("/dashboard/project-budget-status") ||
  //       pathname.includes("/dashboard/new-business")
  //   );
  //   setConfigurationOpen(
  //     pathname.includes("/dashboard/pool-rate") ||
  //       pathname.includes("/dashboard/pool-configuration") ||
  //       pathname.includes("/dashboard/template-pool-mapping") ||
  //       pathname.includes("/dashboard/template") ||
  //       pathname.includes("/dashboard/ceiling-configuration") ||
  //       pathname.includes("/dashboard/global-configuration") ||
  //       pathname.includes("/dashboard/prospective-id-setup") ||
  //       pathname.includes("/dashboard/display-settings") ||
  //       pathname.includes("/dashboard/annual-holidays") ||
  //       pathname.includes("/dashboard/maintain-fiscal-year-periods")
  //   );
  //   setPoolMappingOpen(
  //     pathname.includes("/dashboard/pool-configuration") ||
  //       pathname.includes("/dashboard/template-pool-mapping")
  //   );
  // }, [pathname]);

  // const handleLinkClick = (pagePath) => {
  //   if (selectedPage === pagePath) {
  //     setSelectedPage(null);
  //     navigate("/dashboard");
  //   } else {
  //     setSelectedPage(pagePath);
  //     navigate(pagePath);
  //   }
  //   if (isSidebarOpen) {
  //     setIsSidebarOpen(false);
  //   }
  // };

  useEffect(() => {
    setSelectedPage(pathname);

    if (currentUserRole === "admin") {
      setGeneralMenuOpen(
        pathname.includes("/dashboard/project-budget-status") ||
          pathname.includes("/dashboard/new-business") ||
          pathname.includes("/dashboard/pool-rate-tabs") ||
          pathname.includes("/dashboard/pool-configuration") ||
          pathname.includes("/dashboard/template-pool-mapping") ||
          pathname.includes("/dashboard/template") ||
          pathname.includes("/dashboard/ceiling-configuration") ||
          pathname.includes("/dashboard/global-configuration") ||
          pathname.includes("/dashboard/prospective-id-setup") ||
          pathname.includes("/dashboard/display-settings") ||
          pathname.includes("/dashboard/annual-holidays") ||
          pathname.includes("/dashboard/maintain-fiscal-year-periods")
      );
      setPlanningOpen(
        pathname.includes("/dashboard/project-budget-status") ||
          pathname.includes("/dashboard/new-business")
      );
      setConfigurationOpen(
        pathname.includes("/dashboard/pool-rate-tabs") ||
          pathname.includes("/dashboard/pool-configuration") ||
          pathname.includes("/dashboard/template-pool-mapping") ||
          pathname.includes("/dashboard/template") ||
          pathname.includes("/dashboard/ceiling-configuration") ||
          pathname.includes("/dashboard/global-configuration") ||
          pathname.includes("/dashboard/prospective-id-setup") ||
          pathname.includes("/dashboard/display-settings") ||
          pathname.includes("/dashboard/annual-holidays") ||
          pathname.includes("/dashboard/maintain-fiscal-year-periods")
      );
      setPoolMappingOpen(
        pathname.includes("/dashboard/pool-configuration") ||
          pathname.includes("/dashboard/template-pool-mapping")
      );
    } else if (currentUserRole === "user") {
      // For user, open only general menu and planning if on project budget status page, else close all
      const isProjectBudget = pathname.includes(
        "/dashboard/project-budget-status"
      );
      setGeneralMenuOpen(isProjectBudget);
      setPlanningOpen(isProjectBudget);
      setConfigurationOpen(false);
      setPoolMappingOpen(false);

      // Additionally, if pathname is outside allowed route, redirect user to allowed path
      if (!isProjectBudget) {
        navigate("/dashboard/project-budget-status");
      }
    } else {
      // If role not yet determined, close all menus
      setGeneralMenuOpen(false);
      setPlanningOpen(false);
      setConfigurationOpen(false);
      setPoolMappingOpen(false);
    }
  }, [pathname, currentUserRole, navigate]);

  const handleLinkClick = (pagePath) => {
    setSelectedPage(pagePath);
    navigate(pagePath);
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  const handleCloseSidebar = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // Add Logout handler
  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Clear auth token
    navigate("/login");
    setIsSidebarOpen(false);
  };

  // <TopBar name={userName} onLogout={handleLogout} />;
  return (
    <div className="flex min-h-screen font-inter">
      <button
        className="md:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-1 rounded-md hover:bg-gray-700 transition ease-in-out duration-200"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      <div
        className={`fixed inset-y-0 left-0 w-48  font-normal bg-gradient text-white p-3 sm:p-4 shadow-lg transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:w-48 z-40 flex flex-col`} // Added flex flex-col
      >
        {/* Header */}
        {/* <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h2 className="text-base sm:text-lg md:text-2xl tracking-wide">
            FinAxis
          </h2>
          <button
            className="md:hidden text-white hover:text-gray-300 p-1 rounded"
            onClick={handleCloseSidebar}
          >
            <X className="w-4 h-4" />
          </button>
        </div> */}

        {/* Menu Content - Added flex-1 to take up remaining space */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
            onClick={() => setGeneralMenuOpen(!generalMenuOpen)}
          >
            <span className="text-xs sm:text-sm">Menu</span>
            <Plus className="w-3 sm:w-4 h-3 sm:h-4" />
          </div>

          {generalMenuOpen && (
            <div className="ml-1 mt-2 space-y-1">
              <div
                className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
                onClick={() => setPlanningOpen(!planningOpen)}
              >
                <span className="text-xs sm:text-sm">Planning</span>
                {planningOpen ? (
                  <ChevronDown className="w-3 sm:w-3 h-3 sm:h-3" />
                ) : (
                  <ChevronRight className="w-3 sm:w-3 h-3 sm:h-3" />
                )}
              </div>

              {planningOpen && (
                <div className="ml-3 mt-1 pl-1 border-l border-gray-600 space-y-1">
                  <Link
                    to="/dashboard/project-budget-status"
                    className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                      selectedPage === "/dashboard/project-budget-status"
                        ? "bg-gray-800"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick("/dashboard/project-budget-status");
                    }}
                  >
                    Project Planning
                  </Link>
                  {/* <Link
                    to="/dashboard/new-business"
                    className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                      selectedPage === "/dashboard/new-business" ? "bg-gray-800 underline" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick("/dashboard/new-business");
                    }}
                  >
                    New Business
                  </Link> */}
                </div>
              )}

              {currentUserRole === "admin" && (
                <>
                  <div
                    className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
                    onClick={() => setConfigurationOpen(!configurationOpen)}
                  >
                    <span className="text-xs sm:text-sm">Configuration</span>
                    {configurationOpen ? (
                      <ChevronDown className="w-3 sm:w-3 h-3 sm:h-3" />
                    ) : (
                      <ChevronRight className="w-3 sm:w-3 h-3 sm:h-3" />
                    )}
                  </div>

                  {configurationOpen && (
                    <div className="ml-3 mt-1 pl-1 border-l border-gray-600 space-y-1">
                      <Link
                        to="/dashboard/pool-rate-tabs"
                        className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded whitespace-nowrap transition ease-in-out duration-200 ${
                          selectedPage === "/dashboard/pool-rate-tabs"
                            ? "bg-gray-800 "
                            : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick("/dashboard/pool-rate-tabs");
                        }}
                      >
                       Forward Rate
                      </Link>
                      {/* <div
                        className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
                        onClick={() => setPoolMappingOpen(!poolMappingOpen)}
                      >
                        <span className="text-xs sm:text-sm">Pool Mapping</span>
                        {poolMappingOpen ? (
                          <ChevronDown className="w-3 sm:w-3 h-3 sm:h-3" />
                        ) : (
                          <ChevronRight className="w-3 sm:w-3 h-3 sm:h-3" />
                        )}
                      </div> */}

                      {/* {poolMappingOpen && (
                        <div className="ml-3 mt-1 pl-1 border-l border-gray-600 space-y-1">
                          <Link
                            to="/dashboard/pool-configuration"
                            className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                              selectedPage === "/dashboard/pool-configuration"
                                ? "bg-gray-800"
                                : ""
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleLinkClick("/dashboard/pool-configuration");
                            }}
                          >
                            Org Account
                          </Link>
                          <Link
                            to="/dashboard/template-pool-mapping"
                            className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                              selectedPage ===
                              "/dashboard/template-pool-mapping"
                                ? "bg-gray-800"
                                : ""
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleLinkClick(
                                "/dashboard/template-pool-mapping"
                              );
                            }}
                          >
                            Template Pool Mapping
                          </Link>
                        </div>
                      )} */}
                      <Link
                        to="/dashboard/ceiling-configuration"
                        className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                          selectedPage === "/dashboard/ceiling-configuration"
                            ? "bg-gray-800"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick("/dashboard/ceiling-configuration");
                        }}
                      >
                        Ceiling Configuration
                      </Link>
                      {/* <Link
                        to="/dashboard/template"
                        className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                          selectedPage === "/dashboard/template"
                            ? "bg-gray-800 "
                            : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick("/dashboard/template");
                        }}
                      >
                        Burden Setup
                      </Link> */}
                      <Link
                        to="/dashboard/global-configuration"
                        className={`block text-xs text-gray-200 hover:text-white  hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                          selectedPage === "/dashboard/global-configuration"
                            ? "bg-gray-800 "
                            : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick("/dashboard/global-configuration");
                        }}
                      >
                        Settings
                      </Link>
                      <Link
                        to="/dashboard/prospective-id-setup"
                        className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                          selectedPage === "/dashboard/prospective-id-setup"
                            ? "bg-gray-800"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick("/dashboard/prospective-id-setup");
                        }}
                      >
                        Prospective ID Setup
                      </Link>
                      <Link
                        to="/dashboard/display-settings"
                        className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                          selectedPage === "/dashboard/display-settings"
                            ? "bg-gray-800"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick("/dashboard/display-settings");
                        }}
                      >
                        Display Settings
                      </Link>
                      <Link
                        to="/dashboard/annual-holidays"
                        className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                          selectedPage === "/dashboard/annual-holidays"
                            ? "bg-gray-800 "
                            : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick("/dashboard/annual-holidays");
                        }}
                      >
                        Annual Holidays
                      </Link>
                      <Link
                        to="/dashboard/maintain-fiscal-year-periods"
                        className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
                          selectedPage ===
                          "/dashboard/maintain-fiscal-year-periods"
                            ? "bg-gray-800"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick(
                            "/dashboard/maintain-fiscal-year-periods"
                          );
                        }}
                      >
                        Maintain Fiscal Year Periods
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* LOGOUT BUTTON AT THE BOTTOM */}
        <div className="mt-auto pt-4 border-t border-gray-700 pb-10">
          {/* <button
            className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2 w-full rounded-md hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button> */}
          {/* Version number fixed at bottom right */}
          <div className="fixed bottom-2 right-2 text-xs text-white font-mono select-none pointer-events-none pb-10">
            v{appVersion}
          </div>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={handleCloseSidebar}
        ></div>
      )}
    </div>
  );
};

export default NavigationSidebar;
