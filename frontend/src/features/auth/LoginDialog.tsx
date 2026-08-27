import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { Dialog } from '@/shared/components/Dialog'
import { Field } from '@/shared/components/Field'
import { useSession } from './session-context'
import { Button } from '@/shared/components/Button'
import { TextInput } from '@/shared/components/FormControls'
import { Alert } from '@/shared/components/Feedback'

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
      isBusy={isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Email" error={errors.email?.message}>
          <TextInput
            type="email"
            autoComplete="username"
            autoFocus
            {...register('email')}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <TextInput
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
        </Field>

        {submitError && (
          <Alert>
            {submitError}
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            onClick={onClose}
            tone="ghost"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
