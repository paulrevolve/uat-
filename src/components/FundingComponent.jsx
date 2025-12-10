import React, { useEffect, useState } from "react";
import { backendUrl } from "./config";

const FundingComponent = ({ selectedProjectId }) => {
  const [fundingData, setFundingData] = useState([
    {
      label: "Cost Fee + Funding",
      funding: "",
      budget: "",
      balance: "",
      percent: "",
    },
    { label: "Cost", funding: "", budget: "", balance: "", percent: "" },
    // { label: "Profit", funding: "", budget: "", balance: "", percent: "" },
  ]);

  useEffect(() => {
    const roundTwoDecimals = (num) => {
      if (num === null || num === undefined || num === "") return "";
      const parsed = parseFloat(num);
      if (isNaN(parsed)) return "";
      // toFixed returns a string like "1234.56"
      // Then format with commas using toLocaleString
      return parsed.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const fetchData = async () => {
      try {
        const response = await fetch(
          `${backendUrl}/Project/GetFunding/${selectedProjectId}`
        );
        let data = await response.json();

        const roundedData = data.slice(0, 3).map((item) => ({
          funding: roundTwoDecimals(item.funding),
          budget: roundTwoDecimals(item.budget),
          balance: roundTwoDecimals(item.balance),
          percent: roundTwoDecimals(item.percent),
        }));

        setFundingData([
          { label: "Cost Fee + Funding", ...roundedData[0] },
          { label: "Cost", ...roundedData[1] },
          // { label: "Profit", ...roundedData[2] },
        ]);
      } catch (error) {
        setFundingData([
          {
            label: "Cost Fee + Funding",
            funding: "",
            budget: "",
            balance: "",
            percent: "",
          },
          { label: "Cost", funding: "", budget: "", balance: "", percent: "" },
          {
            // label: "Profit",
            funding: "",
            budget: "",
            balance: "",
            percent: "",
          },
        ]);
      }
    };

    if (selectedProjectId) {
      fetchData();
    }
  }, [selectedProjectId]);

  return (
    <div className="border-line overflow-hidden">
      <table className="w-full table">
        <thead className="thead">
          <tr>
            <th className="th-thead"></th>
            <th className="th-thead">Funded</th>
            <th className="th-thead">Budget</th>
            <th className="th-thead">Balance</th>
            <th className="th-thead">Percent</th>
          </tr>
        </thead>
        <tbody className="tbody">
          {fundingData.map((row) => (
            <tr key={row.label}>
              <td className="tbody-td">{row.label}</td>
              <td className="tbody-td">{row.funding}</td>
              <td className="tbody-td">{row.budget}</td>
              <td className="tbody-td">{row.balance}</td>
              <td className="tbody-td">{row.percent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FundingComponent;
