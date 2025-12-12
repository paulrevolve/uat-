import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const RevenueSetupComponent = ({ selectedPlan, revenueAccount }) => {
  const [atRiskValue, setAtRiskValue] = useState("");
  const [revenueType, setRevenueType] = useState("");
  const [revenueAccountState, setRevenueAccountState] = useState("");
  const [labFeeRt, setLabFeeRt] = useState("");
  const [nonLabFeeRt, setNonLabFeeRt] = useState("");
  const [revenueFormula, setRevenueFormula] = useState("");
  const [formulaOptions, setFormulaOptions] = useState([]);
  const [labCostFl, setLabCostFl] = useState(false);
  const [labBurdFl, setLabBurdFl] = useState(false);
  const [labFeeCostFl, setLabFeeCostFl] = useState(false);
  const [labFeeHrsFl, setLabFeeHrsFl] = useState(false);
  const [labTmFl, setLabTmFl] = useState(false);
  const [nonLabCostFl, setNonLabCostFl] = useState(false);
  const [nonLabBurdFl, setNonLabBurdFl] = useState(false);
  const [nonLabFeeCostFl, setNonLabFeeCostFl] = useState(false);
  const [nonLabFeeHrsFl, setNonLabFeeHrsFl] = useState(false);
  const [nonLabTmFl, setNonLabTmFl] = useState(false);
  const [overrideFundingCeilingFl, setOverrideFundingCeilingFl] =
    useState(false);
  const [overrideSettingsFl, setOverrideSettingsFl] = useState(false);
  const [overrideRevAdjustmentsFl, setOverrideRevAdjustmentsFl] =
    useState(false);
  const [useFixedRevenueFl, setUseFixedRevenueFl] = useState(false);
  const [setupId, setSetupId] = useState(0);
  const [isSaving, setIsSaving] = useState(false);


  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-CA");
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Function to handle fee rate validation
  // const handleFeeRateChange = (value, setter) => {
  //   // Allow empty string or valid numbers
  //   if (value === "") {
  //     setter("");
  //     return;
  //   }

  //   // Parse the value as float
  //   const numValue = parseFloat(value);

  //   // Check if it's a valid number and within 0-100 range
  //   if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
  //     setter(value);
  //   } else if (!isNaN(numValue) && numValue > 100) {
  //     // If value exceeds 100, show toast notification and don't update
  //     toast.warning("Fee Rate % cannot exceed 100%", {
  //       toastId: "fee-rate-limit-warning",
  //       autoClose: 3000,
  //     });
  //     // Don't update the state, keep the previous valid value
  //   }
  //   // If invalid number or negative, don't update the state (ignore the input)
  // };

  const handleFeeRateChange = (value, setter) => {
    // Allow empty string
    if (value === "") {
      setter("");
      return;
    }

    // 🚫 Block negatives, plus signs, or stray characters like "-"
    if (/[^\d.]/.test(value)) {
      return; // reject if contains anything except digits or dot
    }

    // 🚫 Prevent multiple dots
    if ((value.match(/\./g) || []).length > 1) {
      return;
    }

    // 🚫 Prevent leading zeros like "00" unless it's "0.something"
    if (/^0\d/.test(value)) {
      return;
    }

    // Now safe to parse
    const numValue = parseFloat(value);

    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setter(value); // ✅ valid
    } else if (!isNaN(numValue) && numValue > 100) {
      toast.warning("Fee Rate % cannot exceed 100%", {
        toastId: "fee-rate-limit-warning",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {

    setRevenueFormula("");
  setRevenueType("");
  setSetupId(0);
    setRevenueAccountState(revenueAccount || "");

    axios
      .get(`${backendUrl}/RevFormula`)
      .then((response) => {
        // console.log("RevFormula API response:", response.data);
        setFormulaOptions(response.data);
        // if (response.data.length > 0) {
        //   setRevenueFormula(response.data[0].formulaCd);
        //   setRevenueType(response.data[0].formulaCd); // Modified: Set revenueType to keep in sync
        // }
      })
      .catch(
        (error) => {}
        // console.error("Error fetching revenue formulas:", error)
      );

    if (selectedPlan?.projId && selectedPlan?.version && selectedPlan?.plType) {
      axios
        .get(
          `${backendUrl}/ProjBgtRevSetup/GetByProjectId/${selectedPlan.projId}/${selectedPlan.version}/${selectedPlan.plType}`
        )
        .then((response) => {
          const data = response.data;
          // console.log("ProjBgtRevSetup GET response:", data);
          setSetupId(data.id || 0);

          setRevenueFormula(data.revType || ""); // Modified: Set revenueFormula from revType
          setRevenueType(data.revType || ""); // Modified: Also set revenueType to keep in sync
          // setAtRiskValue(data.atRiskAmt.toString());
          setAtRiskValue(Number(data.atRiskAmt).toLocaleString());
          setRevenueAccountState(data.revAcctId || revenueAccount || "");
          setLabFeeRt(data.labFeeRt.toString());
          setNonLabFeeRt(data.nonLabFeeRt.toString());
          setLabCostFl(data.labCostFl || false);
          setLabBurdFl(data.labBurdFl || false);
          setLabFeeCostFl(data.labFeeCostFl || false);
          setLabFeeHrsFl(data.labFeeHrsFl || false);
          setLabTmFl(data.labTmFl || false);
          setNonLabCostFl(data.labCostFl || false);
          setNonLabBurdFl(data.labBurdFl || false);
          setNonLabFeeCostFl(data.labFeeCostFl || false);
          setNonLabFeeHrsFl(data.labFeeHrsFl || false);
          setNonLabTmFl(data.nonLabTmFl || false);
          setOverrideFundingCeilingFl(data.overrideFundingCeilingFl || false);
          setOverrideSettingsFl(data.overrideRevSettingFl || false);
          setOverrideRevAdjustmentsFl(data.useBillBurdenRates || false);
          setUseFixedRevenueFl(data.overrideRevAmtFl || false);
        })
        .catch(
          (error) => {}
          // console.error("Error fetching project budget revenue setup:", error)
        );
    }
  }, [selectedPlan, revenueAccount,backendUrl]);

  // const handleSave = () => {
  //   if (!revenueFormula || revenueFormula === "") {
  //     toast.error("Please select revenue formula", {
  //       toastId: "revenue-setup-save-select",
  //       autoClose: 3000,
  //     });
  //     return;
  //   }
  //   const payload = {
  //     id: setupId,
  //     projId: selectedPlan?.projId || "",
  //     revType: revenueFormula, // Modified: Use revenueFormula instead of revenueType
  //     revAcctId: revenueAccountState,
  //     dfltFeeRt: parseFloat(labFeeRt) || 0,
  //     labCostFl,
  //     labBurdFl,
  //     labFeeCostFl,
  //     labFeeHrsFl,
  //     labFeeRt: parseFloat(labFeeRt) || 0,
  //     labTmFl,
  //     nonLabCostFl,
  //     nonLabBurdFl,
  //     nonLabFeeCostFl,
  //     nonLabFeeHrsFl,
  //     nonLabFeeRt: parseFloat(nonLabFeeRt) || 0,
  //     nonLabTmFl,
  //     useBillBurdenRates: overrideRevAdjustmentsFl,
  //     overrideFundingCeilingFl,
  //     overrideRevAmtFl: useFixedRevenueFl,
  //     overrideRevAdjFl: true,
  //     overrideRevSettingFl: overrideSettingsFl,
  //     rowVersion: 0,
  //     modifiedBy: "user",
  //     timeStamp: new Date().toISOString(),
  //     companyId: "company",
  //     // atRiskAmt: parseFloat(atRiskValue) || 0,
  //     atRiskAmt: parseFloat(atRiskValue.replace(/,/g, "")) || 0,
  //     versionNo: selectedPlan?.version || 0,
  //     bgtType: selectedPlan?.plType || "",
  //   };

  //   axios
  //     .post(`${backendUrl}/ProjBgtRevSetup/upsert`, payload)
  //     .then((response) => {
  //       // console.log("Save successful:", response.data);
  //       toast.success("Data saved successfully!", {
  //         toastId: "revenue-setup-save-success",
  //         autoClose: 3000,
  //       });
  //     })
  //     .catch((error) => {
  //       // console.error("Error saving data:", error);
  //       toast.error(
  //         "Failed to save data: " +
  //           (error.response?.data?.message || error.message),
  //         {
  //           toastId: "revenue-setup-save-error",
  //           autoClose: 3000,
  //         }
  //       );
  //     });
  // };

  const handleSave = () => {
  if (!revenueFormula || revenueFormula === "") {
    toast.error("Please select revenue formula", {
      toastId: "revenue-setup-save-select",
      autoClose: 3000,
    });
    return;
  }

  const payload = {
    id: setupId,
    projId: selectedPlan?.projId || "",
    revType: revenueFormula,
    revAcctId: revenueAccountState,
    dfltFeeRt: parseFloat(labFeeRt) || 0,
    labCostFl,
    labBurdFl,
    labFeeCostFl,
    labFeeHrsFl,
    labFeeRt: parseFloat(labFeeRt) || 0,
    labTmFl,
    nonLabCostFl,
    nonLabBurdFl,
    nonLabFeeCostFl,
    nonLabFeeHrsFl,
    nonLabFeeRt: parseFloat(nonLabFeeRt) || 0,
    nonLabTmFl,
    useBillBurdenRates: overrideRevAdjustmentsFl,
    overrideFundingCeilingFl,
    overrideRevAmtFl: useFixedRevenueFl,
    overrideRevAdjFl: true,
    overrideRevSettingFl: overrideSettingsFl,
    rowVersion: 0,
    modifiedBy: "user",
    timeStamp: new Date().toISOString(),
    companyId: "company",
    atRiskAmt: parseFloat(atRiskValue.replace(/,/g, "")) || 0,
    versionNo: selectedPlan?.version || 0,
    bgtType: selectedPlan?.plType || "",
  };

  setIsSaving(true);
  toast.info("Saving revenue setup...", {
    toastId: "revenue-setup-saving",
    autoClose: false,
  });

  axios
    .post(`${backendUrl}/ProjBgtRevSetup/upsert`, payload)
    .then((response) => {
      toast.dismiss("revenue-setup-saving");
      toast.success("Data saved successfully!", {
        toastId: "revenue-setup-save-success",
        autoClose: 3000,
      });
    })
    .catch((error) => {
      toast.dismiss("revenue-setup-saving");
      toast.error(
        "Failed to save data: " +
          (error.response?.data?.message || error.message),
        {
          toastId: "revenue-setup-save-error",
          autoClose: 3000,
        }
      );
    })
    .finally(() => {
      setIsSaving(false);
    });
};


  return (
    <div className=" p-2 sm:p-4 bg-gray rounded shadow min-h-[150px] scroll-mt-16">
      <div className="flex flex-col space-y-4">
        {/* <div>
          <label className="text-sm font-normal">Revenue Formula</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 w-full text-sm font-normal mt-1"
            value={revenueFormula}
            onChange={(e) => {
              setRevenueFormula(e.target.value);
              setRevenueType(e.target.value); // Modified: Update revenueType to keep in sync
            }}
          >
            {formulaOptions.map((option) => (
              <option key={option.formulaCd} value={option.formulaCd}>
                {option.formulaDesc}
              </option>
            ))}
          </select>
        </div> */}
        <div>
          <label className="text-sm font-normal">Revenue Formula</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 w-full text-sm font-normal mt-1"
            value={revenueFormula}
            onChange={(e) => {
              setRevenueFormula(e.target.value);
              setRevenueType(e.target.value); // Modified: Update revenueType to keep in sync
            }}
          >
            <option value="">---------Select----------</option>
            {formulaOptions.map((option) => (
              <option key={option.formulaCd} value={option.formulaCd}>
                {option.formulaDesc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-normal mr-2">
            Override Funding Ceiling
          </label>
          <input
            type="checkbox"
            className="text-sm font-normal"
            checked={overrideFundingCeilingFl}
            onChange={(e) => setOverrideFundingCeilingFl(e.target.checked)}
          />
        </div>
        <div>
          <label className="text-sm font-normal mr-2">Override Settings</label>
          <input
            type="checkbox"
            className="text-sm font-normal"
            checked={overrideSettingsFl}
            onChange={(e) => setOverrideSettingsFl(e.target.checked)}
          />
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
          <div className="flex-1">
            <label className="text-sm font-normal mr-2">At Risk Value</label>
            <input
              type="text"
              className={`border border-gray-300 rounded px-2 py-1 w-full sm:w-24 text-sm font-normal ${
                !overrideFundingCeilingFl
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""
              }`}
              value={atRiskValue}
              onChange={(e) => {
                // remove non-digits (ignore commas, decimals, etc.)
                const rawDigits = e.target.value.replace(/\D/g, "");

                if (rawDigits === "") {
                  setAtRiskValue("");
                  return;
                }

                // interpret as cents
                const cents = parseInt(rawDigits, 10);

                // divide by 100 to get dollars
                const dollars = cents / 100;

                // format in US currency style with 2 decimals
                const formatted = dollars.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });

                setAtRiskValue(formatted);
              }}
              disabled={!overrideFundingCeilingFl}
            />
          </div>

          {/* <div className="flex-1">
            <label className="text-sm font-normal mr-2">At Risk Value</label>
            <input
              type="text"
              className={`border border-gray-300 rounded px-2 py-1 w-full sm:w-24 text-sm font-normal ${
                !overrideFundingCeilingFl
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""
              }`}
              value={atRiskValue}
              onChange={(e) => {
                // remove commas so we can parse
                const raw = e.target.value.replace(/,/g, "");
                if (!isNaN(raw) && raw !== "") {
                  setAtRiskValue(Number(raw).toLocaleString()); // format with commas
                } else {
                  setAtRiskValue(""); // allow clearing input
                }
              }}
              disabled={!overrideFundingCeilingFl}
            />
          </div> */}

          {/* <div className="flex-1">
            <label className="text-sm font-normal mr-2">At Risk Value</label>
            <input
              type="text"
              className={`border border-gray-300 rounded px-2 py-1 w-full sm:w-24 text-sm font-normal ${
                !overrideFundingCeilingFl
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""
              }`}
              value={atRiskValue}
              onChange={(e) => setAtRiskValue(e.target.value)}
              disabled={!overrideFundingCeilingFl}
            />
          </div> */}
          <div className="flex-1">
            <label className="text-sm font-normal mr-2">Revenue Account:</label>
            <span className="text-sm font-normal">{revenueAccountState}</span>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <table className="w-full table sm:w-auto">
            <tbody className="tbody">
              <tr>
                <td className="thead text-center"></td>
                <td className="thead text-center">Rev on Cost</td>
                <td className="thead text-center">Rev on Burden</td>
                <td className="thead text-center">Fee on Cost/Burden</td>
                <td className="thead text-center">Fee on Hours</td>
                <td className="thead text-center">Fee Rate %</td>
                <td className="thead text-center">Use T&M Rates</td>
              </tr>
              <tr>
                <td className="thead text-center">Labor</td>
                <td className="tbody-td">
                  <input
                    type="checkbox"
                    className="text-sm font-normal"
                    checked={labCostFl}
                    onChange={(e) => setLabCostFl(e.target.checked)}
                  />
                </td>
                <td className="tbody-td">
                  <input
                    type="checkbox"
                    className="text-sm font-normal"
                    checked={labBurdFl}
                    onChange={(e) => setLabBurdFl(e.target.checked)}
                  />
                </td>
                <td className="tbody-td">
                  <input
                    type="checkbox"
                    className="text-sm font-normal"
                    checked={labFeeCostFl}
                    onChange={(e) => setLabFeeCostFl(e.target.checked)}
                  />
                </td>
                <td className="tbody-td">
                  <input
                    type="checkbox"
                    className="text-sm font-normal"
                    checked={labFeeHrsFl}
                    onChange={(e) => setLabFeeHrsFl(e.target.checked)}
                  />
                </td>
                <td className="tbody-td">
                  <input
                    type="string"
                    step="any"
                    min="0"
                    max="100"
                    className="w-full p-1 border rounded text-sm font-normal"
                    style={{ appearance: "none" }}
                    value={labFeeRt}
                    onChange={(e) =>
                      handleFeeRateChange(e.target.value, setLabFeeRt)
                    }
                  />
                </td>
                <td className="tbody-td">
                  <input
                    type="checkbox"
                    className="text-sm font-normal"
                    checked={labTmFl}
                    onChange={(e) => setLabTmFl(e.target.checked)}
                  />
                </td>
              </tr>
              <tr>
                <td className="thead text-center">Non-Labor</td>
                <td className="tbody-td">
                  <input
                    type="checkbox"
                    className="text-sm font-normal"
                    checked={nonLabCostFl}
                    onChange={(e) => setNonLabCostFl(e.target.checked)}
                  />
                </td>
                <td className="tbody-td">
                  <input
                    type="checkbox"
                    className="text-sm font-normal"
                    checked={nonLabBurdFl}
                    onChange={(e) => setNonLabBurdFl(e.target.checked)}
                  />
                </td>
                <td className="tbody-td">
                  <input
                    type="checkbox"
                    className="text-sm font-normal"
                    checked={nonLabFeeCostFl}
                    onChange={(e) => setNonLabFeeCostFl(e.target.checked)}
                  />
                </td>
                <td className="tbody-td">
                  <input
                    type="checkbox"
                    className="text-sm font-normal"
                    checked={nonLabFeeHrsFl}
                    onChange={(e) => setNonLabFeeHrsFl(e.target.checked)}
                  />
                </td>
                <td className="tbody-td">
                  <input
                    type="string"
                    step="any"
                    min="0"
                    max="100"
                    className="w-full p-1 border rounded text-sm font-normal"
                    style={{ appearance: "none" }}
                    value={nonLabFeeRt}
                    onChange={(e) =>
                      handleFeeRateChange(e.target.value, setNonLabFeeRt)
                    }
                  />
                </td>
                <td className="tbody-td">
                  <input
                    type="checkbox"
                    className="text-sm font-normal"
                    checked={nonLabTmFl}
                    onChange={(e) => setNonLabTmFl(e.target.checked)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-end w-full">
          {/* <button
            className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-normal mt-4 cursor-pointer w-25"
            onClick={handleSave}
          >
            Save
          </button> */}
          <button
  className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-normal mt-4 cursor-pointer w-25 disabled:opacity-60"
  onClick={handleSave}
  disabled={isSaving}
>
  {isSaving ? "Saving..." : "Save"}
</button>
        </div>
      </div>
    </div>
  );
};

export default RevenueSetupComponent;
