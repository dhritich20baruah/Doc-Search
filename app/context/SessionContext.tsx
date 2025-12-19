// "use client";

// import {
//   createContext,
//   useContext,
//   useState,
//   ReactNode
// } from "react";

// interface SessionContextType {
//   session: any;
//   setSession: (session: any) => void;
// }

// const SessionContext = createContext<SessionContextType | undefined>(undefined);

// export function SessionProvider({ children }: { children: ReactNode }) {
//   const [session, setSession] = useState<any>(null);

//   return (
//     <SessionContext.Provider value={{ session, setSession }}>
//       {children}
//     </SessionContext.Provider>
//   );
// }

// export function useSession() {
//   const context = useContext(SessionContext);

//   if (!context) {
//     throw new Error("useSession must be used inside SessionProvider");
//   }

//   return context;
// }

// export default SessionContext;
