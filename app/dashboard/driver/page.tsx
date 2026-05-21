"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Activity, Loader2, LogOut, MapPin, Pause, Play, Radio, Square, Truck } from "lucide-react";

const AdminMap = dynamic(() => import("../../components/AdminMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-gray-200" />,
});

const demoRoute = [
    { lat: 28.6139, lng: 77.2090 },
    { lat: 28.6152, lng: 77.2111 },
    { lat: 28.6166, lng: 77.2135 },
    { lat: 28.6181, lng: 77.2160 },
    { lat: 28.6194, lng: 77.2188 },
];

export default function DriverDashboard() {
    const router = useRouter();
    const [driver, setDriver] = useState<any>(null);
    const [status, setStatus] = useState<"active" | "inactive" | "paused">("inactive");
    const [lat, setLat] = useState("28.6139");
    const [lng, setLng] = useState("77.2090");
    const [isSaving, setIsSaving] = useState(false);
    const [isDemoRunning, setIsDemoRunning] = useState(false);
    const [message, setMessage] = useState("");
    const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const demoStepRef = useRef(0);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            router.push("/driver/login");
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role !== "driver" && parsedUser.role !== "admin") {
                router.push("/Auth/login");
                return;
            }
            setDriver(parsedUser);
        } catch (error) {
            console.error("Driver dashboard user parse error:", error);
            router.push("/driver/login");
        }
    }, [router]);

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const res = await axios.get("/api/admin/vehicle");
                setStatus(res.data.routeStatus);
                const coordinates = res.data.currentLocation?.coordinates;
                if (coordinates?.length === 2) {
                    setLng(String(coordinates[0]));
                    setLat(String(coordinates[1]));
                }
            } catch (error: any) {
                if (error?.response?.status !== 404) {
                    console.error("Driver vehicle fetch failed:", error);
                }
            }
        };

        fetchVehicle();
        const interval = setInterval(fetchVehicle, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        return () => {
            if (demoTimerRef.current) {
                clearInterval(demoTimerRef.current);
            }
        };
    }, []);

    const vehicleCoords = useMemo<[number, number] | undefined>(() => {
        const parsedLat = Number(lat);
        const parsedLng = Number(lng);

        if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
            return undefined;
        }

        return [parsedLat, parsedLng];
    }, [lat, lng]);

    const updateVehicle = async (nextStatus = status, nextLat = Number(lat), nextLng = Number(lng)) => {
        if (!driver) return;

        if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
            setMessage("Enter valid coordinates before updating the vehicle.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await axios.post("/api/admin/vehicle", {
                driverId: driver._id,
                lat: nextLat,
                lng: nextLng,
                status: nextStatus,
            });
            setStatus(res.data.routeStatus);
            setLat(String(nextLat));
            setLng(String(nextLng));
            setMessage("Truck location updated successfully.");
        } catch (error: any) {
            console.error("Driver vehicle update failed:", error);
            setMessage(error.response?.data?.error || "Failed to update truck location.");
        } finally {
            setIsSaving(false);
        }
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            setMessage("Geolocation is not available in this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLat(String(position.coords.latitude));
                setLng(String(position.coords.longitude));
                updateVehicle(status, position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error("Driver geolocation error:", error);
                setMessage("GPS permission is required to use current location.");
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    };

    const startDemoMovement = () => {
        if (!driver || isDemoRunning) return;

        setIsDemoRunning(true);
        demoStepRef.current = 0;
        updateVehicle("active", demoRoute[0].lat, demoRoute[0].lng);

        demoTimerRef.current = setInterval(() => {
            demoStepRef.current += 1;
            const point = demoRoute[demoStepRef.current % demoRoute.length];
            updateVehicle("active", point.lat, point.lng);
        }, 5000);
    };

    const stopDemoMovement = () => {
        if (demoTimerRef.current) {
            clearInterval(demoTimerRef.current);
            demoTimerRef.current = null;
        }
        setIsDemoRunning(false);
        updateVehicle("paused");
    };

    if (!driver) {
        return <div className="flex h-screen items-center justify-center">Authenticating driver...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
            <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-800">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Driver Panel</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Live truck controls and demo movement</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem("user");
                            router.push("/driver/login");
                        }}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </header>

            <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[380px_1fr]">
                <section className="space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-bold">
                                <Activity className="h-5 w-5 text-emerald-500" />
                                Route State
                            </h2>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${status === "active" ? "bg-green-100 text-green-700" : status === "paused" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                                {status}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateVehicle("active")} className="flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white">
                                <Play className="h-4 w-4" /> Active
                            </button>
                            <button onClick={() => updateVehicle("paused")} className="flex items-center justify-center gap-1 rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white">
                                <Pause className="h-4 w-4" /> Pause
                            </button>
                            <button onClick={() => updateVehicle("inactive")} className="flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">
                                <Square className="h-4 w-4" /> End
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                            <MapPin className="h-5 w-5 text-blue-500" />
                            Truck Coordinates
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <input value={lat} onChange={(e) => setLat(e.target.value)} className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" placeholder="Latitude" />
                            <input value={lng} onChange={(e) => setLng(e.target.value)} className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" placeholder="Longitude" />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <button onClick={() => updateVehicle()} disabled={isSaving} className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Truck"}
                            </button>
                            <button onClick={useCurrentLocation} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold dark:border-gray-600">
                                Use GPS
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-md dark:border-emerald-500/20 dark:bg-emerald-500/10">
                        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
                            <Radio className="h-5 w-5 text-emerald-600" />
                            Academic Demo Mode
                        </h2>
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                            Simulate live movement in 5-second steps for presentations without GPS hardware.
                        </p>
                        <button
                            onClick={isDemoRunning ? stopDemoMovement : startDemoMovement}
                            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20"
                        >
                            {isDemoRunning ? "Stop Demo Movement" : "Start Demo Movement"}
                        </button>
                    </div>

                    {message && <div className="rounded-lg bg-white p-3 text-sm font-medium shadow dark:bg-gray-800">{message}</div>}
                </section>

                <section className="h-[680px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <AdminMap users={[]} vehicleLocation={vehicleCoords} vehicleRadius={700} />
                </section>
            </main>
        </div>
    );
}
