import { Route, Routes } from "react-router-dom";
import Invitasjon from "./pages/Invitasjon";
import PlanLayout from "./pages/plan/PlanLayout";
import Dashboard from "./pages/plan/Dashboard";
import Masterplan from "./pages/plan/Masterplan";
import Budsjett from "./pages/plan/Budsjett";
import Gjesteliste from "./pages/plan/Gjesteliste";
import Bordplassering from "./pages/plan/Bordplassering";
import Tidslinje from "./pages/plan/Tidslinje";
import Kjoreplan from "./pages/plan/Kjoreplan";
import Modul from "./pages/plan/Modul";
import Svar from "./pages/plan/Svar";
import OnskelisteAdmin from "./pages/plan/OnskelisteAdmin";
import Innstillinger from "./pages/plan/Innstillinger";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Invitasjon />} />
      <Route path="/plan" element={<PlanLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="masterplan" element={<Masterplan />} />
        <Route path="budsjett" element={<Budsjett />} />
        <Route path="gjester" element={<Gjesteliste />} />
        <Route path="bord" element={<Bordplassering />} />
        <Route path="tidslinje" element={<Tidslinje />} />
        <Route path="kjoreplan" element={<Kjoreplan />} />
        <Route path="modul/:modulKey" element={<Modul />} />
        <Route path="svar" element={<Svar />} />
        <Route path="onskeliste" element={<OnskelisteAdmin />} />
        <Route path="innstillinger" element={<Innstillinger />} />
      </Route>
    </Routes>
  );
}
