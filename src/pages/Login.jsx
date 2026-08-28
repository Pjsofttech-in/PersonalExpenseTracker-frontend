import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import bgImage from "../assets/ee.jpg";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const login = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            alert("Please enter email and password");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post(
                "/pjsofttech_welcome/login",
                {
                    email,
                    password,
                }
            );

            console.log("LOGIN RESPONSE:", response.data);

            localStorage.setItem("token", response.data);

            navigate("/dashboard");
        } catch (error) {
            console.error("Login error:", error);

            alert(
                error.response?.data?.message ||
                "Login Failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = () => {
        navigate("/register");
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">

            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage:
                        `url(${bgImage})`,
                }}
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Login Card */}
            <Card className="relative z-10 w-[calc(100%-2rem)] max-w-md border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl">

                <CardHeader className="space-y-2 text-center">

                    <CardTitle className="text-3xl font-bold tracking-tight">
                        Expense Tracker
                    </CardTitle>

                    <CardDescription>
                        Sign in to manage your expenses and
                        transactions
                    </CardDescription>

                </CardHeader>

                <CardContent>

                    <form
                        onSubmit={login}
                        className="space-y-5"
                    >

                        {/* Email */}
                        <div className="space-y-2">

                            <Label htmlFor="email">
                                Email
                            </Label>

                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                autoComplete="email"
                            />

                        </div>

                        {/* Password */}
                        <div className="space-y-2">

                            <Label htmlFor="password">
                                Password
                            </Label>

                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                autoComplete="current-password"
                            />

                        </div>

                        {/* Login */}
                        <Button
                            type="submit"
                            className="w-full border- hover:bg-gray-400 "
                            disabled={loading}
                        >
                            {loading
                                ? "Signing in..."
                                : "Login"}
                        </Button>

                        {/* Register */}
                        <Button
                            type="button"
                            // variant="outline"
                            className="w-full  hover:text-lg underline"
                            onClick={handleRegister}
                        >
                            New User? Register
                        </Button>

                    </form>

                </CardContent>
            </Card>
        </div>
    );
}
