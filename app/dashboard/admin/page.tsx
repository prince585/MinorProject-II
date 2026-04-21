"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Bell, Home, Map, Truck, Users, Play, Pause, Square, Radio, LogOut, Loader2 } from "lucide-react";
import axios from "axios";

// Dynamic import for Map
const AdminMap = dynamic(() => import("../../components/AdminMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-200 animate-pulse rounded-xl" />,
});

const MapPicker = dynamic(() => import("../../components/MapPicker"), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 rounded-xl flex items-center justify-center animate-pulse" />,
});

export default function AdminDashboard() {
    const router = useRouter();
    const [driver, setDriver] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [vehicle, setVehicle] = useState<any>(null);
    const [routeStatus, setRouteStatus] = useState<"active" | "inactive" | "paused">("inactive");
    const [activeTab, setActiveTab] = useState("tracking");
    const [broadcastResult, setBroadcastResult] = useState<any>(null);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Setup Form State
    const [setupFormData, setSetupFormData] = useState({
        driverId: "",
        lat: 0,
        lng: 0,
        status: "inactive" as "active" | "inactive" | "paused"
    });
    const [setupMapPosition, setSetupMapPosition] = useState<[number, number] | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Broadcast Automation
    const [isAutoBroadcastEnabled, setIsAutoBroadcastEnabled] = useState(false);
    const [lastBroadcastTime, setLastBroadcastTime] = useState<number>(0);

    // Login check
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            router.push("/Auth/login");
            return;
        }
        try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role !== "admin") {
                alert("Access Denied: Admins only");
                router.push("/dashboard/citizen");
                return;
            }
            setDriver(parsedUser);
            setSetupFormData(prev => ({ ...prev, driverId: parsedUser._id }));
        } catch (e) {
            console.error("Failed to parse user", e);
            router.push("/Auth/login");
        }
    }, [router]);

    // Fetch Users (Citizens)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get("/api/admin/users");
                setUsers(res.data);
            } catch (err) {
                console.error("Fetch users error", err);
            }
        };
        fetchUsers();
    }, []);

    // Fetch Vehicle & Periodically Update
    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const res = await axios.get("/api/admin/vehicle");
                if (res.status === 200) {
                    setVehicle(res.data);
                    setRouteStatus(res.data.routeStatus);
                }
            } catch (err) {
                // ignore 404
            }
        };

        // Initial fetch to sync state
        fetchVehicle();

        // Only poll if the route is active
        let interval: NodeJS.Timeout | null = null;
        if (routeStatus === "active") {
            interval = setInterval(fetchVehicle, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [routeStatus]);

    // Simulation: Update Vehicle Location (Since we don't have a real GPS stream from a device)
    // In a real app, this would be coming from the Driver's mobile device GPS.
    // Here, we can simulate movement or just rely on manual postman updates?
    // Let's add a "Simulate Movement" button or just let it be manual via API for now, 
    // OR allow clicking on map to teleport vehicle? Admins usually don't teleport vehicles.
    // I made Map read-only. Ideally, the driver runs this on mobile and we capture `navigator.geolocation`.

    // Let's implement actual GPS capture if route is ACTIVE.
    useEffect(() => {
        if (routeStatus !== "active" || !driver) return;

        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Send update to backend
                try {
                    await axios.post("/api/admin/vehicle", {
                        driverId: driver._id,
                        lat: latitude,
                        lng: longitude,
                        status: "active"
                    });
                    // Also Broadcast check periodically? Or assume backend job?
                    // Frontend triggering broadcast for demo purposes:
                    if (isAutoBroadcastEnabled && Date.now() - lastBroadcastTime > 10000) {
                        try {
                            const res = await axios.post("/api/admin/broadcast", {
                                vehicleId: vehicle?._id,
                                radius: 700
                            });
                            setBroadcastResult(res.data);
                            setLastBroadcastTime(Date.now());
                            setTimeout(() => setBroadcastResult(null), 5000);
                        } catch (err) {
                            console.error("Auto-broadcast failed", err);
                        }
                    }
                } catch (err) {
                    console.error("GPS Update failed", err);
                }
            },
            (err) => console.error(err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [routeStatus, driver, isAutoBroadcastEnabled, lastBroadcastTime, vehicle?._id]);

    // Broadcast Trigger (Auto/Manual)
    const handleBroadcast = async () => {
        if (!vehicle?._id) return;
        setIsBroadcasting(true);
        try {
            const res = await axios.post("/api/admin/broadcast", {
                vehicleId: vehicle._id,
                radius: 700
            });
            setBroadcastResult(res.data);
            setTimeout(() => setBroadcastResult(null), 5000);
        } catch (err) {
            console.error("Broadcast failed", err);
        } finally {
            setIsBroadcasting(false);
        }
    };

    // Manual Setup Submit
    const handleSetupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!setupFormData.driverId || setupFormData.lat === 0) {
            alert("Please select a driver and a location on the map.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await axios.post("/api/admin/vehicle", setupFormData);
            if (res.status === 200) {
                setVehicle(res.data);
                setRouteStatus(res.data.routeStatus);
                alert("Vehicle configuration saved successfully!");
                setActiveTab("tracking");
            }
        } catch (err) {
            console.error("Setup failed", err);
            alert("Failed to save vehicle configuration.");
        } finally {
            setIsSaving(false);
        }
    };

    // Route Controls
    const toggleRoute = async (status: "active" | "inactive" | "paused") => {
        if (!driver) return;
        setIsActionLoading(true);
        // Need current location to update status
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await axios.post("/api/admin/vehicle", {
                    driverId: driver._id,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    status: status
                });
                if (res.status === 200) {
                    setRouteStatus(status);
                    setVehicle(res.data);
                }
            } catch (err) {
                console.error("Status update failed", err);
            } finally {
                setIsActionLoading(false);
            }
        }, (err) => {
            alert("GPS required to start route");
            setIsActionLoading(false);
        });
    };

    if (!driver) return <div className="flex h-screen items-center justify-center">Authenticate as Admin...</div>;

    const vehicleCoords: [number, number] | undefined = vehicle?.currentLocation?.coordinates
        ? [vehicle.currentLocation.coordinates[1], vehicle.currentLocation.coordinates[0]]
        : undefined;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-gray-900 text-white shadow-xl hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Truck className="h-6 w-6 text-blue-400" />
                        Admin Console
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab("tracking")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'tracking' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                    >
                        <Map className="h-5 w-5" />
                        Live Tracking
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                    >
                        <Users className="h-5 w-5" />
                        User Zones
                    </button>
                    <button
                        onClick={() => setActiveTab("vehicles")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'vehicles' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                    >
                        <Truck className="h-5 w-5" />
                        Vehicle Setup
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <div className="mb-4 px-4">
                        <p className="text-xs text-gray-400 text-center uppercase tracking-widest">Route Status</p>
                        <div className={`mt-2 text-center py-1 rounded text-sm font-bold uppercase ${routeStatus === 'active' ? 'bg-green-500/20 text-green-400' :
                            routeStatus === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                            {routeStatus}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem("user");
                            router.push("/Auth/login");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Overlay Controls for Tracking */}
                {activeTab === "tracking" && (
                    <>
                        <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col sm:flex-row gap-4 justify-between pointer-events-none">
                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-auto">
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-2">Vehicle Controls</h2>
                                <div className="flex gap-2">
                                    {routeStatus !== "active" && (
                                        <button
                                            onClick={() => toggleRoute("active")}
                                            disabled={isActionLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm"
                                        >
                                            {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Start Route
                                        </button>
                                    )}
                                    {routeStatus === "active" && (
                                        <button
                                            onClick={() => toggleRoute("paused")}
                                            disabled={isActionLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm"
                                        >
                                            {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />} Pause
                                        </button>
                                    )}
                                    <button
                                        onClick={() => toggleRoute("inactive")}
                                        disabled={isActionLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm"
                                    >
                                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4 fill-current" />} End
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-auto min-w-[300px]">
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-2">Broadcast System</h2>
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span>Proximity Radius:</span>
                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 rounded">700m</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Auto-Alert System</label>
                                        <button
                                            onClick={() => setIsAutoBroadcastEnabled(!isAutoBroadcastEnabled)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAutoBroadcastEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoBroadcastEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleBroadcast}
                                        disabled={isBroadcasting || !vehicle || isAutoBroadcastEnabled}
                                        className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm mt-1"
                                    >
                                        <Radio className={`h-4 w-4 ${isBroadcasting ? 'animate-pulse' : ''}`} />
                                        {isBroadcasting ? "Scanning..." : isAutoBroadcastEnabled ? "Auto-Scan Running" : "Manual Proximity Check"}
                                    </button>
                                    {broadcastResult && (
                                        <div className="mt-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-2 rounded flex justify-between">
                                            <span>Users: {broadcastResult.usersInRange}</span>
                                            <span>Alerts: {broadcastResult.notificationsSent}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Map Container - Full Screen */}
                        <div className="h-full w-full">
                            <AdminMap
                                users={users}
                                vehicleLocation={vehicleCoords}
                                vehicleRadius={700}
                            />
                        </div>
                    </>
                )}

                {activeTab === "vehicles" && (
                    <div className="p-8 max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                <h2 className="text-2xl font-bold">Vehicle Configuration</h2>
                                <p className="text-blue-100 text-sm mt-1">Manually set up your vehicle details and location.</p>
                            </div>

                            <form onSubmit={handleSetupSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Driver Assignment</label>
                                        <select
                                            value={setupFormData.driverId}
                                            onChange={(e) => setSetupFormData({ ...setupFormData, driverId: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5"
                                        >
                                            <option value={driver._id}>{driver.username} (Current Admin)</option>
                                            {/* In a real app, you might want to fetch all admins here */}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Initial Status</label>
                                        <select
                                            value={setupFormData.status}
                                            onChange={(e) => setSetupFormData({ ...setupFormData, status: e.target.value as any })}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5"
                                        >
                                            <option value="inactive">Inactive</option>
                                            <option value="active">Active</option>
                                            <option value="paused">Paused</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Set Initial Location</label>
                                    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                                        <MapPicker
                                            position={setupMapPosition}
                                            onLocationSelect={(lat: number, lng: number) => {
                                                setSetupMapPosition([lat, lng]);
                                                setSetupFormData({ ...setupFormData, lat, lng });
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 italic">Click on the map to set where the vehicle starts.</p>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : "Save Vehicle Configuration"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold mb-6">Registered Citizens</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Coordinates</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map((u) => (
                                        <tr key={u._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{u.username}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.address || "N/A"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {u.location?.coordinates ? `${u.location.coordinates[1].toFixed(5)}, ${u.location.coordinates[0].toFixed(5)}` : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
