import { POSProvider, usePOS } from './store';
import ScreenSelect from './components/ScreenSelect';
import ServerScreen from './components/ServerScreen';
import MainScreen from './components/MainScreen';
import KitchenScreen from './components/KitchenScreen';
import AdminPanel from './components/AdminPanel';

function AppContent() {
  const { state } = usePOS();

  return (
    <>
      {state.screen === 'select' && <ScreenSelect />}
      {state.screen === 'server' && <ServerScreen />}
      {state.screen === 'main' && <MainScreen />}
      {state.screen === 'kitchen' && <KitchenScreen />}
      {state.screen === 'admin' && <AdminPanel />}
    </>
  );
}

export default function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}
