'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/constants/routes';

const connexionSchema = z.object({
  email: z.string().min(1, "L'email est requis").email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type ConnexionFormValues = z.infer<typeof connexionSchema>;

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionForm />
    </Suspense>
  );
}

function ConnexionForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConnexionFormValues>({
    resolver: zodResolver(connexionSchema),
  });

  const searchParams = useSearchParams();

  const onSubmit = async (data: ConnexionFormValues) => {
    setFormError('');
    try {
      await login(data.email, data.password);
      const user = useAuthStore.getState().user;
      const redirect = searchParams.get('redirect');
      const defaultRoute = user?.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD;
      router.push(redirect || defaultRoute);
    } catch {
      setFormError('Identifiants incorrects. Veuillez réessayer.');
    }
  };

  return (
    <>
      <h1 className="text-xl font-semibold text-stone-900 text-center mb-1.5">Bon retour !</h1>
      <p className="text-sm text-stone-500 text-center mb-7">
        Connectez-vous pour accéder à votre espace
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div className="bg-error-50 text-error-700 text-sm px-3.5 py-2.5 rounded-md border border-error-200">
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-800 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              placeholder="votre@email.com"
              className={`w-full h-10 pl-9 pr-3 border rounded-md text-sm outline-none transition-colors ${
                errors.email
                  ? 'border-error-400 focus:ring-1 focus:ring-error-500'
                  : 'border-stone-300 focus:ring-1 focus:ring-stone-900 focus:border-stone-900'
              }`}
            />
          </div>
          {errors.email && <p className="text-xs text-error-600 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-stone-800 mb-1.5">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              placeholder="••••••••"
              className={`w-full h-10 pl-9 pr-10 border rounded-md text-sm outline-none transition-colors ${
                errors.password
                  ? 'border-error-400 focus:ring-1 focus:ring-error-500'
                  : 'border-stone-300 focus:ring-1 focus:ring-stone-900 focus:border-stone-900'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-error-600 mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-end">
          <Link href={ROUTES.MOT_DE_PASSE_OUBLIE} className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium rounded-md text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-stone-600">
          Pas de compte ?{' '}
          <Link href={ROUTES.INSCRIPTION} className="text-stone-900 font-medium hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>

      <div className="mt-5 pt-5 border-t border-stone-200">
        <p className="text-xs text-stone-400 text-center leading-relaxed">
          Démo : <span className="font-medium text-stone-500">admin@test.com</span>,{' '}
          <span className="font-medium text-stone-500">artisan@test.com</span>, ou{' '}
          <span className="font-medium text-stone-500">citoyen@test.com</span>
        </p>
      </div>
    </>
  );
}
