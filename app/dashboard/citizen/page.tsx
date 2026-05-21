"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Activity, Bell, Home, LogOut, Map, Radio, Truck, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

// Dynamic import for Map to avoid SSR issues
const LiveMap = dynamic(() => import("../../components/LiveMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-200 animate-pulse rounded-xl" />,
});

// Haversine Formula for distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

interface Notification {
    _id: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export default function CitizenDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [vehicle, setVehicle] = useState<any>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [distance, setDistance] = useState<number | null>(null);
    const [status, setStatus] = useState("Waiting for updates...");
    const [activeTab, setActiveTab] = useState("dashboard");
    const [demoStatus, setDemoStatus] = useState<"Far" | "Approaching" | "Nearby" | null>(null);
    const [showDemoNotification, setShowDemoNotification] = useState(false);
    const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Mock Login - in real app, use session/context
    // For MVP, we'll fetch a hardcoded user or from local storage if we had login persistence.
    // Since we don't have full AuthContext yet, I will simulate by fetching "me" or handling redirect if not logged in.
    // However, I need to know WHO is logged in. 
    // I'll add a simple localStorage check for 'userId' which meant to be set on login.

    useEffect(() => {
        // 1. Get User ID (simulate auth)
        // In a real app, this comes from a session or cookie-validated API
        // For this MVP, I'll rely on a localStorage item set during Login (I need to update Login for this)
        // Or I can just redirect to login if no token/userId.
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            router.push("/Auth/login");
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [router]);

    // 2. Poll Vehicle Location
    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const res = await axios.get("/api/admin/vehicle");
                if (res.status === 200) {
                    setVehicle(res.data);
                }
            } catch (err) {
                console.error("Vehicle fetch error", err);
            }
        };

        const interval = setInterval(fetchVehicle, 5000); // Poll every 5s
        fetchVehicle(); // Initial fetch
        return () => clearInterval(interval);
    }, []);

    // 3. Fetch Notifications
    useEffect(() => {
        if (!user?._id) return;
        const fetchNotifications = async () => {
            try {
                const res = await axios.get(`/api/user/notifications?userId=${user._id}`);
                setNotifications(res.data);
            } catch (err) {
                console.error("Notifications error", err);
            }
        };
        fetchNotifications();
    }, [user]);

    // 4. Calculate Distance & Status
    useEffect(() => {
        if (user?.location?.coordinates && vehicle?.currentLocation?.coordinates) {
            // MongoDB GeoJSON is [lng, lat]
            const [userLng, userLat] = user.location.coordinates;
            const [vehLng, vehLat] = vehicle.currentLocation.coordinates;

            const dist = getDistance(userLat, userLng, vehLat, vehLng);
            setDistance(Math.round(dist));

            if (dist <= 700) {
                setStatus("Vehicle is approaching! (Within 700m)");
                // Trigger client-side alert visual if needed
            } else if (dist <= 1500) {
                setStatus("Vehicle is nearby.");
            } else {
                setStatus("Vehicle is far away.");
            }
        }
    }, [user, vehicle]);

    useEffect(() => {
        return () => {
            demoTimersRef.current.forEach(clearTimeout);
        };
    }, []);

    const handleDemoNotification = () => {
        // Demo-only frontend simulation for academic presentations.
        // This does not update vehicle data, notifications, GPS values, or MongoDB records.
        demoTimersRef.current.forEach(clearTimeout);
        setShowDemoNotification(true);
        setDemoStatus("Far");

        demoTimersRef.current = [
            setTimeout(() => setDemoStatus("Approaching"), 900),
            setTimeout(() => setDemoStatus("Nearby"), 2600),
            setTimeout(() => setShowDemoNotification(false), 5600),
            setTimeout(() => setDemoStatus(null), 7000),
        ];
    };

    if (!user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    const [userLng, userLat] = user.location?.coordinates || [77.2090, 28.6139];
    const userCoords: [number, number] = [userLat, userLng];

    const vehicleCoords: [number, number] | undefined = vehicle?.currentLocation?.coordinates
        ? [vehicle.currentLocation.coordinates[1], vehicle.currentLocation.coordinates[0]]
        : undefined;

    const displayedStatus = demoStatus ?? status;
    const isDemoActive = demoStatus !== null;
    const statusClass = isDemoActive
        ? demoStatus === "Nearby"
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
            : demoStatus === "Approaching"
                ? "bg-cyan-100 text-cyan-700 border border-cyan-200 shadow-cyan-200/70 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30"
                : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600"
        : distance !== null && distance <= 700
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-gray-100 text-gray-600 border border-gray-200";

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            <AnimatePresence>
                {showDemoNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: -24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -18, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        className="fixed top-5 right-5 z-[10000] w-[calc(100vw-2.5rem)] max-w-md overflow-hidden rounded-2xl border border-emerald-200/80 bg-white/95 shadow-2xl shadow-emerald-900/20 backdrop-blur-xl dark:border-emerald-500/30 dark:bg-gray-900/95"
                    >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />
                        <div className="relative p-5">
                            <div className="absolute right-5 top-5 h-14 w-14 animate-ping rounded-full bg-emerald-400/20" />
                            <div className="flex gap-4">
                                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                                    <Truck className="h-6 w-6" />
                                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                        <Radio className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                                            Municipality Alert
                                        </p>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-950 dark:text-white">
                                        Waste collection truck is nearby
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                        Please prepare your waste for pickup. The demo route is now simulating a nearby arrival.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                                {["Far", "Approaching", "Nearby"].map((step) => (
                                    <div
                                        key={step}
                                        className={`rounded-lg px-2 py-2 transition-all ${displayedStatus === step
                                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                            }`}
                                    >
                                        {step}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-xl hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                        <Map className="h-6 w-6" />
                        Smart Municipality
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <Home className="h-5 w-5" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'notifications' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <Bell className="h-5 w-5" />
                        Notifications
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {notifications.filter(n => !n.read).length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <User className="h-5 w-5" />
                        My Profile
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        onClick={() => {
                            localStorage.removeItem("user");
                            router.push("/Auth/login");
                        }}
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Mobile Header */}
                <header className="md:hidden bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between">
                    <h1 className="text-lg font-bold text-green-600">Smart Municipality</h1>
                    <button className="p-2"><Bell className="h-5 w-5" /></button>
                </header>

                <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-2xl shadow-lg text-white">
                        <h2 className="text-2xl font-bold">Hello, {user.username}!</h2>
                        <p className="opacity-90">Tracking services for {user.address || "your location"}.</p>
                    </div>

                    {/* Dashboard Tab */}
                    {activeTab === "dashboard" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Live Map Section */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden h-[500px] border border-gray-100 dark:border-gray-700 relative">
                                <div className="absolute top-4 right-4 z-[9999] bg-white/90 dark:bg-black/90 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-sm border border-gray-200">
                                    Live Updates
                                </div>
                                <LiveMap
                                    userLocation={userCoords}
                                    vehicleLocation={vehicleCoords}
                                    vehicleRadius={700}
                                />
                            </div>

                            {/* Status Panel */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-blue-500" />
                                            Collection Status
                                        </h3>
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                                            Live
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        {distance !== null ? (
                                            <>
                                                <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">
                                                    {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
                                                </div>
                                                <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Distance from you</p>

                                                <div className={`mt-6 px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all ${statusClass}`}>
                                                    {displayedStatus}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="animate-pulse text-gray-400">Loading vehicle data...</div>
                                        )}
                                    </div>

                                    <div className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-gray-800 dark:text-emerald-300">
                                                <Bell className={`h-5 w-5 ${isDemoActive ? "animate-bounce" : ""}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Presentation simulator</p>
                                                <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
                                                    Preview the citizen truck alert without real GPS hardware.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleDemoNotification}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/25 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                        >
                                            <Truck className="h-4 w-4" />
                                            Demo Notification
                                        </button>
                                    </div>
                                </div>

                                {/* Recent Activity / Quick Notifications */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Latest Alerts</h3>
                                    <div className="space-y-4">
                                        {notifications.length > 0 ? (
                                            notifications.slice(0, 3).map((notif) => (
                                                <div key={notif._id} className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">{notif.message}</p>
                                                        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(notif.createdAt))} ago</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 text-center py-4">No recent alerts</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === "notifications" && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold mb-6">All Notifications</h2>
                            <div className="space-y-4">
                                {notifications.map((notif) => (
                                    <div key={notif._id} className={`p-4 rounded-xl border ${notif.read ? 'bg-white border-gray-200 opacity-75' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'}`}>
                                        <div className="flex justify-between items-start">
                                            <p className="text-gray-900 dark:text-white font-medium">{notif.message}</p>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{new Date(notif.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                                {notifications.length === 0 && <div className="text-center py-10 text-gray-500">No notifications yet.</div>}
                            </div>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 max-w-2xl">
                            <h2 className="text-xl font-bold mb-6">User Profile</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                                    <p className="text-lg font-semibold">{user.username}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-lg font-semibold">{user.email}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Registered Address</label>
                                    <p className="text-lg font-semibold">{user.address || "No address set"}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Location Coordinates</label>
                                    <p className="text-sm font-mono text-gray-600 bg-gray-100 p-2 rounded">
                                        {user.location?.coordinates ? `${user.location.coordinates[1].toFixed(5)}, ${user.location.coordinates[0].toFixed(5)}` : "Not set"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
