"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AdminUser = {
    id: string;
    username: string;
    email: string;
    createdAt: string;
};

type AuthContextType = {
    user: AdminUser | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<any>;
    register: (credentials: any) => Promise<any>;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { toast } = useToast();

    const { data: user, isLoading } = useQuery<AdminUser | null>({
        queryKey: ["/api/admin/me"],
        queryFn: getQueryFn({ on401: "returnNull" }),
    });

    const useLoginMutation = () =>
        useMutation({
            mutationFn: async (credentials: any) => {
                const res = await apiRequest("POST", "/api/admin/login", credentials);
                return await res.json();
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
                router.push("/admin");
            },
            onError: (error: Error) => {
                toast({
                    title: "Login failed",
                    description: error.message,
                    variant: "destructive",
                });
            },
        });

    const useRegisterMutation = () =>
        useMutation({
            mutationFn: async (credentials: any) => {
                const res = await apiRequest("POST", "/api/admin/register", credentials);
                return await res.json();
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
                router.push("/admin");
            },
            onError: (error: Error) => {
                toast({
                    title: "Registration failed",
                    description: error.message,
                    variant: "destructive",
                });
            },
        });

    const useLogoutMutation = () =>
        useMutation({
            mutationFn: async () => {
                await apiRequest("POST", "/api/admin/logout");
            },
            onSuccess: () => {
                queryClient.setQueryData(["/api/admin/me"], null);
                router.push("/admin/login");
            },
            onError: (error: Error) => {
                toast({
                    title: "Logout failed",
                    description: error.message,
                    variant: "destructive",
                });
            },
        });

    const { mutateAsync: login } = useLoginMutation();
    const { mutateAsync: register } = useRegisterMutation();
    const { mutateAsync: logout } = useLogoutMutation();

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
