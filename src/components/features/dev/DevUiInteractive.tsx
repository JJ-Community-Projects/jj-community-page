import { type Component, createSignal } from 'solid-js'
import { FaSolidCalendar, FaSolidList } from 'solid-icons/fa'
import { Section, TileGroup } from '../../ui/Tile'
import { Button } from '../../ui/Button'
import {
  Checkbox,
  Field,
  Segmented,
  SearchField,
  Switch,
  TextField,
} from '../../ui/Form'
import { ConfirmDialog, Dialog } from '../../ui/Dialog'

/** The interactive half of /dev/ui: form controls and dialogs. */
export const DevUiInteractive: Component = () => {
  const [name, setName] = createSignal('Jingle Jammer')
  const [bio, setBio] = createSignal('')
  const [url, setUrl] = createSignal('not a url')
  const [search, setSearch] = createSignal('lewis')
  const [checked, setChecked] = createSignal(true)
  const [enabled, setEnabled] = createSignal(false)
  const [view, setView] = createSignal('list')
  const [range, setRange] = createSignal('week')
  const [dialogOpen, setDialogOpen] = createSignal(false)
  const [confirmOpen, setConfirmOpen] = createSignal(false)

  return (
    <div class="flex flex-col gap-3">
      <Section title="Form controls">
        <div class="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Display name"
            description="Shown on your profile."
            value={name()}
            onChange={setName}
          />
          <TextField
            label="Website"
            type="url"
            value={url()}
            onChange={setUrl}
            error="Enter a full URL, starting with https://"
          />
          <TextField
            label="Bio"
            multiline
            placeholder="A few words about your stream"
            value={bio()}
            onChange={setBio}
            class="sm:col-span-2"
          />
          <Field label="Search" description="SearchField with a clear button.">
            <SearchField
              label="Search creators"
              value={search()}
              onInput={setSearch}
            />
          </Field>
          <Field label="Search (loading)">
            <SearchField
              label="Search creators"
              value={search()}
              onInput={setSearch}
              loading
            />
          </Field>
        </div>
      </Section>

      <Section title="Checkbox, switch, segmented">
        <div class="flex flex-col gap-3">
          <TileGroup class="flex flex-col gap-3">
            <Checkbox
              label="Show my schedule on the community page"
              description="Other users can find you by name."
              checked={checked()}
              onChange={setChecked}
            />
            <Checkbox label="Disabled" disabled />
            <Switch
              label="Email me about friend requests"
              description="At most once a day."
              checked={enabled()}
              onChange={setEnabled}
            />
          </TileGroup>
          <div class="flex flex-wrap items-center gap-3">
            <Segmented
              label="View"
              value={view()}
              onChange={setView}
              options={[
                {
                  value: 'list',
                  label: 'List',
                  icon: <FaSolidList class="size-3" />,
                },
                {
                  value: 'calendar',
                  label: 'Calendar',
                  icon: <FaSolidCalendar class="size-3" />,
                },
              ]}
            />
            <Segmented
              label="Range"
              size="sm"
              value={range()}
              onChange={setRange}
              options={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'event', label: 'Event' },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="Dialogs">
        <div class="flex flex-wrap gap-2">
          <Button variant="accent" onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Delete schedule…
          </Button>
        </div>
        <Dialog
          open={dialogOpen()}
          onOpenChange={setDialogOpen}
          title="Edit stream"
          description="Dialog with header, body and footer."
          footer={
            <>
              <Button size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setDialogOpen(false)}
              >
                Save
              </Button>
            </>
          }
        >
          <div class="flex flex-col gap-3">
            <TextField label="Title" value={name()} onChange={setName} />
            <TextField
              label="Description"
              multiline
              value={bio()}
              onChange={setBio}
            />
          </div>
        </Dialog>
        <ConfirmDialog
          open={confirmOpen()}
          onOpenChange={setConfirmOpen}
          title="Delete schedule?"
          text="The schedule and its 12 streams are removed. This can't be undone."
          confirmLabel="Delete"
          onConfirm={() => setConfirmOpen(false)}
        />
      </Section>
    </div>
  )
}
