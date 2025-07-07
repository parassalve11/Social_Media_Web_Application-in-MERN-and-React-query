import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


export default function ReactQueryProvider({ children }) {
 
  const [client] = useState(new QueryClient());

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
