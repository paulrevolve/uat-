import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FaSearch } from 'react-icons/fa';
import { backendUrl } from './config';

// --- CONFIGURATION & UTILS ---
const DETAIL_API_PATH = '/api/ForecastReport/GetViewData';
const ROWS_PER_PAGE = 30;

const PERIOD_MAP = {
  1: 'Jan-25',
  2: 'Feb-25',
  3: 'Mar-25',
  4: 'Apr-25',
  5: 'May-25',
  6: 'Jun-25',
  7: 'Jul-25',
  8: 'Aug-25',
  9: 'Sep-25',
  10: 'Oct-25',
  11: 'Nov-25',
  12: 'Dec-25',
};

const ALL_PERIOD_KEYS = [
  'Jan-25',
  'Feb-25',
  'Mar-25',
  'Apr-25',
  'May-25',
  'Jun-25',
  'Jul-25',
  'Aug-25',
  'Sep-25',
  'Oct-25',
  'Nov-25',
  'Dec-25',
  'FY-Total',
];

// --- HELPERS ---
const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount) || amount === 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

const determineSectionAndIndirectKey = (item) => {
  const subTotTypeNo = item.subTotTypeNo;
  const poolName = (item.poolName || '').toUpperCase();
  let section = 'LABOR';
  let indirectKey = null;

  if (subTotTypeNo === 1) {
    section = 'REVENUE_SECTION';
  } else if (subTotTypeNo === 4) {
    if (poolName.includes('FRINGE BENEFITS')) indirectKey = 'FRINGE';
    else if (poolName.includes('GENERAL & ADMIN') || poolName.includes('G&A')) indirectKey = 'GNA';
    else if (poolName.includes('OVERHEAD')) indirectKey = 'OVERHEAD';
    else if (poolName.includes('MAT & HANDLING') || poolName.includes('M&H')) indirectKey = 'MANDH';
    section = 'LABOR';
  }
  return { section, indirectKey };
};

// --- TRANSFORM DATA ---
const transformData = (detailData) => {
  const aggregatedDetailRows = {};

  detailData.forEach((item) => {
    const { section, indirectKey } = determineSectionAndIndirectKey(item);
    const detailRowKey = `${item.projId}-${item.acctId}`;
    const periodKey = PERIOD_MAP[item.pdNo]; // uses pdNo 1–10 (and 11–12 when present)

    if (!periodKey) return;

    if (!aggregatedDetailRows[detailRowKey]) {
      const base = {
        id: detailRowKey,
        project: item.projId,
        acctId: item.acctId,
        org: item.orgId || 'N/A',
        accountName: item.l1AcctName || 'Unknown',
        projectName: item.projId,
        section,
        'FY-Total': 0,
      };
      // init all month keys so columns always exist
      ALL_PERIOD_KEYS.forEach((k) => {
        if (k !== 'FY-Total') base[k] = 0;
      });
      aggregatedDetailRows[detailRowKey] = base;
    }

    const row = aggregatedDetailRows[detailRowKey];
    const monthlyAmount = parseFloat(item.ptdIncurAmt) || 0;

    if (section === 'REVENUE_SECTION') {
      row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + monthlyAmount;
    } else if (indirectKey) {
      row[`${periodKey}_${indirectKey}`] = (row[`${periodKey}_${indirectKey}`] || 0) + monthlyAmount;
    } else {
      row[periodKey] = (row[periodKey] || 0) + monthlyAmount;
      row['FY-Total'] += monthlyAmount;
    }
  });

  return Object.values(aggregatedDetailRows);
};

// --- COMPONENT ---
const ForecastReport = () => {
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const DETAIL_URL = `${backendUrl}${DETAIL_API_PATH}`;
      const resp = await fetch(DETAIL_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const detailData = await resp.json();
      const rows = transformData(detailData);
      setApiData(rows);
      if (!rows.length) setError('No data after transformation.');
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const filteredData = useMemo(() => {
    const s = projectSearchTerm.toLowerCase();
    return apiData.filter((item) => {
      if (!s) return true;
      return (
        item.project?.toLowerCase().includes(s) ||
        item.projectName?.toLowerCase().includes(s) ||
        item.accountName?.toLowerCase().includes(s)
      );
    });
  }, [apiData, projectSearchTerm]);

  // wider dimension columns
  const dimensionHeaders = [
    { key: 'project', label: 'ID', width: 100 },
    { key: 'acctId', label: 'ACCT', width: 100 },
    { key: 'accountName', label: 'ACCOUNT', width: 180 },
    { key: 'org', label: 'ORG', width: 90 },
  ];

  // all months + FY (API has 1–10 now; Nov/Dec will show "-" until data exists)
  const visiblePeriods = [
    'Jan-25',
    'Feb-25',
    'Mar-25',
    'Apr-25',
    'May-25',
    'Jun-25',
    'Jul-25',
    'Aug-25',
    'Sep-25',
    'Oct-25',
    'Nov-25',
    'Dec-25',
    'FY-Total',
  ];

  const monthlyColWidth = 95;

  const stickyPositions = useMemo(() => {
    let pos = 0;
    const map = {};
    dimensionHeaders.forEach((h) => {
      map[h.key] = { left: pos };
      pos += h.width;
    });
    return map;
  }, [dimensionHeaders]);

  const totalTableWidth = useMemo(() => {
    const stickyWidth = dimensionHeaders.reduce((s, h) => s + h.width, 0);
    const monthlyWidth = visiblePeriods.length * monthlyColWidth;
    return stickyWidth + monthlyWidth;
  }, [dimensionHeaders, visiblePeriods, monthlyColWidth]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE) || 1;
  const pageSafe = Math.min(currentPage, totalPages);
  const startIndex = (pageSafe - 1) * ROWS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
        Loading forecast...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="w-full p-2 bg-transparent">
      {/* Controls */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FaSearch className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by project / account..."
            value={projectSearchTerm}
            onChange={(e) => setProjectSearchTerm(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-300 focus:border-blue-400 outline-none"
          />
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-600 whitespace-nowrap">
          <span>
            Page {pageSafe}/{totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pageSafe - 1)}
            disabled={pageSafe === 1}
            className="px-2 py-1 bg-blue-500 text-white rounded text-[10px] disabled:bg-gray-300"
          >
            ‹
          </button>
          <button
            onClick={() => handlePageChange(pageSafe + 1)}
            disabled={pageSafe === totalPages}
            className="px-2 py-1 bg-blue-500 text-white rounded text-[10px] disabled:bg-gray-300"
          >
            ›
          </button>
        </div>
      </div>

      {/* Scroll container (no card background) */}
      <div
        style={{
          width: '100%',
          maxHeight: '100%', 
          overflowX: 'auto',
          overflowY: 'auto',
        }}
      >
        <table
          className="text-[11px] leading-tight"
          style={{ minWidth: totalTableWidth }}
        >
          <thead className="bg-slate-800 text-white sticky top-0 z-20">
            <tr>
              {dimensionHeaders.map((h) => (
                <th
                  key={h.key}
                  className="px-1 py-2 text-left font-semibold uppercase"
                  style={{
                    position: 'sticky',
                    left: stickyPositions[h.key].left,
                    width: h.width,
                    minWidth: h.width,
                    backgroundColor: '#1f2937',
                    zIndex: 30,
                    borderRight: '1px solid #4b5563',
                  }}
                >
                  {h.label}
                </th>
              ))}
              {visiblePeriods.map((p) => (
                <th
                  key={p}
                  className={`px-1 py-2 text-right font-semibold uppercase ${
                    p === 'FY-Total' ? 'bg-amber-600' : 'bg-slate-700'
                  }`}
                  style={{
                    width: monthlyColWidth,
                    minWidth: monthlyColWidth,
                    borderLeft: '1px solid #4b5563',
                  }}
                >
                  {p === 'FY-Total' ? 'FY' : p.split('-')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-slate-50">
                {dimensionHeaders.map((h) => {
                  let val = '-';
                  if (h.key === 'project') val = String(row.project || '').slice(0, 20);
                  if (h.key === 'acctId') val = String(row.acctId || '').slice(0, 20);
                  if (h.key === 'accountName') val = String(row.accountName || '').slice(0, 30);
                  if (h.key === 'org') val = row.org || '-';

                  return (
                    <td
                      key={h.key}
                      className="px-1 py-1 bg-white"
                      style={{
                        position: 'sticky',
                        left: stickyPositions[h.key].left,
                        width: h.width,
                        minWidth: h.width,
                        zIndex: 10,
                        borderRight: '1px solid #e5e7eb',
                      }}
                    >
                      <div className="truncate font-mono">{val || '-'}</div>
                    </td>
                  );
                })}
                {visiblePeriods.map((p) => {
                  const amt = row[p];
                  return (
                    <td
                      key={p}
                      className={`px-1 py-1 text-right border-l border-gray-100 ${
                        p === 'FY-Total' ? 'bg-amber-50 font-semibold' : ''
                      }`}
                      style={{ width: monthlyColWidth, minWidth: monthlyColWidth }}
                    >
                      {formatCurrency(amt)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td
                  colSpan={dimensionHeaders.length + visiblePeriods.length}
                  className="px-4 py-6 text-center text-xs text-gray-500"
                >
                  No data to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastReport;
