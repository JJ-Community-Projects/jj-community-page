import {type Component, createEffect} from "solid-js";
import {useWebsocket} from "../lib/useWebsocket.ts";
import {useParty} from "../lib/useParty.ts";


interface WSProps {
}

export const WS: Component<WSProps> = (props) => {
  const {data} = useWebsocket('/api/ws')
  const {doc, provider} = useParty('test')
  const dec = async () => fetch('api/decrement')
  const inc = async () => fetch('api/increment')

  createEffect(() => {
    console.log("Last message: ", data.lastMessage?.data);
  })

  return (
    <div>
      <h1>WebSocket</h1>
      <div>
        <h2>Last Message</h2>
        <p>{data.lastMessage?.data}</p>
      </div>
      <button onClick={inc}>Inc</button>
      <button onClick={dec}>Dec</button>
    </div>
  );
}
