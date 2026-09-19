import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import AppRoutes from "./routes";

function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}

export default App;