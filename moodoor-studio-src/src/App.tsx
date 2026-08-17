import { useCallback, useEffect, useState } from 'react';
import BriefGenerator from './pages/BriefGenerator';
import PromptLibrary from './pages/PromptLibrary';
import InventoryPage from './pages/Inventory';
import SettingsDialog from './components/SettingsDialog';
import { getApiKey, migrateStorage, setApiKey } from './lib/storage';
import './styles/tokens.css';
import './styles/app.css';

// Runs before the first render, so no page can read a record written by an
// engine version that no longer exists.
const wiped = migrateStorage();

/**
 * The composer is a pipeline step in its own right, so it gets its own URL —
 * otherwise the "2 · Compose" link in the top bar would have nowhere to point.
 */
type Route = { page: 'inventory' | 'brief' | 'library'; view: 'library' | 'composer' };

function routeFromHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'inventory') return { page: 'inventory', view: 'library' };
  if (hash === 'prompt-library/compose') return { page: 'library', view: 'composer' };
  if (hash === 'prompt-library') return { page: 'library', view: 'library' };
  return { page: 'brief', view: 'library' };
}

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [apiKey, setKey] = useState(getApiKey);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // An empty library the user didn't empty needs an explanation, once.
  const [notice, setNotice] = useState(wiped);
  /**
   * Bumped on every nav event, including a click on the step you are already
   * on — that's how "3 · Prompts" gets you out of a prompt's detail view and
   * back to the grid even though the URL never changes.
   */
  const [navTick, setNavTick] = useState(0);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(false), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash());
      setNavTick((n) => n + 1);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);

  const saveKey = useCallback((key: string) => {
    setApiKey(key);
    setKey(key);
    setSettingsOpen(false);
  }, []);

  const pageProps = { hasKey: !!apiKey, onOpenSettings: openSettings };

  return (
    <div className="app">
      {route.page === 'library' ? (
        <PromptLibrary {...pageProps} navView={route.view} navTick={navTick} />
      ) : route.page === 'inventory' ? (
        <InventoryPage {...pageProps} />
      ) : (
        <BriefGenerator {...pageProps} />
      )}

      {notice && (
        <div className="toast notice" onClick={() => setNotice(false)}>
          Updated to the six-angle camera engine — earlier recipes and prompts were cleared, since
          they described a shot this build no longer makes.
        </div>
      )}

      <SettingsDialog
        open={settingsOpen}
        initialKey={apiKey}
        onSave={saveKey}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
