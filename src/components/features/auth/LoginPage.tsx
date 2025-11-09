import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'
import { Dialog } from '@kobalte/core/dialog'
import { TiltifyLoginButton } from './common/TiltifyLoginButton.tsx'

// Focused SolidJS component encapsulating the Login page layout and dialog
export const LoginPage: Component = () => {
  const [open, setOpen] = createSignal(false)

  const openDialog = () => setOpen(true)
  const acceptAndContinue = () => {
    // Proceed to OAuth endpoint
    window.location.href = '/api/auth/tiltify'
  }

  return (
    <div class="flex min-h-screen justify-center px-4 py-8">
      <div class="w-full max-w-md space-y-6">
        {/* Hero Section */}
        <div class="space-y-4 text-center">
          <h1 class="font-babas font-bold text-white ~text-2xl/4xl">Login</h1>
          <p class="font-poppins text-white/80 ~text-base/lg">
            Join the JJ community page to access more community features. Accounts are <b>not required</b> to use the JJ community page. Your fundraiser will automatically
            appear on the <a class={'underline'} href={'/fundraisers'}> community fundraiser page</a>. Accounts are only needed if you want to create your own schedule.
          </p>
        </div>

        {/* Login Card */}
        <div class="rounded-xl border-2 border-white/20 bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          {/* Community Notice */}
          <div class="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4">
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <div class="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div class="text-sm text-neutral-700">
                <p class="mb-1 font-medium">Community Project</p>
                <p class="text-neutral-600">
                  This is a community-run project, not officially affiliated
                  with Jingle Jam.
                </p>
              </div>
            </div>
          </div>

          {/* Login Button (opens dialog) */}
          <div class="space-y-4">
            <TiltifyLoginButton onClick={openDialog} />
          </div>
        </div>

        {/* Kobalte Dialog */}
        <Dialog open={open()} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />

            <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl focus:outline-none">
              <div class="mb-4 flex items-start justify-between">
                <Dialog.Title class="font-poppins font-semibold text-neutral-800 ~text-xl/2xl">
                  Community Guidelines & Account Purpose
                </Dialog.Title>
                <Dialog.CloseButton
                  aria-label="Close dialog"
                  class="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                >
                  ✕
                </Dialog.CloseButton>
              </div>

              <Dialog.Description class="sr-only">
                Review why we ask you to log in and the community guidelines
                before continuing.
              </Dialog.Description>

              <div class="max-h-[60vh] space-y-5 overflow-y-auto gap-2">
                {' '}
                <p class="rounded-md bg-primary/5 px-4 py-2 text-neutral-700">
                  This is a community run project and not associated with the
                  Jingle Jam.
                </p>
                {/* Account Purpose */}
                <section class="rounded-xl border-2 border-white/10 bg-white px-4 shadow-sm">
                  <p class="mb-2 text-neutral-600 ~text-base/xl">
                    By logging in, you agree to our community guidelines
                  </p>
                  <h3 class="mb-3 font-poppins font-semibold text-neutral-700 ~text-lg/xl">
                    Account Purpose
                  </h3>
                  <ul class="space-y-2 text-neutral-600 ~text-sm/base">
                    <li class="flex items-start gap-2">
                      <span class="mt-1 text-accent">•</span>
                      Schedule and stream management
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="mt-1 text-accent">•</span>
                      Community collaboration tools
                    </li>
                  </ul>
                </section>
                {/* Community Guidelines */}
                <section class="rounded-xl border-2 border-white/10 bg-white px-4 shadow-sm">
                  <h3 class="font-poppins font-semibold text-neutral-700 ~text-lg/xl">
                    Community Guidelines
                  </h3>
                  <div class="space-y-3 text-neutral-600 ~text-sm/base">
                    <div class="flex items-start gap-2">
                      <span class="mt-1 text-warning">•</span>
                      <div>
                        <p class="font-medium text-neutral-700">
                          Content Moderation
                        </p>
                        <p>
                          Admins may edit inappropriate content with user
                          notification
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start gap-2">
                      <span class="mt-1 text-danger">•</span>
                      <div>
                        <p class="font-medium text-neutral-700">
                          Zero Tolerance
                        </p>
                        <p>Impersonation results in immediate ban</p>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 border-t border-neutral-200">
                    <p class="text-neutral-500 ~text-xs/sm">
                      Questions? Contact{' '}
                      <span class="font-medium text-accent">@Ostof</span> on
                      Discord
                    </p>
                  </div>
                </section>
              </div>

              {/* Actions */}
              <div class="mt-6 flex items-center justify-end gap-3">
                <Dialog.CloseButton
                  type="button"
                  class="rounded-md border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </Dialog.CloseButton>
                <button
                  type="button"
                  onClick={acceptAndContinue}
                  class="rounded-md bg-primary px-4 py-2 font-medium text-white shadow-sm hover:bg-primary/90"
                >
                  Accept & Continue
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </div>
    </div>
  )
}

export default LoginPage
