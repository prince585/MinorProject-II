"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
    Loader2,
    MapPin,
    User,
    Mail,
    Lock,
    Phone,
    Search,
    CheckCircle,
} from "lucide-react";
import axios from "axios";
import { z } from "zod";
import { registerSchema } from "../../lib/validations";

// Dynamically import MapPicker
const MapPicker = dynamic(() => import("../../components/MapPicker"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center animate-pulse">
            <MapPin className="h-8 w-8 text-gray-400 animate-bounce" />
        </div>
    ),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<RegisterFormData>({
        username: "",
        email: "",
        password: "",
        role: "citizen",
        phoneNumber: "",
        address: "",
        location: undefined,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);

    // Handle Input Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Special handling for phoneNumber to allow only digits and limit length
        if (name === 'phoneNumber') {
            const onlyDigits = value.replace(/\D/g, ''); // Remove non-digit characters
            if (onlyDigits.length > 10) return; // Stop if more than 10 digits
            setFormData({ ...formData, [name]: onlyDigits });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        setError("");
    };

    // Handle Search Input Change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Nominatim Search (Forward Geocoding)
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            );

            if (response.data && response.data.length > 0) {
                const place = response.data[0];
                const lat = parseFloat(place.lat);
                const lng = parseFloat(place.lon);
                const address = place.display_name;

                updateLocation(lat, lng, address);
            } else {
                setError("Location not found. Please try a different query.");
            }
        } catch (err) {
            console.error("Search failed", err);
            setError("Failed to search location.");
        } finally {
            setIsSearching(false);
        }
    };

    // Nominatim Reverse Geocoding (Map Click)
    const handleLocationSelect = async (lat: number, lng: number) => {
        // Optimistically update map position immediately
        setMapPosition([lat, lng]);

        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );

            if (response.data) {
                const address = response.data.display_name;
                updateLocation(lat, lng, address);
            }
        } catch (err) {
            console.error("Reverse geocoding failed", err);
            // Still update coordinates even if address fails
            updateLocation(lat, lng, "Selected Location");
        }
    };

    const updateLocation = (lat: number, lng: number, address: string) => {
        setMapPosition([lat, lng]);
        setFormData((prev) => ({
            ...prev,
            address: address,
            location: {
                type: "Point",
                coordinates: [lng, lat], // GeoJSON [lng, lat]
            },
        }));
        // Update search box to match selected address if needed, or keep query?
        // Let's keep query as is or update it? Updating it makes sense for feedback.
        // But address from Nominatim is very long.
        // Let's NOT update searchQuery to avoid confusion, or update it to the address?
        // setSearchQuery(address); // Optional
    };

    // Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validation
        const validation = registerSchema.safeParse(formData);
        if (!validation.success) {
            setError(validation.error.issues[0].message);
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post("/api/Auth/register", formData);
            if (response.status === 201) {
                router.push("/Auth/login"); // Redirect to login on success
            }
        } catch (err: any) {
            setError(
                err.response?.data?.error || "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden z-10 border border-gray-100 dark:border-gray-700 font-sans"
            >
                <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-900">
                    <h2 className="text-3xl font-bold text-white tracking-wide">
                        Create Account
                    </h2>
                    <p className="text-blue-100 mt-2 text-sm">
                        Join us to make a sustainable impact.
                    </p>
                </div>

                <div className="p-8">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        name="username"
                                        type="text"
                                        required
                                        className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 transition-shadow"
                                        placeholder="johndoe"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 transition-shadow"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 transition-shadow"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        name="phoneNumber"
                                        type="text" // Keep as text to avoid "e" and "+" characters allowed in type="number"
                                        required
                                        maxLength={10} // Strictly prevents typing more than 10 characters
                                        pattern="\d{10}" // Useful for HTML5 form validation on submit
                                        className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 transition-shadow"
                                        placeholder="Enter 10 digit number"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address & Map Section */}
                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Address & Location <span className="text-gray-400 font-normal">(Search or click on map)</span>
                            </label>

                            <div className="space-y-3">
                                {/* Search Bar */}
                                <div className="relative flex space-x-2">
                                    <div className="relative flex-grow">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                            placeholder="Search city, street, or place..."
                                            className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleSearch()}
                                        disabled={isSearching}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm font-medium transition-colors"
                                    >
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                                    </button>
                                </div>

                                {/* Map Container */}
                                <div className="h-[300px] w-full rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-600 relative z-0">
                                    <MapPicker
                                        position={mapPosition}
                                        onLocationSelect={handleLocationSelect}
                                    />
                                </div>
                            </div>

                            {/* Selected Address Display */}
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                    Selected Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-4 w-4 text-green-500" />
                                    </div>
                                    <input
                                        name="address"
                                        type="text"
                                        required
                                        readOnly
                                        className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 cursor-not-allowed opacity-80"
                                        placeholder="Address will appear here..."
                                        value={formData.address || ""}
                                    />
                                    {formData.address && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800 animate-shake">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                            {error}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{" "}
                            <Link href="/Auth/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
