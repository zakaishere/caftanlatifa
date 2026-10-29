"use client";

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/authContext';
import { useTranslation } from '@/i18n/provider';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function AccountSettings() {
  const { user } = useAuth();
  const { locale } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const labels = locale === 'ar' ? {
    title: 'حساب المسؤول', description: 'تغيير البريد الإلكتروني وكلمة المرور لتسجيل الدخول.',
    email: 'البريد الإلكتروني', current: 'كلمة المرور الحالية', next: 'كلمة المرور الجديدة (12 حرفًا على الأقل)',
    confirm: 'تأكيد كلمة المرور الجديدة', save: 'حفظ الحساب', saving: 'جارٍ الحفظ...',
    success: 'تم تحديث الحساب', error: 'تعذر تحديث الحساب', mismatch: 'كلمتا المرور غير متطابقتين',
  } : {
    title: 'Compte administrateur', description: 'Modifiez votre adresse e-mail et votre mot de passe de connexion.',
    email: 'Adresse e-mail', current: 'Mot de passe actuel', next: 'Nouveau mot de passe (12 caractères minimum)',
    confirm: 'Confirmer le nouveau mot de passe', save: 'Enregistrer le compte', saving: 'Enregistrement...',
    success: 'Compte mis à jour', error: 'Impossible de modifier le compte', mismatch: 'Les mots de passe ne correspondent pas',
  };

  useEffect(() => { if (user) setEmail(user.email); }, [user]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmation) throw new Error(labels.mismatch);
      const response = await apiRequest('PATCH', '/api/admin/me', {
        email, currentPassword, ...(newPassword && { newPassword }),
      });
      return response.json();
    },
    onSuccess: (admin) => {
      queryClient.setQueryData(['/api/admin/me'], admin);
      setCurrentPassword(''); setNewPassword(''); setConfirmation('');
      toast({ title: labels.success });
    },
    onError: (error: Error) => toast({ title: labels.error, description: error.message, variant: 'destructive' }),
  });

  return <Card>
    <CardHeader><CardTitle>{labels.title}</CardTitle><CardDescription>{labels.description}</CardDescription></CardHeader>
    <CardContent>
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); mutation.mutate(); }}>
        <div className="grid gap-2">
          <Label htmlFor="account-email">{labels.email}</Label>
          <Input id="account-email" type="email" autoComplete="username" dir="ltr" required value={email} onChange={event => setEmail(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="account-current-password">{labels.current}</Label>
          <Input id="account-current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="account-new-password">{labels.next}</Label>
          <Input id="account-new-password" type="password" autoComplete="new-password" minLength={12} maxLength={72} value={newPassword} onChange={event => setNewPassword(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="account-confirm-password">{labels.confirm}</Label>
          <Input id="account-confirm-password" type="password" autoComplete="new-password" required={!!newPassword} value={confirmation} onChange={event => setConfirmation(event.target.value)} />
        </div>
        <Button type="submit" disabled={mutation.isPending || !user}>{mutation.isPending ? labels.saving : labels.save}</Button>
      </form>
    </CardContent>
  </Card>;
}
