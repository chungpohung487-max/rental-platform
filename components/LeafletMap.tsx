'use client';

import { useEffect, useRef } from 'react';

interface MapProduct {
  id: number;
  title: string;
  daily_rent: number;
  latitude: number;
  longitude: number;
  available_quantity: number;
}

interface LeafletMapProps {
  products: MapProduct[];
}

export function LeafletMap({ products }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      // Fix default marker icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView([25.033, 121.565], 11);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const withCoords = products.filter((p) => p.latitude && p.longitude && p.available_quantity > 0);

      // Group nearby markers by coordinates
      const groups = new Map<string, MapProduct[]>();
      for (const p of withCoords) {
        const key = `${p.latitude.toFixed(3)},${p.longitude.toFixed(3)}`;
        const g = groups.get(key) ?? [];
        g.push(p);
        groups.set(key, g);
      }

      groups.forEach((group, key) => {
        const [lat, lng] = key.split(',').map(Number);
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#E8C4B8;color:#2C2C2C;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">${group.length}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const popup = group.map((p) =>
          `<div style="margin-bottom:8px;"><a href="/products/${p.id}" style="color:#B8877A;font-weight:600;text-decoration:none;">${p.title}</a><br><span style="font-size:12px;color:#7A7570;">NT$${p.daily_rent}/天 · 剩 ${p.available_quantity} 件</span></div>`
        ).join('<hr style="margin:4px 0;border-color:#E5E0D8;">');
        L.marker([lat, lng], { icon }).bindPopup(`<div style="font-size:13px;min-width:160px;">${popup}</div>`).addTo(map);
      });
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [products]);

  return (
    <div
      ref={mapRef}
      style={{ height: '400px', width: '100%', borderRadius: '16px', overflow: 'hidden' }}
    />
  );
}
