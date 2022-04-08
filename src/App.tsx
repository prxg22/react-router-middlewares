import "./styles.css";
import { Routes, Route } from "./components";
export default function App() {
  return (
    <Routes>
      <Route middlewares={[({ next }) => {}]} path="/" element={"A"} />
      <Route path="/b" element={"B"} />
    </Routes>
  );
}
