"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, LogIn, Lock, Smartphone, User } from "lucide-react"; // Import necessary icons, smartphone for phone
import axios from "axios";
import { z } from "zod";
import { loginSchema } from "../../lib/validations";

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<LoginFormData>({
        username: "",
        phoneNumber: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Client-side validation using Zod
        const validation = loginSchema.safeParse(formData);
        if (!validation.success) {
            setError(validation.error.issues[0].message);
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post("/api/Auth/login", formData);
            if (response.status === 200) {
                const { user } = response.data;
                // Store user info in localStorage for persistence
                localStorage.setItem("user", JSON.stringify(user));

                // Role-based redirection
                if (user.role === "admin") {
                    router.push("/dashboard/admin");
                } else if (user.role === "driver") {
                    router.push("/dashboard/driver");
                } else {
                    router.push("/dashboard/citizen");
                }
            }
        } catch (err: any) {
            setError(
                err.response?.data?.error || "Invalid credentials. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl z-10 relative border border-gray-100 dark:border-gray-700"
            >
                <div>
                    <div className="mx-auto h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <LogIn className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Sign in to your account
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="sr-only">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all duration-200"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Phone Number Field */}
                        <div>
                            <label htmlFor="phoneNumber" className="sr-only">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Smartphone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="text"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all duration-200"
                                    placeholder="Phone Number"
                                    value={formData.phoneNumber || ""}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all duration-200"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
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
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            Don't have an account?
                        </span>
                        <Link
                            href="/Auth/register"
                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            Register now
                        </Link>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm">
                        <Link href="/admin/login" className="font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400">
                            Admin login
                        </Link>
                        <Link href="/driver/login" className="font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400">
                            Driver login
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
