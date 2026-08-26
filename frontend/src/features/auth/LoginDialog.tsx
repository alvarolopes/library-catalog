import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { Dialog } from '@/shared/components/Dialog'
import { Field } from '@/shared/components/Field'
import { useSession } from './session'

// Mirrors the API's own rules so an obviously empty form never costs a round trip.
// The server still validates independently — this is usability, not a boundary.
const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginDialog({ onClose }: { onClose: () => void }) {
  const { signIn } = useSession()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    setSubmitError(null)

    try {
      await signIn(values.email, values.password)
      onClose()
    } catch (error) {
      // 401 is the expected failure and deserves the server's own wording;
      // anything else is genuinely unexpected and says so.
      setSubmitError(
        error instanceof ApiError && error.status === 401
          ? error.message
          : 'Could not sign in. Please try again.',
      )
    }
  }

  return (
    <Dialog
      title="Sign in"
      description="Browsing the catalog is public. Signing in is only needed to change it."
      labelledBy="login-title"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="username"
            autoFocus
            {...register('email')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </Field>

        {submitError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
