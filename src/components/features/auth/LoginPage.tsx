import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'
import { TiltifyIcon } from '../../common/icons/JJIcons'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { PageHeader } from '../../ui/PageHeader'
import { Alert } from '../../ui/Status'
import { Tile } from '../../ui/Tile'

const LOGIN_URL = '/api/auth/tiltify'

// The login page body: intro, the Tiltify button, and the guidelines dialog it opens first
export const LoginPage: Component = () => {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="mx-auto flex w-full max-w-md flex-col gap-3">
      <PageHeader
        title="Login"
        subtitle={
          <>
            Join the JJ community page to access more community features.
            Accounts are <b>not required</b> to use the JJ community page. Your
            fundraiser will automatically appear on the{' '}
            <a class="text-on-canvas underline" href="/community">
              community fundraiser page
            </a>
            . Accounts are only needed if you want to create your own schedule.
          </>
        }
      />

      <Tile class="flex flex-col gap-3">
        <Alert title="Community project">
          This is a community-run project, not officially affiliated with Jingle
          Jam.
        </Alert>
        {/* The href is the no-JS fallback; with JS the guidelines come first */}
        <Button
          href={LOGIN_URL}
          brand="tiltify"
          class="w-full gap-2 py-3"
          onClick={(event: MouseEvent) => {
            event.preventDefault()
            setOpen(true)
          }}
        >
          <TiltifyIcon class="size-5" />
          Login with Tiltify
        </Button>
      </Tile>

      <Dialog
        open={open()}
        onOpenChange={setOpen}
        title="Community guidelines"
        description="By logging in, you agree to the community guidelines."
        footer={
          <>
            <Button size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => (window.location.href = LOGIN_URL)}
            >
              Accept & Continue
            </Button>
          </>
        }
      >
        <div class="flex flex-col gap-4 text-sm">
          <p class="text-fg-muted">
            This is a community run project and not associated with the Jingle
            Jam.
          </p>
          <section class="flex flex-col gap-1">
            <h3 class="font-semibold">Account purpose</h3>
            <ul class="text-fg-muted list-disc pl-5">
              <li>Schedule and stream management</li>
              <li>Community collaboration tools</li>
            </ul>
          </section>
          <section class="flex flex-col gap-1">
            <h3 class="font-semibold">Community guidelines</h3>
            <ul class="text-fg-muted list-disc space-y-1 pl-5">
              <li>
                <b class="text-fg">Content moderation:</b> admins may edit
                inappropriate content with user notification.
              </li>
              <li>
                <b class="text-fg">Zero tolerance:</b> impersonation results in
                an immediate ban.
              </li>
            </ul>
          </section>
          <p class="text-fg-muted text-xs">
            Questions? Contact <b class="text-fg">@Ostof</b> on Discord.
          </p>
        </div>
      </Dialog>
    </div>
  )
}

export default LoginPage
