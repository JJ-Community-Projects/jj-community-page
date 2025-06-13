import {onCleanup, onMount} from "solid-js";
import {createStore} from "solid-js/store";

type UseWebsocket = {
  lastMessage: MessageEvent | undefined;
  messages: MessageEvent[];
}

export const useWebsocket = (path: string) => {
  const url = new URL(path, window.location.origin);
  const ws = new WebSocket(url.href);

  const [store, setStore] = createStore<UseWebsocket>({
    lastMessage: undefined,
    messages: []
  })


  onMount(() => {
    ws.onopen = () => {
      console.log("WebSocket connection opened");
      sendMessage('data')
    };

    ws.onmessage = (event) => {
      console.log("Message from server: ", event.data);
      setStore("lastMessage", event);
      setStore("messages", (messages) => [...messages, event]);
    };
  })

  onCleanup(() => {
    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
  })

  const sendMessage = (message: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    } else {
      console.error("WebSocket is not open. Unable to send message.");
    }
  }


  return {data: store, sendMessage}
}
