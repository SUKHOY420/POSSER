import { usePOS, POSProvider } from './store';
import ScreenSelect from './components/ScreenSelect';
import MainScreen from './components/MainScreen';
import KitchenScreen from './components/KitchenScreen';
import ServerScreen from './components/ServerScreen';
import CloseSession from './components/CloseSession';
import HardwareSetup from './components/HardwareSetup';
import { NotificationSystem } from './components/Notifications';
import { SyncIndicator } from './components/SyncIndicator';

function AppContent() {
  const { state } = usePOS();

  return (
    <>
      {state.screen !== 'select' && <NotificationSystem />}
      {state.screen !== 'select' && <SyncIndicator />}
      
      {state.screen === 'select' && <ScreenSelect />}
      {state.screen === 'main' && <MainScreen />}
      {state.screen === 'kitchen' && <KitchenScreen />}
      {state.screen === 'server' && <ServerScreen />}
      {state.screen === 'close' && <CloseSession />}
      {state.screen === 'hardware' && <HardwareSetup />}
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
