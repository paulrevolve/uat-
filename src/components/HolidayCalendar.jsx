import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaSave, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const years = Array.from({ length: 2035 - 2020 + 1 }, (_, i) => 2020 + i);
const getCurrentYear = () => new Date().getFullYear();
const API_BASE = `${backendUrl}/HolidayCalendar`;

// const formatDate = (input) => {
//   if (!input) return ""; // Safeguard against undefined or null
//   const utcDate = new Date(input); // Assume input is UTC string or Date
//   // Convert to browser local date by adding offset
//   const localDate = new Date(
//     utcDate.getTime() + new Date().getTimezoneOffset() * 60000 * -1
//   );
//   const mm = String(localDate.getMonth() + 1).padStart(2, "0");
//   const dd = String(localDate.getDate()).padStart(2, "0");
//   const yyyy = localDate.getFullYear();
//   return `${mm}/${dd}/${yyyy}`; // Enforce MM/DD/YYYY
// };

// const toISODate = (dateStr) => {
//   if (!dateStr) return new Date().toISOString(); // Fallback to current date if empty
//   const [mm, dd, yyyy] = dateStr.split("/"); // Parse from MM/DD/YYYY
//   const localDate = new Date(yyyy, mm - 1, dd);
//   // Convert to UTC by subtracting browser offset
//   const utcDate = new Date(
//     localDate.getTime() - new Date().getTimezoneOffset() * 60000
//   );
//   return utcDate.toISOString();
// };

const formatDate = (input) => {
  if (!input) return "";
  // Extract date part (YYYY-MM-DD) from ISO string without timezone math
  const datePart = input.length >= 10 ? input.slice(0, 10) : input;
  const [yyyy, mm, dd] = datePart.split("-");
  return `${mm}/${dd}/${yyyy}`;
};

const toISODate = (dateStr) => {
  if (!dateStr) return null;
  const [mm, dd, yyyy] = dateStr.split("/");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};


const emptyHoliday = (year) => ({
  id: null,
  holiday: "",
  date: "",
  holidayType: "",
  state: "",
  year,
  isNew: true,
  isEditing: true,
});

const AnnualHolidaysPage = () => {
  const [year, setYear] = useState(getCurrentYear());
  const [holidays, setHolidays] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHolidays = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(API_BASE);
        const filtered = (res.data || [])
          .filter((h) => Number(h.year) === Number(year))
          .map((h) => ({
            id: h.id,
            holiday: h.holiday ?? h.name,
            date: formatDate(h.date),
            holidayType: h.type || (h.ispublicholiday ? "Holiday" : "Optional"),
            state: h.state || "",
            year: h.year,
            isNew: false,
            isEditing: false,
          }));
        setHolidays(filtered);
      } catch (err) {
        // console.error('Error fetching holidays:', err);
        toast.error("Failed to load holidays. Please try again.");
        setHolidays([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHolidays();
  }, [year]);

  const filteredHolidays = searchTerm
    ? holidays.filter(
        (h) =>
          h.date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.holiday?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.state?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : holidays;

  const handleYearChange = useCallback(
    (e) => setYear(Number(e.target.value)),
    []
  );

  const handleAddNewRow = useCallback(
    () => setHolidays((prev) => [emptyHoliday(year), ...prev]),
    [year]
  );

  const handleDeleteRow = useCallback(async (holiday) => {
    if (holiday.id) {
      setIsLoading(true);
      try {
        await axios.delete(`${API_BASE}/${holiday.id}`);
        setHolidays((prev) => prev.filter((h) => h.id !== holiday.id));
        toast.success("Holiday deleted successfully!");
      } catch (err) {
        // console.error('Error deleting holiday:', err);
        toast.error("Failed to delete holiday.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setHolidays((prev) => prev.filter((h) => h !== holiday));
    }
  }, []);

  const handleSaveHoliday = useCallback(
    async (holidayToSave) => {
      // Uncomment and adjust if you want validation back
      // if (!holidayToSave.holiday || !holidayToSave.date || !holidayToSave.state || !holidayToSave.holidayType) {
      //   toast.warn("All fields required.");
      //   return;
      // }
      const payload = {
        id: holidayToSave.id || 0,
        year,
        date: toISODate(holidayToSave.date),
        type: holidayToSave.holidayType || "General",
        name: holidayToSave.holiday,
        ispublicholiday: holidayToSave.holidayType === "Holiday",
        state: holidayToSave.state,
        remarks: "",
      };
      setIsLoading(true);
      try {
        let saved;
        if (holidayToSave.id) {
          const res = await axios.put(
            `${API_BASE}/${holidayToSave.id}`,
            payload
          );
          saved = res.data;
          toast.success("Holiday updated successfully!");
        } else {
          const res = await axios.post(API_BASE, payload);
          saved = res.data;
          toast.success("Holiday created successfully!");
        }
        // Log for debugging
        // console.log("Saved response:", saved);
        setHolidays((prev) =>
          prev.map((currentHoliday) =>
            currentHoliday === holidayToSave
              ? {
                  ...currentHoliday,
                  ...saved,
                  holiday: saved.name || saved.holiday || holidayToSave.holiday,
                  // date: saved.date || holidayToSave.date,
                  date: formatDate(saved.date || holidayToSave.date),
                  holidayType:
                    saved.type ||
                    (saved.ispublicholiday ? "Holiday" : "Optional"),
                  state: saved.state,
                  isNew: false,
                  isEditing: false,
                }
              : currentHoliday
          )
        );
      } catch (err) {
        // console.error("Error saving holiday:", err);
        toast.error("Error saving holiday. Try Again!");
      } finally {
        setIsLoading(false);
      }
    },
    [year]
  );

  const handleEditRow = useCallback((holiday) => {
    setHolidays((prev) =>
      prev.map((h) => (h === holiday ? { ...h, isEditing: true } : h))
    );
  }, []);

  const handleCancelEdit = useCallback((holiday) => {
    if (holiday.isNew) {
      setHolidays((prev) => prev.filter((h) => h !== holiday));
    } else {
      setHolidays((prev) =>
        prev.map((h) => (h === holiday ? { ...h, isEditing: false } : h))
      );
    }
  }, []);

  const handleHolidayChange = useCallback(
    (holiday, key, value) => {
      if (key === "date") {
        const selectedDate = value; 
        const isDuplicate = holidays.some(
          (h) => h !== holiday && h.date === selectedDate
        );
        if (isDuplicate) {
          toast.warn(
            "A holiday already exists on this date. Please choose a different date."
          );
          return; // Prevent setting the duplicate date
        }
      }
      setHolidays((prev) =>
        prev.map((h) => (h === holiday ? { ...h, [key]: value } : h))
      );
    },
    [holidays]
  );

  // const parseDate = (dateStr) => {
  //   if (!dateStr) return null;
  //   const [mm, dd, yyyy] = dateStr.split("/"); // Parse from MM/DD/YYYY
  //   return new Date(Date.UTC(yyyy, mm - 1, dd)); // Parse as UTC to avoid local offset
  // };

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [mm, dd, yyyy] = dateStr.split("/");
  // Create JS Date as local midnight (avoiding UTC offset shift)
  return new Date(yyyy, mm - 1, dd);
};



  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl px-8 bg-white p-8 space-y-6 border-line">
        <h2 className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
          Setup Annual Holidays
        </h2>
        <div className="bg-gray-50 p-4  grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-line">
          <div className="flex items-center space-x-2">
            <label
              htmlFor="year"
              className="text-sm font-medium whitespace-nowrap text-gray-900"
            >
              Year <span className="text-red-500">*</span>
            </label>
            <select
              id="year"
              value={year}
              onChange={handleYearChange}
              className="w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1 md:col-span-3 flex flex-row justify-end gap-2">
            <button
              onClick={handleAddNewRow}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm whitespace-nowrap"
            >
              New
            </button>
            <input
              type="text"
              placeholder="Search holiday..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-line">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Target Year Holidays
          </h3>
          {isLoading && <p className="text-center text-gray-500">Loading...</p>}

          <div className="border-line overflow-hidden">
            <div className="overflow-x-auto max-h-180 overflow-y-auto ">
              <table className=" table">
                <thead className="thead">
                  <tr>
                    <th className="th-thead uppercase tracking-wider">Date</th>
                    <th className="th-thead uppercase tracking-wider">
                      Description
                    </th>
                    <th className="th-thead uppercase tracking-wider">
                      Holiday Status
                    </th>
                    <th className="th-thead uppercase tracking-wider">State</th>
                    <th className="th-thead uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="  divide-y divide-gray-200 tbody">
                  {filteredHolidays.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="tbody-td">
                        No holidays available or matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredHolidays.map((holiday, idx) => (
                      <tr key={holiday.id || `new-${idx}`}>
                        {/* Date */}
                        <td className="tbody-td">
                          {holiday.isEditing ? (
                            <DatePicker
                              selected={parseDate(holiday.date)}
                              // onChange={(date) =>
                              //   handleHolidayChange(
                              //     holiday,
                              //     "date",
                              //     formatDate(date)
                              //   )
                              // }
                              onChange={(date) => {
  if (!date) {
    handleHolidayChange(holiday, "date", "");
    return;
  }
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  handleHolidayChange(holiday, "date", `${mm}/${dd}/${yyyy}`);
}}


                              dateFormat="MM/dd/yyyy"
                              placeholderText="MM/DD/YYYY"
                              className="w-full bg-white border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            holiday.date
                          )}
                        </td>
                        {/* Description */}
                        <td className="tbody-td">
                          {holiday.isEditing ? (
                            <input
                              type="text"
                              value={holiday.holiday}
                              onChange={(e) =>
                                handleHolidayChange(
                                  holiday,
                                  "holiday",
                                  e.target.value
                                )
                              }
                              className="w-full bg-white border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Holiday Description"
                            />
                          ) : (
                            holiday.holiday
                          )}
                        </td>
                        {/* Holiday Status */}
                        <td className="tbody-td">
                          {holiday.isEditing ? (
                            <select
                              value={holiday.holidayType}
                              onChange={(e) =>
                                handleHolidayChange(
                                  holiday,
                                  "holidayType",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none"
                            >
                              <option value="">-- Select --</option>
                              <option value="Weekend">Weekend</option>
                              <option value="Holiday">Holiday</option>
                              <option value="Optional">Optional</option>
                            </select>
                          ) : (
                            <span>{holiday.holidayType}</span>
                          )}
                        </td>
                        {/* State */}
                        <td className="tbody-td">
                          <input
                            type="text"
                            value={holiday.state}
                            onChange={(e) =>
                              handleHolidayChange(
                                holiday,
                                "state",
                                e.target.value
                              )
                            }
                            className={`w-full bg-white border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 ${
                              holiday.isEditing ? "focus:ring-blue-500" : ""
                            }`}
                            placeholder="State Name"
                            disabled={!holiday.isEditing}
                          />
                        </td>
                        {/* Actions */}
                        <td className="tbody-td flex flex-row justify-end items-center space-x-2">
                          {holiday.isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveHoliday(holiday)}
                                disabled={isLoading}
                                className="text-green-700 hover:text-green-800"
                                title="Save"
                                style={{ background: "none", border: "none" }}
                              >
                                <FaSave size={18} />
                              </button>
                              <button
                                onClick={() => handleCancelEdit(holiday)}
                                disabled={isLoading}
                                className="text-gray-500 hover:text-gray-700"
                                title="Cancel"
                                style={{ background: "none", border: "none" }}
                              >
                                <FaTimes size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(holiday)}
                                disabled={isLoading}
                                className="text-gray-400 hover:text-gray-800"
                                title="Delete"
                                style={{ background: "none", border: "none" }}
                              >
                                <FaTrash size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditRow(holiday)}
                                disabled={isLoading}
                                className="text-blue-400 hover:text-blue-700"
                                title="Edit"
                                style={{ background: "none", border: "none" }}
                              >
                                <FaEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(holiday)}
                                disabled={isLoading}
                                className="text-gray-400 hover:text-gray-800"
                                title="Delete"
                                style={{ background: "none", border: "none" }}
                              >
                                <FaTrash size={18} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualHolidaysPage;
