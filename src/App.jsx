import "./css/global.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AllTables from "./pages/AllTables";
import BarTable from "./pages/BarTable";
import TableT202 from "./pages/TableT202";
import TableT203 from "./pages/TableT203";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AllTables />} />
      <Route path="/tables" element={<AllTables />} />
      <Route path="/bar-table" element={<BarTable />} />
      <Route path="/table-t202" element={<TableT202 />} />
      <Route path="/table-t203" element={<TableT203 />} />
    </Routes>
  </BrowserRouter>
);

export default App;
