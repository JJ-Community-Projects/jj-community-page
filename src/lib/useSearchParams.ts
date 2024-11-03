import {onMount} from "solid-js";


export const useSearchParams = () => {

  onMount(() => {
    window.addEventListener('popstate', function (event) {
      console.log('popstate event', event);
    });

  })

}
