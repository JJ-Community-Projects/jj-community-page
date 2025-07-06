import {type Component, createResource, Match, Suspense, Switch} from "solid-js";
import {actions} from "astro:actions";
import {useUser} from "../../components/features/users/user-dashboard/providers/UserProvider.tsx";

export const UserDODebug: Component = () => {

  const {local} = useUser()
  const [data] = createResource(() => {
    return actions.users.getTables()
  })
  return (
    <>

      <Suspense fallback={<div>Error...</div>}>
        <Switch>
          <Match when={data.error}>
            <pre>{JSON.stringify(data.error)}</pre>
          </Match>
          <Match when={data()}>
            <pre class={'text-white'}>{JSON.stringify(data(), null, 2)}</pre>
          </Match>
        </Switch>
      </Suspense>
      <p>Local:</p>
      <pre class={'text-white'}>{JSON.stringify(local, null, 2)}</pre>
    </>
  )
}
