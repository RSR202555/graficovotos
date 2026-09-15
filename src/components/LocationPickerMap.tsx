"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Search } from "lucide-react";

interface LocationPickerMapProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

const SATIRO_DIAS_CENTER: [number, number] = [-11.5972, -38.5914];

export default function LocationPickerMap({ lat, lng, onChange }: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const initMap = useCallback(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: lat && lng ? [lat, lng] : SATIRO_DIAS_CENTER,
      zoom: 11,
      zoomControl: true,
    });

    // Use Google Maps Hybrid Tiles
    L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 20,
    }).addTo(map);

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current.getLatLng();
        onChange(pos.lat, pos.lng);
      });
    }

    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current.getLatLng();
          onChange(pos.lat, pos.lng);
        });
      }
      onChange(lat, lng);
    });

    mapInstanceRef.current = map;
    
    // Fix sizing issue in modals
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  }, [lat, lng, onChange]);

  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = () => {
      if ((window as any).L) {
        if (isMounted) initMap();
        return;
      }
      const existingScript = document.getElementById("leaflet-js");
      if (existingScript) {
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
  }, [initMap]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Append city and state to improve accuracy
      const query = `${searchQuery}, Sátiro Dias, Bahia`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const parsedLat = parseFloat(data[0].lat);
        const parsedLng = parseFloat(data[0].lon);
        
        // Verifica se a busca retornou exatamente o centro genérico da cidade (pode indicar que não achou o povoado específico)
        const isCityCenter = data[0].type === "administrative" || data[0].addresstype === "municipality";

        const L = (window as any).L;
        if (mapInstanceRef.current && L) {
          mapInstanceRef.current.setView([parsedLat, parsedLng], 14);
          
          if (markerRef.current) {
            markerRef.current.setLatLng([parsedLat, parsedLng]);
          } else {
            markerRef.current = L.marker([parsedLat, parsedLng], { draggable: true }).addTo(mapInstanceRef.current);
            markerRef.current.on("dragend", () => {
              const pos = markerRef.current.getLatLng();
              onChange(pos.lat, pos.lng);
            });
          }
          onChange(parsedLat, parsedLng);
          
          if (isCityCenter) {
            alert("Aviso: Não achamos o local exato pelo nome, então o mapa foi movido para o centro da cidade. Você pode ARRASTAR O PINO ou clicar no mapa para marcar o local exato!");
          }
        }
      } else {
        alert("Local não encontrado. Tente digitar de outra forma ou clique diretamente no mapa.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro na pesquisa.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSearch} className="flex gap-2 relative z-[1001]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar local no mapa..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50"
        >
          {isSearching ? "Buscando..." : "Buscar"}
        </button>
      </form>
      
      <div className="w-full h-48 rounded-lg border border-slate-700 overflow-hidden relative z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white border border-slate-700/50 shadow-xl pointer-events-none whitespace-nowrap">
          Clique no mapa para marcar a localização
        </div>
      </div>
    </div>
  );
}
