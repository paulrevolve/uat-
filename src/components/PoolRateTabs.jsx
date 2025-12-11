
import React, { useState } from "react";
import Fringe from "./Fringe";
import HR from "./HR";
import MH from "./MH";
import Overhead from "./Overhead";
import Rates from "./Rates";
import GNA from "./GNA";
import PoolRate from "./PoolRate";


const PoolRateTabs = () => {
  const [activeTab, setActiveTab] = useState("Rates");

  const tabs = [
    { id: "Rate Configure", label: "Rate Configure" },
    { id: "Rate", label: "Rate" },
    { id: "Fringe", label: "Fringe" },
    { id: "HR", label: "HR" },
    { id: "Overhead", label: "Overhead" },
    { id: "M&H", label: "M&H" },
    { id: "G&A", label: "G&A" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Rate Configure":
        return <PoolRate />;
      case "Fringe":
        return <Fringe />;
      case "HR":
        return <HR />;
      case "Overhead":
        return <Overhead />;
      case "M&H":
        return <MH />;
      case "G&A":
        return <GNA />;
      case "Rate":
        return <Rates />;
      default:
        return null;
    }
  };

  return (
    <div className="border-overall bg-white p-4">
      <h2 className="text-lg font-semibold mb-4 blue-text">
        Pool Rate Configuration
      </h2>

      {/* Tab header */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                "px-5 py-2 rounded-md text-sm font-medium shadow-sm transition-colors duration-200 " +
                (isActive
                  ? "bg-white text-blue-700 border border-blue-500"
                  : "bg-gray-100 text-gray-700 border border-transparent hover:bg-gray-200")
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content card */}
      <div className="border-line bg-white p-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PoolRateTabs;
