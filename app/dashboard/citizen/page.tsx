"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Bell, Home, User, LogOut, Map, Activity } from "lucide-react";
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

    if (!user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    const [userLng, userLat] = user.location?.coordinates || [77.2090, 28.6139];
    const userCoords: [number, number] = [userLat, userLng];

    const vehicleCoords: [number, number] | undefined = vehicle?.currentLocation?.coordinates
        ? [vehicle.currentLocation.coordinates[1], vehicle.currentLocation.coordinates[0]]
        : undefined;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
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
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-blue-500" />
                                        Collection Status
                                    </h3>

                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        {distance !== null ? (
                                            <>
                                                <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">
                                                    {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
                                                </div>
                                                <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Distance from you</p>

                                                <div className={`mt-6 px-4 py-2 rounded-lg font-medium text-sm ${distance <= 700
                                                        ? "bg-green-100 text-green-700 border border-green-200"
                                                        : "bg-gray-100 text-gray-600 border border-gray-200"
                                                    }`}>
                                                    {status}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="animate-pulse text-gray-400">Loading vehicle data...</div>
                                        )}
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
