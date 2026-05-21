"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { BusFront, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import axios from "axios";

interface RoleLoginPageProps {
    role: "admin" | "driver";
    title: string;
    subtitle: string;
    accentClass: string;
    icon: "admin" | "driver";
}

function getErrorMessage(error: unknown) {
    if (typeof error === "string") return error;
    if (error && typeof error === "object") return "Please check your login details and try again.";
    return "Login failed. Please check your credentials.";
}

export default function RoleLoginPage({ role, title, subtitle, accentClass, icon }: RoleLoginPageProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        role,
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await axios.post("/api/Auth/login", formData);
            const { user } = response.data;

            localStorage.setItem("user", JSON.stringify(user));
            router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/driver");
        } catch (err: any) {
            setError(getErrorMessage(err.response?.data?.error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
                <div className={`px-8 py-7 text-white ${accentClass}`}>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                        {icon === "admin" ? <ShieldCheck className="h-6 w-6" /> : <BusFront className="h-6 w-6" />}
                    </div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="mt-2 text-sm text-white/85">{subtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-8">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email or username
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder={role === "admin" ? "admin@ecotracker.com" : "driver@ecotracker.com"}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-gray-900"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
                    </button>

                    <div className="flex justify-between text-sm">
                        <Link href="/Auth/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                            Citizen login
                        </Link>
                        <Link href="/" className="font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400">
                            Back home
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
