import type {DateTime} from "luxon";
// Stream type definition
export interface StreamType {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  start: DateTime;
  end: DateTime;
  visible: boolean;
  createdBy: number
}
