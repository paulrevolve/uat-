
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp, FaCaretRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// CRITICAL FIX: Importing backendUrl as requested
import { backendUrl } from "./config"; 

// --- CONFIGURATION & UTILS ---
const DETAIL_API_PATH = "/api/ForecastReport/GetViewData"; 
const ROWS_PER_PAGE = 20; 

const PERIOD_MAP = {
    1: 'Jan-25', 2: 'Feb-25', 3: 'Mar-25', 4: 'Apr-25', 5: 'May-25', 6: 'Jun-25',
    7: 'Jul-25', 8: 'Aug-25', 9: 'Sep-25', 10: 'Oct-25', 11: 'Nov-25', 12: 'Dec-25'
};

const MOCK_TIME_PERIODS = [
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'FY-Total'
];
const CLOSE_PERIODS = [
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 
    'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25'
];

// Data Sink for Unclassified items (Will be excluded from final display)
const GENERAL_COSTS = 'GENERAL-COSTS';

const SECTION_LABELS = {
    // GRAND: 'GRAND TOTAL',
    REVENUE_SECTION: '1 - Total Revenue (REVENUE)',
    INDIRECT_SECTION: 'Calculated Indirect',
    FRINGE: '1. Fringe',
    OVERHEAD: '2. Overhead',
    MANDH: '3. Mat & Handling',
    GNA: '4. General & Admin',
    LABOR: 'Total - 2 - Sumaria Labor Onsite (LABOR)',
    'UNALLOW-LABOR': 'Total - 2 - Sumaria Labor Onsite (UNALLOW-LABOR)',
    'NON-LABOR-TRAVEL': 'Total - 5 - Sumaria Travel (NON-LABOR)',
    'NON-LABOR-SUBCON': 'Total - 6 - Subcontractors (LABOR)',
    'UNALLOW-SUBCON': 'Total - 6 - Subcontractors (UNALLOW-LABOR)',
    [GENERAL_COSTS]: '7 - Other Unclassified Direct Costs (Hidden)', 
};
// CRITICAL FIX: Remove GENERAL_COSTS from the displayed SECTION_KEYS
const DISPLAYED_SECTION_KEYS = ['LABOR', 'UNALLOW-LABOR', 'NON-LABOR-TRAVEL', 'NON-LABOR-SUBCON', 'UNALLOW-SUBCON'];
const INDIRECT_KEYS = ['FRINGE', 'OVERHEAD', 'MANDH', 'GNA'];
// --- END CONFIGURATION & UTILS ---


// --- HARD-CODED ACCT_ID → SECTION MAPPING ---
const LABOR_ACCTS = new Set(['50-000-000', '50-MJI-097']);
const UNALLOW_LABOR_ACCTS = new Set(['50-000-999', '50-MJC-097', '50-MJO-097']);
const TRAVEL_NONLABOR_ACCTS = new Set([
    '50-400-000', '50-400-004', '50-400-008', '50-300-000', 
    '50-400-001', '50-400-007', '51-300-000', '50-400-005', '50-400-006', '50-400-002', 
]);
const SUB_LABOR_ACCTS = new Set(['51-000-000', '51-MJI-097']);
const SUB_UNALLOW_LABOR_ACCTS = new Set(['51-MJO-097', '51-MJC-097']);

// --- FORMATTING HELPERS (Unchanged) ---
const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount) || amount === 0) return '-'; 
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString.split('T')[0] || dateString);
    if (isNaN(date)) return dateString; 
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const getRollupId = (projId) => {
    if (!projId) return 'N/A';
    const match = projId.match(/^(\d+)/);
    return match ? match[1] : projId.split('.')[0];
};
// --- END FORMATTING HELPERS ---

// --- DATA TRANSFORMATION LOGIC ---
const determineSectionAndIndirectKey = (item) => {
    const subTotTypeNo = parseInt(item.subTotTypeNo) || null; 
    const poolName = (item.poolName || '').toUpperCase();
    
    // Default section is GENERAL_COSTS (Hidden)
    let section = GENERAL_COSTS; 
    let indirectKey = null;

    if (subTotTypeNo === 1) {
        section = 'REVENUE_SECTION';
    } else if (subTotTypeNo === 4) {
        if (poolName.includes('FRINGE BENEFITS')) {
            indirectKey = 'FRINGE';
        } else if (poolName.includes('GENERAL & ADMIN') || poolName.includes('G&A')) {
            indirectKey = 'GNA';
        } else if (poolName.includes('OVERHEAD')) {
            indirectKey = 'OVERHEAD';
        } else if (poolName.includes('MAT & HANDLING') || poolName.includes('M&H')) {
            indirectKey = 'MANDH';
        }
        // Indirect items will be classified by ACCT ID next. Default is GENERAL_COSTS.
        section = GENERAL_COSTS; 
    } 
    return { section, indirectKey, subTotTypeNo }; 
};

// ENFORCES STRICT ACCOUNT IDs
const classifyCostSection = (acctId, currentSection) => {
    if (LABOR_ACCTS.has(acctId)) return 'LABOR'; 
    if (UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-LABOR';
    if (TRAVEL_NONLABOR_ACCTS.has(acctId)) return 'NON-LABOR-TRAVEL';
    if (SUB_LABOR_ACCTS.has(acctId)) return 'NON-LABOR-SUBCON';
    if (SUB_UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-SUBCON';
    
    return currentSection; // If no match, it stays GENERAL_COSTS (or the indirect default)
};

const transformData = (detailData, headerData) => {
    const aggregatedDetailRows = {};
    
    detailData.forEach(item => {
        let { section, indirectKey, subTotTypeNo } = determineSectionAndIndirectKey(item);

        if (section !== 'REVENUE_SECTION') {
          section = classifyCostSection(item.acctId, section);
        }

        const detailRowKey = `${item.projId}-${item.acctId}-${item.poolNo}-${subTotTypeNo || 0}`;
        const periodKey = PERIOD_MAP[item.pdNo];
        
        if (!periodKey) return; 

        if (!aggregatedDetailRows[detailRowKey]) {
            aggregatedDetailRows[detailRowKey] = {
                id: detailRowKey,
                project: item.projId,
                acctId: item.acctId,
                org: item.orgId || 'N/A', 
                accountName: item.l1_acct_name || item.poolName || 'Unknown Pool', 
                projectName: item.proj_name || item.projId,
                popStartDate: item.popStartDate || item.proj_start_dt || 'N/A',
                popEndDate: item.popEndDate || item.proj_end_dt || 'N/A',
                parentProject: null,
                section: section, 
                subTotTypeNo: subTotTypeNo, 
                'FY-Total': 0, 
            };
        }

        const row = aggregatedDetailRows[detailRowKey];
        const monthlyAmount = (item.ptdIncurAmt || 0); 
        
        if (monthlyAmount === 0) return;

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

// --- FORECAST REPORT COMPONENT ---
const ForecastReport = () => {
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [closePeriodFilter, setClosePeriodFilter] = useState(CLOSE_PERIODS[CLOSE_PERIODS.length - 1]);
    const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [apiData, setApiData] = useState([]); 

    const [currentPage, setCurrentPage] = useState(1);

    // CRITICAL: Initialize expandedSections using DISPLAYED_SECTION_KEYS
    const [expandedSections, setExpandedSections] = useState(
        [...DISPLAYED_SECTION_KEYS, 'REVENUE_SECTION', 'INDIRECT_SECTION'].reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
    const [expandedProjects, setExpandedProjects] = useState({}); 

    const toggleSection = useCallback((key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);
    
    const toggleProject = useCallback((projectId) => {
        setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
    }, []);

    // --- DATA FETCHING (Unchanged) ---
    const fetchReportData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        const DETAIL_URL = `${backendUrl}${DETAIL_API_PATH}`;

        try {
            const detailResponse = await fetch(DETAIL_URL);
            
            if (!detailResponse.ok) {
                throw new Error(`API failed: ${detailResponse.statusText}`);
            }
            
            const detailData = await detailResponse.json();
            const transformedRows = transformData(detailData, []);
            
            if (transformedRows.length === 0) {
                 setError("API returned data, but transformation yielded zero rows."); 
            } else {
                 setError(null);
            }
            
            setApiData(transformedRows);

        } catch (e) {
            setApiData([]);
            setError(`Data load failed: ${e.message}. Check console for details.`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]); 

    // 1. Rollup Logic (Project/Section Grouping)
    const { allRows, rollupParents, uniqueProjectKeys, paginatedRollups } = useMemo(() => {
        const data = apiData; 
        const lowerCaseSearch = projectSearchTerm.toLowerCase();
        
        const filtered = data.filter(item => {
            const matchesProject = !lowerCaseSearch || 
                item.project.toLowerCase().includes(lowerCaseSearch) ||
                item.projectName.toLowerCase().includes(lowerCaseSearch);
            return matchesProject;
        });

        const rollupGroup = {};
        const allProjectRows = [];
        const monthlyPeriods = MOCK_TIME_PERIODS.slice(0, 12);
        
        // Use all possible sections (including GENERAL_COSTS) for the grouping process
        const ALL_SECTION_KEYS = [...DISPLAYED_SECTION_KEYS, GENERAL_COSTS];

        filtered.forEach(item => {
            const rollupId = getRollupId(item.project);
            
            let groupKey;
            let groupSection = item.section;
            
            // --- Determine Exclusion Flag and Group Key ---
            const isRevenueRow = item.section === 'REVENUE_SECTION' && item.subTotTypeNo === 1;

            if (isRevenueRow) {
                groupKey = `${rollupId}__REVENUE_SECTION`; 
                groupSection = 'REVENUE_SECTION';
            } else if (ALL_SECTION_KEYS.includes(item.section)) {
                groupKey = `${rollupId}__${item.section}`; 
                groupSection = item.section;
            } else {
                return; // Should only catch unclassified data, which should now be minimal/none
            }
            
            allProjectRows.push(item);

            // 2. Initialize Rollup Parent
            if (!rollupGroup[groupKey]) {
                rollupGroup[groupKey] = {
                    id: groupKey,
                    project: rollupId, 
                    // projectName: `Total - ${rollupId}`,
                    org: item.org || item.orgId || 'N/A',
                    acctId: null, 
                    // accountName: SECTION_LABELS[groupSection] , 
                    popStartDate: item.popStartDate || item.proj_start_dt || 'N/A',
                    popEndDate: item.popEndDate || item.proj_end_dt || 'N/A',
                    isRollupParent: true,
                    'FY-Total': 0,
                    section: groupSection, 
                    children: [],
                };
            }

            const parent = rollupGroup[groupKey];
            parent.children.push(item);

            // 3. Aggregate Monthly Periods with Exclusion Logic
            monthlyPeriods.forEach(period => {
                
                // COST/LABOR/INDIRECT AGGREGATION: Only runs if the row is NOT revenue-dominant.
                if (!isRevenueRow) {
                    // Direct Cost/Labor
                    if (item[period] !== undefined) {
                        parent[period] = (parent[period] || 0) + (item[period] || 0);
                    }
                    
                    // Indirect (These fields typically exist on cost rows)
                    INDIRECT_KEYS.forEach(ik => {
                        if (item[`${period}_${ik}`] !== undefined) {
                            parent[`${period}_${ik}`] = (parent[`${period}_${ik}`] || 0) + (item[`${period}_${ik}`] || 0);
                        }
                    });
                }
                
                // REVENUE AGGREGATION: Runs for all rollups, but only affects parent[`${period}_Revenue`].
                if (item[`${period}_Revenue`] !== undefined) {
                    parent[`${period}_Revenue`] = (parent[`${period}_Revenue`] || 0) + (item[`${period}_Revenue`] || 0);
                }
            });

            // FY-Total (Only applicable to cost totals)
            if (!isRevenueRow) {
                parent['FY-Total'] += (item['FY-Total'] || 0);
            }
        });
        
        // --- Pagination Logic ---
        const sortedRollupParents = Object.values(rollupGroup).sort((a, b) => 
            a.project.localeCompare(b.project) || a.section.localeCompare(b.section)
        );

        const uniqueProjectKeys = [...new Set(sortedRollupParents.map(p => p.project))].sort();
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        const endIndex = startIndex + ROWS_PER_PAGE;
        const paginatedProjectKeys = uniqueProjectKeys.slice(startIndex, endIndex);
        
        // CRITICAL: Filter out GENERAL_COSTS rollups before paginating for display
        const paginatedRollups = sortedRollupParents
            .filter(p => paginatedProjectKeys.includes(p.project))
            .filter(p => p.section !== GENERAL_COSTS);

        return { allRows: allProjectRows, rollupParents: sortedRollupParents, uniqueProjectKeys, paginatedRollups };
    }, [apiData, projectSearchTerm, currentPage]); 

    // 2. Define Headers and Sticky Positions (Unchanged)
    const dimensionHeaders = [
        { key: 'project', label: 'PROJECT', width: '150px' },
        { key: 'projectName', label: 'PROJECT NAME', width: '260px' },
        { key: 'org', label: 'ORG', width: '120px' },
        { key: 'accountID', label: 'ACCOUNT ID', width: '140px' },
        { key: 'accountName', label: 'ACCOUNT NAME', width: '220px' },
        { key: 'popStartDate', label: 'POP START DATE', width: '140px' },
        { key: 'popEndDate', label: 'POP END DATE', width: '140px' },
    ];
    
    const monthlyColWidth = 150;

    const stickyPositions = useMemo(() => {
        let currentPos = 0;
        const positions = {};
        dimensionHeaders.forEach((header, index) => {
            positions[header.key] = {
                left: currentPos,
                zIndex: 20 + dimensionHeaders.length - index, 
            };
            currentPos += parseInt(header.width);
        });
        return positions;
    }, [dimensionHeaders]); 

    const totalContentWidth = useMemo(() => {
        return dimensionHeaders.reduce((sum, h) => sum + parseInt(h.width), 0) + (MOCK_TIME_PERIODS.length * monthlyColWidth);
    }, [dimensionHeaders]); 

    const lastStickyKey = dimensionHeaders[dimensionHeaders.length - 1].key;
    const headerZIndex = 30; 
    
    // 3. Grand Total Calculation (Enforces Revenue Exclusion and filters GENERAL_COSTS)
    const { sectionTotals, grandCostTotal, grandRevenueTotal, grandIndirectComponents, grandIndirectTotal, finalIndirectKeys } = useMemo(() => {
        const sectionTotals = {};
        const grandCostTotal = {};
        const grandRevenueTotal = {};
        const grandIndirectComponents = {};
        
        const INDIRECT_KEYS_TEMP = INDIRECT_KEYS; 

        // CRITICAL FIX: Loop over DISPLAYED_SECTION_KEYS only
        DISPLAYED_SECTION_KEYS.forEach(key => {
            const sectionRows = allRows.filter(row => 
                row.section === key && 
                !(row.section === 'REVENUE_SECTION' && row.subTotTypeNo === 1) 
            );
            sectionTotals[key] = {};
            
            MOCK_TIME_PERIODS.forEach(period => {
                const costSum = sectionRows.reduce((acc, row) => (row[period] !== undefined ? acc + row[period] : acc), 0);
                
                if (costSum !== 0) {
                    sectionTotals[key][period] = costSum;
                    grandCostTotal[period] = (grandCostTotal[period] || 0) + costSum;
                }
            });
        });

        // Calculate Grand Revenue Total (Only from rows where subTotTypeNo is 1)
        const revenueRows = allRows.filter(row => row.section === 'REVENUE_SECTION' && row.subTotTypeNo === 1);
        MOCK_TIME_PERIODS.forEach(period => {
            const revenueSum = revenueRows.reduce((acc, row) => (row[`${period}_Revenue`] !== undefined ? acc + row[`${period}_Revenue`] : acc), 0);
            if (revenueSum !== 0) {
                grandRevenueTotal[period] = (grandRevenueTotal[period] || 0) + revenueSum; 
            }
        });

        // Calculate Grand Indirect Components (Only from rows where subTotTypeNo is 4)
        const indirectRows = allRows.filter(row => row.subTotTypeNo === 4);
        MOCK_TIME_PERIODS.forEach(period => {
             INDIRECT_KEYS_TEMP.forEach(indirectKey => {
                const indirectSum = indirectRows.reduce((acc, row) => (row[`${period}_${indirectKey}`] !== undefined ? acc + row[`${period}_${indirectKey}`] : acc), 0);
                
                if (indirectSum !== 0) {
                    if (!grandIndirectComponents[indirectKey]) {
                        grandIndirectComponents[indirectKey] = {};
                    }
                    grandIndirectComponents[indirectKey][period] = (grandIndirectComponents[indirectKey][period] || 0) + indirectSum;
                }
            });
        });
        
        const grandIndirectTotal = {};
        MOCK_TIME_PERIODS.forEach(period => {
            const indirectTotal = INDIRECT_KEYS_TEMP.reduce((sum, key) => sum + (grandIndirectComponents[key]?.[period] || 0), 0);
            if (indirectTotal !== 0) {
                grandIndirectTotal[period] = indirectTotal;
                // Add indirect totals to grand cost total for true GRAND total
                grandCostTotal[period] = (grandCostTotal[period] || 0) + indirectTotal;
            }
        });
        
        const finalIndirectKeys = Object.keys(grandIndirectComponents).filter(key => 
            MOCK_TIME_PERIODS.some(p => grandIndirectComponents[key][p] > 0)
        );

        return { 
            sectionTotals, 
            grandCostTotal, 
            grandRevenueTotal, 
            grandIndirectComponents, 
            grandIndirectTotal,
            finalIndirectKeys 
        };
    }, [allRows]); 

    const totalRollupPages = Math.ceil(uniqueProjectKeys.length / ROWS_PER_PAGE); 

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalRollupPages) {
            setCurrentPage(newPage);
        }
    };

    const renderTotalRow = (sectionKey, totalData, isGrandTotal = false, isRevenueOrIndirect = false, isBreakdown = false) => {
        const totalLabel = SECTION_LABELS[sectionKey];
        const rowClass = isGrandTotal ? 'grand-total-row' : (isRevenueOrIndirect ? 'revenue-indirect-row' : 'section-total-row');
        const zIndex = isGrandTotal ? 40 : (isRevenueOrIndirect ? 35 : 25); 
        
        const dataKeySuffix = sectionKey === 'REVENUE_SECTION' ? '_Revenue' : 
                              (INDIRECT_KEYS.includes(sectionKey) ? `_${sectionKey}` : '');

        return (
            <tr 
                key={sectionKey} 
                className={rowClass} 
                onClick={!isGrandTotal ? () => toggleSection(sectionKey) : undefined} 
                style={{ cursor: !isGrandTotal ? 'pointer' : 'default' }}
            >
                {dimensionHeaders.map((header) => {
                    const isLastSticky = header.key === lastStickyKey;
                    
                    const stickyStyle = {
                        left: `${stickyPositions[header.key].left}px`,
                        width: header.width,
                        zIndex: zIndex, 
                    };

                    let cellValue;
                    if (header.key === 'project') {
                        cellValue = isGrandTotal ? 'GRAND TOTAL' : (
                            <div className="flex items-center space-x-2">
                                {!isGrandTotal && (
                                    <FaCaretRight className={`w-3 h-3 transition-transform ${expandedSections[sectionKey] ? 'rotate-90' : ''}`} />
                                )}
                                <span>{isGrandTotal || isRevenueOrIndirect ? '' : 'TOTAL'}</span>
                            </div>
                        );
                    } else if (header.key === 'projectName') {
                        cellValue = totalLabel;
                    } else if (header.key === 'accountName' && isBreakdown) {
                        cellValue = totalLabel;
                    } else {
                        cellValue = '';
                    }

                    return (
                        <th 
                            key={header.key}
                            className={`px-3 py-2 text-left text-sm font-extrabold sticky left-0 ${rowClass}-sticky ${isLastSticky ? 'last-sticky-col-border' : ''}`}
                            style={{ ...stickyStyle }}
                        >
                            {cellValue}
                        </th>
                    );
                })}
                
                {MOCK_TIME_PERIODS.map(period => (
                    <th 
                        key={period} 
                        className={`px-6 py-2 whitespace-nowrap text-sm text-right month-cell font-extrabold ${period === 'FY-Total' ? 'fy-total-col' : ''}`}
                    >
                        {formatCurrency(totalData[`${period}${dataKeySuffix}`] || totalData[period])}
                    </th>
                ))}
            </tr>
        );
    };

    const renderBreakdownStickyCells = (item, isRevenueBreakdown, breakdownKey, isRollupParent = false) => {
        return dimensionHeaders.map((header) => {
            const isLastSticky = header.key === lastStickyKey;

            let cellContent = '';
            let paddingLeft = '12px';

            if (isRevenueBreakdown) {
                if (header.key === 'project') {
                    cellContent = item.project;
                    if (item.isRollupParent) {
                        return (
                            <td
                                key={header.key}
                                className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky-left last-sticky-col-border`}
                                style={{
                                    left: `${stickyPositions[header.key].left}px`,
                                    width: header.width,
                                    zIndex: stickyPositions[header.key].zIndex,
                                    cursor: 'pointer',
                                    paddingLeft: '12px',
                                    backgroundColor: 'white',
                                }}
                                onClick={() => toggleProject(`REV_${item.project}`)}
                            >
                                <div className="flex items-center space-x-1">
                                    <FaCaretRight
                                        className={`w-3 h-3 transition-transform ${
                                            expandedProjects[`REV_${item.project}`] ? 'rotate-90' : ''
                                        }`}
                                    />
                                    <span>{item.project}</span>
                                </div>
                            </td>
                        );
                    }
                    paddingLeft = '35px';
                } else if (header.key === 'projectName') {
                    cellContent = item.projectName; 
                } else if (header.key === 'org') {
                    cellContent = item.org;
                } else if (header.key === 'accountID') {
                    cellContent = item.acctId;
                } else if (header.key === 'accountName') {
                    cellContent = item.accountName;
                } else if (header.key === 'popStartDate') {
                    cellContent = formatDate(item.popStartDate);
                } else if (header.key === 'popEndDate') {
                    cellContent = formatDate(item.popEndDate);
                }
            }
            else if (item) {
                if (header.key === 'project') {
                    cellContent = item.project;
                    paddingLeft = item.isRollupParent ? '12px' : '35px'; 
                    
                    if (item.isRollupParent) {
                        const childrenExist = item.children && item.children.length > 0;
                        if (childrenExist) {
                            return (
                                <td 
                                    key={header.key}
                                    className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky-left ${isLastSticky ? 'last-sticky-col-border' : ''} ${item.isRollupParent ? 'rollup-parent-row-sticky' : ''}`}
                                    style={{ 
                                        left: `${stickyPositions[header.key].left}px`, 
                                        width: header.width,
                                        zIndex: stickyPositions[header.key].zIndex,
                                        cursor: 'pointer',
                                        paddingLeft: paddingLeft,
                                        backgroundColor: 'white'
                                    }}
                                    onClick={() => toggleProject(item.project)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[item.project] ? 'rotate-90' : ''}`} />
                                        <span>{cellContent}</span>
                                    </div>
                                </td>
                            );
                        }
                    }
                } else if (header.key === 'projectName') {
                    cellContent = item.projectName;
                    paddingLeft = item.isRollupParent ? '12px' : '35px';
                } else if (header.key === 'org') {
                    cellContent = item.org;
                } else if (header.key === 'accountID') {
                    cellContent = item.acctId || item.accountID; 
                } else if (header.key === 'accountName') {
                    cellContent = item.accountName;
                } else if (header.key === 'popStartDate') {
                    cellContent = formatDate(item.popStartDate);
                } else if (header.key === 'popEndDate') {
                    cellContent = formatDate(item.popEndDate);
                }
            }
            else if (breakdownKey) {
                if (header.key === 'project') {
                    cellContent = SECTION_LABELS[breakdownKey];
                    paddingLeft = '25px';
                }
            }

            return (
                <td 
                    key={header.key}
                    className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky-left ${isLastSticky ? 'last-sticky-col-border' : ''} ${isRollupParent ? 'rollup-parent-row-sticky' : ''}`}
                    style={{ 
                        left: `${stickyPositions[header.key].left}px`, 
                        width: header.width,
                        zIndex: stickyPositions[header.key].zIndex,
                        paddingLeft: paddingLeft,
                        backgroundColor: isRollupParent ? '#e5e7eb' : 'white'
                    }}
                >
                    {cellContent}
                </td>
            );
        });
    };
    
    // ... (omitting loading/error JSX again for brevity here, but it's in the full code block) ...

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <style>
                {`
                    .sticky-table {
                        table-layout: fixed; 
                        border-collapse: separate;
                        border-spacing: 0;
                        min-width: ${totalContentWidth}px; 
                    }
                    .month-cell {
                        min-width: ${monthlyColWidth}px; 
                        width: ${monthlyColWidth}px;
                    }
                    .sticky-table th.sticky-left, .sticky-table td.sticky-left {
                        position: sticky;
                        z-index: 10; 
                        background-color: white !important; 
                        box-shadow: 2px 0 3px -2px rgba(0,0,0,0.1);
                        border-right: 1px solid #e5e7eb; 
                    }
                    .sticky-table thead th.sticky-left {
                        position: sticky; 
                        top: 0; 
                        z-index: ${headerZIndex + 10} !important; 
                        background-color: #e5e7eb !important;
                    }
                    .sticky-table th.last-sticky-col-border, .sticky-table td.last-sticky-col-border {
                        border-right: 2px solid #9ca3af !important;
                        box-shadow: 2px 0 3px -2px rgba(0,0,0,0.4); 
                    }
                    .fy-total-col {
                        background-color: #fffbe7; 
                        font-weight: 600;
                    }
                    .section-total-row, .revenue-indirect-row, .grand-total-row {
                        color: white;
                        font-weight: bold;
                        border-top: 2px solid #065f46;
                    }
                    .section-total-row-sticky, .revenue-indirect-row-sticky, .grand-total-row-sticky {
                        background-color: inherit !important; 
                    }
                    .section-total-row { background-color: #34d399; }
                    .revenue-indirect-row { background-color: #10b988; }
                    .grand-total-row { background-color: #065f46; } 
                    .rollup-parent-row { 
                        background-color: #e5e7eb; 
                        font-weight: bold;
                        border-bottom: 2px solid #9ca3af;
                        color: #1f2937;
                    }
                    .rollup-parent-row-sticky, .rollup-parent-row th {
                        background-color: #e5e7eb !important;
                        color: #1f2937 !important;
                    }
                    .revenue-breakdown-row td {
                        background-color: #f0fdfa !important; 
                        border-bottom: 1px dashed #6ee7b7;
                    }
                    .sticky-table th, .sticky-table td {
                        border-bottom: 1px solid #e5e7eb;
                    }
                `}
            </style>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Forecast Report</h2>

            {/* Filters and Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 sticky top-0 z-20">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700">Filters & Search</h3>
                    <button 
                        onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                        title={isFilterCollapsed ? "Expand Filters" : "Collapse Filters"}
                    >
                        <FaChevronUp className={isFilterCollapsed ? 'rotate-180' : ''} />
                    </button>
                </div>
                
                <div className={`transition-max-height duration-300 ease-in-out overflow-hidden ${isFilterCollapsed ? 'max-h-0' : 'max-h-96 pt-4'}`}>
                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                        <div className="relative flex-1 max-w-lg">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Project ID / Project Name</label>
                            <input
                                type="text"
                                placeholder="Search project ID or name..."
                                value={projectSearchTerm}
                                onChange={(e) => setProjectSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                            <FaSearch className="absolute left-3 top-1/2 mt-3 transform -translate-y-1/2 text-gray-400" />
                        </div>
                        
                        <div className="relative flex-1 max-w-xs">
                            <label htmlFor="close-period-select" className="block text-xs font-medium text-gray-500 mb-1">Close Period</label>
                            <select
                                id="close-period-select"
                                value={closePeriodFilter}
                                onChange={(e) => setClosePeriodFilter(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            >
                                {CLOSE_PERIODS.map(period => (
                                    <option key={period} value={period}>{period}</option>
                                ))}
                            </select>
                            <FaChevronDown className="absolute right-3 top-1/2 mt-3 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-md mb-4">
                <span className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1} to {Math.min(currentPage * ROWS_PER_PAGE, uniqueProjectKeys.length)} of {uniqueProjectKeys.length} Projects
                </span>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm rounded-lg text-gray-700 border hover:bg-gray-100 disabled:opacity-50"
                    >
                        <FaChevronLeft className="inline-block w-3 h-3" /> Previous
                    </button>
                    <span className="px-3 py-1 text-sm rounded-lg border bg-gray-100 text-gray-700">
                        Page {currentPage} of {totalRollupPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalRollupPages || totalRollupPages === 0}
                        className="px-3 py-1 text-sm rounded-lg text-gray-700 border hover:bg-gray-100 disabled:opacity-50"
                    >
                        Next <FaChevronRight className="inline-block w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Data Table Container */}
            <div style={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }} className="rounded-lg shadow-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 sticky-table">
                    <thead>
                        <tr>
                            {dimensionHeaders.map((header) => (
                                <th
                                    key={header.key}
                                    scope="col"
                                    className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 sticky-left ${header.key === lastStickyKey ? 'last-sticky-col-border' : ''}`}
                                    style={{ 
                                        left: `${stickyPositions[header.key].left}px`, 
                                        width: header.width,
                                    }}
                                >
                                    {header.label}
                                </th>
                            ))}
                            {MOCK_TIME_PERIODS.map(period => (
                                <th
                                    key={period}
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider month-cell"
                                    style={{ backgroundColor: period === 'FY-Total' ? '#fefcbf' : '' }}
                                >
                                    {period}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* TBODY 1: Revenue summary and breakdown */}
                    <tbody>
                        {renderTotalRow('REVENUE_SECTION', grandRevenueTotal, false, true)}
                        {expandedSections.REVENUE_SECTION && paginatedRollups
                            .filter(p => p.section === 'REVENUE_SECTION')
                            .map(rollupItem => (
                                <React.Fragment key={`rev-rollup-${rollupItem.id}`}>
                                    <tr 
                                        key={`rev-parent-${rollupItem.id}`} 
                                        className="revenue-breakdown-row"
                                        onClick={() => toggleProject(`REV_${rollupItem.project}`)} 
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {renderBreakdownStickyCells({...rollupItem, projectName: `Total - ${rollupItem.project}`}, true, null, true)}
                                        {MOCK_TIME_PERIODS.map(period => (
                                            <td 
                                                key={period} 
                                                className="px-6 py-2 whitespace-nowrap text-sm text-right month-cell font-semibold"
                                                style={{ backgroundColor: '#e0f2f1' }}
                                            >
                                                {formatCurrency(rollupItem[`${period}_Revenue`] || 0)}
                                            </td>
                                        ))}
                                    </tr>
                                    {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children
                                        .filter(child => child.subTotTypeNo === 1) 
                                        .map(projectItem => (
                                            <tr key={`rev-detail-${projectItem.id}`} className="revenue-breakdown-row">
                                                {renderBreakdownStickyCells({...projectItem, isRollupParent: false}, true, null, false)}
                                                {MOCK_TIME_PERIODS.map(period => (
                                                    <td 
                                                        key={period} 
                                                        className="px-6 py-2 whitespace-nowrap text-sm text-right month-cell"
                                                        style={{ backgroundColor: '#f0fdfa' }}
                                                    >
                                                        {formatCurrency(projectItem[`${period}_Revenue`] || 0)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    }
                                </React.Fragment>
                            ))
                        }
                    </tbody>

                    {/* TBODY 2: Cost sections and rollups */}
                    <tbody>
                        {DISPLAYED_SECTION_KEYS.map(sectionKey => {
                            const sectionRollupParents = paginatedRollups.filter(rollup => rollup.section === sectionKey);
                            const isSectionExpanded = expandedSections[sectionKey];

                            // Skip rendering the section if it's empty
                            if (sectionRollupParents.length === 0) return null;

                            const totalRow = renderTotalRow(sectionKey, sectionTotals[sectionKey]);
                            
                            const rollupRows = isSectionExpanded ? sectionRollupParents.map(rollupItem => {
                                const parentRow = (
                                    <tr 
                                        key={rollupItem.id} 
                                        className="rollup-parent-row"
                                        onClick={() => toggleProject(rollupItem.project)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {renderBreakdownStickyCells(rollupItem, false, null, true)}
                                        {MOCK_TIME_PERIODS.map(period => (
                                            <td 
                                                key={period} 
                                                className={`px-6 py-2 whitespace-nowrap text-sm text-right month-cell font-extrabold ${period === 'FY-Total' ? 'fy-total-col' : ''}`}
                                            >
                                                {formatCurrency(rollupItem[period] || 0)}
                                            </td>
                                        ))}
                                    </tr>
                                );

                                const projectDetailRows = expandedProjects[rollupItem.project] ? rollupItem.children
                                    .filter(child => child.section === sectionKey)
                                    .map(projectItem => (
                                        <tr key={projectItem.id} className="hover:bg-gray-50 transition-colors">
                                            {renderBreakdownStickyCells(projectItem, false, null, false)}
                                            {MOCK_TIME_PERIODS.map(period => (
                                                <td 
                                                    key={period} 
                                                    className={`px-6 py-2 whitespace-nowrap text-sm text-gray-700 month-cell ${period === 'FY-Total' ? 'font-semibold fy-total-col' : 'text-gray-700'}`}
                                                >
                                                    {formatCurrency(projectItem[period] || 0)}
                                                </td>
                                            ))}
                                        </tr>
                                    )) : null;

                                return (
                                    <React.Fragment key={rollupItem.id}>
                                        {parentRow}
                                        {projectDetailRows}
                                    </React.Fragment>
                                );

                            }) : null;

                            return (
                                <React.Fragment key={sectionKey}>
                                    {totalRow}
                                    {rollupRows}
                                </React.Fragment>
                            );
                        })}

                        {allRows.length === 0 && (
                            <tr>
                                <td colSpan={MOCK_TIME_PERIODS.length + dimensionHeaders.length} className="px-6 py-12 text-center text-gray-500">
                                    {/* No forecast data found matching the current filters. */}
                                </td>
                            </tr>
                        )}
                    </tbody>

                    {/* TFOOT: Indirect + Grand total */}
                    <tfoot>
                        {renderTotalRow('INDIRECT_SECTION', grandIndirectTotal, false, true)}
                        {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => (
                            <tr key={`indirect-breakdown-${key}`} className="revenue-breakdown-row">
                                {renderBreakdownStickyCells(null, false, key, false)}
                                {MOCK_TIME_PERIODS.map(period => (
                                    <td 
                                        key={period} 
                                        className="px-6 py-2 whitespace-nowrap text-sm text-right month-cell"
                                        style={{ backgroundColor: '#e0f2f1' }}
                                    >
                                        {formatCurrency(grandIndirectComponents[key][period] || 0)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {/* {renderTotalRow('GRAND', grandCostTotal, true)} */}
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ForecastReport;