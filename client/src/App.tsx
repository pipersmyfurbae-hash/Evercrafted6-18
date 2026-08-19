import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Admin from "./pages/Admin";
import AppHome from "./pages/AppHome";
import ClientLanding from "./pages/ClientLanding";
import EvercraftedPages from "./pages/EvercraftedPages";
import Home from "./pages/Home";
import Invite from "./pages/Invite";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import Personal from "./pages/Personal";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import Product from "./pages/Product";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import Studio from "./pages/Studio";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/product"><Redirect to="/client/capabilities" /></Route>
      <Route path="/pricing"><Redirect to="/client/access" /></Route>
      <Route path="/collections" component={EvercraftedPages} />
      <Route path="/collections/material-studies" component={EvercraftedPages} />
      <Route path="/journal" component={EvercraftedPages} />
      <Route path="/journal/the-patience-of-material" component={EvercraftedPages} />
      <Route path="/about" component={EvercraftedPages} />
      <Route path="/contact" component={EvercraftedPages} />
      <Route path="/account" component={EvercraftedPages} />
      <Route path="/sign-in" component={EvercraftedPages} />
      <Route path="/privacy" component={EvercraftedPages} />
      <Route path="/terms" component={EvercraftedPages} />
      <Route path="/client" component={ClientLanding} />
      <Route path="/client/how-it-works" component={ClientLanding} />
      <Route path="/client/outcomes" component={ClientLanding} />
      <Route path="/client/capabilities" component={ClientLanding} />
      <Route path="/client/access" component={ClientLanding} />
      <Route path="/client/sign-in" component={ClientLanding} />
      <Route path="/app" component={AppHome} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:projectId" component={ProjectDetail} />
      <Route path="/search" component={Search} />
      <Route path="/studio" component={Studio} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/settings" component={Settings} />
      <Route path="/me" component={Personal} />
      <Route path="/personal" component={Personal} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route path="/invite/:token" component={Invite} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
