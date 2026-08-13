// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
import { RequireAuth, RedirectIfAuthed } from "@/routes/Guards";
import { AppLayout } from "@/layouts/AppLayout";
import Home from "@/pages/Home";
import Activity from "@/pages/Activity";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Otp from "@/pages/auth/Otp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

export default function App() {
    const { isLoading } = useAuth();
    if (isLoading) return <SplashScreen />;

    return (
        <Routes>
            <Route element={<RedirectIfAuthed />}>
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/otp" element={<Otp />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
            </Route>

            <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/activity" element={<Activity />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}