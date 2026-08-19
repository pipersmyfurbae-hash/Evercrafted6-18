/** What the app shell hands every tool page. */
export interface PageProps {
  /** True once an API key is stored; pages surface a warning until it is. */
  hasKey: boolean;
  onOpenSettings: () => void;
}
