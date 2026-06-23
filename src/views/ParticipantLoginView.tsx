import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuEye, LuEyeOff, LuLink2, LuLogIn, LuUserPlus } from 'react-icons/lu'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import {
  sanitizePersonNameInput,
  personNameContainsDigits,
  PERSON_NAME_NO_DIGITS_MESSAGE,
} from '../utils/betValidation'
import { useParticipantLoginViewModel } from '../viewmodels/useParticipantLoginViewModel'
import { APP_ROUTES } from '../routes/routePaths'
import { useParticipant } from '../hooks/useParticipant'
import type { ParticipantAuthMode } from '../services/participantAuthService'

const MODE_OPTIONS: ReadonlyArray<{
  id: ParticipantAuthMode
  label: string
  description: string
  formTitle: string
  formDescription: string
  icon: typeof LuLogIn
}> = [
  {
    id: 'login',
    label: 'Já tenho cadastro',
    description: 'Entre com e-mail e senha',
    formTitle: 'Bem-vindo de volta',
    formDescription: 'Use o e-mail e a senha da sua conta para continuar.',
    icon: LuLogIn,
  },
  {
    id: 'register',
    label: 'Criar cadastro',
    description: 'Nova conta no bolão',
    formTitle: 'Criar sua conta',
    formDescription: 'Escolha o nome que aparecerá no ranking e defina seu acesso.',
    icon: LuUserPlus,
  },
  {
    id: 'claim',
    label: 'Já palpitei',
    description: 'Vincule palpites anteriores',
    formTitle: 'Vincular palpites',
    formDescription: 'Selecione seu nome na lista e crie e-mail e senha para acessar seus palpites.',
    icon: LuLink2,
  },
]

const inputClassName =
  'w-full rounded-lg border border-slate-700/60 bg-pitch-900/60 px-4 py-2.5 text-base text-white placeholder:text-slate-600 outline-none transition focus:border-brazil-yellow/50 disabled:opacity-60'

const labelClassName = 'mb-2 block text-sm font-medium text-slate-300'

const togglePasswordButtonClassName =
  'absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-pitch-700/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60'

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoComplete?: string
  placeholder?: string
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  autoComplete,
  placeholder,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          maxLength={128}
          className={`${inputClassName} pr-11`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          disabled={disabled}
          className={togglePasswordButtonClassName}
          aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={isVisible}
        >
          {isVisible ? (
            <LuEyeOff className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          ) : (
            <LuEye className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}

export function ParticipantLoginView() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useParticipant()
  const vm = useParticipantLoginViewModel()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(vm.redirectTarget, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, vm.redirectTarget])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (vm.mode === 'login') {
      void vm.submitLogin()
      return
    }

    if (vm.mode === 'register') {
      if (personNameContainsDigits(vm.personName)) return
      void vm.submitRegister()
      return
    }

    void vm.submitClaim()
  }

  const backTo = vm.redirectTarget !== APP_ROUTES.home ? vm.redirectTarget : APP_ROUTES.home
  const activeMode = MODE_OPTIONS.find((option) => option.id === vm.mode) ?? MODE_OPTIONS[0]

  const showRegisterNameField = vm.mode === 'register'
  const showClaimNameField = vm.mode === 'claim'
  const showPasswordConfirmation = vm.mode === 'register' || vm.mode === 'claim'

  const submitLabel =
    vm.mode === 'login' ? 'Entrar' : vm.mode === 'register' ? 'Criar cadastro' : 'Vincular palpites'

  const loadingLabel =
    vm.mode === 'login'
      ? 'Entrando...'
      : vm.mode === 'register'
        ? 'Criando cadastro...'
        : 'Vinculando...'

  const loginFormDisabled = vm.mode === 'login' && vm.isLoginBlocked
  const formDisabled = vm.isSubmitting || !vm.isConfigured || loginFormDisabled

  const claimFormReady =
    !vm.isLoadingUnclaimed &&
    vm.unclaimedParticipants.length > 0 &&
    Boolean(vm.selectedPersonNameKey)

  return (
    <AppLayout>
      <PageHeader backTo={backTo} backLabel="Voltar" title="Entrar no bolão" centered />

      <div className="mx-auto w-full max-w-4xl">
        {!vm.isConfigured && (
          <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Configure <code className="text-amber-100">PARTICIPANT_SESSION_SECRET</code> (ou use{' '}
            <code className="text-amber-100">ADMIN_SESSION_SECRET</code>) nas variáveis de ambiente.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40 shadow-xl shadow-black/20">
          <div className="lg:grid lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)]">
            <aside className="border-b border-slate-700/50 bg-pitch-900/30 p-4 sm:p-5 lg:border-b-0 lg:border-r lg:p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Como deseja continuar?
              </p>

              <nav aria-label="Modo de acesso" className="flex flex-col gap-2">
                {MODE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const isActive = vm.mode === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => vm.switchMode(option.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                        isActive
                          ? 'border-brazil-yellow/50 bg-brazil-yellow/10 shadow-sm shadow-brazil-yellow/5'
                          : 'border-transparent bg-pitch-800/20 hover:border-slate-600/40 hover:bg-pitch-800/50'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          isActive
                            ? 'bg-brazil-yellow/20 text-brazil-yellow'
                            : 'bg-pitch-700/60 text-slate-400'
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-sm font-semibold ${
                            isActive ? 'text-brazil-yellow' : 'text-white'
                          }`}
                        >
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </nav>
            </aside>

            <section className="p-5 sm:p-6 lg:p-8">
              <header className="mb-6 border-b border-slate-700/40 pb-5">
                <h2 className="text-lg font-semibold text-white sm:text-xl">{activeMode.formTitle}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  {activeMode.formDescription}
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-4">
                {showRegisterNameField && (
                  <div>
                    <label htmlFor="participant-name" className={labelClassName}>
                      Nome no bolão
                    </label>
                    <input
                      id="participant-name"
                      type="text"
                      autoComplete="name"
                      value={vm.personName}
                      onChange={(event) =>
                        vm.setPersonName(sanitizePersonNameInput(event.target.value))
                      }
                      disabled={formDisabled}
                      maxLength={80}
                      className={inputClassName}
                      placeholder="Como você é conhecido no bolão"
                    />
                    {personNameContainsDigits(vm.personName) && (
                      <p className="mt-2 text-sm text-amber-300">{PERSON_NAME_NO_DIGITS_MESSAGE}</p>
                    )}
                  </div>
                )}

                {showClaimNameField && (
                  <div>
                    <label htmlFor="participant-claim-name" className={labelClassName}>
                      Seu nome no bolão
                    </label>
                    {vm.isLoadingUnclaimed ? (
                      <p className="rounded-lg border border-slate-700/60 bg-pitch-900/60 px-4 py-3 text-sm text-slate-400">
                        Carregando participantes...
                      </p>
                    ) : vm.unclaimedParticipants.length === 0 ? (
                      <div className="rounded-lg border border-slate-700/60 bg-pitch-900/60 px-4 py-3 text-sm text-slate-400">
                        Nenhum participante com palpites pendentes de cadastro.
                      </div>
                    ) : (
                      <select
                        id="participant-claim-name"
                        value={vm.selectedPersonNameKey}
                        onChange={(event) => vm.setSelectedPersonNameKey(event.target.value)}
                        disabled={formDisabled}
                        className={`${inputClassName} cursor-pointer`}
                      >
                        <option value="">Selecione seu nome</option>
                        {vm.unclaimedParticipants.map((participant) => (
                          <option key={participant.personNameKey} value={participant.personNameKey}>
                            {participant.displayName} ({participant.legacyBetCount} palpite
                            {participant.legacyBetCount === 1 ? '' : 's'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="participant-email" className={labelClassName}>
                    E-mail
                  </label>
                  <input
                    id="participant-email"
                    type="email"
                    autoComplete={vm.mode === 'login' ? 'email' : 'username'}
                    value={vm.email}
                    onChange={(event) => vm.setEmail(event.target.value)}
                    disabled={formDisabled}
                    maxLength={254}
                    className={inputClassName}
                    placeholder="seu@email.com"
                  />
                </div>

                <PasswordField
                  id="participant-password"
                  label="Senha"
                  autoComplete={vm.mode === 'login' ? 'current-password' : 'new-password'}
                  value={vm.password}
                  onChange={vm.setPassword}
                  disabled={formDisabled}
                  placeholder="Mínimo de 8 caracteres"
                />

                {showPasswordConfirmation && (
                  <PasswordField
                    id="participant-password-confirmation"
                    label="Confirmar senha"
                    autoComplete="new-password"
                    value={vm.passwordConfirmation}
                    onChange={vm.setPasswordConfirmation}
                    disabled={formDisabled}
                    placeholder="Repita a senha"
                  />
                )}

                {vm.error && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {vm.error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="gold"
                  className="w-full"
                  disabled={
                    formDisabled ||
                    !vm.email.trim() ||
                    !vm.password ||
                    (showRegisterNameField &&
                      (!vm.personName.trim() || personNameContainsDigits(vm.personName))) ||
                    (showClaimNameField && !claimFormReady) ||
                    (showPasswordConfirmation && !vm.passwordConfirmation)
                  }
                >
                  {vm.isSubmitting ? loadingLabel : submitLabel}
                </Button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
