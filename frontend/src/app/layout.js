import "./globals.css";
import { Web3Provider } from "@/context/Web3Provider";

export const metadata = {
  title: "Decentralssed Time Capsule",
  description: "Preserve your digital legacy forever on the Permaweb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}