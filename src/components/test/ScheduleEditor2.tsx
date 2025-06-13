import {type Component, createEffect, createSignal, Index} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {EditorProvider2, useEditor2} from "./EditorProvider2.tsx";


// Top-level editor component.
export const ScheduleEditor2: Component<{id: string}> = (props) => {
  return (
    <EditorProvider2 id={props.id}>
      <div>
        <h1>Schedule Editor 2</h1>
        <ScheduleMetaEditor2/>
        <StreamList2/>
      </div>
    </EditorProvider2>
  );
};

// Component for editing Schedule meta properties.
export const ScheduleMetaEditor2: Component = () => {
  const {schedule, updateScheduleTitle, updateScheduleYear} = useEditor2();
  const [title, setTitle] = createSignal<string>(schedule?.schedule.title ?? '')
  const [year, setYear] = createSignal<string>(`${schedule?.schedule.year}`)

  createEffect(() => {
    console.log('ScheduleMetaEditor', 'createEffect', schedule)
    if (schedule) {
      setTitle(schedule.schedule.title);
      setYear(`${schedule.schedule.year}`);
    }
  });

  const debouncedUpdateTitle = debounce((newTitle: string) => {
    console.log('Update title', newTitle, title())
    updateScheduleTitle(newTitle);
  }, 250);

  const debouncedUpdateYear = debounce((newYear: number) => {
    updateScheduleYear(newYear);
  }, 250);
  // When schedule updates, update local values.
  return (
    <div style={{'margin-bottom': "1rem"}}>
      <h2>Schedule Meta</h2>
      <div>
        <label>
          Title:
          <input
            type="text"
            value={title()}
            onInput={(e) => {
              const newValue = e.currentTarget.value;
              setTitle(newValue);
              debouncedUpdateTitle(newValue);
            }}
          />
        </label>
      </div>
      <div>
        <label>
          Year:
          <input
            type="number"
            value={year()}
            onInput={(e) => {
              const newValue = e.currentTarget.value;
              setYear(newValue);
              const parsedYear = parseInt(newValue, 10);
              if (!isNaN(parsedYear)) {
                debouncedUpdateYear(parsedYear);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
};

// Component to list streams with an "Add Stream" form and individual StreamEditor components.
export const StreamList2: Component = () => {
  const {schedule} = useEditor2();

  return (
    <div>
      <h2>Streams</h2>
      <AddStreamForm/>
      <p>{schedule.streams.length}</p>
      <Index each={schedule?.streams || []}>
        {(stream, index) => (
          <>
            <p>{stream().title}</p>
            <StreamEditor id={'' + index} stream={stream()}/>
          </>
        )}
      </Index>
    </div>
  );
};

// Component for adding a new stream.
const AddStreamForm: Component = () => {
  const {addStream} = useEditor2();
  const [title, setTitle] = createSignal("");
  const [subtitle, setSubtitle] = createSignal("");
  const [start, setStart] = createSignal("");
  const [end, setEnd] = createSignal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    // Convert start and end to Dates.
    const stream = {
      title: title(),
      subtitle: subtitle(),
      start: new Date(start()),
      end: new Date(end()),
      version: 1, // version can be provided but hook will handle default
    };
    addStream(stream);
    // Clear fields
    setTitle("");
    setSubtitle("");
    setStart("");
    setEnd("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Stream</h3>
      <div>
        <label>
          Title:
          <input type="text" value={title()} onInput={(e) => setTitle(e.currentTarget.value)} required/>
        </label>
      </div>
      <div>
        <label>
          Subtitle:
          <input type="text" value={subtitle()} onInput={(e) => setSubtitle(e.currentTarget.value)} required/>
        </label>
      </div>
      <div>
        <label>
          Start (ISO date):
          <input type="datetime-local" value={start()} onInput={(e) => setStart(e.currentTarget.value)} required/>
        </label>
      </div>
      <div>
        <label>
          End (ISO date):
          <input type="datetime-local" value={end()} onInput={(e) => setEnd(e.currentTarget.value)} required/>
        </label>
      </div>
      <button type="submit">Add Stream</button>
    </form>
  );
};

// Component for editing an individual stream.
interface StreamEditorProps {
  id: string;
  stream: any;
}

export const StreamEditor: Component<StreamEditorProps> = (props) => {
  const {
    updateStreamTitle,
    updateStreamSubtitle,
    updateStreamStart,
    updateStreamEnd,
    deleteStream,
  } = useEditor2();

  const [title, setTitle] = createSignal(props.stream.title);
  const [subtitle, setSubtitle] = createSignal(props.stream.subtitle);
  const [start, setStart] = createSignal(props.stream.start.toISOString().slice(0, 16));
  const [end, setEnd] = createSignal(props.stream.end.toISOString().slice(0, 16));

  // Synchronize local signals with props.stream changes
  createEffect(() => {
    setTitle(props.stream.title);
    setSubtitle(props.stream.subtitle);
    setStart(props.stream.start.toISOString().slice(0, 16));
    setEnd(props.stream.end.toISOString().slice(0, 16));
  });

  // Debounced update functions
  const debouncedUpdateTitle = debounce((newTitle: string) => {
    updateStreamTitle(props.id, newTitle);
  }, 250); // 2-second debounce

  const debouncedUpdateSubtitle = debounce((newSubtitle: string) => {
    updateStreamSubtitle(props.id, newSubtitle);
  }, 250); // 2-second debounce

  const debouncedUpdateStart = debounce((newStart: Date) => {
    updateStreamStart(props.id, newStart);
  }, 250); // 2-second debounce

  const debouncedUpdateEnd = debounce((newEnd: Date) => {
    updateStreamEnd(props.id, newEnd);
  }, 250); // 2-second debounce

  return (
    <div style={{border: "1px solid #ccc", margin: "0.5rem 0", padding: "0.5rem"}}>
      <h3>Stream {props.id + 1}</h3>
      <div>
        <label>
          Title:
          <input
            type="text"
            value={title()}
            onInput={(e) => {
              e.preventDefault()
              const newValue = e.currentTarget.value;
              setTitle(newValue);
              debouncedUpdateTitle(newValue);
            }}
          />
        </label>
      </div>
      <div>
        <label>
          Subtitle:
          <input
            type="text"
            value={subtitle()}
            onInput={(e) => {
              e.preventDefault()
              const newValue = e.currentTarget.value;
              setSubtitle(newValue);
              debouncedUpdateSubtitle(newValue);
            }}
          />
        </label>
      </div>
      <div>
        <label>
          Start:
          <input
            type="datetime-local"
            value={start()}
            onInput={(e) => {
              const newValue = e.currentTarget.value;
              setStart(newValue);
              const parsedDate = new Date(newValue);
              if (!isNaN(parsedDate.getTime())) {
                debouncedUpdateStart(parsedDate);
              }
            }}
          />
        </label>
      </div>
      <div>
        <label>
          End:
          <input
            type="datetime-local"
            value={end()}
            onInput={(e) => {
              const newValue = e.currentTarget.value;
              setEnd(newValue);
              const parsedDate = new Date(newValue);
              if (!isNaN(parsedDate.getTime())) {
                debouncedUpdateEnd(parsedDate);
              }
            }}
          />
        </label>
      </div>
      <button onClick={() => deleteStream(props.id)}>Delete Stream</button>
    </div>
  );
};
