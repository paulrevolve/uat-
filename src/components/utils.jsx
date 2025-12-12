// export const formatDate = (dateStr) => {
//   if (!dateStr) return "";
//   try {
//     const date = new Date(dateStr);
//     if (isNaN(date.getTime())) return dateStr;
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     const year = date.getFullYear();
//     return `${month}/${day}/${year}`;
//   } catch (e) {
//     return dateStr;
//   }
// };

export const formatDate = (value) => {
  if (!value) return "N/A";
  // value like "2025-12-01"
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return `${m}/${d}/${y}`;           // 12/01/2025
  }
  return value; // as‑is fallback
};