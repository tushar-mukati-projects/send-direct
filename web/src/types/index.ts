export type TransferView =
  | "home"
  | "send-select"
  | "send-share"
  | "recv-enter"
  | "recv-connecting"
  | "recv-incoming"
  | "transfer"
  | "done";

export type TransferMode = "send" | "receive";

export interface SelectedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export interface ManifestFile {
  id: string;
  name: string;
  size: number;
}
