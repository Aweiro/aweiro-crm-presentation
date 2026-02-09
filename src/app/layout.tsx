import "./globals.css"
import Header from "@/components/Header"
import type { Metadata } from "next"

export const metadata: Metadata = {
	icons: {
		icon: "/logo.png",
		shortcut: "/logo.png",
		apple: "/logo.png"
	}
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
	return (
		<html lang="uk" suppressHydrationWarning>
			<body>
				<Header />
				{children}
			</body>
		</html>
	)
}
