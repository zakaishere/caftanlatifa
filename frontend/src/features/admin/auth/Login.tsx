"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "./authContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useTranslation } from "@/i18n/provider";


export default function AdminLogin() {
    const { t, locale } = useTranslation();
    const { login, user, isLoading } = useAuth();
    const router = useRouter();

    const loginSchema = useMemo(() => z.object({
        email: z.string().email(t('admin.login.validation.email')),
        password: z.string().min(6, t('admin.login.validation.password')),
    }), [t]);

    useEffect(() => {
        if (user && !isLoading) {
            router.push(`/${locale}/admin`);
        }
    }, [user, isLoading, router, locale]);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        try {
            await login(values);
        } catch {
            // Error is already handled by the mutation's onError toast
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">{t('admin.login.title')}</CardTitle>
                    <CardDescription className="text-center">
                        {t('admin.login.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.login.email')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="admin@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.login.password')}</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? t('admin.login.loggingIn') : t('admin.login.loginBtn')}
                            </Button>
                        </form>
                    </Form>

                </CardContent>
            </Card>
        </div>
    );
}
