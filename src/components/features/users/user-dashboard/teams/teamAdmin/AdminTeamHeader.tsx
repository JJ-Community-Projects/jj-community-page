import { type Component, Show } from 'solid-js'
import { useAdminTeamDetail } from './AdminTeamDetailsProvider.tsx'
import { createModalSignal } from '../../../../../../lib/createModalSignal.ts'
import { ConfirmDialog } from '../../../../../ui/Dialog'
import { Tile } from '../../../../../ui/Tile'
import { Button } from '../../../../../ui/Button'
import { Alert } from '../../../../../ui/Status'
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidTrash,
} from 'solid-icons/fa'

/** Team name, public URL and the delete action. */
export const AdminTeamHeader: Component = () => {
  const { team, deleteTeam, deleteTeamMutation } = useAdminTeamDetail()

  const showDeleteDialog = createModalSignal()

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam()
      showDeleteDialog.close()
      window.location.href = `/dashboard/teams`
    } catch (error) {
      // Shown by the mutation state
      console.error('Error deleting team:', error)
    }
  }

  return (
    <>
      <Tile class="flex flex-col gap-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="text-base font-semibold">Team Management</h3>
            <Show when={team.data}>
              {(data) => (
                <a
                  class="text-accent-700 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                  href={`/teams/${data().slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  jinglejam.ostof.dev/teams/{data().slug}
                  <FaSolidArrowUpRightFromSquare
                    class="size-3"
                    aria-hidden="true"
                  />
                </a>
              )}
            </Show>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={showDeleteDialog.open}
            disabled={deleteTeamMutation.isPending}
            aria-label="Delete team"
          >
            <FaSolidTrash class="size-3" aria-hidden="true" />
            {deleteTeamMutation.isPending ? 'Deleting...' : 'Delete Team'}
          </Button>
        </div>
        <Alert tone="info">
          Manage your team details, members and invites here. Settings are
          saved when you click Save Changes.
        </Alert>
      </Tile>

      <ConfirmDialog
        open={showDeleteDialog.isOpen()}
        onOpenChange={showDeleteDialog.setOpen}
        title="Delete Team"
        text="Are you sure you want to delete this team? This action cannot be undone."
        pending={deleteTeamMutation.isPending}
        onConfirm={handleDeleteTeam}
      />
    </>
  )
}
