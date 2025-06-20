import {type Component, createResource, createSignal, For, Match, Switch} from "solid-js";
import { actions } from 'astro:actions';


export const AccountsList: Component = () => {


  const [data, r] = createResource( async () => {
    const {data, error} = await  actions.auth.getAccounts()
    if (error) {
      return []
    }
    return data
  })


  return (
    <Switch fallback={<p>Loading</p>}>
      <Match when={data.loading}>
        <p>Loading</p>
      </Match>
      <Match when={data.error}>
        <p>Error</p>
      </Match>
      <Match when={data.latest}>
        <For each={data.latest!}>
          {
            (account) => {
              return <div>
                <p>{account.provider}</p>
                <p>{JSON.stringify(account, null, 2)}</p>
              </div>
            }
          }
        </For>
      </Match>
    </Switch>
  );
}
