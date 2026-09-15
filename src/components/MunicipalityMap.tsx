"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Community, Candidate, VoteRecord } from "@/lib/supabase";
import {
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import satiroDiasGeoJson from "@/data/satiro-dias-geojson.json";

interface MunicipalityMapProps {
  communities: Community[];
  candidates: Candidate[];
  votes: VoteRecord[];
  selectedCommunityId?: string | null;
  onSelectCommunity?: (communityId: string) => void;
  onUpdateCoordinates?: (communityId: string, lat: number, lng: number) => void;
}

// Exact geographical center of Sátiro Dias municipality
const SATIRO_DIAS_CENTER: [number, number] = [-11.5972, -38.5914];

export default function MunicipalityMap({
  communities,
  candidates,
  votes,
  selectedCommunityId,
  onSelectCommunity,
  onUpdateCoordinates,
}: MunicipalityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});
  const circlesRef = useRef<{ [id: string]: any }>({});
  const geoJsonLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  // Default to Google Maps Roadmap
  const [mapType, setMapType] = useState<"google-roadmap" | "google-satellite" | "google-terrain">("google-roadmap");
  const [showRadius, setShowRadius] = useState(true);

  // Tile provider URLs (Google Maps direct tiles)
  const getTileUrl = (type: "google-roadmap" | "google-satellite" | "google-terrain") => {
    switch (type) {
      case "google-satellite":
        // Google Maps Hybrid (Satellite + Roads/Labels)
        return "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
      case "google-terrain":
        // Google Maps Terrain
        return "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}";
      case "google-roadmap":
      default:
        // Google Maps Standard Roadmap
        return "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    }
  };

  const invalidateMapSize = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.invalidateSize({ pan: false });
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Initialize Map and Leaflet
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = () => {
      if ((window as any).L) {
        if (isMounted) initMap();
        return;
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => {
          if (isMounted) initMap();
        };
        document.head.appendChild(script);
      } else {
        const existingScript = document.getElementById("leaflet-js") as HTMLScriptElement;
        existingScript.addEventListener("load", () => {
          if (isMounted) initMap();
        });
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initMap = () => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: SATIRO_DIAS_CENTER,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    // Add Google Maps Tile Layer
    const tileUrl = getTileUrl(mapType);
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Draw official IBGE Municipality Boundary Polygon with high-contrast Google Maps style
    try {
      const geoLayer = L.geoJSON(satiroDiasGeoJson, {
        style: {
          color: "#2563eb", // Royal blue border
          weight: 3,
          opacity: 0.95,
          dashArray: "6, 6",
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
        },
      }).addTo(map);

      geoJsonLayerRef.current = geoLayer;

      // Fit map tightly to Sátiro Dias boundaries
      map.fitBounds(geoLayer.getBounds(), {
        padding: [20, 20],
      });
    } catch (err) {
      console.warn("Erro ao renderizar malha do IBGE:", err);
    }

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Multiple invalidateSize passes to completely eliminate the gray-box issue
    setTimeout(() => invalidateMapSize(), 100);
    setTimeout(() => invalidateMapSize(), 300);
    setTimeout(() => invalidateMapSize(), 600);
    setTimeout(() => invalidateMapSize(), 1200);
  };

  // ResizeObserver to ensure container changes never produce gray empty areas
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      invalidateMapSize();
    });

    observer.observe(mapContainerRef.current);

    window.addEventListener("resize", invalidateMapSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", invalidateMapSize);
    };
  }, [invalidateMapSize]);

  // Switch Tile Layer when mapType changes
  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const tileLayer = L.tileLayer(getTileUrl(mapType), {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = tileLayer;

    // Invalidate size after layer switch
    setTimeout(() => invalidateMapSize(), 150);
  }, [mapType, invalidateMapSize]);

  // Update Markers and Influence Halos
  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L || !mapLoaded) return;

    const map = mapInstanceRef.current;

    // Clear old markers & circles
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    Object.values(circlesRef.current).forEach((c: any) => c.remove());
    markersRef.current = {};
    circlesRef.current = {};

    const maxVotes = Math.max(
      ...communities.map((c) => {
        return votes
          .filter((v) => v.community_id === c.id)
          .reduce((sum, v) => sum + (Number(v.votes) || 0), 0);
      }),
      1
    );

    communities.forEach((comm) => {
      const lat = comm.latitude || SATIRO_DIAS_CENTER[0];
      const lng = comm.longitude || SATIRO_DIAS_CENTER[1];

      // Calculate votes for this community
      const commVotes = votes.filter((v) => v.community_id === comm.id);
      const totalVotes = commVotes.reduce((sum, v) => sum + (Number(v.votes) || 0), 0);

      const candidateBreakdown = candidates.map((cand) => {
        const v = commVotes.find((cv) => cv.candidate_id === cand.id);
        return {
          name: cand.name,
          position: cand.position,
          votes: v ? Number(v.votes) : 0,
        };
      });

      const isSelected = selectedCommunityId === comm.id;

      // Influence circle
      if (showRadius) {
        const radiusMeters = 700 + (totalVotes / maxVotes) * 2000;
        const circle = L.circle([lat, lng], {
          color: isSelected ? "#ef4444" : "#2563eb",
          fillColor: isSelected ? "#f87171" : "#3b82f6",
          fillOpacity: isSelected ? 0.35 : 0.15,
          radius: radiusMeters,
          weight: isSelected ? 2.5 : 1.5,
          dashArray: "4, 4",
        }).addTo(map);
        circlesRef.current[comm.id] = circle;
      }

      // Google Maps Red Pin Style
      const customIcon = L.divIcon({
        className: "custom-pin",
        html: `
          <div class="relative flex flex-col items-center cursor-pointer group select-none" style="transform: translate(-50%, -100%);">
            <!-- Label Badge -->
            <div class="px-2.5 py-1 rounded-md text-[11px] font-bold shadow-2xl whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 ${
              isSelected
                ? "bg-red-600 text-white border-white scale-110 ring-4 ring-red-500/40"
                : "bg-slate-900/95 text-slate-100 border-slate-700 hover:border-red-400 group-hover:scale-105"
            }">
              <span class="w-2 h-2 rounded-full ${isSelected ? "bg-white animate-ping" : "bg-red-500"}"></span>
              <span>${comm.name}</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-red-300 font-extrabold">
                ${totalVotes}
              </span>
            </div>

            <!-- Google Maps Classic Pin Needle -->
            <div class="w-3.5 h-3.5 ${
              isSelected ? "bg-red-600" : "bg-red-500"
            } rotate-45 -mt-1.5 shadow-lg border-r border-b border-black/30"></div>
            <div class="w-3 h-1.5 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      // Handle dragend to update coordinates dynamically
      marker.on("dragend", (e: any) => {
        const newLatLng = e.target.getLatLng();
        if (onUpdateCoordinates) {
          onUpdateCoordinates(comm.id, newLatLng.lat, newLatLng.lng);
        }
        // Update circle position if present
        if (circlesRef.current[comm.id]) {
          circlesRef.current[comm.id].setLatLng(newLatLng);
        }
      });

      // Popup
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      const popupHtml = `
        <div class="p-1 font-sans text-slate-900 min-w-[220px]">
          <div class="font-bold text-sm text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center justify-between">
            <span class="text-red-700 font-extrabold flex items-center gap-1">
              📍 ${comm.name}
            </span>
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
              ${totalVotes} votos
            </span>
          </div>

          <div class="space-y-1.5 text-xs">
            ${candidateBreakdown
              .map(
                (c, i) => `
              <div class="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                <div>
                  <div class="font-bold text-slate-800">${c.name}</div>
                  <div class="text-[10px] text-slate-500">${c.position}</div>
                </div>
                <div class="font-extrabold text-sm ${i === 0 ? "text-amber-600" : "text-emerald-600"}">
                  ${c.votes.toLocaleString("pt-BR")}
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="mt-2 text-[10px] text-amber-800 bg-amber-50 rounded p-1 text-center font-medium border border-amber-200">
            🖐️ Pino arrastável: arraste no mapa para ajustar
          </div>

          <div class="mt-2 pt-1.5 border-t border-slate-200 flex justify-between items-center text-[10px]">
            <span class="text-slate-500">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
            <a
              href="${googleMapsUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
            >
              Abrir no Google Maps ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        className: "custom-map-popup",
      });

      marker.on("click", () => {
        if (onSelectCommunity) onSelectCommunity(comm.id);
      });

      markersRef.current[comm.id] = marker;
    });
  }, [
    communities,
    candidates,
    votes,
    selectedCommunityId,
    mapLoaded,
    showRadius,
    onSelectCommunity,
  ]);

  // Center on selected community
  useEffect(() => {
    if (!selectedCommunityId || !mapInstanceRef.current) return;
    const selectedComm = communities.find((c) => c.id === selectedCommunityId);
    if (selectedComm && selectedComm.latitude && selectedComm.longitude) {
      mapInstanceRef.current.flyTo(
        [selectedComm.latitude, selectedComm.longitude],
        13,
        { duration: 1.2 }
      );
      const marker = markersRef.current[selectedCommunityId];
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
          invalidateMapSize();
        }, 300);
      }
    }
  }, [selectedCommunityId, communities, invalidateMapSize]);

  const resetToMunicipality = () => {
    invalidateMapSize();
    if (mapInstanceRef.current && geoJsonLayerRef.current) {
      mapInstanceRef.current.fitBounds(geoJsonLayerRef.current.getBounds(), {
        padding: [20, 20],
        duration: 1,
      });
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(SATIRO_DIAS_CENTER, 11, { duration: 1 });
    }
  };

  const zoomIn = () => {
    mapInstanceRef.current?.zoomIn();
    invalidateMapSize();
  };

  const zoomOut = () => {
    mapInstanceRef.current?.zoomOut();
    invalidateMapSize();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl flex flex-col">
      {/* Map Header Toolbar */}
      <div className="p-4 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white leading-tight">
                Mapa do Município (Google Maps)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Sátiro Dias - BA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Visualização oficial com base cartográfica do Google
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Radius Toggle */}
          <button
            onClick={() => {
              setShowRadius(!showRadius);
              invalidateMapSize();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              showRadius
                ? "bg-red-600/20 text-red-300 border-red-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Densidade</span>
          </button>

          {/* Google Maps Layer Modes */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setMapType("google-roadmap")}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                mapType === "google-roadmap"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Google Ruas
            </button>
            <button
              onClick={() => setMapType("google-satellite")}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                mapType === "google-satellite"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Google Satélite
            </button>
            <button
              onClick={() => setMapType("google-terrain")}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                mapType === "google-terrain"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Relevo
            </button>
          </div>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative w-full h-[480px] bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Controls */}
        <div className="absolute right-4 top-4 z-20 flex flex-col gap-1.5 shadow-xl">
          <button
            onClick={zoomIn}
            title="Aproximar"
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition active:scale-95 shadow-md"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            title="Afastar"
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition active:scale-95 shadow-md"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetToMunicipality}
            title="Ajustar ao Município de Sátiro Dias"
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 transition active:scale-95 shadow-md"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Territory Info Legend Tag */}
        <div className="absolute left-4 top-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs text-slate-300 shadow-lg pointer-events-none">
          <span className="w-2.5 h-2.5 rounded border border-blue-400 bg-blue-500/20" />
          <span className="font-semibold text-slate-200">
            Limite Oficial Sátiro Dias
          </span>
        </div>

        {/* Google Maps Attribution Badge */}
        <div className="absolute right-4 bottom-16 z-20 px-2 py-0.5 rounded bg-white/90 text-[10px] font-semibold text-slate-800 shadow-sm pointer-events-none">
          Google Maps
        </div>

        {/* Quick Polo Selector */}
        <div className="absolute left-4 bottom-4 right-4 z-20 flex items-center gap-2 overflow-x-auto py-2 px-2.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 whitespace-nowrap">
            Polos:
          </span>
          {communities.map((comm) => {
            const isSelected = selectedCommunityId === comm.id;
            return (
              <button
                key={comm.id}
                onClick={() => {
                  if (onSelectCommunity) onSelectCommunity(comm.id);
                  invalidateMapSize();
                }}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  isSelected
                    ? "bg-red-600 text-white font-semibold shadow-md shadow-red-600/40 scale-105"
                    : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50"
                }`}
              >
                {comm.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
