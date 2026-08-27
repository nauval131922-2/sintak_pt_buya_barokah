"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Package,
  Calculator,
  Search,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Truck,
  ShoppingCart,
  Hash,
} from "lucide-react";
import DatePicker from "@/components/DatePicker";
import SearchableDropdown from "@/components/SearchableDropdown";
import SearchAndReload from "@/components/SearchAndReload";
import { persistDateStore, hydrateDateStore } from '@/lib/scraper-period';
import { formatMdtDate, parseIndoDate, parseLooseNumber, toTitleCase } from './tracking-utils';
import {
  chipClass, cardClass, infoCardClass, infoLabelClass, refLabelClass, refRowClass,
  productTitleClass, productMetaClass, customerTextClass, locationBadgeClass,
  emptyStateClass, headerDateClass, auditSectionClass,
} from './tracking-styles';
import {
  HighlightedText, DataField, RenderAllFields, DataCard, RenderColumnContent,
} from './tracking-components';

// Unified date formatter for MDT Host source data (YYYY-MM-DD -> DD-MM-YYYY)
export default function TrackingClient() {
  const formatPeriod = () => {
    if (!startDate && !endDate) return "Semua Waktu";
    const start = startDate
      ? startDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "...";
    const end = endDate
      ? endDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "...";
    return `${start} - ${end}`;
  };

  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [selectedFaktur, setSelectedFaktur] = useState<string | null>(null);
  const [selectedNama, setSelectedNama] = useState<string>("");
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [trackingData, setTrackingData] = useState<{
    bom: any;
    sphOut: any;
    spphOut: any[];
    sphIn: any[];
    purchaseOrders: any[];
    salesOrder?: any;
    productionOrders?: any[];
    purchaseRequests: any[];
    pengiriman: any[];
    pelunasanPiutang: any[];
    penerimaanPembelian: any[];
    pembelianBarang: any[];
    pelunasanHutang: any[];
    bahanBaku: any[];
    barangJadi: any[];
    laporanPenjualan: any[];
    id?: string;
  } | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [trackingPath, setTrackingPath] = useState<"bom" | "rekap" | null>(
    null,
  );

  // State for Rekap Pembelian filter
  const [qRekap, setQRekap] = useState("");
  const [rekapSuggestions, setRekapSuggestions] = useState<any[]>([]);
  const [loadingRekapSuggestions, setLoadingRekapSuggestions] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [selectedFakturSupplier, setSelectedFakturSupplier] = useState<
    string | null
  >(null);
  const [selectedFakturPO, setSelectedFakturPO] = useState<string | null>(null);
  // State for Supplier filter
  const [qSupplier, setQSupplier] = useState("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  // State for PO Number filter
  const [qPO, setQPO] = useState("");
  const [poList, setPoList] = useState<any[]>([]);
  const [loadingPO, setLoadingPO] = useState(false);
  const [selectedPO, setSelectedPO] = useState<string | null>(null);

  const [trackingMeta, setTrackingMeta] = useState<{
    isStartingFromRekap: boolean;
    isStartingFromPO: boolean;
    isBomPath: boolean;
  } | null>(null);

  const [filterText, setFilterText] = useState("");
  const [debouncedFilterText, setDebouncedFilterText] = useState(""); // We use this for the actual table filtering

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedFilterText(filterText), 300);

    return () => clearTimeout(handler);
  }, [filterText]);

  // Column Widths for Resizing - Persisted in localStorage
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("tracking_columnWidths");
        return saved
          ? JSON.parse(saved)
          : {
              bom: 500,
              sph: 500,
              spph: 500,
              sph_in: 500,
              purchase_orders: 500,
              so: 500,
              production: 500,
              pr: 500,
              penerimaan_pembelian: 500,
              pembelian_barang: 500,
              pelunasan_hutang: 500,
              bahan_baku: 500,
              barang_jadi: 500,
              laporan_penjualan: 500,
              pengiriman: 500,
              pelunasan_piutang: 500,
            };
      }
      return {
        bom: 500,
        sph: 500,
        spph: 500,
        sph_in: 500,
        purchase_orders: 500,
        so: 500,
        production: 500,
        pr: 500,
        penerimaan_pembelian: 500,
        pembelian_barang: 500,
        pelunasan_hutang: 500,
        bahan_baku: 500,
        barang_jadi: 500,
        laporan_penjualan: 500,
        pengiriman: 500,
        pelunasan_piutang: 500,
      };
    },
  );

  const resetTracking = () => {
    setTrackingData(null);
    setTrackingMeta(null);
    setSelectedFaktur(null);
    setSelectedNama("");
    setError("");
    setLoadTime(null);
    localStorage.removeItem("tracking_selected_faktur");
    localStorage.removeItem("tracking_selected_nama");
    localStorage.removeItem("tracking_selected_path");
    localStorage.removeItem("tracking_selected_faktur_supplier");
    localStorage.removeItem("tracking_selected_po");
    localStorage.removeItem("tracking_selected_supplier");
  };

  // Clear ALL filters: BOM/PO/supplier + tanggal + search tabel
  const clearFilters = () => {
    setTrackingData(null);
    setTrackingMeta(null);
    setSelectedFaktur(null);
    setSelectedNama("");
    setSelectedPO(null);
    setSelectedFakturPO(null);
    setSelectedSupplier(null);
    setSelectedFakturSupplier(null);
    setTrackingPath(null);
    setStartDate(null);
    setEndDate(null);
    setFilterText("");
    setDebouncedFilterText("");
    setError("");
    setLoadTime(null);
    setOpen(false);
    setOpenRekap(false);
    setOpenPO(false);
    setOpenSupplier(false);
    try {
      localStorage.removeItem("tracking_dates");
      localStorage.removeItem("tracking_selected_faktur");
      localStorage.removeItem("tracking_selected_nama");
      localStorage.removeItem("tracking_selected_path");
      localStorage.removeItem("tracking_selected_faktur_supplier");
      localStorage.removeItem("tracking_selected_po");
      localStorage.removeItem("tracking_selected_supplier");
      localStorage.removeItem("tracking_selectedSupplier");
    } catch { /* ignore */ }
  };

  const hasActiveFilters = !!(
    startDate ||
    endDate ||
    filterText.trim() ||
    selectedFaktur ||
    selectedPO ||
    selectedSupplier ||
    trackingPath
  );
  useEffect(() => {
    localStorage.setItem("tracking_columnWidths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Helper for deep filtering data for cards
  const matchesFilter = React.useCallback((data: any, text: string) => {
    if (!text) return true;
    const lowerText = text.toLowerCase();
    return Object.values(data || {}).some((val) =>
      String(val).toLowerCase().includes(lowerText),
    );
  }, []);

  // Tab definitions — each tab maps to a slice of trackingData
  const tabs = useMemo(() => {
    if (!trackingData) return [];

    const { isStartingFromRekap, isStartingFromPO, isBomPath } =
      trackingMeta || {
        isStartingFromRekap: trackingPath === "rekap" && !selectedPO,
        isStartingFromPO: !!selectedPO,
        isBomPath: trackingPath === "bom",
      };

    const allTabs = [
      {
        id: "bom",
        label: "Bill of Material",
        badge: isBomPath ? "(titik awal)" : "",
        getData: () => (trackingData.bom ? [trackingData.bom] : []),
      },
      {
        id: "sph",
        label: "SPH Keluar",
        badge: "",
        getData: () => (trackingData.sphOut ? [trackingData.sphOut] : []),
      },
      {
        id: "so",
        label: "Sales Order",
        badge: "",
        getData: () =>
          trackingData.salesOrder ? [trackingData.salesOrder] : [],
      },
      {
        id: "production",
        label: "Order Produksi",
        badge: "",
        getData: () => trackingData.productionOrders || [],
      },
      {
        id: "pr",
        label: "Purchase Request",
        badge: "",
        getData: () => trackingData.purchaseRequests || [],
      },
      {
        id: "spph",
        label: "SPPH Keluar",
        badge: "",
        getData: () => trackingData.spphOut || [],
      },
      {
        id: "sph_in",
        label: "SPH Masuk",
        badge: "",
        getData: () => trackingData.sphIn || [],
      },
      {
        id: "purchase_orders",
        label: "Purchase Order (PO)",
        badge: isStartingFromPO ? "(titik awal)" : "",
        getData: () => trackingData.purchaseOrders || [],
      },
      {
        id: "penerimaan",
        label: "Penerimaan Barang",
        badge: "",
        getData: () => trackingData.penerimaanPembelian || [],
      },
      {
        id: "rekap_pembelian",
        label: "Rekap Pembelian",
        badge: isStartingFromRekap ? "(titik awal)" : "",
        getData: () => trackingData.pembelianBarang || [],
      },
      {
        id: "pelunasan_hutang",
        label: "Pelunasan Hutang",
        badge: "",
        getData: () => trackingData.pelunasanHutang || [],
      },
      {
        id: "bahan_baku",
        label: "BBB Produksi",
        badge: "",
        getData: () => trackingData.bahanBaku || [],
      },
      {
        id: "barang_jadi",
        label: "Barang Hasil Produksi",
        badge: "",
        getData: () => trackingData.barangJadi || [],
      },
      {
        id: "laporan_penjualan",
        label: "Laporan Penjualan",
        badge: "",
        getData: () => trackingData.laporanPenjualan || [],
      },
      {
        id: "pengiriman",
        label: "Pengiriman",
        badge: "",
        getData: () => trackingData.pengiriman || [],
      },
      {
        id: "pelunasan_piutang",
        label: "Pelunasan Piutang",
        badge: "",
        getData: () => trackingData.pelunasanPiutang || [],
      },
    ];

    if (!isBomPath) {
      const hideIds = [
        "bom",
        "sph",
        "so",
        "production",
        "pr",
        "spph",
        "sph_in",
        "penerimaan",
        "pelunasan_hutang",
        "laporan_penjualan",
        "pengiriman",
        "pelunasan_piutang",
      ];
      return allTabs.filter((t) => !hideIds.includes(t.id));
    }
    return allTabs;
  }, [trackingData, trackingPath, trackingMeta]);

  // Currently active tab
  const [activeTab, setActiveTab] = useState<string>("");

  // Auto-select first tab when data loads
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs]);

  // Helper to apply current filters (date and text) to a list of rows
  const filterRows = useCallback(
    (rawRows: any[]) => {
      let rows = Array.isArray(rawRows) ? [...rawRows] : [];

      // Apply date filter on tab table rows (BOM + rekap)
      if (startDate || endDate) {
        const start = startDate
          ? (() => {
              const d = new Date(startDate);
              d.setHours(0, 0, 0, 0);
              return d;
            })()
          : null;
        const end = endDate
          ? (() => {
              const d = new Date(endDate);
              d.setHours(23, 59, 59, 999);
              return d;
            })()
          : null;

        rows = rows.filter((r: any) => {
          if (!r || typeof r !== "object") return false;
          const tglStr = String(
            r.tgl ?? r.tanggal ?? r.date ?? r.Tgl ?? r.Tanggal ?? r.Date ?? "",
          ).trim();
          // no date → exclude when filter active (otherwise table looks "unfiltered")
          if (!tglStr) return false;
          const itemDate = parseIndoDate(tglStr);
          if (!itemDate) return false;
          if (start && itemDate < start) return false;
          if (end && itemDate > end) return false;
          return true;
        });
      }

      // Apply text filter
      if (debouncedFilterText) {
        const lower = debouncedFilterText.toLowerCase();
        rows = rows.filter((r: any) =>
          Object.values(r || {}).some((v) =>
            String(v).toLowerCase().includes(lower),
          ),
        );
      }
      return rows;
    },
    [startDate, endDate, debouncedFilterText],
  );

  // Get raw items for the active tab, applying text search filter
  const activeTabData = useMemo(() => {
    const tab = tabs.find((t) => t.id === activeTab);
    if (!tab) return { rows: [], columns: [] as string[], totalQty: 0 };

    const rows = filterRows(tab.getData());

    // Calculate totalQty for specific tabs (ONLY for Jalur Barang / rekap)
    let totalQty = 0;
    if (
      trackingPath === "rekap" &&
      (activeTab === "bahan_baku" || activeTab === "barang_jadi")
    ) {
      totalQty = rows.reduce((sum: number, r: any) => {
        const qtyStr = String(r.qty || 0).replace(/,/g, "");
        return sum + (parseFloat(qtyStr) || 0);
      }, 0);
    }

    // Derive column keys from union of all row keys, excluding noise
    const excludeKeys = new Set([
      "raw_data",
      "mydata",
      "cmd",
      "detil",
      "redid",
    ]);
    const colSet = new Set<string>();
    rows.forEach((r: any) =>
      Object.keys(r || {}).forEach((k) => {
        if (!excludeKeys.has(k)) colSet.add(k);
      }),
    );

    return { rows, columns: Array.from(colSet), totalQty };
  }, [tabs, activeTab, trackingPath, filterRows]);

  // Pagination
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when tab or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedFilterText, startDate, endDate]);

  const totalPages = Math.max(
    1,
    Math.ceil(activeTabData.rows.length / PAGE_SIZE),
  );
  const paginatedRows = activeTabData.rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Initial load for persistence — default null = Semua Waktu (tracking multi-tahun)
  useEffect(() => {
    const hydrated = hydrateDateStore('tracking_dates');
    if (hydrated.startDate && hydrated.endDate) {
      setStartDate(hydrated.startDate);
      setEndDate(hydrated.endDate);
    }
    // else keep null — "Semua Waktu"; jangan default ke hari ini (kosongkan jalur rekap)

    const savedSupplier = localStorage.getItem("tracking_selectedSupplier");
    if (savedSupplier) {
      setSelectedSupplier(savedSupplier);
    }
  }, []);

  // Persist dates on change
  useEffect(() => {
    persistDateStore('tracking_dates', startDate, endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedSupplier)
      localStorage.setItem("tracking_selectedSupplier", selectedSupplier);
    else localStorage.removeItem("tracking_selectedSupplier");
  }, [selectedSupplier]);

  // Search logic for dropdown
  useEffect(() => {
    let active = true;
    const fetchNames = async (query: string) => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `/api/tracking/names?q=${encodeURIComponent(query)}&page=1&pageSize=50`,
        );
        const json = await res.json();
        if (json.success && active) {
          setSuggestions(json.data || []);
        }
      } catch (e) {
      } finally {
        if (active) setLoadingSuggestions(false);
      }
    };

    if (q.trim().length === 0) {
      fetchNames("");
    } else {
      const handler = setTimeout(() => fetchNames(q), 300);
      return () => {
        active = false;
        clearTimeout(handler);
      };
    }
    return () => {
      active = false;
    };
  }, [q]);

  // Search logic for Rekap dropdown
  useEffect(() => {
    let active = true;
    const fetchRekapNames = async (query: string) => {
      setLoadingRekapSuggestions(true);
      try {
        const fmtDate = (d: Date | null) => {
          if (!d) return "";
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };

        const params = new URLSearchParams({
          q: query,
          page: "1",
          pageSize: "50",
          supplier: selectedSupplier || "",
          po: selectedPO || "",
        });
        const from = fmtDate(startDate);
        const to = fmtDate(endDate);
        if (from) params.set("from", from);
        if (to) params.set("to", to);

        const res = await fetch(
          `/api/tracking/rekap-names?${params.toString()}`,
        );
        const json = await res.json();
        if (json.success && active) {
          setRekapSuggestions(json.data || []);
        }
      } catch (e) {
      } finally {
        if (active) setLoadingRekapSuggestions(false);
      }
    };

    if (qRekap.trim().length === 0) {
      fetchRekapNames("");
    } else {
      const handler = setTimeout(() => fetchRekapNames(qRekap), 300);
      return () => {
        active = false;
        clearTimeout(handler);
      };
    }
    return () => {
      active = false;
    };
  }, [qRekap, selectedSupplier, selectedPO, startDate, endDate]);

  // Search logic for PO Number dropdown
  useEffect(() => {
    let active = true;
    const fetchPONumbers = async (query: string) => {
      setLoadingPO(true);
      try {
        const fmtDate = (d: Date | null) => {
          if (!d) return "";
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };
        const params = new URLSearchParams({
          q: query,
          supplier: selectedSupplier || "",
        });
        const from = fmtDate(startDate);
        const to = fmtDate(endDate);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const res = await fetch(
          `/api/tracking/po-numbers?${params.toString()}`,
        );
        const json = await res.json();
        if (json.success && active) {
          setPoList(json.data || []);
        }
      } catch (e) {
      } finally {
        if (active) setLoadingPO(false);
      }
    };

    if (qPO.trim().length === 0) {
      fetchPONumbers("");
    } else {
      const handler = setTimeout(() => fetchPONumbers(qPO), 300);
      return () => {
        active = false;
        clearTimeout(handler);
      };
    }
    return () => {
      active = false;
    };
  }, [qPO, selectedSupplier, startDate, endDate]);

  // Search logic for Supplier dropdown
  useEffect(() => {
    let active = true;
    const fetchSuppliers = async (query: string) => {
      setLoadingSuppliers(true);
      try {
        const res = await fetch(
          `/api/tracking/suppliers?q=${encodeURIComponent(query)}`,
        );
        const json = await res.json();
        if (json.success && active) {
          setSuppliers(json.data || []);
        }
      } catch (e) {
      } finally {
        if (active) setLoadingSuppliers(false);
      }
    };

    if (qSupplier.trim().length === 0) {
      fetchSuppliers("");
    } else {
      const handler = setTimeout(() => fetchSuppliers(qSupplier), 300);
      return () => {
        active = false;
        clearTimeout(handler);
      };
    }
    return () => {
      active = false;
    };
  }, [qSupplier]);

  // Items & Labels for SearchableDropdowns
  const bomItems = useMemo(() => {
    return suggestions.map((s) => s.faktur);
  }, [suggestions]);

  const bomItemLabels = useMemo(() => {
    const map: Record<string, string> = {};
    suggestions.forEach((s) => {
      map[s.faktur] = `${s.faktur} — ${s.nama_prd || ''}`;
    });
    return map;
  }, [suggestions]);

  const supplierItems = useMemo(() => {
    return suppliers.map((s) => s.supplier);
  }, [suppliers]);

  const supplierItemLabels = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach((s) => {
      map[s.supplier] = s.supplier;
    });
    return map;
  }, [suppliers]);

  const poItems = useMemo(() => {
    return poList.map((s) => s.faktur);
  }, [poList]);

  const poItemLabels = useMemo(() => {
    const map: Record<string, string> = {};
    poList.forEach((s) => {
      map[s.faktur] = `${s.faktur} (${s.tgl || ''}) ${s.ket_pr ? `— ${s.ket_pr}` : ''}`;
    });
    return map;
  }, [poList]);

  const rekapItems = useMemo(() => {
    return rekapSuggestions.map((s) => s.faktur);
  }, [rekapSuggestions]);

  const rekapItemLabels = useMemo(() => {
    const map: Record<string, string> = {};
    rekapSuggestions.forEach((s) => {
      map[s.faktur] = `${s.faktur} (${s.tgl || ''}) — ${s.nm_barang || s.kd_barang || ''}`;
    });
    return map;
  }, [rekapSuggestions]);

  // Memoized filtered data based on text and dates
  const filteredData = useMemo(() => {
    if (!trackingData) return [];
    // Handle single flow object (standard API response)
    const items: any[] = Array.isArray(trackingData)
      ? [...trackingData]
      : [trackingData];

    if (items.length === 0) return [];

    // Date range on whole-flow object is handled per-tab via filterRows.
    // Keep full flow here so BOM path tabs stay populated.
    return items;
  }, [trackingData, startDate, endDate]);

  const fetchTrackingData = async (faktur: string) => {
    setLoadingData(true);
    setTrackingData(null);
    setError("");
    const start = Date.now();
    try {
      const res = await fetch(
        `/api/tracking?target_faktur=${encodeURIComponent(faktur)}`,
      );
      const json = await res.json();
      if (json.success) {
        setTrackingData({
          ...json.data,
          id:
            json.data.productionOrders?.[0]?.faktur ||
            json.data.bom?.faktur ||
            "N/A",
        });
        setTrackingMeta(
          json.meta || {
            isStartingFromRekap: faktur.startsWith("PB"),
            isStartingFromPO: faktur.startsWith("PO"),
            isBomPath: !faktur.startsWith("PB") && !faktur.startsWith("PO"),
          },
        );
        setLoadTime(Date.now() - start);
      } else {
        setError(json.error || "Gagal memuat data tracking");
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan sistem");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSelect = async (selected: any) => {
    setSelectedFaktur(selected.faktur);
    setSelectedNama(selected.nama_prd);
    setTrackingData(null);
    setSelectedSupplier(null);
    setSelectedPO(null);
    setTrackingPath("bom");
    // Persist to localStorage so it survives refresh
    localStorage.setItem("tracking_selected_faktur", selected.faktur);
    localStorage.setItem("tracking_selected_nama", selected.nama_prd || "");
    localStorage.setItem("tracking_selected_path", "bom");
    localStorage.removeItem("tracking_selected_po");
    localStorage.removeItem("tracking_selected_supplier");
    await fetchTrackingData(selected.faktur);
  };

  // Hydrate selection from localStorage on mount
  useEffect(() => {
    const savedFaktur = localStorage.getItem("tracking_selected_faktur");
    const savedNama = localStorage.getItem("tracking_selected_nama");
    const savedSupplier = localStorage.getItem("tracking_selected_supplier");
    const savedPO = localStorage.getItem("tracking_selected_po");
    const savedPath = localStorage.getItem("tracking_selected_path") as
      | "bom"
      | "rekap"
      | null;

    if (savedSupplier) setSelectedSupplier(savedSupplier);
    if (savedPO) setSelectedPO(savedPO);

    if (savedFaktur) {
      setSelectedFaktur(savedFaktur);
      setSelectedNama(savedNama || "");
      setTrackingPath(savedPath);
      fetchTrackingData(savedFaktur);
    } else if (savedPO) {
      setTrackingPath("rekap");
      fetchTrackingData(savedPO);
    }
     
  }, []);

  // Auto-refresh when sync happens from another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sintak_data_updated" && selectedFaktur) {
        setIsAutoRefreshing(true);
        fetchTrackingData(selectedFaktur).finally(() => {
          setTimeout(() => setIsAutoRefreshing(false), 3000);
        });
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
     
  }, [selectedFaktur]);

  // Validation: Clear selected PB if it doesn't match the selected PO
  useEffect(() => {
    if (selectedPO && selectedFaktur && trackingPath === "rekap") {
      if (selectedFakturPO && selectedFakturPO !== selectedPO) {
        setSelectedFaktur(null);
        setSelectedNama("");
        setSelectedFakturPO(null);
        fetchTrackingData(selectedPO);
      }
    }
  }, [selectedPO, selectedFaktur, selectedFakturPO, trackingPath]);

  // Validation: Clear selected item if it doesn't match the selected supplier
  useEffect(() => {
    if (selectedSupplier && trackingPath === "rekap") {
      if (
        !selectedFakturSupplier ||
        selectedFakturSupplier !== selectedSupplier
      ) {
        setSelectedFaktur(null);
        setSelectedNama("");
        setSelectedFakturSupplier(null);
        setTrackingPath(null);
        setTrackingData(null);
        localStorage.removeItem("tracking_selected_faktur");
        localStorage.removeItem("tracking_selected_nama");
        localStorage.removeItem("tracking_selected_faktur_supplier");
        localStorage.removeItem("tracking_selected_path");
      }
    }
  }, [selectedSupplier, selectedFakturSupplier, trackingPath]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
      {/* SELECTORS SECTION - Single Card */}
      <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-sm rounded-xl p-3 shrink-0 relative z-50">
        <div className="flex flex-col xl:flex-row gap-3 min-w-0 items-center">
          {/* BOM Selector */}
          <div className="flex flex-col relative z-10 w-full xl:w-auto xl:min-w-[280px]">
            <SearchableDropdown
              id="tracking-bom-select"
              label="Pilih BOM (Bill of Material)"
              value={selectedFaktur && trackingPath === "bom" ? selectedFaktur : ""}
              items={bomItems}
              itemLabels={bomItemLabels}
              placeholder="Cari BOM atau Produk..."
              searchPlaceholder="Cari nomor BOM atau nama produk..."
              triggerWidth="w-full"
              usePortal={true}
              icon={<Package size={14} className={selectedFaktur && trackingPath === "bom" ? "text-emerald-600" : "text-gray-400"} />}
              onSearchQueryChange={(query) => setQ(query)}
              onChange={(val) => {
                if (val) {
                  const s = suggestions.find((item) => item.faktur === val);
                  if (s) handleSelect(s);
                  else handleSelect({ faktur: val, nama_prd: "" });
                } else {
                  resetTracking();
                }
              }}
            />
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-gray-200/60 mx-2 self-stretch"></div>

          {/* Rest of filters */}
          <div className="flex flex-col lg:flex-row gap-4 relative z-10 flex-1 min-w-0 items-center">
            {/* Left: Searchable Selects (Supplier, PO & Barang) */}
            <div className="flex-[1.5] flex flex-col lg:flex-row gap-3 min-w-0 w-full items-center">
              {/* Supplier Selector */}
              <div className="flex flex-col min-w-0 transition-all duration-300 flex-1 w-full">
                <SearchableDropdown
                  id="tracking-supplier-select"
                  label="Pilih Supplier (Opsional)"
                  value={selectedSupplier || ""}
                  items={supplierItems}
                  itemLabels={supplierItemLabels}
                  allLabel="-- Semua Supplier --"
                  placeholder="Cari Supplier..."
                  searchPlaceholder="Ketik nama supplier..."
                  triggerWidth="w-full"
                  usePortal={true}
                  icon={<Truck size={14} className={selectedSupplier ? "text-emerald-600" : "text-gray-400"} />}
                  onSearchQueryChange={(query) => setQSupplier(query)}
                  onChange={(val) => {
                    const newSupplier = val || null;
                    setSelectedSupplier(newSupplier);
                    setSelectedPO(null);
                    if (newSupplier) {
                      localStorage.setItem("tracking_selected_supplier", newSupplier);
                    } else {
                      localStorage.removeItem("tracking_selected_supplier");
                    }
                    localStorage.removeItem("tracking_selected_po");
                    if (selectedFaktur) {
                      fetchTrackingData(selectedFaktur);
                    } else {
                      resetTracking();
                    }
                  }}
                />
              </div>

              {/* PO Number Selector */}
              <div className="flex flex-col min-w-0 transition-all duration-300 flex-1 w-full">
                <SearchableDropdown
                  id="tracking-po-select"
                  label="Pilih Nomor PO (Opsional)"
                  value={selectedPO || ""}
                  items={poItems}
                  itemLabels={poItemLabels}
                  allLabel="-- Semua Nomor PO --"
                  placeholder={selectedSupplier ? `PO dari ${selectedSupplier}...` : "Cari Nomor PO..."}
                  searchPlaceholder={selectedSupplier ? `Cari PO dari ${selectedSupplier}...` : "Cari nomor PO..."}
                  triggerWidth="w-full"
                  usePortal={true}
                  icon={<Hash size={14} className={selectedPO ? "text-emerald-600" : "text-gray-400"} />}
                  onSearchQueryChange={(query) => setQPO(query)}
                  onChange={(val) => {
                    const newPO = val || null;
                    setSelectedPO(newPO);
                    if (newPO) {
                      let shouldFetchPB = false;
                      if (trackingPath === "bom") {
                        setSelectedFaktur(null);
                        setSelectedNama("");
                      } else if (selectedFaktur) {
                        shouldFetchPB = true;
                      }

                      setTrackingData(null);
                      setTrackingPath("rekap");

                      if (!shouldFetchPB) {
                        setTrackingMeta({
                          isStartingFromRekap: false,
                          isStartingFromPO: true,
                          isBomPath: false,
                        });
                      }

                      localStorage.setItem("tracking_selected_po", newPO);
                      localStorage.setItem("tracking_selected_path", "rekap");

                      if (shouldFetchPB && selectedFaktur) {
                        fetchTrackingData(selectedFaktur);
                      } else {
                        fetchTrackingData(newPO);
                      }
                    } else {
                      localStorage.removeItem("tracking_selected_po");
                      if (selectedFaktur) {
                        fetchTrackingData(selectedFaktur);
                      } else {
                        resetTracking();
                      }
                    }
                  }}
                />
              </div>

              {/* Item Selector */}
              <div className="flex flex-col min-w-0 transition-all duration-300 flex-1 w-full">
                <SearchableDropdown
                  id="tracking-rekap-select"
                  label="Pilih Faktur/Barang"
                  value={selectedFaktur && trackingPath === "rekap" ? selectedFaktur : ""}
                  items={rekapItems}
                  itemLabels={rekapItemLabels}
                  allLabel="-- Semua Faktur PB --"
                  placeholder={selectedSupplier ? `Cari barang dari ${selectedSupplier}...` : "Cari Faktur PB atau Barang..."}
                  searchPlaceholder={selectedSupplier ? `Cari barang dari ${selectedSupplier}...` : "Cari faktur atau nama barang..."}
                  triggerWidth="w-full"
                  usePortal={true}
                  icon={<ShoppingCart size={14} className={selectedFaktur && trackingPath === "rekap" ? "text-emerald-600" : "text-gray-400"} />}
                  onSearchQueryChange={(query) => setQRekap(query)}
                  onChange={(val) => {
                    if (val) {
                      const s = rekapSuggestions.find((item) => item.faktur === val);
                      setSelectedFaktur(val);
                      setSelectedNama(s?.nm_barang || s?.kd_barang || "");
                      setSelectedFakturSupplier(s?.kd_supplier || null);
                      setSelectedFakturPO(s?.faktur_po || null);
                      setTrackingPath("rekap");
                      localStorage.setItem("tracking_selected_faktur", val);
                      localStorage.setItem("tracking_selected_nama", s?.nm_barang || s?.kd_barang || "");
                      localStorage.setItem("tracking_selected_faktur_supplier", s?.kd_supplier || "");
                      localStorage.setItem("tracking_selected_path", "rekap");
                      fetchTrackingData(val);
                    } else {
                      if (selectedPO) {
                        setSelectedFaktur(null);
                        setSelectedNama("");
                        fetchTrackingData(selectedPO);
                        localStorage.removeItem("tracking_selected_faktur");
                      } else {
                        resetTracking();
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Part 2: Date Range + Reset */}
            <div className="lg:w-auto lg:min-w-[340px] flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-8 justify-center">
              <div className="flex flex-col">
                <span className="block font-semibold text-gray-500 ml-1 tracking-tight select-none text-[13px] mb-2">
                  Rentang Tanggal
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative group min-w-0">
                    <DatePicker
                      name="startDate"
                      value={startDate}
                      onChange={(d) => setStartDate(d)}
                    />
                  </div>
                  <div className="w-3 h-0.5 bg-gray-100 rounded-full shrink-0" />
                  <div className="flex-1 relative group min-w-0">
                    <DatePicker
                      name="endDate"
                      value={endDate}
                      onChange={(d) => setEndDate(d)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    title={
                      hasActiveFilters
                        ? "Reset semua filter (BOM, supplier, PO, tanggal, pencarian)"
                        : "Belum ada filter aktif"
                    }
                    className={`h-10 px-3 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      hasActiveFilters
                        ? "bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 border-gray-100 hover:border-rose-100 shadow-sm"
                        : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <RotateCcw size={14} className={hasActiveFilters ? "" : "opacity-50"} />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm flex items-start gap-4 animate-in fade-in shrink-0">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="font-bold leading-tight">{error}</p>
        </div>
      )}

      {/* RESULTS SECTION */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        {/* Header */}
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <h3 className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none overflow-hidden pr-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                <Clock size={16} />
              </div>
              <span className="shrink-0">Visualisasi Alur Manufaktur</span>
              {(selectedSupplier || selectedPO || selectedFaktur) && (
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-100 text-[11px] text-gray-400 font-medium min-w-0 overflow-hidden">
                  {trackingPath === "bom" ? (
                    <>
                      <span className="shrink-0">BOM:</span>
                      <span
                        title={
                          selectedFaktur
                            ? `[${selectedFaktur}] ${selectedNama}`
                            : ""
                        }
                        className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 truncate max-w-[400px] font-bold"
                      >
                        [{selectedFaktur}] {selectedNama}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="shrink-0">Supplier:</span>
                      <span className="bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-100 shrink-0 font-bold">
                        {selectedSupplier || "-"}
                      </span>
                      <span className="shrink-0 ml-1">PO:</span>
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 shrink-0 font-bold">
                        {selectedPO || "-"}
                      </span>
                      <span className="shrink-0 ml-1 text-gray-300">|</span>
                      <span className="shrink-0">Barang:</span>
                      <span
                        title={
                          selectedFaktur
                            ? `[${selectedFaktur}] ${selectedNama}`
                            : ""
                        }
                        className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 truncate max-w-[400px] font-bold"
                      >
                        {selectedFaktur
                          ? `[${selectedFaktur}] ${selectedNama}`
                          : "-"}
                      </span>
                      <span className="shrink-0 ml-1 text-gray-300">|</span>
                      <span className="shrink-0">
                        Periode: {formatPeriod()}
                      </span>
                    </>
                  )}
                </div>
              )}
            </h3>
            {isAutoRefreshing && (
              <div className="flex items-center gap-3 text-[11px] font-bold text-emerald-600 animate-pulse bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses Data...</span>
              </div>
            )}
          </div>
          <SearchAndReload
            searchQuery={filterText}
            setSearchQuery={setFilterText}
            onReload={() => {
              if (selectedFaktur) fetchTrackingData(selectedFaktur);
            }}
            loading={loadingData}
            placeholder="Cari dalam hasil pelacakan (faktur, barang, pelanggan, dll)..."
          />
        </div>

        {/* Tab bar + table area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white/80 backdrop-blur-md border border-white/20 shadow-sm rounded-xl">
          {loadingData ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-gray-100 rounded-full border-t-emerald-600 animate-spin" />
                <span className="text-[12px] font-bold text-gray-500 animate-pulse">
                  Menelusuri alur produksi...
                </span>
              </div>
            </div>
          ) : !trackingData ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                  <Clock className="text-gray-200" size={32} />
                </div>
                <p className="text-[13px] font-bold text-gray-400">
                  Pilih BOM atau Barang untuk memulai pelacakan
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable Tab Bar */}
              <div className="flex overflow-x-auto custom-scrollbar shrink-0 border-b border-gray-100 px-2 pt-2 gap-1">
                {tabs.map((tab) => {
                  const count = filterRows(tab.getData()).length;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg whitespace-nowrap text-[12px] font-bold transition-all shrink-0 border-b-2 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-500"
                          : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold tracking-wide">
                          {tab.badge}
                        </span>
                      )}
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                          count > 0
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content — Horizontal Table */}
              <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                {activeTabData.rows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="text-gray-200" size={28} />
                    </div>
                    <p className="text-[13px] font-bold text-gray-400">
                      Tidak ada data pada tahap ini
                    </p>
                    {debouncedFilterText && (
                      <p className="text-[11px] text-gray-300 mt-1">
                        untuk pencarian &quot;{debouncedFilterText}&quot;
                      </p>
                    )}
                  </div>
                ) : (
                  <table className="w-full text-left border-separate border-spacing-0 text-[12px]">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 bg-gray-50 border-b border-r border-gray-100 text-[11px] font-bold text-gray-400 tracking-widest whitespace-nowrap w-10">
                          #
                        </th>
                        {activeTabData.columns.map((col) => (
                          <th
                            key={col}
                            className="px-4 py-3 bg-gray-50 border-b border-r border-gray-100 text-[11px] font-bold text-gray-500 tracking-wide whitespace-nowrap last:border-r-0"
                          >
                            {toTitleCase(col)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row: any, rowIdx: number) => {
                        const globalIdx =
                          (currentPage - 1) * PAGE_SIZE + rowIdx;
                        return (
                          <tr
                            key={rowIdx}
                            className={`border-b border-gray-50 transition-colors hover:bg-emerald-50/40 ${
                              rowIdx % 2 === 1 ? "bg-gray-50/30" : "bg-white"
                            }`}
                          >
                            <td className="px-4 py-2.5 border-r border-gray-50 text-[11px] text-gray-300 font-bold tabular-nums">
                              {globalIdx + 1}
                            </td>
                            {activeTabData.columns.map((col) => {
                              const val = row[col];
                              let display =
                                val === null || val === undefined
                                  ? "-"
                                  : typeof val === "string"
                                    ? val.replace(/<[^>]*>?/gm, "").trim() ||
                                      "-"
                                    : String(val);
                              // Format numbers
                              const num = parseFloat(display.replace(/,/g, ""));
                              if (
                                !isNaN(num) &&
                                display.includes(".") &&
                                display.length > 5
                              ) {
                                display = num.toLocaleString("id-ID", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                });
                              }
                              // Highlight search text
                              const lowerSearch =
                                debouncedFilterText.toLowerCase();
                              const isMatch =
                                debouncedFilterText &&
                                display.toLowerCase().includes(lowerSearch);
                              return (
                                <td
                                  key={col}
                                  className="px-4 py-2.5 border-r border-gray-50 last:border-r-0 font-medium text-gray-700 whitespace-nowrap max-w-[280px] overflow-hidden text-ellipsis"
                                >
                                  {isMatch ? (
                                    <HighlightedText
                                      text={display}
                                      highlight={debouncedFilterText}
                                    />
                                  ) : (
                                    display
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30 gap-3">
                {/* Left: Info Section */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Count Info */}
                  <span className="text-[11px] font-bold text-gray-400">
                    {activeTabData.rows.length > 0
                      ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, activeTabData.rows.length)} dari ${activeTabData.rows.length} data`
                      : "0 data"}
                    {debouncedFilterText
                      ? ` untuk "${debouncedFilterText}"`
                      : ""}
                  </span>

                  {/* Load Time */}
                  {loadTime !== null && (
                    <div
                      className={`text-[11px] px-2 py-1 rounded-full font-bold flex items-center gap-1.5 border tracking-wide ${
                        loadTime < 300
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : loadTime < 1000
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : "bg-red-50 text-red-600 border-red-100"
                      }`}
                    >
                      <span>⚡</span>
                      <span>{(loadTime / 1000).toFixed(2)}s</span>
                    </div>
                  )}

                  {/* Total Qty (Only for specific tabs and Jalur Barang) */}
                  {trackingPath === "rekap" &&
                    (activeTab === "bahan_baku" ||
                      activeTab === "barang_jadi") &&
                    activeTabData.rows.length > 0 && (
                      <div className="text-[11px] font-bold text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                        <span>Total Qty:</span>
                        <span className="text-emerald-700 text-[12px]">
                          {activeTabData.totalQty.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                </div>

                {/* Right: Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold text-gray-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Halaman pertama"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold text-gray-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {/* Page number pills */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1,
                      )
                      .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                          acc.push("ellipsis");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "ellipsis" ? (
                          <span
                            key={`e-${i}`}
                            className="w-7 text-center text-[11px] text-gray-300 font-bold"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p as number)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                              currentPage === p
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                          >
                            {p}
                          </button>
                        ),
                      )}

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold text-gray-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold text-gray-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Halaman terakhir"
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
